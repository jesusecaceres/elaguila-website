/**
 * Ad Branding Layer — Gate 3B Restaurantes visual-branding validation.
 * Confirms `resolveRestauranteBranding` reproduces today's exact Leonix defaults when unset,
 * derives real per-theme colors when a valid profile is set, different themes produce
 * genuinely different values, an invalid/corrupted profile behaves exactly like "unbranded"
 * once it has passed through the Gate 3A validation boundary, approved logo presentation ids
 * are preserved, and no arbitrary color path exists anywhere in this resolver.
 * Run: npx tsx scripts/verify-restaurantes-ad-branding-visual-3b-01.ts
 */
import assert from "node:assert/strict";

import { AD_BRAND_THEMES, DEFAULT_AD_BRANDING_PROFILE, validateAdBrandingProfile } from "../app/lib/adBranding";
import {
  resolveRestauranteBranding,
  restauranteLogoFrameSizeClass,
} from "../app/(site)/clasificados/restaurantes/shell/restauranteBrandResolver";

function run() {
  // --- NO BRANDING: must reproduce today's exact Leonix default. ---
  const noBrand = resolveRestauranteBranding(undefined);
  assert.equal(noBrand.headerBackgroundStyle, undefined, "unbranded must not override the header's gradient classes");
  assert.equal(noBrand.accentColor, "#C9A84A", "unbranded accent must match today's fixed Leonix gold");
  assert.equal(noBrand.accentBorderColor, "rgba(201,168,74,0.85)", "unbranded border accent must match today's logo-frame opacity");
  assert.equal(noBrand.logoPresentation, "boxed", "unbranded logo presentation must default to today's implicit boxed shape");
  assert.equal(
    restauranteLogoFrameSizeClass(noBrand.logoPresentation),
    "h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24 lg:h-[5.5rem] lg:w-[5.5rem]",
    "unbranded logo frame size must match today's fixed footprint exactly",
  );
  assert.equal(resolveRestauranteBranding(null).accentColor, "#C9A84A", "null is treated the same as undefined");

  // --- VALID BRANDING: an approved theme resolves to its actual approved theme values. ---
  const sunset = { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "sunset-comunidad" as const, shadeId: "deep" as const };
  const sunsetBrand = resolveRestauranteBranding(sunset);
  const sunsetColors = AD_BRAND_THEMES["sunset-comunidad"].shades.deep;
  assert.equal(sunsetBrand.accentColor, sunsetColors.accent);
  assert.equal(sunsetBrand.accentBorderColor, sunsetColors.accentBorder);
  assert.ok(sunsetBrand.headerBackgroundStyle, "a valid profile must produce a header gradient override");
  const gradientStr = String(sunsetBrand.headerBackgroundStyle!.backgroundImage);
  assert.ok(gradientStr.includes(sunsetColors.primary), "the gradient must reference the resolved theme color, not a hardcoded hex");
  assert.ok(gradientStr.includes(sunsetColors.secondary));
  assert.ok(gradientStr.includes(sunsetColors.primaryDark));
  assert.notDeepEqual(sunsetBrand.headerBackgroundStyle, noBrand.headerBackgroundStyle);

  // --- DIFFERENT THEMES: must produce genuinely different identity values (real personalization). ---
  const blackLionBrand = resolveRestauranteBranding({
    ...DEFAULT_AD_BRANDING_PROFILE,
    themeId: "black-lion-premium",
    backgroundId: "charcoal",
  });
  assert.notEqual(blackLionBrand.accentColor, sunsetBrand.accentColor);
  assert.notEqual(blackLionBrand.headerBackgroundStyle?.backgroundImage, sunsetBrand.headerBackgroundStyle?.backgroundImage);

  // --- INVALID BRANDING: once through the Gate 3A validator, resolves exactly like unbranded. ---
  const rejected = validateAdBrandingProfile({ themeId: "not-a-real-theme" });
  assert.equal(rejected.ok, false);
  const invalidResolved = resolveRestauranteBranding(undefined); // what a dropped/undefined field resolves to
  assert.deepEqual(invalidResolved, noBrand);

  // --- LOGO: every approved presentation id is preserved through the resolver. ---
  for (const presentation of ["boxed", "circular", "banner"] as const) {
    const branded = resolveRestauranteBranding({ ...DEFAULT_AD_BRANDING_PROFILE, logo: { presentation } });
    assert.equal(branded.logoPresentation, presentation);
  }
  assert.equal(
    restauranteLogoFrameSizeClass("banner"),
    "h-[5.25rem] w-[8.5rem] sm:h-24 sm:w-32 lg:h-[5.5rem] lg:w-36",
    "banner widens the frame but keeps the same fixed heights — never taller than the boxed default",
  );
  assert.equal(restauranteLogoFrameSizeClass("circular"), restauranteLogoFrameSizeClass("boxed"), "circular reuses the boxed footprint (equal sides)");

  // --- CONTRACT: no arbitrary color path — every resolver output traces to AD_BRAND_THEMES. ---
  for (const themeId of Object.keys(AD_BRAND_THEMES) as (keyof typeof AD_BRAND_THEMES)[]) {
    for (const shadeId of ["light", "standard", "deep"] as const) {
      const colors = AD_BRAND_THEMES[themeId].shades[shadeId];
      const resolved = resolveRestauranteBranding({ ...DEFAULT_AD_BRANDING_PROFILE, themeId, shadeId });
      assert.equal(resolved.accentColor, colors.accent);
      assert.equal(resolved.accentBorderColor, colors.accentBorder);
    }
  }

  console.log("verify-restaurantes-ad-branding-visual-3b-01: OK");
}

run();
