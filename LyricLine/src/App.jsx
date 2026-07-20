import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Mic2, Music4, Upload, Play, Pause, Plus, LogOut, User, Clock, Check,
  ListMusic, Link2, Unlink, Search, Heart, Image as ImageIcon, ChevronLeft,
  TrendingUp, Sparkles, Tag, ArrowRight, X, Compass, Wand2, Layers,
} from "lucide-react";
import { FONT_IMPORT, COLORS } from "./theme/tokens";
import Discover from "./pages/Discover";
import AITools from "./pages/AITools";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import About from "./pages/About";
import SongMeaning from "./pages/SongMeaning";
import ArtistDashboard from "./pages/ArtistDashboard";
import Community from "./pages/Community";
import Sitemap from "./pages/Sitemap";

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
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "40px 20px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 24 }}>← Back</button>

        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, margin: "0 0 6px" }}>Connections</h1>
        <p style={{ color: COLORS.plum, fontSize: 14, margin: "0 0 28px", lineHeight: 1.5 }}>
          Link a streaming account to bring in tracks and match them with synced lyrics. This is a preview —
          connecting here doesn't send any data anywhere yet.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MUSIC_SERVICES.map((s) => {
            const isConnected = !!connections[s.id];
            return (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: 18, flexWrap: "wrap",
                  background: COLORS.inkRaised, border: `1px solid ${isConnected ? s.color + "55" : COLORS.line}`,
                  borderRadius: 12,
                }}
              >
                <ServiceMark color={s.color} />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.cream }}>{s.name}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.plum, marginTop: 2 }}>
                    {isConnected ? "Connected" : s.blurb}
                  </div>
                </div>
                <button
                  onClick={() => onToggle(s.id)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    border: `1px solid ${isConnected ? COLORS.line : s.color}`,
                    background: isConnected ? "transparent" : s.color,
                    color: isConnected ? COLORS.plum : "#0B0D10",
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

        <p style={{ fontSize: 12, color: COLORS.plumDim, marginTop: 24, lineHeight: 1.6 }}>
          Real account linking isn't set up yet — each service needs its own API credentials before this can log in for real.
        </p>
      </div>
    </div>
  );
}

