import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Mic2, Music4, Upload, Play, Pause, Plus, LogOut, User, Clock, Check,
  ListMusic, Link2, Unlink, Search, Heart, Image as ImageIcon, ChevronLeft,
  TrendingUp, Sparkles, Tag, ArrowRight, X, Compass, Wand2, Layers, BarChart3, Video, Loader2, Youtube,
} from "lucide-react";
import {
  FONT_IMPORT, COLORS, TYPE, SPACE, RADIUS, ELEVATION, MOTION, GRADIENT_BRAND,
  cardStyle, inputStyle, labelStyle, primaryBtn, ghostBtn, secondaryBtn, badgeStyle, pillStyle,
} from "./theme/tokens";
import Discover from "./pages/Discover";
import AITools from "./pages/AITools";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import About from "./pages/About";
import SongMeaning from "./pages/SongMeaning";
import ArtistDashboard from "./pages/ArtistDashboard";
import Community from "./pages/Community";
import Sitemap from "./pages/Sitemap";
import LyricVideoStudio from "./pages/LyricVideoStudio";
import { signUp, signIn, signOut, watchAuth, friendlyAuthError, linkYouTubeChannel } from "./firebase/authService";
import { createTrack, watchTracks, toggleTrackLike, getMyLikeStatus, recordTrackView } from "./firebase/tracksService";
import { uploadFile } from "./firebase/storageService";
import { searchYouTube, listChannelVideos, resolveYouTubeChannel, autoAlignLyrics } from "./firebase/functionsClient";

/*
  LyricLine — a self-publish synced-lyrics platform
  Flow: land -> sign in -> upload track + lyrics -> tap-to-sync timestamps -> synced karaoke player
  Everything lives in memory (React state) for this demo; no backend.

  New in this pass: shared design tokens (src/theme/tokens.js) so styling
  stays consistent as more screens get added, plus two additive preview
  pages (Discover, AI Tools) reachable from the Home nav bar. Nothing about
  the existing upload -> sync -> player flow was changed.
*/

const GENRES = ["Pop", "Hip-Hop", "R&B", "Indie", "Rock", "Electronic", "Folk", "Other"];

function fmtTime(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(2);
  return `${m}:${s.padStart(5, "0")}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- Connections (Spotify / Apple Music / YouTube Music) ----------
// NOTE: This is UI only for now — no real OAuth is wired up yet.
const MUSIC_SERVICES = [
  { id: "spotify", name: "Spotify", color: "#1DB954", blurb: "Import saved tracks and match lyrics automatically." },
  { id: "appleMusic", name: "Apple Music", color: "#FA586A", blurb: "Sync your library and now-playing lyrics." },
  { id: "youtubeMusic", name: "YouTube Music", color: "#FF0000", blurb: "Pull in playlists to attach synced lyrics." },
];

function ServiceMark({ color }) {
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}22`, flexShrink: 0,
      }}
    >
      <Music4 size={18} color={color} />
    </div>
  );
}

function ConnectionsPanel({ connections, onToggle, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, padding: `${SPACE["3xl"]}px 20px` }}>
      <div className="ll-fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: SPACE["2xl"] }}>← Back</button>

        <h1 style={{ ...TYPE.styles.h1, fontSize: 26, color: COLORS.textPrimary, margin: "0 0 6px" }}>Connections</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, margin: `0 0 ${SPACE["3xl"]}px`, lineHeight: 1.5 }}>
          Link a streaming account to bring in tracks and match them with synced lyrics. This is a preview —
          connecting here doesn't send any data anywhere yet.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
          {MUSIC_SERVICES.map((s) => {
            const isConnected = !!connections[s.id];
            return (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: SPACE.xl, flexWrap: "wrap",
                  background: COLORS.surfaceRaised, border: `1px solid ${isConnected ? s.color + "55" : COLORS.border}`,
                  borderRadius: RADIUS.xl, boxShadow: ELEVATION.sm,
                }}
              >
                <ServiceMark color={s.color} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontFamily: TYPE.body, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{s.name}</div>
                  <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {isConnected ? "Connected" : s.blurb}
                  </div>
                </div>
                <button
                  onClick={() => onToggle(s.id)}
                  style={{
                    padding: "8px 14px", borderRadius: RADIUS.md, fontFamily: TYPE.body, fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    border: `1px solid ${isConnected ? COLORS.border : s.color}`,
                    background: isConnected ? "transparent" : s.color,
                    color: isConnected ? COLORS.textMuted : "#0B0D10",
                    transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
                  }}
                >
                  {isConnected ? (
                    <>
                      <Unlink size={13} /> Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 size={13} /> Connect
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: COLORS.textFaint, marginTop: SPACE["2xl"], lineHeight: 1.6 }}>
          Real account linking isn't set up yet — each service needs its own API credentials before this can log in for real.
        </p>
      </div>
    </div>
  );
}

