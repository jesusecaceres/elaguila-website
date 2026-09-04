/**
 * Globalization Build C (RED #14) — targeted regression verifier for the new shared
 * active-paid-edit checkout ownership guard (app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts).
 *
 * Run from repo root:
 *   npx tsx scripts/verify-active-paid-edit-checkout-ownership.ts
 *
 * Exercises the REAL exported validators (validateAutosPrivadoActiveEditCheckoutOwnership,
 * validateBrFsboActiveEditCheckoutOwnership, validateEmpleosJobPostActiveEditCheckoutOwnership),
 * not a re-implementation, via the `deps.supabase` test-only injection seam (same pattern as
 * scripts/verify-revenue-active-entitlement-guard.ts). No network call, no live Supabase project.
 *
 * Highest-priority check in this file: an ALREADY-ACTIVE paid row must be rejected
 * (already_active_no_recharge) — this is the double-charge defense the guard exists for.
 */
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  validateAutosPrivadoActiveEditCheckoutOwnership,
  validateBrFsboActiveEditCheckoutOwnership,
  validateEmpleosJobPostActiveEditCheckoutOwnership,
} from "../app/lib/listingLifecycle/activePaidEditCheckoutOwnership";

const NOW = Date.now();
const DAYS = 24 * 60 * 60 * 1000;
const iso = (deltaMs: number) => new Date(NOW + deltaMs).toISOString();

/** Fake Supabase client supporting exactly `.from(table).select(cols).eq(k,v).maybeSingle()`,
 * matching the one query shape the guard issues. */
function fakeSupabaseSingleRow(expectedTable: string, row: Record<string, unknown> | null): Pick<SupabaseClient, "from"> {
  return {
    from(table: string) {
      assert.equal(table, expectedTable, `guard must query ${expectedTable}`);
      const builder = {
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        async maybeSingle() {
          return { data: row, error: null };
        },
      };
      return builder as unknown as ReturnType<SupabaseClient["from"]>;
    },
  } as unknown as Pick<SupabaseClient, "from">;
}

let failures = 0;
let checks = 0;

