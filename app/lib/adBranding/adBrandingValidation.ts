import { AD_BRAND_THEMES } from "./adBrandThemes";
import type {
  AdBrandBackgroundId,
  AdBrandShadeId,
  AdBrandThemeId,
  AdBrandingProfile,
  LogoPresentationId,
} from "./types";

/**
 * Leonix Ad Branding Layer — Gate 1 validation helpers.
 *
 * Fails safe: any unknown theme id, shade id, background id, or logo presentation id is
 * rejected outright, never guessed or coerced to a nearby valid value. This is what keeps
 * the layer a bounded preset system instead of a freeform picker.
 */

const AD_BRAND_SHADE_IDS: readonly AdBrandShadeId[] = ["light", "standard", "deep"];
const LOGO_PRESENTATION_IDS: readonly LogoPresentationId[] = ["boxed", "circular", "banner"];

export function isAdBrandThemeId(value: unknown): value is AdBrandThemeId {
  return typeof value === "string" && value in AD_BRAND_THEMES;
}

export function isAdBrandShadeId(value: unknown): value is AdBrandShadeId {
  return typeof value === "string" && (AD_BRAND_SHADE_IDS as readonly string[]).includes(value);
}

/** A background id is only valid when it's one of the chosen theme's approved pairings. */
export function isAdBrandBackgroundId(themeId: AdBrandThemeId, value: unknown): value is AdBrandBackgroundId {
  if (typeof value !== "string") return false;
  const theme = AD_BRAND_THEMES[themeId];
  return (theme.backgroundOptions as readonly string[]).includes(value);
}

export function isLogoPresentationId(value: unknown): value is LogoPresentationId {
  return typeof value === "string" && (LOGO_PRESENTATION_IDS as readonly string[]).includes(value);
}

export type AdBrandingProfileValidationResult =
  | { ok: true; profile: AdBrandingProfile }
  | { ok: false; reason: string };

/**
 * Strict validation: every field must be a known, approved value, and the background must
 * be one of the chosen theme's approved pairings. Returns a typed profile only when every
 * check passes — callers must never fall back to a partially-valid profile on `ok: false`.
 */
export function validateAdBrandingProfile(input: unknown): AdBrandingProfileValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "ad_branding_profile_not_an_object" };
  }
  const candidate = input as Partial<Record<keyof AdBrandingProfile, unknown>>;

  if (!isAdBrandThemeId(candidate.themeId)) {
    return { ok: false, reason: "unknown_theme_id" };
  }
  if (!isAdBrandShadeId(candidate.shadeId)) {
    return { ok: false, reason: "unknown_shade_id" };
  }
  if (!isAdBrandBackgroundId(candidate.themeId, candidate.backgroundId)) {
    return { ok: false, reason: "unknown_or_unapproved_background_id" };
  }
  const logo = candidate.logo as { presentation?: unknown } | undefined;
  if (!logo || typeof logo !== "object" || !isLogoPresentationId(logo.presentation)) {
    return { ok: false, reason: "unknown_logo_presentation_id" };
  }

  return {
    ok: true,
    profile: {
      themeId: candidate.themeId,
      shadeId: candidate.shadeId,
      backgroundId: candidate.backgroundId,
      logo: { presentation: logo.presentation },
    },
  };
}

/** Explicit fallback profile — for callers that need a default, never silently substituted for invalid input. */
export const DEFAULT_AD_BRANDING_PROFILE: AdBrandingProfile = {
  themeId: "lion-heritage",
  shadeId: "standard",
  backgroundId: "cream",
  logo: { presentation: "boxed" },
};
