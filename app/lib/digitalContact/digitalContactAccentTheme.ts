/**
 * Leonix Digital Contact Platform — accent theme tokens.
 *
 * The Contact Hub is a golden template: Leonix Burgundy stays the fixed primary
 * brand color (hero gradient, CTA buttons) for every profile, but a small set of
 * *secondary* accent touches (trust chip borders, avatar ring glow, kicker color)
 * are theme-driven so a future executive (e.g. a WarFitness-flavored profile) can
 * swap accents by setting `accentThemeId` in their registry entry — no component
 * duplication, no per-profile CSS.
 *
 * Chuy's profile intentionally uses `leonixGold` (the existing look, unchanged).
 * `savannahGreen` is prepared for future use and renders nowhere today.
 */

export type DigitalContactAccentThemeId = "leonixGold" | "savannahGreen";

export type DigitalContactAccentTheme = {
  id: DigitalContactAccentThemeId;
  /** Chip / divider / ring border tint. */
  accentBorder: string;
  /** Chip background tint (low-opacity accent on the hero gradient). */
  accentSoftBg: string;
  /** Kicker + company line text color. */
  accentText: string;
  /** Avatar ring outer glow color (rgba). */
  accentGlow: string;
};

const LEONIX_GOLD: DigitalContactAccentTheme = {
  id: "leonixGold",
  accentBorder: "#C9A84A",
  accentSoftBg: "rgba(201,168,74,0.12)",
  accentText: "#D9BE73",
  accentGlow: "rgba(201,168,74,0.45)",
};

/** Reserved for future executive themes (e.g. WarFitness-inspired profiles). Not used by any active profile yet. */
const SAVANNAH_GREEN: DigitalContactAccentTheme = {
  id: "savannahGreen",
  accentBorder: "#6E8B3D",
  accentSoftBg: "rgba(110,139,61,0.14)",
  accentText: "#9DBB6B",
  accentGlow: "rgba(110,139,61,0.45)",
};

const ACCENT_THEMES: Record<DigitalContactAccentThemeId, DigitalContactAccentTheme> = {
  leonixGold: LEONIX_GOLD,
  savannahGreen: SAVANNAH_GREEN,
};

export function resolveDigitalContactAccentTheme(id: DigitalContactAccentThemeId | undefined | null): DigitalContactAccentTheme {
  return ACCENT_THEMES[id ?? "leonixGold"] ?? LEONIX_GOLD;
}