async function check(label: string, fn: () => Promise<void> | void): Promise<void> {
  checks += 1;
  try {
    await fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main(): Promise<void> {
  console.log("verify-active-paid-edit-checkout-ownership: starting");

  // ── Autos Privado ────────────────────────────────────────────────────────────────────────
  await check("Autos Privado: no bearer -> auth_required", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: null },
      { supabase: fakeSupabaseSingleRow("autos_classifieds_listings", null) },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "auth_required");
  });

  await check("Autos Privado: fresh draft row (never paid) -> ok=true, allowed to checkout", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "privado",
          status: "draft",
          published_at: null,
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Autos Privado: pending_payment row -> ok=true, allowed to checkout", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "privado",
          status: "pending_payment",
          published_at: null,
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Autos Privado: ALREADY ACTIVE within 30d -> ok=false, already_active_no_recharge (no double charge)", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "privado",
          status: "active",
          published_at: iso(-5 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "already_active_no_recharge");
    assert.equal((result as { status: number }).status, 409);
  });

  await check("Autos Privado: active but published 40 days ago (past 30d duration) -> expired -> ok=true", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "privado",
          status: "active",
          published_at: iso(-40 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Autos Privado: owner mismatch -> listing_owner_mismatch", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-2" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "privado",
          status: "active",
          published_at: iso(-5 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "listing_owner_mismatch");
  });

  await check("Autos Privado: dealer row (wrong lane) -> wrong_lane", async () => {
    const result = await validateAutosPrivadoActiveEditCheckoutOwnership(
      { listingId: "listing-1", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("autos_classifieds_listings", {
          id: "listing-1",
          owner_user_id: "user-1",
          lane: "negocios",
          status: "active",
          published_at: iso(-5 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "wrong_lane");
  });

  // ── Bienes Raíces FSBO ───────────────────────────────────────────────────────────────────
  await check("Bienes FSBO: fresh pending row -> ok=true, allowed to checkout", async () => {
    const result = await validateBrFsboActiveEditCheckoutOwnership(
      { listingId: "listing-2", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("listings", {
          id: "listing-2",
          owner_id: "user-1",
          category: "bienes-raices",
          seller_type: "personal",
          status: "pending",
          expires_at: null,
          listing_json: { br_publish: { lane: "privado" } },
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Bienes FSBO: ALREADY ACTIVE with real expires_at in the future -> already_active_no_recharge", async () => {
    const result = await validateBrFsboActiveEditCheckoutOwnership(
      { listingId: "listing-2", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("listings", {
          id: "listing-2",
          owner_id: "user-1",
          category: "bienes-raices",
          seller_type: "personal",
          status: "active",
          expires_at: iso(30 * DAYS),
          listing_json: { br_publish: { lane: "privado" } },
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "already_active_no_recharge");
  });

  await check("Bienes FSBO: active but expires_at in the past -> expired -> ok=true (genuine repurchase)", async () => {
    const result = await validateBrFsboActiveEditCheckoutOwnership(
      { listingId: "listing-2", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("listings", {
          id: "listing-2",
          owner_id: "user-1",
          category: "bienes-raices",
          seller_type: "personal",
          status: "active",
          expires_at: iso(-1 * DAYS),
          listing_json: { br_publish: { lane: "privado" } },
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Bienes FSBO: Negocio/agent row (seller_type business) -> wrong_lane", async () => {
    const result = await validateBrFsboActiveEditCheckoutOwnership(
      { listingId: "listing-2", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("listings", {
          id: "listing-2",
          owner_id: "user-1",
          category: "bienes-raices",
          seller_type: "business",
          status: "active",
          expires_at: iso(30 * DAYS),
          listing_json: { br_publish: { lane: "negocio" } },
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "wrong_lane");
  });

  // ── Empleos job post ─────────────────────────────────────────────────────────────────────
  await check("Empleos: fresh draft row -> ok=true, allowed to checkout", async () => {
    const result = await validateEmpleosJobPostActiveEditCheckoutOwnership(
      { listingId: "listing-3", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("empleos_public_listings", {
          id: "listing-3",
          owner_user_id: "user-1",
          lifecycle_status: "draft",
          published_at: null,
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Empleos: ALREADY PUBLISHED within 30d -> already_active_no_recharge", async () => {
    const result = await validateEmpleosJobPostActiveEditCheckoutOwnership(
      { listingId: "listing-3", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("empleos_public_listings", {
          id: "listing-3",
          owner_user_id: "user-1",
          lifecycle_status: "published",
          published_at: iso(-2 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "already_active_no_recharge");
  });

  await check("Empleos: pending_review within 30d -> already_active_no_recharge (pending_review counts as active)", async () => {
    const result = await validateEmpleosJobPostActiveEditCheckoutOwnership(
      { listingId: "listing-3", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("empleos_public_listings", {
          id: "listing-3",
          owner_user_id: "user-1",
          lifecycle_status: "pending_review",
          published_at: iso(-2 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "already_active_no_recharge");
  });

  await check("Empleos: published 35 days ago (past 30d duration) -> expired -> ok=true", async () => {
    const result = await validateEmpleosJobPostActiveEditCheckoutOwnership(
      { listingId: "listing-3", bearerUserId: "user-1" },
      {
        supabase: fakeSupabaseSingleRow("empleos_public_listings", {
          id: "listing-3",
          owner_user_id: "user-1",
          lifecycle_status: "published",
          published_at: iso(-35 * DAYS),
        }),
      },
    );
    assert.equal(result.ok, true);
  });

  await check("Empleos: not_found row -> listing_not_found", async () => {
    const result = await validateEmpleosJobPostActiveEditCheckoutOwnership(
      { listingId: "missing-listing", bearerUserId: "user-1" },
      { supabase: fakeSupabaseSingleRow("empleos_public_listings", null) },
    );
    assert.equal(result.ok, false);
    assert.equal((result as { code: string }).code, "listing_not_found");
  });

  console.log(`\nverify-active-paid-edit-checkout-ownership: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("verify-active-paid-edit-checkout-ownership: unexpected failure", err);
  process.exitCode = 1;
});
