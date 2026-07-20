import React from "react";
import { ChevronLeft } from "lucide-react";
import { COLORS, TYPE, ghostBtn } from "../theme/tokens";

export default function PageShell({ onBack, eyebrow, title, subtitle, maxWidth = 900, children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, padding: "clamp(24px, 5vw, 40px) 20px" }}>
      <div style={{ maxWidth, margin: "0 auto" }}>
        {onBack && (
          <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={15} /> Back
          </button>
        )}
        {eyebrow && (
          <div style={{ fontFamily: TYPE.body, fontSize: 12, fontWeight: 700, color: COLORS.gold, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontFamily: TYPE.display, fontSize: TYPE.scale.h1, color: COLORS.cream, margin: "0 0 6px" }}>{title}</h1>
        {subtitle && <p style={{ color: COLORS.plum, fontFamily: TYPE.body, fontSize: 14, margin: "0 0 32px", maxWidth: 620, lineHeight: 1.6 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
