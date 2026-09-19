/**
 * GATE 5 - FINAL ADMIN MUTATION AUTHORITY (2026-09).
 *
 * Executable checks against the real pure decision modules (and the real Comida Local mover / hold loaders driven by
 * an in-memory fake client), plus narrow source guards where the behaviour lives in a Next route / server action /
 * client component that cannot be imported under raw tsx.
 *
 * Doctrine under test: Admin is never a second payment / entitlement / subscription authority. A payment hold wins,
 * an elapsed term cannot be revived, a never-live row cannot be laundered, feature/verify never change publication.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-admin-authority.ts
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
  const emp = await import("../app/admin/_lib/adminEmpleosStaffActions");
  const comida = await import("../app/lib/clasificados/comida-local/comidaLocalAdminModeration");
  const comidaQ = await import("../app/lib/clasificados/comida-local/comidaLocalAdminQueries");
  const ofertas = await import("../app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations");
  const ofertasMsgs = await import("../app/lib/ofertas-locales/ofertasLocalesAdminReviewMessages");
  const entGuard = await import("../app/lib/listingPlans/revenueActiveEntitlementGuard");
  const delGuard = await import("../app/admin/_lib/adminInventoryActionGuard");

  // ═══ 1. PAYMENT HOLD POLICY (pure) ═══════════════════════════════════════════════════════════════
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

  // ═══ 2. FSBO / GENERIC LISTINGS ═════════════════════════════════════════════════════════════════
  const fsboRow = { category: "bienes-raices", seller_type: "personal", listing_json: { br_publish: { lane: "privado" } }, published_at: "2026-09-01T00:00:00Z", expires_at: "2026-10-15T00:00:00Z" };
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
  await check("owner FSBO relist / resume can never leave a payment-suspended or moderated row (allow-list of prior states)", async () => {
    const owner = await import("../app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority");
    for (const status of ["suspended", "flagged", "removed"]) {
      for (const action of owner.BR_FSBO_OWNER_STATUS_ACTIONS) {
        if (action === "archive") continue; // archive is allowed except from moderation: covered below
        const d = owner.resolveBrFsboOwnerStatusDecision({ row: { status, is_published: false }, action });
        assert.equal(d.ok, false, `${action} from ${status}`);
      }
      assert.equal(owner.resolveBrFsboOwnerStatusDecision({ row: { status, is_published: false }, action: "archive" }).ok, false, `archive from ${status}`);
    }
    for (const status of ["pending", "pending_payment", "draft"]) {
      const d = owner.resolveBrFsboOwnerStatusDecision({ row: { status, is_published: false }, action: "relist" });
      assert.ok(!d.ok && d.error === owner.BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR);
    }
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

  // ═══ 3. AUTOS ═══════════════════════════════════════════════════════════════════════════════════
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

  // ═══ 4. SERVICIOS / RESTAURANTES ════════════════════════════════════════════════════════════════
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

  // ═══ 5. COMIDA LOCAL ════════════════════════════════════════════════════════════════════════════
  const crow = (over: Record<string, unknown> = {}) => ({ status: "suspended", payment_status: "paid", published_at: PAST, suspended_reason: "moderation" as string | null, ...over });
  await check("comida policy: payment-engine reasons block Restore AND Republish; an unreadable reason fails closed (500) for both", () => {
    for (const reason of ["payment", "chargeback", "grace_expired"]) {
      const d = comida.decideComidaLocalAdminAction("unsuspend", crow({ suspended_reason: reason }));
      assert.ok(!d.ok && d.error === "payment_suspended" && d.httpStatus === 409, reason);
    }
    const rep = comida.decideComidaLocalAdminAction("republish", crow({ status: "paused", suspended_reason: "payment" }));
    assert.ok(!rep.ok && rep.error === "payment_suspended");
    for (const [action, status] of [["unsuspend", "suspended"], ["republish", "paused"]] as const) {
      const d = comida.decideComidaLocalAdminAction(action, crow({ status, suspended_reason_read: false }));
      assert.ok(!d.ok && d.error === "suspension_reason_unreadable" && d.httpStatus === 500, action);
    }
    // Unchanged behaviour: moderation restore OK and the CAS excludes payment; republish now carries the same CAS.
    const ok = comida.decideComidaLocalAdminAction("unsuspend", crow());
    assert.ok(ok.ok && ok.requireNonPaymentReason && ok.patch.suspended_reason === null);
    const rep2 = comida.decideComidaLocalAdminAction("republish", crow({ status: "paused", suspended_reason: null }));
    assert.ok(rep2.ok && rep2.requireNonPaymentReason === true);
  });
  await check("comida policy: lapsed entitlement blocks Restore / Republish; unreadable fails closed; live / none pass; suspend / archive are unaffected", () => {
    for (const [action, status] of [["unsuspend", "suspended"], ["republish", "paused"]] as const) {
      const lapsed = comida.decideComidaLocalAdminAction(action, crow({ status, suspended_reason: null, entitlement: "lapsed" }));
      assert.ok(!lapsed.ok && lapsed.error === "entitlement_lapsed" && lapsed.httpStatus === 409, action);
      const unreadable = comida.decideComidaLocalAdminAction(action, crow({ status, suspended_reason: null, entitlement: "unreadable" }));
      assert.ok(!unreadable.ok && unreadable.error === "entitlement_state_unreadable" && unreadable.httpStatus === 500);
      for (const ev of ["live", "none", undefined] as const) assert.ok(comida.decideComidaLocalAdminAction(action, crow({ status, suspended_reason: null, entitlement: ev })).ok, `${action}/${String(ev)}`);
    }
    assert.ok(comida.decideComidaLocalAdminAction("suspend", crow({ status: "published", entitlement: "lapsed" })).ok);
    assert.ok(comida.decideComidaLocalAdminAction("archive", crow({ status: "published", entitlement: "lapsed" })).ok);
  });
  await check("comida policy: staff can never publish an unpaid row (payment proof still required with clean evidence)", () => {
    for (const status of ["draft", "pending_payment"]) {
      for (const action of comida.COMIDA_LOCAL_ADMIN_ACTIONS) {
        assert.equal(comida.decideComidaLocalAdminAction(action, crow({ status, payment_status: "pending", suspended_reason: null })).ok, false, `${action} ${status}`);
      }
    }
    assert.equal(comida.decideComidaLocalAdminAction("unsuspend", crow({ payment_status: "failed", suspended_reason: null })).ok, false);
  });
  const comidaDb = (r: Record<string, unknown> | null, opts: { readError?: boolean; updateError?: string; entitlements?: Record<string, unknown>[]; entitlementError?: boolean } = {}) =>
    fakeClient((table, calls) => {
      if (table === "listing_package_entitlements") return opts.entitlementError ? { error: { message: "boom" } } : { data: opts.entitlements ?? [] };
      assert.equal(table, "comida_local_public_listings");
      if (calls.some(([m]) => m === "update")) {
        if (opts.updateError) return { error: { message: opts.updateError } };
        return { data: [{ id: r?.id }] };
      }
      if (opts.readError) return { error: { message: "column suspended_reason does not exist" } };
      return { data: r };
    });
  const cbase = (over: Record<string, unknown> = {}) => ({ id: UUID(1), slug: "tacos", leonix_ad_id: "COMIDA-2026-000001", status: "suspended", payment_status: "paid", published_at: PAST, suspended_reason: null, ...over });
  await check("comida mover FAILS SAFELY: read error (incl. suspended_reason) => 500 + NO write; missing reason key => 500 + NO write", async () => {
    const err = comidaDb(null, { readError: true });
    const r1 = await comidaQ.applyAdminComidaLocalAction(err.client, UUID(1), "unsuspend");
    assert.ok(!r1.ok && r1.httpStatus === 500 && r1.error === "lookup_failed");
    assert.match(r1.ok ? "" : r1.message, /nothing was changed/);
    assert.ok(!/suspended_reason/.test(r1.ok ? "" : r1.message), "no database internals in the message");
    assert.equal(updates(err.seen).length, 0);
    const { suspended_reason: _drop, ...noReasonKey } = cbase();
    void _drop;
    for (const action of ["unsuspend", "republish"] as const) {
      const db = comidaDb({ ...noReasonKey, status: action === "unsuspend" ? "suspended" : "paused" });
      const r = await comidaQ.applyAdminComidaLocalAction(db.client, UUID(1), action);
      assert.ok(!r.ok && r.httpStatus === 500 && r.error === "suspension_reason_unreadable", `${action}: ${JSON.stringify(r)}`);
      assert.equal(updates(db.seen).length, 0, "no partial write");
    }
  });
  await check("comida mover: update error => 500 with a safe message (no raw DB text); entitlement lapsed / unreadable => no write; payment reason => 409 no write", async () => {
    const upd = comidaDb(cbase({ suspended_reason: "moderation" }), { updateError: "duplicate key value violates constraint x" });
    const r1 = await comidaQ.applyAdminComidaLocalAction(upd.client, UUID(1), "unsuspend");
    assert.ok(!r1.ok && r1.httpStatus === 500 && r1.error === "update_failed");
    assert.ok(!/duplicate|constraint/.test(r1.ok ? "" : r1.message));
    const lapsed = comidaDb(cbase({ suspended_reason: "moderation" }), { entitlements: [{ status: "active", ends_at: PAST, package_key: "comida_local_base_monthly" }] });
    const r2 = await comidaQ.applyAdminComidaLocalAction(lapsed.client, UUID(1), "unsuspend");
    assert.ok(!r2.ok && r2.error === "entitlement_lapsed" && r2.httpStatus === 409);
    assert.equal(updates(lapsed.seen).length, 0);
    const unreadable = comidaDb(cbase({ status: "paused" }), { entitlementError: true });
    const r3 = await comidaQ.applyAdminComidaLocalAction(unreadable.client, UUID(1), "republish");
    assert.ok(!r3.ok && r3.error === "entitlement_state_unreadable" && r3.httpStatus === 500);
    assert.equal(updates(unreadable.seen).length, 0);
    const pay = comidaDb(cbase({ suspended_reason: "payment" }));
    const r4 = await comidaQ.applyAdminComidaLocalAction(pay.client, UUID(1), "unsuspend");
    assert.ok(!r4.ok && r4.error === "payment_suspended");
    assert.equal(updates(pay.seen).length, 0);
    const good = comidaDb(cbase({ suspended_reason: "moderation" }), { entitlements: [{ status: "active", ends_at: FUTURE, package_key: "comida_local_base_monthly" }] });
    const r5 = await comidaQ.applyAdminComidaLocalAction(good.client, UUID(1), "unsuspend");
    assert.ok(r5.ok);
    assert.ok(good.seen.some((s) => hasCall(s.calls, "or", "suspended_reason.is.null,suspended_reason.eq.moderation")), "restore CAS excludes payment reasons");
    const rep = comidaDb(cbase({ status: "paused" }));
    const r6 = await comidaQ.applyAdminComidaLocalAction(rep.client, UUID(1), "republish");
    assert.ok(r6.ok);
    assert.ok(rep.seen.some((s) => hasCall(s.calls, "or", "suspended_reason.is.null,suspended_reason.eq.moderation")), "republish CAS excludes payment reasons too");
  });
  await check("comida: NO select-without-reason fallback remains (the queue reports the error instead of guessing)", () => {
    const q = raw("app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts");
    assert.ok(!/SELECT_NO_REASON/.test(q));
    assert.ok(!/error && \/suspended_reason\/i\.test/.test(q));
    assert.match(q, /suspended_reason_read: reasonPresent/);
  });

  // ═══ 6. EMPLEOS ═════════════════════════════════════════════════════════════════════════════════
  await check("empleos: a once-live PAID post whose payment is DISPUTED cannot be restored / republished (a refund is a separate admin decision, not a hold); free lane and live rows do not need the read", () => {
    const paidRow = { lifecycle_status: "paused", lane: "premium", published_at: PAST };
    const d = emp.decideEmpleosStaffAction({ action: "unsuspend", row: paidRow, now: "2026-09-18T00:00:00Z", paymentReversed: true });
    assert.ok(!d.ok && d.error === "payment_reversed" && d.status === 409);
    const r = emp.decideEmpleosStaffAction({ action: "republish", row: { ...paidRow, lifecycle_status: "archived" }, now: "2026-09-18T00:00:00Z", paymentReversed: true });
    assert.equal(r.ok, false);
    assert.ok(emp.decideEmpleosStaffAction({ action: "unsuspend", row: paidRow, now: "2026-09-18T00:00:00Z", paymentReversed: false }).ok);
    assert.ok(emp.decideEmpleosStaffAction({ action: "unsuspend", row: paidRow, now: "2026-09-18T00:00:00Z" }).ok, "unreadable evidence does not newly block a once-live row");
    assert.equal(emp.empleosStaffActionNeedsReversalCheck("unsuspend", paidRow), true);
    assert.equal(emp.empleosStaffActionNeedsReversalCheck("unsuspend", { ...paidRow, lifecycle_status: "published" }), false, "live row: no restore");
    assert.equal(emp.empleosStaffActionNeedsReversalCheck("unsuspend", { ...paidRow, published_at: null }), false, "never-live rows are gated by payment-cleared");
    assert.equal(emp.empleosStaffActionNeedsReversalCheck("archive", paidRow), false);
    // never-live paid-lane row stays payment-gated (existing doctrine preserved)
    const neverLive = emp.decideEmpleosStaffAction({ action: "unsuspend", row: { lifecycle_status: "draft", lane: "quick", published_at: null }, now: "2026-09-18T00:00:00Z", paymentCleared: false });
    assert.ok(!neverLive.ok && neverLive.error === "payment_required");
  });

  // ═══ 7. OFERTAS ═════════════════════════════════════════════════════════════════════════════════
  await check("ofertas approval term: first approval stamps; a running bought term is PRESERVED; an elapsed term needs a paid renewal", () => {
    assert.equal(ofertas.decideOfertaApprovalTerm({ published_at: null, expires_at: null }, NOW), "first");
    assert.equal(ofertas.decideOfertaApprovalTerm({ published_at: PAST, expires_at: FUTURE }, NOW), "preserve");
    assert.equal(ofertas.decideOfertaApprovalTerm({ published_at: PAST, expires_at: "2026-09-01T00:00:00Z" }, NOW), "term_elapsed");
    assert.equal(ofertasMsgs.ofertaReviewErrorHttpStatus("term_elapsed_renewal_required"), 422);
    assert.match(ofertasMsgs.ofertaReviewErrorMessage("term_elapsed_renewal_required"), /renew/i);
  });
  await check("ofertas restore: goes to pending_review, writes ONLY status / internal_notes / updated_at (no payment, entitlement, term)", async () => {
    const offer = { id: UUID(5), status: "archived", leonix_ad_id: "LNX-ABCDEFGH", payment_status: "paid", entitlement_status: "active", package_entitlement_id: "e1", payment_record_id: "p1", published_at: PAST, expires_at: FUTURE, internal_notes: null, owner_id: UUID(9) };
    const db = fakeClient((table, calls) => {
      if (calls.some(([m]) => m === "update")) return { data: { id: UUID(5) } };
      return { data: offer };
    });
    const res = await ofertas.mutateOfertaLocalAdminReview(db.client, UUID(5), "restore", "back to review");
    assert.ok(res.ok && res.newStatus === "pending_review", JSON.stringify(res));
    const payload = callsOf(db.seen.find((s) => callsOf(s.calls, "update").length)!.calls, "update")[0][1][0] as Record<string, unknown>;
    assert.deepEqual(Object.keys(payload).sort(), ["internal_notes", "status", "updated_at"]);
    // restore is refused from live / expired states
    for (const status of ["approved", "pending_review", "expired", "draft"]) {
      const d = fakeClient(() => ({ data: { ...offer, status } }));
      const r = await ofertas.mutateOfertaLocalAdminReview(d.client, UUID(5), "restore", null);
      assert.ok(!r.ok && r.error === "invalid_transition", status);
    }
  });
  await check("ofertas approve: source keeps the paid-entitlement-or-courtesy gate, never writes payment fields, preserves a bought term", () => {
    const m = raw("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
    assert.match(m, /commercial_entitlement_required/);
    assert.match(m, /validateOfertaLocalPartnerCourtesyEligibility/);
    assert.match(m, /if \(!preserveExistingTerm\) \{\s*parentUpdate\.published_at = now;/);
    assert.match(m, /term_elapsed_renewal_required/);
    for (const k of ["payment_status", "entitlement_status", "package_entitlement_id", "payment_record_id"]) {
      assert.ok(!new RegExp(`parentUpdate\\.${k}|parentUpdate = \\{[^}]*${k}`).test(m), `parentUpdate never writes ${k}`);
    }
  });

  // ═══ 8. DELETE GUARD: structured result (production redacts thrown messages) ═══════════════════
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

  // ═══ 9. VIAJES STAGED MODERATE ══════════════════════════════════════════════════════════════════
  await check("viajes staged moderate: notes are PRESERVED when omitted, an audit row is written, unknown actions are refused", () => {
    const r = raw("app/api/admin/viajes/staged-listings/moderate/route.ts");
    assert.match(r, /import \{ appendAdminAuditLog \} from "@\/app\/admin\/_lib\/adminAuditLogServer";/);
    assert.match(r, /await appendAdminAuditLog\(\{/);
    assert.match(r, /action: `viajes_staged_admin_\$\{action\}`/);
    assert.match(r, /function noteField\(v: unknown\): string \| undefined/);
    assert.ok(!/review_notes = typeof b\.review_notes === "string" \? b\.review_notes\.trim\(\) \|\| null : null/.test(r), "the notes-nulling expression is gone");
    assert.match(r, /const review_notes = noteField\(b\.review_notes\);/);
    assert.match(r, /const moderation_reason = noteField\(b\.moderation_reason\);/);
    assert.match(r, /MODERATE_ACTIONS\.has\(actionRaw\)/);
    assert.match(r, /not_found/);
    assert.match(r, /review_notes_updated: review_notes !== undefined/);
    // the DB helper leaves the column alone for `undefined` (so the route's undefined really preserves)
    const db = raw("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
    assert.match(db, /if \(input\.review_notes !== undefined\) patch\.review_notes = input\.review_notes;/);
    assert.match(db, /if \(input\.moderation_reason !== undefined\) patch\.moderation_reason = input\.moderation_reason;/);
  });

  // ═══ 10. ROUTE WIRING (source guards) ═══════════════════════════════════════════════════════════
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
  await check("empleos server: reversal read is wired and read-only", () => {
    const s = raw("app/admin/_lib/adminEmpleosStaffActionsServer.ts");
    assert.match(s, /empleosStaffActionNeedsReversalCheck\(action, rowState\)/);
    assert.match(s, /paymentReversed/);
    assert.ok(!/leonix_payment_records"\)\s*\.(update|insert)/.test(s));
  });
  await check("feature (promote) / verify never change publication state - every lane route + the Empleos decision", () => {
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
        assert.match(m[2], /patch\.(admin_promoted|promoted|leonix_verified)\s*=\s*(true|false)/);
      }
      assert.equal(n, 4, `${file} has all four cases`);
    }
    const a = raw("app/api/admin/autos/listings/[id]/route.ts");
    for (const action of ["promote_on", "promote_off", "verify_on", "verify_off"]) {
      const m = a.match(new RegExp(`action === "${action}"\\) \\{([\\s\\S]*?)\\}`));
      assert.ok(m, action);
      assert.ok(!forbidden.test(m![1]), `autos ${action}`);
    }
    for (const action of ["promote_on", "promote_off", "verify_on", "verify_off"] as const) {
      const d = emp.decideEmpleosStaffAction({ action, row: { lifecycle_status: "paused", lane: "quick", published_at: null }, now: "2026-09-18T00:00:00Z" });
      assert.ok(d.ok && d.lifecycle === false, action);
      assert.deepEqual(Object.keys(d.ok ? d.patch : {}).filter((k) => !["updated_at", "admin_promoted", "leonix_verified", "verified_employer"].includes(k)), [], action);
      assert.ok(d.ok && !("lifecycle_status" in d.patch));
    }
    // comida / ofertas expose no feature / verify action at all
    assert.ok(!(comida.COMIDA_LOCAL_ADMIN_ACTIONS as readonly string[]).some((x) => /promote|verify/.test(x)));
    assert.ok(!(ofertasMsgs.OFERTAS_LOCALES_ADMIN_REVIEW_ACTIONS as readonly string[]).some((x) => /promote|verify/.test(x)));
  });
  await check("no Admin lane route writes payment / entitlement / subscription truth (no such table, column or field is written)", () => {
    const files = [
      "app/api/admin/clasificados/listings/[id]/route.ts",
      "app/api/admin/autos/listings/[id]/route.ts",
      "app/api/admin/servicios/listings/[id]/route.ts",
      "app/api/admin/restaurantes/listings/[id]/route.ts",
      "app/api/admin/viajes/listings/[id]/route.ts",
      "app/api/admin/viajes/staged-listings/moderate/route.ts",
      "app/api/admin/comida-local/listings/[id]/route.ts",
      "app/api/admin/empleos/listings/[id]/route.ts",
      "app/api/admin/ofertas-locales/listings/[id]/route.ts",
      "app/lib/clasificados/comida-local/comidaLocalAdminModeration.ts",
      "app/admin/_lib/adminEmpleosStaffActions.ts",
      "app/admin/_lib/adminEmpleosStaffActionsServer.ts",
      "app/admin/_lib/adminPaymentSuspensionPolicy.ts",
      "app/admin/_lib/adminPaymentSuspensionPolicyServer.ts",
    ];
    for (const f of files) {
      const s = raw(f);
      assert.ok(!/from\("(leonix_payment_records|listing_package_entitlements|leonix_subscription_records)"\)\s*\.(insert|update|upsert|delete)/.test(s), `${f} writes commercial tables`);
      assert.ok(!/\b(payment_status|entitlement_status|package_entitlement_id|payment_record_id)\s*:\s*["'`]/.test(s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")) || f.endsWith("comidaLocalAdminModeration.ts"), `${f} writes a payment field`);
    }
    // Comida moderation reads payment_status only to REFUSE; no patch key is a payment field.
    const cm = raw("app/lib/clasificados/comida-local/comidaLocalAdminModeration.ts");
    assert.ok(!/patch: \{[^}]*payment_status/.test(cm));
  });

  await check("same UUID always: Admin lane routes / movers only UPDATE by id - none inserts, upserts or re-keys a listing row", () => {
    const files = [
      "app/api/admin/clasificados/listings/[id]/route.ts",
      "app/api/admin/autos/listings/[id]/route.ts",
      "app/api/admin/servicios/listings/[id]/route.ts",
      "app/api/admin/restaurantes/listings/[id]/route.ts",
      "app/api/admin/viajes/listings/[id]/route.ts",
      "app/api/admin/comida-local/listings/[id]/route.ts",
      "app/lib/clasificados/comida-local/comidaLocalAdminModeration.ts",
      "app/admin/_lib/adminEmpleosStaffActionsServer.ts",
      "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts",
    ];
    for (const f of files) {
      const s = raw(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      assert.ok(!/\.(insert|upsert)\(/.test(s), `${f} inserts / upserts`);
      if (!f.includes("ofertas")) assert.ok(!/patch\.expires_at\s*=|update\(\{[^}]*expires_at/.test(s), `${f} writes a term`);
    }
    for (const f of files.filter((x) => x.startsWith("app/api/admin"))) {
      assert.match(raw(f), /\.eq\("id", id\)|applyAdminComidaLocalAction\(/, `${f} scopes writes by id`);
    }
  });

  // ═══ 11. MATRIX DOC ═════════════════════════════════════════════════════════════════════════════
  await check("mutation-authority matrix exists and covers every lane x action with a verdict", () => {
    assert.ok(existsSync(new URL("../docs/admin-os/ADMIN_MUTATION_AUTHORITY_2026-09.md", import.meta.url)));
    const doc = raw("docs/admin-os/ADMIN_MUTATION_AUTHORITY_2026-09.md");
    for (const lane of ["Generic listings", "Bienes Raices FSBO", "Bienes Raices Negocio", "Servicios", "Restaurantes", "Autos Dealer", "Autos Privado", "Empleos", "Comida Local", "Ofertas", "Viajes"]) {
      assert.ok(doc.includes(lane), `lane ${lane}`);
    }
    for (const action of ["publish", "approve", "restore", "republish", "pause", "suspend", "review", "reject", "archive", "sold", "delete", "permanent delete", "feature", "verify"]) {
      assert.ok(new RegExp(`\\|\\s*${action}\\s*\\|`, "i").test(doc), `action row ${action}`);
    }
    assert.match(doc, /PROVEN/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
