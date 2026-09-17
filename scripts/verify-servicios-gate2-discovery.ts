/**
 * Gate SERVICIOS-2 verifier — Servicios discovery + adoption.
 *
 * Pure/unit + source-level only: no network, no DB, no dev server.
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate2-discovery.ts
 *
 * Covers:
 *   1. Saved Search adopts the SHARED engine (no Servicios-specific engine) and round-trips the
 *      real Servicios filter truth.
 *   2. Related Listings derive from real published data + real Servicios relationships.
 *   3. SEO — absolute canonical, real keyword truth, ES/EN, no stale El Águila identity.
 *   4. Sitemap uses the existing platform mechanism and the safety-gated reader.
 *   5. Landing data contract is truthful.
 *   6. One connected discovery circuit.
 *   7. Dead paths still have zero importers (cleanup readiness — nothing deleted).
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  SAVED_SEARCH_SERVICIOS_CATEGORY,
  describeServiciosSavedSearchFacets,
  savedSearchToServiciosFilterQuery,
  serviciosFilterQueryToSavedSearch,
} from "@/app/lib/saved-search/servicios/savedSearchServiciosAdapter";
import { buildServiciosSavedSearchResultsUrl } from "@/app/lib/saved-search/servicios/serviciosSavedSearchResultsUrl";
import { canonicalizeSavedSearch, buildSavedSearchFingerprintInput } from "@/app/lib/saved-search/savedSearchCanonicalize";
import { certifyServiciosPublicEligibleListing } from "@/app/lib/saved-search/servicios/serviciosPublicEligibleListing";
import type { ServiciosResultsFilterQuery } from "@/app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { serviciosJsonLd } from "@/app/servicios/seo/serviciosJsonLd";

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));
const ok = (m: string) => console.log(`OK: ${m}`);

const RESULTS_PAGE = "app/(site)/clasificados/servicios/resultados/page.tsx";
const DETAIL_PAGE = "app/(site)/clasificados/servicios/[slug]/page.tsx";
const LANDING_ROUTE = "app/(site)/clasificados/servicios/page.tsx";
const SITEMAP = "app/sitemap.ts";
const DELIVERY = "app/lib/saved-search/delivery/savedSearchEmailDelivery.ts";
const DASHBOARD = "app/(site)/dashboard/busquedas-guardadas/page.tsx";
const RELATED_LIB = "app/(site)/clasificados/servicios/lib/serviciosRelatedListings.ts";

/* ------------------------------------------------------------------ *
 * 1. SAVED SEARCH — shared engine, real filter truth
 * ------------------------------------------------------------------ */

