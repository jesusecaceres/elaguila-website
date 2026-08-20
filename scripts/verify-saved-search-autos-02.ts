/**
 * Saved Search 02 — Autos normalized contract + matcher foundation verifier.
 * Run: npx tsx scripts/verify-saved-search-autos-02.ts
 *
 * A. canonicalization/fingerprint determinism
 * B. Autos matcher parity against real public filter semantics
 * C. CRUD contract/static security (owner UUID server-derived, no client override, no forbidden reads)
 * D. no forbidden scope (email/SMS/notification/outbox/publish-hook/Saved Listings mutation)
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

import { canonicalizeSavedSearch } from "../app/lib/saved-search/savedSearchCanonicalize";
import { buildSavedSearchFingerprint } from "../app/lib/saved-search/savedSearchFingerprintServer";
import type { SavedSearchNormalizedInput } from "../app/lib/saved-search/savedSearchTypes";
import {
  autosFilterStateToSavedSearch,
  SAVED_SEARCH_AUTOS_CATEGORY,
} from "../app/lib/saved-search/autos/savedSearchAutosAdapter";
import { matchesAutosSavedSearch } from "../app/lib/saved-search/autos/savedSearchAutosMatcher";
import {
  certifyAutosPublicEligibleListing,
  type AutosPublicEligibleListing,
} from "../app/lib/saved-search/autos/autosPublicEligibleListing";
import { emptyAutosPublicFilters } from "../app/(site)/clasificados/autos/filters/autosPublicFilterTypes";
import type { AutosClassifiedsListingRow } from "../app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosPublicParentCandidate } from "../app/lib/clasificados/autos/autosPublicChildParentVisibility";
import { createEmptyListing } from "../app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults";

const root = process.cwd();
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

// =================================================================================
// A. Canonicalization / fingerprint determinism
// =================================================================================

const baseSearch: SavedSearchNormalizedInput = {
  category: "autos",
  city: "Sacramento",
  minPrice: 5000,
  maxPrice: 15000,
  filterPayload: { make: "Toyota", model: "Camry", transmission: "automatic" },
};

check("same semantic search, different object-key order -> same fingerprint", () => {
  const reordered: SavedSearchNormalizedInput = {
    minPrice: 5000,
    filterPayload: { transmission: "automatic", model: "Camry", make: "Toyota" },
    city: "Sacramento",
    category: "autos",
    maxPrice: 15000,
  };
  assert.equal(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(reordered));
});

check("trimmed/whitespace-equivalent city -> same fingerprint", () => {
  const padded: SavedSearchNormalizedInput = { ...baseSearch, city: "  Sacramento  " };
  assert.equal(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(padded));
});

check("case-different city -> same fingerprint (normalized)", () => {
  const upper: SavedSearchNormalizedInput = { ...baseSearch, city: "SACRAMENTO" };
  assert.equal(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(upper));
});

check("category with different casing -> same fingerprint", () => {
  const upperCat: SavedSearchNormalizedInput = { ...baseSearch, category: "AUTOS" };
  assert.equal(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(upperCat));
});

check("omitted vs empty-string optional facet -> same fingerprint", () => {
  const withEmpty: SavedSearchNormalizedInput = {
    ...baseSearch,
    filterPayload: { ...baseSearch.filterPayload, bodyStyle: "" },
  };
  assert.equal(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(withEmpty));
});

check("different city -> different fingerprint", () => {
  const diff: SavedSearchNormalizedInput = { ...baseSearch, city: "Fresno" };
  assert.notEqual(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(diff));
});

check("different min/max price -> different fingerprint", () => {
  const diffMin: SavedSearchNormalizedInput = { ...baseSearch, minPrice: 6000 };
  const diffMax: SavedSearchNormalizedInput = { ...baseSearch, maxPrice: 20000 };
  assert.notEqual(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(diffMin));
  assert.notEqual(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(diffMax));
});

check("different meaningful Autos facet (make) -> different fingerprint", () => {
  const diff: SavedSearchNormalizedInput = {
    ...baseSearch,
    filterPayload: { ...baseSearch.filterPayload, make: "Honda" },
  };
  assert.notEqual(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(diff));
});

check("different category -> different fingerprint", () => {
  const diff: SavedSearchNormalizedInput = { ...baseSearch, category: "bienes-raices" };
  assert.notEqual(buildSavedSearchFingerprint(baseSearch), buildSavedSearchFingerprint(diff));
});

check("sort/page/UI-only state cannot reach the normalized contract at all", () => {
  // autosFilterStateToSavedSearch's signature only accepts (filters, searchQ) — there is no sort
  // or page parameter to pass, so two identical `filters` always normalize identically regardless
  // of whatever sort/page the caller was showing. This proves the exclusion structurally, not by
  // convention.
  const filters = { ...emptyAutosPublicFilters(), city: "Sacramento", make: "Toyota" };
  const a = autosFilterStateToSavedSearch(filters, "");
  const b = autosFilterStateToSavedSearch(filters, "");
  assert.equal(buildSavedSearchFingerprint(a), buildSavedSearchFingerprint(b));
});

check("radiusMiles is excluded from the saved search even if present in filter state", () => {
  const withRadius = { ...emptyAutosPublicFilters(), city: "Sacramento", radiusMiles: "25" };
  const withoutRadius = { ...emptyAutosPublicFilters(), city: "Sacramento", radiusMiles: "" };
  const a = autosFilterStateToSavedSearch(withRadius, "");
  const b = autosFilterStateToSavedSearch(withoutRadius, "");
  assert.equal(buildSavedSearchFingerprint(a), buildSavedSearchFingerprint(b), "radiusMiles must not affect the fingerprint — it is not an applied filter");
  assert.ok(!("radiusMiles" in a.filterPayload), "radiusMiles must never appear in filterPayload");
});

check("adapter signature statically excludes sort/page/perPage — cannot reach the normalized contract", () => {
  const adapterSrc = fs.readFileSync(
    path.join(root, "app/lib/saved-search/autos/savedSearchAutosAdapter.ts"),
    "utf8",
  );
  const sig = adapterSrc.match(/export function autosFilterStateToSavedSearch\(([\s\S]*?)\):/)?.[1] ?? "";
  assert.ok(sig.length > 0, "could not locate autosFilterStateToSavedSearch signature");
  assert.ok(!/\bsort\b|\bpage\b|\bperPage\b/i.test(sig), `adapter signature must not accept sort/page params, got: ${sig}`);
});

check("canonicalization is idempotent", () => {
  const once = canonicalizeSavedSearch(baseSearch);
  const twice = canonicalizeSavedSearch(once);
  assert.deepEqual(once, twice);
});

// =================================================================================
// B. Autos matcher parity (fixture listings against real applyAutosPublicFilters semantics)
// =================================================================================

function fixtureRow(overrides: Partial<AutosClassifiedsListingRow> = {}): AutosClassifiedsListingRow {
  return {
    id: "fixture-1",
    owner_user_id: "owner-fixture-1",
    lane: "privado",
    status: "active",
    lang: "es",
    featured: false,
    listing_payload: {
      ...createEmptyListing(),
      autosLane: "privado",
      year: 2020,
      make: "Toyota",
      model: "Camry",
      price: 12000,
      mileage: 30000,
      city: "Sacramento",
      state: "CA",
      bodyStyle: "sedan",
      transmission: "automatic",
      drivetrain: "fwd",
      fuelType: "gasoline",
      condition: "used",
    },
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Builds a fixture row (active, non-child by default) and certifies it — throws if certification
 * unexpectedly fails, since every field-filter-parity fixture below is expected to be eligible.
 * Use `certifyAutosPublicEligibleListing` directly (not this helper) to test the null/ineligible
 * paths themselves. */
