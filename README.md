# LyricLine

A self-publish, synced-lyrics platform. Artists upload a track, type out the
lyrics, sync them to the audio, and publish — listeners get a karaoke-style
player with real-time highlighted lines.

This is a working prototype backed by real Firebase infrastructure — not a
static mockup. Auth, the catalog, likes, and file storage are all live.

---

## Stack

- **React 19 + Vite** — frontend
- **Firebase Auth** — email/password sign-up & sign-in
- **Firestore** — track catalog, likes, user profiles (realtime)
- **Firebase Storage** — audio files & cover art
- **Firebase Cloud Functions** — server-side proxy for third-party API keys
  (YouTube metadata search, AssemblyAI lyric auto-align)
- **Firebase Hosting** — deployment

---

## Features

| Feature | Status | Notes |
|---|---|---|
| Sign up / sign in | ✅ Real | Firebase Auth, email + password |
| Publish a track | ✅ Real | Uploads audio + cover to Storage, writes to Firestore |
| Tap-to-sync lyrics | ✅ Real | Manual timing, with playback speed control, undo, and per-line nudging |
| Auto-sync lyrics | ✅ Real (beta) | Transcribes audio via AssemblyAI, aligns to your typed lyrics. Best-effort — review before publishing |
| Fill metadata from YouTube | ✅ Real | Title/channel/thumbnail via YouTube Data API — **not** verified music data, double-check before publishing |
| Likes | ✅ Real | Per-user, transactional, live count |
| View counts | ✅ Real | Increments each time a track is opened in the player |
| Artist dashboard | ✅ Real | Computed from actual views/likes on your own tracks |
| Lyric video studio | ✅ Real | Renders 3 templates to canvas, exports an actual downloadable `.webm` |
| Discover / Community / Pricing / Features / About | 🟡 UI only | Static/sample data — sketches of future product direction |
| AI tools (generator, translator, etc.) | 🟡 UI only | Interface previews, not wired to a model |
| Distribution to Spotify/Apple Music | ❌ Not built | Not possible without becoming/partnering with an approved music distributor — a business relationship, not an API integration |
| Real login to Spotify/Apple/YouTube Music (import a *listener's* library) | ❌ Not built | Different from the metadata search above — would need OAuth per platform |
| Payments | ❌ Not built | Pricing page is UI only, no billing wired up |

---

## Project structure

```
LyricLine/
├── src/
│   ├── App.jsx                  # Main app: auth, upload, sync, player, home
│   ├── theme/tokens.js          # Design system: colors, type, shared component styles
│   ├── firebase/
│   │   ├── config.js            # Firebase project config
│   │   ├── authService.js       # Sign up / sign in / sign out
│   │   ├── tracksService.js     # Firestore: create/watch tracks, likes, views
│   │   ├── storageService.js    # File uploads
│   │   └── functionsClient.js   # Calls to Cloud Functions (YouTube search, auto-align)
│   └── pages/                   # Discover, AI Tools, Pricing, Dashboard, etc.
├── functions/
│   └── index.js                 # Cloud Functions: youtubeSearch, alignLyrics
├── firestore.rules              # Firestore security rules
├── storage.rules                # Storage security rules
├── cors.json                    # CORS config for Storage bucket (cover art / canvas capture)
└── firebase.json                # Firebase project config (hosting, functions, rules)
```

---

## Setup

### 1. Install dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Firebase project

This project is wired to a specific Firebase project (`lyricline-4c29d`) in
`src/firebase/config.js`. If you're forking this for your own project,
replace that config with your own from the Firebase console.

In the [Firebase console](https://console.firebase.google.com):
- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → create (test mode is fine to start)
- **Storage** → create (test mode is fine to start)

### 3. Storage CORS (required for cover art + lyric video export)

```bash
gsutil cors set cors.json gs://<your-bucket>.firebasestorage.app
```

If you don't have `gsutil` installed locally, use
[Google Cloud Shell](https://console.cloud.google.com) in the browser instead.

### 4. Cloud Function secrets

Two optional integrations need API keys, set as Cloud Functions secrets
(never stored in the code):

```bash
firebase functions:secrets:set YOUTUBE_API_KEY   # console.cloud.google.com → enable "YouTube Data API v3" → Credentials → API key
firebase functions:secrets:set ASSEMBLYAI_API_KEY  # assemblyai.com → free signup → dashboard
```

The app works fine without these — you just won't have the "Fill from
YouTube" or "Auto-sync" buttons functioning until they're set.

### 5. Deploy

```bash
firebase use --add          # pick your Firebase project, once
npm run build
firebase deploy
```

### 6. Local development

```bash
npm run dev
```

---

## Security rules

`firestore.rules` and `storage.rules` are written to be genuinely restrictive
(not the wide-open Firebase test-mode defaults):

- Anyone can **read** the catalog and profiles (public app)
- Only a signed-in user can **write**, and only as themselves
- A track can only be edited/deleted by its original publisher
- Other users can only touch a track's `likesCount` / `viewsCount` fields —
  everything else on someone else's track is locked

Deploy rule changes with:
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## Known limitations (by design, not bugs)

- **Auto-sync accuracy**: forced alignment on sung vocals is not as reliable
  as on spoken word — review and nudge lines after running it, don't assume
  it's perfect.
- **YouTube metadata**: the "artist" field is really the channel name, which
  isn't always the actual artist (covers, lyric-video channels, compilations).
- **Lyric video export**: recording happens in real time (there's no way to
  render faster client-side) — a 3-minute song takes 3 minutes to export.
- **View counts**: not deduped per session/user — reopening a track counts
  again. Fine as a rough metric, not built for "unique listeners."
