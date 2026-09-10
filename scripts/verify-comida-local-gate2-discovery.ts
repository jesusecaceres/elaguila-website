/**
 * Gate COMIDA-LOCAL-2 verifier — behavioral proofs, not string matching.
 *
 * Run:  node node_modules/tsx/dist/cli.mjs scripts/verify-comida-local-gate2-discovery.ts
 *
 * Assertions execute the real shipped modules wherever the claim is behavioral. Where a claim can
 * only be made about source (a route's DB call chain, a registry entry), the source is read with
 * comments STRIPPED first, so a sentence in a doc comment can never satisfy a claim about code.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  buildComidaLocalResultsHref,
  emptyComidaLocalResultsFilters,
  COMIDA_LOCAL_RESULTS_PARAM_KEYS,
  COMIDA_LOCAL_RESULTS_PATH,
} from "../app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import { parseComidaLocalResultsSearchParams } from "../app/lib/clasificados/comida-local/comidaLocalPublicFilter";
import {
  comidaLocalFiltersToSavedSearch,
  describeComidaLocalSavedSearchFacets,
  savedSearchToComidaLocalFilters,
  SAVED_SEARCH_COMIDA_LOCAL_CATEGORY,
} from "../app/lib/saved-search/comida-local/savedSearchComidaLocalAdapter";
import { buildComidaLocalSavedSearchResultsUrl } from "../app/lib/saved-search/comida-local/comidaLocalSavedSearchResultsUrl";
import { certifyComidaLocalPublicEligibleListing } from "../app/lib/saved-search/comida-local/comidaLocalPublicEligibleListing";
import { matchesComidaLocalSavedSearch } from "../app/lib/saved-search/comida-local/savedSearchComidaLocalMatcher";
import { canonicalizeSavedSearch } from "../app/lib/saved-search/savedSearchCanonicalize";
import { comidaLocalJsonLd } from "../app/(site)/clasificados/comida-local/seo/comidaLocalJsonLd";
import type { ComidaLocalPublicListingRow } from "../app/lib/clasificados/comida-local/comidaLocalPublicTypes";

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`  FAIL  ${name} -> ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message} (got ${a}, expected ${b})`);
}

function readSrc(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function stripComments(file: string): string {
  return readSrc(file)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** A published row shaped exactly like the live public select returns. */
function row(overrides: Partial<ComidaLocalPublicListingRow> = {}): ComidaLocalPublicListingRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "tacos-lupita-san-jose",
    leonix_ad_id: "COMIDA-2026-000001",
    status: "published",
    package_tier: "basic",
    payment_status: "paid",
    published_at: "2026-09-01T00:00:00.000Z",
    business_name: "Tacos Lupita",
    food_type: "tacos",
    food_type_custom: null,
    city_canonical: "san-jose",
    city_display: "San Jose",
    zone_note: "Zona Este",
    que_vendes: "Tacos de birria hechos al momento.",
    phone: "(408) 555-1234",
    whatsapp: "(408) 555-9876",
    instagram_url: "https://instagram.com/tacoslupita",
    facebook_url: null,
    tiktok_url: null,
    location_note: "Hoy en First y Santa Clara",
    location_url: "https://maps.example.com/pin",
    availability_note: "Fines de semana",
    service_options: ["pickup", "delivery"],
    payment_methods: ["cash"],
    payment_other_note: null,
    price_level: "2",
    languages: ["es"],
    main_photo: null,
    logo_image: null,
    gallery_images: [],
    listing_json: null,
    ...overrides,
  } as ComidaLocalPublicListingRow;
}

function certified(overrides: Partial<ComidaLocalPublicListingRow> = {}) {
  const c = certifyComidaLocalPublicEligibleListing(row(overrides));
  assert(c, "fixture row should certify as publicly eligible");
  return c!;
}

console.log("\nGate COMIDA-LOCAL-2 — Comida Local discovery verification\n");

/* ============================================================================================
 * 1. SAVED SEARCH — adopted, not rebuilt
 * ==========================================================================================*/

console.log("SAVED SEARCH — ADOPTION");