// ---------- Landing ----------
function LandingPage({ onGetStarted, trackCount, artistCount }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* subtle waveform-inspired backdrop accent, purely decorative */}
      <svg
        aria-hidden="true"
        width="100%" height="240" viewBox="0 0 800 240" preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.5, pointerEvents: "none" }}
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const h = 6 + Math.abs(Math.sin(i * 0.4)) * 70 + Math.abs(Math.sin(i * 1.3)) * 20;
          return (
            <rect key={i} x={i * 13.5} y={40 - h / 2} width="4" height={h} rx="2"
              fill={i % 5 === 0 ? COLORS.primary : COLORS.border} opacity={i % 5 === 0 ? 0.5 : 0.7} />
          );
        })}
      </svg>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${SPACE.xl}px clamp(16px, 5vw, 40px)`, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mic2 color={COLORS.primary} size={20} />
          <span style={{ ...TYPE.styles.h4, fontFamily: TYPE.display, fontSize: 18, color: COLORS.textPrimary }}>LyricLine</span>
        </div>
        <button onClick={onGetStarted} style={{ ...ghostBtn, padding: "8px 16px" }}>Sign in</button>
      </div>

      <div
        className="ll-fade-in"
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "40px clamp(16px, 6vw, 40px)", position: "relative",
        }}
      >
        <div style={{ ...badgeStyle("primary"), marginBottom: SPACE["2xl"], padding: "6px 14px" }}>
          <Sparkles size={13} /> Artist-owned, line-by-line synced lyrics
        </div>
        <h1 style={{ ...TYPE.styles.display, color: COLORS.textPrimary, margin: "0 0 18px", maxWidth: 780 }}>
          Lyrics that move <span style={{ color: COLORS.primary, fontStyle: "italic" }}>with</span> the song
        </h1>
        <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: "clamp(14px, 2vw, 17px)", maxWidth: 520, lineHeight: 1.6, margin: `0 0 ${SPACE["3xl"]}px` }}>
          A self-publish home for word-perfect, time-synced lyrics — built by artists, for artists.
          No scraped transcriptions, no ads over your words. Just the song, and the line that's playing right now.
        </p>
        <div style={{ display: "flex", gap: SPACE.md, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onGetStarted} style={primaryBtn}>
            Get started <ArrowRight size={16} />
          </button>
          <button onClick={onGetStarted} style={ghostBtn}>Browse the catalog</button>
        </div>

        <div style={{ display: "flex", gap: "clamp(20px, 6vw, 56px)", marginTop: SPACE["7xl"] - 12, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Tracks published", value: trackCount },
            { label: "Artists", value: artistCount },
            { label: "Synced, not scraped", value: "100%" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: TYPE.display, fontSize: 28, color: COLORS.primary, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Auth ----------
function AuthScreen({ onBack }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("artist");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit =
    email.trim() && password.trim().length >= 6 && (mode === "signin" || name.trim());

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUp({ name: name.trim(), email: email.trim(), password, role });
      } else {
        await signIn({ email: email.trim(), password });
      }
      // No manual navigation needed — the root App listens to Firebase auth
      // state via watchAuth() and swaps screens once the session is live.
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="ll-fade-in" style={{ width: "100%", maxWidth: 420 }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: SPACE["2xl"], display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: SPACE["3xl"], justifyContent: "center" }}>
          <Mic2 color={COLORS.primary} size={26} strokeWidth={1.75} />
          <span style={{ ...TYPE.styles.h2, color: COLORS.textPrimary, margin: 0 }}>LyricLine</span>
        </div>

        <div style={{ ...cardStyle, boxShadow: ELEVATION.lg, padding: "clamp(22px, 5vw, 32px)" }}>
          <div style={{ display: "flex", gap: SPACE.sm, marginBottom: SPACE["2xl"], background: COLORS.background, padding: 4, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}` }}>
            {["signin", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: RADIUS.md, cursor: "pointer", border: "none",
                  background: mode === m ? COLORS.primarySoft : "transparent",
                  color: mode === m ? COLORS.primary : COLORS.textMuted,
                  fontFamily: TYPE.body, fontSize: 12, fontWeight: 700,
                  transition: `background ${MOTION.fast}, color ${MOTION.fast}`,
                }}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 style={{ ...TYPE.styles.h3, color: COLORS.textPrimary, margin: "0 0 6px" }}>
            {mode === "signin" ? "Welcome back" : "Set up your page"}
          </h1>
          <p style={{ ...TYPE.styles.body, color: COLORS.textMuted, margin: `0 0 ${SPACE["2xl"]}px` }}>
            Artists publish their own lyrics here — you keep the rights, you set the sync.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.lg }}>
            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rosa Winters" style={inputStyle} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
            </div>

            {mode === "signup" && (
              <div>
                <label style={labelStyle}>I am a...</label>
                <div style={{ display: "flex", gap: SPACE.sm }}>
                  {["artist", "listener"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: RADIUS.lg, cursor: "pointer",
                        border: `1px solid ${role === r ? COLORS.primary : COLORS.border}`,
                        background: role === r ? COLORS.primarySoft : "transparent",
                        color: role === r ? COLORS.primary : COLORS.textPrimary,
                        fontFamily: TYPE.body, fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                        transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" style={{ color: COLORS.danger, fontSize: 12, margin: `${SPACE.lg}px 0 0`, fontFamily: TYPE.body, lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button
            disabled={!canSubmit || busy}
            onClick={submit}
            style={{
              ...primaryBtn, width: "100%", marginTop: SPACE["2xl"],
              opacity: canSubmit && !busy ? 1 : 0.45,
              cursor: canSubmit && !busy ? "pointer" : "not-allowed",
            }}
          >
            {busy && <Loader2 size={14} className="spin" />}
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", marginTop: SPACE.lg, fontSize: 11, color: COLORS.textFaint, lineHeight: 1.5 }}>
            By continuing you confirm any lyrics you upload are your own work, or that you hold the rights to publish them.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Link YouTube channel (artist onboarding step) ----------
// Shown once, right after an artist registers. Once this is saved, the
// publish screen lists videos straight from this channel — no more typing
// their own name/song into a search box every time they publish.
function LinkChannelScreen({ uid, onLinked, onSkip }) {
  const [input, setInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState(null); // { channelId, title, thumbnailURL }
  const [saving, setSaving] = useState(false);

  const findChannel = async () => {
    if (!input.trim() || resolving) return;
    setResolving(true);
    setError("");
    setFound(null);
    try {
      const result = await resolveYouTubeChannel(input.trim());
      setFound(result);
    } catch (err) {
      setError(err.message || "Couldn't find that channel.");
    } finally {
      setResolving(false);
    }
  };

  const confirmChannel = async () => {
    if (!found || saving) return;
    setSaving(true);
    setError("");
    try {
      await linkYouTubeChannel(uid, found.channelId);
      onLinked(found.channelId);
    } catch (err) {
      setError(err.message || "Couldn't save your channel. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="ll-fade-in" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ ...cardStyle, boxShadow: ELEVATION.lg, padding: "clamp(22px, 5vw, 32px)", textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: RADIUS.full, background: COLORS.primarySoft,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <Youtube size={22} color={COLORS.primary} />
          </div>
          <h1 style={{ ...TYPE.styles.h3, color: COLORS.textPrimary, margin: "0 0 6px" }}>Connect your YouTube channel</h1>
          <p style={{ ...TYPE.styles.body, color: COLORS.textMuted, margin: `0 0 ${SPACE["2xl"]}px` }}>
            Link it once here — from then on, publishing a track means picking a video from your own
            channel instead of searching for your name every time.
          </p>

          <div style={{ textAlign: "left" }}>
            <label style={labelStyle}>Channel link, @handle, or channel ID</label>
            <div style={{ display: "flex", gap: SPACE.sm }}>
              <input
                value={input}
                onChange={(e) => { setInput(e.target.value); setFound(null); }}
                onKeyDown={(e) => e.key === "Enter" && findChannel()}
                placeholder="youtube.com/@yourname"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={findChannel} disabled={resolving || !input.trim()} style={{ ...secondaryBtn, opacity: resolving ? 0.6 : 1, whiteSpace: "nowrap" }}>
                {resolving ? <Loader2 size={14} className="spin" /> : "Find"}
              </button>
            </div>
          </div>

          {error && <p role="alert" style={{ color: COLORS.danger, fontSize: 12, margin: `${SPACE.md}px 0 0`, fontFamily: TYPE.body }}>{error}</p>}

          {found && (
            <div className="ll-fade-in" style={{
              display: "flex", alignItems: "center", gap: SPACE.md, marginTop: SPACE.lg, padding: SPACE.md,
              borderRadius: RADIUS.lg, border: `1px solid ${COLORS.primary}`, background: COLORS.primarySoft, textAlign: "left",
            }}>
              {found.thumbnailURL ? (
                <img src={found.thumbnailURL} alt="" style={{ width: 40, height: 40, borderRadius: RADIUS.full, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: RADIUS.full, background: COLORS.border }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TYPE.body, fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{found.title}</div>
                <div style={{ fontFamily: TYPE.body, fontSize: 11, color: COLORS.textMuted }}>Is this your channel?</div>
              </div>
            </div>
          )}

          <button
            disabled={!found || saving}
            onClick={confirmChannel}
            style={{ ...primaryBtn, width: "100%", marginTop: SPACE["2xl"], opacity: found && !saving ? 1 : 0.45 }}
          >
            {saving && <Loader2 size={14} className="spin" />}
            {saving ? "Saving…" : "Use this channel"}
          </button>
          <button onClick={onSkip} style={{ ...ghostBtn, width: "100%", marginTop: SPACE.sm }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Upload ----------
function UploadScreen({ user, onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [coverURL, setCoverURL] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [genre, setGenre] = useState(GENRES[0]);
  const [tagsText, setTagsText] = useState("");
  const fileRef = useRef(null);
  const coverRef = useRef(null);

  // Channel-linked artists: load their own uploads once on mount, so there's
  // nothing to type or search for — they just pick the song they're publishing.
  const [channelVideos, setChannelVideos] = useState([]);
  const [channelLoading, setChannelLoading] = useState(!!user?.youtubeChannelId);
  const [channelError, setChannelError] = useState("");
  const [channelFiltered, setChannelFiltered] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  useEffect(() => {
    if (!user?.youtubeChannelId) return;
    let cancelled = false;
    (async () => {
      setChannelLoading(true);
      setChannelError("");
      try {
        const { results, filtered } = await listChannelVideos(user.youtubeChannelId);
        if (!cancelled) {
          setChannelVideos(results);
          setChannelFiltered(filtered);
        }
      } catch (err) {
        if (!cancelled) setChannelError(err.message || "Couldn't load your channel videos.");
      } finally {
        if (!cancelled) setChannelLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.youtubeChannelId]);

  // Fallback for artists who haven't linked a channel yet (e.g. skipped
  // onboarding) — a manual search, same as before.
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytError, setYtError] = useState("");

  const runYouTubeSearch = async () => {
    if (!ytQuery.trim()) return;
    setYtSearching(true);
    setYtError("");
    try {
      const results = await searchYouTube(ytQuery.trim());
      setYtResults(results);
      if (results.length === 0) setYtError("No matches found — try a different search.");
    } catch (err) {
      setYtError(err.message || "YouTube search failed.");
    } finally {
      setYtSearching(false);
    }
  };

  const applyYouTubeResult = (r) => {
    setTitle(r.title);
    setArtist(r.channelTitle); // channel name — often the artist, but not guaranteed
    if (r.coverURL) setCoverURL(r.coverURL); // external URL — no coverFile, so nothing to upload
    setSelectedVideoId(r.videoId);
    setYtResults([]);
    setYtQuery("");
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioURL(URL.createObjectURL(f));
    setAudioFile(f);
    setAudioName(f.name);
  };

  const handleCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverURL(URL.createObjectURL(f));
    setCoverFile(f);
  };

  const canContinue = title.trim() && artist.trim() && lyricsText.trim() && audioURL;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, padding: "clamp(24px, 6vw, 48px) 20px" }}>
      <div className="ll-fade-in" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: SPACE.sm }}>
          <span style={badgeStyle("primary")}>Step 1 of 2</span>
          <span style={{ ...TYPE.styles.caption, color: COLORS.textFaint }}>Publish details, then sync timestamps</span>
        </div>
        <h1 style={{ ...TYPE.styles.h1, color: COLORS.textPrimary, margin: "0 0 6px" }}>Publish a track</h1>
        <p style={{ ...TYPE.styles.body, color: COLORS.textMuted, margin: `0 0 ${SPACE["3xl"]}px` }}>Add your song, then paste the lyrics line by line. You'll sync timestamps next.</p>

        {user?.youtubeChannelId ? (
          <div style={{ ...cardStyle, padding: SPACE.lg, marginBottom: SPACE["2xl"] }}>
            <label style={labelStyle}>Pick the release from your channel</label>
            {channelLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                <Loader2 size={14} className="spin" color={COLORS.textMuted} />
                <span style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted }}>Loading your videos…</span>
              </div>
            )}
            {channelError && (
              <p style={{ color: COLORS.danger, fontSize: 12, margin: "4px 0 0" }}>{channelError}</p>
            )}
            {!channelLoading && !channelError && channelVideos.length === 0 && (
              <p style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>
                No videos found on this channel yet.
              </p>
            )}
            {channelVideos.length > 0 && (
              <div className="ll-fade-in" style={{ marginTop: SPACE.sm, display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                {channelVideos.map((r) => (
                  <button
                    key={r.videoId}
                    onClick={() => applyYouTubeResult(r)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: RADIUS.md, cursor: "pointer",
                      background: selectedVideoId === r.videoId ? COLORS.primarySoft : COLORS.hover,
                      border: `1px solid ${selectedVideoId === r.videoId ? COLORS.primary : COLORS.border}`, textAlign: "left",
                      transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
                    }}
                  >
                    {r.coverURL ? (
                      <img src={r.coverURL} alt="" style={{ width: 48, height: 27, borderRadius: RADIUS.sm, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 48, height: 27, borderRadius: RADIUS.sm, background: COLORS.border }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textPrimary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                      <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.channelTitle}</div>
                    </div>
                    {selectedVideoId === r.videoId && <Check size={16} color={COLORS.primary} />}
                  </button>
                ))}
              </div>
            )}
            {!channelLoading && !channelError && channelVideos.length > 0 && !channelFiltered && (
              <p style={{ ...TYPE.styles.caption, color: COLORS.textFaint, marginTop: SPACE.sm, marginBottom: 0 }}>
                None of your uploads are tagged as "Music" by YouTube, so this shows everything on your
                channel — just pick the right one.
              </p>
            )}
            <p style={{ ...TYPE.styles.caption, color: COLORS.textFaint, marginTop: SPACE.sm, marginBottom: 0 }}>
              Title, artist name, and cover art fill in automatically. YouTube doesn't let us pull the
              actual audio track for you (rights reasons) — drop your own audio file below and you're set.
            </p>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: SPACE.lg, marginBottom: SPACE["2xl"] }}>
            <label style={labelStyle}>Fill from YouTube (optional)</label>
            <div style={{ display: "flex", gap: SPACE.sm }}>
              <input
                value={ytQuery}
                onChange={(e) => setYtQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runYouTubeSearch()}
                placeholder="Search by song or artist name"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={runYouTubeSearch} disabled={ytSearching} style={{ ...secondaryBtn, opacity: ytSearching ? 0.6 : 1, whiteSpace: "nowrap" }}>
                {ytSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                {ytSearching ? "Searching…" : "Search"}
              </button>
            </div>
            {ytError && <p style={{ color: COLORS.danger, fontSize: 12, marginTop: SPACE.sm }}>{ytError}</p>}
            {ytResults.length > 0 && (
              <div className="ll-fade-in" style={{ marginTop: SPACE.md, display: "flex", flexDirection: "column", gap: 6 }}>
                {ytResults.map((r) => (
                  <button
                    key={r.videoId}
                    onClick={() => applyYouTubeResult(r)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: RADIUS.md, cursor: "pointer",
                      background: COLORS.hover, border: `1px solid ${COLORS.border}`, textAlign: "left",
                      transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
                    }}
                  >
                    {r.coverURL ? (
                      <img src={r.coverURL} alt="" style={{ width: 48, height: 27, borderRadius: RADIUS.sm, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 48, height: 27, borderRadius: RADIUS.sm, background: COLORS.border }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textPrimary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                      <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.channelTitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p style={{ ...TYPE.styles.caption, color: COLORS.textFaint, marginTop: SPACE.sm, marginBottom: 0 }}>
              Link a channel from your profile to skip searching next time — you'll pick songs straight
              from your own uploads instead.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: SPACE.lg, marginBottom: SPACE["2xl"], flexWrap: "wrap" }}>
          <div
            onClick={() => coverRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Choose cover art"
            style={{
              width: 96, height: 96, borderRadius: RADIUS.xl, flexShrink: 0, cursor: "pointer",
              border: `1.5px dashed ${coverURL ? COLORS.primary : COLORS.border}`,
              backgroundImage: coverURL ? `url(${coverURL})` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: coverURL ? undefined : COLORS.primarySoft,
              transition: `border-color ${MOTION.fast}`,
            }}
          >
            {!coverURL && <ImageIcon size={20} color={COLORS.textMuted} />}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: SPACE.md }}>
            <div>
              <label style={labelStyle}>Song title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midnight Static" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Artist name</label>
              <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Rosa Winters" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: SPACE.md, marginBottom: SPACE.lg, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 220 }}>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="breakup, lofi, night-drive" style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Audio file</label>
        <div
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          style={{
            border: `1.5px dashed ${audioURL ? COLORS.primary : COLORS.border}`, borderRadius: RADIUS.xl, padding: SPACE.xl,
            display: "flex", alignItems: "center", gap: SPACE.md, cursor: "pointer", marginBottom: SPACE.lg, flexWrap: "wrap",
            background: audioURL ? COLORS.primarySoft : "transparent",
            transition: `border-color ${MOTION.fast}, background ${MOTION.fast}`,
          }}
        >
          <Upload size={20} color={audioURL ? COLORS.primary : COLORS.textMuted} />
          <div style={{ fontFamily: TYPE.body, fontSize: 13, color: audioURL ? COLORS.textPrimary : COLORS.textMuted }}>
            {audioURL ? audioName : "Click to choose an audio file (mp3, wav, m4a...)"}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} style={{ display: "none" }} />
        </div>

        <label style={labelStyle}>Lyrics (one line per row)</label>
        <textarea
          value={lyricsText}
          onChange={(e) => setLyricsText(e.target.value)}
          rows={10}
          placeholder={"City lights blur through the glass\nI'm holding on to what I had\n..."}
          style={{ ...inputStyle, resize: "vertical", fontFamily: TYPE.display, lineHeight: 1.6, marginBottom: SPACE["3xl"] }}
        />

        <div style={{ display: "flex", gap: SPACE.md, flexWrap: "wrap" }}>
          <button onClick={onCancel} style={ghostBtn}>Cancel</button>
          <button
            disabled={!canContinue}
            onClick={() =>
              onCreated({
                id: uid(),
                title: title.trim(),
                artist: artist.trim(),
                audioURL,
                audioFile,
                coverURL,
                coverFile,
                genre,
                tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
                lines: lyricsText.split("\n").map((t) => t.trim()).filter(Boolean),
              })
            }
            style={{ ...primaryBtn, flex: 1, minWidth: 180, opacity: canContinue ? 1 : 0.4, cursor: canContinue ? "pointer" : "not-allowed" }}
          >
            Continue to sync <Clock size={15} style={{ marginLeft: 6, verticalAlign: -2 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Upload files, then hand off to sync ----------
function PreparingScreen({ onDone, onError, uploadAudio, uploadCover, draftTrack }) {
  const [status, setStatus] = useState("Uploading audio…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const audioURL = await uploadAudio();
        if (cancelled) return;
        let coverURL = draftTrack.coverURL || null; // keep Spotify-picked cover if present
        if (uploadCover) {
          setStatus("Uploading cover art…");
          coverURL = await uploadCover();
        }
        if (cancelled) return;
        onDone({ ...draftTrack, audioURL, coverURL });
      } catch (err) {
        if (!cancelled) onError(err.message || "Upload failed. Please try again.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: SPACE.lg }}>
      <div className="spin" style={{ width: 30, height: 30, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: "50%" }} />
      <p style={{ ...TYPE.styles.body, color: COLORS.textMuted }}>{status}</p>
    </div>
  );
}


// ---------- Tap to sync ----------
// ---------- Karaoke-style preview for reviewing sync ----------
// A timestamp table is hard to eyeball — this renders it like an actual
// lyric video instead: cover art behind, the current line large and lit up,
// the line before/after visible but dim, advancing live as the audio plays.
// Reviewing becomes "watch it and see if it looks right" instead of
// cross-checking a column of numbers.
function activeLineIndex(current, timestamps) {
  let idx = -1;
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] === null) continue;
    if (timestamps[i] <= current) idx = i;
    else break;
  }
  return idx;
}

function LyricVideoPreview({ track, timestamps, current, playing, onTogglePlay }) {
  const idx = useMemo(() => activeLineIndex(current, timestamps), [current, timestamps]);
  const prevLine = idx > 0 ? track.lines[idx - 1] : null;
  const currentLine = idx >= 0 ? track.lines[idx] : track.lines[0];
  const nextLine = idx >= 0 && idx < track.lines.length - 1 ? track.lines[idx + 1] : idx === -1 ? track.lines[0] : null;

  return (
    <div
      style={{
        position: "relative", height: 260, borderRadius: RADIUS["2xl"], overflow: "hidden",
        marginBottom: SPACE["2xl"], boxShadow: ELEVATION.lg, border: `1px solid ${COLORS.border}`,
        background: track.coverURL ? `center/cover no-repeat url(${track.coverURL})` : GRADIENT_BRAND,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center",
      }}
    >
      {/* Darken/blur the cover art so text stays readable over any image */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(20,15,25,0.55) 0%, rgba(20,15,25,0.75) 100%)",
        backdropFilter: "blur(2px)",
      }} />

      <div style={{ position: "relative", padding: "0 28px", width: "100%" }}>
        {prevLine !== null && (
          <div style={{ ...TYPE.styles.h4, color: "rgba(255,255,255,0.45)", marginBottom: 10, fontFamily: TYPE.display, transition: `opacity ${MOTION.base}` }}>
            {prevLine}
          </div>
        )}
        <div
          key={idx}
          className="ll-fade-in"
          style={{
            fontFamily: TYPE.display, fontWeight: 700, fontSize: "clamp(20px, 4vw, 30px)",
            color: "#FFFFFF", lineHeight: 1.3, textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {currentLine}
        </div>
        {nextLine !== null && (
          <div style={{ ...TYPE.styles.h4, color: "rgba(255,255,255,0.45)", marginTop: 10, fontFamily: TYPE.display }}>
            {nextLine}
          </div>
        )}
      </div>

      <button
        onClick={onTogglePlay}
        aria-label={playing ? "Pause" : "Play"}
        style={{
          position: "absolute", left: 16, bottom: 14, width: 40, height: 40, borderRadius: RADIUS.full,
          background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FFFFFF",
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div style={{ position: "absolute", right: 16, bottom: 20, fontFamily: TYPE.mono, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
        {fmtTime(current)}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 20, height: 3, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: COLORS.primary, borderRadius: RADIUS.full,
          width: `${Math.min(100, (idx >= 0 ? (idx + 1) : 0) / track.lines.length * 100)}%`,
          transition: `width ${MOTION.base}`,
        }} />
      </div>
    </div>
  );
}

function SyncScreen({ track, onDone, onCancel, busy, errorMessage }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [timestamps, setTimestamps] = useState(Array(track.lines.length).fill(null));
  const [activeIdx, setActiveIdx] = useState(0);
  const [rate, setRate] = useState(1);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  const pulse = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
  };

  const tapLine = useCallback(() => {
    if (activeIdx >= track.lines.length) return;
    setTimestamps((prev) => {
      const next = [...prev];
      next[activeIdx] = audioRef.current?.currentTime ?? 0;
      return next;
    });
    setActiveIdx((i) => Math.min(i + 1, track.lines.length));
    pulse();
  }, [activeIdx, track.lines.length]);

  // Undo the most recent tap — much easier than reaching for the mouse to
  // fix a single mistimed line mid-flow.
  const undoLastTap = useCallback(() => {
    setActiveIdx((i) => {
      const prevIdx = Math.max(0, i - 1);
      setTimestamps((prevTs) => {
        const next = [...prevTs];
        next[prevIdx] = null;
        return next;
      });
      return prevIdx;
    });
  }, []);

  // allow re-tapping a single mistimed line without redoing the rest
  const retapLine = useCallback((idx) => {
    setTimestamps((prev) => {
      const next = [...prev];
      next[idx] = audioRef.current?.currentTime ?? 0;
      return next;
    });
    setActiveIdx(idx + 1);
    pulse();
  }, []);

  // Fine-tune a single line's timestamp by a small offset without
  // replaying — for the "close but not quite" case.
  const nudgeLine = useCallback((idx, deltaSec) => {
    setTimestamps((prev) => {
      if (prev[idx] === null) return prev;
      const next = [...prev];
      next[idx] = Math.max(0, +(next[idx] + deltaSec).toFixed(2));
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        tapLine();
      } else if (e.code === "Backspace" || e.code === "KeyZ") {
        e.preventDefault();
        undoLastTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tapLine, undoLastTap]);

  const allTagged = timestamps.every((t) => t !== null);
  const RATES = [0.5, 0.75, 1];
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [autoSyncError, setAutoSyncError] = useState("");

  const runAutoSync = useCallback(async () => {
    setAutoSyncing(true);
    setAutoSyncError("");
    try {
      const result = await autoAlignLyrics(track.audioURL, track.lines);
      setTimestamps(result);
      setActiveIdx(track.lines.length); // mark everything as tagged
    } catch (err) {
      setAutoSyncError(err.message || "Auto-sync failed — you can still tap it in manually below.");
    } finally {
      setAutoSyncing(false);
    }
  }, [track.audioURL, track.lines]);

  // Runs automatically as soon as this screen mounts — the artist just
  // uploads lyrics + audio and lands here already synced, ready to review.
  useEffect(() => {
    runAutoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taggedCount = timestamps.filter((t) => t !== null).length;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, padding: "clamp(24px, 6vw, 40px) 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <div className="ll-fade-in" style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: SPACE.sm }}>
          <span style={badgeStyle("primary")}>Step 2 of 2</span>
          <span style={{ ...TYPE.styles.caption, color: COLORS.textFaint }}>{taggedCount}/{track.lines.length} lines tagged</span>
        </div>
        <h1 style={{ ...TYPE.styles.h1, fontSize: 26, color: COLORS.textPrimary, margin: "0 0 4px" }}>
          {autoSyncing ? "Syncing your lyrics…" : "Review the sync"}
        </h1>
        <p style={{ ...TYPE.styles.body, fontSize: 13, color: COLORS.textMuted, margin: `0 0 ${SPACE.lg}px` }}>
          {autoSyncing
            ? "Listening to your track and lining up each line — this takes a few seconds."
            : "We've synced this automatically. Play it back and fix anything that's off — nudge a line, or re-tap it at the right moment."}
        </p>

        {autoSyncing && (
          <div style={{ ...cardStyle, padding: SPACE.lg, marginBottom: SPACE["2xl"], display: "flex", alignItems: "center", gap: SPACE.md }}>
            <Loader2 size={18} className="spin" color={COLORS.primary} />
            <span style={{ ...TYPE.styles.body, fontSize: 13, color: COLORS.textPrimary }}>Analyzing audio and matching your lyrics…</span>
          </div>
        )}
        {!autoSyncing && (
          <div style={{ ...cardStyle, padding: SPACE.lg, marginBottom: SPACE["2xl"], display: "flex", alignItems: "center", gap: SPACE.md, flexWrap: "wrap" }}>
            <button
              onClick={runAutoSync}
              style={{ ...ghostBtn, whiteSpace: "nowrap" }}
            >
              <Sparkles size={15} /> Re-run auto-sync
            </button>
            <span style={{ ...TYPE.styles.caption, color: COLORS.textFaint, flex: 1, minWidth: 180 }}>
              Not happy with the result? Run it again, or press <b style={{ color: COLORS.primary }}>Space</b> on any
              line while playing to re-tap it by hand.
            </span>
          </div>
        )}
        {autoSyncError && (
          <p style={{ color: COLORS.danger, fontSize: 12, marginTop: -12, marginBottom: SPACE.lg, fontFamily: TYPE.body }}>{autoSyncError}</p>
        )}

        {!autoSyncing && (
          <LyricVideoPreview
            track={track}
            timestamps={timestamps}
            current={current}
            playing={playing}
            onTogglePlay={togglePlay}
          />
        )}

        <div style={{ ...TYPE.styles.label, color: COLORS.textMuted, textTransform: "none", marginBottom: SPACE.sm }}>
          Something off? Fine-tune it below
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.lg }}>
          <span style={{ ...TYPE.styles.label, color: COLORS.textMuted, marginRight: 4, textTransform: "none" }}>Speed</span>
          {RATES.map((r) => (
            <button key={r} onClick={() => setRate(r)} style={pillStyle(rate === r)}>
              {r}×
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: SPACE.lg, marginBottom: SPACE["3xl"], flexWrap: "wrap" }}>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            style={{ ...primaryBtn, width: 46, height: 46, padding: 0, borderRadius: RADIUS.full, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div style={{ fontFamily: TYPE.mono, color: COLORS.textMuted, fontSize: 13 }}>{fmtTime(current)}</div>
          <button
            onClick={tapLine}
            disabled={!playing || activeIdx >= track.lines.length}
            style={{
              ...ghostBtn, flex: 1, minWidth: 160, justifyContent: "center",
              opacity: !playing || activeIdx >= track.lines.length ? 0.4 : 1,
              transform: flash ? "scale(0.97)" : "scale(1)",
              borderColor: flash ? COLORS.primary : COLORS.border,
              transition: `transform ${MOTION.fast}, border-color ${MOTION.fast}`,
            }}
          >
            Tap line {Math.min(activeIdx + 1, track.lines.length)} of {track.lines.length}
          </button>
          <button
            onClick={undoLastTap}
            disabled={activeIdx === 0}
            title="Undo last tap (Backspace)"
            style={{ ...ghostBtn, opacity: activeIdx === 0 ? 0.4 : 1 }}
          >
            Undo
          </button>
        </div>

        <div style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.xl, boxShadow: ELEVATION.sm, maxHeight: 340, overflowY: "auto" }}>
          {track.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: SPACE.sm, padding: `${SPACE.md}px ${SPACE.lg}px`,
                borderBottom: i < track.lines.length - 1 ? `1px solid ${COLORS.border}` : "none",
                background: i === activeIdx ? COLORS.primarySoft : "transparent",
                transition: `background ${MOTION.fast}`,
              }}
            >
              <div style={{ width: 20 }}>
                {timestamps[i] !== null ? <Check size={15} color={COLORS.primary} /> : <span style={{ color: COLORS.textFaint, fontSize: 12 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1, fontFamily: TYPE.display, fontSize: 15, color: i === activeIdx ? COLORS.textPrimary : COLORS.textMuted }}>{line}</div>

              {timestamps[i] !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button
                    onClick={() => nudgeLine(i, -0.1)}
                    title="Nudge 0.1s earlier"
                    aria-label="Nudge 0.1 seconds earlier"
                    style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontFamily: TYPE.body, fontSize: 13, padding: "2px 5px" }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => retapLine(i)}
                    title="Re-tap at current playhead position"
                    style={{
                      fontFamily: TYPE.mono, fontSize: 12, minWidth: 52, textAlign: "center",
                      background: "none", border: "none", padding: 0, color: COLORS.textMuted, cursor: "pointer",
                    }}
                  >
                    {fmtTime(timestamps[i])}
                  </button>
                  <button
                    onClick={() => nudgeLine(i, 0.1)}
                    title="Nudge 0.1s later"
                    aria-label="Nudge 0.1 seconds later"
                    style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontFamily: TYPE.body, fontSize: 13, padding: "2px 5px" }}
                  >
                    +
                  </button>
                </div>
              )}
              {timestamps[i] === null && <span style={{ color: COLORS.textFaint, fontSize: 12, minWidth: 84, textAlign: "right" }}>—</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: SPACE.md, marginTop: SPACE["2xl"], flexWrap: "wrap" }}>
          <button onClick={onCancel} disabled={busy} style={{ ...ghostBtn, opacity: busy ? 0.5 : 1 }}>Back</button>
          <button
            disabled={!allTagged || busy}
            onClick={() => onDone(timestamps)}
            style={{ ...primaryBtn, flex: 1, minWidth: 180, opacity: allTagged && !busy ? 1 : 0.4, cursor: allTagged && !busy ? "pointer" : "not-allowed" }}
          >
            {busy && <Loader2 size={14} className="spin" />}
            {busy
              ? "Uploading & publishing…"
              : allTagged
              ? "Publish track"
              : `${taggedCount}/${track.lines.length} lines tagged`}
          </button>
        </div>
        {errorMessage && (
          <p style={{ color: COLORS.danger, fontSize: 12, marginTop: SPACE.md, fontFamily: TYPE.body }}>{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

// ---------- Karaoke line (word-level highlight) ----------
function KaraokeLine({ text, progress, active, dim }) {
  const words = text.split(" ");
  const wordProgress = Math.max(0, Math.min(1, progress)) * words.length;

  return (
    <span>
      {words.map((w, i) => {
        let fill;
        if (!active) fill = dim ? COLORS.plumDim : COLORS.plum;
        else if (i + 1 <= wordProgress) fill = COLORS.gold;
        else if (i < wordProgress) fill = COLORS.gold; // partial word, still gold once crossed
        else fill = COLORS.cream + "66";
        return (
          <span key={i} style={{ color: fill, transition: "color .15s linear" }}>
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        );
      })}
    </span>
  );
}

// ---------- Player ----------
function PlayerScreen({ track, onBack, initialSeek, onOpenArtist, likeInfo, onToggleLike }) {
  const audioRef = useRef(null);
  const lineRefs = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const seeked = useRef(false);

  // One real view per time this screen mounts for a track (i.e. per open,
  // not per second of playback). Matches what the dashboard's "views" means.
  useEffect(() => {
    if (track?.id) recordTrackView(track.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => {
      setDuration(a.duration || 0);
      if (typeof initialSeek === "number" && !seeked.current) {
        a.currentTime = initialSeek;
        setCurrent(initialSeek);
        seeked.current = true;
      }
    };
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, [initialSeek]);

  const activeIdx = (() => {
    let idx = -1;
    for (let i = 0; i < track.timestamps.length; i++) {
      if (track.timestamps[i] <= current) idx = i;
      else break;
    }
    return idx;
  })();

  const lineProgress = (() => {
    if (activeIdx < 0) return 0;
    const start = track.timestamps[activeIdx];
    const end = activeIdx + 1 < track.timestamps.length ? track.timestamps[activeIdx + 1] : duration || start + 4;
    if (end <= start) return 1;
    return (current - start) / (end - start);
  })();

  useEffect(() => {
    if (activeIdx >= 0 && lineRefs.current[activeIdx]) {
      lineRefs.current[activeIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIdx]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  const seekTo = (t) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = t;
    setCurrent(t);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(24px, 6vw, 40px) 20px" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <div className="ll-fade-in" style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE["2xl"] }}>
        <button onClick={onBack} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6 }}><ChevronLeft size={15} /> Back</button>
        {onToggleLike && (
          <button
            onClick={() => onToggleLike(track.id)}
            style={{
              ...ghostBtn, display: "flex", alignItems: "center", gap: 6,
              borderColor: likeInfo?.liked ? COLORS.primary : COLORS.border,
              color: likeInfo?.liked ? COLORS.primary : COLORS.textPrimary,
            }}
          >
            <Heart size={14} fill={likeInfo?.liked ? COLORS.primary : "none"} /> {likeInfo?.likes ?? track.likesCount ?? 0}
          </button>
        )}
      </div>

      {track.coverURL && (
        <div
          style={{
            width: 100, height: 100, borderRadius: RADIUS["2xl"], marginBottom: SPACE.lg, backgroundImage: `url(${track.coverURL})`,
            backgroundSize: "cover", backgroundPosition: "center", boxShadow: ELEVATION.xl,
          }}
        />
      )}

      <div style={{ textAlign: "center", marginBottom: SPACE.sm }}>
        <div style={{ ...TYPE.styles.h1, fontSize: "clamp(22px, 5vw, 28px)", color: COLORS.textPrimary }}>{track.title}</div>
        <button
          onClick={() => onOpenArtist && onOpenArtist(track.artist)}
          style={{
            fontFamily: TYPE.body, fontSize: 14, color: COLORS.primary, marginTop: 4, background: "none",
            border: "none", cursor: onOpenArtist ? "pointer" : "default", padding: 0, textDecoration: onOpenArtist ? "underline" : "none",
          }}
        >
          {track.artist}
        </button>
      </div>

      <div
        style={{
          width: "100%", maxWidth: 520, height: 360, overflowY: "auto", margin: `${SPACE["2xl"]}px 0`,
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        }}
      >
        {track.lines.map((line, i) => (
          <div
            key={i}
            ref={(el) => (lineRefs.current[i] = el)}
            onClick={() => seekTo(track.timestamps[i])}
            style={{
              padding: "10px 8px", textAlign: "center", cursor: "pointer",
              fontFamily: TYPE.display, fontWeight: i === activeIdx ? 700 : 400,
              fontSize: i === activeIdx ? 22 : 17,
              transition: `all ${MOTION.slow} ease`,
            }}
          >
            {i === activeIdx ? (
              <KaraokeLine text={line} progress={lineProgress} active />
            ) : (
              <span style={{ color: i < activeIdx ? COLORS.textFaint : COLORS.textMuted }}>{line}</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: COLORS.primary }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: TYPE.mono, fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: SPACE.lg }}>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            style={{ ...primaryBtn, width: 54, height: 54, padding: 0, borderRadius: RADIUS.full, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ELEVATION.md }}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Artist page ----------
function ArtistPage({ artistName, tracks, onBack, onOpenTrack, likes }) {
  const artistTracks = tracks.filter((t) => t.artist === artistName);
  const totalLikes = artistTracks.reduce((sum, t) => sum + (likes[t.id]?.likes ?? t.likesCount ?? 0), 0);
  const cover = artistTracks.find((t) => t.coverURL)?.coverURL;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background }}>
      <div style={{ padding: `${SPACE.xl}px clamp(16px, 5vw, 28px)`, borderBottom: `1px solid ${COLORS.border}` }}>
        <button onClick={onBack} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>
      </div>

      <div className="ll-fade-in" style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: SPACE["3xl"], flexWrap: "wrap" }}>
          <div
            style={{
              width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
              background: cover ? `url(${cover}) center/cover` : COLORS.primarySoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: ELEVATION.md,
            }}
          >
            {!cover && <User size={30} color={COLORS.primary} />}
          </div>
          <div>
            <h1 style={{ ...TYPE.styles.h1, fontSize: "clamp(24px, 4vw, 32px)", color: COLORS.textPrimary, margin: 0 }}>{artistName}</h1>
            <div style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 13, marginTop: 4 }}>
              {artistTracks.length} track{artistTracks.length === 1 ? "" : "s"} · {totalLikes} like{totalLikes === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: SPACE.lg }}>
          {artistTracks.map((t) => (
            <TrackCard key={t.id} track={t} likeInfo={likes[t.id]} onOpen={() => onOpenTrack(t)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Track card ----------
function TrackCard({ track, likeInfo, onOpen, onOpenArtist, onLike, matchedLine }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...cardStyle,
        padding: SPACE.lg,
        cursor: "pointer",
        display: "flex", flexDirection: "column", gap: SPACE.md,
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? ELEVATION.lg : ELEVATION.sm,
        borderColor: hovered ? COLORS.borderStrong : COLORS.border,
        transition: `transform ${MOTION.base}, box-shadow ${MOTION.base}, border-color ${MOTION.base}`,
      }}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: RADIUS.lg, flexShrink: 0,
            background: track.coverURL ? `url(${track.coverURL}) center/cover` : COLORS.primarySoft,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!track.coverURL && <Music4 size={18} color={COLORS.primary} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: TYPE.display, fontWeight: 600, fontSize: 16, color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {track.title}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenArtist && onOpenArtist(track.artist);
            }}
            style={{
              fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted, background: "none", border: "none",
              padding: 0, cursor: onOpenArtist ? "pointer" : "default",
            }}
          >
            {track.artist}
          </button>
        </div>
      </div>

      {matchedLine && (
        <div style={{ fontFamily: TYPE.display, fontSize: 13, fontStyle: "italic", color: COLORS.primary, lineHeight: 1.4 }}>
          "…{matchedLine}…"
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={badgeStyle("neutral")}>{track.genre}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike && onLike(track.id);
          }}
          style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: onLike ? "pointer" : "default", color: likeInfo?.liked ? COLORS.primary : COLORS.textMuted,
            fontFamily: TYPE.body, fontSize: 12,
          }}
        >
          <Heart size={13} fill={likeInfo?.liked ? COLORS.primary : "none"} /> {likeInfo?.likes ?? track.likesCount ?? 0}
        </button>
      </div>
    </div>
  );
}

// ---------- Library / home ----------
function Home({ user, tracks, likes, connections, onLogout, onUploadStart, onOpenTrack, onOpenConnections, onOpenArtist, onLike, onOpenDiscover, onOpenAITools, onOpenSitemap, onOpenDashboard, onOpenVideoStudio }) {
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sort, setSort] = useState("recent"); // recent | trending

  const connectedCount = Object.values(connections).filter(Boolean).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tracks.map((t) => {
      let matchedLine = null;
      if (q) {
        const titleHit = t.title.toLowerCase().includes(q);
        const artistHit = t.artist.toLowerCase().includes(q);
        const tagHit = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const lineHit = !titleHit && !artistHit && t.lines.find((l) => l.toLowerCase().includes(q));
        if (!titleHit && !artistHit && !tagHit && !lineHit) return null;
        matchedLine = lineHit || null;
      }
      return { ...t, matchedLine };
    }).filter(Boolean);

    if (genreFilter !== "All") list = list.filter((t) => t.genre === genreFilter);

    list = [...list].sort((a, b) => {
      if (sort === "trending") {
        const la = likes[a.id]?.likes ?? a.likesCount ?? 0;
        const lb = likes[b.id]?.likes ?? b.likesCount ?? 0;
        return lb - la;
      }
      return 0; // "recent" keeps publish order (array order), most recent last -> reverse below
    });
    if (sort === "recent") list = [...list].reverse();
    return list;
  }, [tracks, query, genreFilter, sort, likes]);

  const usedGenres = ["All", ...GENRES.filter((g) => tracks.some((t) => t.genre === g))];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.background }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${SPACE.lg}px clamp(16px, 4vw, 28px)`, borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: SPACE.md, position: "sticky", top: 0, background: COLORS.background, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mic2 color={COLORS.primary} size={20} />
          <span style={{ ...TYPE.styles.h4, fontFamily: TYPE.display, fontSize: 18, color: COLORS.textPrimary }}>LyricLine</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.md, flexWrap: "wrap" }}>
          <button
            onClick={onOpenSitemap}
            style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, borderColor: COLORS.primary, color: COLORS.primary }}
          >
            <Layers size={14} /> Explore the vision
          </button>
          <button onClick={onOpenDiscover} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <Compass size={14} /> Discover
          </button>
          <button onClick={onOpenAITools} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <Wand2 size={14} /> AI tools
          </button>
          {user.role === "artist" && (
            <button onClick={onOpenDashboard} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={14} /> Dashboard
            </button>
          )}
          {user.role === "artist" && (
            <button onClick={onOpenVideoStudio} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Video size={14} /> Lyric video
            </button>
          )}
          <button onClick={onOpenConnections} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <Link2 size={14} /> Connections{connectedCount > 0 ? ` (${connectedCount})` : ""}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 13 }}>
            <User size={14} /> {user.name} · {user.role}
          </div>
          <button onClick={onLogout} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.lg, flexWrap: "wrap", gap: SPACE.md }}>
          <h1 style={{ ...TYPE.styles.h2, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ListMusic size={22} color={COLORS.primary} /> Catalog
          </h1>
          {user.role === "artist" && (
            <button onClick={onUploadStart} style={{ ...primaryBtn }}>
              <Plus size={16} /> Publish a track
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: SPACE.sm, marginBottom: SPACE.lg, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} color={COLORS.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, artists, tags, or a line of lyrics..."
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
              >
                <X size={14} color={COLORS.textMuted} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "recent", label: "Recent", icon: Clock },
              { id: "trending", label: "Trending", icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                style={{
                  padding: "9px 12px", borderRadius: RADIUS.lg, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  border: `1px solid ${sort === id ? COLORS.primary : COLORS.border}`,
                  background: sort === id ? COLORS.primarySoft : "transparent",
                  color: sort === id ? COLORS.primary : COLORS.textMuted,
                  fontFamily: TYPE.body, fontSize: 12, fontWeight: 700,
                  transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: SPACE.sm, marginBottom: SPACE["3xl"], flexWrap: "wrap" }}>
          {usedGenres.map((g) => (
            <button key={g} onClick={() => setGenreFilter(g)} style={pillStyle(genreFilter === g)}>
              {g !== "All" && <Tag size={11} />} {g}
            </button>
          ))}
        </div>

        {tracks.length === 0 ? (
          <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: RADIUS.xl, padding: SPACE["6xl"], textAlign: "center" }}>
            <Music4 size={28} color={COLORS.textFaint} style={{ marginBottom: 10 }} />
            <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 14, margin: 0 }}>
              Nothing published yet. {user.role === "artist" ? "Publish your first track to get started." : "Check back once an artist publishes a track."}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: RADIUS.xl, padding: SPACE["6xl"], textAlign: "center" }}>
            <Search size={24} color={COLORS.textFaint} style={{ marginBottom: 10 }} />
            <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 14, margin: 0 }}>
              No matches for "{query}"{genreFilter !== "All" ? ` in ${genreFilter}` : ""}.
            </p>
          </div>
        ) : (
          <div className="ll-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: SPACE.lg }}>
            {results.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                matchedLine={t.matchedLine}
                likeInfo={likes[t.id]}
                onOpen={() => onOpenTrack(t, t.matchedLine ? t.timestamps[t.lines.indexOf(t.matchedLine)] : undefined)}
                onOpenArtist={onOpenArtist}
                onLike={onLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Root ----------
export default function App() {
  const [authChecked, setAuthChecked] = useState(false); // avoids landing-page flash on refresh
  const [entered, setEntered] = useState(false); // landing -> auth gate
  const [user, setUser] = useState(null); // { uid, name, role }
  const [view, setView] = useState("home");
  const [tracks, setTracks] = useState([]);
  const [tracksError, setTracksError] = useState("");
  const [draftTrack, setDraftTrack] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [openTrack, setOpenTrack] = useState(null);
  const [openArtist, setOpenArtist] = useState(null);
  const [initialSeek, setInitialSeek] = useState(undefined);
  const [connections, setConnections] = useState({ spotify: false, appleMusic: false, youtubeMusic: false });
  const [myLikedIds, setMyLikedIds] = useState({}); // { [trackId]: true } — this user's likes only
  const [channelPromptDismissed, setChannelPromptDismissed] = useState(false);

  // Real session: Firebase persists the login, so refreshing the page keeps you signed in.
  useEffect(() => {
    const unsub = watchAuth((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) setEntered(true);
    });
    return unsub;
  }, []);

  // Realtime catalog: every signed-in user sees the same live Firestore data.
  useEffect(() => {
    if (!user) {
      setTracks([]);
      return;
    }
    const unsub = watchTracks(
      (list) => setTracks(list),
      (err) => setTracksError(err.message || "Couldn't load the catalog.")
    );
    return unsub;
  }, [user]);

  // Refresh "did I like this" flags whenever the visible track list changes.
  useEffect(() => {
    if (!user || tracks.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        tracks.map(async (t) => [t.id, await getMyLikeStatus(t.id, user.uid)])
      );
      if (!cancelled) {
        setMyLikedIds(Object.fromEntries(entries.filter(([, liked]) => liked)));
      }
    })();
    return () => { cancelled = true; };
  }, [user, tracks]);

  const likes = useMemo(() => {
    const map = {};
    for (const t of tracks) {
      map[t.id] = { likes: t.likesCount ?? 0, liked: !!myLikedIds[t.id] };
    }
    return map;
  }, [tracks, myLikedIds]);

  const toggleConnection = (id) => setConnections((prev) => ({ ...prev, [id]: !prev[id] }));

  const openTrackAt = (t, seekTime) => {
    setOpenTrack(t);
    setInitialSeek(seekTime);
    setView("player");
  };

  const toggleLike = async (trackId) => {
    if (!user) return;
    // Optimistic UI, then reconcile with the real transaction result.
    setMyLikedIds((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
    try {
      const result = await toggleTrackLike(trackId, user.uid);
      setMyLikedIds((prev) => ({ ...prev, [trackId]: result.liked }));
    } catch (err) {
      // Roll back on failure (e.g. offline, track deleted).
      setMyLikedIds((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
    }
  };

  const artistCount = new Set(tracks.map((t) => t.artist)).size;

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONT_IMPORT}</style>
        <span style={{ fontFamily: "Inter, sans-serif", color: COLORS.plum, fontSize: 13 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {!user && !entered && (
        <LandingPage onGetStarted={() => setEntered(true)} trackCount={tracks.length} artistCount={artistCount} />
      )}

      {!user && entered && <AuthScreen onBack={() => setEntered(false)} />}

      {user && user.role === "artist" && !user.youtubeChannelId && !channelPromptDismissed && (
        <LinkChannelScreen
          uid={user.uid}
          onLinked={(channelId) => {
            setUser((u) => ({ ...u, youtubeChannelId: channelId }));
            setChannelPromptDismissed(true);
          }}
          onSkip={() => setChannelPromptDismissed(true)}
        />
      )}

      {user && (user.role !== "artist" || user.youtubeChannelId || channelPromptDismissed) && view === "home" && (
        <Home
          user={user}
          tracks={tracks}
          likes={likes}
          connections={connections}
          onLogout={() => {
            signOut();
            setView("home");
          }}
          onUploadStart={() => setView("upload")}
          onOpenConnections={() => setView("connections")}
          onOpenDiscover={() => setView("discover")}
          onOpenAITools={() => setView("aitools")}
          onOpenSitemap={() => setView("sitemap")}
          onOpenDashboard={() => setView("dashboard")}
          onOpenVideoStudio={() => setView("videostudio")}
          onOpenTrack={openTrackAt}
          onOpenArtist={(name) => {
            setOpenArtist(name);
            setView("artist");
          }}
          onLike={toggleLike}
        />
      )}

      {tracksError && view === "home" && (
        <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", background: COLORS.inkRaised, border: "1px solid #E27D6B", color: "#E27D6B", padding: "10px 16px", borderRadius: 9, fontFamily: "Inter, sans-serif", fontSize: 12 }}>
          {tracksError}
        </div>
      )}

      {user && view === "discover" && <Discover onBack={() => setView("home")} />}

      {user && view === "aitools" && <AITools onBack={() => setView("home")} />}

      {user && view === "pricing" && <Pricing onBack={() => setView("home")} />}

      {user && view === "features" && <Features onBack={() => setView("home")} />}

      {user && view === "about" && <About onBack={() => setView("home")} />}

      {user && view === "songmeaning" && <SongMeaning onBack={() => setView("home")} />}

      {user && view === "dashboard" && <ArtistDashboard onBack={() => setView("home")} tracks={tracks} user={user} />}

      {user && view === "videostudio" && (
        <LyricVideoStudio
          onBack={() => setView("home")}
          myTracks={tracks.filter((t) => t.artistUid === user.uid)}
        />
      )}

      {user && view === "community" && <Community onBack={() => setView("home")} />}

      {user && view === "sitemap" && (
        <Sitemap onBack={() => setView("home")} onNavigate={(id) => setView(id)} />
      )}

      {user && view === "artist" && openArtist && (
        <ArtistPage
          artistName={openArtist}
          tracks={tracks}
          likes={likes}
          onBack={() => setView("home")}
          onOpenTrack={openTrackAt}
        />
      )}

      {user && view === "connections" && (
        <ConnectionsPanel connections={connections} onToggle={toggleConnection} onBack={() => setView("home")} />
      )}

      {user && view === "upload" && (
        <UploadScreen
          user={user}
          onCancel={() => setView("home")}
          onCreated={(t) => {
            setDraftTrack(t);
            setPublishError("");
            setView("preparing");
          }}
        />
      )}

      {user && view === "preparing" && draftTrack && (
        <PreparingScreen
          onDone={(withUploadedURLs) => {
            setDraftTrack(withUploadedURLs);
            setView("sync");
          }}
          onError={(msg) => {
            setPublishError(msg);
            setView("upload");
          }}
          uploadAudio={() => uploadFile(user.uid, "audio", draftTrack.audioFile)}
          uploadCover={draftTrack.coverFile ? () => uploadFile(user.uid, "covers", draftTrack.coverFile) : null}
          draftTrack={draftTrack}
        />
      )}

      {user && view === "sync" && draftTrack && (
        <SyncScreen
          track={draftTrack}
          onCancel={() => setView("upload")}
          busy={publishing}
          errorMessage={publishError}
          onDone={async (timestamps) => {
            setPublishing(true);
            setPublishError("");
            try {
              // Files are already uploaded (see PreparingScreen) — this step
              // just writes the finished, timestamped track to Firestore.
              const id = await createTrack({
                title: draftTrack.title,
                artist: draftTrack.artist,
                artistUid: user.uid,
                genre: draftTrack.genre,
                tags: draftTrack.tags,
                lines: draftTrack.lines,
                timestamps,
                coverURL: draftTrack.coverURL,
                audioURL: draftTrack.audioURL,
              });

              openTrackAt({ ...draftTrack, id, timestamps, likesCount: 0 }, undefined);
              setDraftTrack(null);
            } catch (err) {
              setPublishError(err.message || "Publishing failed. Please try again.");
            } finally {
              setPublishing(false);
            }
          }}
        />
      )}

      {user && view === "player" && openTrack && (
        <PlayerScreen
          track={openTrack}
          initialSeek={initialSeek}
          onBack={() => setView("home")}
          onOpenArtist={(name) => {
            setOpenArtist(name);
            setView("artist");
          }}
          likeInfo={likes[openTrack.id]}
          onToggleLike={toggleLike}
        />
      )}
    </div>
  );
}
