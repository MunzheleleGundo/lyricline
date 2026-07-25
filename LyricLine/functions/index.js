const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const YOUTUBE_API_KEY = defineSecret("YOUTUBE_API_KEY");
const ASSEMBLYAI_API_KEY = defineSecret("ASSEMBLYAI_API_KEY");

// Requires the caller to be a signed-in LyricLine user — these calls cost
// real money/quota per request, so anonymous/public access is not allowed.
async function requireAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    const err = new Error("Missing Authorization: Bearer <idToken> header.");
    err.status = 401;
    throw err;
  }
  return admin.auth().verifyIdToken(token);
}

function withCors(handler) {
  return (req, res) => cors(req, res, () => handler(req, res));
}

// ---------- YouTube metadata search ----------
// Free tier (no billing needed for normal usage, ~10k quota units/day).
// This is video metadata, not authoritative music metadata: "artist" is
// really the channel name, which is often but not always the actual artist.
// Labeled honestly in the UI rather than presented as verified song data.
exports.youtubeSearch = onRequest(
  { secrets: [YOUTUBE_API_KEY], cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const q = (req.query.q || "").toString().trim();
      if (!q) return res.status(400).json({ error: "Missing ?q= search text." });

      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY.value()}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`YouTube search failed: ${resp.status} ${body}`);
      }
      const data = await resp.json();

      const results = (data.items || []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        coverURL: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
        publishedAt: item.snippet.publishedAt,
      }));

      res.json({ results });
    } catch (err) {
      logger.error("youtubeSearch failed", err);
      res.status(err.status || 500).json({ error: err.message || "Search failed." });
    }
  })
);

// ---------- List videos from the artist's own linked channel ----------
// Resolves the channel's "uploads" playlist once, then lists videos from it.
// Used instead of youtubeSearch once an artist has linked a channel, so
// they pick from their own catalog instead of re-searching their name
// every time they publish a track.
exports.youtubeChannelVideos = onRequest(
  { secrets: [YOUTUBE_API_KEY], cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const channelId = (req.query.channelId || "").toString().trim();
      if (!channelId) return res.status(400).json({ error: "Missing ?channelId=." });

      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY.value()}`;
      const channelResp = await fetch(channelUrl);
      if (!channelResp.ok) throw new Error(`Channel lookup failed: ${channelResp.status}`);
      const channelData = await channelResp.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) return res.status(404).json({ error: "Couldn't find that channel — double check the channel ID." });

      const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(uploadsPlaylistId)}&key=${YOUTUBE_API_KEY.value()}`;
      const itemsResp = await fetch(itemsUrl);
      if (!itemsResp.ok) throw new Error(`Channel videos lookup failed: ${itemsResp.status}`);
      const itemsData = await itemsResp.json();

      const candidates = (itemsData.items || []).filter((item) => item.snippet?.resourceId?.videoId);

      // No category filtering here — same as the plain youtubeSearch
      // endpoint, which shows everything including releases. An earlier
      // version tried to filter to YouTube's "Music" category to approximate
      // the channel's Releases tab, but plenty of artists' uploads (or their
      // distributor's) aren't tagged that way, so it just hid real releases.
      const results = candidates.map((item) => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        coverURL: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
        publishedAt: item.snippet.publishedAt,
      }));

      return res.json({ results });
    } catch (err) {
      logger.error("youtubeChannelVideos failed", err);
      res.status(err.status || 500).json({ error: err.message || "Couldn't load channel videos." });
    }
  })
);

