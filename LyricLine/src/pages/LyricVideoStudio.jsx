import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Download, Video, Loader2, Pencil } from "lucide-react";
import { COLORS, TYPE, cardStyle, primaryBtn, ghostBtn, pillStyle } from "../theme/tokens";
import PageShell from "./PageShell";
import { updateTrackLines } from "../firebase/tracksService";
import { W, H, TEMPLATES, RENDERERS, activeIdxFor } from "./lyricStudio/renderers";
import LyricLineEditor from "./lyricStudio/LyricLineEditor";

export default function LyricVideoStudio({ onBack, myTracks }) {
  const [selectedId, setSelectedId] = useState(myTracks[0]?.id || "");
  const [templateId, setTemplateId] = useState("karaoke");
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [error, setError] = useState("");
  const [lines, setLines] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const audioCtxRef = useRef(null);
  const coverImgRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const destRef = useRef(null);
  const linesRef = useRef([]); // mirrors `lines` for the rAF draw loop, which reads outside React's render cycle

  const track = myTracks.find((t) => t.id === selectedId) || null;

  // The lyrics shown/edited here are a local, editable copy of the track's
  // lines — reset whenever the selected track changes.
  useEffect(() => {
    setLines(track?.lines ? [...track.lines] : []);
    setEditingIdx(null);
  }, [track?.id]);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Load cover art once per track (crossOrigin required so the canvas isn't
  // "tainted" — see cors.json in the project root / README for setup).
  useEffect(() => {
    coverImgRef.current = null;
    if (!track?.coverURL) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { coverImgRef.current = img; };
    img.onerror = () => { coverImgRef.current = null; };
    img.src = track.coverURL;
  }, [track?.coverURL]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const a = audioRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext("2d");
    const current = a?.currentTime || 0;
    const currentLines = linesRef.current;
    const activeIdx = activeIdxFor(track.timestamps, current);

    if (analyserRef.current && freqDataRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
    }

    const renderer = RENDERERS[templateId] || RENDERERS.karaoke;
    renderer(ctx, { track, lines: currentLines, activeIdx, coverImg: coverImgRef.current, freqData: freqDataRef.current });

    rafRef.current = requestAnimationFrame(draw);
  }, [track, templateId]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const ensureAudioGraph = () => {
    if (audioCtxRef.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AC();
    const source = audioCtx.createMediaElementSource(audioRef.current);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const dest = audioCtx.createMediaStreamDestination();

    source.connect(analyser);
    analyser.connect(audioCtx.destination); // still hear it while previewing
    analyser.connect(dest); // also feed the recording destination

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    destRef.current = dest;
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    ensureAudioGraph();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  // Opens the editor for whichever line is currently active/on-screen —
  // "click the lyric area to edit the current line".
  const handleCanvasActivate = () => {
    if (recording) return;
    const current = audioRef.current?.currentTime || 0;
    const idx = activeIdxFor(track.timestamps, current);
    if (idx < 0 || idx >= lines.length) return;
    setEditingIdx(idx);
  };

  const saveEdit = (text) => {
    if (editingIdx === null) return;
    if (text) {
      const next = [...lines];
      next[editingIdx] = text;
      setLines(next);
      if (track?.id) updateTrackLines(track.id, next);
    }
    setEditingIdx(null);
  };

  const startRecording = () => {
    const canvas = canvasRef.current;
    const a = audioRef.current;
    if (!canvas || !a || !track) return;
    setError("");
    setVideoURL(null);
    ensureAudioGraph();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();

    const canvasStream = canvas.captureStream(30);
    const combined = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destRef.current.stream.getAudioTracks(),
    ]);

    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";

    try {
      const recorder = new MediaRecorder(combined, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoURL(URL.createObjectURL(blob));
        setRecording(false);
      };
      recorder.onerror = () => setError("Recording failed — this browser may not support canvas capture.");
      recorderRef.current = recorder;

      a.currentTime = 0;
      a.play();
      setPlaying(true);
      recorder.start();
      setRecording(true);

      a.onended = () => {
        recorder.stop();
        setPlaying(false);
      };
    } catch (err) {
      setError("Couldn't start recording: " + (err.message || "unsupported in this browser."));
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    audioRef.current?.pause();
    setPlaying(false);
  };

  if (!track) {
    return (
      <PageShell onBack={onBack} eyebrow="Lyric video studio" title="No tracks to work with yet" maxWidth={640}>
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <Video size={22} color={COLORS.textFaint} style={{ marginBottom: 10 }} />
          <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 13, margin: 0 }}>
            Publish a track first — the lyric video studio renders from a track you own.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell onBack={onBack} eyebrow="Lyric video studio" title="Make a lyric video" subtitle="Renders in your browser from the real synced timestamps — export is a real .webm file." maxWidth={820}>
      <audio ref={audioRef} src={track.audioURL} crossOrigin="anonymous" style={{ display: "none" }} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Track</div>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setVideoURL(null); }}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
            border: `1px solid ${COLORS.border}`, background: COLORS.background, color: COLORS.textPrimary,
            fontFamily: TYPE.body, fontSize: 14,
          }}
        >
          {myTracks.map((t) => (
            <option key={t.id} value={t.id}>{t.title} — {t.artist}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TEMPLATES.map((t) => (
          <button key={t.id} style={pillStyle(templateId === t.id)} onClick={() => setTemplateId(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      <p style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textFaint, marginTop: -12, marginBottom: 20 }}>
        {TEMPLATES.find((t) => t.id === templateId)?.desc}
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div style={{ position: "relative", width: "min(100%, 420px)" }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleCanvasActivate}
            onTouchStart={handleCanvasActivate}
            style={{
              width: "100%", aspectRatio: "1 / 1", borderRadius: 14, border: `1px solid ${COLORS.border}`,
              display: "block", cursor: recording ? "default" : "pointer",
            }}
          />
          {!recording && editingIdx === null && (
            <div
              style={{
                position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999,
                background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.75)",
                fontFamily: TYPE.body, fontSize: 11, pointerEvents: "none",
              }}
            >
              <Pencil size={11} /> Tap the video to edit this line
            </div>
          )}
          {editingIdx !== null && (
            <LyricLineEditor
              lineIndex={editingIdx}
              value={lines[editingIdx] ?? ""}
              onSave={saveEdit}
              onCancel={() => setEditingIdx(null)}
            />
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={togglePlay} disabled={recording} style={{ ...ghostBtn, opacity: recording ? 0.4 : 1, display: "flex", alignItems: "center", gap: 6 }}>
          {playing ? <Pause size={15} /> : <Play size={15} />} Preview
        </button>
        {!recording ? (
          <button onClick={startRecording} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6 }}>
            <Video size={15} /> Record video
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...primaryBtn, background: "#E27D6B", display: "flex", alignItems: "center", gap: 6 }}>
            <Loader2 size={15} className="spin" /> Stop recording
          </button>
        )}
      </div>

      {error && <p style={{ color: "#E27D6B", fontSize: 12, textAlign: "center", marginTop: 16, fontFamily: TYPE.body }}>{error}</p>}

      {videoURL && (
        <div style={{ ...cardStyle, padding: 20, marginTop: 24, textAlign: "center" }}>
          <video src={videoURL} controls style={{ width: "100%", maxWidth: 360, borderRadius: 10, marginBottom: 14 }} />
          <div>
            <a
              href={videoURL}
              download={`${track.title.replace(/[^a-z0-9]/gi, "_")}-lyric-video.webm`}
              style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
            >
              <Download size={15} /> Download .webm
            </a>
          </div>
        </div>
      )}

      <p style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textFaint, marginTop: 20, lineHeight: 1.6 }}>
        Recording plays the full track in real time to capture it (there's no way to render faster
        client-side). Exports as .webm — universally playable, but if you need .mp4 for a specific
        platform, run it through a converter afterward. Tap the preview any time to fix a line — edits
        save to the track and show up the next time you record.
      </p>
    </PageShell>
  );
}
