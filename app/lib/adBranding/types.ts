/**
 * Leonix Ad Branding Layer — Gate 1 foundation types.
 *
 * ADDITIVE ONLY: not wired into Servicios, Restaurantes, or any other category yet. See
 * adBrandThemes.ts (preset implementation) and adBrandingValidation.ts (fail-safe
 * validation) alongside this file.
 *
 * This is a bounded, preset-driven brand identity layer, not a freeform design system:
 * advertisers choose from a fixed set of Leonix-approved themes, shades, background
 * pairings, and logo presentations. No arbitrary hex colors, fonts, or freeform layout
 * positions are ever accepted.
 */

export type AdBrandThemeId = "lion-heritage" | "savannah-trust" | "sunset-comunidad" | "black-lion-premium";

export type AdBrandShadeId = "light" | "standard" | "deep";

/** Approved background pairings. "photo" defers to the business's own hero/cover image. */
export type AdBrandBackgroundId = "cream" | "charcoal" | "photo";

/** Approved logo presentation styles — frame/shape only, never a crop tool or freeform position. */
export type LogoPresentationId = "boxed" | "circular" | "banner";

export type AdBrandColorSet = {
  /** Primary brand color for this shade — header/hero surface, primary CTA fill. */
  primary: string;
  /** Darker primary — hover states, gradient mid/end tones. */
  primaryDark: string;
  /** Deep complementary shade — gradient end-caps on dark surfaces. */
  secondary: string;
  /** Accent color (solid) — kicker text, icons, small highlights. */
  accent: string;
  /** Accent at low opacity — chip fills, soft tinted backgrounds. */
  accentSoft: string;
  /** Accent at border opacity — chip/card/icon borders. */
  accentBorder: string;
};

export type AdBrandTheme = {
  id: AdBrandThemeId;
  /** Human label for a future theme-selector UI. */
  label: string;
  /** Short usage-intent line shown alongside the theme in a picker (e.g. "premium / established"). */
  purpose: string;
  /** Concrete color set per shade — always an approved literal, never computed at runtime. */
  shades: Record<AdBrandShadeId, AdBrandColorSet>;
  /** Background pairings this theme is approved to use. Order implies visual preference. */
  backgroundOptions: readonly AdBrandBackgroundId[];
};

export type LogoPresentationSettings = {
  presentation: LogoPresentationId;
};

/**
 * The full advertiser branding selection for a listing. Not yet attached to any listing
 * type, form, or database column — this is the contract a future gate will wire into
 * Servicios' `ServiciosHeroBlock` and Restaurantes' `RestauranteListingDraft`/`listing_json`.
 */
export type AdBrandingProfile = {
  themeId: AdBrandThemeId;
  shadeId: AdBrandShadeId;
  backgroundId: AdBrandBackgroundId;
  logo: LogoPresentationSettings;
};