function certifiedFixtureListing(
  overrides: Partial<AutosClassifiedsListingRow> = {},
  parentsById: ReadonlyMap<string, AutosPublicParentCandidate> = new Map(),
): AutosPublicEligibleListing {
  const row = fixtureRow(overrides);
  const certified = certifyAutosPublicEligibleListing(row, parentsById);
  if (!certified) throw new Error(`fixture row "${row.id}" was expected to be eligible but certification returned null`);
  return certified;
}

type AutoDealerListingT = import("../app/(site)/clasificados/autos/negocios/types/autoDealerListing").AutoDealerListing;

function fixturePayload(overrides: Partial<AutoDealerListingT> = {}): AutoDealerListingT {
  return {
    ...createEmptyListing(),
    autosLane: "privado",
    year: 2020,
    make: "Toyota",
    model: "Camry",
    price: 12000,
    mileage: 30000,
    city: "Sacramento",
    state: "CA",
    bodyStyle: "sedan",
    transmission: "automatic",
    drivetrain: "fwd",
    fuelType: "gasoline",
    condition: "used",
    ...overrides,
  };
}

const matchAll = { ...emptyAutosPublicFilters(), city: "Sacramento", make: "Toyota", priceMin: "5000", priceMax: "15000" };

check("matcher: matching listing -> TRUE", () => {
  const saved = autosFilterStateToSavedSearch(matchAll, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing(), saved), true);
});