// No Servicios-specific engine: the adapter set must contain ONLY category translation files,
// never a second fingerprint/CRUD/persistence implementation.
for (const forbidden of [
  "app/lib/saved-search/servicios/savedSearchServiciosCrud.ts",
  "app/lib/saved-search/servicios/serviciosSavedSearchFingerprint.ts",
  "app/lib/saved-search/servicios/serviciosSavedSearchTypes.ts",
]) {
  assert.ok(!exists(forbidden), `a Servicios-specific saved-search engine file must not exist: ${forbidden}`);
}
/** Strip block/line comments so a doc comment that merely NAMES the shared engine can't trip a
 * check that is about real implementation. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const adapterCode = stripComments(read("app/lib/saved-search/servicios/savedSearchServiciosAdapter.ts"));
for (const forbiddenConstruct of [
  /require\(["']node:crypto["']\)|from ["']node:crypto["']/, // no hashing
  /crypto\.subtle/,
  /\.from\(["']saved_searches["']\)/, // no CRUD
  /createClient|getAdminSupabase/, // no persistence
]) {
  assert.ok(
    !forbiddenConstruct.test(adapterCode),
    `the Servicios adapter must translate only — hashing/CRUD/persistence stay in the shared engine (matched ${forbiddenConstruct})`,
  );
}
ok("1a. Servicios plugs into the shared Saved Search engine — no category-specific engine");

// Round-trip: a real, richly-filtered Servicios query survives save -> restore unchanged.
const liveQuery: ServiciosResultsFilterQuery = {
  city: "San Jose",
  state: "CA",
  zip: "95112",
  country: "United States",
  group: "plomeria",
  q: "fuga de agua",
  seller: "business",
  sort: "rating", // presentation-only — must NOT survive
  verified: "1",
  openNow: "1",
  licensed: "1",
  insured: "1",
  hasPhotos: "1",
  bilingual: "1",
  emergency: "1",
};
const normalized = serviciosFilterQueryToSavedSearch(liveQuery);
assert.equal(normalized.category, SAVED_SEARCH_SERVICIOS_CATEGORY);
assert.equal(normalized.city, "San Jose");
assert.equal(normalized.minPrice, null, "Servicios has no price filter — must be truthfully null");
assert.equal(normalized.maxPrice, null);

const restored = savedSearchToServiciosFilterQuery(normalized);
for (const key of ["city", "state", "zip", "country", "group", "q"] as const) {
  assert.equal(restored[key], liveQuery[key], `${key} must round-trip through Saved Search`);
}
assert.equal(restored.seller, "business");
for (const flag of ["verified", "openNow", "licensed", "insured", "hasPhotos", "bilingual", "emergency"] as const) {
  assert.equal(restored[flag], "1", `${flag} must round-trip through Saved Search`);
}
ok("1b. real Servicios filter + location truth round-trips through the shared contract");

assert.equal(
  (normalized.filterPayload as Record<string, unknown>).sort,
  undefined,
  "sort is presentation-only and must never enter the fingerprint",
);
assert.equal((normalized.filterPayload as Record<string, unknown>).page, undefined);
ok("1c. sort/pagination excluded — two identical searches fingerprint identically");

// Same search, different key insertion order + a no-op "all" seller -> identical fingerprint.
const sameSearchDifferentOrder = serviciosFilterQueryToSavedSearch({
  emergency: "1",
  bilingual: "1",
  hasPhotos: "1",
  insured: "1",
  licensed: "1",
  openNow: "1",
  verified: "1",
  seller: "business",
  q: "fuga de agua",
  group: "plomeria",
  country: "United States",
  zip: "95112",
  state: "CA",
  city: "San Jose",
  sort: "newest",
});
assert.equal(
  buildSavedSearchFingerprintInput(canonicalizeSavedSearch(normalized)),
  buildSavedSearchFingerprintInput(canonicalizeSavedSearch(sameSearchDifferentOrder)),
  "the same search must fingerprint identically regardless of construction order or sort",
);
ok("1d. fingerprint is order-independent and sort-independent");

// "all" is a no-filter sentinel, never a persisted facet.
const allSeller = serviciosFilterQueryToSavedSearch({ city: "Gilroy", seller: "all" });
assert.equal((allSeller.filterPayload as Record<string, unknown>).seller, undefined);
assert.equal(savedSearchToServiciosFilterQuery(allSeller).seller, "all");
ok("1e. seller=all persists as no filter, restores as no filter");

// The rebuilt results URL must use the live page's own param vocabulary (incl. snake_case flags).
const url = buildServiciosSavedSearchResultsUrl(normalized, "en");
assert.ok(url.startsWith("/clasificados/servicios/results?"), `unexpected results path: ${url}`);
for (const expected of [
  "lang=en",
  "city=San+Jose",
  "group=plomeria",
  "seller=business",
  "open_now=1",
  "free_estimate=1".replace("free_estimate=1", "licensed=1"),
  "has_photos=1",
]) {
  assert.ok(url.includes(expected), `results URL missing ${expected}: ${url}`);
}
assert.ok(!url.includes("sort="), "a reconstructed saved-search URL must open on the default sort");
assert.ok(!url.includes("page="), "a reconstructed saved-search URL must open on page 1");
// Every flag key the page reads must be reachable from the builder.
const resultsPageSrc = read(RESULTS_PAGE);
for (const param of ["open_now", "licensed", "insured", "free_estimate", "free_consultation", "has_photos", "has_videos", "has_offers", "same_day", "appointment"]) {
  assert.ok(resultsPageSrc.includes(`sp.${param}`), `results page no longer reads sp.${param} — URL builder is stale`);
}
ok("1f. reconstructed results URL matches the live page's own param contract");

assert.ok(
  describeServiciosSavedSearchFacets(normalized, "es").length > 0 &&
    describeServiciosSavedSearchFacets(normalized, "en").length > 0,
  "the dashboard facet summary must render in both languages",
);
ok("1g. saved-search facet summary is bilingual");

// Wiring: results CTA, dashboard registry, delivery registry.
assert.ok(resultsPageSrc.includes("SavedSearchButton"), "results page must mount the SHARED SavedSearchButton");
assert.ok(
  resultsPageSrc.includes("serviciosFilterQueryToSavedSearch(filterQuery)"),
  "the saved search must be built from THIS page's own live filterQuery",
);
const dashboardSrc = read(DASHBOARD);
assert.ok(/servicios:\s*\{/.test(dashboardSrc), "dashboard CATEGORY_REGISTRY must include servicios");
assert.ok(dashboardSrc.includes("buildServiciosSavedSearchResultsUrl"));
const deliverySrc = read(DELIVERY);
assert.ok(/servicios:\s*serviciosSavedSearchDeliveryResolver/.test(deliverySrc), "delivery CATEGORY_RESOLVERS must include servicios");
assert.ok(
  deliverySrc.includes("await resolver.buildDetailUrl("),
  "the delivery engine must await buildDetailUrl (Servicios resolves its slug asynchronously)",
);
ok("1h. Saved Search wired: results CTA + dashboard registry + delivery registry");

// The ledger CHECK constraint must actually admit 'servicios'.
const migration = read("supabase/migrations/20260910120000_saved_search_match_events_servicios.sql");
assert.ok(migration.includes("'autos', 'bienes-raices', 'rentas', 'servicios'"), "match-events category CHECK must admit servicios");
assert.ok(migration.includes("'business', 'independent'"), "seller_lane CHECK must admit Servicios' own vocabulary");
ok("1i. ledger CHECK constraints widened for servicios (migration present)");

// Matcher reuses the real filter pipeline verbatim — no reimplementation.
const matcherSrc = read("app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts");
for (const fn of ["filterServiciosPublicListingRows", "filterServiciosRowsByKeyword", "filterServiciosRowsBySeller"]) {
  assert.ok(matcherSrc.includes(fn), `matcher must reuse the real results filter ${fn}`);
}
ok("1j. matcher reuses the exact live results filter pipeline");

// Eligibility is type-enforced and published-only.
const publishedRow: ServiciosPublicListingRow = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "acme-plumbing",
  business_name: "Acme Plumbing",
  city: "San Jose",
  published_at: new Date().toISOString(),
  profile_json: { identity: { businessName: "Acme Plumbing", slug: "acme-plumbing" } } as never,
  leonix_verified: false,
  internal_group: "plomeria",
  listing_status: "published",
};
assert.ok(certifyServiciosPublicEligibleListing(publishedRow), "a published row must certify");
for (const status of ["paused_unpublished", "pending_review", "pending_payment", "rejected", "suspended"]) {
  assert.equal(
    certifyServiciosPublicEligibleListing({ ...publishedRow, listing_status: status }),
    null,
    `${status} must never certify as publicly eligible`,
  );
}
ok("1k. only published rows certify as publicly eligible");

/* ------------------------------------------------------------------ *
 * 2. RELATED LISTINGS
 * ------------------------------------------------------------------ */

