/**
 * Ad Branding Layer — Gate 3A Restaurantes data-foundation validation.
 * Confirms the optional `adBranding` field survives the single Restaurantes normalization
 * boundary (`mergeRestauranteDraft`, shared by the publish route, client draft-storage
 * hydration, and published-listing edit hydration), reaches `listing_json` unchanged via the
 * existing object-spread publish mapper, reaches the shared shell-data renderer input
 * (`RestaurantDetailShellData`, consumed by both `RestauranteProfileHeader` and
 * `RestaurantePreviewCard`), survives a publish -> reopen/edit round trip, and rejects invalid
 * values at every boundary without ever breaking a branding-less listing.
 * Run: npx tsx scripts/verify-restaurantes-ad-branding-foundation-3a-01.ts
 */
import assert from "node:assert/strict";

import { AD_BRAND_THEMES, DEFAULT_AD_BRANDING_PROFILE } from "../app/lib/adBranding";
import {
  createEmptyRestauranteDraft,
  mergeRestauranteDraft,
} from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { mapRestauranteDraftToShellData } from "../app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import {
  draftToRestaurantePublicListingInsert,
  listingJsonToDraft,
} from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";

function baseFilledDraft() {
  return {
    ...createEmptyRestauranteDraft(),
    businessName: "Taqueria El Aguila",
    businessType: "restaurant",
    primaryCuisine: "mexican",
    cityCanonical: "San Jose",
    heroImage: "https://cdn.example.com/hero.jpg",
    phoneNumber: "4085551234",
  };
}

function run() {
  const validBranding = { ...DEFAULT_AD_BRANDING_PROFILE };

  // --- OLD RESTAURANT: no adBranding must keep working end-to-end. ---
  const bareDraft = mergeRestauranteDraft(baseFilledDraft());
  assert.equal(bareDraft.adBranding, undefined, "default/existing draft must have no adBranding");

  const bareShell = mapRestauranteDraftToShellData(bareDraft);
  assert.equal(bareShell.adBranding, undefined, "shell data must omit adBranding when unset");
  assert.equal(bareShell.businessName, "Taqueria El Aguila", "unrelated fields still map correctly");

  const bareInsertRow = draftToRestaurantePublicListingInsert(bareDraft, "taqueria-el-aguila");
  const bareListingJson = bareInsertRow.listing_json as Record<string, unknown>;
  assert.equal(bareListingJson.adBranding, undefined, "listing_json must omit adBranding when unset");

  // --- NEW RESTAURANT: valid adBranding must survive the full data path. ---
  const brandedDraft = mergeRestauranteDraft({ ...baseFilledDraft(), adBranding: validBranding });
  assert.deepEqual(brandedDraft.adBranding, validBranding, "valid branding survives mergeRestauranteDraft");

  const brandedShell = mapRestauranteDraftToShellData(brandedDraft);
  assert.deepEqual(brandedShell.adBranding, validBranding, "valid branding reaches RestaurantDetailShellData");

  const brandedInsertRow = draftToRestaurantePublicListingInsert(brandedDraft, "taqueria-el-aguila-2");
  const brandedListingJson = brandedInsertRow.listing_json as Record<string, unknown>;
  assert.deepEqual(brandedListingJson.adBranding, validBranding, "valid branding survives into listing_json");

  // --- Publish -> reopen/edit round trip: listing_json.adBranding must rehydrate unchanged. ---
  const reopenedDraft = listingJsonToDraft(brandedListingJson);
  assert.deepEqual(reopenedDraft.adBranding, validBranding, "branding survives the publish -> reopen/edit round trip");

  // --- CORRUPT RESTAURANT: invalid adBranding is safely dropped; listing remains usable. ---
  const invalidThemeDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { themeId: "not-a-real-theme" },
  });
  assert.equal(invalidThemeDraft.adBranding, undefined, "unknown theme id must be rejected, not coerced");
  assert.equal(invalidThemeDraft.businessName, "Taqueria El Aguila", "rest of the listing remains usable");

  const invalidShadeDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { ...DEFAULT_AD_BRANDING_PROFILE, shadeId: "ultra" },
  });
  assert.equal(invalidShadeDraft.adBranding, undefined, "unknown shade id must be rejected");

  const invalidPairingDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { ...DEFAULT_AD_BRANDING_PROFILE, themeId: "black-lion-premium", backgroundId: "cream" },
  });
  assert.equal(
    invalidPairingDraft.adBranding,
    undefined,
    "a background not approved for the chosen theme must be rejected",
  );

  const garbageDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { hex: "#ff00ff", font: "Comic Sans" },
  });
  assert.equal(garbageDraft.adBranding, undefined, "arbitrary/unapproved shapes are dropped, never accepted");

  // --- Supported logo presentation ids are preserved through the same boundary. ---
  const circularLogoDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { ...DEFAULT_AD_BRANDING_PROFILE, logo: { presentation: "circular" } },
  });
  assert.equal(circularLogoDraft.adBranding?.logo.presentation, "circular");

  const invalidLogoDraft = mergeRestauranteDraft({
    ...baseFilledDraft(),
    adBranding: { ...DEFAULT_AD_BRANDING_PROFILE, logo: { presentation: "freeform-crop" } },
  });
  assert.equal(invalidLogoDraft.adBranding, undefined, "an unsupported logo presentation id must be rejected");

  // Sanity: the approved theme set consumed here still has exactly the four Gate 1 themes.
  assert.deepEqual(
    Object.keys(AD_BRAND_THEMES).sort(),
    ["black-lion-premium", "lion-heritage", "savannah-trust", "sunset-comunidad"],
  );

  console.log("verify-restaurantes-ad-branding-foundation-3a-01: OK");
}

run();
