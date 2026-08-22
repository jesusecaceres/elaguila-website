/**
 * Ad Branding Layer — Gate 1 foundation validation.
 * Run: npx tsx scripts/verify-ad-branding-foundation-01.ts
 */
import assert from "node:assert/strict";

import {
  AD_BRAND_SHADE_OPTIONS,
  AD_BRAND_THEME_OPTIONS,
  AD_BRAND_THEMES,
  DEFAULT_AD_BRANDING_PROFILE,
  isAdBrandBackgroundId,
  isAdBrandShadeId,
  isAdBrandThemeId,
  isLogoPresentationId,
  resolveAdBrandColorSet,
  resolveAdBrandTheme,
  validateAdBrandingProfile,
} from "../app/lib/adBranding";

const EXPECTED_THEME_IDS = ["lion-heritage", "savannah-trust", "sunset-comunidad", "black-lion-premium"] as const;
const EXPECTED_SHADE_IDS = ["light", "standard", "deep"] as const;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function run() {
  // Themes exist, one entry per approved id, three shades each, hex-valid colors.
  assert.deepEqual(
    Object.keys(AD_BRAND_THEMES).sort(),
    [...EXPECTED_THEME_IDS].sort(),
    "AD_BRAND_THEMES must contain exactly the four approved theme ids",
  );
  assert.equal(AD_BRAND_THEME_OPTIONS.length, 4);
  assert.equal(AD_BRAND_SHADE_OPTIONS.length, 3);

  for (const themeId of EXPECTED_THEME_IDS) {
    const theme = AD_BRAND_THEMES[themeId];
    assert.ok(theme, `Missing theme ${themeId}`);
    assert.equal(theme.id, themeId);
    assert.ok(theme.backgroundOptions.length > 0, `${themeId} must offer at least one background`);

    for (const shadeId of EXPECTED_SHADE_IDS) {
      const colors = theme.shades[shadeId];
      assert.ok(colors, `${themeId} missing shade ${shadeId}`);
      assert.ok(HEX_RE.test(colors.primary), `${themeId}/${shadeId} primary must be a 6-digit hex`);
      assert.ok(HEX_RE.test(colors.primaryDark), `${themeId}/${shadeId} primaryDark must be a 6-digit hex`);
      assert.ok(HEX_RE.test(colors.secondary), `${themeId}/${shadeId} secondary must be a 6-digit hex`);
      assert.ok(HEX_RE.test(colors.accent), `${themeId}/${shadeId} accent must be a 6-digit hex`);
    }

    assert.equal(resolveAdBrandColorSet(themeId, "standard"), theme.shades.standard);
  }

  // Black Lion Premium is dark-forward only — "cream" must never be an approved pairing.
  assert.equal(AD_BRAND_THEMES["black-lion-premium"].backgroundOptions.includes("cream"), false);

  // Safe fallbacks never throw on unknown/missing input.
  assert.equal(resolveAdBrandTheme(undefined).id, "lion-heritage");
  assert.equal(resolveAdBrandTheme(null).id, "lion-heritage");
  // @ts-expect-error deliberately passing an invalid id to prove the fallback holds
  assert.equal(resolveAdBrandTheme("not-a-real-theme").id, "lion-heritage");
  assert.equal(resolveAdBrandColorSet("lion-heritage", undefined), AD_BRAND_THEMES["lion-heritage"].shades.standard);

  // Type guards accept only approved values.
  assert.equal(isAdBrandThemeId("lion-heritage"), true);
  assert.equal(isAdBrandThemeId("not-a-real-theme"), false);
  assert.equal(isAdBrandThemeId(""), false);
  assert.equal(isAdBrandShadeId("standard"), true);
  assert.equal(isAdBrandShadeId("ultra"), false);
  assert.equal(isLogoPresentationId("boxed"), true);
  assert.equal(isLogoPresentationId("freeform"), false);
  assert.equal(isAdBrandBackgroundId("lion-heritage", "cream"), true);
  assert.equal(isAdBrandBackgroundId("black-lion-premium", "cream"), false, "cream is not approved for Black Lion Premium");

  // Valid profile round-trips.
  const validResult = validateAdBrandingProfile(DEFAULT_AD_BRANDING_PROFILE);
  assert.equal(validResult.ok, true);

  // Every invalid-input shape is rejected, never coerced.
  assert.equal(validateAdBrandingProfile(null).ok, false);
  assert.equal(validateAdBrandingProfile({}).ok, false);
  assert.equal(
    validateAdBrandingProfile({ ...DEFAULT_AD_BRANDING_PROFILE, themeId: "not-a-real-theme" }).ok,
    false,
  );
  assert.equal(
    validateAdBrandingProfile({ ...DEFAULT_AD_BRANDING_PROFILE, shadeId: "ultra" }).ok,
    false,
  );
  assert.equal(
    // "photo" is not approved for Savannah Trust — must fail, not silently pass.
    validateAdBrandingProfile({ ...DEFAULT_AD_BRANDING_PROFILE, themeId: "savannah-trust", backgroundId: "charcoal" }).ok,
    false,
  );
  assert.equal(
    validateAdBrandingProfile({ ...DEFAULT_AD_BRANDING_PROFILE, logo: { presentation: "freeform" } }).ok,
    false,
  );
  assert.equal(
    validateAdBrandingProfile({ ...DEFAULT_AD_BRANDING_PROFILE, logo: undefined }).ok,
    false,
  );

  console.log("verify-ad-branding-foundation-01: OK");
}

run();