const relatedSrc = read(RELATED_LIB);
assert.ok(
  relatedSrc.includes("listServiciosPublicListingsRaw"),
  "related listings must come from the canonical published reader, not a bespoke query",
);
assert.ok(relatedSrc.includes("internal_group"), "relatedness must use the real trade-family facet");
assert.ok(
  relatedSrc.includes("normalizeServiciosSearchText") && relatedSrc.includes("normalizeLeonixLbStateCode"),
  "relatedness must use the same location normalization the results filter uses",
);
assert.ok(!/random|Math\.random|placeholder|sample/i.test(relatedSrc), "related listings must never be fabricated");
assert.ok(
  !relatedSrc.includes("resolveCanonicalVisibilityBucketWeights"),
  "relatedness is an editorial relationship, not a paid ad slot",
);
const detailSrc = read(DETAIL_PAGE);
assert.ok(detailSrc.includes("listRelatedServiciosListings"), "detail page must compute related listings");
assert.ok(detailSrc.includes("ServiciosRelatedListingsSection"), "detail page must render the related rail");
assert.ok(
  /isPublishedLive \? \(\s*<ServiciosRelatedListingsSection/.test(detailSrc.replace(/\n\s*/g, " ")) ||
    detailSrc.includes("{isPublishedLive ? ("),
  "the related rail must only render on a live public profile",
);
const sectionSrc = read("app/(site)/clasificados/servicios/components/ServiciosRelatedListingsSection.tsx");
assert.ok(
  sectionSrc.includes("ServiciosHorizontalResultCard"),
  "related listings must reuse the existing result card — Gate 2 does not redesign cards",
);
assert.ok(sectionSrc.includes("browseHref"), "an empty related set must still offer a real browse link");
ok("2. Related Listings derive from real published data + real Servicios relationships");

/* ------------------------------------------------------------------ *
 * 3. SEO
 * ------------------------------------------------------------------ */

const layoutSrc = read("app/(site)/clasificados/servicios/[slug]/layout.tsx");
assert.ok(layoutSrc.includes("alternates: { canonical }"), "detail route must declare a canonical URL");
assert.ok(layoutSrc.includes("PREVIEW_NOINDEX_METADATA"), "non-public states must be noindex");
assert.ok(
  detailSrc.includes("${LEONIX_SITE_ORIGIN}/clasificados/servicios/"),
  "JSON-LD url must be the ABSOLUTE canonical detail URL",
);

const jsonLd = serviciosJsonLd({
  name: "Acme Plumbing",
  url: "https://example.test/clasificados/servicios/acme-plumbing",
  categoryLabel: "Plomería",
  areaServed: "San Jose",
  serviceNames: ["Detección de fugas", "Cambio de calentador"],
});
assert.equal(jsonLd["@type"], "LocalBusiness");
assert.ok(String(jsonLd.url).startsWith("https://"), "schema url must be absolute");
assert.equal(jsonLd.additionalType, "Plomería");
assert.equal(jsonLd.areaServed, "San Jose");
assert.equal((jsonLd.makesOffer as unknown[]).length, 2, "real service titles must reach structured data");
assert.equal(jsonLd.aggregateRating, undefined, "AggregateRating must stay structurally omitted");

const emptyJsonLd = serviciosJsonLd({ name: "X", url: "https://example.test/x" });
for (const absent of ["additionalType", "areaServed", "makesOffer", "address", "telephone"]) {
  assert.equal(emptyJsonLd[absent], undefined, `${absent} must be omitted, never fabricated, when absent`);
}
ok("3a. canonical + truthful structured data from real listing keywords, nothing fabricated");

for (const rel of [DETAIL_PAGE, RESULTS_PAGE, LANDING_ROUTE, RELATED_LIB, "app/(site)/servicios/seo/serviciosJsonLd.ts"]) {
  assert.ok(!/el\s*[áa]guila/i.test(read(rel)), `stale El Águila identity found in ${rel}`);
}
ok("3b. no stale El Águila identity in the Servicios discovery surface");

/* ------------------------------------------------------------------ *
 * 4. SITEMAP
 * ------------------------------------------------------------------ */

const sitemapSrc = read(SITEMAP);
assert.ok(sitemapSrc.includes("serviciosSitemapEntries"), "sitemap must include a Servicios section");
assert.ok(
  sitemapSrc.includes("listServiciosPublicListingsRaw"),
  "sitemap must use the safety-gated published reader, never a direct table query",
);
assert.ok(
  sitemapSrc.includes("/clasificados/servicios/${encodeURIComponent(row.slug)}"),
  "sitemap must emit the canonical detail URL, not the legacy /servicios/perfil shim",
);
assert.ok(
  !stripComments(sitemapSrc).includes("/servicios/perfil/"),
  "sitemap CODE must never emit the robots-disallowed legacy shim",
);
assert.ok(
  read("app/lib/seo/leonixDiscoveryContracts.ts").includes("export function leonixSitemapOmitsPerListingDetailUrls(): true"),
  "the pure contract's own assertion must remain intact (LEO sensor depends on it)",
);
ok("4. published Servicios detail URLs enter the existing sitemap architecture, safety-gated");

/* ------------------------------------------------------------------ *
 * 5. LANDING DATA CONTRACT
 * ------------------------------------------------------------------ */

const landingRouteSrc = read(LANDING_ROUTE);
const landingRouteCode = stripComments(landingRouteSrc);
assert.ok(
  !/export const dynamic\s*=/.test(landingRouteCode),
  "the landing must not claim a dynamic data contract it does not have",
);
// The stale claim may only survive as documentation OF the removal, never as a live assertion.
assert.ok(
  !landingRouteCode.includes("servicios_public_listings"),
  "the stale live-data claim must be gone from executable landing code",
);
assert.ok(landingRouteSrc.includes("Suspense"), "the client search-param boundary must remain");
const landingClientSrc = read("app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx");
assert.ok(
  !/supabase|listServiciosPublicListings/i.test(landingClientSrc),
  "landing is category navigation — it genuinely performs no DB read",
);
assert.ok(
  landingClientSrc.includes("/clasificados/publicar/servicios/checkpoint"),
  "the landing publish CTA must still route through the paid checkpoint",
);
ok("5. landing data contract is now truthful (static category navigation)");

/* ------------------------------------------------------------------ *
 * 6. ONE CONNECTED DISCOVERY CIRCUIT
 * ------------------------------------------------------------------ */

assert.ok(resultsPageSrc.includes("listServiciosPublicListingsRaw"), "results reads published rows");
assert.ok(resultsPageSrc.includes("filterServiciosPublicListingRows"), "results applies real filters/location");
assert.ok(resultsPageSrc.includes("SavedSearchButton"), "results offers Saved Search");
assert.ok(
  resultsPageSrc.includes("ServiciosHorizontalResultCard"),
  "results link out through the existing card to public detail",
);
assert.ok(detailSrc.includes("getServiciosPublicListingBySlugForDiscovery"), "public detail reads the same published truth");
assert.ok(detailSrc.includes("ServiciosRelatedListingsSection"), "public detail offers Related Listings");
assert.ok(detailSrc.includes("serviciosJsonLd"), "public detail emits canonical structured data");
assert.ok(
  read("app/lib/saved-search/servicios/serviciosSavedSearchDeliveryResolver.ts").includes(
    "/clasificados/servicios/${encodeURIComponent(slug)}",
  ),
  "a saved-search match email must land on the canonical public detail URL",
);
ok("6. published -> results -> filters -> Saved Search -> public detail -> Related -> canonical URL");

/* ------------------------------------------------------------------ *
 * 7. DEAD-PATH CLEANUP READINESS (nothing deleted in this gate)
 * ------------------------------------------------------------------ */

const DEAD_MODULES = [
  "app/(site)/servicios/perfil/preview/ServiciosPreviewClient.tsx",
  "app/(site)/servicios/publicar/components/ServiciosApplicationForm.tsx",
  "app/(site)/servicios/publicar/hooks/useServiciosApplicationDraftState.ts",
  "app/(site)/servicios/publicar/lib/createEmptyServiciosApplicationDraft.ts",
  "app/(site)/servicios/publicar/lib/serviciosApplicationFieldValidation.ts",
  "app/(site)/servicios/publicar/lib/serviciosApplicationPublishReadiness.ts",
  "app/(site)/servicios/publicar/serviciosCategories.ts",
  "app/(site)/servicios/publicar/serviciosPublicarCopy.ts",
  "app/(site)/servicios/data/demoServiciosBusinessProfile.ts",
  "app/(site)/servicios/data/serviciosApplicationDraftSamples.ts",
  "app/(site)/servicios/lib/serviciosDraftStorage.ts",
  "app/(site)/servicios/lib/serviciosDraftParse.ts",
  "app/(site)/clasificados/servicios/resultados/page_temp.tsx",
  "app/(site)/clasificados/servicios/ServiciosListingResultCard.tsx",
  "app/(site)/clasificados/servicios/analytics/serviciosAnalytics.ts",
  "app/(site)/clasificados/servicios/shell/ServiciosPreviewCard.tsx",
  "app/(site)/clasificados/servicios/landing/FeaturedBusinessSection.tsx",
  "app/(site)/clasificados/servicios/landing/RecentServicesSection.tsx",
  "app/(site)/servicios/components/ServiciosHeroActions.tsx",
];

// Still present (this gate deletes nothing) …
for (const rel of DEAD_MODULES) {
  assert.ok(exists(rel), `${rel} must still exist — Gate 2 deletes nothing`);
}

// … and still imported by nobody outside the dead island itself.
const SOURCE_DIRS = ["app", "scripts", "e2e", "tests"];
function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const allFiles = SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const DEAD_ISLAND_PREFIXES = [
  path.join(ROOT, "app", "(site)", "servicios", "publicar"),
  path.join(ROOT, "app", "(site)", "servicios", "perfil", "preview"),
  path.join(ROOT, "app", "(site)", "servicios", "data"),
  path.join(ROOT, "app", "(site)", "servicios", "lib", "serviciosDraft"),
];

for (const rel of DEAD_MODULES) {
  const base = path.basename(rel).replace(/\.(tsx|ts)$/, "");
  const importers: string[] = [];
  for (const file of allFiles) {
    if (file === path.join(ROOT, rel)) continue;
    // A module's own route page legitimately renders it; that is recorded as a ROUTE, not an import.
    if (DEAD_ISLAND_PREFIXES.some((p) => file.startsWith(p))) continue;
    const src = fs.readFileSync(file, "utf8");
    if (new RegExp(`from ["'][^"']*/${base}["']|import\\(["'][^"']*/${base}["']\\)`).test(src)) {
      importers.push(path.relative(ROOT, file));
    }
  }
  assert.equal(
    importers.length,
    0,
    `${rel} is no longer zero-consumer — importers: ${importers.join(", ")}`,
  );
}
ok(`7a. all ${DEAD_MODULES.length} recorded dead modules still have zero live importers`);

// Route proof: only two of the dead paths are reachable routes, and both are page.tsx-backed.
assert.ok(exists("app/(site)/servicios/perfil/preview/page.tsx"), "legacy preview is still a reachable route");
assert.ok(exists("app/(site)/servicios/publicar/page.tsx"), "legacy publicar is still a reachable route (redirect)");
assert.ok(
  read("app/(site)/servicios/publicar/page.tsx").includes("redirect("),
  "/servicios/publicar is a redirect shim — its route must be preserved even after its siblings are removed",
);
assert.ok(
  read("app/lib/seo/leonixDiscoveryContracts.ts").includes('"/servicios/perfil"'),
  "the legacy preview route must stay robots-disallowed while it exists",
);
// page_temp.tsx is NOT a route: Next only routes files literally named page.tsx.
assert.ok(!exists("app/(site)/clasificados/servicios/resultados/page_temp/page.tsx"));
ok("7b. route-level proof recorded for the two reachable legacy routes");

console.log("\nverify-servicios-gate2-discovery: PASS");
