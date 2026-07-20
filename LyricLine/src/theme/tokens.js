// ---------- Design tokens ----------
// Single source of truth for color, type, and spacing so every screen
// (existing + new) stays visually consistent as the product grows.

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
`;

export const COLORS = {
  ink: "#14161F",
  inkRaised: "#1C1F2B",
  inkRaised2: "#232738",
  cream: "#F2EFE9",
  gold: "#E8B94D",
  goldSoft: "rgba(232,185,77,0.12)",
  plum: "#8C7AA0",
  plumDim: "#4A4258",
  line: "#2A2E3D",
  success: "#5FBF83",
  danger: "#E27D6B",
};

export const TYPE = {
  display: "Fraunces, serif",
  body: "Inter, sans-serif",
  scale: {
    h1: "clamp(28px, 5vw, 44px)",
    h2: "clamp(22px, 4vw, 30px)",
    h3: "clamp(18px, 3vw, 22px)",
    body: "14px",
    small: "12px",
  },
};

export const SPACE = { xs: 6, sm: 10, md: 16, lg: 24, xl: 40, xxl: 64 };

export const primaryBtn = {
  padding: "12px 20px",
  borderRadius: 9,
  border: "none",
  background: COLORS.gold,
  color: "#1C1608",
  fontFamily: TYPE.body,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

export const ghostBtn = {
  padding: "12px 20px",
  borderRadius: 9,
  border: `1px solid ${COLORS.line}`,
  background: "transparent",
  color: COLORS.cream,
  fontFamily: TYPE.body,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 9,
  border: `1px solid ${COLORS.line}`,
  background: COLORS.ink,
  color: COLORS.cream,
  fontFamily: TYPE.body,
  fontSize: 14,
  outline: "none",
};

export const labelStyle = {
  display: "block",
  fontSize: 12,
  color: COLORS.plum,
  marginBottom: 6,
  fontFamily: TYPE.body,
};

export const cardStyle = {
  background: COLORS.inkRaised,
  border: `1px solid ${COLORS.line}`,
  borderRadius: 12,
};

export const pillStyle = (active) => ({
  padding: "6px 12px",
  borderRadius: 20,
  cursor: "pointer",
  border: `1px solid ${active ? COLORS.gold : COLORS.line}`,
  background: active ? COLORS.goldSoft : "transparent",
  color: active ? COLORS.gold : COLORS.plum,
  fontFamily: TYPE.body,
  fontSize: 12,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: 4,
});
