import type { CSSProperties } from "react";

/**
 * Leonix Executive Contact Hub — Executive Theme system.
 *
 * This is the single source of brand color for every Digital Contact component.
 * No component hardcodes burgundy/gold hex values — they all read CSS custom
 * properties (`--dc-*`) that `executiveThemeCssVars()` sets once at the page root
 * (see `DigitalContactPageClient`). Cloning a new executive is a one-line change:
 * set `theme: "warfitness"` (etc.) on their registry entry — zero component edits,
 * zero duplicated styling.
 *
 * `leonix` is the only theme in active use today. The rest are reserved presets for
 * future executives/verticals and render nowhere on Chuy's page.
 */

export type ExecutiveThemeId = "leonix" | "warfitness" | "realestate" | "restaurant" | "partner";

export type ExecutiveTheme = {
  id: ExecutiveThemeId;
  /** Primary brand color — hero gradient top, borders, links. */
  primary: string;
  /** Darker shade of primary — gradient mid-tones, hover states on primary surfaces. */
  primaryDark: string;
  /** Deep complementary shade — gradient end-caps on dark surfaces (e.g. closing CTA). */
  secondary: string;
  /** Accent color (solid) — kicker text, icons, small highlights. */
  accent: string;
  /** Accent at low opacity — chip fills, soft tinted backgrounds. */
  accentSoft: string;
  /** Accent at border opacity — chip/card/icon borders. */
  accentBorder: string;
  /** Subtle accent-tinted hover/background wash for interactive rows and cards. */
  accentBackground: string;
  /** Hero gradient start (top of page). */
  gradientStart: string;
  /** Hero gradient end — shared warm cream across every theme, the template's fixed canvas. */
  gradientEnd: string;
  /** Solid CTA button fill (Save Contact, QR download, form submit). */
  buttonPrimary: string;
  /** CTA button hover fill. */
  buttonHover: string;
  /** Small pill/badge fill (closing CTA button). */
  badge: string;
  /** Badge hover fill. */
  badgeHover: string;
  /** Badge text color (kept dark for contrast against a light badge). */
  badgeText: string;
  /** Soft glow color (avatar ring, premium highlights). */
  glow: string;
};

const LEONIX: ExecutiveTheme = {
  id: "leonix",
  primary: "#7A1E2C",
  primaryDark: "#6B1A26",
  secondary: "#4f1319",
  accent: "#D9BE73",
  accentSoft: "rgba(201,168,74,0.12)",
  accentBorder: "rgba(201,168,74,0.5)",
  accentBackground: "#FBF7EF",
  gradientStart: "#7A1E2C",
  gradientEnd: "#F8F4EA",
  buttonPrimary: "#7A1E2C",
  buttonHover: "#6B1A26",
  badge: "#C9A84A",
  badgeHover: "#D4BC6A",
  badgeText: "#1F241C",
  glow: "rgba(201,168,74,0.45)",
};

/** Reserved for a future athletic/performance-brand executive (e.g. WarFitness). Not used by any active profile. */
const WARFITNESS: ExecutiveTheme = {
  id: "warfitness",
  primary: "#1C1C1E",
  primaryDark: "#0E0E10",
  secondary: "#3A0D10",
  accent: "#E2472B",
  accentSoft: "rgba(226,71,43,0.12)",
  accentBorder: "rgba(226,71,43,0.5)",
  accentBackground: "#F5F1EC",
  gradientStart: "#1C1C1E",
  gradientEnd: "#F8F4EA",
  buttonPrimary: "#1C1C1E",
  buttonHover: "#0E0E10",
  badge: "#E2472B",
  badgeHover: "#EF6248",
  badgeText: "#FFFDF7",
  glow: "rgba(226,71,43,0.4)",
};

/** Reserved for a future real-estate / trust-driven executive profile. Not used by any active profile. */
const REALESTATE: ExecutiveTheme = {
  id: "realestate",
  primary: "#122A43",
  primaryDark: "#0C1D30",
  secondary: "#081521",
  accent: "#C9A84A",
  accentSoft: "rgba(201,168,74,0.12)",
  accentBorder: "rgba(201,168,74,0.5)",
  accentBackground: "#F3F1EA",
  gradientStart: "#122A43",
  gradientEnd: "#F8F4EA",
  buttonPrimary: "#122A43",
  buttonHover: "#0C1D30",
  badge: "#C9A84A",
  badgeHover: "#D4BC6A",
  badgeText: "#0C1D30",
  glow: "rgba(201,168,74,0.4)",
};

