/**
 * Gate RESTAURANTES-2 verifier — Restaurantes discovery adoption.
 *
 * Pure/unit + source-level only: no network, no DB, no dev server.
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-restaurantes-gate2-discovery.ts
 *
 * Covers:
 *   1. Saved Search adopts the SHARED engine and round-trips the real Restaurantes filter truth.
 *   2. Related Listings derive from real published data + real Restaurantes relationships.
 *   3. Sitemap uses the existing platform mechanism and the safety-gated published-only reader.
 *   4. One connected discovery circuit.
 *   5. Dead paths still zero-consumer; LIVE shell components preserved (cleanup prep only).
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  SAVED_SEARCH_RESTAURANTES_CATEGORY,
  describeRestaurantesSavedSearchFacets,
  restaurantesDiscoveryStateToSavedSearch,
  savedSearchToRestaurantesDiscoveryState,
} from "@/app/lib/saved-search/restaurantes/savedSearchRestaurantesAdapter";
import { buildRestaurantesSavedSearchResultsUrl } from "@/app/lib/saved-search/restaurantes/restaurantesSavedSearchResultsUrl";
import { certifyRestaurantesPublicEligibleListing } from "@/app/lib/saved-search/restaurantes/restaurantesPublicEligibleListing";
import {
  canonicalizeSavedSearch,
  buildSavedSearchFingerprintInput,
} from "@/app/lib/saved-search/savedSearchCanonicalize";
import {
  defaultRestaurantesDiscoveryState,
  parseRestaurantesResultsSearchParams,
  type RestaurantesDiscoveryState,
} from "@/app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { RestaurantesPublicListingDbRow } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));
const ok = (m: string) => console.log(`OK: ${m}`);
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const RESULTS_SHELL = "app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx";
const DETAIL_PAGE = "app/(site)/clasificados/restaurantes/[slug]/page.tsx";
const SITEMAP = "app/sitemap.ts";
const DELIVERY = "app/lib/saved-search/delivery/savedSearchEmailDelivery.ts";
const DASHBOARD = "app/(site)/dashboard/busquedas-guardadas/page.tsx";
const RELATED_LIB = "app/(site)/clasificados/restaurantes/lib/restaurantesRelatedListings.ts";
const ADAPTER = "app/lib/saved-search/restaurantes/savedSearchRestaurantesAdapter.ts";

/* ------------------------------------------------------------------ *
 * 1. SAVED SEARCH — shared engine, real filter truth
 * ------------------------------------------------------------------ */

