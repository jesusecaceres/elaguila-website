import type { CSSProperties } from "react";
import type { AdBrandColorSet, AdBrandShadeId, AdBrandTheme, AdBrandThemeId } from "./types";

/**
 * Leonix Ad Branding Layer — Gate 1 approved preset themes.
 *
 * Four Leonix-approved identities, each with three shade variants (light/standard/deep).
 * Every color below is a literal, pre-approved value — shades are never computed at
 * runtime (e.g. via CSS `filter` or programmatic lightening), so there is no path to an
 * un-approved color reaching a rendered surface. Accent stays in the Leonix gold family
 * across every theme/shade so a branded listing still reads as unmistakably Leonix.
 */

const LION_HERITAGE: AdBrandTheme = {
  id: "lion-heritage",
  label: "Lion Heritage",
  purpose: "premium / established",
  shades: {
    light: {
      primary: "#9C3145",
      primaryDark: "#7A1E2C",
      secondary: "#5C1620",
      accent: "#D9BE73",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
    standard: {
      primary: "#7A1E2C",
      primaryDark: "#6B1A26",
      secondary: "#4F1319",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
    deep: {
      primary: "#5C1620",
      primaryDark: "#4A1119",
      secondary: "#2E0B0F",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
  },
  backgroundOptions: ["cream", "charcoal", "photo"],
};

const SAVANNAH_TRUST: AdBrandTheme = {
  id: "savannah-trust",
  label: "Savannah Trust",
  purpose: "community / reliable",
  shades: {
    light: {
      primary: "#6B7A3A",
      primaryDark: "#566021",
      secondary: "#3A4118",
      accent: "#D9BE73",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
    standard: {
      primary: "#4B5320",
      primaryDark: "#3A4118",
      secondary: "#242A0D",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
    deep: {
      primary: "#3A4118",
      primaryDark: "#242A0D",
      secondary: "#161B08",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
  },
  backgroundOptions: ["cream", "photo"],
};

const SUNSET_COMUNIDAD: AdBrandTheme = {
  id: "sunset-comunidad",
  label: "Sunset Comunidad",
  purpose: "warm / local",
  shades: {
    light: {
      primary: "#C56A3E",
      primaryDark: "#A6522C",
      secondary: "#7A3A1C",
      accent: "#E8C77A",
      accentSoft: "rgba(232,199,122,0.14)",
      accentBorder: "rgba(232,199,122,0.5)",
    },
    standard: {
      primary: "#A6522C",
      primaryDark: "#8A4022",
      secondary: "#5C2A14",
      accent: "#D9BE73",
      accentSoft: "rgba(217,190,115,0.14)",
      accentBorder: "rgba(217,190,115,0.5)",
    },
    deep: {
      primary: "#7A3A1C",
      primaryDark: "#5C2A14",
      secondary: "#3A190C",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.5)",
    },
  },
  backgroundOptions: ["cream", "charcoal", "photo"],
};

const BLACK_LION_PREMIUM: AdBrandTheme = {
  id: "black-lion-premium",
  label: "Black Lion Premium",
  purpose: "modern / luxury",
  shades: {
    light: {
      primary: "#2A2A2C",
      primaryDark: "#1C1C1E",
      secondary: "#0E0E10",
      accent: "#E8C77A",
      accentSoft: "rgba(232,199,122,0.14)",
      accentBorder: "rgba(232,199,122,0.55)",
    },
    standard: {
      primary: "#1C1C1E",
      primaryDark: "#101012",
      secondary: "#050506",
      accent: "#D9BE73",
      accentSoft: "rgba(217,190,115,0.14)",
      accentBorder: "rgba(217,190,115,0.55)",
    },
    deep: {
      primary: "#101012",
      primaryDark: "#050506",
      secondary: "#000000",
      accent: "#C9A84A",
      accentSoft: "rgba(201,168,74,0.12)",
      accentBorder: "rgba(201,168,74,0.55)",
    },
  },
  // Deliberately no "cream" — this theme is dark-forward only, by design.
  backgroundOptions: ["charcoal", "photo"],
};

export const AD_BRAND_THEMES: Record<AdBrandThemeId, AdBrandTheme> = {
  "lion-heritage": LION_HERITAGE,
  "savannah-trust": SAVANNAH_TRUST,
  "sunset-comunidad": SUNSET_COMUNIDAD,
  "black-lion-premium": BLACK_LION_PREMIUM,
};

/** Human labels + usage intent for every theme id — a future theme selector reads this so new themes need no UI changes. */
export const AD_BRAND_THEME_OPTIONS: { id: AdBrandThemeId; label: string; purpose: string }[] = [
  { id: "lion-heritage", label: LION_HERITAGE.label, purpose: LION_HERITAGE.purpose },
  { id: "savannah-trust", label: SAVANNAH_TRUST.label, purpose: SAVANNAH_TRUST.purpose },
  { id: "sunset-comunidad", label: SUNSET_COMUNIDAD.label, purpose: SUNSET_COMUNIDAD.purpose },
  { id: "black-lion-premium", label: BLACK_LION_PREMIUM.label, purpose: BLACK_LION_PREMIUM.purpose },
];

export const AD_BRAND_SHADE_OPTIONS: { id: AdBrandShadeId; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "standard", label: "Standard" },
  { id: "deep", label: "Deep" },
];

/** Safe fallback: unknown/missing theme ids resolve to Lion Heritage, never a thrown error. */
export function resolveAdBrandTheme(id: AdBrandThemeId | undefined | null): AdBrandTheme {
  return AD_BRAND_THEMES[id ?? "lion-heritage"] ?? LION_HERITAGE;
}

/** Safe fallback: unknown/missing shade ids resolve to "standard". */
export function resolveAdBrandColorSet(themeId: AdBrandThemeId | undefined | null, shadeId: AdBrandShadeId | undefined | null): AdBrandColorSet {
  const theme = resolveAdBrandTheme(themeId);
  return theme.shades[shadeId ?? "standard"] ?? theme.shades.standard;
}

/**
 * Maps a resolved color set onto `--ad-brand-*` CSS custom properties, mirroring the
 * `--dc-*` pattern from `digitalContactExecutiveTheme.ts`. A future hero/results-card/
 * public-detail renderer sets these once at its root — no component hardcodes hex values.
 */
export function adBrandThemeCssVars(colors: AdBrandColorSet): CSSProperties {
  return {
    "--ad-brand-primary": colors.primary,
    "--ad-brand-primary-dark": colors.primaryDark,
    "--ad-brand-secondary": colors.secondary,
    "--ad-brand-accent": colors.accent,
    "--ad-brand-accent-soft": colors.accentSoft,
    "--ad-brand-accent-border": colors.accentBorder,
  } as CSSProperties;
}
