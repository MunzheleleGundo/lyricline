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

// AssemblyAI's Universal model transcribes ~99 languages, but that list is
// still finite — plenty of real languages aren't on it. When the audio is
// in a language AssemblyAI doesn't support, language_detection doesn't
// fail; it just picks whatever supported language sounds closest and
// transcribes invented words in THAT language. The result looks like a
// normal transcript (so nothing here throws), but every word in it is
// wrong, which is why alignment can look "off" no matter how good the
// matching logic is. This is the current (mid-2026) supported set for
// pre-recorded transcription — check AssemblyAI's docs if it's been
// expanded since.
const ASSEMBLYAI_SUPPORTED_LANGUAGES = new Set([
  "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "tr", "uk", "ca",
  "id", "ja", "ar", "az", "bg", "bs", "zh", "cs", "da", "el", "et", "fi",
  "tl", "gl", "hi", "hr", "hu", "ko", "mk", "ms", "no", "ro", "sk", "sv",
  "th", "ur", "vi",
]);

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
    if (data.status === "completed") {
      return {
        words: data.words || [],
        languageCode: data.language_code || null,
        languageConfidence: typeof data.language_confidence === "number" ? data.language_confidence : null,
        supported: ASSEMBLYAI_SUPPORTED_LANGUAGES.has((data.language_code || "").split("_")[0]),
      };
    }
    if (data.status === "error") throw new Error(`Transcription error: ${data.error}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Transcription timed out.");
}

// Greedy forward alignment: for each lyric line, find the earliest matching
// transcript span (searching forward from the last match) for the lyric
// line's opening words. Lines whose opening words can't be confidently
// matched fall back to interpolating between their nearest matched
// neighbors, so every line still gets a reasonable timestamp.
//
// This is deliberately conservative: an earlier version also accepted a
// "fuzzy" match on any nearby word with the same first letter and similar
// length. That fired constantly on poor transcripts (e.g. non-English
// lyrics AssemblyAI mistranscribes) and produced a run of confidently-wrong
// timestamps all clustered within a second or two of each other — worse
// than just admitting the line couldn't be matched. Only exact word matches
// are trusted now; anything else is left null and smoothed by interpolation.
//
// Matching on the first word ALONE isn't enough: repetitive lyrics (a
// repeated chorus, or just common short words like "u"/"o"/"ene" recurring
// throughout a song) mean the first word alone matches dozens of unrelated
// spots in the transcript. Confirming that a line's first two-to-three
// words appear together, in order, is what actually identifies "this is
// really where that line starts" — a single stray word match doesn't get
// trusted, so it can't send the cursor jumping to the wrong minute of the
// song and dragging every later line's search along with it.
const MIN_LINE_GAP_SEC = 0.35; // real lyric lines are essentially never this close together
const CONFIRM_WORDS = 3; // how many of a line's leading words must match in sequence

function alignLinesToWords(lines, words) {
  const transcriptTokens = words.map((w) => normalizeWord(w.text));
  let cursor = 0;
  let lastAcceptedTime = -Infinity;
  const rawTimestamps = lines.map(() => null);

  lines.forEach((line, lineIdx) => {
    const lineWords = line.split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!lineWords.length) return;
    const needed = lineWords.slice(0, Math.min(CONFIRM_WORDS, lineWords.length));

    const searchLimit = Math.min(transcriptTokens.length, cursor + 250);
    for (let i = cursor; i < searchLimit; i++) {
      if (transcriptTokens[i] !== needed[0]) continue;

      // Confirm the following words line up too — a lone matching word,
      // especially a short/common one, isn't enough to trust.
      let confirmed = true;
      for (let k = 1; k < needed.length; k++) {
        if (transcriptTokens[i + k] !== needed[k]) { confirmed = false; break; }
      }
      // If the line is too short to give us CONFIRM_WORDS to check, at
      // least require the single word not be a very common short token —
      // those are exactly the ones that produce false positives.
      if (needed.length < CONFIRM_WORDS && needed[0].length <= 2) confirmed = false;
      if (!confirmed) continue;

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

  const matchedCount = rawTimestamps.filter((t) => t !== null).length;

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
  return { timestamps: filled, matchedCount, totalLines: lines.length };
}

// Groups a flat word-timestamp list into draft lyric lines by listening for
// pauses — a gap between words longer than a real singer would leave
// mid-phrase almost always means a line (or at least a breath) ended.
// This is a draft, not a claim of ground truth: the point is to save the
// person from typing the whole song, not to replace their judgment. They
// review and fix it afterward, same as the auto-sync timestamps.
const LINE_BREAK_GAP_SEC = 0.55;
const MAX_WORDS_PER_LINE = 12; // long silence-free runs still get soft-broken so lines stay readable

function groupWordsIntoLines(words) {
  const lines = [];
  let current = [];

  words.forEach((w, i) => {
    const prev = words[i - 1];
    const gap = prev ? w.start / 1000 - prev.end / 1000 : 0;
    const forcedBreak = current.length >= MAX_WORDS_PER_LINE;
    if (current.length && (gap >= LINE_BREAK_GAP_SEC || forcedBreak)) {
      lines.push(current.map((t) => t.text).join(" "));
      current = [];
    }
    current.push(w);
  });
  if (current.length) lines.push(current.map((t) => t.text).join(" "));

  return lines.filter(Boolean);
}

exports.transcribeLyrics = onRequest(
  { secrets: [ASSEMBLYAI_API_KEY], timeoutSeconds: 300, cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const { audioURL } = req.body || {};
      if (!audioURL) return res.status(400).json({ error: "Body must include audioURL." });

      const { words, languageCode, supported } = await transcribeWithTimestamps(audioURL, ASSEMBLYAI_API_KEY.value());
      if (!words.length) throw new Error("Transcription returned no words — the audio may be silent or unreadable.");

      const lines = groupWordsIntoLines(words);

      // Same honesty as alignLyrics: say plainly when the transcript is
      // likely wrong-language guesswork rather than real lyrics, so a
      // person doesn't publish a track full of invented words.
      const warning = !supported
        ? `The vocals may be in a language our transcription engine doesn't support` +
          (languageCode ? ` (it detected "${languageCode}", but likely guessed)` : "") +
          `. This draft is probably not your real lyrics — expect to rewrite most of it, or type them in by hand instead.`
        : null;

      res.json({ lines, languageCode, warning });
    } catch (err) {
      logger.error("transcribeLyrics failed", err);
      res.status(err.status || 500).json({ error: err.message || "Auto-write failed." });
    }
  })
);

