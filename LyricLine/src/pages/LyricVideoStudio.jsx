import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Download, Video, Loader2 } from "lucide-react";
import { COLORS, TYPE, cardStyle, primaryBtn, ghostBtn, pillStyle } from "../theme/tokens";
import PageShell from "./PageShell";

const TEMPLATES = [
  { id: "karaoke", name: "Karaoke Glow", desc: "Big centered current line, dim lines above/below." },
  { id: "minimal", name: "Minimal Type", desc: "Clean single-line type on a plain background." },
  { id: "waveform", name: "Waveform Pulse", desc: "Live audio-reactive bars behind the lyric." },
];

const W = 720, H = 720; // square export, good for social

function drawBackground(ctx, coverImg) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, W, H);
  if (coverImg) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.filter = "blur(18px)";
    ctx.drawImage(coverImg, -40, -40, W + 80, H + 80);
    ctx.restore();
    ctx.filter = "none";
  }
}

function wrapLine(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function renderKaraoke(ctx, { track, activeIdx, coverImg }) {
  drawBackground(ctx, coverImg);
  const lines = track.lines;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const positions = [-1, 0, 1];
  positions.forEach((offset) => {
    const idx = activeIdx + offset;
    if (idx < 0 || idx >= lines.length) return;
    const isActive = offset === 0;
    ctx.font = isActive ? "700 34px Fraunces, serif" : "400 20px Fraunces, serif";
    ctx.fillStyle = isActive ? COLORS.gold : "rgba(242,239,233,0.35)";
    const wrapped = wrapLine(ctx, lines[idx], W - 100);
    const lineHeight = isActive ? 42 : 28;
    const startY = H / 2 + offset * 90 - ((wrapped.length - 1) * lineHeight) / 2;
    wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));
  });

  ctx.font = "600 14px Inter, sans-serif";
  ctx.fillStyle = "rgba(242,239,233,0.5)";
  ctx.fillText(`${track.title} · ${track.artist}`, W / 2, H - 40);
}

function renderMinimal(ctx, { track, activeIdx, coverImg }) {
  drawBackground(ctx, coverImg);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const line = track.lines[activeIdx] ?? "";
  ctx.font = "600 30px Inter, sans-serif";
  ctx.fillStyle = COLORS.cream;
  const wrapped = wrapLine(ctx, line, W - 120);
  const lineHeight = 40;
  const startY = H / 2 - ((wrapped.length - 1) * lineHeight) / 2;
  wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));

  ctx.font = "500 13px Inter, sans-serif";
  ctx.fillStyle = COLORS.plum;
  ctx.fillText(`${track.title} · ${track.artist}`, W / 2, H - 50);
}

function renderWaveform(ctx, { track, activeIdx, coverImg, freqData }) {
  drawBackground(ctx, coverImg);

  if (freqData && freqData.length) {
    const bars = 48;
    const step = Math.floor(freqData.length / bars);
    const barWidth = W / bars;
    ctx.fillStyle = "rgba(232,185,77,0.55)";
    for (let i = 0; i < bars; i++) {
      const v = freqData[i * step] / 255;
      const barH = v * 160;
      ctx.fillRect(i * barWidth + 2, H - 120 - barH, barWidth - 4, barH);
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 26px Fraunces, serif";
  ctx.fillStyle = COLORS.cream;
  const line = track.lines[activeIdx] ?? "";
  const wrapped = wrapLine(ctx, line, W - 120);
  const lineHeight = 34;
  const startY = H / 2 - 60 - ((wrapped.length - 1) * lineHeight) / 2;
  wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));
}

const RENDERERS = { karaoke: renderKaraoke, minimal: renderMinimal, waveform: renderWaveform };

export default function LyricVideoStudio({ onBack, myTracks }) {
  const [selectedId, setSelectedId] = useState(myTracks[0]?.id || "");
  const [templateId, setTemplateId] = useState("karaoke");
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [error, setError] = useState("");

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

  const track = myTracks.find((t) => t.id === selectedId) || null;

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

  const activeIdxFor = useCallback((t, current) => {
    let idx = -1;
    for (let i = 0; i < (t.timestamps?.length || 0); i++) {
      if (t.timestamps[i] <= current) idx = i;
      else break;
    }
    return Math.max(0, idx);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const a = audioRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext("2d");
    const current = a?.currentTime || 0;
    const activeIdx = activeIdxFor(track, current);

    if (analyserRef.current && freqDataRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
    }

    const renderer = RENDERERS[templateId] || renderKaraoke;
    renderer(ctx, { track, activeIdx, coverImg: coverImgRef.current, freqData: freqDataRef.current });

    rafRef.current = requestAnimationFrame(draw);
  }, [track, templateId, activeIdxFor]);

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
          <Video size={22} color={COLORS.plumDim} style={{ marginBottom: 10 }} />
          <p style={{ color: COLORS.plum, fontFamily: TYPE.body, fontSize: 13, margin: 0 }}>
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
        <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plum, marginBottom: 8 }}>Track</div>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setVideoURL(null); }}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
            border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.cream,
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
      <p style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plumDim, marginTop: -12, marginBottom: 20 }}>
        {TEMPLATES.find((t) => t.id === templateId)?.desc}
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "min(100%, 420px)", aspectRatio: "1 / 1", borderRadius: 14, border: `1px solid ${COLORS.line}` }}
        />
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

      <p style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plumDim, marginTop: 20, lineHeight: 1.6 }}>
        Recording plays the full track in real time to capture it (there's no way to render faster
        client-side). Exports as .webm — universally playable, but if you need .mp4 for a specific
        platform, run it through a converter afterward.
      </p>
    </PageShell>
  );
}
