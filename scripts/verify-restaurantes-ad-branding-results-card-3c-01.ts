/**
 * Ad Branding Layer — Gate 3C Restaurantes results-card branding validation.
 * Confirms `resolveRestauranteResultCardBranding` is null (zero new styling) for every
 * unbranded listing, derives real per-theme colors when a valid profile is set, different
 * themes produce genuinely different identity values, approved logo presentation ids are
 * preserved, and no arbitrary color path exists.
 * Run: npx tsx scripts/verify-restaurantes-ad-branding-results-card-3c-01.ts
 */
import assert from "node:assert/strict";

import { AD_BRAND_THEMES, DEFAULT_AD_BRANDING_PROFILE } from "../app/lib/adBranding";
import { resolveRestauranteResultCardBranding } from "../app/(site)/clasificados/restaurantes/shell/restauranteBrandResolver";

function run() {
  // --- NO BRANDING: must return null, guaranteeing zero new DOM/style on the card. ---
  assert.equal(resolveRestauranteResultCardBranding(undefined), null);
  assert.equal(resolveRestauranteResultCardBranding(null), null);

  // --- VALID BRANDING: an approved theme resolves to its actual approved theme values. ---
  const sunset = { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "sunset-comunidad" as const, shadeId: "light" as const };
  const sunsetBrand = resolveRestauranteResultCardBranding(sunset);
  const sunsetColors = AD_BRAND_THEMES["sunset-comunidad"].shades.light;
  assert.ok(sunsetBrand);
  assert.equal(sunsetBrand!.accentColor, sunsetColors.accent);
  assert.equal(sunsetBrand!.accentBorderColor, sunsetColors.accentBorder);
  assert.equal(sunsetBrand!.logoPresentation, "boxed");

  // --- DIFFERENT THEMES: must produce genuinely different identity values. ---
  const lionBrand = resolveRestauranteResultCardBranding({
    ...DEFAULT_AD_BRANDING_PROFILE,
    themeId: "lion-heritage",
    shadeId: "deep",
  });
  assert.ok(lionBrand);
  assert.notEqual(lionBrand!.accentColor, sunsetBrand!.accentColor);
  assert.notEqual(lionBrand!.accentBorderColor, sunsetBrand!.accentBorderColor);

  // --- INVALID BRANDING: an undefined field (post Gate 3A rejection) safely defaults to null. ---
  // (Gate 3A already proves invalid raw input is dropped to `undefined` before reaching here —
  // this asserts the card resolver's own contract for that already-safe input.)
  assert.equal(resolveRestauranteResultCardBranding(undefined), null);

  // --- LOGO: every approved presentation id is preserved through the resolver. ---
  for (const presentation of ["boxed", "circular", "banner"] as const) {
    const branded = resolveRestauranteResultCardBranding({ ...DEFAULT_AD_BRANDING_PROFILE, logo: { presentation } });
    assert.equal(branded?.logoPresentation, presentation);
  }

  // --- CONTRACT: no arbitrary color path — every resolver output traces to AD_BRAND_THEMES. ---
  for (const themeId of Object.keys(AD_BRAND_THEMES) as (keyof typeof AD_BRAND_THEMES)[]) {
    for (const shadeId of ["light", "standard", "deep"] as const) {
      const colors = AD_BRAND_THEMES[themeId].shades[shadeId];
      const resolved = resolveRestauranteResultCardBranding({ ...DEFAULT_AD_BRANDING_PROFILE, themeId, shadeId });
      assert.equal(resolved?.accentColor, colors.accent);
      assert.equal(resolved?.accentBorderColor, colors.accentBorder);
    }
  }

  console.log("verify-restaurantes-ad-branding-results-card-3c-01: OK");
}

run();
