// ============================================================
// LyricLine Design System
// Single source of truth for color, type, spacing, elevation,
// radius, and motion. Every screen should read from here rather
// than hardcoding values, so the product stays visually coherent
// as it grows.
// ============================================================

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
`;

// ---------- Raw palette ----------
// Musixmatch-inspired: clean white product surface, coral-to-pink brand
// gradient, deep purple ink for text/dark accents. Built from Musixmatch's
// public brand palette (persimmon/pink/purple family).
// Don't reach for these directly in components — use the semantic COLORS
// below instead, so a future re-theme only touches this one block.
const PALETTE = {
  white: "#FFFFFF",
  paper: "#FAF9FB",
  mist: "#F3F1F6",
  fog: "#E9E6EF",
  line: "#E2DEE9",
  lineStrong: "#D2CCDE",
  ink900: "#1A1523",
  ink700: "#2E2740",
  ink500: "#5B5468",
  ink300: "#8B8497",
  coral: "#FF6050",
  pink: "#FF0E83",
  pinkHover: "#E60E76",
  pinkPressed: "#C90C67",
  purple: "#813867",
  purpleDeep: "#341539",
  violet: "#9013FE",
  success: "#00B389",
  successBg: "rgba(0,179,137,0.10)",
  warning: "#FFC208",
  warningBg: "rgba(255,194,8,0.14)",
  danger: "#FF4D4D",
  dangerBg: "rgba(255,77,77,0.10)",
};

// Brand gradient — use sparingly, for hero moments and primary CTAs,
// the way Musixmatch uses its coral-to-pink wash.
export const GRADIENT_BRAND = `linear-gradient(135deg, ${PALETTE.coral} 0%, ${PALETTE.pink} 100%)`;
export const GRADIENT_BRAND_SOFT = `linear-gradient(135deg, rgba(255,96,80,0.10) 0%, rgba(255,14,131,0.10) 100%)`;

// ---------- Semantic color tokens ----------
// Components reference these names, never raw hex, so meaning stays
// consistent (e.g. "border" always means the same line color).
export const COLORS = {
  // surfaces
  background: PALETTE.white,
  surface: PALETTE.paper,
  surfaceRaised: PALETTE.white,
  surfaceRaised2: PALETTE.mist,
  surfaceOverlay: "rgba(26,21,35,0.45)",

  // text
  textPrimary: PALETTE.ink900,
  textSecondary: PALETTE.ink500,
  textMuted: PALETTE.ink300,
  textFaint: PALETTE.lineStrong,
  textOnAccent: "#FFFFFF",

  // brand / accent
  primary: PALETTE.pink,
  primaryHover: PALETTE.pinkHover,
  primaryPressed: PALETTE.pinkPressed,
  primarySoft: "rgba(255,14,131,0.10)",
  accent: PALETTE.violet,
  accentSoft: "rgba(144,19,254,0.10)",

  // feedback
  success: PALETTE.success,
  successSoft: PALETTE.successBg,
  warning: "#B5850A",
  warningSoft: PALETTE.warningBg,
  danger: PALETTE.danger,
  dangerSoft: PALETTE.dangerBg,

  // structure
  border: PALETTE.line,
  borderStrong: PALETTE.lineStrong,
  borderFocus: PALETTE.pink,

  // states
  hover: "rgba(26,21,35,0.035)",
  pressed: "rgba(26,21,35,0.07)",
  disabledBg: PALETTE.mist,
  disabledText: PALETTE.ink300,

  // legacy aliases (kept so existing call sites relying on old names
  // keep working while the app migrates screen-by-screen)
  ink: PALETTE.ink900,
  inkRaised: PALETTE.white,
  inkRaised2: PALETTE.mist,
  cream: PALETTE.ink900,
  gold: PALETTE.pink,
  goldSoft: "rgba(255,14,131,0.10)",
  plum: PALETTE.violet,
  plumDim: PALETTE.purpleDeep,
  line: PALETTE.line,
};

// ---------- Typography ----------
export const TYPE = {
  display: "'Fraunces', serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
  // Plain font-size values — existing screens do `fontSize: TYPE.scale.h1`
  // directly, so these stay strings rather than style objects.
  scale: {
    display: "clamp(36px, 6vw, 60px)",
    h1: "clamp(28px, 5vw, 44px)",
    h2: "clamp(22px, 4vw, 30px)",
    h3: "clamp(18px, 3vw, 22px)",
    h4: 17,
    h5: 15,
    h6: 13,
    body: 14,
    bodyLg: 16,
    caption: 12,
    label: 12,
    code: 13,
  },
  // Full multi-property text styles (family/size/weight/line-height) for
  // new components — spread directly into a style prop.
  styles: {
    display: { fontFamily: "'Fraunces', serif", fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.01em" },
    h1: { fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.01em" },
    h2: { fontFamily: "'Fraunces', serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600, lineHeight: 1.18 },
    h3: { fontFamily: "'Fraunces', serif", fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 600, lineHeight: 1.25 },
    h4: { fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
    h5: { fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.35 },
    h6: { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, lineHeight: 1.4, letterSpacing: "0.02em", textTransform: "uppercase" },
    body: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
    bodyLg: { fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    caption: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 400, lineHeight: 1.5 },
    label: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, lineHeight: 1.3, letterSpacing: "0.01em" },
    code: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  },
};

// ---------- Spacing scale (px) ----------
export const SPACE = { 0: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40, "5xl": 48, "6xl": 64, "7xl": 80 };

// ---------- Radius scale ----------
export const RADIUS = { xs: 4, sm: 6, md: 8, lg: 10, xl: 14, "2xl": 20, full: 999 };

// ---------- Elevation (shadow) scale ----------
// Light-UI shadows: soft, low-opacity ink falloff so raised cards read
// as gently lifted off the white/paper background rather than heavy.
export const ELEVATION = {
  none: "none",
  sm: "0 1px 2px rgba(26,21,35,0.06)",
  md: "0 4px 16px rgba(26,21,35,0.08), 0 1px 2px rgba(26,21,35,0.05)",
  lg: "0 12px 32px rgba(26,21,35,0.10), 0 2px 8px rgba(26,21,35,0.06)",
  xl: "0 24px 60px rgba(26,21,35,0.14), 0 4px 14px rgba(26,21,35,0.08)",
  focusRing: `0 0 0 3px ${COLORS.primarySoft}`,
};

// ---------- Motion ----------
export const MOTION = {
  fast: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "180ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "280ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
};

// ============================================================
// Shared component style builders
// Keep every button/card/input in the app visually identical by
// building their styles from one function instead of copy-pasting
// inline style objects per screen.
// ============================================================

const focusRingProps = {
  outline: "none",
};

export function buttonStyle(variant = "primary", { size = "md", disabled = false, fullWidth = false } = {}) {
  const sizes = {
    sm: { padding: "7px 12px", fontSize: 12, gap: 5, radius: RADIUS.md },
    md: { padding: "11px 18px", fontSize: 14, gap: 7, radius: RADIUS.lg },
    lg: { padding: "14px 24px", fontSize: 15, gap: 8, radius: RADIUS.lg },
  };
  const s = sizes[size];

  const variants = {
    primary: { background: COLORS.primary, color: COLORS.textOnAccent, border: "none" },
    secondary: { background: COLORS.surfaceRaised2, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    ghost: { background: "transparent", color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` },
    outline: { background: "transparent", color: COLORS.primary, border: `1px solid ${COLORS.primary}` },
    danger: { background: COLORS.dangerSoft, color: COLORS.danger, border: `1px solid transparent` },
    icon: { background: COLORS.surfaceRaised2, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, padding: 9 },
  };

  return {
    ...focusRingProps,
    padding: s.padding,
    borderRadius: s.radius,
    fontFamily: TYPE.body,
    fontWeight: 700,
    fontSize: s.fontSize,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    cursor: disabled ? "not-allowed" : "pointer",
    width: fullWidth ? "100%" : undefined,
    transition: `background ${MOTION.fast}, border-color ${MOTION.fast}, transform ${MOTION.fast}, opacity ${MOTION.fast}`,
    opacity: disabled ? 0.45 : 1,
    ...variants[variant],
  };
}

