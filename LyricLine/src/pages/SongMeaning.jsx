import React, { useState } from "react";
import { MessageSquare, Languages, Sparkles } from "lucide-react";
import { COLORS, TYPE, cardStyle, pillStyle } from "../theme/tokens";
import PageShell from "./PageShell";

const SAMPLE_TRACK = {
  title: "Midnight Static",
  artist: "Rosa Winters",
  lines: [
    { text: "City lights blur through the glass", note: "Sets the scene — motion and distance, watching the city go by from inside a car or train." },
    { text: "I'm holding on to what I had", note: "The emotional core of the verse: reluctance to let go of a past relationship or place." },
    { text: "Static on the radio, static in my head", note: "A double meaning — literal radio interference mirrors internal noise/confusion." },
  ],
};

export default function SongMeaning({ onBack }) {
  const [tab, setTab] = useState("meaning"); // meaning | translation | credits

  return (
    <PageShell onBack={onBack} eyebrow="Song page (sample)" title={SAMPLE_TRACK.title} subtitle={`${SAMPLE_TRACK.artist} — sample content to show what a fleshed-out song page could include.`} maxWidth={720}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={pillStyle(tab === "meaning")} onClick={() => setTab("meaning")}>
          <Sparkles size={12} /> Meaning
        </button>
        <button style={pillStyle(tab === "translation")} onClick={() => setTab("translation")}>
          <Languages size={12} /> Translation
        </button>
        <button style={pillStyle(tab === "credits")} onClick={() => setTab("credits")}>
          <MessageSquare size={12} /> Credits
        </button>
      </div>

      {tab === "meaning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SAMPLE_TRACK.lines.map((l, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontFamily: TYPE.display, fontSize: 16, color: COLORS.cream, marginBottom: 8 }}>{l.text}</div>
              <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.plum, lineHeight: 1.6, borderLeft: `2px solid ${COLORS.gold}`, paddingLeft: 10 }}>
                {l.note}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: COLORS.plumDim, marginTop: 4 }}>
            Annotations shown here are illustrative — in the real product these would come from the
            artist or community contributors, not be auto-generated.
          </p>
        </div>
      )}

      {tab === "translation" && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.plum, lineHeight: 1.6 }}>
            A translation view would show the original lyric alongside a line-by-line translation,
            language-switchable. Not implemented in this prototype.
          </p>
        </div>
      )}

      {tab === "credits" && (
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.cream, lineHeight: 2 }}>
            <div>Written by — Rosa Winters</div>
            <div>Produced by — sample data</div>
            <div>Published — self-published via LyricLine</div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