// ---------- Landing ----------
function LandingPage({ onGetStarted, trackCount, artistCount }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px clamp(16px, 5vw, 40px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mic2 color={COLORS.gold} size={20} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: COLORS.cream }}>LyricLine</span>
        </div>
        <button onClick={onGetStarted} style={{ ...ghostBtn, padding: "8px 16px" }}>Sign in</button>
      </div>

      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "40px clamp(16px, 6vw, 40px)",
        }}
      >
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
            border: `1px solid ${COLORS.line}`, color: COLORS.gold, fontFamily: "Inter, sans-serif", fontSize: 12,
            fontWeight: 700, marginBottom: 22,
          }}
        >
          <Sparkles size={13} /> Artist-owned, line-by-line synced lyrics
        </div>
        <h1
          style={{
            fontFamily: "Fraunces, serif", fontWeight: 700, color: COLORS.cream, margin: "0 0 18px",
            fontSize: "clamp(32px, 6vw, 56px)", lineHeight: 1.08, maxWidth: 780,
          }}
        >
          Lyrics that move <span style={{ color: COLORS.gold, fontStyle: "italic" }}>with</span> the song
        </h1>
        <p style={{ color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: "clamp(14px, 2vw, 17px)", maxWidth: 520, lineHeight: 1.6, margin: "0 0 32px" }}>
          A self-publish home for word-perfect, time-synced lyrics — built by artists, for artists.
          No scraped transcriptions, no ads over your words. Just the song, and the line that's playing right now.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onGetStarted} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            Get started <ArrowRight size={16} />
          </button>
          <button onClick={onGetStarted} style={{ ...ghostBtn, cursor: "pointer" }}>Browse the catalog</button>
        </div>

        <div style={{ display: "flex", gap: "clamp(20px, 6vw, 56px)", marginTop: 56, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Tracks published", value: trackCount },
            { label: "Artists", value: artistCount },
            { label: "Synced, not scraped", value: "100%" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: COLORS.gold, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.plum, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Auth ----------
function AuthScreen({ onSignIn, onBack }) {
  const [mode] = useState("signin");
  const [name, setName] = useState("");
  const [role, setRole] = useState("artist");

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <Mic2 color={COLORS.gold} size={28} strokeWidth={1.75} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, letterSpacing: "-0.01em" }}>LyricLine</span>
        </div>
        <div style={{ background: COLORS.inkRaised, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "clamp(20px, 5vw, 32px)" }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: COLORS.cream, margin: "0 0 6px" }}>
            {mode === "signin" ? "Welcome back" : "Set up your page"}
          </h1>
          <p style={{ color: COLORS.plum, fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>
            Artists publish their own lyrics here — you keep the rights, you set the sync.
          </p>

          <label style={{ display: "block", fontSize: 12, color: COLORS.plum, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rosa Winters"
            style={inputStyle}
          />

          <label style={{ display: "block", fontSize: 12, color: COLORS.plum, margin: "16px 0 6px", fontFamily: "Inter, sans-serif" }}>I am a...</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["artist", "listener"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 9, cursor: "pointer",
                  border: `1px solid ${role === r ? COLORS.gold : COLORS.line}`,
                  background: role === r ? "rgba(232,185,77,0.12)" : "transparent",
                  color: role === r ? COLORS.gold : COLORS.cream,
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            disabled={!name.trim()}
            onClick={() => onSignIn({ name: name.trim(), role })}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
              background: name.trim() ? COLORS.gold : COLORS.line,
              color: name.trim() ? "#1C1608" : COLORS.plum,
              fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
              cursor: name.trim() ? "pointer" : "not-allowed", transition: "opacity .15s",
            }}
          >
            Continue
          </button>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: COLORS.plum }}>
            By continuing you confirm any lyrics you upload are your own work, or that you hold the rights to publish them.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
  border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.cream,
  fontFamily: "Inter, sans-serif", fontSize: 14, outline: "none",
};

// ---------- Upload ----------
function UploadScreen({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [coverURL, setCoverURL] = useState(null);
  const [genre, setGenre] = useState(GENRES[0]);
  const [tagsText, setTagsText] = useState("");
  const fileRef = useRef(null);
  const coverRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioURL(URL.createObjectURL(f));
    setAudioName(f.name);
  };

  const handleCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverURL(URL.createObjectURL(f));
  };

  const canContinue = title.trim() && artist.trim() && lyricsText.trim() && audioURL;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "clamp(24px, 6vw, 48px) 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(24px, 4vw, 30px)", color: COLORS.cream, margin: "0 0 6px" }}>Publish a track</h1>
        <p style={{ color: COLORS.plum, fontSize: 14, margin: "0 0 32px" }}>Add your song, then paste the lyrics line by line. You'll sync timestamps next.</p>

        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div
            onClick={() => coverRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: 12, flexShrink: 0, cursor: "pointer",
              border: `1.5px dashed ${coverURL ? COLORS.gold : COLORS.line}`,
              backgroundImage: coverURL ? `url(${coverURL})` : "none",
              backgroundSize: "cover", backgroundPosition: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: coverURL ? undefined : "rgba(232,185,77,0.04)",
            }}
          >
            {!coverURL && <ImageIcon size={20} color={COLORS.plum} />}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
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

        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
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
          style={{
            border: `1.5px dashed ${audioURL ? COLORS.gold : COLORS.line}`, borderRadius: 12, padding: 20,
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16, flexWrap: "wrap",
            background: audioURL ? "rgba(232,185,77,0.06)" : "transparent",
          }}
        >
          <Upload size={20} color={audioURL ? COLORS.gold : COLORS.plum} />
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: audioURL ? COLORS.cream : COLORS.plum }}>
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
          style={{ ...inputStyle, resize: "vertical", fontFamily: "Fraunces, serif", lineHeight: 1.6, marginBottom: 24 }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onCancel} style={ghostBtn}>Cancel</button>
          <button
            disabled={!canContinue}
            onClick={() =>
              onCreated({
                id: uid(),
                title: title.trim(),
                artist: artist.trim(),
                audioURL,
                coverURL,
                genre,
                tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
                likes: 0,
                likedByMe: false,
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

const labelStyle = { display: "block", fontSize: 12, color: COLORS.plum, marginBottom: 6, fontFamily: "Inter, sans-serif" };
const primaryBtn = {
  padding: "12px 20px", borderRadius: 9, border: "none", background: COLORS.gold, color: "#1C1608",
  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14,
};
const ghostBtn = {
  padding: "12px 20px", borderRadius: 9, border: `1px solid ${COLORS.line}`, background: "transparent", color: COLORS.cream,
  fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
};

// ---------- Tap to sync ----------
function SyncScreen({ track, onDone, onCancel }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [timestamps, setTimestamps] = useState(Array(track.lines.length).fill(null));
  const [activeIdx, setActiveIdx] = useState(0);

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

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  const tapLine = useCallback(() => {
    if (activeIdx >= track.lines.length) return;
    setTimestamps((prev) => {
      const next = [...prev];
      next[activeIdx] = audioRef.current?.currentTime ?? 0;
      return next;
    });
    setActiveIdx((i) => Math.min(i + 1, track.lines.length));
  }, [activeIdx, track.lines.length]);

  // allow re-tapping a single mistimed line without redoing the rest
  const retapLine = useCallback((idx) => {
    setTimestamps((prev) => {
      const next = [...prev];
      next[idx] = audioRef.current?.currentTime ?? 0;
      return next;
    });
    setActiveIdx(idx + 1);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        tapLine();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tapLine]);

  const allTagged = timestamps.every((t) => t !== null);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "clamp(24px, 6vw, 40px) 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <div style={{ width: "100%", maxWidth: 560 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, margin: "0 0 4px" }}>Tap to sync</h1>
        <p style={{ color: COLORS.plum, fontSize: 13, margin: "0 0 24px" }}>
          Play the track. Press <b style={{ color: COLORS.gold }}>Space</b> or tap the button exactly when each line begins.
          Already tagged a line wrong? Click its timestamp to re-tap it.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <button onClick={togglePlay} style={{ ...primaryBtn, padding: 12, borderRadius: "50%", display: "flex" }}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.plum, fontSize: 13 }}>{fmtTime(current)}</div>
          <button
            onClick={tapLine}
            disabled={!playing || activeIdx >= track.lines.length}
            style={{ ...ghostBtn, flex: 1, minWidth: 160, textAlign: "center", opacity: !playing || activeIdx >= track.lines.length ? 0.4 : 1 }}
          >
            Tap line {Math.min(activeIdx + 1, track.lines.length)} of {track.lines.length}
          </button>
        </div>

        <div style={{ background: COLORS.inkRaised, border: `1px solid ${COLORS.line}`, borderRadius: 12, maxHeight: 340, overflowY: "auto" }}>
          {track.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                borderBottom: i < track.lines.length - 1 ? `1px solid ${COLORS.line}` : "none",
                background: i === activeIdx ? "rgba(232,185,77,0.08)" : "transparent",
              }}
            >
              <div style={{ width: 20 }}>
                {timestamps[i] !== null ? <Check size={15} color={COLORS.gold} /> : <span style={{ color: COLORS.plumDim, fontSize: 12 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1, fontFamily: "Fraunces, serif", fontSize: 15, color: i === activeIdx ? COLORS.cream : COLORS.plum }}>{line}</div>
              <button
                onClick={() => retapLine(i)}
                disabled={timestamps[i] === null}
                title="Re-tap at current playhead position"
                style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, minWidth: 56, textAlign: "right",
                  background: "none", border: "none", padding: 0,
                  color: timestamps[i] !== null ? COLORS.plum : COLORS.plumDim,
                  cursor: timestamps[i] !== null ? "pointer" : "default",
                }}
              >
                {timestamps[i] !== null ? fmtTime(timestamps[i]) : "—"}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={onCancel} style={ghostBtn}>Back</button>
          <button
            disabled={!allTagged}
            onClick={() => onDone(timestamps)}
            style={{ ...primaryBtn, flex: 1, minWidth: 180, opacity: allTagged ? 1 : 0.4, cursor: allTagged ? "pointer" : "not-allowed" }}
          >
            {allTagged ? "Publish track" : `${timestamps.filter((t) => t !== null).length}/${track.lines.length} lines tagged`}
          </button>
        </div>
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
    <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(24px, 6vw, 40px) 20px" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <div style={{ width: "100%", maxWidth: 560, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={onBack} style={ghostBtn}>← Back</button>
        {onToggleLike && (
          <button
            onClick={() => onToggleLike(track.id)}
            style={{
              ...ghostBtn, display: "flex", alignItems: "center", gap: 6,
              borderColor: likeInfo?.liked ? COLORS.gold : COLORS.line,
              color: likeInfo?.liked ? COLORS.gold : COLORS.cream,
            }}
          >
            <Heart size={14} fill={likeInfo?.liked ? COLORS.gold : "none"} /> {likeInfo?.likes ?? track.likes ?? 0}
          </button>
        )}
      </div>

      {track.coverURL && (
        <div
          style={{
            width: 96, height: 96, borderRadius: 14, marginBottom: 16, backgroundImage: `url(${track.coverURL})`,
            backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          }}
        />
      )}

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: "clamp(22px, 5vw, 28px)", color: COLORS.cream }}>{track.title}</div>
        <button
          onClick={() => onOpenArtist && onOpenArtist(track.artist)}
          style={{
            fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.gold, marginTop: 4, background: "none",
            border: "none", cursor: onOpenArtist ? "pointer" : "default", padding: 0, textDecoration: onOpenArtist ? "underline" : "none",
          }}
        >
          {track.artist}
        </button>
      </div>

      <div
        style={{
          width: "100%", maxWidth: 520, height: 360, overflowY: "auto", margin: "24px 0",
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
              fontFamily: "Fraunces, serif", fontWeight: i === activeIdx ? 700 : 400,
              fontSize: i === activeIdx ? 22 : 17,
              transition: "all .25s ease",
            }}
          >
            {i === activeIdx ? (
              <KaraokeLine text={line} progress={lineProgress} active />
            ) : (
              <span style={{ color: i < activeIdx ? COLORS.plumDim : COLORS.plum }}>{line}</span>
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
          style={{ width: "100%", accentColor: COLORS.gold }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.plum, marginTop: 2 }}>
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button onClick={togglePlay} style={{ ...primaryBtn, padding: 14, borderRadius: "50%", display: "flex" }}>
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
  const totalLikes = artistTracks.reduce((sum, t) => sum + (likes[t.id]?.likes ?? t.likes ?? 0), 0);
  const cover = artistTracks.find((t) => t.coverURL)?.coverURL;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink }}>
      <div style={{ padding: "20px clamp(16px, 5vw, 28px)", borderBottom: `1px solid ${COLORS.line}` }}>
        <button onClick={onBack} style={{ ...ghostBtn, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 32, flexWrap: "wrap" }}>
          <div
            style={{
              width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
              background: cover ? `url(${cover}) center/cover` : "rgba(232,185,77,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {!cover && <User size={30} color={COLORS.gold} />}
          </div>
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(24px, 4vw, 32px)", color: COLORS.cream, margin: 0 }}>{artistName}</h1>
            <div style={{ color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 4 }}>
              {artistTracks.length} track{artistTracks.length === 1 ? "" : "s"} · {totalLikes} like{totalLikes === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
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
  return (
    <div
      style={{
        background: COLORS.inkRaised, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 12,
      }}
      onClick={onOpen}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
            background: track.coverURL ? `url(${track.coverURL}) center/cover` : "rgba(232,185,77,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!track.coverURL && <Music4 size={18} color={COLORS.gold} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: COLORS.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {track.title}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenArtist && onOpenArtist(track.artist);
            }}
            style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.plum, background: "none", border: "none",
              padding: 0, cursor: onOpenArtist ? "pointer" : "default",
            }}
          >
            {track.artist}
          </button>
        </div>
      </div>

      {matchedLine && (
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 13, fontStyle: "italic", color: COLORS.gold, lineHeight: 1.4 }}>
          "…{matchedLine}…"
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "Inter, sans-serif", fontSize: 11, color: COLORS.plum, border: `1px solid ${COLORS.line}`,
            borderRadius: 20, padding: "3px 9px",
          }}
        >
          {track.genre}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike && onLike(track.id);
          }}
          style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: onLike ? "pointer" : "default", color: likeInfo?.liked ? COLORS.gold : COLORS.plum,
            fontFamily: "Inter, sans-serif", fontSize: 12,
          }}
        >
          <Heart size={13} fill={likeInfo?.liked ? COLORS.gold : "none"} /> {likeInfo?.likes ?? track.likes ?? 0}
        </button>
      </div>
    </div>
  );
}

