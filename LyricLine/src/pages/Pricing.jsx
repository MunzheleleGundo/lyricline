import React from "react";
import { Check } from "lucide-react";
import { COLORS, TYPE, cardStyle, primaryBtn, ghostBtn } from "../theme/tokens";
import PageShell from "./PageShell";

const PLANS = [
  { name: "Fan", price: "Free", tagline: "Follow artists, save lyrics, join the community.", features: ["Unlimited lyric reading", "Save & like tracks", "Follow artists"], cta: "Current plan", highlighted: false },
  { name: "Artist", price: "$9/mo", tagline: "Publish and manage your own synced catalog.", features: ["Everything in Fan", "Unlimited track publishing", "Tap-to-sync editor", "Basic analytics"], cta: "Preview only", highlighted: true },
  { name: "Label", price: "Talk to us", tagline: "Manage a full roster with team access.", features: ["Everything in Artist", "Multi-artist roster", "Team seats & roles", "Priority support"], cta: "Preview only", highlighted: false },
];

export default function Pricing({ onBack }) {
  return (
    <PageShell onBack={onBack} eyebrow="Pricing" title="Simple pricing, wherever you are" subtitle="Illustrative tiers — no billing is wired up in this prototype.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {PLANS.map((p) => (
          <div key={p.name} style={{ ...cardStyle, padding: 24, border: `1px solid ${p.highlighted ? COLORS.primary : COLORS.border}`, position: "relative" }}>
            {p.highlighted && (
              <span style={{ position: "absolute", top: -10, left: 20, background: COLORS.primary, color: "#1C1608", fontFamily: TYPE.body, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
                Most popular
              </span>
            )}
            <div style={{ fontFamily: TYPE.display, fontSize: 20, color: COLORS.textPrimary, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontFamily: TYPE.display, fontSize: 28, color: COLORS.primary, fontWeight: 700, marginBottom: 8 }}>{p.price}</div>
            <p style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 18, lineHeight: 1.5 }}>{p.tagline}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {p.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: TYPE.body, fontSize: 13, color: COLORS.textPrimary }}>
                  <Check size={14} color={COLORS.primary} /> {f}
                </div>
              ))}
            </div>
            <button disabled style={{ ...(p.highlighted ? primaryBtn : ghostBtn), width: "100%", opacity: 0.6, cursor: "not-allowed" }}>{p.cta}</button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
