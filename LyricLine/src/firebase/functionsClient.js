import { auth } from "./config";

// Deployed Cloud Functions live at this base URL for the lyricline-4c29d
// project's default region. Update if you deploy to a different region.
const FUNCTIONS_BASE = "https://us-central1-lyricline-4c29d.cloudfunctions.net";

async function authedFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();
  const resp = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`);
  return data;
}

export async function searchYouTube(query) {
  const data = await authedFetch(`youtubeSearch?q=${encodeURIComponent(query)}`);
  return data.results || [];
}

export async function autoAlignLyrics(audioURL, lines) {
  const data = await authedFetch("alignLyrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioURL, lines }),
  });
  return data.timestamps || [];
}