exports.alignLyrics = onRequest(
  { secrets: [ASSEMBLYAI_API_KEY], timeoutSeconds: 300, cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const { audioURL, lines } = req.body || {};
      if (!audioURL || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: "Body must include audioURL and a non-empty lines array." });
      }

      const { words, languageCode, languageConfidence, supported } =
        await transcribeWithTimestamps(audioURL, ASSEMBLYAI_API_KEY.value());
      if (!words.length) throw new Error("Transcription returned no words — the audio may be silent or unreadable.");

      const { timestamps, matchedCount, totalLines } = alignLinesToWords(lines, words);
      const matchedFraction = totalLines ? matchedCount / totalLines : 0;

      // Tell the frontend plainly when auto-sync's input was likely garbage,
      // instead of returning confidently-wrong timestamps with no signal
      // that anything was off. Two independent smells: AssemblyAI detected
      // a language it doesn't actually support (so it transcribed the
      // closest supported language instead), or very few lines could be
      // confidently matched at all (garbage transcript either way).
      let warning = null;
      if (!supported) {
        warning = `The vocals may be in a language our transcription engine doesn't support` +
          (languageCode ? ` (it detected "${languageCode}", but likely guessed — that's not one of its supported languages)` : "") +
          `. Auto-sync is transcribing something, but it's probably not your actual lyrics. Manual tap-to-sync will be more reliable for this track.`;
      } else if (matchedFraction < 0.5) {
        warning = `Only ${matchedCount} of ${totalLines} lines could be confidently matched to the audio — the rest were estimated by interpolation and may be off. Worth reviewing (or re-tapping) those by hand.`;
      }

      res.json({ timestamps, wordCount: words.length, languageCode, matchedCount, totalLines, warning });
    } catch (err) {
      logger.error("alignLyrics failed", err);
      res.status(err.status || 500).json({ error: err.message || "Auto-sync failed." });
    }
  })
);
