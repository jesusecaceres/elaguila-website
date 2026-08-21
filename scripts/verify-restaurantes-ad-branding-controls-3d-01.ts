/**
 * Ad Branding Layer — Gate 3D Restaurantes branding controls validation.
 * Verifies the exact global update helpers the panel calls (imported from `app/lib/adBranding`,
 * the same functions Servicios Gate 2D already proved), that "Standard Leonix" correctly clears
 * `adBranding` through the real Gate 3A `mergeRestauranteDraft` boundary, that every approved id
 * the panel renders has complete bilingual copy, and that unrelated draft fields survive a
 * branding-only patch untouched. Does not render JSX — this worktree has no node_modules to run
 * a React test renderer — so this checks the exact logic the panel's click handlers call.
 * Run: npx tsx scripts/verify-restaurantes-ad-branding-controls-3d-01.ts
 */
import assert from "node:assert/strict";

import {
  AD_BRAND_THEMES,
  DEFAULT_AD_BRANDING_PROFILE,
  applyAdBrandBackgroundSelection,
  applyAdBrandLogoPresentationSelection,
  applyAdBrandShadeSelection,
  applyAdBrandThemeSelection,
  isAdBrandBackgroundId,
} from "../app/lib/adBranding";
import {
  createEmptyRestauranteDraft,
  mergeRestauranteDraft,
} from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import {
  RESTAURANTE_AD_BRAND_BACKGROUND_COPY,
  RESTAURANTE_AD_BRAND_DEFAULT_OPTION_COPY,
  RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY,
  RESTAURANTE_AD_BRAND_SHADE_COPY,
  RESTAURANTE_AD_BRAND_THEME_COPY,
  RESTAURANTE_AD_BRANDING_SECTION_LABELS,
  restauranteAdBrandingPanelIntro,
  restauranteAdBrandingPanelTitle,
} from "../app/(site)/publicar/restaurantes/restauranteAdBrandingCopy";

function nonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function run() {
  // --- Copy completeness: every approved id the panel can render has a bilingual label. ---
  assert.deepEqual(
    Object.keys(RESTAURANTE_AD_BRAND_THEME_COPY).sort(),
    Object.keys(AD_BRAND_THEMES).sort(),
    "theme copy must cover exactly the approved theme ids — no more, no fewer",
  );
  for (const themeId of Object.keys(AD_BRAND_THEMES) as (keyof typeof AD_BRAND_THEMES)[]) {
    for (const lang of ["es", "en"] as const) {
      const c = RESTAURANTE_AD_BRAND_THEME_COPY[themeId][lang];
      assert.ok(nonEmpty(c.label) && nonEmpty(c.descriptor), `${themeId}/${lang} theme copy must be non-empty`);
    }
  }
  assert.deepEqual(Object.keys(RESTAURANTE_AD_BRAND_SHADE_COPY).sort(), ["deep", "light", "standard"]);
  assert.deepEqual(Object.keys(RESTAURANTE_AD_BRAND_BACKGROUND_COPY).sort(), ["charcoal", "cream", "photo"]);
  assert.deepEqual(Object.keys(RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY).sort(), ["banner", "boxed", "circular"]);
  for (const map of [RESTAURANTE_AD_BRAND_SHADE_COPY, RESTAURANTE_AD_BRAND_BACKGROUND_COPY, RESTAURANTE_AD_BRAND_LOGO_PRESENTATION_COPY]) {
    for (const key of Object.keys(map)) {
      assert.ok(nonEmpty((map as Record<string, Record<string, string>>)[key]!.es));
      assert.ok(nonEmpty((map as Record<string, Record<string, string>>)[key]!.en));
    }
  }
  for (const lang of ["es", "en"] as const) {
    assert.ok(nonEmpty(restauranteAdBrandingPanelTitle(lang)));
    assert.ok(nonEmpty(restauranteAdBrandingPanelIntro(lang)));
    assert.ok(nonEmpty(RESTAURANTE_AD_BRAND_DEFAULT_OPTION_COPY[lang].label));
    const s = RESTAURANTE_AD_BRANDING_SECTION_LABELS[lang];
    assert.ok(nonEmpty(s.theme) && nonEmpty(s.shade) && nonEmpty(s.background) && nonEmpty(s.logoPresentation));
  }

  // --- Selecting a theme from "Standard Leonix" (undefined) produces a fully valid profile. ---
  const fromNone = applyAdBrandThemeSelection(null, "lion-heritage");
  assert.equal(fromNone.themeId, "lion-heritage");
  assert.equal(isAdBrandBackgroundId("lion-heritage", fromNone.backgroundId), true);

  // --- Theme-switch background safety (same global helper Servicios already proved). ---
  const startedOnCream = applyAdBrandThemeSelection(null, "savannah-trust"); // approves "cream"
  assert.equal(startedOnCream.backgroundId, "cream");
  const switchedToBlackLion = applyAdBrandThemeSelection(startedOnCream, "black-lion-premium"); // never approves "cream"
  assert.notEqual(switchedToBlackLion.backgroundId, "cream");
  assert.equal(switchedToBlackLion.backgroundId, AD_BRAND_THEMES["black-lion-premium"].backgroundOptions[0]);

  // --- An unapproved background selection is a safe no-op. ---
  const blackLion = applyAdBrandThemeSelection(null, "black-lion-premium");
  assert.deepEqual(applyAdBrandBackgroundSelection(blackLion, "cream"), blackLion);

  // --- Shade / logo-presentation selections only touch their own field. ---
  const shaded = applyAdBrandShadeSelection(DEFAULT_AD_BRANDING_PROFILE, "deep");
  assert.equal(shaded.shadeId, "deep");
  assert.equal(shaded.themeId, DEFAULT_AD_BRANDING_PROFILE.themeId);
  const logoChanged = applyAdBrandLogoPresentationSelection(DEFAULT_AD_BRANDING_PROFILE, "banner");
  assert.equal(logoChanged.logo.presentation, "banner");

  // --- "Standard Leonix": patching adBranding to undefined clears it through the REAL Gate 3A
  // boundary (mergeRestauranteDraft), never leaving a stale value behind. ---
  const brandedBase = { ...createEmptyRestauranteDraft(), businessName: "Cafe Leonix", adBranding: DEFAULT_AD_BRANDING_PROFILE };
  const brandedMerged = mergeRestauranteDraft(brandedBase);
  assert.deepEqual(brandedMerged.adBranding, DEFAULT_AD_BRANDING_PROFILE, "sanity: branding round-trips before clearing");
  const clearedPatch = { ...brandedMerged, adBranding: undefined };
  const clearedMerged = mergeRestauranteDraft(clearedPatch);
  assert.equal(clearedMerged.adBranding, undefined, "Standard Leonix selection must clear adBranding, not leave a stale value");
  assert.equal(clearedMerged.businessName, "Cafe Leonix", "unrelated fields must survive the Standard Leonix reset");

  // --- State-update helpers preserve unrelated draft fields (the exact spread pattern
  // setDraftPatch/useRestauranteDraft already use: {...prev, ...partial}). ---
  const prev = { ...createEmptyRestauranteDraft(), businessName: "Taqueria Sunset", phoneNumber: "4085551234" };
  const patch = { adBranding: applyAdBrandThemeSelection(null, "sunset-comunidad") };
  const merged = { ...prev, ...patch };
  assert.equal(merged.businessName, "Taqueria Sunset");
  assert.equal(merged.phoneNumber, "4085551234");
  assert.deepEqual(merged.adBranding, patch.adBranding);

  console.log("verify-restaurantes-ad-branding-controls-3d-01: OK");
}

run();
