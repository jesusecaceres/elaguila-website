/**
 * RELEASE-CANDIDATE FORENSIC CLOSEOUT (2026-09) - publication / payment authority fixes.
 *
 * Executable checks against the real pure modules, plus narrow source guards where the behaviour lives in a
 * route / client component that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-forensic-closeout.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

async function main() {
  const react = await import("../app/admin/_lib/adminReactivationPolicy");
  const core = await import("../app/admin/_lib/adminStaffCoreFieldGuard");
  const autos = await import("../app/admin/_lib/adminAutosReactivationPolicy");
  const emp = await import("../app/admin/_lib/adminEmpleosStaffActions");
  const guard = await import("../app/admin/_lib/adminInventoryActionGuard");
  const relist = await import("../app/(site)/dashboard/lib/dashboardOwnerRelistPolicy");

  // ── generic admin reactivation: suspend/archive can no longer launder an unpaid row ─────────────
  await check("paid-lane row that was NEVER live stays blocked after suspend/archive (flagged/removed)", () => {
    for (const status of ["pending", "flagged", "removed"]) {
      const d = react.decideAdminReactivation({ category: "rentas", status, published_at: null, expires_at: null });
      assert.equal(d.blocked, true, `rentas ${status} without published_at must be blocked`);
    }
    assert.equal(react.decideAdminReactivation({ category: "clases", status: "flagged", published_at: null }).blocked, true);
  });
  await check("a paid-lane row that WAS live can still be restored; non-paid lanes are unaffected", () => {
    assert.equal(react.decideAdminReactivation({ category: "rentas", status: "flagged", published_at: "2026-09-01T00:00:00Z" }).blocked, false);
    assert.equal(react.decideAdminReactivation({ category: "bienes-raices", status: "removed", expires_at: "2026-10-01T00:00:00Z" }).blocked, false);
    assert.equal(react.decideAdminReactivation({ category: "en-venta", status: "flagged", published_at: null }).blocked, false);
  });

  // ── staff Edit form is not a publication authority ───────────────────────────────────────────────
  await check("staff Edit cannot activate a never-paid paid-lane row, nor move its category", () => {
    const d = core.guardStaffCoreFieldLifecycle(
      { category: "rentas", status: "pending", is_published: false, published_at: null, expires_at: null },
      { category: "en-venta", status: "active", isPublished: true },
    );
    assert.equal(d.lifecyclePatch, null);
    assert.equal(d.category, "rentas");
    assert.ok(d.ignored.includes("category_change_ignored"));
    assert.ok(d.ignored.includes("activation_ignored_payment_required"));
  });
  await check("staff Edit cannot skip the Negocio capacity RPC or a FSBO restore gate", () => {
    const negocio = core.guardStaffCoreFieldLifecycle(
      { category: "bienes-raices", status: "flagged", is_published: false, published_at: "2026-09-01T00:00:00Z", seller_type: "business" },
      { category: "bienes-raices", status: "active", isPublished: true },
    );
    assert.equal(negocio.lifecyclePatch, null);
    assert.ok(negocio.ignored.includes("activation_ignored_capacity_rpc_required"));
    const fsbo = core.guardStaffCoreFieldLifecycle(
      { category: "bienes-raices", status: "pending", is_published: false, published_at: null, expires_at: null, seller_type: "private" },
      { category: "bienes-raices", status: "active", isPublished: true },
    );
    assert.equal(fsbo.lifecyclePatch, null);
  });
  await check("staff Edit still saves unchanged / non-activating lifecycle values", () => {
    const same = core.guardStaffCoreFieldLifecycle(
      { category: "en-venta", status: "active", is_published: true },
      { category: "en-venta", status: "active", isPublished: true },
    );
    assert.deepEqual(same.lifecyclePatch, { status: "active", is_published: true });
    const suspend = core.guardStaffCoreFieldLifecycle(
      { category: "rentas", status: "active", is_published: true, published_at: "2026-09-01T00:00:00Z" },
      { category: "rentas", status: "flagged", isPublished: false },
    );
    assert.deepEqual(suspend.lifecyclePatch, { status: "flagged", is_published: false });
  });

  // ── Autos admin: payment_failed archive -> restore laundering ────────────────────────────────────
  await check("Autos: pre-publish statuses cannot be reactivated; a never-published row is refused", () => {
    for (const status of ["draft", "pending_payment", "payment_failed"]) {
      assert.ok(autos.AUTOS_PRE_PUBLISH_STATUSES.has(status));
      assert.equal(autos.decideAutosAdminReactivation({ status, published_at: "2026-09-01T00:00:00Z" }).blocked, true);
    }
    assert.equal(autos.decideAutosAdminReactivation({ status: "cancelled", published_at: null }).blocked, true);
    assert.equal(autos.decideAutosAdminReactivation({ status: "cancelled", published_at: "2026-09-01T00:00:00Z" }).blocked, false);
    const route = raw("app/api/admin/autos/listings/[id]/route.ts");
    assert.match(route, /AUTOS_PRE_PUBLISH_STATUSES\.has\(String\(row\.status/);
    assert.equal((route.match(/decideAutosAdminReactivation\(/g) ?? []).length, 2, "restore + republish both gated");
  });

  // ── Empleos: never strand an unpaid draft ────────────────────────────────────────────────────────
  await check("Empleos: suspend / send_to_review on an unpaid paid-lane draft is refused; reject/archive still work", () => {
    const row = { lifecycle_status: "draft", lane: "quick", published_at: null };
    for (const action of ["suspend", "send_to_review"] as const) {
      const d = emp.decideEmpleosStaffAction({ action, row, now: "2026-09-18T00:00:00Z" });
      assert.equal(d.ok, false);
      if (!d.ok) assert.equal(d.error, "unpaid_draft");
    }
    for (const action of ["reject", "archive"] as const) {
      assert.equal(emp.decideEmpleosStaffAction({ action, row, now: "2026-09-18T00:00:00Z" }).ok, true);
    }
    const published = { lifecycle_status: "published", lane: "quick", published_at: "2026-09-01T00:00:00Z" };
    assert.equal(emp.decideEmpleosStaffAction({ action: "suspend", row: published, now: "2026-09-18T00:00:00Z" }).ok, true);
  });

  // ── delete safety ────────────────────────────────────────────────────────────────────────────────
  await check("permanent delete: Negocio parent with ANY linked child is refused; active subscription blocks even a removed row", () => {
    const parent = {
      id: "p1",
      category: "bienes-raices",
      seller_type: "business",
      status: "removed",
      is_published: false,
      inventory_role: "main",
      br_inventory_group_id: "g1",
    };
    const paused = guard.assertAdminListingDeleteAllowed({
      row: parent,
      linkedRows: [{ id: "c1", status: "paused", is_published: false, inventory_role: "inventory_property" }],
      mode: "permanent",
    });
    assert.deepEqual(paused, { ok: false, code: "has_linked_children" });
    const sub = guard.assertAdminListingDeleteAllowed({ row: parent, evidence: { hasActiveSubscription: true }, mode: "permanent" });
    assert.deepEqual(sub, { ok: false, code: "active_subscription" });
    const clean = guard.assertAdminListingDeleteAllowed({ row: parent, mode: "permanent" });
    assert.deepEqual(clean, { ok: true });
  });

  // ── owner dashboard: never relist unpaid / moderated rows ────────────────────────────────────────
  await check("owner relist policy allows only paused / sold / active", () => {
    for (const s of ["paused", "sold", "active"]) assert.equal(relist.dashboardOwnerMayActivateFromStatus(s), true);
    for (const s of ["pending", "flagged", "removed", "draft", "expired", "pending_payment", "", null, undefined]) {
      assert.equal(relist.dashboardOwnerMayActivateFromStatus(s), false, String(s));
    }
    for (const rel of [
      "app/(site)/dashboard/mis-anuncios/[id]/page.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
      "app/(site)/dashboard/mis-anuncios/page.tsx",
    ]) {
      assert.match(raw(rel), /dashboardOwnerMayActivateFromStatus\(/, rel);
    }
  });

  // ── source guards ────────────────────────────────────────────────────────────────────────────────
  await check("checkout: no second session while the first may be paid; Autos lane + FSBO seller pre-flights", () => {
    const co = raw("app/api/revenue-os/checkout/route.ts");
    assert.match(co, /payment_in_progress/);
    assert.match(co, /checkout_state_unverifiable/);
    assert.match(co, /autos_listing_package_mismatch/);
    assert.match(co, /packageDef\.packageKey === "br_fsbo_45d" && !isBrFsboRow\(/);
    assert.ok(co.indexOf("payment_in_progress") < co.indexOf("await releaseStaleCheckoutAttempt(existingAttempt.id)"));
  });
  await check("staff Edit action reads the row and uses the lifecycle guard (no free-text status write)", () => {
    const a = raw("app/admin/actions.ts");
    assert.match(a, /guardStaffCoreFieldLifecycle\(/);
    assert.doesNotMatch(a, /status: status\.slice\(0, 64\) \|\| "active",/);
  });
  await check("Comida checkout forwards the recurring-billing consent", () => {
    assert.match(raw("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx"), /recurringConsent: ctx\.recurringConsent \?\? null/);
  });
  await check("Autos identity cleanup is scoped to the paid listing", () => {
    const c = raw("app/(site)/revenue-os/pago/_components/AutosPaidReturnIdentityCleanup.tsx");
    assert.match(c, /stored\?\.listingId === paid/);
    assert.match(raw("app/(site)/revenue-os/pago/exito/page.tsx"), /paidListingId=\{proof\.listingId\}/);
  });
  await check("Autos queue applies search/status/owner/Ad ID inside the paged scan (before the limit)", () => {
    const p = raw("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
    assert.match(p, /listAllAutosClassifiedsRowsForAdmin\(queueLimit, \{/);
    assert.doesNotMatch(p, /memoryFiltered \? 500 : queueLimit/);
  });
  await check("listing truth chip agrees with the public predicate", () => {
    assert.match(raw("app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell.ts"), /isGenericListingPubliclyLive\(null, row, nowMs\)/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
