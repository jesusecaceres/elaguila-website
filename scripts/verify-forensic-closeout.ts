/**
 * RELEASE-CANDIDATE FORENSIC CLOSEOUT (2026-09) - publication / payment authority fixes - ADMIN PARTS, golden-survivor port.
 *
 * Ported from integration/category-circuit-closeout-2026-09 @a4a1749b4. Only the Admin checks are kept (owner relist,
 * checkout, Comida checkout, Autos identity cleanup, Empleos staff and normalized-shell checks live outside this port).
 *
 * Executable checks against the real pure modules, plus narrow source guards where the behaviour lives in a
 * route / client component that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-forensic-closeout.ts
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
  const guard = await import("../app/admin/_lib/adminInventoryActionGuard");
  const pre = await import("../app/admin/_lib/adminPrePublishActionPolicy");

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

  await check("dedicated lanes: a pre-publish row cannot be suspended / archived / restored / republished by Admin", () => {
    for (const status of ["pending_payment", "draft", "pending", "payment_failed"]) {
      assert.deepEqual(pre.decideAdminPrePublishAction({ action: "suspend", status }), { blocked: true, code: "not_published", message: (pre.decideAdminPrePublishAction({ action: "suspend", status }) as { message: string }).message });
      assert.equal(pre.decideAdminPrePublishAction({ action: "archive", status }).blocked, true);
      const un = pre.decideAdminPrePublishAction({ action: "unsuspend", status });
      assert.equal(un.blocked && un.code, "payment_required");
      assert.equal(pre.decideAdminPrePublishAction({ action: "republish", status, reactivates: true }).blocked, true);
      assert.equal(pre.decideAdminPrePublishAction({ action: "promote_on", status }).blocked, false, "trust toggles are not publication");
    }
    for (const status of ["published", "suspended", "archived", "rejected"]) {
      for (const action of ["suspend", "unsuspend", "archive", "republish"]) {
        assert.equal(pre.decideAdminPrePublishAction({ action, status, reactivates: true }).blocked, false, `${action} ${status}`);
      }
    }
    for (const rel of ["app/api/admin/servicios/listings/[id]/route.ts", "app/api/admin/restaurantes/listings/[id]/route.ts"]) {
      assert.match(raw(rel), /decideAdminPrePublishAction\(/, rel);
    }
  });

  await check("staff Edit action reads the row and uses the lifecycle guard (no free-text status write)", () => {
    const a = raw("app/admin/actions.ts");
    assert.match(a, /guardStaffCoreFieldLifecycle\(/);
    assert.doesNotMatch(a, /status: status\.slice\(0, 64\) \|\| "active",/);
  });
  await check("soft delete never destroys Mux assets; permanent delete releases them only after the guarded row delete", () => {
    const a = raw("app/admin/actions.ts");
    const soft = a.slice(a.indexOf("export async function deleteListingAction"), a.indexOf("export type BulkListingCleanupResult"));
    assert.ok(!/deleteMuxAssetsBestEffort|mux_asset_id/.test(soft));
    assert.match(soft, /evaluateAdminListingDeletes\(supabase, \[listingId\], "soft"\)/);
    const perm = a.slice(a.indexOf("export async function permanentlyDeleteListingsAction"));
    assert.match(perm, /evaluateAdminListingDeletes\(supabase, found\.map\(\(r\) => r\.id\), "permanent"\)/);
    assert.match(perm, /muxAssetsSafeToDelete\(/);
  });
  await check("generic route: FSBO restore is its own path (never the Negocio RPC); reactivation policy gates unsuspend + republish", () => {
    const r = raw("app/api/admin/clasificados/listings/[id]/route.ts");
    assert.match(r, /const isFsboRow = fsboRestore\.fsbo;/);
    assert.match(r, /category\.toLowerCase\(\) === "bienes-raices" &&\s*!isFsboRow &&/);
    assert.match(r, /republishReactivates && category\.toLowerCase\(\) === "bienes-raices" && !isFsboRow/);
    assert.equal((r.match(/decideAdminReactivation\(/g) ?? []).length, 2);
    assert.match(r, /error: gate\.code, message: gate\.message \}, \{ status: 409 \}/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
