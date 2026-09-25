/**
 * GATE 5 - FINAL ADMIN MUTATION AUTHORITY (2026-09) - golden-survivor port.
 *
 * Ported from integration/category-circuit-closeout-2026-09 @a4a1749b4 and amended to golden truth: the base-package
 * hold covers BASE (*_quick_monthly) and PRO keys (derived from REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS); Comida /
 * Ofertas / Empleos / Viajes-staged checks that depend on app/lib modules outside this port are omitted; the Comida
 * legacy status form guard and the Autos dealer TOTAL capacity display are added.
 *
 * Executable checks against the real pure decision modules (and the real Comida Local mover / hold loaders driven by
 * an in-memory fake client), plus narrow source guards where the behaviour lives in a Next route / server action /
 * client component that cannot be imported under raw tsx.
 *
 * Doctrine under test: Admin is never a second payment / entitlement / subscription authority. A payment hold wins,
 * an elapsed term cannot be revived, a never-live row cannot be laundered, feature/verify never change publication.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-final-admin-authority.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";

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

// ── chainable PostgREST stand-in ────────────────────────────────────────────────────────────────────
type Call = [string, unknown[]];
type Resolved = { data?: unknown; error?: { message: string } | null };
function fakeClient(handler: (table: string, calls: Call[]) => Resolved) {
  const seen: { table: string; calls: Call[] }[] = [];
  const client = {
    from(table: string) {
      const calls: Call[] = [];
      seen.push({ table, calls });
      const b: unknown = new Proxy(
        {},
        {
          get(_t, prop) {
            if (prop === "then") {
              return (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
                try {
                  const r = handler(table, calls);
                  return Promise.resolve({ data: r.data ?? null, error: r.error ?? null }).then(resolve, reject);
                } catch (e) {
                  return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
                }
              };
            }
            return (...args: unknown[]) => {
              calls.push([String(prop), args]);
              return b;
            };
          },
        },
      );
      return b;
    },
  };
  return { client: client as never, seen };
}
const callsOf = (calls: Call[], method: string) => calls.filter(([m]) => m === method);
const hasCall = (calls: Call[], method: string, ...args: unknown[]) =>
  calls.some(([m, a]) => m === method && args.every((x, i) => JSON.stringify(a[i]) === JSON.stringify(x)));
const updates = (seen: { table: string; calls: Call[] }[]) => seen.flatMap((s) => callsOf(s.calls, "update"));

const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PAST = "2020-01-01T00:00:00Z";
const FUTURE = "2099-01-01T00:00:00Z";
const NOW = Date.parse("2026-09-18T12:00:00Z");

async function main() {
  const hold = await import("../app/admin/_lib/adminPaymentSuspensionPolicy");
  const holdServer = await import("../app/admin/_lib/adminPaymentSuspensionPolicyServer");
  const react = await import("../app/admin/_lib/adminReactivationPolicy");
  const fsbo = await import("../app/admin/_lib/adminBrFsboRestorePolicy");
  const core = await import("../app/admin/_lib/adminStaffCoreFieldGuard");
  const autos = await import("../app/admin/_lib/adminAutosReactivationPolicy");
  const pre = await import("../app/admin/_lib/adminPrePublishActionPolicy");
  const entGuard = await import("../app/lib/listingPlans/revenueActiveEntitlementGuard");
  const delGuard = await import("../app/admin/_lib/adminInventoryActionGuard");
  const comidaForm = await import("../app/admin/_lib/adminComidaLocalStatusFormPolicy");
  const cap = await import("../app/admin/_lib/adminAutosDealerCapacity");

  const fsboRow = { category: "bienes-raices", seller_type: "personal", listing_json: { br_publish: { lane: "privado" } }, published_at: "2026-09-01T00:00:00Z", expires_at: "2026-10-15T00:00:00Z" };

  await check("hold: payment-engine reasons (payment / chargeback / ...) block reactivation; moderation / null do not", () => {
    for (const reason of ["payment", "PAYMENT", "chargeback", "payment_failure", "grace_expired"]) {
      const d = hold.decideAdminReactivationHold({ status: "flagged", suspendedReason: { read: true, value: reason } });
      assert.ok(d.blocked && d.code === "payment_suspension_active" && d.httpStatus === 409, reason);
    }
    for (const reason of [null, "moderation", "staff"]) {
      assert.equal(hold.decideAdminReactivationHold({ status: "flagged", suspendedReason: { read: true, value: reason } }).blocked, false, String(reason));
    }
  });
  await check("hold: `public.listings` engine status `suspended` is held even when suspended_reason was never stamped", () => {
    const d = hold.decideAdminReactivationHold({ status: "suspended", suspendedReason: { read: true, value: null }, paymentEngineStatus: "suspended" });
    assert.ok(d.blocked && d.code === "payment_suspension_active");
    // A dedicated-table lane where staff suspension also writes `suspended` (no engine status supplied) is NOT auto-held.
    assert.equal(hold.decideAdminReactivationHold({ status: "suspended", suspendedReason: { read: true, value: null } }).blocked, false);
  });
  await check("hold: an unreadable suspended_reason FAILS CLOSED (503) - never treated as no-hold", () => {
    const d = hold.decideAdminReactivationHold({ status: "flagged", suspendedReason: { read: false } });
    assert.ok(d.blocked && d.code === "suspension_state_unreadable" && d.httpStatus === 503);
  });
  await check("hold: entitlement lapsed blocks, unreadable fails closed, live / none (free, legacy) pass", () => {
    const base = { status: "archived", suspendedReason: { read: true, value: null } } as const;
    const lapsed = hold.decideAdminReactivationHold({ ...base, entitlement: "lapsed" });
    assert.ok(lapsed.blocked && lapsed.code === "entitlement_lapsed" && lapsed.httpStatus === 409);
    const unreadable = hold.decideAdminReactivationHold({ ...base, entitlement: "unreadable" });
    assert.ok(unreadable.blocked && unreadable.code === "entitlement_state_unreadable" && unreadable.httpStatus === 503);
    assert.equal(hold.decideAdminReactivationHold({ ...base, entitlement: "live" }).blocked, false);
    assert.equal(hold.decideAdminReactivationHold({ ...base, entitlement: "none" }).blocked, false);
    assert.equal(hold.decideAdminReactivationHold({ ...base }).blocked, false, "lanes without evidence are not entitlement-gated");
  });
  await check("hold: classify entitlement rows (active + future ends_at = live; expired / revoked / canceled = lapsed; empty = none)", () => {
    assert.equal(hold.classifyAdminEntitlementRows([], NOW), "none");
    assert.equal(hold.classifyAdminEntitlementRows(null, NOW), "none");
    assert.equal(hold.classifyAdminEntitlementRows([{ status: "active", ends_at: FUTURE }], NOW), "live");
    assert.equal(hold.classifyAdminEntitlementRows([{ status: "active", ends_at: PAST }], NOW), "lapsed", "expired entitlement is NOT active");
    assert.equal(hold.classifyAdminEntitlementRows([{ status: "revoked", ends_at: FUTURE }], NOW), "lapsed");
    assert.equal(hold.classifyAdminEntitlementRows([{ status: "canceled", ends_at: FUTURE }], NOW), "lapsed");
    assert.equal(hold.classifyAdminEntitlementRows([{ status: "expired", ends_at: FUTURE }, { status: "active", ends_at: FUTURE }], NOW), "live");
  });
  await check("hold: base package keys stay in parity with the checkout guard's REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS", () => {
    assert.deepEqual([...hold.ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS].sort(), [...entGuard.REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS].sort());
  });
  await check("hold: staff `suspend` over an engine-suspended `listings` row is refused (would strand the engine's CAS lift)", () => {
    const d = hold.decideAdminSuspendOverPaymentHold({ status: "suspended", paymentEngineStatus: "suspended" });
    assert.ok(d.blocked && d.code === "payment_suspension_active");
    assert.equal(hold.decideAdminSuspendOverPaymentHold({ status: "active", paymentEngineStatus: "suspended" }).blocked, false);
  });
  await check("hold server: read errors / throws => unreadable; evaluate() decides from real reads (read-only, never a write)", async () => {
    const errClient = fakeClient(() => ({ error: { message: "column suspended_reason does not exist" } }));
    assert.deepEqual(await holdServer.readAdminSuspendedReason(errClient.client, "listings", UUID(1)), { read: false });
    const throwing = fakeClient(() => {
      throw new Error("network");
    });
    assert.deepEqual(await holdServer.readAdminSuspendedReason(throwing.client, "listings", UUID(1)), { read: false });
    assert.equal(await holdServer.readAdminBaseEntitlementEvidence(errClient.client, UUID(1)), "unreadable");
    const payClient = fakeClient((t) => (t === "listings" ? { data: { suspended_reason: "payment" } } : { data: [] }));
    const d = await holdServer.evaluateAdminReactivationHold(payClient.client, { table: "listings", id: UUID(1), status: "flagged", requireEntitlement: false });
    assert.ok(d.blocked && d.code === "payment_suspension_active");
    const okClient = fakeClient((t) => (t === "listings" ? { data: { suspended_reason: null } } : { data: [{ status: "active", ends_at: FUTURE, package_key: "servicios_base_monthly" }] }));
    assert.equal((await holdServer.evaluateAdminReactivationHold(okClient.client, { table: "listings", id: UUID(1), status: "flagged", requireEntitlement: true })).blocked, false);
    const lapsedClient = fakeClient((t) => (t === "listings" ? { data: { suspended_reason: null } } : { data: [{ status: "active", ends_at: PAST, package_key: "servicios_base_monthly" }] }));
    const lapsed = await holdServer.evaluateAdminReactivationHold(lapsedClient.client, { table: "listings", id: UUID(1), status: "flagged", requireEntitlement: true });
    assert.ok(lapsed.blocked && lapsed.code === "entitlement_lapsed");
    for (const c of [errClient, payClient, okClient, lapsedClient]) assert.equal(updates(c.seen).length, 0, "hold loaders never write");
    // The entitlement read is filtered to THIS listing and the base package keys only.
    const entCalls = okClient.seen.find((s) => s.table === "listing_package_entitlements")!.calls;
    assert.ok(hasCall(entCalls, "eq", "listing_id", UUID(1)));
    assert.ok(callsOf(entCalls, "in").length === 1);
  });

  await check("FSBO restore: a payment-suspended row (status `suspended` OR suspended_reason 'payment') is NEVER restorable (payment suspension wins)", () => {
    const a = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "suspended" }, NOW);
    assert.ok(a.fsbo && a.blocked && a.code === "payment_suspended");
    const b = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", suspended_reason: "payment" }, NOW);
    assert.ok(b.fsbo && b.blocked && b.code === "payment_suspended");
    const c = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", suspended_reason: "moderation" }, NOW);
    assert.ok(c.fsbo && !c.blocked, "a staff-flagged row inside its term is still restorable");
    const d = fsbo.decideBrFsboAdminRestore({ ...fsboRow, status: "flagged", expires_at: "2026-09-01T00:00:00Z" }, NOW);
    assert.ok(d.fsbo && d.blocked && d.code === "renewal_required", "elapsed term still wins");
  });
  await check("generic reactivation: never-paid paid-lane stays blocked; an ELAPSED paid term (Rentas / Clases) is renewal_required", () => {
    const pending = react.decideAdminReactivation({ category: "rentas", status: "pending" });
    assert.ok(pending.blocked && pending.code === "payment_required");
    for (const category of ["rentas", "clases"]) {
      const elapsed = react.decideAdminReactivation({ category, status: "flagged", published_at: "2026-08-01T00:00:00Z", expires_at: "2026-09-01T00:00:00Z", nowMs: NOW });
      assert.ok(elapsed.blocked && elapsed.code === "renewal_required", category);
      const running = react.decideAdminReactivation({ category, status: "flagged", published_at: "2026-08-01T00:00:00Z", expires_at: "2026-10-01T00:00:00Z", nowMs: NOW });
      assert.equal(running.blocked, false, `${category} inside its term is restorable`);
    }
    for (const category of ["en-venta", "comunidad", "busco", "mascotas-y-perdidos", "bienes-raices"]) {
      assert.equal(react.decideAdminReactivation({ category, status: "flagged", published_at: "2026-08-01T00:00:00Z", expires_at: "2026-09-01T00:00:00Z", nowMs: NOW }).blocked, false, `${category}: term enforced by its own policy, not here`);
    }
  });
  await check("staff Edit: a payment-suspended row's status / is_published cannot be rewritten by the free-text fields", () => {
    const cur = { category: "bienes-raices", status: "suspended", is_published: false, published_at: "2026-09-01T00:00:00Z", expires_at: FUTURE, seller_type: "personal", listing_json: fsboRow.listing_json };
    for (const req of [{ status: "active", isPublished: true }, { status: "flagged", isPublished: false }, { status: "removed", isPublished: false }]) {
      const d = core.guardStaffCoreFieldLifecycle(cur, { category: "bienes-raices", ...req });
      assert.equal(d.lifecyclePatch, null, JSON.stringify(req));
      assert.ok(d.ignored.includes("lifecycle_change_ignored_payment_suspension"));
    }
    const viaReason = core.guardStaffCoreFieldLifecycle({ ...cur, status: "flagged", suspended_reason: "payment" }, { category: "bienes-raices", status: "active", isPublished: true });
    assert.equal(viaReason.lifecyclePatch, null);
    // Regression: prior behaviours preserved.
    const pending = core.guardStaffCoreFieldLifecycle({ category: "rentas", status: "pending", is_published: false }, { category: "rentas", status: "active", isPublished: true });
    assert.equal(pending.lifecyclePatch, null, "never-paid activation still ignored");
    assert.equal(core.guardStaffCoreFieldLifecycle({ category: "en-venta", status: "active", is_published: true }, { category: "moving", status: "active", isPublished: true }).category, "en-venta", "category never moves lanes");
  });
  await check("show-public (is_published=true) is not an activation authority", () => {
    for (const status of ["pending", "pending_payment", "flagged", "removed", "sold", "paused", "suspended", "draft"]) {
      const d = react.decideAdminShowPublic({ status });
      assert.ok(d.blocked, status);
    }
    const susp = react.decideAdminShowPublic({ status: "suspended" });
    assert.ok(susp.blocked && susp.code === "payment_suspension_active");
    assert.ok(react.decideAdminShowPublic({ status: "active", suspended_reason: "payment" }).blocked);
    assert.equal(react.decideAdminShowPublic({ status: "active" }).blocked, false);
  });

  await check("autos: pre-publish / never-published rows cannot be restored; an elapsed Privado term is renewal_required; dealer rows have no term", () => {
    for (const status of ["draft", "pending_payment", "payment_failed"]) {
      assert.ok(autos.decideAutosAdminReactivation({ status, published_at: "2026-09-01T00:00:00Z" }).blocked, `${status} (payment_failed cannot launder)`);
    }
    assert.ok(autos.decideAutosAdminReactivation({ status: "cancelled", published_at: null }).blocked);
    const elapsed = autos.decideAutosAdminReactivation({ status: "removed", published_at: "2026-08-01T00:00:00Z", lane: "privado", expires_at: "2026-09-01T00:00:00Z", nowMs: NOW });
    assert.ok(elapsed.blocked && elapsed.code === "renewal_required");
    assert.equal(autos.decideAutosAdminReactivation({ status: "removed", published_at: "2026-08-01T00:00:00Z", lane: "privado", expires_at: "2026-10-01T00:00:00Z", nowMs: NOW }).blocked, false);
    assert.equal(autos.decideAutosAdminReactivation({ status: "removed", published_at: "2026-08-01T00:00:00Z", lane: "negocios", expires_at: null, nowMs: NOW }).blocked, false);
  });

  await check("servicios / restaurantes: pre-publish rows cannot be suspended / archived / restored / republished (payment_failed cannot launder)", () => {
    for (const status of ["draft", "pending", "pending_payment", "payment_failed"]) {
      for (const action of ["suspend", "archive"]) assert.ok(pre.decideAdminPrePublishAction({ action, status }).blocked, `${action} ${status}`);
      assert.ok(pre.decideAdminPrePublishAction({ action: "unsuspend", status }).blocked, `unsuspend ${status}`);
      assert.ok(pre.decideAdminPrePublishAction({ action: "republish", status, reactivates: true }).blocked, `republish ${status}`);
    }
    assert.equal(pre.decideAdminPrePublishAction({ action: "unsuspend", status: "suspended" }).blocked, false, "once-published rows are handled by the payment hold, not this policy");
  });

  await check("servicios legacy status FORM: pre-payment rows cannot be moved; TO published is a reactivation cleared through the hold; refusals save notes only", () => {
    for (const current of ["draft", "preview_ready", "publish_ready", "pending", "pending_payment", "payment_failed"]) {
      for (const requested of ["published", "suspended", "rejected", "paused_unpublished"]) {
        const d = pre.decideServiciosStatusFormChange({ current, requested });
        assert.ok(!d.allowed && d.code === "pre_publish_row", `${current} -> ${requested}`);
      }
    }
    const toPub = pre.decideServiciosStatusFormChange({ current: "suspended", requested: "published" });
    assert.ok(toPub.allowed && toPub.reactivates === true);
    const susp = pre.decideServiciosStatusFormChange({ current: "published", requested: "suspended" });
    assert.ok(susp.allowed && susp.reactivates === false);
    assert.equal(pre.decideServiciosStatusFormChange({ current: "published", requested: "published" }).allowed, false);
    const a = raw("app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts");
    const fn = a.slice(a.indexOf("export async function updateServiciosPublicListingStatusAction"), a.indexOf("export async function setServiciosListingLeonixVerifiedAction"));
    assert.match(fn, /serviciosStatusFormAllowsMutation\(/, "existing pending_payment twin preserved");
    assert.match(fn, /decideServiciosStatusFormChange\(/);
    assert.match(fn, /evaluateAdminReactivationHold\(supabase, \{[\s\S]*?requireEntitlement: true/);
    assert.match(fn, /\.eq\("listing_status", currentStatus\)/, "compare-and-set on the decided status");
    assert.match(fn, /suspended_reason\.is\.null,suspended_reason\.neq\.payment/);
    assert.ok(fn.indexOf("evaluateAdminReactivationHold(") < fn.lastIndexOf(".update({ listing_status: status"), "hold before the status write");
    assert.match(fn, /servicios_admin_status_form_refused/);
  });

  await check("delete guard messages are safe fixed strings (no ids / internals) for every guard code", () => {
    const codes = ["forbidden_role_for_action", "ambiguous_or_unknown_role", "has_public_children", "has_linked_children", "child_role_unconfirmed", "public_live_requires_removal", "active_subscription", "live_entitlement", "paid_record_requires_removal"] as const;
    for (const c of codes) {
      const msg = delGuard.adminDeleteGuardMessage(c);
      assert.ok(msg.length > 20 && !/[0-9a-f]{8}-[0-9a-f]{4}/.test(msg) && !/select |from |error:/i.test(msg), c);
    }
  });
  await check("actions.ts: delete actions RETURN { ok:false, code, message } (never throw the guard); bulk paths return structured whole-batch errors", () => {
    const a = raw("app/admin/actions.ts");
    const soft = a.slice(a.indexOf("export async function deleteListingAction"), a.indexOf("export type BulkListingCleanupResult"));
    assert.match(soft, /Promise<AdminListingActionResult>/);
    assert.match(soft, /return \{ ok: false, code: verdict\.code, message: verdict\.message \}/);
    assert.ok(!/throw new Error/.test(soft), "soft delete no longer throws (production redacts thrown messages)");
    assert.match(soft, /return \{ ok: true \};/);
    assert.match(soft, /\.update\(\{ status: "removed" \}\)/, "behaviour otherwise unchanged");
    assert.ok(!/deleteMuxAssetsBestEffort|mux_asset_id/.test(soft), "soft delete never touches Mux");
    const perm = a.slice(a.indexOf("export async function permanentlyDeleteListingsAction"), a.indexOf("/** Staff edit:"));
    assert.ok(!/throw new Error/.test(perm), "permanent delete returns structured errors");
    assert.match(perm, /error: \{ code: "no_ids"|error: \{ code: "lookup_failed"|error: \{ code: "delete_failed"/);
    assert.match(perm, /\$\{v\.code\}: \$\{v\.message\}/, "per-row refusals carry the safe message, not just a code");
    const iGuard = perm.indexOf('"permanent"');
    const iDelete = perm.indexOf('.delete({ count: "exact" })');
    const iMux = perm.indexOf("deleteMuxAssetsBestEffort(safe)");
    assert.ok(iGuard > 0 && iDelete > iGuard && iMux > iDelete, "guard -> hard delete -> mux release preserved");
    const bulk = a.slice(a.indexOf("export async function bulkSoftDeleteListingsAction"), a.indexOf("export async function permanentlyDeleteListingsAction"));
    assert.match(bulk, /if \(!res\.ok\)/);
    assert.match(bulk, /error: \{ code: "no_ids"/);
    const pub = a.slice(a.indexOf("export async function setListingPublishedAction"), a.indexOf("export async function deleteListingAction"));
    assert.match(pub, /decideAdminShowPublic\(/);
    assert.match(pub, /\.eq\("status", "active"\)/);
  });
  await check("delete UI renders the returned reason (single + bulk soft + bulk permanent + show/hide)", () => {
    const ui = raw("app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx");
    const one = ui.slice(ui.indexOf("async function handleDelete"), ui.indexOf("async function handleSetPublished"));
    assert.match(one, /const result = await deleteListingAction\(row\.id\);/);
    assert.match(one, /if \(!result\.ok\)/);
    assert.match(one, /redirectAfterStaffAction\(row, "delete", "error", result\.message\)/);
    assert.match(ui, /if \(result\.error\) \{\s*setError\(result\.error\.message\);/);
    assert.equal((ui.match(/if \(result\.error\) \{/g) ?? []).length, 2, "both bulk handlers");
    const show = ui.slice(ui.indexOf("async function handleSetPublished"), ui.indexOf("function formatDate"));
    assert.match(show, /if \(!result\.ok\)/);
    assert.match(show, /result\.message/);
  });

  await check("generic listings route: payment hold on unsuspend + reactivating republish, suspend refused over an engine suspension, payment CAS on the writes", () => {
    const r = raw("app/api/admin/clasificados/listings/[id]/route.ts");
    assert.match(r, /evaluateAdminReactivationHold\(supabase, \{[\s\S]*?paymentEngineStatus: "suspended"[\s\S]*?requireEntitlement: category\.toLowerCase\(\) === "bienes-raices" && !isFsboRow/);
    assert.match(r, /action === "unsuspend" \|\| \(action === "republish" && !listingsRowIsPublicLive\(rowRec\)\)/);
    assert.match(r, /decideAdminSuspendOverPaymentHold\(/);
    assert.equal((r.match(/suspended_reason\.is\.null,suspended_reason\.neq\.payment/g) ?? []).length, 2, "CAS on BOTH the republish and the unsuspend write");
    // preserved gates
    assert.ok((r.match(/decideAdminReactivation\(/g) ?? []).length >= 2);
    assert.match(r, /decideBrFsboAdminRestore\(/);
    assert.match(r, /assertBrNegocioActionAllowed\(/);
    assert.match(r, /activateBrNegocioListingAtomic\(/);
    // the hold check happens BEFORE any write
    assert.ok(r.indexOf("evaluateAdminReactivationHold(") < r.indexOf(".update(patch)"));
  });
  await check("autos route: payment hold + lapsed dealer entitlement gate restore / unsuspend / reactivating republish; term passed to the policy", () => {
    const r = raw("app/api/admin/autos/listings/[id]/route.ts");
    assert.equal((r.match(/evaluateAdminReactivationHold\(supabase, \{/g) ?? []).length, 2);
    assert.match(r, /requireEntitlement: String\(rec\.lane\) === "negocios"/);
    assert.match(r, /requireEntitlement: row\.lane === "negocios"/);
    assert.equal((r.match(/lane: row\.lane, expires_at: row\.expires_at/g) ?? []).length, 2);
    assert.match(r, /if \(republishReactivates\) patch\.suspended_reason = null;/, "existing marker lift preserved");
  });
  await check("servicios + restaurantes routes: hold gate on unsuspend / reactivating republish with payment CAS; pre-publish policy preserved", () => {
    for (const [file, table] of [
      ["app/api/admin/servicios/listings/[id]/route.ts", "servicios_public_listings"],
      ["app/api/admin/restaurantes/listings/[id]/route.ts", "restaurantes_public_listings"],
    ] as const) {
      const r = raw(file);
      assert.match(r, new RegExp(`evaluateAdminReactivationHold\\(supabase, \\{\\s*table: "${table}"`), file);
      assert.match(r, /requireEntitlement: true/);
      assert.match(r, /decideAdminPrePublishAction\(/);
      assert.equal((r.match(/suspended_reason\.is\.null,suspended_reason\.neq\.payment/g) ?? []).length, 2, file);
      assert.ok(r.indexOf("evaluateAdminReactivationHold(") < r.indexOf(".update(patch)"), `${file}: hold before write`);
    }
  });

  // ═══ GOLDEN-SURVIVOR ADDITIONS ══════════════════════════════════════════════════════════════════
  await check("hold keys: BASE (*_quick_monthly) and PRO (*_base_monthly / autos_dealer_monthly / br_agent_monthly) keys ALL gate reactivation", () => {
    for (const k of [
      "servicios_quick_monthly",
      "restaurantes_quick_monthly",
      "autos_dealer_quick_monthly",
      "br_agent_quick_monthly",
      "servicios_base_monthly",
      "restaurantes_base_monthly",
      "autos_dealer_monthly",
      "br_agent_monthly",
      "comida_local_base_monthly",
    ]) {
      assert.ok(hold.ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS.includes(k), k);
    }
    const src = raw("app/admin/_lib/adminPaymentSuspensionPolicy.ts");
    assert.match(src, /\[\.\.\.REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS\]/, "derived from the checkout guard, not a hand copy");
  });
  await check("hold server: a lapsed BASE (quick) entitlement blocks reactivation exactly like a PRO one", async () => {
    const c = fakeClient((t) =>
      t === "servicios_public_listings"
        ? { data: { suspended_reason: null } }
        : { data: [{ status: "canceled", ends_at: FUTURE, package_key: "servicios_quick_monthly" }] },
    );
    const d = await holdServer.evaluateAdminReactivationHold(c.client, { table: "servicios_public_listings", id: UUID(3), status: "suspended", requireEntitlement: true });
    assert.ok(d.blocked && d.code === "entitlement_lapsed");
    const inCall = callsOf(c.seen.find((s) => s.table === "listing_package_entitlements")!.calls, "in")[0];
    assert.ok((inCall[1][1] as string[]).includes("servicios_quick_monthly"), "the read asks for quick keys too");
  });

  // Comida Local legacy status form (golden still ships the raw <select>)
  const cform = (over: Record<string, unknown> = {}) =>
    ({ status: "suspended", payment_status: "paid", published_at: PAST, suspended_reason: "moderation", suspended_reason_read: true, ...over }) as never;
  await check("comida form: draft / pending_payment are never written by staff and pre-payment rows never move", () => {
    for (const requested of ["draft", "pending_payment", "archived"]) {
      const d = comidaForm.decideComidaLocalStatusFormChange({ row: cform({ status: "published" }), requested });
      assert.ok(!d.allowed && d.code === "invalid_target", requested);
    }
    for (const status of ["draft", "pending_payment"]) {
      for (const requested of ["published", "paused", "suspended"]) {
        const d = comidaForm.decideComidaLocalStatusFormChange({ row: cform({ status, payment_status: "pending" }), requested, entitlement: "live" });
        assert.ok(!d.allowed && d.code === "pre_payment_row", `${status}->${requested}`);
      }
    }
  });
  await check("comida form: published needs payment proof + clear hold; payment reasons / unreadable evidence fail closed", () => {
    const pub = (row: Record<string, unknown>, entitlement?: "live" | "lapsed" | "none" | "unreadable") =>
      comidaForm.decideComidaLocalStatusFormChange({ row: cform(row), requested: "published", entitlement });
    const ok = pub({}, "live");
    assert.ok(ok.allowed && ok.patch.status === "published" && ok.patch.suspended_reason === null && ok.expectStatus === "suspended");
    assert.ok(pub({}, "none").allowed, "free / legacy row with no entitlement on record");
    const cases: [Record<string, unknown>, "live" | "lapsed" | "unreadable" | undefined, string][] = [
      [{ payment_status: "pending" }, "live", "payment_required"],
      [{ payment_status: "failed" }, "live", "payment_required"],
      [{ suspended_reason: "payment" }, "live", "payment_suspension_active"],
      [{ suspended_reason: "chargeback" }, "live", "payment_suspension_active"],
      [{ suspended_reason_read: false }, "live", "suspension_state_unreadable"],
      [{}, "lapsed", "entitlement_lapsed"],
      [{}, "unreadable", "entitlement_state_unreadable"],
      [{}, undefined, "entitlement_state_unreadable"],
    ];
    for (const [row, ent, code] of cases) {
      const d = pub(row, ent);
      assert.ok(!d.allowed && d.code === code, `${JSON.stringify(row)}/${String(ent)} -> ${JSON.stringify(d)}`);
    }
    const s = comidaForm.decideComidaLocalStatusFormChange({ row: cform({ status: "published", suspended_reason: null }), requested: "suspended" });
    assert.ok(s.allowed && s.patch.suspended_reason === "moderation");
    const p = comidaForm.decideComidaLocalStatusFormChange({ row: cform({ suspended_reason: "payment" }), requested: "paused" });
    assert.ok(!p.allowed && p.code === "payment_suspension_active");
  });
  await check("comida form action: verified session, reads evidence before writing, CAS on status + non-payment reason, audit", () => {
    const a = raw("app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts");
    assert.match(a, /isVerifiedAdminSession\(c\)/);
    assert.match(a, /decideComidaLocalStatusFormChange\(/);
    assert.match(a, /readAdminBaseEntitlementEvidence\(supabase, id\)/);
    assert.match(a, /\.eq\("status", decision\.expectStatus\)/);
    assert.match(a, /suspended_reason\.is\.null,suspended_reason\.not\.in\.\(payment,chargeback,payment_failure,grace_expired\)/);
    assert.ok(!/updateAdminComidaLocalListingStatus/.test(a), "no longer the unconditional status writer");
    assert.ok(a.indexOf("decideComidaLocalStatusFormChange(") < a.indexOf(".update("), "decision before write");
    assert.match(a, /comida_local_admin_status_form_refused/);
  });

  // Autos dealer capacity display (P1-12)
  await check("autos capacity: limit comes from golden's resolver - BASE 5 (never the pack), PRO 10, PRO + pack 20", () => {
    assert.deepEqual(cap.resolveAdminDealerCapacityLimit({ quick: true, packActive: false }), { limit: 5, tier: "base" });
    assert.deepEqual(cap.resolveAdminDealerCapacityLimit({ quick: true, packActive: true }), { limit: 5, tier: "base" }, "BASE never shows pack/20");
    assert.deepEqual(cap.resolveAdminDealerCapacityLimit({ quick: false, packActive: false }), { limit: 10, tier: "pro" });
    assert.deepEqual(cap.resolveAdminDealerCapacityLimit({ quick: false, packActive: true }), { limit: 20, tier: "pro_pack" });
  });
  await check("autos capacity: TOTAL counts the main as vehicle #1 plus every active child; inactive rows / other lanes excluded", () => {
    const main = { id: "m1", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: "g1", inventory_role: "main" };
    const kids = [1, 2, 3, 4].map((n) => ({
      id: `c${n}`,
      lane: "negocios",
      status: "active",
      owner_user_id: "o1",
      dealer_inventory_group_id: "g1",
      dealer_inventory_parent_listing_id: "m1",
      inventory_role: "inventory_vehicle",
    }));
    const other = [
      { id: "c9", lane: "negocios", status: "removed", owner_user_id: "o1", dealer_inventory_group_id: "g1" },
      { id: "p1", lane: "privado", status: "active", owner_user_id: "o1" },
      { id: "m2", lane: "negocios", status: "active", owner_user_id: "o1", dealer_inventory_group_id: "g2", inventory_role: "main" },
    ];
    const totals = cap.countAdminDealerActiveTotals([main, ...kids, ...other]);
    assert.equal(totals.g1, 5, "main + 4 children = 5 total");
    assert.equal(totals.g2, 1, "a second group of the same owner never merges");
    const base = cap.adminDealerGroupCapacity({ active: totals.g1, quick: true, packActive: false });
    assert.deepEqual(cap.describeAdminDealerCapacity(base), { text: "5/5 total (incl. main) · BASE", over: false });
    const baseOver = cap.adminDealerGroupCapacity({ active: 6, quick: true, packActive: true });
    assert.ok(baseOver.available && baseOver.limit === 5 && baseOver.over);
    assert.match(cap.describeAdminDealerCapacity(cap.adminDealerGroupCapacity({ active: 11, quick: false, packActive: true })).text, /^11\/20 total \(incl\. main\) · PRO \+ pack$/);
    assert.equal(cap.describeAdminDealerCapacity({ available: false, reason: "count_unavailable" }).text, "capacity —");
    assert.equal(cap.adminDealerMainIdForRow(kids[0]), "m1");
    assert.equal(cap.adminDealerMainIdForRow(main), "m1");
  });
  await check("autos capacity page + server: canonical count over every active row of visible owners, plan from golden enforcement reads", () => {
    const page = raw("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
    assert.match(page, /await fetchAutosDealerCapacityForRows\(rows\)/);
    assert.ok(!/\/10`/.test(page) && !/dealerActiveCountByGroup/.test(page), "no hard-coded /10 over the truncated page");
    const srv = raw("app/admin/_lib/adminAutosDealerCapacityServer.ts");
    assert.match(srv, /\.eq\("lane", "negocios"\)\s*\.eq\("status", "active"\)\s*\.in\("owner_user_id", chunk\)/);
    assert.match(srv, /resolveQuickBusinessPublishIdentity\(\{ category: "autos", ownerUserId: g\.owner, listingId: g\.mainId \}\)/);
    assert.match(srv, /listingHasActiveDealerInventoryPack\(g\.mainId\)/);
    assert.match(srv, /quickFullOnlyBoundaryApplies\(identity\)/);
    assert.ok(!/\.(insert|update|upsert|delete)\(/.test(srv), "read-only");
  });

  await check("feature (promote) / verify never change publication state - generic / servicios / restaurantes / viajes / autos routes", () => {
    const forbidden = /(?:^|[^_a-z])(status|is_published|is_public|listing_status|lifecycle_status|published_at|expires_at|suspended_reason)\b/;
    for (const file of [
      "app/api/admin/clasificados/listings/[id]/route.ts",
      "app/api/admin/servicios/listings/[id]/route.ts",
      "app/api/admin/restaurantes/listings/[id]/route.ts",
      "app/api/admin/viajes/listings/[id]/route.ts",
    ]) {
      const r = raw(file);
      const re = /case "(promote_on|promote_off|verify_on|verify_off)":([\s\S]*?)break;/g;
      let n = 0;
      for (const m of r.matchAll(re)) {
        n += 1;
        assert.ok(!forbidden.test(m[2]), `${file} ${m[1]} touches publication state: ${m[2].trim()}`);
      }
      assert.equal(n, 4, `${file} has all four cases`);
    }
    const a = raw("app/api/admin/autos/listings/[id]/route.ts");
    for (const action of ["promote_on", "promote_off", "verify_on", "verify_off"]) {
      const m = a.match(new RegExp(`action === "${action}"\\) \\{([\\s\\S]*?)\\}`));
      assert.ok(m, action);
      assert.ok(!forbidden.test(m![1]), `autos ${action}`);
    }
  });
  await check("no ported Admin file writes payment / entitlement / subscription truth or inserts a listing row", () => {
    const files = [
      "app/api/admin/clasificados/listings/[id]/route.ts",
      "app/api/admin/autos/listings/[id]/route.ts",
      "app/api/admin/servicios/listings/[id]/route.ts",
      "app/api/admin/restaurantes/listings/[id]/route.ts",
      "app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts",
      "app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts",
      "app/admin/_lib/adminPaymentSuspensionPolicy.ts",
      "app/admin/_lib/adminPaymentSuspensionPolicyServer.ts",
      "app/admin/_lib/adminComidaLocalStatusFormPolicy.ts",
      "app/admin/_lib/adminListingDeleteServer.ts",
    ];
    for (const f of files) {
      const s = raw(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      assert.ok(!/from\("(leonix_payment_records|listing_package_entitlements|leonix_subscription_records)"\)\s*\.(insert|update|upsert|delete)/.test(s), `${f} writes commercial tables`);
      assert.ok(!/\b(payment_status|entitlement_status|package_entitlement_id|payment_record_id)\s*:\s*["'`]/.test(s), `${f} writes a payment field`);
      assert.ok(!/\.(insert|upsert)\(/.test(s), `${f} inserts / upserts`);
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
