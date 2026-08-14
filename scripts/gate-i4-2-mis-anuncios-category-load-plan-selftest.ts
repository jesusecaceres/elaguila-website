/**
 * Gate I.4.2 — behavioral self-test for the `/dashboard/mis-anuncios` selected-category load
 * plan: which sources each category actually needs, and the lightweight dedicated-category count
 * helper. No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-2-mis-anuncios-category-load-plan-selftest.ts
 */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFERRED_DEDICATED_CATEGORIES,
  fetchDedicatedCategoryCounts,
  resolveMisAnunciosLoadPlan,
} from "@/app/dashboard/lib/dashboardMisAnunciosCategoryLoadPlan";
import {
  isMisAnunciosCategoryKey,
  resolveMisAnunciosDefaultCategory,
  type MisAnunciosCategoryKey,
} from "@/app/dashboard/lib/dashboardMisAnunciosCategories";

/* ------------------------------------------------------------------------------------------ *
 * Selected-category loading — each wired category's plan includes only what it actually needs.
 * ------------------------------------------------------------------------------------------ */

const SHARED_LISTINGS_KEYS: MisAnunciosCategoryKey[] = [
  "en-venta",
  "autos",
  "bienes-raices",
  "rentas",
  "clases",
  "comunidad",
  "busco",
];
const DEDICATED_KEYS: MisAnunciosCategoryKey[] = ["restaurantes", "empleos", "viajes", "comida-local"];

for (const key of SHARED_LISTINGS_KEYS) {
  const plan = resolveMisAnunciosLoadPlan(key);
  assert.equal(plan.requiresSharedListings, true, `"${key}" must require the shared listings source`);
  // "autos" is a legitimate hybrid (shared-table legacy rows AND dedicated paid-dealer rows) —
  // tested on its own below; every other shared-family category must never trigger a dedicated
  // fetch.
  if (key === "autos") continue;
  assert.equal(
    plan.requiresDedicatedFetch,
    false,
    `"${key}" must never trigger a dedicated-category fetch (Restaurantes/Servicios/Empleos/Autos/Viajes/Comida Local)`,
  );
}

for (const key of DEDICATED_KEYS) {
  const plan = resolveMisAnunciosLoadPlan(key);
  assert.equal(plan.requiresDedicatedFetch, true, `"${key}" must require its own dedicated fetch`);
  assert.equal(plan.requiresSharedListings, false, `"${key}" must not require the shared listings source`);
}

// Autos is a hybrid: legacy rows live in the shared `listings` table AND paid dealer rows live in
// the dedicated `autos_classifieds_listings` table — both flags are legitimately true together.
{
  const plan = resolveMisAnunciosLoadPlan("autos");
  assert.equal(plan.requiresSharedListings, true, "autos must still read shared-table legacy rows");
  assert.equal(plan.requiresDedicatedFetch, true, "autos must still read its own dedicated paid-dealer rows");
}

// Servicios: dedicated-source category with NO lightweight count endpoint (RLS/API-route
// constraint) — deliberately excluded from the deferred set; the Gate I.4.2 report documents why.
{
  const plan = resolveMisAnunciosLoadPlan("servicios");
  assert.equal(plan.requiresDedicatedFetch, false, "servicios must not be in the deferred-fetch set");
  assert.equal(plan.requiresSharedListings, false, "servicios must not require the shared listings source");
  assert.ok(!DEFERRED_DEDICATED_CATEGORIES.has("servicios"), "servicios must never appear in DEFERRED_DEDICATED_CATEGORIES");
}

/* ------------------------------------------------------------------------------------------ *
 * Entitlement scoping — only categories with a real entitlement/paid-module module ever request
 * one; no unrelated category triggers a fabricated entitlement input.
 * ------------------------------------------------------------------------------------------ */

const ENTITLEMENT_ELIGIBLE: MisAnunciosCategoryKey[] = [
  "restaurantes",
  "servicios",
  "autos",
  "bienes-raices",
  "rentas",
  "en-venta",
];
const ENTITLEMENT_INELIGIBLE: MisAnunciosCategoryKey[] = ["empleos", "viajes", "comida-local", "clases", "comunidad", "busco"];