/** Reserved for a future restaurant/hospitality executive profile. Not used by any active profile. */
const RESTAURANT: ExecutiveTheme = {
  id: "restaurant",
  primary: "#2E4A2E",
  primaryDark: "#213620",
  secondary: "#16250F",
  accent: "#D9BE73",
  accentSoft: "rgba(201,168,74,0.12)",
  accentBorder: "rgba(201,168,74,0.5)",
  accentBackground: "#F4F1E8",
  gradientStart: "#2E4A2E",
  gradientEnd: "#F8F4EA",
  buttonPrimary: "#2E4A2E",
  buttonHover: "#213620",
  badge: "#D9BE73",
  badgeHover: "#E4CE93",
  badgeText: "#16250F",
  glow: "rgba(217,190,115,0.4)",
};

/** Reserved for a neutral referral/BD-partner profile. Not used by any active profile. */
const PARTNER: ExecutiveTheme = {
  id: "partner",
  primary: "#3A362E",
  primaryDark: "#28251F",
  secondary: "#1B1915",
  accent: "#C9A84A",
  accentSoft: "rgba(201,168,74,0.12)",
  accentBorder: "rgba(201,168,74,0.5)",
  accentBackground: "#F5F2EA",
  gradientStart: "#3A362E",
  gradientEnd: "#F8F4EA",
  buttonPrimary: "#3A362E",
  buttonHover: "#28251F",
  badge: "#C9A84A",
  badgeHover: "#D4BC6A",
  badgeText: "#1B1915",
  glow: "rgba(201,168,74,0.4)",
};

const EXECUTIVE_THEMES: Record<ExecutiveThemeId, ExecutiveTheme> = {
  leonix: LEONIX,
  warfitness: WARFITNESS,
  realestate: REALESTATE,
  restaurant: RESTAURANT,
  partner: PARTNER,
};

export function resolveExecutiveTheme(id: ExecutiveThemeId | undefined | null): ExecutiveTheme {
  return EXECUTIVE_THEMES[id ?? "leonix"] ?? LEONIX;
}

/** Human labels for every theme id — Executive Hub theme selector reads this so new themes need no admin UI changes. */
export const EXECUTIVE_THEME_OPTIONS: { id: ExecutiveThemeId; label: string }[] = [
  { id: "leonix", label: "Leonix (burgundy & gold)" },
  { id: "warfitness", label: "WarFitness (black & red)" },
  { id: "realestate", label: "Real Estate (navy & gold)" },
  { id: "restaurant", label: "Restaurant (forest green & gold)" },
  { id: "partner", label: "Partner (neutral bronze)" },
];

/**
 * Maps a resolved theme onto `--dc-*` CSS custom properties. Set once on the page root
 * (`DigitalContactPageClient`); every descendant reads the variables directly via
 * Tailwind arbitrary values (e.g. `bg-[var(--dc-button-primary)]`) — no theme prop
 * drilling required.
 */
export function executiveThemeCssVars(theme: ExecutiveTheme): CSSProperties {
  return {
    "--dc-primary": theme.primary,
    "--dc-primary-dark": theme.primaryDark,
    "--dc-secondary": theme.secondary,
    "--dc-accent": theme.accent,
    "--dc-accent-soft": theme.accentSoft,
    "--dc-accent-border": theme.accentBorder,
    "--dc-accent-bg": theme.accentBackground,
    "--dc-gradient-start": theme.gradientStart,
    "--dc-gradient-end": theme.gradientEnd,
    "--dc-button-primary": theme.buttonPrimary,
    "--dc-button-hover": theme.buttonHover,
    "--dc-badge": theme.badge,
    "--dc-badge-hover": theme.badgeHover,
    "--dc-badge-text": theme.badgeText,
    "--dc-glow": theme.glow,
  } as CSSProperties;
}