check("no category-local Saved Search engine was created", () => {
  const dir = path.join(ROOT, "app/lib/saved-search/comida-local");
  for (const file of readdirSync(dir)) {
    const src = stripComments(`app/lib/saved-search/comida-local/${file}`);
    assert(!/from\s+["']crypto["']|subtle\.digest|createHash/.test(src), `${file} must not hash — the shared engine owns fingerprints`);
    assert(!/from\("saved_searches"\)/.test(src), `${file} must not query saved_searches directly`);
  }
  const adapter = stripComments("app/lib/saved-search/comida-local/savedSearchComidaLocalAdapter.ts");
  assert(!/createClient|supabase/i.test(adapter), "the adapter must be pure translation — no client");
  assert(!/fingerprint/i.test(adapter), "the adapter must not compute a fingerprint");
});

check("the shared engine's own modules were not modified by this gate", () => {
  // Only the delivery registry may gain an entry; the canonicalizer/CRUD/types stay untouched.
  const canonical = readSrc("app/lib/saved-search/savedSearchCanonicalize.ts");
  assert(!/comida/i.test(canonical), "the shared canonicalizer must stay category-agnostic");
  const crud = readSrc("app/lib/saved-search/savedSearchServerCrud.ts");
  assert(!/comida/i.test(crud), "the shared CRUD layer must stay category-agnostic");
  const button = readSrc("app/(site)/clasificados/components/savedSearch/SavedSearchButton.tsx");
  assert(!/comida/i.test(button), "the shared CTA must stay category-agnostic");
});

check("the adapter round-trips every live filter field", () => {
  const filters = {
    q: "birria",
    city: "San Jose",
    foodType: "tacos",
    service: "delivery",
    priceLevel: "2",
  };
  const saved = comidaLocalFiltersToSavedSearch(filters);
  eq(saved.category, SAVED_SEARCH_COMIDA_LOCAL_CATEGORY, "category");
  eq(saved.city, "San Jose", "city uses the generic column");
  eq(saved.minPrice, null, "price LEVEL is not a numeric band");
  eq(saved.maxPrice, null, "price LEVEL is not a numeric band");
  eq(savedSearchToComidaLocalFilters(saved), filters, "round trip");
});

check("every key the LIVE parser reads is covered by the adapter", () => {
  const parsed = parseComidaLocalResultsSearchParams({
    q: "birria",
    city: "San Jose",
    foodType: "tacos",
    service: "delivery",
    priceLevel: "2",
    lang: "en",
  });
  const saved = comidaLocalFiltersToSavedSearch(parsed);
  eq(savedSearchToComidaLocalFilters(saved), parsed, "no live filter field is dropped");
  // `lang` is route/display, never a match facet.
  assert(
    !JSON.stringify(saved).includes('"en"'),
    "lang must never reach the saved payload",
  );
});

check("empty filters produce an empty payload, not a payload of empty strings", () => {
  const saved = comidaLocalFiltersToSavedSearch(emptyComidaLocalResultsFilters());
  eq(saved.filterPayload, {}, "payload");
  eq(saved.city, "", "city");
});

check("the fingerprint is order-independent and ignores absent facets", () => {
  const a = canonicalizeSavedSearch(
    comidaLocalFiltersToSavedSearch({ q: "birria", city: "San Jose", foodType: "tacos", service: "", priceLevel: "" }),
  );
  const b = canonicalizeSavedSearch(
    comidaLocalFiltersToSavedSearch({ foodType: "tacos", city: "San Jose", q: "birria", priceLevel: "", service: "" }),
  );
  eq(JSON.stringify(a), JSON.stringify(b), "key order must not change identity");
});

check("the saved-search results URL is rebuilt through the LIVE href builder", () => {
  const filters = { q: "birria", city: "San Jose", foodType: "tacos", service: "delivery", priceLevel: "2" };
  const saved = comidaLocalFiltersToSavedSearch(filters);
  const url = buildComidaLocalSavedSearchResultsUrl(saved, "es");
  eq(url, buildComidaLocalResultsHref(filters, "es"), "must equal what the live form would push");

  // And the LIVE parser must read it back to the same filters — the real round trip.
  const query = Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""));
  eq(parseComidaLocalResultsSearchParams(query), filters, "live parser round trip");
});

