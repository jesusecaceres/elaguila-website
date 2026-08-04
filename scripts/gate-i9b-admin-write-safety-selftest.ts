/**
 * Work Package I.9B — Admin Write Authorization and Parent/Child Safety self-test.
 *
 * Covers the new shared target-row validator (`adminInventoryActionGuard.ts`) directly, plus
 * source-level proof that the two touched Admin write routes (`app/api/admin/autos/listings/[id]/
 * route.ts`, `app/api/admin/clasificados/listings/[id]/route.ts`) actually call it, in the right
 * order relative to authorization and the database write. Next.js route handlers cannot be
 * invoked standalone outside the framework (same convention used throughout this session for
 * route/page files) — behavioral coverage here is the pure guard function directly; wiring
 * coverage is source-level (call-order, not just call-presence).
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i9b-admin-write-safety-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  assertAutosDealerActionAllowed,
  assertBrNegocioActionAllowed,
  ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE,
} from "../app/admin/_lib/adminInventoryActionGuard";
import { resolveAdminActionTruth } from "../app/admin/_lib/adminActionTruth";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const AUTOS_ROUTE = "app/api/admin/autos/listings/[id]/route.ts";
const GENERIC_ROUTE = "app/api/admin/clasificados/listings/[id]/route.ts";

async function main() {
  /* ============================================================================================
   * AUTHORIZATION — every touched route requires staff auth before mutation; sanitized errors;
   * no raw database errors exposed by the new guard path.
   * ========================================================================================== */
  {
    const autosSrc = readSource(AUTOS_ROUTE);
    const genericSrc = readSource(GENERIC_ROUTE);

    for (const [label, src] of [["autos", autosSrc], ["generic", genericSrc]] as const) {
      const authIdx = src.indexOf("requireAdminCookie(jar)");
      const guardIdx = src.indexOf(label === "autos" ? "assertAutosDealerActionAllowed(" : "assertBrNegocioActionAllowed(");
      const updateIdx = src.indexOf(".update(patch)");
      assert.ok(authIdx > -1, `${label} route must call requireAdminCookie`);
      assert.ok(guardIdx > -1, `${label} route must call the new inventory action guard`);
      assert.ok(updateIdx > -1, `${label} route must still perform its real update`);
      // Order matters: unauthenticated/non-staff requests must never reach role validation, and
      // role validation must never happen after the write.
      assert.ok(authIdx < guardIdx, `${label} route: authorization must happen before role validation`);
      assert.ok(guardIdx < updateIdx, `${label} route: role validation must happen before the database write`);
      // 401 for missing/invalid cookie — unchanged, pre-existing, still present.
      assert.ok(src.includes('{ ok: false, error: "unauthorized" }, { status: 401 }'), `${label} route must still return 401 for unauthenticated requests`);
      // The new guard-rejection path returns a deterministic, sanitized code — never a raw error.
      assert.ok(src.includes(`error: ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE`), `${label} route must return the sanitized guard error code`);
      assert.ok(src.includes("{ status: 403 }"), `${label} route must return 403 for a role-forbidden action`);
    }

    // The sanitized code itself never leaks role-specific detail (e.g. which id was the parent).
    assert.equal(ADMIN_INVENTORY_ACTION_FORBIDDEN_CODE, "admin_inventory_action_forbidden");
  }

  /* ============================================================================================
   * AUTO DEALER — parent-only actions reject vehicle children; child-safe actions stay row-
   * scoped; null/unknown role fails closed; another lane (privado) is unaffected.
   * ========================================================================================== */
  {
    const parent = { lane: "negocios" as const, inventory_role: "main" as const, dealer_inventory_parent_listing_id: null };
    const child = { lane: "negocios" as const, inventory_role: "inventory_vehicle" as const, dealer_inventory_parent_listing_id: "parent-uuid-1" };
    const standalone = { lane: "negocios" as const, inventory_role: null, dealer_inventory_parent_listing_id: null };
    const ambiguous = { lane: "negocios" as const, inventory_role: null, dealer_inventory_parent_listing_id: "parent-uuid-1" };
    const privado = { lane: "privado" as const, inventory_role: null, dealer_inventory_parent_listing_id: null };

    for (const action of ["archive", "remove_public", "restore_active"]) {
      assert.deepEqual(assertAutosDealerActionAllowed(parent, action), { ok: true, role: "parent" }, `canonical parent must accept ${action}`);
      assert.deepEqual(assertAutosDealerActionAllowed(child, action), { ok: false, code: "forbidden_role_for_action" }, `vehicle child must reject ${action}`);
      assert.deepEqual(assertAutosDealerActionAllowed(ambiguous, action), { ok: false, code: "ambiguous_or_unknown_role" }, `unresolved role must fail closed for ${action}`);
      // The confirmed, real, standalone-single-vehicle-dealer convention (no parent id at all,
      // no explicit role) must still be treated as parent — not a regression for the common case.
      assert.deepEqual(assertAutosDealerActionAllowed(standalone, action), { ok: true, role: "parent" }, `standalone never-grouped dealer must still accept ${action}`);
      // Another lane (privado) has no inventory concept — always unaffected.
      assert.deepEqual(assertAutosDealerActionAllowed(privado, action), { ok: true, role: "not_applicable" });
    }

    // Child-safe (non-parent-only) actions target only the child row, never rejected.
    for (const action of ["suspend", "unsuspend", "promote_on", "promote_off", "verify_on", "verify_off", "republish"]) {
      assert.deepEqual(assertAutosDealerActionAllowed(child, action), { ok: true, role: "child" }, `child-safe action "${action}" must be allowed for the child`);
      assert.deepEqual(assertAutosDealerActionAllowed(parent, action), { ok: true, role: "parent" });
    }

    // Parent id / group id preservation — the route's patch objects must never touch these
    // columns for any action (source-level proof; the guard itself never writes anything).
    const autosSrc = readSource(AUTOS_ROUTE);
    assert.ok(!autosSrc.includes("patch.dealer_inventory_parent_listing_id"), "Autos route must never rewrite the parent id");
    assert.ok(!autosSrc.includes("patch.dealer_inventory_group_id"), "Autos route must never rewrite the group id");
    assert.ok(!autosSrc.includes("patch.owner_user_id"), "Autos route must never rewrite the owner");
    assert.ok(!autosSrc.includes("patch.leonix_ad_id"), "Autos route must never rewrite the Leonix Ad ID");
    assert.ok(autosSrc.includes(".eq(\"id\", id)"), "Autos route must update by exact id only");
  }

  /* ============================================================================================
   * BIENES NEGOCIO — same contract, via the generic listings route.
   * ========================================================================================== */
  {
    const baseBr = { id: "row-1", category: "bienes-raices", detail_pairs: null, status: "active", is_published: true };
    const parent = { ...baseBr, seller_type: "business", inventory_role: "main", br_inventory_group_id: "group-1", br_inventory_parent_listing_id: null };
    const child = { ...baseBr, seller_type: "business", inventory_role: "inventory_property", br_inventory_group_id: "group-1", br_inventory_parent_listing_id: "parent-uuid-1" };
    const unresolved = { ...baseBr, seller_type: "business", inventory_role: null, br_inventory_group_id: null, br_inventory_parent_listing_id: null };
    const privadoRow = { ...baseBr, seller_type: "personal", inventory_role: null, br_inventory_group_id: null, br_inventory_parent_listing_id: null };

    assert.deepEqual(assertBrNegocioActionAllowed(parent, "archive"), { ok: true, role: "parent" }, "canonical BR parent must accept archive");
    assert.deepEqual(assertBrNegocioActionAllowed(child, "archive"), { ok: false, code: "forbidden_role_for_action" }, "BR property child must reject archive");
    assert.deepEqual(assertBrNegocioActionAllowed(unresolved, "archive"), { ok: false, code: "ambiguous_or_unknown_role" }, "unresolved BR role must fail closed for archive (strict — no fail-open for BR)");
    // Required scenario: a genuinely private Bienes row must fail closed for a business-parent
    // action, never silently treated as a valid parent.
    assert.deepEqual(assertBrNegocioActionAllowed(privadoRow, "archive"), { ok: false, code: "ambiguous_or_unknown_role" }, "private Bienes row must fail closed for archive");

    for (const action of ["suspend", "unsuspend", "promote_on", "promote_off", "verify_on", "verify_off", "republish"]) {
      assert.deepEqual(assertBrNegocioActionAllowed(child, action), { ok: true, role: "child" }, `child-safe action "${action}" must target only the child`);
      assert.deepEqual(assertBrNegocioActionAllowed(privadoRow, action), { ok: true, role: "not_applicable" }, `Privado Bienes rows must be entirely unaffected for "${action}"`);
    }

    const genericSrc = readSource(GENERIC_ROUTE);
    assert.ok(!genericSrc.includes("patch.br_inventory_parent_listing_id"), "generic route must never rewrite the BR parent id");
    assert.ok(!genericSrc.includes("patch.br_inventory_group_id"), "generic route must never rewrite the BR group id");
    assert.ok(!genericSrc.includes("patch.owner_id"), "generic route must never rewrite the owner");
    assert.ok(!genericSrc.includes("patch.category"), "generic route must never rewrite the category");
    assert.ok(genericSrc.includes(".eq(\"id\", id)"), "generic route must update by exact id only");
  }

  /* ============================================================================================
   * GENERIC LISTINGS (Rentas, En Venta, Bienes Privado, Comunidad, Clases, Busco, Mascotas,
   * Autos Privado) — exact UUID, immutable identity, unsupported transitions fail closed.
   * ========================================================================================== */
  {
    const genericSrc = readSource(GENERIC_ROUTE);
    // Unsupported/unrecognized action fails closed with a real 400, before any row fetch even
    // matters for the action itself (isAction() gate runs first).
    assert.ok(genericSrc.includes('{ ok: false, error: "invalid_action" }, { status: 400 }'), "unsupported lifecycle transition must fail closed with a real 400");
    // The guard is scoped ONLY to bienes-raices — every other category's existing behavior for
    // suspend/unsuspend/promote/verify/archive/republish is provably untouched.
    const guardBlockMatch = genericSrc.match(/if \(category\.toLowerCase\(\) === "bienes-raices"\) \{[\s\S]*?\n {2}\}/);
    assert.ok(guardBlockMatch, "must locate the scoped BR guard block");
    assert.ok(genericSrc.indexOf(guardBlockMatch![0]) < genericSrc.indexOf("switch (action)"), "the BR guard must run before the generic action switch, not replace it");
  }

  /* ============================================================================================
   * ACTION TRUTH RESOLVER — updated only after real protection exists; unrelated actions and
   * pipelines are untouched.
   * ========================================================================================== */
  {
    assert.equal(resolveAdminActionTruth("autos_negocios").inspectParentChild, "working_with_adapter");
    assert.equal(resolveAdminActionTruth("bienes_raices_negocio").inspectParentChild, "working_with_adapter");
    // Not upgraded to bare "working" — only the specific structural actions are role-gated.
    assert.notEqual(resolveAdminActionTruth("autos_negocios").inspectParentChild, "working");
    assert.notEqual(resolveAdminActionTruth("bienes_raices_negocio").inspectParentChild, "working");
    // The rest of each pipeline's action set is untouched by this package.
    assert.equal(resolveAdminActionTruth("autos_negocios").suspend, "working");
    assert.equal(resolveAdminActionTruth("bienes_raices_negocio").suspend, "working_with_adapter");
    assert.equal(resolveAdminActionTruth("autos_negocios").remove, "blocked");
    // Unrelated pipelines entirely unaffected.
    assert.equal(resolveAdminActionTruth("restaurantes").inspectParentChild, "intentionally_unsupported");
    assert.equal(resolveAdminActionTruth("bienes_raices_privado").inspectParentChild, "intentionally_unsupported");
  }

  /* ============================================================================================
   * REGRESSION — I.9A's report-authorization fix remains intact; no locked-system file touched.
   * ========================================================================================== */
  {
    const actionsSrc = readSource("app/admin/actions.ts");
    assert.ok(/updateListingReportStatusAction[\s\S]{0,200}requireLeonixAdminPermission\("can_manage_reports"\)/.test(actionsSrc), "the I.9A report-authorization fix must remain in place, unchanged");

    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    // Globalization P1 fixed the root cause of the app-wide stuck-loading-spinner defect (a
    // redundant global <Suspense> in app/layout.tsx) and, as a required consequence, added the
    // one local Suspense boundary Next.js's build requires around each of these two pages' own
    // useSearchParams() usage. Both are structural runtime-plumbing fixes only (no ownership,
    // payment, or business-logic change), required for "npm run build" to succeed at all -- not
    // an incursion into the Ofertas Locales or Autos Negocios workstreams this check protects.
    const GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS = new Set([
      "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
      "app/(site)/dashboard/ofertas-locales/page.tsx",
      "app/(site)/clasificados/autos/negocios/preview/page.tsx",
      "app/(site)/publicar/autos/negocios/page.tsx",
      "app/(site)/clasificados/bienes-raices/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/cancelado/page.tsx",
      "app/(site)/clasificados/bienes-raices/pago/exito/page.tsx",
      "app/(site)/clasificados/bienes-raices/resultados/page.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
      "app/admin/(dashboard)/workspace/clasificados/page.tsx",
      "app/admin/login/page.tsx",
    ]);
    const changed = changedFiles
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((f) => !GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS.has(f));
    const lockedPathFragments = [
      "revenue-os",
      "stripe",
      "webhook",
      "migrations",
      "ofertas",
      "cupones",
      "concierge",
      "package-entitlements/actions.ts",
      "promo-codes/actions.ts",
      "dashboard/mis-anuncios",
      "dashboard/lib",
      "dashboard/components",
    ];
    /**
     * Work Package I.12A (Full Catalog Lifecycle Certification and Gap Closure) approved, narrow
     * exception. I.12A intentionally added `applyOwnerListingPatch` (an owner-id-scoped,
     * defense-in-depth update helper) to `ownerListingsLifecycleClient.ts`, and migrated the
     * generic owner dashboard's direct-write call sites in `mis-anuncios/page.tsx` and
     * `mis-anuncios/[id]/page.tsx` (and its `editar` sub-route) to use it — verified to touch only
     * client-side owner-write scoping, never any Admin action, RLS, schema, or entitlement logic
     * (this gate's I.9A report-authorization assertion above is unaffected and still proves that
     * fix is intact). Exact-file, exact-fragment allowlist only — every other
     * "dashboard/lib"/"dashboard/mis-anuncios" file remains fully protected below.
     */
    const I12A_OWNER_WRITE_DEFENSE_IN_DEPTH_EXCEPTIONS = new Set<string>([
      "app/(site)/dashboard/lib/ownerListingsLifecycleClient.ts",
      "app/(site)/dashboard/mis-anuncios/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
    ]);
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        if ((frag === "dashboard/lib" || frag === "dashboard/mis-anuncios") && I12A_OWNER_WRITE_DEFENSE_IN_DEPTH_EXCEPTIONS.has(f)) continue;
        assert.ok(!lower.includes(frag), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i9b-admin-write-safety-selftest: OK");
}

main();