for (const key of ENTITLEMENT_ELIGIBLE) {
  assert.equal(resolveMisAnunciosLoadPlan(key).requiresEntitlementLookup, true, `"${key}" must be entitlement-eligible`);
}
for (const key of ENTITLEMENT_INELIGIBLE) {
  assert.equal(
    resolveMisAnunciosLoadPlan(key).requiresEntitlementLookup,
    false,
    `"${key}" must never trigger an entitlement lookup — no such module exists for it`,
  );
}

/* ------------------------------------------------------------------------------------------ *
 * Invalid/default category — unchanged registry behavior, confirmed still correct.
 * ------------------------------------------------------------------------------------------ */

assert.equal(isMisAnunciosCategoryKey("not-a-real-category"), false, "an invalid category string must be rejected");
assert.equal(isMisAnunciosCategoryKey("restaurantes"), true, "a real category key must be accepted");

{
  const emptyCounts = {
    "en-venta": 0,
    autos: 0,
    "bienes-raices": 0,
    rentas: 0,
    restaurantes: 0,
    empleos: 0,
    viajes: 0,
    servicios: 0,
    "comida-local": 0,
    clases: 0,
    comunidad: 0,
    busco: 0,
  } as Record<MisAnunciosCategoryKey, number>;
  assert.equal(
    resolveMisAnunciosDefaultCategory(emptyCounts, null),
    "en-venta",
    "with no listings anywhere, the default category must safely fall back to en-venta",
  );
  assert.equal(
    resolveMisAnunciosDefaultCategory(emptyCounts, "not-a-real-category"),
    "en-venta",
    "an invalid URL cat= param must never crash or select a non-existent category",
  );
  const restaurantOnlyCounts = { ...emptyCounts, restaurantes: 3 };
  assert.equal(
    resolveMisAnunciosDefaultCategory(restaurantOnlyCounts, null),
    "restaurantes",
    "an owner whose only listings are Restaurant rows must still auto-land on the Restaurant tab",
  );
}

/* ------------------------------------------------------------------------------------------ *
 * Lightweight dedicated-category counts — exact tables, exact owner filter, no fabricated values.
 * ------------------------------------------------------------------------------------------ */

type CapturedQuery = { table: string; ownerId: string };

function makeCountingStubSupabase(calls: CapturedQuery[], counts: Record<string, number>): SupabaseClient {
  const stub = {
    from(table: string) {
      return {
        select(_cols: string, _opts: { count: string; head: boolean }) {
          return {
            eq(_col: string, ownerId: string) {
              calls.push({ table, ownerId });
              return Promise.resolve({ count: counts[table] ?? 0, error: null });
            },
          };
        },
      };
    },
  };
  return stub as unknown as SupabaseClient;
}

async function main() {
  const calls: CapturedQuery[] = [];
  const sb = makeCountingStubSupabase(calls, {
    restaurantes_public_listings: 3,
    empleos_public_listings: 0,
    viajes_staged_listings: 5,
    autos_classifieds_listings: 1,
    comida_local_public_listings: 2,
  });

  const result = await fetchDedicatedCategoryCounts(sb, "owner-42");

  assert.equal(calls.length, 5, "exactly 5 tables must be queried — one per dedicated category");
  const tables = calls.map((c) => c.table).sort();
  assert.deepEqual(
    tables,
    [
      "autos_classifieds_listings",
      "comida_local_public_listings",
      "empleos_public_listings",
      "restaurantes_public_listings",
      "viajes_staged_listings",
    ],
    "must query exactly these 5 dedicated tables, no more, no fewer",
  );
  assert.ok(
    calls.every((c) => c.ownerId === "owner-42"),
    "every count query must be scoped to the requesting owner",
  );

  assert.deepEqual(
    result,
    { restaurantes: 3, empleos: 0, viajes: 5, autosPaid: 1, comidaLocal: 2 },
    "counts must exactly reflect the real per-table results — never fabricated",
  );

  // A failed/null count must fail closed to 0, never a fabricated positive number.
  const failingSb = makeCountingStubSupabase([], {});
  const failingResult = await fetchDedicatedCategoryCounts(failingSb, "owner-1");
  assert.deepEqual(
    failingResult,
    { restaurantes: 0, empleos: 0, viajes: 0, autosPaid: 0, comidaLocal: 0 },
    "a missing/undefined count must default to 0, never fabricate a nonzero value",
  );

  console.log(`gate-i4-2-mis-anuncios-category-load-plan-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
