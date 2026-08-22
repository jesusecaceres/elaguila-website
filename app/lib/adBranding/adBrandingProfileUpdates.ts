import { AD_BRAND_THEMES } from "./adBrandThemes";
import { isAdBrandBackgroundId } from "./adBrandingValidation";
import { DEFAULT_AD_BRANDING_PROFILE } from "./adBrandingValidation";
import type {
  AdBrandBackgroundId,
  AdBrandShadeId,
  AdBrandThemeId,
  AdBrandingProfile,
  LogoPresentationId,
} from "./types";

/**
 * Leonix Ad Branding Layer — pure, framework-agnostic profile-update helpers.
 *
 * Any owner-facing branding picker (Servicios today, other categories later) should update an
 * `AdBrandingProfile` through these functions rather than hand-rolling field assignment —
 * that's what guarantees a theme change can never leave a stale, unapproved background behind,
 * without every picker re-implementing that guard itself.
 */

/**
 * Selecting a theme keeps the current shade and logo presentation, and swaps the background to
 * the new theme's first approved pairing whenever the current background isn't one of the new
 * theme's approved options — never an invalid combination, never a guessed color.
 */
export function applyAdBrandThemeSelection(
  current: AdBrandingProfile | null,
  themeId: AdBrandThemeId,
): AdBrandingProfile {
  const theme = AD_BRAND_THEMES[themeId];
  const base = current ?? DEFAULT_AD_BRANDING_PROFILE;
  const backgroundId: AdBrandBackgroundId = isAdBrandBackgroundId(themeId, base.backgroundId)
    ? base.backgroundId
    : theme.backgroundOptions[0]!;
  return { themeId, shadeId: base.shadeId, backgroundId, logo: { ...base.logo } };
}

export function applyAdBrandShadeSelection(current: AdBrandingProfile, shadeId: AdBrandShadeId): AdBrandingProfile {
  return { ...current, shadeId };
}

/** No-op (returns `current` unchanged) if `backgroundId` isn't approved for the current theme. */
export function applyAdBrandBackgroundSelection(
  current: AdBrandingProfile,
  backgroundId: AdBrandBackgroundId,
): AdBrandingProfile {
  if (!isAdBrandBackgroundId(current.themeId, backgroundId)) return current;
  return { ...current, backgroundId };
}

export function applyAdBrandLogoPresentationSelection(
  current: AdBrandingProfile,
  presentation: LogoPresentationId,
): AdBrandingProfile {
  return { ...current, logo: { presentation } };
}
