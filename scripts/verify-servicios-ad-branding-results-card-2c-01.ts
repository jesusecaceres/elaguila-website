/**
 * Ad Branding Layer — Gate 2C Servicios results-card branding validation.
 * Confirms `resolveServiciosResultCardBranding` is null (no visual change) when a listing has
 * no branding, derives real per-theme colors when one is set, never duplicates theme/shade
 * logic (colors always trace back to `resolveAdBrandColorSet`), and safely rejects invalid
 * stored values by never producing branding output for them.
 * Run: npx tsx scripts/verify-servicios-ad-branding-results-card-2c-01.ts
 */
import assert from "node:assert/strict";

import { AD_BRAND_THEMES, DEFAULT_AD_BRANDING_PROFILE } from "../app/lib/adBranding";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { resolveServiciosResultCardBranding } from "../app/(site)/servicios/components/serviciosLeonixBrand";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

function baseWireProfile(): ServiciosBusinessProfile {
  return {
    identity: { slug: "electricista-del-valle", businessName: "Electricista Del Valle" },
    hero: { logoUrl: "https://cdn.example.com/logo.png" },
    contact: {},
  };
}

function run() {
  // --- No branding: the resolver must return null, guaranteeing zero DOM/style diff on the card. ---
  const noBrand = resolveServiciosResultCardBranding(undefined);
  assert.equal(noBrand, null, "a listing without branding must render the card unchanged");

  // --- A valid branding profile derives real, theme-specific colors — not a duplicated palette. ---
  const sunsetProfile = { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "sunset-comunidad" as const, shadeId: "light" as const };
  const sunsetBrand = resolveServiciosResultCardBranding(sunsetProfile);
  const sunsetColors = AD_BRAND_THEMES["sunset-comunidad"].shades.light;
  assert.ok(sunsetBrand, "a valid branding profile must produce card branding");
  assert.equal(sunsetBrand!.accentColor, sunsetColors.accent);
  assert.equal(sunsetBrand!.accentBorderColor, sunsetColors.accentBorder);

  // Different themes must resolve to different colors (real personalization, colors traced to
  // the single approved AD_BRAND_THEMES source, never a second hardcoded palette in this file).
  const lionBrand = resolveServiciosResultCardBranding({
    ...DEFAULT_AD_BRANDING_PROFILE,
    themeId: "lion-heritage",
    shadeId: "deep",
  });
  assert.notEqual(lionBrand!.accentColor, sunsetBrand!.accentColor);

  // --- End-to-end: resolveServiciosProfile -> resolveServiciosResultCardBranding matches the
  // same pipeline the hero already uses (Gate 2B) — no second/duplicate branding resolver. ---
  const brandedWire: ServiciosBusinessProfile = { ...baseWireProfile(), adBranding: DEFAULT_AD_BRANDING_PROFILE };
  const brandedResolved = resolveServiciosProfile(brandedWire, "es");
  const brandedCard = resolveServiciosResultCardBranding(brandedResolved.adBranding);
  assert.ok(brandedCard, "a resolved profile carrying valid branding must produce card branding");

  // --- An unbranded, pre-existing listing must behave exactly as before end-to-end. ---
  const bareResolved = resolveServiciosProfile(baseWireProfile(), "es");
  const bareCard = resolveServiciosResultCardBranding(bareResolved.adBranding);
  assert.equal(bareCard, null);

  // --- Invalid/corrupted stored branding never reaches the card (dropped at resolveServiciosProfile). ---
  const corruptWire: ServiciosBusinessProfile = {
    ...baseWireProfile(),
    adBranding: { themeId: "not-a-real-theme" } as never,
  };
  const corruptResolved = resolveServiciosProfile(corruptWire, "es");
  const corruptCard = resolveServiciosResultCardBranding(corruptResolved.adBranding);
  assert.equal(corruptCard, null, "an invalid stored branding value must fall back to the safe (unbranded) default");

  console.log("verify-servicios-ad-branding-results-card-2c-01: OK");
}

run();
