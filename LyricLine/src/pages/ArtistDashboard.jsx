import React from "react";
import { Eye, Heart, Users, TrendingUp } from "lucide-react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

const STATS = [
  { icon: Eye, label: "Lyric views (30d)", value: "4,218" },
  { icon: Heart, label: "Likes (30d)", value: "312" },
  { icon: Users, label: "Followers", value: "1,004" },
  { icon: TrendingUp, label: "Growth", value: "+6.4%" },
];

const TOP_TRACKS = [
  { title: "Midnight Static", views: 1820 },
  { title: "Static & Sea", views: 1140 },
  { title: "Glasshouse", views: 640 },
];

export default function ArtistDashboard({ onBack }) {
  return (
    <PageShell onBack={onBack} eyebrow="Artist dashboard (sample)" title="Your catalog at a glance" subtitle="Sample analytics to illustrate what an artist dashboard could surface. Numbers are static.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: 16 }}>
            <s.icon size={16} color={COLORS.gold} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: COLORS.cream }}>{s.value}</div>
            <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plum, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.cream, marginBottom: 12 }}>Top tracks</div>
      <div style={cardStyle}>
        {TOP_TRACKS.map((t, i) => (
          <div key={t.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < TOP_TRACKS.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
            <span style={{ fontFamily: TYPE.body, fontSize: 14, color: COLORS.cream }}>{t.title}</span>
            <span style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.plum }}>{t.views.toLocaleString()} views</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: COLORS.plumDim, marginTop: 16 }}>
        Real analytics would need actual usage data — this view only demonstrates layout.
      </p>
    </PageShell>
  );
}
