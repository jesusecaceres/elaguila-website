import type { CSSProperties } from "react";
import type { AdBrandingProfile, LogoPresentationId } from "@/app/lib/adBranding";
import { resolveAdBrandColorSet } from "@/app/lib/adBranding";

/**
 * Leonix Ad Branding Layer (Gate 3B) — Restaurantes header visual resolver.
 *
 * A restaurant-domain composition of the global `app/lib/adBranding` tokens — no theme,
 * shade, or color is defined here; everything traces back to `resolveAdBrandColorSet`. This
 * is deliberately narrower than the Servicios hero resolver: Restaurantes is food-first, so
 * branding only ever supplies a header atmosphere gradient, a single sparing accent color, and
 * a logo frame preset — never a text color, a CTA color, or anything that could compete with
 * the hero food image.
 *
 * `RestauranteProfileHeader` only applies `headerBackgroundStyle`/accent overrides when
 * `adBranding` is actually present — every value returned here for the unbranded case exists
 * so callers/tests have a concrete "current Leonix default" to assert against, matching
 * `resolveServiciosHeroBranding`'s pattern in the Servicios domain.
 */

/** Today's fixed Leonix gold — used for the header hairline, radial glow, and logo border. */
const RESTAURANTE_DEFAULT_ACCENT = "#C9A84A";
/** Today's fixed Leonix gold at logo-border opacity (matches `border-[#C9A84A]/85`). */
const RESTAURANTE_DEFAULT_ACCENT_BORDER = "rgba(201,168,74,0.85)";

export type RestauranteBrandPresentation = {
  /**
   * Set only when a valid `AdBrandingProfile` is present — an inline-style gradient the header
   * applies over its default Tailwind gradient classes. `undefined` means "no override": the
   * header's existing gradient classes render exactly as they do today.
   */
  headerBackgroundStyle?: CSSProperties;
  /** Sparing accent — top hairline tint, radial glow, logo frame border. Never body text. */
  accentColor: string;
  /** Pre-alpha'd accent for border/line use. */
  accentBorderColor: string;
  /** Approved logo frame preset. Defaults to "boxed" (today's implicit shape) when unbranded. */
  logoPresentation: LogoPresentationId;
};

export function resolveRestauranteBranding(adBranding: AdBrandingProfile | undefined | null): RestauranteBrandPresentation {
  if (!adBranding) {
    return {
      headerBackgroundStyle: undefined,
      accentColor: RESTAURANTE_DEFAULT_ACCENT,
      accentBorderColor: RESTAURANTE_DEFAULT_ACCENT_BORDER,
      logoPresentation: "boxed",
    };
  }
  const colors = resolveAdBrandColorSet(adBranding.themeId, adBranding.shadeId);
  return {
    headerBackgroundStyle: {
      backgroundImage: `linear-gradient(to bottom right, ${colors.secondary}, ${colors.primaryDark}, ${colors.primary})`,
    },
    accentColor: colors.accent,
    accentBorderColor: colors.accentBorder,
    logoPresentation: adBranding.logo.presentation,
  };
}

/**
 * Logo frame size, keyed off the approved presentation preset only. "boxed"/"circular" keep
 * today's fixed square footprint (a circle needs equal sides); "banner" widens the frame into
 * a horizontal lockup, height unchanged, so it can never grow tall enough to dominate the
 * header or push content off a narrow screen.
 */
export function restauranteLogoFrameSizeClass(presentation: LogoPresentationId): string {
  if (presentation === "banner") {
    return "h-[5.25rem] w-[8.5rem] sm:h-24 sm:w-32 lg:h-[5.5rem] lg:w-36";
  }
  return "h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24 lg:h-[5.5rem] lg:w-[5.5rem]";
}

/**
 * Leonix Ad Branding Layer (Gate 3C) — results-card identity resolver.
 *
 * Deliberately narrower than {@link resolveRestauranteBranding}: results cards are
 * discovery-first, so branding here is limited to a thin accent line, a border tint, and the
 * corner logo mark's border/radius — never a background fill, never a resized card, never
 * anything that could compete with the hero food photo. Returns `null` for every unbranded
 * listing so a card with no `adBranding` emits zero new DOM/style — "current behavior" is
 * "nothing changed," not "changed to a matching value."
 */
export type RestauranteResultCardBrandPresentation = {
  accentColor: string;
  accentBorderColor: string;
  logoPresentation: LogoPresentationId;
};

export function resolveRestauranteResultCardBranding(
  adBranding: AdBrandingProfile | undefined | null,
): RestauranteResultCardBrandPresentation | null {
  if (!adBranding) return null;
  const colors = resolveAdBrandColorSet(adBranding.themeId, adBranding.shadeId);
  return {
    accentColor: colors.accent,
    accentBorderColor: colors.accentBorder,
    logoPresentation: adBranding.logo.presentation,
  };
}