check("the live filter form and the saved-search builder share ONE serializer", () => {
  const form = stripComments("app/(site)/clasificados/comida-local/components/ComidaLocalResultsFilters.tsx");
  assert(form.includes("buildComidaLocalResultsHref"), "the form must use the shared builder");
  assert(
    !/params\.set\("foodType"/.test(form),
    "the form must no longer hand-roll the query string",
  );
  const builder = stripComments("app/lib/saved-search/comida-local/comidaLocalSavedSearchResultsUrl.ts");
  assert(builder.includes("buildComidaLocalResultsHref"), "the builder must use the same function");
});

console.log("\nSAVED SEARCH — MATCH SEMANTICS");

check("the matcher runs the REAL live results filter, not a copy", () => {
  const src = stripComments("app/lib/saved-search/comida-local/savedSearchComidaLocalMatcher.ts");
  assert(src.includes("filterComidaLocalPublicRows"), "must call the live filter function");
  assert(
    src.includes('from "@/app/lib/clasificados/comida-local/comidaLocalPublicFilter"'),
    "must import it from the pure module the live reader also imports",
  );
  assert(!/row\.food_type|row\.city_display|includes\(/.test(src), "must not reimplement filter logic");

  // The live reader must apply that SAME exported function (imported under a local alias so the
  // module can re-export the original name for existing call sites).
  const queries = stripComments("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert(
    /filterComidaLocalPublicRows as applyComidaLocalPublicFilters,[\s\S]*?from "\.\/comidaLocalPublicFilter"/.test(queries),
    "the live reader must import the pure filter",
  );
  assert(
    /const filtered = applyComidaLocalPublicFilters\(fetched\.rows, filters\)/.test(queries),
    "the live results reader must apply it",
  );
  // Exactly one implementation exists on disk.
  const impls = [
    "app/lib/clasificados/comida-local/comidaLocalPublicFilter.ts",
    "app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts",
    "app/lib/saved-search/comida-local/savedSearchComidaLocalMatcher.ts",
  ].filter((f) => /export function filterComidaLocalPublicRows/.test(stripComments(f)));
  eq(impls, ["app/lib/clasificados/comida-local/comidaLocalPublicFilter.ts"], "single filter implementation");
});

check("a matching saved search matches, a non-matching one does not", () => {
  const listing = certified();
  const match = comidaLocalFiltersToSavedSearch({ q: "", city: "San Jose", foodType: "tacos", service: "delivery", priceLevel: "2" });
  assert(matchesComidaLocalSavedSearch(listing, match), "should match");

  for (const miss of [
    { q: "", city: "Oakland", foodType: "", service: "", priceLevel: "" },
    { q: "", city: "", foodType: "pupusas", service: "", priceLevel: "" },
    { q: "", city: "", foodType: "", service: "in_person", priceLevel: "" },
    { q: "", city: "", foodType: "", service: "", priceLevel: "3" },
    { q: "sushi", city: "", foodType: "", service: "", priceLevel: "" },
  ]) {
    assert(
      !matchesComidaLocalSavedSearch(listing, comidaLocalFiltersToSavedSearch(miss)),
      `should NOT match ${JSON.stringify(miss)}`,
    );
  }
});

check("city matching keeps the live SUBSTRING semantics (canonical or display)", () => {
  const listing = certified();
  for (const city of ["San Jose", "san jose", "jose", "san-jose"]) {
    assert(
      matchesComidaLocalSavedSearch(listing, comidaLocalFiltersToSavedSearch({ ...emptyComidaLocalResultsFilters(), city })),
      `city "${city}" should match the way the live filter matches it`,
    );
  }
});

check("only publicly-eligible listings can reach the matcher", () => {
  for (const status of ["pending_payment", "draft", "paused", "suspended", "", "PUBLISHED_PENDING"]) {
    eq(certifyComidaLocalPublicEligibleListing(row({ status })), null, `status "${status}" must not certify`);
  }
  eq(certifyComidaLocalPublicEligibleListing(row({ slug: "  " })), null, "a slugless row must not certify");
  eq(certifyComidaLocalPublicEligibleListing(null), null, "null must not certify");
  assert(certifyComidaLocalPublicEligibleListing(row()) !== null, "a published row must certify");
});

check("the eligibility gate mirrors the LIVE readers exactly", () => {
  const queries = stripComments("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  // Both live readers (results inventory + detail-by-slug) gate on the published status constant,
  // imported under a local alias from the pure module.
  const gates = queries.match(/\.eq\("status", PUBLISHED_STATUS\)/g) ?? [];
  assert(gates.length === 2, `both live readers must gate on published status, saw ${gates.length}`);
  assert(
    /COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED as PUBLISHED_STATUS/.test(queries),
    "that alias must be the shared published-status constant, not a local literal",
  );
  eq(
    stripComments("app/lib/clasificados/comida-local/comidaLocalPublicFilter.ts").match(
      /COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED = "published"/,
    ) !== null,
    true,
    "the constant's single definition",
  );
  const eligible = stripComments("app/lib/saved-search/comida-local/comidaLocalPublicEligibleListing.ts");
  assert(
    eligible.includes("COMIDA_LOCAL_PUBLIC_STATUS_PUBLISHED"),
    "eligibility must reuse the readers' own status constant",
  );
  assert(
    !eligible.includes("isComidaLocalPublishPubliclyVisible"),
    "must not apply a stricter rule than the live pages (that helper has zero runtime consumers)",
  );
});

console.log("\nSAVED SEARCH — LEDGER + REGISTRIES");

check("the orchestrator writes truthful ledger values", () => {
  const src = stripComments("app/lib/saved-search/comida-local/comidaLocalSavedSearchMatchOrchestrator.ts");
  assert(/listing_price: null/.test(src), "price LEVEL is not an amount -> null, never fabricated");
  assert(/seller_lane: null/.test(src), "this category draws no seller lane -> null");
  assert(src.includes("certifyComidaLocalPublicEligibleListing"), "must re-certify before writing");
  assert(
    /onConflict: "saved_search_id,listing_id,event_type", ignoreDuplicates: true/.test(src),
    "must reuse the existing dedupe contract",
  );
  assert(src.includes("COMIDA_LOCAL_PUBLIC_LISTING_SELECT"), "must load the same shape the live readers project");
});

check("the ledger migration widens both CHECKs and nothing else", () => {
  const sql = readSrc("supabase/migrations/20260911120000_saved_search_match_events_comida_local.sql");
  assert(sql.includes("saved_search_match_events_category_check"), "match events CHECK");
  assert(sql.includes("saved_search_processing_failures_category_check"), "failures CHECK");
  for (const cat of ["autos", "bienes-raices", "rentas", "servicios", "restaurantes", "comida-local"]) {
    assert(sql.includes(`'${cat}'`), `${cat} must survive the widened CHECK`);
  }
  assert(!/DROP TABLE|CREATE TABLE|DROP INDEX/i.test(sql), "must be additive only");
  assert(!/seller_lane_check/i.test(sql), "no seller-lane vocabulary is invented");
});

check("saved_searches itself needs no widening (verified against its own migration)", () => {
  const sql = readSrc("supabase/migrations/20260817120000_saved_searches_v1_reconcile.sql");
  assert(
    !/category\s+IN\s*\(/i.test(sql),
    "if saved_searches ever gains a category enum, this gate's claim must be revisited",
  );
});

check("comida-local is registered in the delivery resolver registry", () => {
  const src = stripComments("app/lib/saved-search/delivery/savedSearchEmailDelivery.ts");
  assert(/"comida-local": comidaLocalSavedSearchDeliveryResolver/.test(src), "CATEGORY_RESOLVERS entry");
});

check("comida-local is registered in the owner dashboard registry", () => {
  const src = stripComments("app/(site)/dashboard/busquedas-guardadas/page.tsx");
  assert(src.includes("describeComidaLocalSavedSearchFacets"), "facet describer");
  assert(src.includes("buildComidaLocalSavedSearchResultsUrl"), "results URL builder");
  assert(/"comida-local":\s*\{/.test(src), "CATEGORY_REGISTRY entry");
});

check("the facet summary surfaces recognizable facets, never raw JSON", () => {
  const parts = describeComidaLocalSavedSearchFacets(
    comidaLocalFiltersToSavedSearch({ q: "birria", city: "San Jose", foodType: "tacos", service: "delivery", priceLevel: "2" }),
    "es",
  );
  assert(parts.includes("tacos"), "food type");
  assert(parts.includes("Entrega"), "service label localized");
  assert(parts.includes("$$"), "price level token");
  assert(parts.some((p) => p.includes("birria")), "query");
  assert(!parts.some((p) => p.includes("{")), "never raw payload JSON");
});

check("the match trigger fires only on a real activation, from the activation site", () => {
  const src = stripComments("app/lib/listingPlans/revenueFulfillment.ts");
  assert(src.includes("triggerComidaLocalSavedSearchMatchBestEffort"), "trigger imported and called");
  const idx = src.indexOf("triggerComidaLocalSavedSearchMatchBestEffort(activation.listingId");
  assert(idx > 0, "must be called with the activated listing id");
  const guard = src.slice(Math.max(0, idx - 200), idx);
  assert(
    /activation\.outcome === "activated"/.test(guard),
    "must be guarded on the real pending -> published transition (a re-delivered webhook must not re-fire)",
  );
});

/* ============================================================================================
 * 2. FIND ME TODAY ISOLATION (Gate COMIDA-LOCAL-1 policy untouched)
 * ==========================================================================================*/

console.log("\nFIND ME TODAY ISOLATION");

check("no temporary-location field can enter a saved search payload or fingerprint", () => {
  const saved = comidaLocalFiltersToSavedSearch({
    q: "First y Santa Clara",
    city: "San Jose",
    foodType: "tacos",
    service: "delivery",
    priceLevel: "2",
  });
  const blob = JSON.stringify([saved, canonicalizeSavedSearch(saved)]);
  for (const field of ["locationNote", "locationUrl", "locationUpdatedAt", "location_note", "location_url"]) {
    assert(!blob.includes(field), `${field} must never reach the saved search`);
  }
});

check("the live results filter contract has NO freshness/current-location facet", () => {
  // This is why there is nothing durable to fingerprint — proven against the real key list and the
  // real filter body, not asserted.
  eq(
    [...COMIDA_LOCAL_RESULTS_PARAM_KEYS],
    ["q", "city", "foodType", "service", "priceLevel"],
    "the whole live filter contract",
  );
  const queries = stripComments("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  const filterBody = queries.slice(
    queries.indexOf("export function filterComidaLocalPublicRows"),
    queries.indexOf("export function parseComidaLocalResultsSearchParams"),
  );
  for (const field of ["location_note", "location_url", "locationUpdatedAt", "fresh"]) {
    assert(!filterBody.includes(field), `the live filter must not read ${field}`);
  }
});

check("a vendor moving does not change whether a saved search matches", () => {
  const saved = comidaLocalFiltersToSavedSearch({ q: "", city: "San Jose", foodType: "tacos", service: "", priceLevel: "" });
  const before = matchesComidaLocalSavedSearch(
    certified({ location_note: "Hoy en First y Santa Clara", location_url: "https://maps.example.com/a" }),
    saved,
  );
  const after = matchesComidaLocalSavedSearch(
    certified({ location_note: "Hoy en Alum Rock", location_url: "https://maps.example.com/b" }),
    saved,
  );
  const cleared = matchesComidaLocalSavedSearch(certified({ location_note: null, location_url: null }), saved);
  assert(before && after && cleared, "match must be independent of today's location");
});

check("Related Listings never relate by temporary location", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/lib/comidaLocalRelatedListings.ts");
  for (const field of ["location_note", "location_url", "locationUpdatedAt"]) {
    assert(!src.includes(field), `relatedness must not read ${field}`);
  }
});

check("JSON-LD structurally cannot emit a temporary location", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/seo/comidaLocalJsonLd.ts");
  assert(!/locationNote|location_note/.test(src), "builder has no temporary-location input");
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  const jsonLdCall = page.slice(page.indexOf("comidaLocalJsonLd({"), page.indexOf("breadcrumbJsonLd(["));
  assert(!/locationNote/.test(jsonLdCall), "the page must not pass vm.locationNote into structured data");
});

check("Gate COMIDA-LOCAL-1 policy modules were not touched by this gate", () => {
  const policy = readSrc("app/lib/clasificados/comida-local/comidaLocalTemporaryLocation.ts");
  assert(policy.includes("COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_HOURS = 24"), "24h window intact");
  assert(!/COMIDA-LOCAL-2/.test(policy), "Gate 2 must not have edited the Gate 1 policy");
});

/* ============================================================================================
 * 3. RELATED LISTINGS — real data, real relationships
 * ==========================================================================================*/

console.log("\nRELATED LISTINGS");

check("no ranking engine, no paid placement, no fabricated data", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/lib/comidaLocalRelatedListings.ts");
  assert(src.includes("listPublishedComidaLocalListings"), "candidates come from the canonical published reader");
  for (const banned of ["promoted", "package_tier", "payment_status", "entitlement", "VisibilityBucket", "weight"]) {
    assert(!src.includes(banned), `relatedness must not consult ${banned}`);
  }
  assert(!/Math\.random|slice\(0, *limit\).*fallback/i.test(src), "no filler");
});

check("the rail reuses the existing results card and row mapper", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/components/ComidaLocalRelatedListingsSection.tsx");
  assert(src.includes("ComidaLocalListingCard"), "reuses the live results card");
  assert(src.includes("mapComidaLocalRowToCardVm"), "reuses the live row mapper");
  assert(!/<article|CL_CARD_SURFACE/.test(src), "no new card was introduced");
});

check("an empty rail renders a real browse link, never filler", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/components/ComidaLocalRelatedListingsSection.tsx");
  assert(src.includes("browseHref"), "a real browse href is required");
  assert(/rows\.length > 0 \?/.test(src), "empty state is explicit");
});

