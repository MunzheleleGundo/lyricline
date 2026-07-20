import React from "react";
import { Award, Star, Flame } from "lucide-react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
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
      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.cream, marginBottom: 12 }}>Top contributors this month</div>
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        {LEADERBOARD.map((p, i) => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: i < LEADERBOARD.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
            <div style={{ fontFamily: TYPE.display, fontSize: 16, color: COLORS.gold, width: 20 }}>{p.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: TYPE.body, fontSize: 14, color: COLORS.cream }}>{p.name}</div>
              {p.badge && <div style={{ fontFamily: TYPE.body, fontSize: 11, color: COLORS.plum }}>{p.badge}</div>}
            </div>
            <div style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.plum }}>{p.points.toLocaleString()} pts</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.cream, marginBottom: 12 }}>Badges</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {BADGES.map((b) => (
          <div key={b.name} style={{ ...cardStyle, padding: 16 }}>
            <b.icon size={18} color={COLORS.gold} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: TYPE.body, fontWeight: 700, fontSize: 13, color: COLORS.cream }}>{b.name}</div>
            <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.plum, marginTop: 4 }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
