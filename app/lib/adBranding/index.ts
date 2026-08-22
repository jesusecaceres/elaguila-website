/**
 * Leonix Ad Branding Layer — Gate 1 foundation barrel export.
 *
 * ADDITIVE ONLY: nothing in app/lib/adBranding/ is wired into Servicios, Restaurantes, or
 * any other category yet, and none of it touches the Tienda Business Card Studio,
 * checkout, or any commerce flow. This module only defines the preset theme/shade/
 * background/logo-presentation contract for the Ad Branding Layer — a future gate wires
 * this into each enabled category's application, preview, hero, results-card, and
 * public-detail layers (Servicios and Restaurantes first, per the locked V1 scope).
 */

export type {
  AdBrandBackgroundId,
  AdBrandColorSet,
  AdBrandShadeId,
  AdBrandTheme,
  AdBrandThemeId,
  AdBrandingProfile,
  LogoPresentationId,
  LogoPresentationSettings,
} from "./types";

export {
  AD_BRAND_SHADE_OPTIONS,
  AD_BRAND_THEMES,
  AD_BRAND_THEME_OPTIONS,
  adBrandThemeCssVars,
  resolveAdBrandColorSet,
  resolveAdBrandTheme,
} from "./adBrandThemes";

export {
  DEFAULT_AD_BRANDING_PROFILE,
  isAdBrandBackgroundId,
  isAdBrandShadeId,
  isAdBrandThemeId,
  isLogoPresentationId,
  validateAdBrandingProfile,
} from "./adBrandingValidation";
export type { AdBrandingProfileValidationResult } from "./adBrandingValidation";

export {
  applyAdBrandBackgroundSelection,
  applyAdBrandLogoPresentationSelection,
  applyAdBrandShadeSelection,
  applyAdBrandThemeSelection,
} from "./adBrandingProfileUpdates";
