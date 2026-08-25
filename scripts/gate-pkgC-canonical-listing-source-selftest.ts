/**
 * Package 1 (Gate 7) — canonical Revenue OS `listing_source` contract pins.
 *
 * Pure/static pins for the root-defect fix landed in this build: individual writers no longer
 * invent their own `listing_source` literal, checkout no longer trusts a client-supplied
 * `body.sourceTable` for identity-sensitive writes, and every category has one canonical value.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-canonical-listing-source-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY,
  resolveCanonicalListingSourceForCategory,
  resolveCanonicalListingSourceForPackageKey,
  resolveListingSourceReadCompatibilitySet,
} from "../app/lib/listingPlans/revenueListingSourceResolver";
import { REVENUE_V1_PACKAGE_MATRIX } from "../app/lib/listingPlans/revenuePricingMatrix";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — every category in the pricing matrix has a canonical mapping. Free-only lanes still map
 * to their category's real table (they are still listings, just never Stripe-eligible) — this
 * module's job is table identity, not billing eligibility. */
{
  const categories = new Set(REVENUE_V1_PACKAGE_MATRIX.map((p) => p.category));
  for (const category of categories) {
    const resolved = resolveCanonicalListingSourceForCategory(category);
    assert.ok(resolved, `category "${category}" must resolve to a canonical listing_source`);
  }
}

/* 2 — exact known-good literal pins (regression guard against silent vocabulary drift). */
{
  assert.equal(resolveCanonicalListingSourceForCategory("autos"), "autos_classifieds_listings");
  assert.equal(resolveCanonicalListingSourceForCategory("servicios"), "servicios_public_listings");
  assert.equal(resolveCanonicalListingSourceForCategory("restaurantes"), "restaurantes_public_listings");
  assert.equal(resolveCanonicalListingSourceForCategory("bienes-raices"), "listings");
  assert.equal(resolveCanonicalListingSourceForCategory("rentas"), "listings");
  assert.equal(resolveCanonicalListingSourceForCategory("empleos"), "empleos_public_listings");
  assert.equal(resolveCanonicalListingSourceForCategory("ofertas-locales"), "ofertas_locales");
  assert.equal(resolveCanonicalListingSourceForCategory("viajes"), "viajes_staged_listings");
  // Unknown/unmapped category fails closed to null, never a guess.
  assert.equal(resolveCanonicalListingSourceForCategory("not-a-real-category"), null);
  assert.equal(resolveCanonicalListingSourceForCategory(null), null);
  assert.equal(resolveCanonicalListingSourceForCategory(undefined), null);
}

/* 3 — package-key resolution goes through the server-owned pricing matrix, not client input. */
{
  assert.equal(
    resolveCanonicalListingSourceForPackageKey("autos_dealer_monthly"),
    "autos_classifieds_listings",
  );
  assert.equal(
    resolveCanonicalListingSourceForPackageKey("servicios_base_monthly"),
    "servicios_public_listings",
  );
  assert.equal(resolveCanonicalListingSourceForPackageKey("br_agent_monthly"), "listings");
  assert.equal(resolveCanonicalListingSourceForPackageKey("unknown_package_key"), null);
}

/* 4 — read-time compatibility sets always include the canonical value AND the historical
 * bare-category alias, so pre-existing rows stay readable while writes converge. */
{
  const servicios = resolveListingSourceReadCompatibilitySet("servicios");
  assert.ok(servicios.includes("servicios_public_listings"), "compat set includes canonical");
  assert.ok(servicios.includes("servicios"), "compat set includes legacy bare-category alias");

  const autos = resolveListingSourceReadCompatibilitySet("autos");
  assert.ok(autos.includes("autos_classifieds_listings"));
  assert.ok(autos.includes("autos"));
}

