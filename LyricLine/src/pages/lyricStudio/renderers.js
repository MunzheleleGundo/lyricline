// ============================================================
// Lyric video canvas renderers
// Each renderer draws one frame given the current active line index.
// Background is intentionally a hard black (not the site's white
// COLORS.background token) — a lyric video is its own surface, and
// black is the default until a person picks a different template.
// ============================================================
import { COLORS } from "../../theme/tokens";

export const W = 720, H = 720; // square export, good for social
export const BG_BLACK = "#000000";

export const TEMPLATES = [
  { id: "karaoke", name: "Karaoke Glow", desc: "Big centered current line, dim lines above/below." },
  { id: "minimal", name: "Minimal Type", desc: "Clean single-line type on a plain background." },
  { id: "waveform", name: "Waveform Pulse", desc: "Live audio-reactive bars behind the lyric." },
];

export function drawBackground(ctx, coverImg) {
  ctx.fillStyle = BG_BLACK;
  ctx.fillRect(0, 0, W, H);
  if (coverImg) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.filter = "blur(18px)";
    ctx.drawImage(coverImg, -40, -40, W + 80, H + 80);
    ctx.restore();
    ctx.filter = "none";
  }
}

export function wrapLine(ctx, text, maxWidth) {
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

function renderKaraoke(ctx, { track, lines, activeIdx, coverImg }) {
  drawBackground(ctx, coverImg);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const positions = [-1, 0, 1];
  positions.forEach((offset) => {
    const idx = activeIdx + offset;
    if (idx < 0 || idx >= lines.length) return;
    const isActive = offset === 0;
    ctx.font = isActive ? "700 34px Fraunces, serif" : "400 20px Fraunces, serif";
    ctx.fillStyle = isActive ? COLORS.primary : "rgba(255,255,255,0.35)";
    const wrapped = wrapLine(ctx, lines[idx], W - 100);
    const lineHeight = isActive ? 42 : 28;
    const startY = H / 2 + offset * 90 - ((wrapped.length - 1) * lineHeight) / 2;
    wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));
  });

  ctx.font = "600 14px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`${track.title} · ${track.artist}`, W / 2, H - 40);
}

function renderMinimal(ctx, { track, lines, activeIdx, coverImg }) {
  drawBackground(ctx, coverImg);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const line = lines[activeIdx] ?? "";
  ctx.font = "600 30px Inter, sans-serif";
  ctx.fillStyle = "#F2EFE9";
  const wrapped = wrapLine(ctx, line, W - 120);
  const lineHeight = 40;
  const startY = H / 2 - ((wrapped.length - 1) * lineHeight) / 2;
  wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));

  ctx.font = "500 13px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText(`${track.title} · ${track.artist}`, W / 2, H - 50);
}

function renderWaveform(ctx, { track, lines, activeIdx, coverImg, freqData }) {
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
  ctx.fillStyle = "#F2EFE9";
  const line = lines[activeIdx] ?? "";
  const wrapped = wrapLine(ctx, line, W - 120);
  const lineHeight = 34;
  const startY = H / 2 - 60 - ((wrapped.length - 1) * lineHeight) / 2;
  wrapped.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineHeight));
}

export const RENDERERS = { karaoke: renderKaraoke, minimal: renderMinimal, waveform: renderWaveform };

// Skips un-tagged (null) timestamps instead of letting them coerce to 0,
// which previously made the active line stick on partially-synced tracks.
export function activeIdxFor(timestamps, current) {
  let idx = -1;
  for (let i = 0; i < (timestamps?.length || 0); i++) {
    if (timestamps[i] === null || timestamps[i] === undefined) continue;
    if (timestamps[i] <= current) idx = i;
    else break;
  }
  return Math.max(0, idx);
}
