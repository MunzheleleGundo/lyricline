const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const SPOTIFY_CLIENT_ID = defineSecret("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = defineSecret("SPOTIFY_CLIENT_SECRET");
const ASSEMBLYAI_API_KEY = defineSecret("ASSEMBLYAI_API_KEY");

// Requires the caller to be a signed-in LyricLine user — these calls cost
// real money per request, so anonymous/public access is not allowed.
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

// ---------- Spotify catalog search (Client Credentials flow) ----------
// No user login needed — this authenticates as the APP itself, which is
// enough to search Spotify's public catalog for title/artist/cover art.
let cachedToken = null; // { value, expiresAt }

async function getSpotifyToken(clientId, clientSecret) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`Spotify token request failed: ${resp.status}`);
  const data = await resp.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

exports.spotifySearch = onRequest(
  { secrets: [SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET], cors: true },
  withCors(async (req, res) => {
    try {
      await requireAuth(req);
      const q = (req.query.q || "").toString().trim();
      if (!q) return res.status(400).json({ error: "Missing ?q= search text." });

      const token = await getSpotifyToken(SPOTIFY_CLIENT_ID.value(), SPOTIFY_CLIENT_SECRET.value());
      const searchResp = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=6`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!searchResp.ok) throw new Error(`Spotify search failed: ${searchResp.status}`);
      const data = await searchResp.json();

      const results = (data.tracks?.items || []).map((t) => ({
        spotifyId: t.id,
        title: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        album: t.album?.name || "",
        coverURL: t.album?.images?.[0]?.url || null,
        releaseDate: t.album?.release_date || null,
      }));

      res.json({ results });
    } catch (err) {
      logger.error("spotifySearch failed", err);
      res.status(err.status || 500).json({ error: err.message || "Search failed." });
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
    body: JSON.stringify({ audio_url: audioURL }),
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
function alignLinesToWords(lines, words) {
  const transcriptTokens = words.map((w) => normalizeWord(w.text));
  let cursor = 0;
  const rawTimestamps = lines.map(() => null);

  lines.forEach((line, lineIdx) => {
    const firstWord = normalizeWord((line.split(/\s+/)[0] || ""));
    if (!firstWord) return;
    const searchLimit = Math.min(transcriptTokens.length, cursor + 400);
    for (let i = cursor; i < searchLimit; i++) {
      if (transcriptTokens[i] === firstWord) {
        rawTimestamps[lineIdx] = words[i].start / 1000;
        cursor = i + 1;
        return;
      }
    }
    // fuzzy fallback: allow a short edit-distance match nearby
    for (let i = cursor; i < searchLimit; i++) {
      if (Math.abs(transcriptTokens[i].length - firstWord.length) <= 1 && transcriptTokens[i][0] === firstWord[0]) {
        rawTimestamps[lineIdx] = words[i].start / 1000;
        cursor = i + 1;
        return;
      }
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
