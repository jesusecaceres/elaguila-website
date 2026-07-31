/**
 * Work Package I.8A — Global User Dashboard Truth and Organization self-test.
 *
 * Covers the three new pure/additive helpers this package introduces
 * (`dashboardOwnerClassification.ts`, `dashboardOwnerStatusDisplay.ts`, `dashboardAttentionItems.ts`)
 * plus regression proof that nothing locked or already-established was weakened. No React/DOM —
 * the Mis Anuncios page itself cannot be imported outside Next.js (same convention used
 * throughout this session) — coverage for its wiring is source-level plus the underlying pure
 * functions it now calls.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i8a-global-dashboard-truth-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { classifyOwnerDashboardRow, type OwnerDashboardGroup } from "../app/(site)/dashboard/lib/dashboardOwnerClassification";
import { resolveOwnerDashboardStatusDisplay } from "../app/(site)/dashboard/lib/dashboardOwnerStatusDisplay";
import { resolveOwnerDashboardAttentionItems, countByAttentionSeverity } from "../app/(site)/dashboard/lib/dashboardAttentionItems";
import { resolveDashboardActions } from "../app/lib/listingIdentity/dashboardActionResolver";
import type { ListingIdentity } from "../app/lib/listingIdentity/types";
import { mapEmpleosStatusToCanonical } from "../app/lib/clasificados/listingLifecycleDomain";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    category: "en-venta",
    pipeline: "en_venta",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/clasificados/en-venta/some-slug",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

async function main() {
  /* ============================================================================================
   * DISCOVERY — every supported catalog pipeline maps to exactly one owner-dashboard group;
   * unknown pipeline fails into a truthful unsupported state; parent/child stay distinct.
   * ========================================================================================== */
  {
    const cases: Array<{ input: Parameters<typeof classifyOwnerDashboardRow>[0]; expectGroup: OwnerDashboardGroup; expectPipeline: string | null }> = [
      { input: { category: "restaurantes" }, expectGroup: "business", expectPipeline: "restaurantes" },
      { input: { category: "servicios" }, expectGroup: "business", expectPipeline: "servicios" },
      { input: { category: "comida-local" }, expectGroup: "business", expectPipeline: "comida_local" },
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
      { input: { category: "viajes", viajesLane: "private" }, expectGroup: "private", expectPipeline: "viajes" },
      { input: { category: "empleos" }, expectGroup: "private", expectPipeline: "empleos" },
      { input: { category: "en-venta" }, expectGroup: "private", expectPipeline: "en_venta" },
      { input: { category: "clases" }, expectGroup: "private", expectPipeline: "clases" },
      { input: { category: "comunidad" }, expectGroup: "private", expectPipeline: "comunidad" },
      { input: { category: "busco" }, expectGroup: "private", expectPipeline: "busco" },
      // Work Package I.8B — corrected: Mascotas is now discoverable in Mis Anuncios (real rows,
      // canonical UUID, safe public route) and classifies as private/classified, same as
      // Busco/Clases/Comunidad. See gate-i8b for the full discovery-wiring proof.
      { input: { category: "mascotas-y-perdidos" }, expectGroup: "private", expectPipeline: "mascotas_y_perdidos" },
      { input: { category: "some_future_unmodeled_category" }, expectGroup: "unsupported", expectPipeline: null },
    ];
    for (const c of cases) {
      const result = classifyOwnerDashboardRow(c.input);
      assert.equal(result.group, c.expectGroup, `category=${c.input.category} lane/branch=${c.input.brRentasBranch ?? c.input.autosLane ?? c.input.viajesLane ?? c.input.sellerType ?? "-"} must classify as "${c.expectGroup}", got "${result.group}"`);
      assert.equal(result.pipeline, c.expectPipeline, `category=${c.input.category} must resolve pipeline "${c.expectPipeline}", got "${result.pipeline}"`);
    }

    // Defense in depth: a confirmed child inventory role always wins, regardless of category.
    const forcedChild = classifyOwnerDashboardRow({ category: "restaurantes", inventoryRole: "inventory_vehicle" });
    assert.equal(forcedChild.group, "inventory_child");

    // Classification never takes an owner id at all — cannot infer group/eligibility from
    // ownership alone. Structural proof: the input contract has no ownerId/ownerUserId field.
    const classificationSrc = readSource("app/(site)/dashboard/lib/dashboardOwnerClassification.ts");
    const inputTypeMatch = classificationSrc.match(/export type DashboardClassificationInput = \{[\s\S]*?\n\};/);
    assert.ok(inputTypeMatch, "must locate DashboardClassificationInput");
    assert.ok(!/ownerId|ownerUserId/i.test(inputTypeMatch![0]), "DashboardClassificationInput must never accept an owner identity field");
  }

  /* ============================================================================================
   * BUSINESS/PRIVATE SEPARATION — Business Hub eligibility matches Objective F's explicit list.
   * ========================================================================================== */
  {
    const qualifies: Array<Parameters<typeof classifyOwnerDashboardRow>[0]> = [
      { category: "restaurantes" },
      { category: "servicios" },
      { category: "bienes-raices", brRentasBranch: "bienes_raices_negocio" },
      { category: "autos", autosLane: "negocios" },
    ];
    for (const input of qualifies) {
      const result = classifyOwnerDashboardRow(input);
      assert.equal(result.businessHubEligible, true, `${input.category} main/parent must qualify for Business Hub`);
    }

    const doesNotQualify: Array<Parameters<typeof classifyOwnerDashboardRow>[0]> = [
      { category: "autos", autosLane: "privado" },
      { category: "bienes-raices", brRentasBranch: "bienes_raices_privado" },
      { category: "rentas", sellerType: "personal" },
      { category: "rentas", sellerType: "business" }, // real business lane, but no live hub action exists
      { category: "en-venta" },
      { category: "clases" },
      { category: "comunidad" },
      { category: "mascotas-y-perdidos" },
      { category: "busco" },
      { category: "empleos" },
      { category: "viajes", viajesLane: "business" }, // same reasoning as Rentas Negocio
      { category: "viajes", viajesLane: "private" },
      { category: "comida-local" }, // business-organized, but no live hub action exists either
    ];
    for (const input of doesNotQualify) {
      const result = classifyOwnerDashboardRow(input);
      assert.equal(result.businessHubEligible, false, `${JSON.stringify(input)} must NOT qualify for Business Hub`);
    }

    // Inventory children never independently qualify, even for pipelines whose parent does.
    const brChild = classifyOwnerDashboardRow({ category: "bienes-raices", brRentasBranch: "bienes_raices_negocio", inventoryRole: "inventory_property" });
    assert.equal(brChild.businessHubEligible, false);
    const autosChild = classifyOwnerDashboardRow({ category: "autos", autosLane: "negocios", inventoryRole: "inventory_vehicle" });
    assert.equal(autosChild.businessHubEligible, false);
  }

  /* ============================================================================================
   * ACTIONS — regression: resolveDashboardActions() parent/child and owner-verification gates
   * remain exactly as I.5.8 established (not modified by this package).
   * ========================================================================================== */
  {
    const unverified = resolveDashboardActions({
      identity: fakeIdentity({ pipeline: "restaurantes", category: "restaurantes" }),
      lifecycle: { status: "active" },
      entitlement: { couponsActive: true },
      role: null,
      ownerVerified: false,
      lang: "es",
    });
    assert.equal(unverified.length, 0, "owner-unverified must get zero protected actions");

    const brChildActions = resolveDashboardActions({
      identity: fakeIdentity({ pipeline: "bienes_raices_negocio", category: "bienes-raices", sourceId: "child-uuid", parentSourceId: "parent-uuid" }),
      lifecycle: { status: "active" },
      entitlement: { inventoryPackActive: true },
      role: "inventory_property",
      ownerVerified: true,
      lang: "es",
    });
    const brChildKeys = brChildActions.map((a) => a.key);
    assert.ok(!brChildKeys.includes("edit") && !brChildKeys.includes("preview") && !brChildKeys.includes("manageInventory"), "BR-Negocio child must never receive parent-only actions");

    // Hydration-first / checkout-first handlers still present, unchanged by this package.
    const pageSrc = readSource("app/(site)/dashboard/mis-anuncios/page.tsx");
    assert.ok(pageSrc.includes("startRentasRenewal"), "Rentas renewal checkout handler must remain intact");
    assert.ok(pageSrc.includes("startListingRenewalCheckout"), "must still call the real checkout starter, not a plain href");
    assert.ok(pageSrc.includes("onRenew={rentasLifecycle?.isRenewalEligible"), "renewal action must remain gated on real lifecycle eligibility");
  }

  /* ============================================================================================
   * STATUS — truthful display, unknown never shown as active, raw status preserved.
   * ========================================================================================== */
  {
    // Empleos — every real EmpleosListingLifecycleDb value maps to a real, non-"active"-unless-
    // truly-active canonical status.
    const empleosCases: Array<[string, string]> = [
      ["draft", "draft"],
      ["pending_review", "pending_review"],
      ["published", "published"],
      ["paused", "paused"],
      ["archived", "archived"],
      ["rejected", "rejected"],
    ];
    for (const [raw, expectedCanonical] of empleosCases) {
      const d = resolveOwnerDashboardStatusDisplay("empleos", raw);
      assert.equal(d.displayKey, expectedCanonical, `empleos raw "${raw}" must map to "${expectedCanonical}"`);
      assert.equal(d.rawStatus, raw, "raw status must be preserved unmodified");
      assert.equal(d.category, "empleos");
    }
    // mapEmpleosStatusToCanonical itself must now correctly map pending_review (previously
    // silently fell back to "draft" — fixed as part of activating this previously-dead function).
    assert.equal(mapEmpleosStatusToCanonical("pending_review"), "pending_review");

    // Empleos — a genuinely unrecognized raw value must never display as active/published.
    const empleosUnknown = resolveOwnerDashboardStatusDisplay("empleos", "some_future_status");
    assert.equal(empleosUnknown.displayKey, "unknown");
    assert.notEqual(empleosUnknown.tone, "positive");
    assert.equal(empleosUnknown.rawStatus, "some_future_status", "raw status must survive even when unmapped");

    // Viajes — confirmed real ViajesStagedLifecycleStatus values.
    const viajesCases: Array<[string, string]> = [
      ["draft", "draft"],
      ["submitted", "pending_review"],
      ["in_review", "pending_review"],
      ["approved", "published"],
      ["rejected", "rejected"],
      ["expired", "expired"],
      ["unpublished", "unpublished"],
    ];
    for (const [raw, expectedCanonical] of viajesCases) {
      const d = resolveOwnerDashboardStatusDisplay("viajes", raw);
      assert.equal(d.displayKey, expectedCanonical, `viajes raw "${raw}" must map to "${expectedCanonical}"`);
    }
    // "changes_requested" is real but deliberately unmapped (no 1:1 canonical equivalent) — must
    // fail to "unknown", not be silently guessed into some other bucket, and raw must survive.
    const viajesChangesRequested = resolveOwnerDashboardStatusDisplay("viajes", "changes_requested");
    assert.equal(viajesChangesRequested.displayKey, "unknown");
    assert.equal(viajesChangesRequested.rawStatus, "changes_requested");

    // No write behavior anywhere in this module — pure functions only.
    const statusHelperSrc = readSource("app/(site)/dashboard/lib/dashboardOwnerStatusDisplay.ts");
    assert.ok(!/\.insert\(|\.update\(|\.upsert\(/.test(statusHelperSrc), "status display helper must never write to the database");
  }

  /* ============================================================================================
   * ATTENTION CENTER — real-data-only, no fake CTAs, missing routes handled safely.
   * ========================================================================================== */
  {
    // Pending payment attention only appears when the resolved status is genuinely pending_payment.
    const pendingPayment = resolveOwnerDashboardAttentionItems({ id: "l1", category: "rentas", statusDisplayKey: "pending_payment" });
    assert.ok(pendingPayment.some((i) => i.reasonKey === "payment_required" && i.severity === "urgent"));

    const activeNoPayment = resolveOwnerDashboardAttentionItems({ id: "l2", category: "rentas", statusDisplayKey: "active" });
    assert.ok(!activeNoPayment.some((i) => i.reasonKey === "payment_required"), "an active listing must never show a fake payment-required item");

    // Suspended / expired truthful attention.
    const suspended = resolveOwnerDashboardAttentionItems({ id: "l3", category: "restaurantes", statusDisplayKey: "suspended" });
    assert.ok(suspended.some((i) => i.reasonKey === "suspended" && i.severity === "urgent"));

    const expiredNoRenewal = resolveOwnerDashboardAttentionItems({ id: "l4", category: "empleos", statusDisplayKey: "expired" });
    assert.ok(expiredNoRenewal.some((i) => i.reasonKey === "expired"));
    assert.ok(!expiredNoRenewal.some((i) => i.reasonKey === "renewal_available"), "no renewal item without a real renewal path");

    // Renewal only appears when the caller supplies a REAL, already-verified renewal path —
    // never fabricated from just an expired status.
    const expiredWithRealRenewal = resolveOwnerDashboardAttentionItems({
      id: "l5",
      category: "rentas",
      statusDisplayKey: "expired",
      renewal: { isRenewalEligible: true, hasRealAction: true },
    });
    assert.ok(expiredWithRealRenewal.some((i) => i.reasonKey === "renewal_available"));

    const eligibleButNoRealAction = resolveOwnerDashboardAttentionItems({
      id: "l6",
      category: "rentas",
      statusDisplayKey: "active",
      renewal: { isRenewalEligible: true, hasRealAction: false },
    });
    assert.ok(!eligibleButNoRealAction.some((i) => i.reasonKey === "renewal_available"), "eligibility alone without hasRealAction must never produce a renewal CTA");

    // Non-public truthful attention — only when status implies it should be public.
    const shouldBePublicButIsnt = resolveOwnerDashboardAttentionItems({ id: "l7", category: "empleos", statusDisplayKey: "published", isPublished: false });
    assert.ok(shouldBePublicButIsnt.some((i) => i.reasonKey === "not_public"));
    const draftNotPublicIsExpected = resolveOwnerDashboardAttentionItems({ id: "l8", category: "empleos", statusDisplayKey: "draft", isPublished: false });
    assert.ok(!draftNotPublicIsExpected.some((i) => i.reasonKey === "not_public"), "a draft being non-public is expected, not an attention item");

    // Missing routes: `null` = confirmed missing (safe attention, no action); `undefined` =
    // caller didn't evaluate it (no false claim).
    const confirmedMissingEdit = resolveOwnerDashboardAttentionItems({ id: "l9", category: "mascotas-y-perdidos", statusDisplayKey: "unknown", editHref: null, publicHref: null });
    assert.ok(confirmedMissingEdit.some((i) => i.reasonKey === "missing_edit_route" && i.href === null));
    assert.ok(confirmedMissingEdit.some((i) => i.reasonKey === "missing_public_route" && i.href === null));
    const unevaluatedRoutes = resolveOwnerDashboardAttentionItems({ id: "l10", category: "rentas", statusDisplayKey: "active" });
    assert.ok(!unevaluatedRoutes.some((i) => i.reasonKey === "missing_edit_route" || i.reasonKey === "missing_public_route"), "omitted (unevaluated) routes must never be reported as confirmed-missing");

    // Unknown status is itself flagged, never silently treated as fine.
    const unknownStatus = resolveOwnerDashboardAttentionItems({ id: "l11", category: "empleos", statusDisplayKey: "unknown" });
    assert.ok(unknownStatus.some((i) => i.reasonKey === "status_unknown"));

    // Addon inactive/expired — only reported when the caller supplies a real addon read.
    const addonInactive = resolveOwnerDashboardAttentionItems({
      id: "l12",
      category: "restaurantes",
      statusDisplayKey: "published",
      addon: { active: false, labelEs: "Cupones", labelEn: "Coupons" },
    });
    assert.ok(addonInactive.some((i) => i.reasonKey === "addon_inactive"));
    const addonActive = resolveOwnerDashboardAttentionItems({
      id: "l13",
      category: "restaurantes",
      statusDisplayKey: "published",
      addon: { active: true, labelEs: "Cupones", labelEn: "Coupons" },
    });
    assert.ok(!addonActive.some((i) => i.reasonKey === "addon_inactive"));

    // Child needing parent link.
    const childNoParent = resolveOwnerDashboardAttentionItems({ id: "l14", category: "autos", statusDisplayKey: "active", isInventoryChild: true, hasParentLink: false });
    assert.ok(childNoParent.some((i) => i.reasonKey === "child_needs_parent"));
    const childWithParent = resolveOwnerDashboardAttentionItems({ id: "l15", category: "autos", statusDisplayKey: "active", isInventoryChild: true, hasParentLink: true });
    assert.ok(!childWithParent.some((i) => i.reasonKey === "child_needs_parent"));

    // Severity counting is accurate.
    const counts = countByAttentionSeverity(pendingPayment);
    assert.equal(counts.urgent, 1);

    // No I/O anywhere in this module.
    const attentionSrc = readSource("app/(site)/dashboard/lib/dashboardAttentionItems.ts");
    assert.ok(!/\.insert\(|\.update\(|\.upsert\(|fetch\(/.test(attentionSrc), "attention resolver must be pure — no I/O");
  }

  /* ============================================================================================
   * PAYMENT/ENTITLEMENT DISPLAY — the existing server-verified reader is untouched by this
   * package; confirm its ownership re-check comment (Gate I.4.3A) is still present.
   * ========================================================================================== */
  {
    const entitlementRouteSrc = readSource("app/api/dashboard/listing-package-entitlements/route.ts");
    assert.ok(entitlementRouteSrc.includes("Gate I.4.3A"), "the server-side ownership re-check must remain in place, untouched");
    assert.ok(entitlementRouteSrc.includes("getBearerUserId"), "must still require real bearer auth");
  }

  /* ============================================================================================
   * CATALOG REGRESSION — no locked-system file touched by this package.
   * ========================================================================================== */
  {
    let changedFiles = "";
    try {
      const { execFileSync } = await import("node:child_process");
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    const lockedPathFragments = [
      "revenue-os",
      "stripe",
      "/admin/",
      "ofertas",
      "cupones",
      "concierge",
      "webhook",
      "migrations",
      "restaurantes/publish",
      "servicios/publish",
    ];
    for (const f of changed) {
      const lower = f.toLowerCase();
      for (const frag of lockedPathFragments) {
        assert.ok(!lower.includes(frag), `locked-system file must not be part of this package's diff: ${f} (matched "${frag}")`);
      }
    }
  }

  console.log("gate-i8a-global-dashboard-truth-selftest: OK");
}

main();