for (const forbidden of [
  "app/lib/saved-search/restaurantes/savedSearchRestaurantesCrud.ts",
  "app/lib/saved-search/restaurantes/restaurantesSavedSearchFingerprint.ts",
  "app/lib/saved-search/restaurantes/restaurantesSavedSearchTypes.ts",
]) {
  assert.ok(!exists(forbidden), `no category-local saved-search engine: ${forbidden}`);
}
const adapterCode = code(read(ADAPTER));
for (const forbiddenConstruct of [
  /from ["']node:crypto["']/,
  /crypto\.subtle/,
  /\.from\(["']saved_searches["']\)/,
  /createClient|getAdminSupabase/,
]) {
  assert.ok(!forbiddenConstruct.test(adapterCode), `adapter must translate only (matched ${forbiddenConstruct})`);
}
ok("1a. Restaurantes plugs into the shared Saved Search engine — no category-specific engine");

// Round-trip a richly-filtered real discovery state.
const live: RestaurantesDiscoveryState = {
  ...defaultRestaurantesDiscoveryState("es"),
  city: "San Jose",
  state: "CA",
  zip: "95112",
  q: "tacos",
  cuisine: "mexican",
  biz: "restaurant" as RestaurantesDiscoveryState["biz"],
  svc: "dine_in",
  price: "$$",
  diet: "vegan",
  hl: "family_friendly",
  neighborhoodQuery: "Downtown",
  deliveryRadiusMin: 5,
  family: true,
  open: true,
  top: true,
  verifiedOnly: true,
  reservationsOnly: true,
  foodTruck: true,
  menuOnly: true,
  spoken: ["es", "en"],
  pay: ["cash", "card"],
  amen: ["wifi"],
  // presentation-only / device-local — must NOT survive
  sort: "rating-desc",
  page: 4,
  perPage: 48,
  saved: true,
  near: true,
};

const normalized = restaurantesDiscoveryStateToSavedSearch(live);
assert.equal(normalized.category, SAVED_SEARCH_RESTAURANTES_CATEGORY);
assert.equal(normalized.city, "San Jose");
assert.equal(normalized.minPrice, null, "Restaurantes filters on a price LEVEL, not a numeric band");
assert.equal(normalized.maxPrice, null);

const restored = savedSearchToRestaurantesDiscoveryState(normalized, "es");
for (const key of ["city", "state", "zip", "q", "cuisine", "biz", "svc", "price", "diet", "hl", "neighborhoodQuery"] as const) {
  assert.equal(restored[key], live[key], `${key} must round-trip`);
}
assert.equal(restored.deliveryRadiusMin, 5);
for (const key of ["family", "open", "top", "verifiedOnly", "reservationsOnly", "foodTruck", "menuOnly"] as const) {
  assert.equal(restored[key], true, `${key} must round-trip`);
}
assert.deepEqual(restored.spoken, ["en", "es"], "key sets round-trip (sorted)");
assert.deepEqual(restored.pay, ["card", "cash"]);
ok("1b. real Restaurantes filter + location truth round-trips through the shared contract");

const payload = normalized.filterPayload as Record<string, unknown>;
for (const excluded of ["sort", "page", "perPage", "saved", "near", "lang"]) {
  assert.equal(payload[excluded], undefined, `${excluded} must never enter the fingerprint`);
}
assert.equal(restored.sort, "newest", "a reconstructed search opens on the default sort");
assert.equal(restored.page, 1, "…and page 1");
assert.equal(restored.saved, false, "device-local saved-ids filter is never restored");
assert.equal(restored.near, false, "intent-only `near` is never restored");
ok("1c. sort/page/perPage/saved/near excluded — presentation and device-local state stay out");

// Same search, different construction order + different sort -> identical fingerprint.
const reordered = restaurantesDiscoveryStateToSavedSearch({
  ...live,
  sort: "newest",
  page: 1,
  spoken: ["en", "es"],
  pay: ["card", "cash"],
});
assert.equal(
  buildSavedSearchFingerprintInput(canonicalizeSavedSearch(normalized)),
  buildSavedSearchFingerprintInput(canonicalizeSavedSearch(reordered)),
  "fingerprint must be independent of sort, page and key-set order",
);
ok("1d. fingerprint is order-, sort- and pagination-independent");

// The rebuilt URL must be readable by the LIVE parser — the real round-trip that matters.
const url = buildRestaurantesSavedSearchResultsUrl(normalized, "en");
assert.ok(url.startsWith("/clasificados/restaurantes/results?"), `unexpected results path: ${url}`);
const sp = new URLSearchParams(url.split("?")[1]);
const reparsed = parseRestaurantesResultsSearchParams(sp);
for (const key of ["city", "state", "zip", "q", "cuisine", "svc", "price", "diet", "hl", "neighborhoodQuery"] as const) {
  assert.equal(reparsed[key], live[key], `${key} must survive URL -> live parser`);
}
assert.equal(reparsed.family, true);
assert.equal(reparsed.open, true);
assert.equal(reparsed.verifiedOnly, true);
assert.deepEqual(reparsed.spoken, ["en", "es"]);
assert.ok(!sp.has("saved"), "device-local saved filter must never be written into a shared URL");
assert.ok(!sp.has("near"), "intent-only near must not be written");
assert.ok(!sp.has("sort") && !sp.has("page"), "reconstructed URL opens on default sort, page 1");
ok("1e. reconstructed URL is read back correctly by the LIVE results parser");

assert.ok(
  describeRestaurantesSavedSearchFacets(normalized, "es").length > 0 &&
    describeRestaurantesSavedSearchFacets(normalized, "en").length > 0,
  "facet summary must render in both languages",
);
ok("1f. saved-search facet summary is bilingual");

// Wiring.
const shellCode = code(read(RESULTS_SHELL));
assert.ok(shellCode.includes("SavedSearchButton"), "results shell must mount the SHARED button");
assert.ok(
  shellCode.includes("restaurantesDiscoveryStateToSavedSearch(parsed)"),
  "the saved search must be built from the shell's own live discovery state",
);
const dashboardCode = code(read(DASHBOARD));
assert.ok(/restaurantes:\s*\{/.test(dashboardCode), "dashboard CATEGORY_REGISTRY must include restaurantes");
assert.ok(dashboardCode.includes("buildRestaurantesSavedSearchResultsUrl"));
const deliveryCode = code(read(DELIVERY));
assert.ok(
  /restaurantes:\s*restaurantesSavedSearchDeliveryResolver/.test(deliveryCode),
  "delivery CATEGORY_RESOLVERS must include restaurantes",
);
assert.ok(
  code(read("app/lib/listingPlans/revenueFulfillment.ts")).includes(
    "triggerRestaurantesSavedSearchMatchBestEffort(activation.listingId",
  ),
  "the match trigger must fire on real activation",
);
ok("1g. Saved Search wired: results CTA + dashboard registry + delivery registry + activation trigger");

const migration = read("supabase/migrations/20260910180000_saved_search_match_events_restaurantes.sql");
assert.ok(
  migration.includes("'autos', 'bienes-raices', 'rentas', 'servicios', 'restaurantes'"),
  "the ledger category CHECK must admit restaurantes",
);
assert.ok(
  !/seller_lane_check[\s\S]{0,400}ADD CONSTRAINT/.test(migration),
  "no seller_lane vocabulary is added — Restaurantes writes null, already accepted",
);
ok("1h. ledger CHECK widened for restaurantes; no invented seller-lane vocabulary");

const matcherCode = code(read("app/lib/saved-search/restaurantes/savedSearchRestaurantesMatcher.ts"));
assert.ok(matcherCode.includes("filterRestaurantesBlueprintRows"), "matcher must reuse the real results filter");
assert.ok(
  matcherCode.includes("mapRestaurantesPublicListingDbRowToShellInventoryRow"),
  "matcher must use the category's own row mapper, not a bespoke shape",
);
ok("1i. matcher reuses the exact live results filter pipeline");

const publishedRow: RestaurantesPublicListingDbRow = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "taqueria-lupita",
  status: "published",
} as RestaurantesPublicListingDbRow;
assert.ok(certifyRestaurantesPublicEligibleListing(publishedRow), "a published row must certify");
for (const status of ["pending_payment", "archived", "suspended", ""]) {
  assert.equal(
    certifyRestaurantesPublicEligibleListing({ ...publishedRow, status } as RestaurantesPublicListingDbRow),
    null,
    `${status || "(empty)"} must never certify as publicly eligible`,
  );
}
ok("1j. only published rows certify as publicly eligible");

/* ------------------------------------------------------------------ *
 * 2. RELATED LISTINGS
 * ------------------------------------------------------------------ */

const relatedCode = code(read(RELATED_LIB));
assert.ok(
  relatedCode.includes("tryListRestaurantesPublicListingsFromDb"),
  "related listings must come from the canonical published reader, not a bespoke query",
);
for (const facet of ["primary_cuisine", "secondary_cuisine", "business_type", "city_canonical", "zip_code"]) {
  assert.ok(relatedCode.includes(facet), `relatedness must use the real facet ${facet}`);
}
assert.ok(!/random|Math\.random|placeholder|sample|blueprintSample/i.test(relatedCode), "never fabricated");
assert.ok(
  !/resolveCanonicalVisibilityBucketWeights|applyRestaurantesPromotedFromEntitlement|promoted/.test(relatedCode),
  "relatedness is editorial — no placement-weight logic",
);
assert.ok(
  !relatedCode.includes("restaurantesResultsInventoryServer"),
  "must not reuse the inventory server, which exists to apply the paid overlay",
);
const detailCode = code(read(DETAIL_PAGE));
assert.ok(detailCode.includes("listRelatedRestaurantesListings"), "detail page must compute related listings");
assert.ok(detailCode.includes("RestaurantesRelatedListingsSection"), "detail page must render the rail");
const sectionCode = code(read("app/(site)/clasificados/restaurantes/components/RestaurantesRelatedListingsSection.tsx"));
assert.ok(
  sectionCode.includes("RestaurantePublishedListingCard"),
  "the rail must reuse the existing results card — Gate 2 does not redesign cards",
);
assert.ok(
  sectionCode.includes("mapRestaurantesPublicListingDbRowToShellInventoryRow"),
  "the rail must reuse the existing public-listing shape",
);
assert.ok(sectionCode.includes("browseHref"), "an empty related set must still offer a real browse link");
ok("2. Related Listings derive from real published data + real Restaurantes relationships");

/* ------------------------------------------------------------------ *
 * 3. SITEMAP
 * ------------------------------------------------------------------ */

const sitemapCode = code(read(SITEMAP));
assert.ok(sitemapCode.includes("restaurantesSitemapEntries"), "sitemap must include a Restaurantes section");
assert.ok(
  sitemapCode.includes("tryListRestaurantesPublicListingsFromDb"),
  "sitemap must use the safety-gated published reader, never a direct table query",
);
assert.ok(
  sitemapCode.includes("if (!listed.ok) return [];"),
  "a failed query must yield no entries rather than a partial list",
);
assert.ok(
  sitemapCode.includes("/clasificados/restaurantes/${encodeURIComponent(row.slug)}"),
  "sitemap must emit the canonical detail URL",
);
assert.ok(
  !sitemapCode.includes("restaurantesResultsInventoryServer"),
  "the paid-overlay inventory server must not be used for a sitemap",
);
assert.ok(
  read("app/lib/seo/leonixDiscoveryContracts.ts").includes(
    "export function leonixSitemapOmitsPerListingDetailUrls(): true",
  ),
  "the pure contract's own assertion must remain intact (LEO sensor depends on it)",
);
ok("3. published Restaurantes detail URLs enter the existing sitemap architecture, safety-gated");

/* ------------------------------------------------------------------ *
 * 4. DISCOVERY CONTINUITY
 * ------------------------------------------------------------------ */

const resultsPageCode = code(read("app/(site)/clasificados/restaurantes/resultados/page.tsx"));
assert.ok(resultsPageCode.includes("loadRestaurantesResultsInventoryForPage"), "results reads published inventory");
assert.ok(shellCode.includes("filterRestaurantesBlueprintRows"), "results applies the real filters/location");
assert.ok(shellCode.includes("RestaurantePublishedListingCard"), "results link out via the existing card");
assert.ok(
  detailCode.includes("getRestaurantePublicListingBySlugFromDb"),
  "public detail reads the same published truth",
);
assert.ok(detailCode.includes("restauranteJsonLd") && detailCode.includes("alternates: { canonical }"));
assert.ok(
  code(read("app/lib/saved-search/restaurantes/restaurantesSavedSearchDeliveryResolver.ts")).includes(
    "/clasificados/restaurantes/${encodeURIComponent(slug)}",
  ),
  "a saved-search match email must land on the canonical public detail URL",
);
ok("4. published -> results -> filters -> Saved Search -> public detail -> Related -> canonical URL");

/* ------------------------------------------------------------------ *
 * 5. CLEANUP PREP — nothing deleted, LIVE shell preserved
 * ------------------------------------------------------------------ */

/** LIVE despite living beside a demo-only route — must never be swept with the folder. */
const LIVE_SHELL = [
  "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestaurantesShellChrome.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx",
];
for (const rel of LIVE_SHELL) assert.ok(exists(rel), `LIVE shell component missing: ${rel}`);
assert.ok(
  detailCode.includes("RestauranteAdStoryPreview") && detailCode.includes("RestaurantesShellChrome"),
  "the public detail page must still render through the LIVE shell components",
);
ok("5a. LIVE shell components preserved and still rendering the public vitrina");

const DEAD_MODULES = [
  "app/(site)/clasificados/restaurantes/adapters/restauranteApplicationToDiscoveryRow.ts",
  "app/(site)/clasificados/restaurantes/analytics/restaurantesAnalytics.ts",
  "app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaStrip.tsx",
  "app/(site)/clasificados/restaurantes/application/restaurantePreviewRequirements.ts",
  "app/(site)/clasificados/restaurantes/application/runMappingAudit.ts",
  "app/(site)/clasificados/restaurantes/components/DiscoveryClient.tsx",
  "app/(site)/clasificados/restaurantes/components/RestauranteLandingPublishedTeasers.tsx",
  "app/(site)/clasificados/restaurantes/components/RestaurantesDestacadosSection.tsx",
  "app/(site)/clasificados/restaurantes/landing/RestaurantesCompactSearchCanvas.tsx",
  "app/(site)/clasificados/restaurantes/landing/RestaurantesLandingHeroGateway.tsx",
  "app/(site)/clasificados/restaurantes/landing/RestaurantesLandingShell.tsx",
  "app/(site)/clasificados/restaurantes/landing/buildRestaurantesResultsHref.ts",
  "app/(site)/clasificados/restaurantes/landing/restaurantesLandingAssets.ts",
  "app/(site)/clasificados/restaurantes/lib/restaurantesCoarseGeolocation.ts",
  "app/(site)/clasificados/restaurantes/resultados/RestauranteResultsClient.tsx",
  "app/(site)/clasificados/restaurantes/shared/fields/restaurantesTaxonomy.ts",
  "app/(site)/clasificados/restaurantes/shell/RestaurantHubReviewLinkButton.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestauranteShellDataUrlModal.tsx",
  "app/lib/clasificados/restaurantes/RestauranteOfertasLocalesCheckoutSecondaryCard.tsx",
  "app/lib/clasificados/restaurantes/RestauranteOfertasLocalesUpsellCard.tsx",
  "app/lib/clasificados/restaurantes/restaurantesSellerAnalytics.ts",
];
for (const rel of DEAD_MODULES) assert.ok(exists(rel), `${rel} must still exist — Gate 2 deletes nothing`);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const allFiles = ["app", "scripts", "e2e", "tests"].flatMap((d) => walk(path.join(ROOT, d)));
for (const rel of DEAD_MODULES) {
  const base = path.basename(rel).replace(/\.(tsx|ts)$/, "");
  const importers: string[] = [];
  for (const file of allFiles) {
    if (file === path.join(ROOT, rel)) continue;
    const src = fs.readFileSync(file, "utf8");
    if (new RegExp(`from ["'][^"']*/${base}["']|import\\(["'][^"']*/${base}["']\\)`).test(src)) {
      importers.push(path.relative(ROOT, file));
    }
  }
  assert.equal(importers.length, 0, `${rel} is no longer zero-consumer — importers: ${importers.join(", ")}`);
}
ok(`5b. all ${DEAD_MODULES.length} recorded dead modules still have zero importers (nothing deleted)`);

// Route-level items still needing an explicit decision before any cleanup gate.
assert.ok(exists("app/(site)/clasificados/restaurantes/shell/page.tsx"), "the demo shell route still exists");
assert.ok(
  code(read("app/(site)/clasificados/restaurantes/shell/page.tsx")).includes("redirect("),
  "the demo shell route must stay production-redirected while it exists",
);
assert.ok(
  read("app/lib/seo/leonixDiscoveryContracts.ts").includes('"/clasificados/restaurantes/shell"'),
  "the demo shell route must stay robots-disallowed while it exists",
);
assert.ok(
  code(read("app/(site)/clasificados/restaurantes/publicar/page.tsx")).includes("redirect("),
  "/clasificados/restaurantes/publicar is a live redirect shim — its route must be preserved",
);
ok("5c. route-level items requiring an explicit routing decision recorded and intact");

console.log("\nverify-restaurantes-gate2-discovery: PASS");