export const primaryBtn = buttonStyle("primary");
export const ghostBtn = buttonStyle("ghost");
export const secondaryBtn = buttonStyle("secondary");
export const outlineBtn = buttonStyle("outline");
export const dangerBtn = buttonStyle("danger");
export const iconBtn = buttonStyle("icon", { size: "md" });

export function card({ padding = SPACE["2xl"], elevation = "md", interactive = false } = {}) {
  return {
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.xl,
    padding,
    boxShadow: ELEVATION[elevation] || ELEVATION.md,
    transition: interactive ? `transform ${MOTION.base}, box-shadow ${MOTION.base}, border-color ${MOTION.base}` : undefined,
  };
}
// Existing screens do `style={{ ...cardStyle, padding: X }}`, so this stays
// a plain object (the app's default card look) rather than a function.
export const cardStyle = card();

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 13px",
  borderRadius: RADIUS.lg,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.background,
  color: COLORS.textPrimary,
  fontFamily: TYPE.body,
  fontSize: 14,
  outline: "none",
  transition: `border-color ${MOTION.fast}, box-shadow ${MOTION.fast}`,
};

export const labelStyle = {
  display: "block",
  ...TYPE.styles.label,
  color: COLORS.textMuted,
  marginBottom: SPACE.xs + 2,
};

export function pillStyle(active) {
  return {
    padding: "6px 13px",
    borderRadius: RADIUS.full,
    cursor: "pointer",
    border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
    background: active ? COLORS.primarySoft : "transparent",
    color: active ? COLORS.primary : COLORS.textMuted,
    fontFamily: TYPE.body,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    transition: `background ${MOTION.fast}, border-color ${MOTION.fast}, color ${MOTION.fast}`,
  };
}

export function badgeStyle(tone = "neutral") {
  const tones = {
    neutral: { background: COLORS.surfaceRaised2, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` },
    primary: { background: COLORS.primarySoft, color: COLORS.primary, border: "1px solid transparent" },
    success: { background: COLORS.successSoft, color: COLORS.success, border: "1px solid transparent" },
    warning: { background: COLORS.warningSoft, color: COLORS.warning, border: "1px solid transparent" },
    danger: { background: COLORS.dangerSoft, color: COLORS.danger, border: "1px solid transparent" },
  };
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 9px",
    borderRadius: RADIUS.full,
    fontFamily: TYPE.body,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.01em",
    ...tones[tone],
  };
}

export function skeletonStyle(width = "100%", height = 14) {
  return {
    width,
    height,
    borderRadius: RADIUS.sm,
    background: `linear-gradient(90deg, ${COLORS.surfaceRaised} 25%, ${COLORS.surfaceRaised2} 37%, ${COLORS.surfaceRaised} 63%)`,
    backgroundSize: "400% 100%",
    animation: "llShimmer 1.4s ease infinite",
  };
}