// ---------- Library / home ----------
function Home({ user, tracks, likes, connections, onLogout, onUploadStart, onOpenTrack, onOpenConnections, onOpenArtist, onLike, onOpenDiscover, onOpenAITools, onOpenSitemap }) {
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
        const la = likes[a.id]?.likes ?? a.likes ?? 0;
        const lb = likes[b.id]?.likes ?? b.likes ?? 0;
        return lb - la;
      }
      return 0; // "recent" keeps publish order (array order), most recent last -> reverse below
    });
    if (sort === "recent") list = [...list].reverse();
    return list;
  }, [tracks, query, genreFilter, sort, likes]);

  const usedGenres = ["All", ...GENRES.filter((g) => tracks.some((t) => t.genre === g))];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(16px, 4vw, 28px)", borderBottom: `1px solid ${COLORS.line}`, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mic2 color={COLORS.gold} size={20} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: COLORS.cream }}>LyricLine</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={onOpenSitemap}
            style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, borderColor: COLORS.gold, color: COLORS.gold }}
          >
            <Layers size={14} /> Explore the vision
          </button>
          <button
            onClick={onOpenDiscover}
            style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Compass size={14} /> Discover
          </button>
          <button
            onClick={onOpenAITools}
            style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Wand2 size={14} /> AI tools
          </button>
          <button
            onClick={onOpenConnections}
            style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Link2 size={14} /> Connections{connectedCount > 0 ? ` (${connectedCount})` : ""}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 13 }}>
            <User size={14} /> {user.name} · {user.role}
          </div>
          <button onClick={onLogout} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(24px, 5vw, 40px) 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(22px, 4vw, 26px)", color: COLORS.cream, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ListMusic size={22} color={COLORS.gold} /> Catalog
          </h1>
          {user.role === "artist" && (
            <button onClick={onUploadStart} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Plus size={16} /> Publish a track
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} color={COLORS.plum} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, artists, tags, or a line of lyrics..."
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}
              >
                <X size={14} color={COLORS.plum} />
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
                  padding: "9px 12px", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  border: `1px solid ${sort === id ? COLORS.gold : COLORS.line}`,
                  background: sort === id ? "rgba(232,185,77,0.1)" : "transparent",
                  color: sort === id ? COLORS.gold : COLORS.plum,
                  fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {usedGenres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              style={{
                padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${genreFilter === g ? COLORS.gold : COLORS.line}`,
                background: genreFilter === g ? "rgba(232,185,77,0.1)" : "transparent",
                color: genreFilter === g ? COLORS.gold : COLORS.plum,
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {g !== "All" && <Tag size={11} />} {g}
            </button>
          ))}
        </div>

        {tracks.length === 0 ? (
          <div style={{ border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
            <Music4 size={28} color={COLORS.plumDim} style={{ marginBottom: 10 }} />
            <p style={{ color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 14, margin: 0 }}>
              Nothing published yet. {user.role === "artist" ? "Publish your first track to get started." : "Check back once an artist publishes a track."}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
            <Search size={24} color={COLORS.plumDim} style={{ marginBottom: 10 }} />
            <p style={{ color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 14, margin: 0 }}>
              No matches for "{query}"{genreFilter !== "All" ? ` in ${genreFilter}` : ""}.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
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
  const [entered, setEntered] = useState(false); // landing -> auth gate
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home"); // home | upload | sync | player | connections | artist
  const [tracks, setTracks] = useState([]);
  const [draftTrack, setDraftTrack] = useState(null);
  const [openTrack, setOpenTrack] = useState(null);
  const [openArtist, setOpenArtist] = useState(null);
  const [initialSeek, setInitialSeek] = useState(undefined);
  const [connections, setConnections] = useState({ spotify: false, appleMusic: false, youtubeMusic: false });
  const [likes, setLikes] = useState({}); // { [trackId]: { likes, liked } }

  const toggleConnection = (id) => setConnections((prev) => ({ ...prev, [id]: !prev[id] }));

  const openTrackAt = (t, seekTime) => {
    setOpenTrack(t);
    setInitialSeek(seekTime);
    setView("player");
  };

  const toggleLike = (trackId) => {
    setLikes((prev) => {
      const cur = prev[trackId] || { likes: tracks.find((t) => t.id === trackId)?.likes ?? 0, liked: false };
      const liked = !cur.liked;
      return { ...prev, [trackId]: { likes: cur.likes + (liked ? 1 : -1), liked } };
    });
  };

  const artistCount = new Set(tracks.map((t) => t.artist)).size;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {!user && !entered && (
        <LandingPage onGetStarted={() => setEntered(true)} trackCount={tracks.length} artistCount={artistCount} />
      )}

      {!user && entered && <AuthScreen onSignIn={setUser} onBack={() => setEntered(false)} />}

      {user && view === "home" && (
        <Home
          user={user}
          tracks={tracks}
          likes={likes}
          connections={connections}
          onLogout={() => {
            setUser(null);
            setEntered(false);
            setView("home");
          }}
          onUploadStart={() => setView("upload")}
          onOpenConnections={() => setView("connections")}
          onOpenDiscover={() => setView("discover")}
          onOpenAITools={() => setView("aitools")}
          onOpenSitemap={() => setView("sitemap")}
          onOpenTrack={openTrackAt}
          onOpenArtist={(name) => {
            setOpenArtist(name);
            setView("artist");
          }}
          onLike={toggleLike}
        />
      )}

      {user && view === "discover" && <Discover onBack={() => setView("home")} />}

      {user && view === "aitools" && <AITools onBack={() => setView("home")} />}

      {user && view === "pricing" && <Pricing onBack={() => setView("home")} />}

      {user && view === "features" && <Features onBack={() => setView("home")} />}

      {user && view === "about" && <About onBack={() => setView("home")} />}

      {user && view === "songmeaning" && <SongMeaning onBack={() => setView("home")} />}

      {user && view === "dashboard" && <ArtistDashboard onBack={() => setView("home")} />}

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
          onCancel={() => setView("home")}
          onCreated={(t) => {
            setDraftTrack(t);
            setView("sync");
          }}
        />
      )}

      {user && view === "sync" && draftTrack && (
        <SyncScreen
          track={draftTrack}
          onCancel={() => setView("upload")}
          onDone={(timestamps) => {
            const finished = { ...draftTrack, timestamps };
            setTracks((prev) => [...prev, finished]);
            openTrackAt(finished, undefined);
            setDraftTrack(null);
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
