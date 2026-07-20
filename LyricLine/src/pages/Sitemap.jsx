import React from "react";
import {
  Compass, Wand2, DollarSign, Layers, Info, Sparkles, BarChart3, Users,
} from "lucide-react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

export default function Sitemap({ onBack, onNavigate }) {
  const sections = [
    {
      label: "Product",
      items: [
        { id: "features", icon: Layers, name: "Features", desc: "Product pillars overview" },
        { id: "pricing", icon: DollarSign, name: "Pricing", desc: "Fan / Artist / Label tiers" },
        { id: "about", icon: Info, name: "About", desc: "Why LyricLine exists" },
      ],
    },
    {
      label: "Discover & listen",
      items: [
        { id: "discover", icon: Compass, name: "Discover", desc: "Trending artists, charts, viral lines" },
        { id: "songmeaning", icon: Sparkles, name: "Song page (sample)", desc: "Meaning, translation, credits tabs" },
      ],
    },
    {
      label: "For artists",
      items: [
        { id: "dashboard", icon: BarChart3, name: "Artist dashboard", desc: "Sample analytics view" },
      ],
    },
    {
      label: "Community & AI",
      items: [
        { id: "community", icon: Users, name: "Community", desc: "Leaderboard & badges" },
        { id: "aitools", icon: Wand2, name: "AI tools", desc: "8 AI feature previews" },
      ],
    },
  ];

  return (
    <PageShell onBack={onBack} eyebrow="Explore" title="Where this could go" subtitle="Every section here is a UI sketch — tap through to see the shape of the fuller product.">
      {sections.map((s) => (
        <div key={s.label} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: TYPE.body, fontSize: 12, fontWeight: 700, color: COLORS.plum, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            {s.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {s.items.map((it) => (
              <button
                key={it.id}
                onClick={() => onNavigate(it.id)}
                style={{ ...cardStyle, padding: 16, textAlign: "left", cursor: "pointer" }}
              >
                <it.icon size={18} color={COLORS.gold} style={{ marginBottom: 10 }} />
                <div style={{ fontFamily: TYPE.body, fontWeight: 700, fontSize: 14, color: COLORS.cream }}>{it.name}</div>
                <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plum, marginTop: 4, lineHeight: 1.4 }}>{it.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}