/* 5 — checkout route: identity-sensitive fields are server-derived, never the client-supplied
 * body.sourceTable. */
{
  const route = read("app/api/revenue-os/checkout/route.ts");
  assert.ok(
    route.includes("resolveCanonicalListingSourceForPackageKey"),
    "checkout route must resolve listing_source server-side via the canonical resolver",
  );
  assert.ok(
    route.includes("canonicalListingSource"),
    "checkout route computes one canonical listing_source local once packageDef is known",
  );
  // The recurring-consent and attempt-key writes must use the canonical value, not
  // `body.sourceTable` directly.
  assert.ok(
    !route.includes("listingSource: body.sourceTable ?? null"),
    "recurring consent must no longer trust the client-supplied sourceTable directly",
  );
  assert.ok(
    !route.includes("listingSource: body.sourceTable ?? packageDef.category"),
    "checkout attempt key must no longer trust the client-supplied sourceTable directly",
  );
}

/* 6 — payment record writer accepts and persists a real listing_source column (not metadata-only). */
{
  const writer = read("app/lib/listingPlans/revenuePaymentRecords.ts");
  assert.ok(writer.includes("listingSource?: string | null;"), "input type carries listingSource");
  assert.ok(
    writer.includes("listing_source: input.listingSource ?? null,"),
    "createPendingPaymentRecord must persist listing_source as a real column",
  );
}

/* 7 — renewal payment records (invoice.paid) now write listing_source too (Gate 0's exact
 * reported defect: renewal-originated rows previously wrote none at all). */
{
  const events = read("app/lib/listingPlans/revenueSubscriptionEvents.ts");
  const insertBlock = events.slice(
    events.indexOf('.from("leonix_payment_records").insert({'),
  );
  assert.ok(
    insertBlock.slice(0, 400).includes("listing_source:"),
    "invoice.paid renewal payment record insert must set listing_source",
  );
}

/* 8 — generic entitlement writer no longer writes the bare category slug as listing_source. */
{
  const fulfillment = read("app/lib/listingPlans/revenueEntitlementFulfillment.ts");
  assert.ok(
    !fulfillment.includes("listing_source: input.category,"),
    "generic entitlement writer must not write the bare category slug as listing_source",
  );
  assert.ok(
    fulfillment.includes("resolveCanonicalListingSourceForCategory(input.category) ?? input.category"),
    "generic entitlement writer must resolve canonically, with a same-value fallback only",
  );
}

/* 9 — category adapters (Autos Dealer, Servicios) source their literal from the shared
 * resolver instead of an independently hardcoded string, closing the drift class this pin exists
 * to prevent regressing. */
{
  const servicios = read("app/lib/listingPlans/revenueServiciosFulfillment.ts");
  assert.ok(servicios.includes("resolveCanonicalListingSourceForCategory"), "servicios adapter uses shared resolver");
  const autos = read("app/lib/listingPlans/revenueAutosDealerFulfillment.ts");
  assert.ok(autos.includes("resolveCanonicalListingSourceForCategory"), "autos dealer adapter uses shared resolver");
}

/* 10 — manual cleared payments default to the canonical source rather than the bare category. */
{
  const manual = read("app/lib/listingPlans/manualClearedPayments.ts");
  assert.ok(
    manual.includes("resolveCanonicalListingSourceForCategory(packageDef.category) ?? packageDef.category"),
    "manual cleared payment must default listing_source canonically",
  );
}

/* 11 — additive migration exists, authored-only doctrine documented, never applied by this repo. */
{
  const migration = read(
    "supabase/migrations/20260825120000_revenue_os_canonical_listing_source_backfill.sql",
  );
  assert.ok(migration.includes("NOT APPLIED to any database by this migration file's presence"));
  assert.ok(migration.includes("NOT VALID"), "future-integrity CHECK constraint is added NOT VALID");
  assert.ok(!migration.includes("DELETE FROM"), "migration must never delete payment/entitlement history");
  assert.ok(!migration.includes("DROP TABLE"));
}

/* 12 — retry/idempotency (Gate 2) untouched by this package: the reclaim-retryable logic from
 * commit 62195ecc is present and this package did not modify it. */
{
  const ledger = read("app/lib/listingPlans/stripeEventLedger.ts");
  assert.ok(ledger.includes("failed_retryable"), "reclaim-retryable status handling still present");
  const policy = read("app/lib/listingPlans/stripeEventLedgerPolicy.ts");
  assert.ok(policy.includes("reclaim"), "reclaim decision logic still present");
}

console.log("gate-pkgC-canonical-listing-source-selftest: all assertions passed.");
