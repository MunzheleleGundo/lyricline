import React from "react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

export default function About({ onBack }) {
  return (
    <PageShell onBack={onBack} eyebrow="About" title="Lyrics, published by the people who wrote them" maxWidth={720}>
      <div style={{ ...cardStyle, padding: 24, fontFamily: TYPE.body, fontSize: 14, color: COLORS.plum, lineHeight: 1.7 }}>
        <p style={{ color: COLORS.cream, marginTop: 0 }}>
          LyricLine started from a simple frustration: most lyrics sites are built on scraped,
          often-wrong transcriptions, with no path back to the artist who actually wrote the song.
        </p>
        <p>
          This build is an early prototype — a self-publish flow, a tap-to-sync editor, and a karaoke
          player, all running in memory with no backend. The pages around it (this one included) are
          sketches of where the product could go next: discovery, community, artist tools, AI-assisted
          writing — built out once the core experience earns its place.
        </p>
        <p style={{ marginBottom: 0 }}>
          Nothing here is final. Consider this a working sketch of the product, not a finished one.
        </p>
      </div>
    </PageShell>
  );
}