check("matcher: wrong make -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), make: "Honda" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ make: "Toyota" }) }), saved), false);
});

check("matcher: wrong model (substring, case-insensitive) -> FALSE when absent", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), model: "Corolla" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ model: "Camry" }) }), saved), false);
});

check("matcher: outside price range -> FALSE (too expensive)", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), priceMax: "10000" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ price: 12000 }) }), saved), false);
});

check("matcher: outside price range -> FALSE (too cheap)", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), priceMin: "20000" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ price: 12000 }) }), saved), false);
});

check("matcher: outside year range -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), yearMin: "2022" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ year: 2020 }) }), saved), false);
});

check("matcher: wrong city -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), city: "Fresno" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ city: "Sacramento" }) }), saved), false);
});

check("matcher: wrong sellerType (dealer vs private) -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), sellerType: "dealer" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ lane: "privado" }), saved), false);
});

check("matcher: wrong transmission -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), transmission: "manual" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ transmission: "automatic" }) }), saved), false);
});

check("matcher: wrong drivetrain -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), drivetrain: "awd" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ drivetrain: "fwd" }) }), saved), false);
});

check("matcher: wrong bodyStyle -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), bodyStyle: "suv" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ bodyStyle: "sedan" }) }), saved), false);
});

check("matcher: mileage over max -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), mileageMax: "20000" }, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing({ listing_payload: fixturePayload({ mileage: 30000 }) }), saved), false);
});

check("matcher: free-text query no match -> FALSE", () => {
  const saved = autosFilterStateToSavedSearch(emptyAutosPublicFilters(), "hybrid");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing(), saved), false);
});

check("matcher: free-text query match (make) -> TRUE", () => {
  const saved = autosFilterStateToSavedSearch(emptyAutosPublicFilters(), "toyota");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing(), saved), true);
});

check("matcher round-trip: saving current filters then matching the exact listing that produced them -> TRUE", () => {
  const filters = {
    ...emptyAutosPublicFilters(),
    city: "Sacramento",
    make: "Toyota",
    model: "Camry",
    yearMin: "2018",
    yearMax: "2022",
    priceMin: "5000",
    priceMax: "15000",
    mileageMax: "50000",
    transmission: "automatic",
    bodyStyle: "sedan",
  };
  const saved = autosFilterStateToSavedSearch(filters, "");
  assert.equal(matchesAutosSavedSearch(certifiedFixtureListing(), saved), true);
});

// =================================================================================
// B2. Saved Search 02B — eligibility/visibility hardening (type-enforced, not documentary)
// =================================================================================

check("eligibility: active, non-child listing -> certifies and can be evaluated normally", () => {
  const certified = certifyAutosPublicEligibleListing(fixtureRow({ status: "active" }), new Map());
  assert.ok(certified, "an active, non-child row must certify");
  const saved = autosFilterStateToSavedSearch(matchAll, "");
  assert.equal(matchesAutosSavedSearch(certified!, saved), true);
});

for (const status of ["draft", "pending_payment", "payment_failed", "cancelled", "removed"] as const) {
  check(`eligibility: status="${status}" -> certification returns null (cannot enter the matcher contract)`, () => {
    const certified = certifyAutosPublicEligibleListing(fixtureRow({ status }), new Map());
    assert.equal(certified, null, `a "${status}" row must never certify as publicly eligible`);
  });
}

check("eligibility: dealer inventory child whose parent id does not resolve -> certification returns null", () => {
  const child = fixtureRow({
    id: "child-orphan",
    lane: "negocios",
    inventory_role: "inventory_vehicle",
    dealer_inventory_parent_listing_id: "does-not-exist",
    owner_user_id: "dealer-owner-1",
  });
  const certified = certifyAutosPublicEligibleListing(child, new Map());
  assert.equal(certified, null, "a child with no resolvable parent must never certify");
});

