import React from "react";
import { Award, Star, Flame } from "lucide-react";
import { COLORS, TYPE, SPACE, RADIUS, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

const LEADERBOARD = [
  { rank: 1, name: "Ilsa M.", points: 4210, badge: "Top Contributor" },
  { rank: 2, name: "devon_writes", points: 3870, badge: "Translator" },
  { rank: 3, name: "quiet.harbor", points: 3102, badge: "Annotator" },
  { rank: 4, name: "Marisol T.", points: 2650, badge: null },
];

const BADGES = [
  { icon: Award, name: "Top Contributor", desc: "Top 1% of monthly contributions" },
  { icon: Star, name: "First Sync", desc: "Published your first synced track" },
  { icon: Flame, name: "7-day streak", desc: "Contributed 7 days in a row" },
];

export default function Community({ onBack }) {
  return (
    <PageShell onBack={onBack} eyebrow="Community" title="People behind the lyrics" subtitle="Illustrative leaderboard and badges — no real scoring is tracked in this prototype.">
      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.textPrimary, marginBottom: SPACE.md }}>Top contributors this month</div>
      <div style={{ ...cardStyle, marginBottom: SPACE["3xl"] }}>
        {LEADERBOARD.map((p, i) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: SPACE.lg, padding: `${SPACE.md}px ${SPACE.lg}px`, borderBottom: i < LEADERBOARD.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 16, color: COLORS.primary, width: 20 }}>{p.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.body, fontSize: 14, color: COLORS.textPrimary }}>{p.name}</div>
              {p.badge && <div style={{ fontFamily: TYPE.body, fontSize: 11, color: COLORS.textMuted }}>{p.badge}</div>}
            </div>
            <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted }}>{p.points.toLocaleString()} pts</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.textPrimary, marginBottom: SPACE.md }}>Badges</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: SPACE.md }}>
        {BADGES.map((b) => (
          <div key={b.name} style={{ ...cardStyle, padding: SPACE.lg }}>
            <b.icon size={18} color={COLORS.primary} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: TYPE.body, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{b.name}</div>
            <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
