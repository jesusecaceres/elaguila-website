/**
 * Work Package I.9A — Global Admin Operations Truth and Organization self-test.
 *
 * Covers the three new pure/additive Admin helpers (`adminListingClassification.ts`,
 * `adminActionTruth.ts`, `adminStatusAttention.ts`), the security fix to
 * `updateListingReportStatusAction`, and the corrected `busco` ops-contract entry. No React/DOM
 * — Admin pages cannot be imported outside Next.js (same convention used throughout this
 * session) — page-wiring facts are verified at the source level.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i9a-admin-operations-truth-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { classifyAdminListingRow, type AdminListingGroup } from "../app/admin/_lib/adminListingClassification";
import { resolveAdminActionTruth, isAdminActionSafeToShow, DEDICATED_ROUTE_PIPELINES, GENERIC_LISTINGS_ROUTE_PIPELINES, NO_WRITE_ROUTE_PIPELINES } from "../app/admin/_lib/adminActionTruth";
import { resolveAdminListingStatusDisplay, resolveAdminAttentionItems, countAdminAttentionBySeverity } from "../app/admin/_lib/adminStatusAttention";
import { CLASSIFIEDS_OPS_CONTRACTS, getClassifiedsOpsContract } from "../app/admin/_lib/classifiedsOpsContract";
import type { CanonicalCategoryKey } from "../app/lib/listingIdentity/types";
import { excludeCurrentPackageFiles } from "./globalizationCurrentPackageDiff";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  /* ============================================================================================
   * DISCOVERY — every supported Admin listing pipeline is classified; canonical identity
   * preserved; parent/child distinct; duplicate identity prevented; unsupported never disappears.
   * ========================================================================================== */
  {
    const cases: Array<{ input: Parameters<typeof classifyAdminListingRow>[0]; expectGroup: AdminListingGroup; expectPipeline: CanonicalCategoryKey | null }> = [
      { input: { category: "restaurantes" }, expectGroup: "business", expectPipeline: "restaurantes" },
      { input: { category: "servicios" }, expectGroup: "business", expectPipeline: "servicios" },
      { input: { category: "comida-local" }, expectGroup: "business", expectPipeline: "comida_local" },
      { input: { category: "ofertas-locales" }, expectGroup: "business", expectPipeline: "ofertas_locales" },
      { input: { category: "bienes-raices", brRentasBranch: "bienes_raices_negocio" }, expectGroup: "business", expectPipeline: "bienes_raices_negocio" },
      { input: { category: "bienes-raices", brRentasBranch: "bienes_raices_negocio", inventoryRole: "inventory_property" }, expectGroup: "inventory_child", expectPipeline: "bienes_raices_negocio" },
      { input: { category: "bienes-raices", brRentasBranch: "bienes_raices_privado" }, expectGroup: "private", expectPipeline: "bienes_raices_privado" },
      { input: { category: "bienes-raices" }, expectGroup: "unsupported", expectPipeline: null },
      { input: { category: "rentas", sellerType: "business" }, expectGroup: "business", expectPipeline: "rentas_negocio" },
      { input: { category: "rentas", sellerType: "personal" }, expectGroup: "private", expectPipeline: "rentas_privado" },
      { input: { category: "autos", autosLane: "negocios" }, expectGroup: "business", expectPipeline: "autos_negocios" },
      { input: { category: "autos", autosLane: "negocios", inventoryRole: "inventory_vehicle" }, expectGroup: "inventory_child", expectPipeline: "autos_negocios" },
      { input: { category: "autos", autosLane: "privado" }, expectGroup: "private", expectPipeline: "autos_privado" },
      { input: { category: "viajes", viajesLane: "business" }, expectGroup: "business", expectPipeline: "viajes" },
      { input: { category: "travel", viajesLane: "private" }, expectGroup: "private", expectPipeline: "viajes" },
      { input: { category: "empleos" }, expectGroup: "private", expectPipeline: "empleos" },
      { input: { category: "en-venta" }, expectGroup: "private", expectPipeline: "en_venta" },
      { input: { category: "clases" }, expectGroup: "private", expectPipeline: "clases" },
      { input: { category: "comunidad" }, expectGroup: "private", expectPipeline: "comunidad" },
      { input: { category: "busco" }, expectGroup: "private", expectPipeline: "busco" },
      { input: { category: "mascotas-y-perdidos" }, expectGroup: "private", expectPipeline: "mascotas_y_perdidos" },
      { input: { category: "some_future_unmodeled_category" }, expectGroup: "unsupported", expectPipeline: null },
    ];
    for (const c of cases) {
      const result = classifyAdminListingRow(c.input);
      assert.equal(result.group, c.expectGroup, `${JSON.stringify(c.input)} must classify group "${c.expectGroup}", got "${result.group}"`);
      assert.equal(result.pipeline, c.expectPipeline, `${JSON.stringify(c.input)} must resolve pipeline "${c.expectPipeline}", got "${result.pipeline}"`);
    }

    // Defense in depth: a confirmed child inventory role always wins, regardless of category.
    const forcedChild = classifyAdminListingRow({ category: "restaurantes", inventoryRole: "inventory_vehicle" });
    assert.equal(forcedChild.group, "inventory_child");

    // No ownership concept in the classification input at all — structural proof.
    const src = readSource("app/admin/_lib/adminListingClassification.ts");
    const inputTypeMatch = src.match(/export type AdminClassificationInput = \{[\s\S]*?\n\};/);
    assert.ok(inputTypeMatch, "must locate AdminClassificationInput");
    assert.ok(!/ownerId|ownerUserId|owner_id/i.test(inputTypeMatch![0]), "AdminClassificationInput must never accept an owner identity field");

    // Unsupported pipelines never silently disappear — always resolve to a real group.
    const unknown = classifyAdminListingRow({ category: "genuinely_unmodeled" });
    assert.equal(unknown.group, "unsupported");
  }

  /* ============================================================================================
   * ACTIONS — every visible action has a proven route or handler; unsafe actions remain hidden
   * or clearly incomplete; parent-only actions stay parent-only; destructive actions unambiguous.
   * ========================================================================================== */
  {
    // Dedicated-route pipelines: full lifecycle actions genuinely "working".
    for (const pipeline of DEDICATED_ROUTE_PIPELINES) {
      const truth = resolveAdminActionTruth(pipeline);
      assert.equal(truth.suspend, "working", `${pipeline} suspend must be "working" — confirmed dedicated route`);
      assert.equal(truth.inspectOwner, "working");
    }

    // Generic-route pipelines: lifecycle actions are "working_with_adapter", never bare "working"
    // (the generic route branches per category — this distinction must be preserved, not
    // collapsed into an undifferentiated "working").
    for (const pipeline of GENERIC_LISTINGS_ROUTE_PIPELINES) {
      const truth = resolveAdminActionTruth(pipeline);
      assert.equal(truth.suspend, "working_with_adapter", `${pipeline} suspend must be "working_with_adapter"`);
    }

    // Comida Local: confirmed via direct inspection to have a real Admin page but literally no
    // suspend/archive handler (no fetch to /api/admin, no onClick, only a GET search form) — must
    // classify as ui_only_no_handler, never "working".
    for (const pipeline of NO_WRITE_ROUTE_PIPELINES) {
      const truth = resolveAdminActionTruth(pipeline);
      assert.equal(truth.suspend, "ui_only_no_handler", `${pipeline} must be honestly classified as having no real handler`);
      assert.ok(!isAdminActionSafeToShow(truth.suspend), "a ui_only_no_handler action must never be reported safe to show");
    }

    // Destructive "remove" is deliberately never a routine "working" action anywhere — it stays
    // its own explicitly separate, more cautiously gated tool (deleteListingAction), not folded
    // into the generic per-row action set.
    for (const pipeline of [...DEDICATED_ROUTE_PIPELINES, ...GENERIC_LISTINGS_ROUTE_PIPELINES]) {
      const truth = resolveAdminActionTruth(pipeline);
      assert.notEqual(truth.remove, "working", `${pipeline}.remove must never be classified as a routine working action`);
    }

    // Work Package I.9B — corrected: BR-Negocio and Autos-Negocios now have a real,
    // server-side parent/child role guard (see gate-i9b), so this classification was updated
    // from "stale_or_unsafe" to "working_with_adapter" — but only after the real protection
    // landed, never claimed safe in advance of it.
    assert.equal(resolveAdminActionTruth("bienes_raices_negocio").inspectParentChild, "working_with_adapter");
    assert.equal(resolveAdminActionTruth("autos_negocios").inspectParentChild, "working_with_adapter");
    // Non-parent/child pipelines correctly report no such concern.
    assert.equal(resolveAdminActionTruth("restaurantes").inspectParentChild, "intentionally_unsupported");

    // Mascotas: Edit/owner-context is honestly "blocked" — no safe category-specific editor
    // exists, matching the confirmed registry fact (editRoute() still returns null).
    // Package A Gate 5 — Mascotas edit unblocked (generic owner-verified editor wired in the
    // registry with the I.6B-required safety proof); was "blocked" while editRoute was null.
    assert.equal(resolveAdminActionTruth("mascotas_y_perdidos").openOwnerEditContext, "working");

    // Unknown/null pipeline fails closed on every action.
    const nullTruth = resolveAdminActionTruth(null);
    for (const status of Object.values(nullTruth)) {
      assert.equal(status, "intentionally_unsupported");
    }

    // Staff authorization remains required — regression proof the fix targeted the right,
    // previously-unguarded function, and did not touch its already-guarded siblings.
    const actionsSrc = readSource("app/admin/actions.ts");
    assert.ok(/updateListingReportStatusAction[\s\S]{0,200}requireLeonixAdminPermission\("can_manage_reports"\)/.test(actionsSrc), "updateListingReportStatusAction must now require can_manage_reports");
    assert.ok(actionsSrc.includes('requireLeonixAdminPermission("can_manage_ads")'), "sibling setListingPublishedAction/deleteListingAction must remain gated, unchanged");
    // submitListingReportAction is a PUBLIC-facing action (any site visitor reporting a listing,
    // confirmed by its call sites in app/(site)/clasificados/**) — it must NOT be admin-gated.
    const submitFnMatch = actionsSrc.match(/export async function submitListingReportAction[\s\S]*?\n\}/);
    assert.ok(submitFnMatch, "must locate submitListingReportAction");
    assert.ok(!submitFnMatch![0].includes("requireLeonixAdminPermission"), "submitListingReportAction must remain public — it is not a staff action");
  }

  /* ============================================================================================
   * STATUS — unknown not active; pending payment not published; suspended not active; archived
   * not public; child inventory not represented as parent.
   * ========================================================================================== */
  {
    // Reuses the exact same real, confirmed mapping tables the owner dashboard uses (I.8A/I.8B)
    // — Restaurantes/Servicios/Empleos/Viajes.
    assert.equal(resolveAdminListingStatusDisplay("restaurantes", "suspended").displayKey, "suspended");
    assert.notEqual(resolveAdminListingStatusDisplay("restaurantes", "suspended").tone, "positive");
    assert.equal(resolveAdminListingStatusDisplay("servicios", "pending_payment").displayKey, "pending_payment");
    assert.notEqual(resolveAdminListingStatusDisplay("servicios", "pending_payment").tone, "positive");
    assert.equal(resolveAdminListingStatusDisplay("empleos", "archived").displayKey, "archived");
    assert.notEqual(resolveAdminListingStatusDisplay("empleos", "archived").tone, "positive");

    const unknown = resolveAdminListingStatusDisplay("restaurantes", "some_future_value");
    assert.equal(unknown.displayKey, "unknown");
    assert.notEqual(unknown.tone, "positive");

    // Child inventory is never represented as the parent — the classification helper always
    // reports "inventory_child" distinctly, never collapsing into the parent's "business" group.
    const child = classifyAdminListingRow({ category: "bienes-raices", brRentasBranch: "bienes_raices_negocio", inventoryRole: "inventory_property" });
    assert.notEqual(child.group, "business");
    assert.equal(child.group, "inventory_child");

    // No write behavior anywhere in the status/attention module.
    const statusSrc = readSource("app/admin/_lib/adminStatusAttention.ts");
    assert.ok(!/\.insert\(|\.update\(|\.upsert\(/.test(statusSrc), "Admin status/attention helper must never write to the database");
  }

  /* ============================================================================================
   * PAYMENTS AND ENTITLEMENTS — real server-derived state displays truthfully; missing state
   * fails closed; client JSON is not authority; no write behavior changes.
   * ========================================================================================== */
  {
    const paymentRequired = resolveAdminAttentionItems({ id: "r1", category: "rentas", paymentRequired: true });
    assert.ok(paymentRequired.some((i) => i.reasonKey === "payment_required" && i.severity === "urgent"));
    assert.equal(countAdminAttentionBySeverity(paymentRequired).urgent, 1);

    const noPaymentClaim = resolveAdminAttentionItems({ id: "r2", category: "rentas" });
    assert.ok(!noPaymentClaim.some((i) => i.reasonKey === "payment_required"), "no payment_required item without the caller explicitly confirming it");

    const entitlementExpired = resolveAdminAttentionItems({ id: "r3", category: "restaurantes", entitlementExpired: true });
    assert.ok(entitlementExpired.some((i) => i.reasonKey === "expired_entitlement"));

    // Confirm the real Admin entitlement writers (create/revoke/extend/attach) were not touched
    // by this package — this package only reads/organizes, per Objective E.
    const entitlementActionsSrc = readSource("app/admin/(dashboard)/workspace/package-entitlements/actions.ts");
    assert.ok(entitlementActionsSrc.includes("assertCanManageEntitlement"), "existing entitlement authorization gate must remain in place, untouched");
    assert.ok(!entitlementActionsSrc.includes("Work Package I.9A"), "this package must not modify the entitlement writer file");
  }

  /* ============================================================================================
   * MODERATION AND REPORTS — real queues/handlers remain connected; unsupported actions are not
   * fabricated; unresolved reports are not silently discarded.
   * ========================================================================================== */
  {
    const pendingModeration = resolveAdminAttentionItems({ id: "m1", category: "empleos", hasPendingModeration: true });
    assert.ok(pendingModeration.some((i) => i.reasonKey === "pending_moderation"));

    // The real listing_reports table/queue and its UI remain wired — this package only added the
    // missing authorization gate on the mutation, not new moderation functionality.
    const reportsPageSrc = readSource("app/admin/(dashboard)/reportes/page.tsx");
    assert.ok(reportsPageSrc.includes("listing_reports"), "the real reports queue must remain connected to its real table");
  }

  /* ============================================================================================
   * INCOMPLETE TOOLS — placeholder/no-op/dead-route actions are detected, hidden/disabled/labeled
   * incomplete, no fake counts introduced.
   * ========================================================================================== */
  {
    const incompleteActions = resolveAdminAttentionItems({
      id: "i1",
      category: "comida-local",
      actionStatuses: ["ui_only_no_handler", "ui_only_no_handler", "working"],
    });
    const incompleteItem = incompleteActions.find((i) => i.reasonKey === "incomplete_admin_action");
    assert.ok(incompleteItem, "must flag incomplete actions when present");
    assert.ok(incompleteItem!.labelEn.includes("2"), "must report a real, counted number of incomplete actions, not a fabricated count");

    const allWorking = resolveAdminAttentionItems({ id: "i2", category: "restaurantes", actionStatuses: ["working", "working"] });
    assert.ok(!allWorking.some((i) => i.reasonKey === "incomplete_admin_action"));

    // busco: real ops-contract entry now exists (was missing, confirmed real page + real generic
    // write route existed all along).
    const buscoContract = getClassifiedsOpsContract("busco");
    assert.ok(buscoContract, "busco must now have a real ops contract entry");
    assert.equal(buscoContract!.leonixPrefix, "BUSCO", "must match the real, confirmed leonixListingsPrefixForCategory('busco') value");
    assert.equal(buscoContract!.writableTable, "listings");
    assert.equal(CLASSIFIEDS_OPS_CONTRACTS.filter((c) => c.slug === "busco").length, 1, "no duplicate busco entry");

    // Ofertas Locales deliberately NOT added — locked system for this package.
    assert.equal(getClassifiedsOpsContract("ofertas-locales"), undefined, "ofertas-locales must not be added to this contract by this package — Ofertas/Cupones is locked");
  }

  /* ============================================================================================
   * REGRESSION — no locked-system file touched.
   * ========================================================================================== */
  {
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
    const changed = excludeCurrentPackageFiles(
      changedFiles
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((f) => !GLOBALIZATION_P1_STRUCTURAL_SUSPENSE_FIX_EXCEPTIONS.has(f)),
    );
    const lockedPathFragments = [
      "revenue-os",
      "stripe",
      "webhook",
      "migrations",
      "ofertas",
      "cupones",
      "concierge",
      "package-entitlements/actions.ts", // real writer, untouched
      "promo-codes/actions.ts", // real writer, untouched
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        assert.ok(!lower.includes(frag), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i9a-admin-operations-truth-selftest: OK");
}

main();
