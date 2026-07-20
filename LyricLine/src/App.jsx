import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic2, Music4, Upload, Play, Pause, Plus, LogOut, User, Clock, Check, ListMusic } from "lucide-react";

/*
  LyricLine — a self-publish synced-lyrics platform
  Flow: sign in -> upload track + lyrics -> tap-to-sync timestamps -> synced player
  Everything lives in memory (React state) for this demo; no backend.
*/

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
`;

const COLORS = {
  ink: "#14161F",
  inkRaised: "#1C1F2B",
  cream: "#F2EFE9",
  gold: "#E8B94D",
  plum: "#8C7AA0",
  plumDim: "#4A4258",
  line: "#2A2E3D",
};

function fmtTime(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(2);
  return `${m}:${s.padStart(5, "0")}`;
}

// ---------- Auth ----------
function AuthScreen({ onSignIn }) {
  const [mode] = useState("signin");
  const [name, setName] = useState("");
  const [role, setRole] = useState("artist");

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, justifyContent: "center" }}>
          <Mic2 color={COLORS.gold} size={28} strokeWidth={1.75} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, letterSpacing: "-0.01em" }}>LyricLine</span>
        </div>
        <div style={{ background: COLORS.inkRaised, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 32 }}>
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
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioURL(URL.createObjectURL(f));
    setAudioName(f.name);
  };

  const canContinue = title.trim() && artist.trim() && lyricsText.trim() && audioURL;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, color: COLORS.cream, margin: "0 0 6px" }}>Publish a track</h1>
        <p style={{ color: COLORS.plum, fontSize: 14, margin: "0 0 32px" }}>Add your song, then paste the lyrics line by line. You'll sync timestamps next.</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Song title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midnight Static" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Artist name</label>
            <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Rosa Winters" style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Audio file</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${audioURL ? COLORS.gold : COLORS.line}`, borderRadius: 12, padding: 20,
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 16,
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

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={ghostBtn}>Cancel</button>
          <button
            disabled={!canContinue}
            onClick={() =>
              onCreated({
                title: title.trim(),
                artist: artist.trim(),
                audioURL,
                lines: lyricsText.split("\n").map((t) => t.trim()).filter(Boolean),
              })
            }
            style={{ ...primaryBtn, opacity: canContinue ? 1 : 0.4, cursor: canContinue ? "pointer" : "not-allowed" }}
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
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <div style={{ width: "100%", maxWidth: 560 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, margin: "0 0 4px" }}>Tap to sync</h1>
        <p style={{ color: COLORS.plum, fontSize: 13, margin: "0 0 24px" }}>
          Play the track. Press <b style={{ color: COLORS.gold }}>Space</b> or tap the button exactly when each line begins.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={togglePlay} style={{ ...primaryBtn, padding: 12, borderRadius: "50%", display: "flex" }}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.plum, fontSize: 13 }}>{fmtTime(current)}</div>
          <button
            onClick={tapLine}
            disabled={!playing || activeIdx >= track.lines.length}
            style={{ ...ghostBtn, flex: 1, textAlign: "center", opacity: !playing || activeIdx >= track.lines.length ? 0.4 : 1 }}
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
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: COLORS.plum, minWidth: 56, textAlign: "right" }}>
                {timestamps[i] !== null ? fmtTime(timestamps[i]) : "—"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onCancel} style={ghostBtn}>Back</button>
          <button
            disabled={!allTagged}
            onClick={() => onDone(timestamps)}
            style={{ ...primaryBtn, flex: 1, opacity: allTagged ? 1 : 0.4, cursor: allTagged ? "pointer" : "not-allowed" }}
          >
            {allTagged ? "Publish track" : `${timestamps.filter((t) => t !== null).length}/${track.lines.length} lines tagged`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Player ----------
function PlayerScreen({ track, onBack }) {
  const audioRef = useRef(null);
  const lineRefs = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const activeIdx = (() => {
    let idx = -1;
    for (let i = 0; i < track.timestamps.length; i++) {
      if (track.timestamps[i] <= current) idx = i;
      else break;
    }
    return idx;
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
    <div style={{ minHeight: "100vh", background: COLORS.ink, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
      <audio ref={audioRef} src={track.audioURL} />
      <button onClick={onBack} style={{ ...ghostBtn, alignSelf: "flex-start", marginBottom: 24 }}>← Back</button>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 28, color: COLORS.cream }}>{track.title}</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.gold, marginTop: 4 }}>{track.artist}</div>
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
              color: i === activeIdx ? COLORS.gold : i < activeIdx ? COLORS.plumDim : COLORS.plum,
              transition: "all .25s ease",
            }}
          >
            {line}
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

// ---------- Library / home ----------
function Home({ user, tracks, onLogout, onUploadStart, onOpenTrack }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: `1px solid ${COLORS.line}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mic2 color={COLORS.gold} size={20} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: COLORS.cream }}>LyricLine</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 13 }}>
            <User size={14} /> {user.name} · {user.role}
          </div>
          <button onClick={onLogout} style={{ ...ghostBtn, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.cream, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <ListMusic size={22} color={COLORS.gold} /> Catalog
          </h1>
          {user.role === "artist" && (
            <button onClick={onUploadStart} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Plus size={16} /> Publish a track
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <div style={{ border: `1px dashed ${COLORS.line}`, borderRadius: 12, padding: 48, textAlign: "center" }}>
            <Music4 size={28} color={COLORS.plumDim} style={{ marginBottom: 10 }} />
            <p style={{ color: COLORS.plum, fontFamily: "Inter, sans-serif", fontSize: 14, margin: 0 }}>
              Nothing published yet. {user.role === "artist" ? "Publish your first track to get started." : "Check back once an artist publishes a track."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {tracks.map((t, i) => (
              <div
                key={i}
                onClick={() => onOpenTrack(t)}
                style={{
                  background: COLORS.inkRaised, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 20, cursor: "pointer",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(232,185,77,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Music4 size={18} color={COLORS.gold} />
                </div>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17, color: COLORS.cream, marginBottom: 2 }}>{t.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: COLORS.plum }}>{t.artist}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Root ----------
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home"); // home | upload | sync | player
  const [tracks, setTracks] = useState([]);
  const [draftTrack, setDraftTrack] = useState(null);
  const [openTrack, setOpenTrack] = useState(null);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      {!user && <AuthScreen onSignIn={setUser} />}

      {user && view === "home" && (
        <Home
          user={user}
          tracks={tracks}
          onLogout={() => setUser(null)}
          onUploadStart={() => setView("upload")}
          onOpenTrack={(t) => {
            setOpenTrack(t);
            setView("player");
          }}
        />
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
            setOpenTrack(finished);
            setDraftTrack(null);
            setView("player");
          }}
        />
      )}

      {user && view === "player" && openTrack && (
        <PlayerScreen track={openTrack} onBack={() => setView("home")} />
      )}
    </div>
  );
}
