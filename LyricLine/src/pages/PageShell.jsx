import React from "react";
import { ChevronLeft } from "lucide-react";
import { COLORS, TYPE, SPACE, ghostBtn } from "../theme/tokens";

export default function PageShell({ onBack, eyebrow, title, subtitle, maxWidth = 900, children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.background, padding: "clamp(24px, 5vw, 40px) 20px" }}>
      <div className="ll-fade-in" style={{ maxWidth, margin: "0 auto" }}>
        {onBack && (
          <button onClick={onBack} style={{ ...ghostBtn, marginBottom: SPACE["2xl"], display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={15} /> Back
          </button>
        )}
        {eyebrow && (
          <div style={{ fontFamily: TYPE.body, fontSize: 12, fontWeight: 700, color: COLORS.primary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: SPACE.sm + 2 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontFamily: TYPE.display, fontSize: TYPE.scale.h1, color: COLORS.textPrimary, margin: "0 0 6px", lineHeight: 1.12 }}>{title}</h1>
        {subtitle && <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 14, margin: `0 0 ${SPACE["3xl"]}px`, maxWidth: 620, lineHeight: 1.6 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
