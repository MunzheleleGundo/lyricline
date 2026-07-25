import React from "react";
import { TrendingUp, Flame, Quote, ChevronLeft } from "lucide-react";
import { COLORS, TYPE, cardStyle, ghostBtn } from "../theme/tokens";
import { TRENDING_ARTISTS, GLOBAL_CHART, VIRAL_LINES } from "../data/discoverData";

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2
      style={{
        fontFamily: TYPE.display,
        fontSize: TYPE.scale.h3,
        color: COLORS.textPrimary,
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "0 0 14px",
      }}
    >
      <Icon size={18} color={COLORS.primary} /> {children}
    </h2>
  );
}

export default function Discover({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, padding: "clamp(24px, 5vw, 40px) 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={15} /> Back
        </button>

        <h1 style={{ fontFamily: TYPE.display, fontSize: TYPE.scale.h1, color: COLORS.textPrimary, margin: "0 0 6px" }}>
          Discover
        </h1>
        <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 14, margin: "0 0 36px" }}>
          A sample of what a full discovery surface could look like — trending artists, a global
          chart, and lines people are sharing. Illustrative data, not live.
        </p>

        <div style={{ marginBottom: 40 }}>
          <SectionTitle icon={TrendingUp}>Trending artists</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {TRENDING_ARTISTS.map((a) => (
              <div key={a.name} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ fontFamily: TYPE.display, fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>{a.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted }}>{a.genre}</span>
                  <span style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.success, fontWeight: 700 }}>{a.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <SectionTitle icon={Flame}>Global chart</SectionTitle>
          <div style={cardStyle}>
            {GLOBAL_CHART.map((t, i) => (
              <div
                key={t.rank}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  borderBottom: i < GLOBAL_CHART.length - 1 ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.primary, width: 24 }}>{t.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: TYPE.display, fontSize: 15, color: COLORS.textPrimary }}>{t.title}</div>
                  <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted }}>{t.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle icon={Quote}>Lines going around</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {VIRAL_LINES.map((v, i) => (
              <div key={i} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ fontFamily: TYPE.display, fontStyle: "italic", fontSize: 15, color: COLORS.textPrimary, marginBottom: 6 }}>
                  "{v.line}"
                </div>
                <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted }}>
                  {v.song} · {v.artist}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