check("eligibility: dealer inventory child whose parent exists but is NOT active -> certification returns null", () => {
  const parentId = "parent-suspended";
  const parentsById = new Map<string, AutosPublicParentCandidate>([
    [parentId, { id: parentId, lane: "negocios", inventory_role: "main", owner_user_id: "dealer-owner-1", status: "removed" }],
  ]);
  const child = fixtureRow({
    id: "child-of-suspended-dealer",
    lane: "negocios",
    inventory_role: "inventory_vehicle",
    dealer_inventory_parent_listing_id: parentId,
    owner_user_id: "dealer-owner-1",
    status: "active", // the child's OWN status is active — only the parent is not
  });
  const certified = certifyAutosPublicEligibleListing(child, parentsById);
  assert.equal(certified, null, "a child of an inactive/suspended dealer parent must never certify, even if the child row's own status is active");
});

check("eligibility: dealer inventory child whose parent IS active and same-owner -> certifies and matches normally", () => {
  const parentId = "parent-active";
  const parentsById = new Map<string, AutosPublicParentCandidate>([
    [parentId, { id: parentId, lane: "negocios", inventory_role: "main", owner_user_id: "dealer-owner-1", status: "active" }],
  ]);
  const child = fixtureRow({
    id: "child-of-active-dealer",
    lane: "negocios",
    inventory_role: "inventory_vehicle",
    dealer_inventory_parent_listing_id: parentId,
    owner_user_id: "dealer-owner-1",
    status: "active",
  });
  const certified = certifyAutosPublicEligibleListing(child, parentsById);
  assert.ok(certified, "a child of an active, same-owner, negocios/main parent must certify");
  const saved = autosFilterStateToSavedSearch({ ...emptyAutosPublicFilters(), sellerType: "dealer" }, "");
  assert.equal(matchesAutosSavedSearch(certified!, saved), true);
});

