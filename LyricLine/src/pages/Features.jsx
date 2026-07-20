import React from "react";
import { Mic2, Wand2, Compass, Users, ShieldCheck, BarChart3 } from "lucide-react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

const FEATURES = [
  { icon: Mic2, title: "Tap-to-sync lyrics", desc: "Time your lyrics to the track by ear, no timecode math required." },
  { icon: Wand2, title: "AI writing tools", desc: "Generator, translator, rhyme assistant, and more — preview interfaces live now." },
  { icon: Compass, title: "Discovery surfaces", desc: "Trending artists, charts, and viral lines to help fans find new music." },
  { icon: Users, title: "Community & contributors", desc: "Recognize the people who annotate, translate, and correct lyrics." },
  { icon: ShieldCheck, title: "Artist-owned rights", desc: "Every lyric published is self-attested by the artist, not scraped." },
  { icon: BarChart3, title: "Artist analytics", desc: "See how listeners engage with your catalog over time." },
];

export default function Features({ onBack }) {
  return (
    <PageShell onBack={onBack} eyebrow="Features" title="Built for artists, made for fans" subtitle="A look at the pillars of LyricLine as the product matures beyond this prototype.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{ ...cardStyle, padding: 20 }}>
            <f.icon size={20} color={COLORS.gold} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: TYPE.display, fontSize: 16, color: COLORS.cream, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.plum, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
