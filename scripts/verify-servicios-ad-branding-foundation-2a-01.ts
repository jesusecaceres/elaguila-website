/**
 * Ad Branding Layer — Gate 2A Servicios data-path validation.
 * Confirms the optional `adBranding` field survives
 * ClasificadosServiciosApplicationState -> normalize -> ServiciosApplicationDraft ->
 * ServiciosBusinessProfile (profile_json), round-trips back on edit hydration, rejects
 * invalid values at every boundary, and never breaks a branding-less listing.
 * Run: npx tsx scripts/verify-servicios-ad-branding-foundation-2a-01.ts
 */
import assert from "node:assert/strict";

import { DEFAULT_AD_BRANDING_PROFILE } from "../app/lib/adBranding";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { serviciosPublishedToApplicationDraft } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";

function run() {
  const validBranding = { ...DEFAULT_AD_BRANDING_PROFILE };

  // --- Existing listing WITHOUT branding must keep working end-to-end. ---
  const bareState = { ...createDefaultClasificadosServiciosState(), businessName: "Plomeria El Aguila" };
  assert.equal(bareState.adBranding, null, "default state must have adBranding: null");

  const bareNormalized = normalizeClasificadosServiciosApplicationState(bareState);
  assert.equal(bareNormalized.adBranding, null);

  const bareDraft = mapClasificadosServiciosApplicationToServiciosDraft(bareNormalized, "es");
  assert.equal(bareDraft.adBranding, undefined, "draft must omit adBranding when unset");

  const bareWire = mapServiciosApplicationDraftToBusinessProfile(bareDraft);
  assert.equal(bareWire.adBranding, undefined, "profile_json must omit adBranding when unset");
  assert.equal(bareWire.identity.businessName, "Plomeria El Aguila", "unrelated fields still map correctly");

  // --- New optional branding must survive the full publish pipeline. ---
  const brandedState = {
    ...createDefaultClasificadosServiciosState(),
    businessName: "Jardineria Sunset",
    adBranding: validBranding,
  };
  const brandedNormalized = normalizeClasificadosServiciosApplicationState(brandedState);
  assert.deepEqual(brandedNormalized.adBranding, validBranding, "valid branding survives normalize");

  const brandedDraft = mapClasificadosServiciosApplicationToServiciosDraft(brandedNormalized, "es");
  assert.deepEqual(brandedDraft.adBranding, validBranding, "valid branding survives draft mapping");

  const brandedWire = mapServiciosApplicationDraftToBusinessProfile(brandedDraft);
  assert.deepEqual(brandedWire.adBranding, validBranding, "valid branding survives the final profile_json boundary");

  // --- Invalid/unapproved values are rejected outright, never coerced, at every boundary. ---
  const garbageRaw = { ...createDefaultClasificadosServiciosState(), adBranding: { themeId: "not-a-real-theme" } };
  const garbageNormalized = normalizeClasificadosServiciosApplicationState(garbageRaw);
  assert.equal(garbageNormalized.adBranding, null, "unknown theme id must be rejected, not coerced");

  const unapprovedPairingRaw = {
    ...createDefaultClasificadosServiciosState(),
    adBranding: { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "black-lion-premium", backgroundId: "cream" },
  };
  const unapprovedPairingNormalized = normalizeClasificadosServiciosApplicationState(unapprovedPairingRaw);
  assert.equal(
    unapprovedPairingNormalized.adBranding,
    null,
    "a background not approved for the chosen theme must be rejected",
  );

  // Defense in depth: even if an invalid value somehow reaches the draft mapper directly
  // (bypassing normalize), the final wire boundary must still refuse to persist it.
  const forcedInvalidDraft = mapClasificadosServiciosApplicationToServiciosDraft(
    { ...createDefaultClasificadosServiciosState(), adBranding: { themeId: "not-a-real-theme" } as never },
    "es",
  );
  const forcedInvalidWire = mapServiciosApplicationDraftToBusinessProfile(forcedInvalidDraft);
  assert.equal(forcedInvalidWire.adBranding, undefined, "wire mapper must re-validate and drop an invalid profile");

  // --- Edit-hydration round-trip: a published listing's branding survives re-opening the form. ---
  const hydratedWithBranding = serviciosPublishedToApplicationDraft({
    slug: "jardineria-sunset",
    business_name: "Jardineria Sunset",
    city: "Los Angeles",
    listing_status: "published",
    profile_json: { ...brandedWire },
  });
  assert.deepEqual(hydratedWithBranding.state.adBranding, validBranding, "edit hydration must restore valid branding");

  // A published row with a corrupted/legacy-invalid branding value must hydrate to null, never a guess.
  const hydratedWithCorruptBranding = serviciosPublishedToApplicationDraft({
    slug: "jardineria-sunset",
    business_name: "Jardineria Sunset",
    city: "Los Angeles",
    listing_status: "published",
    profile_json: { ...bareWire, adBranding: { themeId: "not-a-real-theme" } as never },
  });
  assert.equal(hydratedWithCorruptBranding.state.adBranding, null, "corrupted stored branding must hydrate to null");

  // A published row with no branding at all (every pre-Gate-2A listing) must hydrate cleanly.
  const hydratedBare = serviciosPublishedToApplicationDraft({
    slug: "plomeria-el-aguila",
    business_name: "Plomeria El Aguila",
    city: "Los Angeles",
    listing_status: "published",
    profile_json: { ...bareWire },
  });
  assert.equal(hydratedBare.state.adBranding, null, "pre-existing listings without branding hydrate to null");

  console.log("verify-servicios-ad-branding-foundation-2a-01: OK");
}

run();
