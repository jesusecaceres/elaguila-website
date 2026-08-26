/**
 * Ad Branding Layer — Gate 2B Servicios hero visual-integration validation.
 * Confirms `adBranding` survives resolveServiciosProfile into the render-ready
 * ServiciosProfileResolved shape, that the shared hero-branding resolver falls back to the
 * exact current Leonix default when unset, and that it derives real per-theme colors when set.
 * Run: npx tsx scripts/verify-servicios-ad-branding-hero-2b-01.ts
 */
import assert from "node:assert/strict";

import { DEFAULT_AD_BRANDING_PROFILE, AD_BRAND_THEMES } from "../app/lib/adBranding";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import {
  LX,
  LX_HERO_BG_STYLE,
  resolveServiciosHeroBranding,
} from "../app/(site)/servicios/components/serviciosLeonixBrand";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

function baseWireProfile(): ServiciosBusinessProfile {
  return {
    identity: { slug: "jardineria-sunset", businessName: "Jardineria Sunset" },
    hero: { logoUrl: "https://cdn.example.com/logo.png" },
    contact: {},
  };
}

function run() {
  // --- resolveServiciosHeroBranding: no branding must match the current Leonix default exactly. ---
  const defaultBrand = resolveServiciosHeroBranding(undefined);
  assert.deepEqual(defaultBrand.heroBackgroundStyle, LX_HERO_BG_STYLE, "default hero background must be unchanged");
  assert.equal(defaultBrand.accentColor, LX.gold, "default accent must be the current Leonix gold");
  assert.equal(defaultBrand.primaryActionColor, LX.burgundy, "default primary action must be the current Leonix burgundy");

  // --- resolveServiciosHeroBranding: a valid profile must derive real, distinct theme colors. ---
  const savannah = { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "savannah-trust" as const, shadeId: "deep" as const };
  const savannahBrand = resolveServiciosHeroBranding(savannah);
  const savannahColors = AD_BRAND_THEMES["savannah-trust"].shades.deep;
  assert.equal(savannahBrand.accentColor, savannahColors.accent);
  assert.equal(savannahBrand.primaryActionColor, savannahColors.primary);
  assert.ok(
    typeof savannahBrand.heroBackgroundStyle.background === "string" &&
      savannahBrand.heroBackgroundStyle.background.includes(savannahColors.primary),
    "branded hero gradient must reference the resolved theme color, not a hardcoded hex",
  );
  assert.notDeepEqual(savannahBrand.heroBackgroundStyle, defaultBrand.heroBackgroundStyle, "a branded theme must visibly differ from the default");

  // Two different themes must resolve to two different sets of colors (real personalization, not a no-op).
  const blackLionBrand = resolveServiciosHeroBranding({
    ...DEFAULT_AD_BRANDING_PROFILE,
    themeId: "black-lion-premium",
    backgroundId: "charcoal",
  });
  assert.notEqual(blackLionBrand.primaryActionColor, savannahBrand.primaryActionColor);

  // --- resolveServiciosProfile: branding survives into the render-ready ServiciosProfileResolved. ---
  const brandedWire: ServiciosBusinessProfile = { ...baseWireProfile(), adBranding: DEFAULT_AD_BRANDING_PROFILE };
  const brandedResolved = resolveServiciosProfile(brandedWire, "es");
  assert.deepEqual(brandedResolved.adBranding, DEFAULT_AD_BRANDING_PROFILE);

  // --- resolveServiciosProfile: an existing listing without branding renders exactly as before. ---
  const bareResolved = resolveServiciosProfile(baseWireProfile(), "es");
  assert.equal(bareResolved.adBranding, undefined, "a listing without branding must omit adBranding after resolve");
  assert.equal(bareResolved.hero.logoUrl, "https://cdn.example.com/logo.png", "unrelated hero fields still resolve correctly");

  // --- resolveServiciosProfile: an invalid/corrupted stored value is dropped, never rendered. ---
  const corruptWire: ServiciosBusinessProfile = {
    ...baseWireProfile(),
    adBranding: { themeId: "not-a-real-theme" } as never,
  };
  const corruptResolved = resolveServiciosProfile(corruptWire, "es");
  assert.equal(corruptResolved.adBranding, undefined, "an invalid stored branding value must never reach the renderer");

  console.log("verify-servicios-ad-branding-hero-2b-01: OK");
}

run();