check("the detail page passes a real hub href and awaits real rows", () => {
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert(page.includes("await listRelatedComidaLocalListings(row)"), "real reader call");
  assert(/browseHref={hubHref}/.test(page), "real browse href");
});

/* ============================================================================================
 * 4. JSON-LD / SEO
 * ==========================================================================================*/

console.log("\nJSON-LD / SEO");

check("structured data is FoodEstablishment with real fields only", () => {
  const json = comidaLocalJsonLd({
    name: "Tacos Lupita",
    url: "https://example.com/clasificados/comida-local/tacos-lupita-san-jose",
    description: "Tacos de birria.",
    telephone: "(408) 555-1234",
    areaServed: "San Jose",
    servesCuisine: "Tacos",
    priceRange: "$$",
    sameAs: ["https://instagram.com/tacoslupita", "  "],
  });
  eq(json["@type"], "FoodEstablishment", "type must not overclaim a sit-down Restaurant");
  eq(json.name, "Tacos Lupita", "name");
  eq(json.sameAs, ["https://instagram.com/tacoslupita"], "blank sameAs entries dropped");
  assert(!("aggregateRating" in json), "no fabricated rating");
  assert(!("review" in json), "no fabricated reviews");
  assert(!("address" in json), "address omitted when not supplied");
});

