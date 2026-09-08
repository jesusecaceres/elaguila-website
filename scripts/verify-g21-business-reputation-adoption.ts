/**
 * Gate G21 — final category adoption verifier for the shared Google/Yelp reputation drawer
 * (SharedConnectionHubReviewDrawer) across the two remaining business-profile categories:
 * Autos Dealer (Negocio) and Rentas Negocio.
 *
 * Proves the same 13 properties for each category, mixing real exported-function calls (for the
 * parts that are pure/testable standalone) with source-text assertions (for the render-site
 * wiring, matching this repo's own established hybrid pattern for spots that need a live DB/React
 * renderer to fully exercise — see verify-c7-capacity-rpc-sql-contract.mjs).
 *
 * Run: npx tsx scripts/verify-g21-business-reputation-adoption.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createEmptyListing, normalizeLoadedListing } from "../app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { mapAutosDealerToBusinessHubContact } from "../app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact";
import type { AutoDealerListing } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";

import { createEmptyRentasNegocioFormState, mergePartialRentasNegocioState } from "../app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { rentasNegocioToBienesRaicesNegocioState } from "../app/(site)/clasificados/publicar/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState";
import { buildBusinessMetaJsonFromBienesRaicesNegocioState } from "../app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

const VALID_GOOGLE = "https://g.page/r/example-dealer/review";
const VALID_YELP = "https://www.yelp.com/biz/example-dealer";
const MALFORMED_SET = ["javascript:alert(1)", "data:text/html,<script>1</script>", "blob:http://x/1", "not a url"];

function main(): void {
  console.log("verify-g21-business-reputation-adoption: starting");

  // ============================================================================================
  // AUTOS DEALER — already fully wired end-to-end prior to this gate; proves it stayed that way.
  // ============================================================================================

  check("AUTOS 1: googleReviewsUrl/yelpReviewsUrl fields exist on the canonical AutoDealerListing type", () => {
    const empty = createEmptyListing();
    const withFields: AutoDealerListing = { ...empty, googleReviewsUrl: VALID_GOOGLE, yelpReviewsUrl: VALID_YELP };
    assert.equal(withFields.googleReviewsUrl, VALID_GOOGLE);
    assert.equal(withFields.yelpReviewsUrl, VALID_YELP);
  });

  check("AUTOS 2: draft/default is safe (undefined, no owner refill implied)", () => {
    const empty = createEmptyListing();
    assert.equal(empty.googleReviewsUrl, undefined);
    assert.equal(empty.yelpReviewsUrl, undefined);
  });

  check("AUTOS 3/6: normalizeLoadedListing (application/edit-hydration path) preserves real values and trims", () => {
    const loaded = normalizeLoadedListing({ googleReviewsUrl: `  ${VALID_GOOGLE}  `, yelpReviewsUrl: VALID_YELP } as Partial<AutoDealerListing>);
    assert.equal(loaded.googleReviewsUrl, VALID_GOOGLE);
    assert.equal(loaded.yelpReviewsUrl, VALID_YELP);
  });

  check("AUTOS 7/8: valid Google and Yelp URLs become real review-link entries via the business hub mapper", () => {
    const data = { ...createEmptyListing(), googleReviewsUrl: VALID_GOOGLE, yelpReviewsUrl: VALID_YELP };
    const hub = mapAutosDealerToBusinessHubContact(data, "en");
    assert.equal(hub.reviews.length, 2);
    assert.ok(hub.reviews.some((r) => r.id === "google" && r.url === VALID_GOOGLE));
    assert.ok(hub.reviews.some((r) => r.id === "yelp" && r.url === VALID_YELP));
  });

  check("AUTOS 9: blank URLs produce zero review-link entries (hides, not an empty state)", () => {
    const data = createEmptyListing();
    const hub = mapAutosDealerToBusinessHubContact(data, "en");
    assert.equal(hub.reviews.length, 0);
  });

  check("AUTOS 10: malformed/unsafe URLs are rejected/omitted, never passed through", () => {
    for (const bad of MALFORMED_SET) {
      const data = { ...createEmptyListing(), googleReviewsUrl: bad, yelpReviewsUrl: bad };
      const hub = mapAutosDealerToBusinessHubContact(data, "en");
      assert.equal(hub.reviews.length, 0, `malformed URL was not rejected: ${bad}`);
    }
  });

  check("AUTOS 11/12: both live render sites import the shared drawer, not the deleted bespoke button", () => {
    const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
    const previewStack = read("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
    for (const src of [dealerStack, previewStack]) {
      assert.match(src, /SharedConnectionHubReviewDrawer/);
      assert.doesNotMatch(src, /AutosNegociosHubReviewLinkButton/);
    }
  });

  check("AUTOS 12b: the old bespoke Autos review-link button file no longer exists", () => {
    let existed = true;
    try {
      read("app/(site)/clasificados/autos/negocios/components/AutosNegociosHubReviewLinkButton.tsx");
    } catch {
      existed = false;
    }
    assert.equal(existed, false, "AutosNegociosHubReviewLinkButton.tsx should have been deleted, not left as dead code");
  });

  check("AUTOS 13: Community Trust is not present in these Autos business-hub files (genuinely separate system)", () => {
    const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
    assert.doesNotMatch(dealerStack, /LeonixCommunityTrust|CommunityTrustSection/);
  });

  // ============================================================================================
  // RENTAS NEGOCIO — new fields added this gate; proves the full chain end-to-end.
  // ============================================================================================

  check("RENTAS 1: negocioGoogleReviewsUrl/negocioYelpReviewsUrl fields exist on RentasNegocioFormState", () => {
    const empty = createEmptyRentasNegocioFormState();
    assert.ok("negocioGoogleReviewsUrl" in empty);
    assert.ok("negocioYelpReviewsUrl" in empty);
  });

  check("RENTAS 2: draft/default is safe (empty string, no owner refill)", () => {
    const empty = createEmptyRentasNegocioFormState();
    assert.equal(empty.negocioGoogleReviewsUrl, "");
    assert.equal(empty.negocioYelpReviewsUrl, "");
  });

  check("RENTAS 6: mergePartialRentasNegocioState (edit hydration) round-trips real values safely", () => {
    const merged = mergePartialRentasNegocioState({ negocioGoogleReviewsUrl: VALID_GOOGLE, negocioYelpReviewsUrl: VALID_YELP });
    assert.equal(merged.negocioGoogleReviewsUrl, VALID_GOOGLE);
    assert.equal(merged.negocioYelpReviewsUrl, VALID_YELP);
  });

  check("RENTAS 6b: mergePartialRentasNegocioState hydrates safely from a legacy row with no review fields at all", () => {
    const merged = mergePartialRentasNegocioState({ negocioNombre: "Legacy Rental Co" });
    assert.equal(merged.negocioGoogleReviewsUrl, "");
    assert.equal(merged.negocioYelpReviewsUrl, "");
  });

  check("RENTAS 3: the application mapper (rentasNegocioToBienesRaicesNegocioState) carries real values through to the shared BR Negocio state shape", () => {
    const rentas = mergePartialRentasNegocioState({ negocioGoogleReviewsUrl: VALID_GOOGLE, negocioYelpReviewsUrl: VALID_YELP });
    const brState = rentasNegocioToBienesRaicesNegocioState(rentas);
    assert.equal(brState.googleReviewsUrl, VALID_GOOGLE);
    assert.equal(brState.yelpReviewsUrl, VALID_YELP);
  });

  check("RENTAS 5: the publish mapper (buildBusinessMetaJsonFromBienesRaicesNegocioState) persists real values into business_meta JSON", () => {
    const rentas = mergePartialRentasNegocioState({ negocioGoogleReviewsUrl: VALID_GOOGLE, negocioYelpReviewsUrl: VALID_YELP });
    const brState = rentasNegocioToBienesRaicesNegocioState(rentas);
    const json = buildBusinessMetaJsonFromBienesRaicesNegocioState(brState);
    assert.ok(json, "business_meta JSON must be produced when review URLs are present");
    const parsed = JSON.parse(json as string) as Record<string, string>;
    assert.equal(parsed.negocioGoogleReviewsUrl, VALID_GOOGLE);
    assert.equal(parsed.negocioYelpReviewsUrl, VALID_YELP);
  });

  check("RENTAS 10: malformed/unsafe URLs never reach business_meta (publish mapper's own regex gate)", () => {
    for (const bad of MALFORMED_SET) {
      const rentas = mergePartialRentasNegocioState({ negocioGoogleReviewsUrl: bad, negocioYelpReviewsUrl: bad });
      const brState = rentasNegocioToBienesRaicesNegocioState(rentas);
      const json = buildBusinessMetaJsonFromBienesRaicesNegocioState(brState);
      if (json) {
        const parsed = JSON.parse(json) as Record<string, string>;
        assert.ok(!parsed.negocioGoogleReviewsUrl, `malformed Google URL leaked into business_meta: ${bad}`);
        assert.ok(!parsed.negocioYelpReviewsUrl, `malformed Yelp URL leaked into business_meta: ${bad}`);
      }
    }
  });

  check("RENTAS read-back: mapListingRowToRentasPublicListing.ts reads negocioGoogleReviewsUrl/negocioYelpReviewsUrl out of business_meta with URL validation", () => {
    const src = read("app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts");
    assert.match(src, /o\.negocioGoogleReviewsUrl/);
    assert.match(src, /o\.negocioYelpReviewsUrl/);
    assert.match(src, /sanitizeHttpUrl\(typeof o\.negocioGoogleReviewsUrl/);
  });

  check("RENTAS 4: the live Preview VM mapper sets googleReviewsUrl/yelpReviewsUrl on the shared contact shape", () => {
    const src = read("app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts");
    assert.match(src, /googleReviewsUrl: listing\.businessGoogleReviewsUrl/);
    assert.match(src, /yelpReviewsUrl: listing\.businessYelpReviewsUrl/);
  });

  check("RENTAS 11/12: the real live Rentas Negocio detail view (RentasVisualMatchPreviewView.tsx) imports the shared drawer and builds real links only", () => {
    const src = read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx");
    assert.match(src, /SharedConnectionHubReviewDrawer/);
    assert.match(src, /c\.googleReviewsUrl/);
    assert.match(src, /c\.yelpReviewsUrl/);
    // Gated on isNegocio(vm) AND at least one real URL — never rendered unconditionally.
    assert.match(src, /isNegocio\(vm\) && \(c\.googleReviewsUrl \|\| c\.yelpReviewsUrl\)/);
  });

  check("RENTAS 13: Community Trust remains a visually separate, sibling block (not merged into the reviews drawer)", () => {
    const src = read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx");
    // Compare JSX usage sites specifically (the "<Component" opening tag), not the import lines
    // (both components are imported near the top of the file, in an order that says nothing
    // about their actual render order).
    const drawerJsxIdx = src.indexOf("<SharedConnectionHubReviewDrawer");
    const trustJsxIdx = src.indexOf("<BrRentasCommunityTrustSection");
    assert.ok(drawerJsxIdx > -1 && trustJsxIdx > -1, "both blocks must be present as real JSX usage");
    assert.ok(trustJsxIdx > drawerJsxIdx, "Community Trust must render as its own sibling block after the reviews drawer, not inside it");
  });

  check("RENTAS: application form has real bilingual input fields, not a hardcoded/demo value", () => {
    const src = read("app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx");
    assert.match(src, /value=\{state\.negocioGoogleReviewsUrl\}/);
    assert.match(src, /value=\{state\.negocioYelpReviewsUrl\}/);
    assert.match(src, /"Perfil\/reseñas de Google/);
    assert.match(src, /"Google profile\/reviews/);
  });

  console.log(`\nverify-g21-business-reputation-adoption: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
