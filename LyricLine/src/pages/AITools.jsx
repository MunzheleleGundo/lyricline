import React, { useState } from "react";
import {
  ChevronLeft, Sparkles, Languages, FileText, Smile, Tags, Wand2, PenLine, AudioLines,
} from "lucide-react";
import { COLORS, TYPE, cardStyle, ghostBtn, primaryBtn } from "../theme/tokens";

const TOOLS = [
  { id: "generator", icon: Wand2, name: "Lyric Generator", blurb: "Draft starting lines from a mood, genre, or theme." },
  { id: "translator", icon: Languages, name: "Lyric Translator", blurb: "Preview lyrics in another language, line by line." },
  { id: "summarizer", icon: FileText, name: "Lyric Summarizer", blurb: "A short synopsis of what a song is about." },
  { id: "meaning", icon: Sparkles, name: "Meaning Explainer", blurb: "Annotate lines with possible interpretations." },
  { id: "mood", icon: Smile, name: "Mood Detection", blurb: "Tag a track's overall emotional tone." },
  { id: "genre", icon: Tags, name: "Genre Detection", blurb: "Suggest a genre + subgenre from the lyrics." },
  { id: "rhyme", icon: AudioLines, name: "Rhyme Assistant", blurb: "Suggest rhyming words as you write." },
  { id: "songwriting", icon: PenLine, name: "Songwriting Assistant", blurb: "Get structure suggestions: verse, hook, bridge." },
];

function ToolPreview({ tool }) {
  return (
    <div style={{ ...cardStyle, padding: 20, marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <tool.icon size={18} color={COLORS.gold} />
        <span style={{ fontFamily: TYPE.display, fontSize: 17, color: COLORS.cream }}>{tool.name}</span>
        <span
          style={{
            marginLeft: "auto", fontFamily: TYPE.body, fontSize: 11, color: COLORS.plum,
            border: `1px solid ${COLORS.line}`, borderRadius: 20, padding: "3px 9px",
          }}
        >
          Preview — not wired up
        </span>
      </div>
      <textarea
        placeholder="Paste a lyric or describe what you're going for..."
        rows={4}
        disabled
        style={{
          width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9,
          border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.plum,
          fontFamily: TYPE.body, fontSize: 13, resize: "none", marginBottom: 12,
        }}
      />
      <button disabled style={{ ...primaryBtn, opacity: 0.5, cursor: "not-allowed" }}>
        Run {tool.name}
      </button>
      <p style={{ fontSize: 12, color: COLORS.plumDim, marginTop: 10, lineHeight: 1.6 }}>
        This is an interface mockup only. No model call happens here yet — wiring this up would
        need a real AI backend, which is out of scope for this prototype.
      </p>
    </div>
  );
}

export default function AITools({ onBack }) {
  const [active, setActive] = useState(TOOLS[0].id);
  const activeTool = TOOLS.find((t) => t.id === active);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "clamp(24px, 5vw, 40px) 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>

        <h1 style={{ fontFamily: TYPE.display, fontSize: TYPE.scale.h1, color: COLORS.cream, margin: "0 0 6px" }}>
          AI tools
        </h1>
        <p style={{ color: COLORS.plum, fontFamily: TYPE.body, fontSize: 14, margin: "0 0 28px" }}>
          Interface concepts for where AI could plug into LyricLine. All UI, no functionality.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                textAlign: "left", padding: 14, borderRadius: 10, cursor: "pointer",
                border: `1px solid ${active === t.id ? COLORS.gold : COLORS.line}`,
                background: active === t.id ? "rgba(232,185,77,0.08)" : COLORS.inkRaised,
              }}
            >
              <t.icon size={16} color={active === t.id ? COLORS.gold : COLORS.plum} />
              <div style={{ fontFamily: TYPE.body, fontWeight: 700, fontSize: 13, color: COLORS.cream, marginTop: 8 }}>
                {t.name}
              </div>
              <div style={{ fontFamily: TYPE.body, fontSize: 11, color: COLORS.plum, marginTop: 4, lineHeight: 1.4 }}>
                {t.blurb}
              </div>
            </button>
          ))}
        </div>

        {activeTool && <ToolPreview tool={activeTool} />}
      </div>
    </div>
  );
}