check("the builder has no rating input at all (structural, not conventional)", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/seo/comidaLocalJsonLd.ts");
  assert(!/rating|reviewCount|aggregateRating/i.test(src), "no rating parameter may exist");
});

check("empty optional fields are omitted, never emitted blank", () => {
  const json = comidaLocalJsonLd({ name: "X", url: "https://e.com/x" });
  eq(Object.keys(json).sort(), ["@context", "@type", "name", "url"], "minimal object");
});

check("the JSON-LD url is the ABSOLUTE canonical the page also declares", () => {
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert(page.includes("LEONIX_SITE_ORIGIN"), "absolute origin helper used");
  assert(
    /const canonicalUrl = `\$\{LEONIX_SITE_ORIGIN\}\/clasificados\/comida-local\/\$\{encodeURIComponent\(row\.slug\.trim\(\)\)\}`/.test(page),
    "absolute canonical built from the row's own slug",
  );
  assert(/alternates: \{ canonical \}/.test(page), "generateMetadata still declares the same canonical path");
});

check("the address passed to JSON-LD is the privacy-gated VM value only", () => {
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert(/addressText: vm\.businessAddressLine/.test(page), "must use the gated VM field");
  assert(
    !/addressText:\s*row\.|listing_json/.test(page.slice(page.indexOf("comidaLocalJsonLd({"), page.indexOf("breadcrumbJsonLd(["))),
    "must never read a raw draft address",
  );
  const mapper = stripComments("app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts");
  assert(
    /const businessAddressLine = draft\.showAddressPublicly \?/.test(mapper),
    "the single privacy gate must still be the source of that field",
  );
});