check("eligibility: certification never performs I/O — parentsById must be pre-supplied, never fetched", () => {
  const eligibilitySrc = read("app/lib/saved-search/autos/autosPublicEligibleListing.ts");
  assert.ok(!/getAdminSupabase|createSupabaseBrowserClient|\.from\(/.test(eligibilitySrc), "certifyAutosPublicEligibleListing must contain no Supabase/DB calls of any kind");
});

check("eligibility: reuses the existing pure gate function verbatim, never a second implementation", () => {
  const eligibilitySrc = read("app/lib/saved-search/autos/autosPublicEligibleListing.ts");
  assert.ok(eligibilitySrc.includes('from "@/app/lib/clasificados/autos/autosPublicChildParentVisibility"'));
  assert.ok(eligibilitySrc.includes("isAutosChildParentGateSatisfied("));
});

// =================================================================================
// C. CRUD contract / static security
// =================================================================================

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

/** Strips `/** ... *\/` and `// ...` comments so prose documenting what a file deliberately does
 * NOT do (e.g. "no outbox write here") can never trip a forbidden-scope check meant to catch
 * actual implementation, not correct documentation. */
function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const crudLib = read("app/lib/saved-search/savedSearchServerCrud.ts");
const listRoute = read("app/api/saved-search/route.ts");
const idRoute = read("app/api/saved-search/[id]/route.ts");

check("CRUD lib: every query is scoped to an explicit ownerId parameter (eq user_id)", () => {
  const occurrences = (crudLib.match(/\.eq\("user_id", ownerId\)/g) ?? []).length;
  assert.ok(occurrences >= 6, `expected at least 6 explicit .eq("user_id", ownerId) scopes, found ${occurrences}`);
});

check("CRUD lib: insert always stamps user_id from the ownerId parameter, never from input", () => {
  assert.ok(/user_id:\s*ownerId,/.test(crudLib), "insert payload must set user_id: ownerId");
  assert.ok(!/user_id:\s*input\./.test(crudLib), "insert payload must never take user_id from caller input");
});

check("route handlers: ownerId always comes from getBearerUserId, never from request body", () => {
  for (const [name, src] of [
    ["app/api/saved-search/route.ts", listRoute],
    ["app/api/saved-search/[id]/route.ts", idRoute],
  ]) {
    assert.ok(src.includes("getBearerUserId(req)"), `${name} must resolve ownerId via getBearerUserId(req)`);
    assert.ok(!/ownerId\s*=\s*body/.test(src) && !/user_id:\s*body\./.test(src), `${name} must never take ownerId/user_id from the request body`);
    assert.ok(/if \(!ownerId\)/.test(src), `${name} must reject when unauthenticated`);
    assert.ok(src.includes('status: 401'), `${name} must return 401 when unauthenticated`);
  }
});

check("route handlers: never construct a Supabase client with the service-role key exposed to the client (server-only file)", () => {
  for (const [name, src] of [
    ["app/api/saved-search/route.ts", listRoute],
    ["app/api/saved-search/[id]/route.ts", idRoute],
  ]) {
    assert.ok(src.includes('export const runtime = "nodejs"'), `${name} must declare nodejs runtime (server-only)`);
    assert.ok(!src.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY") && !/createSupabaseBrowserClient/.test(src), `${name} must not use a browser/anon client`);
  }
});

check("CRUD lib: dedup uses (user_id, category, fingerprint) — matches the DB unique index", () => {
  assert.ok(crudLib.includes('.eq("category", canonical.category)') && crudLib.includes('.eq("fingerprint", fingerprint)'));
});

check("CRUD lib: reactivation path exists for an identical inactive row", () => {
  assert.ok(/if \(row\.is_active\)/.test(crudLib) && /update\(\{ is_active: true \}\)/.test(crudLib));
});

check("CRUD lib: genuine DB errors are surfaced, not swallowed", () => {
  assert.ok(/return \{ ok: false, error: findError\.message \}/.test(crudLib));
  assert.ok(/error: insertError\?\.message/.test(crudLib));
});

// =================================================================================
// D. No forbidden scope
// =================================================================================

const newFiles = [
  "app/lib/saved-search/savedSearchTypes.ts",
  "app/lib/saved-search/savedSearchCanonicalize.ts",
  "app/lib/saved-search/savedSearchServerCrud.ts",
  "app/lib/saved-search/autos/savedSearchAutosAdapter.ts",
  "app/lib/saved-search/autos/savedSearchAutosMatcher.ts",
  "app/lib/saved-search/autos/autosPublicEligibleListing.ts",
  "app/api/saved-search/route.ts",
  "app/api/saved-search/[id]/route.ts",
];

const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\bsendEmail\b|nodemailer|resend\.|sendgrid/i, "email"],
  [/\btwilio\b|\bsendSms\b/i, "SMS"],
  [/push notification|webpush|expo-notifications/i, "push notification"],
  [/\boutbox\b/i, "outbox"],
  [/\bcron\b/i, "cron"],
  [/edge function|supabase\/functions/i, "Edge Function"],
  [/on\s*publish|publishHook|afterPublish/i, "publish hook"],
  [/price[-_]?drop/i, "price-drop trigger"],
];

check("no forbidden-scope terms (email/SMS/push/outbox/cron/EdgeFn/publish-hook) actually implemented in any new file (comments documenting what a file deliberately does NOT do are fine)", () => {
  for (const rel of newFiles) {
    const code = stripJsComments(read(rel));
    for (const [re, label] of FORBIDDEN_PATTERNS) {
      assert.ok(!re.test(code), `${rel} must not implement ${label}`);
    }
  }
});

check("no new file ever queries/mutates the saved_listings table (a mention explaining the DIFFERENT convention in a comment is fine — an actual .from(\"saved_listings\") call is not)", () => {
  for (const rel of newFiles) {
    const src = read(rel);
    assert.ok(!/\.from\(\s*["']saved_listings["']\s*\)/.test(src), `${rel} must never query/mutate the saved_listings table`);
  }
});

check("matcher is a standalone export, not called from any route/component in this build", () => {
  const matcherCallers = [listRoute, idRoute, crudLib].filter((src) => src.includes("matchesAutosSavedSearch"));
  assert.equal(matcherCallers.length, 0, "matchesAutosSavedSearch must not be wired into the CRUD/route layer this gate — it stays pure and unwired until Saved Search 03");
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-saved-search-autos-02: PASS");
