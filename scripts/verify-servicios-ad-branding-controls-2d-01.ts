/**
 * Ad Branding Layer — Gate 2D Servicios branding controls validation.
 * Verifies the profile-update helpers the Gate 2D UI panel calls: a theme change can never
 * leave a stale/unapproved background behind, an unapproved background selection is a safe
 * no-op, and every approved id the panel renders has complete bilingual copy (no id the UI
 * could show without a label). Does not render JSX — this worktree has no node_modules to run
 * a React test renderer — so this checks the exact pure logic the component calls.
 * Run: npx tsx scripts/verify-servicios-ad-branding-controls-2d-01.ts
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
  SERVICIOS_AD_BRAND_BACKGROUND_COPY,
  SERVICIOS_AD_BRAND_DEFAULT_OPTION_COPY,
  SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY,
  SERVICIOS_AD_BRAND_SHADE_COPY,
  SERVICIOS_AD_BRAND_THEME_COPY,
  SERVICIOS_AD_BRANDING_PANEL_COPY,
  SERVICIOS_AD_BRANDING_SECTION_LABELS,
} from "../app/(site)/clasificados/publicar/servicios/lib/serviciosAdBrandingCopy";

function nonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function run() {
  // --- Copy completeness: every approved id the panel can render has a bilingual label. ---
  assert.deepEqual(
    Object.keys(SERVICIOS_AD_BRAND_THEME_COPY).sort(),
    Object.keys(AD_BRAND_THEMES).sort(),
    "theme copy must cover exactly the approved theme ids — no more, no fewer",
  );
  for (const themeId of Object.keys(AD_BRAND_THEMES) as (keyof typeof AD_BRAND_THEMES)[]) {
    for (const lang of ["es", "en"] as const) {
      const c = SERVICIOS_AD_BRAND_THEME_COPY[themeId][lang];
      assert.ok(nonEmpty(c.label) && nonEmpty(c.descriptor), `${themeId}/${lang} theme copy must be non-empty`);
    }
  }

  assert.deepEqual(Object.keys(SERVICIOS_AD_BRAND_SHADE_COPY).sort(), ["deep", "light", "standard"]);
  assert.deepEqual(Object.keys(SERVICIOS_AD_BRAND_BACKGROUND_COPY).sort(), ["charcoal", "cream", "photo"]);
  assert.deepEqual(Object.keys(SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY).sort(), ["banner", "boxed", "circular"]);
  for (const map of [SERVICIOS_AD_BRAND_SHADE_COPY, SERVICIOS_AD_BRAND_BACKGROUND_COPY, SERVICIOS_AD_BRAND_LOGO_PRESENTATION_COPY]) {
    for (const key of Object.keys(map)) {
      assert.ok(nonEmpty((map as Record<string, Record<string, string>>)[key]!.es), `${key} missing Spanish copy`);
      assert.ok(nonEmpty((map as Record<string, Record<string, string>>)[key]!.en), `${key} missing English copy`);
    }
  }
  for (const lang of ["es", "en"] as const) {
    assert.ok(nonEmpty(SERVICIOS_AD_BRANDING_PANEL_COPY[lang].title));
    assert.ok(nonEmpty(SERVICIOS_AD_BRANDING_PANEL_COPY[lang].intro));
    assert.ok(nonEmpty(SERVICIOS_AD_BRAND_DEFAULT_OPTION_COPY[lang].label));
    const s = SERVICIOS_AD_BRANDING_SECTION_LABELS[lang];
    assert.ok(nonEmpty(s.theme) && nonEmpty(s.shade) && nonEmpty(s.background) && nonEmpty(s.logoPresentation));
  }

  // --- Selecting a theme from "no branding" (null) produces a fully valid, approved profile. ---
  const fromNull = applyAdBrandThemeSelection(null, "lion-heritage");
  assert.equal(fromNull.themeId, "lion-heritage");
  assert.equal(isAdBrandBackgroundId("lion-heritage", fromNull.backgroundId), true);

  // --- Critical Gate 4 rule: switching to a theme that doesn't approve the current background
  // must deterministically fall back to that theme's first approved pairing, never guess. ---
  const startedOnCream = applyAdBrandThemeSelection(null, "savannah-trust"); // savannah-trust approves "cream"
  assert.equal(startedOnCream.backgroundId, "cream");
  const switchedToBlackLion = applyAdBrandThemeSelection(startedOnCream, "black-lion-premium"); // never approves "cream"
  assert.notEqual(switchedToBlackLion.backgroundId, "cream");
  assert.equal(switchedToBlackLion.backgroundId, AD_BRAND_THEMES["black-lion-premium"].backgroundOptions[0]);
  assert.equal(isAdBrandBackgroundId("black-lion-premium", switchedToBlackLion.backgroundId), true);

  // --- A background that IS approved for the new theme must be preserved, not reset needlessly. ---
  const startedOnCharcoal = applyAdBrandBackgroundSelection(
    applyAdBrandThemeSelection(null, "lion-heritage"),
    "charcoal",
  );
  assert.equal(startedOnCharcoal.backgroundId, "charcoal");
  const switchedToSunset = applyAdBrandThemeSelection(startedOnCharcoal, "sunset-comunidad"); // also approves "charcoal"
  assert.equal(switchedToSunset.backgroundId, "charcoal", "an already-approved background must survive a theme change");

  // --- An unapproved background selection is a safe no-op, never a silent invalid write. ---
  const blackLionProfile = applyAdBrandThemeSelection(null, "black-lion-premium");
  const rejectedAttempt = applyAdBrandBackgroundSelection(blackLionProfile, "cream");
  assert.deepEqual(rejectedAttempt, blackLionProfile, "selecting an unapproved background must not change state");

  // --- Shade and logo-presentation selections only touch their own field. ---
  const shaded = applyAdBrandShadeSelection(DEFAULT_AD_BRANDING_PROFILE, "deep");
  assert.equal(shaded.shadeId, "deep");
  assert.equal(shaded.themeId, DEFAULT_AD_BRANDING_PROFILE.themeId);
  const logoChanged = applyAdBrandLogoPresentationSelection(DEFAULT_AD_BRANDING_PROFILE, "circular");
  assert.equal(logoChanged.logo.presentation, "circular");
  assert.equal(logoChanged.themeId, DEFAULT_AD_BRANDING_PROFILE.themeId);

  console.log("verify-servicios-ad-branding-controls-2d-01: OK");
}

run();