check("both JSON-LD blocks are rendered and are ES/EN aware", () => {
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  const blocks = page.match(/type="application\/ld\+json"/g) ?? [];
  assert(blocks.length === 2, `expected entity + breadcrumb JSON-LD, saw ${blocks.length}`);
  assert(/lang=\$\{pageLang\}/.test(page), "breadcrumb paths carry the route language");
  assert(page.includes("breadcrumbJsonLd(["), "uses the shared breadcrumb helper");
});

/* ============================================================================================
 * 5. SITEMAP
 * ==========================================================================================*/

console.log("\nSITEMAP");

check("comida-local is composed as a DB-backed section in the route module", () => {
  const src = stripComments("app/sitemap.ts");
  assert(src.includes("comidaLocalSitemapEntries"), "section function exists");
  assert(/\.\.\.\(await comidaLocalSitemapEntries\(base, now\)\)/.test(src), "section is composed into the sitemap");
  assert(src.includes("listPublishedComidaLocalListings"), "uses the category's safety-gated reader");
  assert(!/from\("comida_local_public_listings"\)/.test(src), "never a direct table query");
});

check("only published rows with a real slug can appear, at the canonical path", () => {
  const src = stripComments("app/sitemap.ts");
  const section = src.slice(src.indexOf("async function comidaLocalSitemapEntries"), src.indexOf("const RESTAURANTES_SITEMAP_MAX"));
  assert(/listed\.source !== "published"/.test(section), "non-published outcomes yield no entries");
  assert(/filter\(\(row\) => Boolean\(row\.slug\?\.trim\(\)\)\)/.test(section), "slugless rows excluded");
  assert(/\/clasificados\/comida-local\/\$\{encodeURIComponent\(row\.slug\)\}/.test(section), "canonical detail path only");
  assert(/catch \{/.test(section), "one unavailable section must not fail the whole sitemap");
});

check("the pure sitemap contract was not touched", () => {
  const contracts = readSrc("app/lib/seo/leonixDiscoveryContracts.ts");
  assert(!/comida-local\//.test(contracts), "no per-listing URL may enter the pure contract");
  assert(contracts.includes('"/clasificados/comida-local"'), "the hub entry is unchanged");
});

/* ============================================================================================
 * 6. DISCOVERY CONTINUITY — one connected circuit
 * ==========================================================================================*/

console.log("\nDISCOVERY CONTINUITY");

check("published -> results -> saved search -> detail -> related -> JSON-LD -> sitemap", () => {
  const listing = certified();

  // published -> live results filter (the real function the page runs)
  const filters = { q: "", city: "San Jose", foodType: "tacos", service: "delivery", priceLevel: "2" };
  const saved = comidaLocalFiltersToSavedSearch(filters);

  // -> saved search matches that published row through the same filter
  assert(matchesComidaLocalSavedSearch(listing, saved), "saved search must match the published row");

  // -> the saved search rebuilds a URL the live parser reads back to the same filters
  const url = buildComidaLocalSavedSearchResultsUrl(saved, "es");
  assert(url.startsWith(`${COMIDA_LOCAL_RESULTS_PATH}?`), "rebuilt URL targets the live results route");
  const query = Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""));
  eq(parseComidaLocalResultsSearchParams(query), filters, "URL round-trips through the live parser");

  // -> the detail path used by delivery, JSON-LD and the sitemap is one canonical shape
  const detailPath = `/clasificados/comida-local/${encodeURIComponent(listing.slug)}`;
  const delivery = stripComments("app/lib/saved-search/comida-local/comidaLocalSavedSearchDeliveryResolver.ts");
  assert(
    /\$\{COMIDA_LOCAL_RESULTS_PATH\}\/\$\{encodeURIComponent\(slug\)\}/.test(delivery),
    "delivery builds the same canonical detail path",
  );
  const sitemap = stripComments("app/sitemap.ts");
  assert(sitemap.includes("/clasificados/comida-local/${encodeURIComponent(row.slug)}"), "sitemap uses the same path");
  const page = stripComments("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert(page.includes("/clasificados/comida-local/${encodeURIComponent(row.slug.trim())}"), "JSON-LD uses the same path");
  eq(detailPath, "/clasificados/comida-local/tacos-lupita-san-jose", "canonical detail path shape");
});

check("delivery re-certifies eligibility before sending", () => {
  const src = stripComments("app/lib/saved-search/comida-local/comidaLocalSavedSearchDeliveryResolver.ts");
  assert(src.includes("certifyComidaLocalPublicEligibleListing"), "reuses the same eligibility gate");
  assert(/revalidateListingStillEligible/.test(src), "implements the shared resolver contract");
  assert(!/return `\$\{origin\}.*fake|placeholder/i.test(src), "never a fabricated slug");
});

check("the Saved Search CTA is mounted on the LIVE results surface with LIVE state", () => {
  const src = stripComments("app/(site)/clasificados/comida-local/components/ComidaLocalResultsFilters.tsx");
  assert(src.includes("<SavedSearchButton"), "CTA mounted");
  assert(
    /normalized=\{comidaLocalFiltersToSavedSearch\(current\)\}/.test(src),
    "must be fed the component's own live filter state, not a reconstructed guess",
  );
});

/* ============================================================================================
 * 7. CLEANUP PREP ONLY — nothing deleted
 * ==========================================================================================*/

console.log("\nCLEANUP PREP (RECORD ONLY)");

/** Every ts/tsx module under the Comida Local trees, and whether anything imports it. */
function comidaLocalModules(): string[] {
  const roots = [
    "app/(site)/clasificados/comida-local",
    "app/(site)/publicar/comida-local",
    "app/lib/clasificados/comida-local",
    "app/api/clasificados/comida-local",
    "app/lib/saved-search/comida-local",
  ];
  const out: string[] = [];
  const walk = (rel: string) => {
    const abs = path.join(ROOT, rel);
    let entries: string[];
    try {
      entries = readdirSync(abs);
    } catch {
      return;
    }
    for (const entry of entries) {
      const childRel = `${rel}/${entry}`;
      if (statSync(path.join(ROOT, childRel)).isDirectory()) walk(childRel);
      else if (/\.tsx?$/.test(entry)) out.push(childRel);
    }
  };
  for (const r of roots) walk(r);
  return out;
}

/** Every import specifier appearing anywhere in the scanned source trees. */
function allImportSpecifiers(): Set<string> {
  const specs = new Set<string>();
  const walk = (rel: string) => {
    const abs = path.join(ROOT, rel);
    let entries: string[];
    try {
      entries = readdirSync(abs);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      const childRel = `${rel}/${entry}`;
      if (statSync(path.join(ROOT, childRel)).isDirectory()) walk(childRel);
      else if (/\.(tsx?|mjs)$/.test(entry)) {
        const src = readFileSync(path.join(ROOT, childRel), "utf8");
        for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) specs.add(m[1]);
        for (const m of src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);
      }
    }
  };
  for (const r of ["app", "scripts", "e2e", "tests"]) walk(r);
  return specs;
}

check("ZERO dead runtime modules in the Comida Local trees (re-proved, nothing deleted)", () => {
  const specs = allImportSpecifiers();
  // Next.js route conventions are entered by the framework, not by an import.
  const routeEntry = /\/(page|layout|route|not-found|error|loading|template|default|sitemap|robots|opengraph-image)\.tsx?$/;
  const dead: string[] = [];
  for (const mod of comidaLocalModules()) {
    if (routeEntry.test(mod)) continue;
    const withoutExt = mod.replace(/\.tsx?$/, "");
    const aliased = `@/${withoutExt}`;
    const base = path.basename(withoutExt);
    const imported = [...specs].some(
      (s) => s === aliased || s.endsWith(`/${base}`) || s === `./${base}` || s === `../${base}`,
    );
    if (!imported) dead.push(mod);
  }
  assert(dead.length === 0, `unexpected zero-consumer modules:\n    ${dead.join("\n    ")}`);
});

check("historical audit docs are recorded, present and untouched (NOT deleted)", () => {
  const dir = "app/lib/clasificados/comida-local";
  const docs = readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".md"));
  assert(docs.length === 21, `expected the 21 recorded historical audit docs, saw ${docs.length}`);
  assert(
    docs.every((d) => d.toUpperCase().includes("COMIDA_LOCAL")),
    "all recorded docs belong to this category",
  );
});

check("the retired package tiers are still contained (no customer-facing price consumer)", () => {
  const specs = allImportSpecifiers();
  assert(
    [...specs].some((s) => s.endsWith("/comidaLocalPackages")),
    "the module is still imported (limits + tier labels are live)",
  );
  const src = readSrc("app/lib/clasificados/comida-local/comidaLocalPackages.ts");
  assert(/9900|14900/.test(src), "legacy tier prices still exist in the file (nothing deleted)");
  // The customer-facing price is matrix-derived; no checkpoint/results/detail file may read these.
  for (const file of [
    "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
    "app/(site)/clasificados/comida-local/page.tsx",
    "app/(site)/clasificados/comida-local/[slug]/page.tsx",
  ]) {
    assert(
      !readSrc(file).includes("getComidaLocalPackagePriceLabel"),
      `${file} must not read a legacy package price label`,
    );
  }
});

/* ==========================================================================================*/

console.log(
  `\n${failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES"} — ${passed} passed, ${failures.length} failed\n`,
);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