// ---------- Resolve a pasted channel URL/handle to a channel ID ----------
// Accepts a raw channel ID (UC...), a /channel/UC... URL, or an @handle
// URL/handle, and returns the canonical channelId + channel title so the
// signup form can confirm the right channel before saving it.
exports.youtubeResolveChannel = onRequest(
  { secrets: [YOUTUBE_API_KEY], cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const raw = (req.query.input || "").toString().trim();
      if (!raw) return res.status(400).json({ error: "Missing ?input=." });

      let channelId = null;
      const ucMatch = raw.match(/UC[a-zA-Z0-9_-]{20,}/);
      if (ucMatch) {
        channelId = ucMatch[0];
      } else {
        const handleMatch = raw.match(/@[\w.-]+/);
        const handle = handleMatch ? handleMatch[0] : (raw.startsWith("@") ? raw : `@${raw.replace(/^https?:\/\/\S+\//, "")}`);
        const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY.value()}`;
        const handleResp = await fetch(handleUrl);
        const handleData = await handleResp.json();
        channelId = handleData.items?.[0]?.id || null;
      }
      if (!channelId) return res.status(404).json({ error: "Couldn't find a channel for that link/handle." });

      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY.value()}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const channel = data.items?.[0];
      if (!channel) return res.status(404).json({ error: "Couldn't find a channel with that ID." });

      res.json({ channelId, title: channel.snippet.title, thumbnailURL: channel.snippet.thumbnails?.default?.url || null });
    } catch (err) {
      logger.error("youtubeResolveChannel failed", err);
      res.status(err.status || 500).json({ error: err.message || "Couldn't resolve that channel." });
    }
  })
);

// ---------- Lyric auto-align (AssemblyAI word timestamps + text matching) ----------
// Given a public audio URL and the artist's own typed lyric lines, this
// transcribes the audio with word-level timestamps, then aligns the
// transcript to the KNOWN lyric text to produce a start time per line.
// It does not invent lyrics — the artist's typed lines are always what
// gets published; this only estimates *when* each one starts.

function normalizeWord(w) {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "");
}

async function transcribeWithTimestamps(audioURL, apiKey) {
  const startResp = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: { authorization: apiKey, "content-type": "application/json" },
    // language_detection: without this AssemblyAI assumes English, which
    // produces a near-garbage transcript (and therefore garbage alignment)
    // for anything sung in another language.
    body: JSON.stringify({ audio_url: audioURL, language_detection: true }),
  });
  if (!startResp.ok) throw new Error(`AssemblyAI submit failed: ${startResp.status}`);
  const { id } = await startResp.json();

  const deadline = Date.now() + 4 * 60 * 1000; // 4 min budget for a Cloud Function call
  while (Date.now() < deadline) {
    const pollResp = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: apiKey },
    });
    const data = await pollResp.json();
    if (data.status === "completed") return data.words || [];
    if (data.status === "error") throw new Error(`Transcription error: ${data.error}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Transcription timed out.");
}

// Greedy forward alignment: for each lyric line, find the earliest matching
// transcript word (searching forward from the last match) for the FIRST
// word of that line. Lines whose first word can't be confidently matched
// fall back to interpolating between their nearest matched neighbors, so
// every line still gets a reasonable timestamp.
//
// This is deliberately conservative: an earlier version also accepted a
// "fuzzy" match on any nearby word with the same first letter and similar
// length. That fired constantly on poor transcripts (e.g. non-English
// lyrics AssemblyAI mistranscribes) and produced a run of confidently-wrong
// timestamps all clustered within a second or two of each other — worse
// than just admitting the line couldn't be matched. Only exact word matches
// are trusted now; anything else is left null and smoothed by interpolation.
const MIN_LINE_GAP_SEC = 0.35; // real lyric lines are essentially never this close together

function alignLinesToWords(lines, words) {
  const transcriptTokens = words.map((w) => normalizeWord(w.text));
  let cursor = 0;
  let lastAcceptedTime = -Infinity;
  const rawTimestamps = lines.map(() => null);

  lines.forEach((line, lineIdx) => {
    const firstWord = normalizeWord((line.split(/\s+/)[0] || ""));
    if (!firstWord) return;
    const searchLimit = Math.min(transcriptTokens.length, cursor + 250);
    for (let i = cursor; i < searchLimit; i++) {
      if (transcriptTokens[i] !== firstWord) continue;
      const candidateTime = words[i].start / 1000;
      // A match that lands suspiciously close to the previous accepted
      // line is more likely the aligner grabbing a stray nearby word than
      // a real, distinct line starting — skip it and let interpolation
      // handle this line instead of trusting a probably-wrong timestamp.
      if (candidateTime - lastAcceptedTime < MIN_LINE_GAP_SEC) continue;
      rawTimestamps[lineIdx] = candidateTime;
      lastAcceptedTime = candidateTime;
      cursor = i + 1;
      return;
    }
  });

  // Fill unmatched lines by interpolating between the nearest matched
  // neighbors so the output is always a complete, monotonic timestamp array.
  const filled = [...rawTimestamps];
  for (let i = 0; i < filled.length; i++) {
    if (filled[i] !== null) continue;
    let prevIdx = i - 1;
    while (prevIdx >= 0 && filled[prevIdx] === null) prevIdx--;
    let nextIdx = i + 1;
    while (nextIdx < filled.length && filled[nextIdx] === null) nextIdx++;
    const prevVal = prevIdx >= 0 ? filled[prevIdx] : 0;
    const nextVal = nextIdx < filled.length ? filled[nextIdx] : prevVal + (i - prevIdx) * 3;
    const span = nextIdx - prevIdx;
    filled[i] = +(prevVal + ((nextVal - prevVal) * (i - prevIdx)) / span).toFixed(2);
  }
  return filled;
}

exports.alignLyrics = onRequest(
  { secrets: [ASSEMBLYAI_API_KEY], timeoutSeconds: 300, cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const { audioURL, lines } = req.body || {};
      if (!audioURL || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: "Body must include audioURL and a non-empty lines array." });
      }

      const words = await transcribeWithTimestamps(audioURL, ASSEMBLYAI_API_KEY.value());
      if (!words.length) throw new Error("Transcription returned no words — the audio may be silent or unreadable.");

      const timestamps = alignLinesToWords(lines, words);
      res.json({ timestamps, wordCount: words.length });
    } catch (err) {
      logger.error("alignLyrics failed", err);
      res.status(err.status || 500).json({ error: err.message || "Auto-sync failed." });
    }
  })
);
