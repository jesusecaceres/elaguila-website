/**
 * CLOSEOUT 2 — EMPLEOS ADMIN: ONE lifecycle action system + normalized shell.
 *
 * Executable checks against the real pure decision module and the real shared server function (driven
 * with an injected fake Supabase / audit / revalidate — no network, no writes), plus narrow source
 * guards where behaviour lives in a Next route / server page / client list that cannot be mounted under
 * raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-empleos-admin.ts
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
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CLAS = "app/admin/(dashboard)/workspace/clasificados";
const P = {
  page: `${CLAS}/empleos/page.tsx`,
  client: `${CLAS}/empleos/EmpleosAdminListClient.tsx`,
  rowActions: `${CLAS}/_components/ClassifiedAdminRowActions.tsx`,
  listRoute: "app/api/admin/empleos/listings/route.ts",
  idRoute: "app/api/admin/empleos/listings/[id]/route.ts",
  moderateRoute: "app/api/admin/empleos/listings/moderate/route.ts",
  pure: "app/admin/_lib/adminEmpleosStaffActions.ts",
  server: "app/admin/_lib/adminEmpleosStaffActionsServer.ts",
};

const NOW = "2026-09-19T12:00:00.000Z";
const LIVE_AT = "2026-08-01T00:00:00.000Z";
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// ── fake Supabase: per-table rows, records updates; any op the code under test needs is tolerated ──
type FakeTables = Record<string, Record<string, unknown>[]>;
function fakeSupabase(tables: FakeTables, updates: { table: string; patch: Record<string, unknown>; filters: [string, unknown][] }[]) {
  return {
    from(table: string) {
      const rows = tables[table] ?? [];
      const filters: [string, unknown][] = [];
      const inFilters: [string, unknown[]][] = [];
      let mode: "select" | "update" = "select";
      let patch: Record<string, unknown> = {};
      const matching = () =>
        rows.filter((r) => filters.every(([c, v]) => r[c] === v) && inFilters.every(([c, ids]) => ids.includes(r[c])));
      const b: Record<string, unknown> = {
        select: () => b,
        eq(c: string, v: unknown) {
          filters.push([c, v]);
          return b;
        },
        in(c: string, ids: unknown[]) {
          inFilters.push([c, ids]);
          return b;
        },
        order: () => b,
        limit: () => b,
        is: () => b,
        or: () => b,
        update(p: Record<string, unknown>) {
          mode = "update";
          patch = p;
          return b;
        },
        maybeSingle: () => Promise.resolve({ data: matching()[0] ?? null, error: null }),
        then(onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) {
          if (mode === "update") {
            const hit = matching();
            for (const r of hit) Object.assign(r, patch);
            if (hit.length) updates.push({ table, patch, filters: [...filters] });
            return Promise.resolve({ data: hit.map((r) => ({ id: r.id })), error: null }).then(onF, onR);
          }
          return Promise.resolve({ data: matching(), error: null }).then(onF, onR);
        },
      };
      return b;
    },
  } as never;
}

const listingRow = (over: Record<string, unknown> = {}) => ({
  id: UUID(1),
  slug: "cocinero-1",
  lifecycle_status: "draft",
  lane: "quick",
  published_at: null,
  moderation_reason: null,
  admin_promoted: false,
  leonix_verified: false,
  republish_count: 0,
  republish_override: null,
  ...over,
});
const paymentRow = (over: Record<string, unknown> = {}) => ({
  id: "pay-1",
  listing_id: UUID(1),
  package_key: "empleos_job_post",
  package_tier: null,
  package_entitlement_id: null,
  payment_status: "paid",
  source: "stripe_checkout",
  billing_mode: "one_time",
  stripe_checkout_session_id: "cs_test_1",
  stripe_subscription_id: null,
  amount_paid_cents: 2900,
  amount_total_cents: 2900,
  paid_at: "2026-09-10T00:00:00Z",
  created_at: "2026-09-10T00:00:00Z",
  ...over,
});

async function main() {
  const A = await import("../app/admin/_lib/adminEmpleosStaffActions");
  const S = await import("../app/admin/_lib/adminEmpleosStaffActionsServer");
  const policy = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const shell = await import("../app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell");
  const pub = await import("../app/admin/_lib/publicationSemantics");

  const decide = (action: (typeof A.EMPLEOS_STAFF_ACTIONS)[number], row: Record<string, unknown>, extra: { reason?: unknown; paymentCleared?: boolean | null } = {}) =>
    A.decideEmpleosStaffAction({ action, row: row as never, now: NOW, ...extra });

  // ═══ PURE DECISION — the payment / status precondition ════════════════════════════════════════
  await check("payment: a NEVER-LIVE paid-lane row (quick / premium / unknown lane) cannot be published by Restore -> 409 payment_required", () => {
    for (const lane of ["quick", "premium", "weird", null]) {
      for (const status of ["draft", "pending_review"]) {
        const d = decide("unsuspend", { lifecycle_status: status, lane, published_at: null });
        assert.equal(d.ok, false, `${lane}/${status}`);
        if (!d.ok) {
          assert.equal(d.status, 409);
          assert.equal(d.error, "payment_required");
          assert.match(d.message, /verified payment or a cleared manual payment/);
        }
      }
    }
  });

  await check("payment: publish-like Republish on a never-live paid-lane row is refused the same way (no free publish through Republish)", () => {
    const d = decide("republish", { lifecycle_status: "draft", lane: "quick", published_at: null });
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error, "payment_required");
    const d2 = decide("republish", { lifecycle_status: "pending_review", lane: "premium", published_at: null }, { paymentCleared: false });
    assert.equal(d2.ok, false);
  });

  await check("payment: unknown / unreadable payment truth fails CLOSED (undefined and null are not 'cleared')", () => {
    for (const cleared of [undefined, null, false]) {
      assert.equal(decide("unsuspend", { lifecycle_status: "draft", lane: "quick", published_at: null }, { paymentCleared: cleared }).ok, false);
    }
  });

  await check("payment: a row that WAS live (published_at set) may be restored — moderation marker cleared, original published_at kept", () => {
    const d = decide("unsuspend", { lifecycle_status: "paused", lane: "quick", published_at: LIVE_AT, moderation_reason: "staff_suspended" });
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.patch.lifecycle_status, "published");
      assert.equal(d.patch.moderation_reason, null);
      assert.ok(!("published_at" in d.patch), "original published_at is never rewritten");
      assert.equal(d.lifecycle, true);
    }
    // an owner-archived live post can be reopened by staff too
    assert.equal(decide("unsuspend", { lifecycle_status: "archived", lane: "premium", published_at: LIVE_AT }).ok, true);
  });

  await check("payment: a paid-lane row with a VERIFIED paid record may be published (payment is verified, not fabricated); published_at stamped once", () => {
    const d = decide("unsuspend", { lifecycle_status: "pending_review", lane: "quick", published_at: null }, { paymentCleared: true });
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.patch.lifecycle_status, "published");
      assert.equal(d.patch.published_at, NOW);
    }
  });

  await check("payment: feria (free lane) rows may be published by staff; published_at is stamped when missing", () => {
    assert.equal(policy.isEmpleosFreeLane("feria"), true);
    for (const status of ["draft", "pending_review", "rejected", "paused"]) {
      const d = decide("unsuspend", { lifecycle_status: status, lane: "feria", published_at: null });
      assert.equal(d.ok, true, status);
      if (d.ok) assert.equal(d.patch.published_at, NOW);
    }
  });

  await check("payment: an already-live row is never blocked (Restore is a no-op clear, Republish just bumps the order)", () => {
    assert.equal(decide("unsuspend", { lifecycle_status: "published", lane: "quick", published_at: null }).ok, true);
    const d = decide("republish", { lifecycle_status: "published", lane: "quick", published_at: LIVE_AT, republish_count: 2 });
    assert.equal(d.ok, true);
    if (d.ok) {
      assert.equal(d.lifecycle, false);
      assert.equal(d.patch.republish_count, 3);
      assert.equal(d.patch.last_republished_source, "admin");
      assert.ok(!("lifecycle_status" in d.patch));
    }
  });

  await check("payment: the payment check is requested ONLY for publish-like actions on never-live paid rows", () => {
    const paidDraft = { lifecycle_status: "draft", lane: "quick", published_at: null };
    assert.equal(A.empleosStaffActionNeedsPaymentCheck("unsuspend", paidDraft as never), true);
    assert.equal(A.empleosStaffActionNeedsPaymentCheck("republish", paidDraft as never), true);
    for (const a of ["suspend", "archive", "reject", "send_to_review", "promote_on", "verify_on"] as const) {
      assert.equal(A.empleosStaffActionNeedsPaymentCheck(a, paidDraft as never), false, a);
    }
    assert.equal(A.empleosStaffActionNeedsPaymentCheck("unsuspend", { lifecycle_status: "draft", lane: "feria", published_at: null } as never), false);
    assert.equal(A.empleosStaffActionNeedsPaymentCheck("unsuspend", { lifecycle_status: "paused", lane: "quick", published_at: LIVE_AT } as never), false);
    assert.equal(A.empleosStaffActionNeedsPaymentCheck("unsuspend", { lifecycle_status: "published", lane: "quick", published_at: null } as never), false);
  });

  await check("UI hint: Restore explains the payment block for a never-live paid row and only then", () => {
    assert.match(A.empleosStaffRestoreBlockedReason({ lifecycle_status: "draft", lane: "quick", published_at: null }, false) ?? "", /verified payment/);
    assert.equal(A.empleosStaffRestoreBlockedReason({ lifecycle_status: "draft", lane: "quick", published_at: null }, true), null);
    assert.equal(A.empleosStaffRestoreBlockedReason({ lifecycle_status: "draft", lane: "feria", published_at: null }, false), null);
    assert.equal(A.empleosStaffRestoreBlockedReason({ lifecycle_status: "paused", lane: "quick", published_at: LIVE_AT }, false), null);
    assert.equal(A.empleosStaffRestoreBlockedReason({ lifecycle_status: "published", lane: "quick", published_at: null }, false), null);
  });

  // ═══ PURE DECISION — ONE action set incl. the legacy capabilities ═════════════════════════════
  await check("single action set: suspend / reject / send_to_review each write a moderation marker; Restore clears it", () => {
    const s = decide("suspend", { lifecycle_status: "published", lane: "quick", published_at: LIVE_AT });
    assert.equal(s.ok && s.patch.lifecycle_status, "paused");
    assert.equal(s.ok && s.patch.moderation_reason, "staff_suspended");
    const r = decide("reject", { lifecycle_status: "pending_review", lane: "quick", published_at: null }, { reason: "  Spam   posting \n" });
    assert.equal(r.ok && r.patch.lifecycle_status, "rejected");
    assert.equal(r.ok && r.patch.moderation_reason, "Spam posting", "reason normalized");
    const rDefault = decide("reject", { lifecycle_status: "published", lane: "quick", published_at: LIVE_AT });
    assert.equal(rDefault.ok && rDefault.patch.moderation_reason, "staff_rejected");
    const v = decide("send_to_review", { lifecycle_status: "published", lane: "feria", published_at: LIVE_AT }, { reason: "needs ID check" });
    assert.equal(v.ok && v.patch.lifecycle_status, "pending_review");
    assert.equal(v.ok && v.patch.moderation_reason, "needs ID check");
    assert.equal(decide("send_to_review", { lifecycle_status: "paused", lane: "feria", published_at: LIVE_AT }).ok, true);
    assert.equal((decide("send_to_review", { lifecycle_status: "paused", lane: "feria", published_at: LIVE_AT }) as { patch: Record<string, unknown> }).patch.moderation_reason, "staff_review");
    const a = decide("archive", { lifecycle_status: "published", lane: "quick", published_at: LIVE_AT });
    assert.equal(a.ok && a.patch.lifecycle_status, "archived");
  });

  await check("single action set: an archived row cannot be suspended / rejected / sent to review (409 invalid_transition)", () => {
    for (const a of ["suspend", "reject", "send_to_review"] as const) {
      const d = decide(a, { lifecycle_status: "archived", lane: "quick", published_at: LIVE_AT });
      assert.equal(d.ok, false, a);
      if (!d.ok) assert.equal(d.error, "invalid_transition");
    }
    const rep = decide("republish", { lifecycle_status: "archived", lane: "quick", published_at: LIVE_AT });
    assert.equal(rep.ok, false);
    if (!rep.ok) assert.equal(rep.error, "cannot_republish_archived");
    const off = decide("republish", { lifecycle_status: "published", lane: "quick", published_at: LIVE_AT, republish_override: false });
    assert.equal(off.ok, false);
    if (!off.ok) assert.equal(off.error, "republish_not_eligible");
  });

  await check("trust flags: promote / verify keep their patches and do not touch the lifecycle", () => {
    const row = { lifecycle_status: "draft", lane: "quick", published_at: null };
    const on = decide("verify_on", row);
    assert.ok(on.ok && on.patch.leonix_verified === true && on.patch.verified_employer === true && !("lifecycle_status" in on.patch) && !on.lifecycle);
    const off = decide("verify_off", row);
    assert.ok(off.ok && off.patch.leonix_verified === false && off.patch.verified_employer === false);
    assert.ok(decide("promote_on", row).ok);
    const po = decide("promote_off", row);
    assert.ok(po.ok && po.patch.admin_promoted === false);
  });

  await check("action vocabulary: exactly the canonical set; unknown / legacy names are rejected; legacy statuses map onto it", () => {
    assert.deepEqual([...A.EMPLEOS_STAFF_ACTIONS].sort(), ["archive", "promote_off", "promote_on", "reject", "republish", "send_to_review", "suspend", "unsuspend", "verify_off", "verify_on"]);
    for (const bad of ["publish", "published", "moderate", "", null, 3, undefined]) assert.equal(A.isEmpleosStaffAction(bad), false);
    assert.equal(A.legacyEmpleosStatusToAction("published"), "unsuspend");
    assert.equal(A.legacyEmpleosStatusToAction("pending_review"), "send_to_review");
    assert.equal(A.legacyEmpleosStatusToAction("paused"), "suspend");
    assert.equal(A.legacyEmpleosStatusToAction("archived"), "archive");
    assert.equal(A.legacyEmpleosStatusToAction("rejected"), "reject");
    assert.equal(A.legacyEmpleosStatusToAction("draft"), null, "draft is not a staff action");
    assert.equal(A.legacyEmpleosStatusToAction("constructor"), null, "no prototype keys");
    assert.equal(A.legacyEmpleosStatusToAction("anything"), null);
  });

  await check("round-1 owner policy still holds against the staff markers: every staff hold blocks owner self-resume, a lifted hold does not", () => {
    for (const action of ["suspend", "reject", "send_to_review"] as const) {
      const d = decide(action, { lifecycle_status: "published", lane: "feria", published_at: LIVE_AT });
      assert.ok(d.ok);
      if (!d.ok) return;
      const held = policy.resolveEmpleosOwnerTransition({
        lane: "feria",
        current: d.patch.lifecycle_status as string,
        next: "published",
        hasStaffReason: Boolean(String(d.patch.moderation_reason ?? "").trim()),
        everPublished: true,
      });
      assert.equal(held.ok, false, action);
    }
    const restored = decide("unsuspend", { lifecycle_status: "paused", lane: "quick", published_at: LIVE_AT, moderation_reason: "staff_suspended" });
    assert.ok(restored.ok && restored.patch.moderation_reason === null);
  });

  // ═══ SHARED SERVER FUNCTION — driven with a fake Supabase ═════════════════════════════════════
  type Audit = { action: string; targetType: string; targetId: string; meta: Record<string, unknown> };
  const harness = (row: Record<string, unknown>, payments: Record<string, unknown>[] = []) => {
    const updates: { table: string; patch: Record<string, unknown>; filters: [string, unknown][] }[] = [];
    const audits: Audit[] = [];
    const revalidated: string[] = [];
    const tables: FakeTables = {
      empleos_public_listings: [row],
      leonix_payment_records: payments,
      listing_package_entitlements: [],
      leonix_subscription_records: [],
    };
    const deps = {
      supabase: fakeSupabase(tables, updates),
      audit: async (e: Audit) => {
        audits.push(e);
      },
      revalidate: (p: string) => {
        revalidated.push(p);
      },
    };
    return { updates, audits, revalidated, deps, tables };
  };

  await check("server: unpaid paid-lane draft + Restore => 409 payment_required, NO update, NO audit, NO revalidate", async () => {
    const h = harness(listingRow({ lifecycle_status: "draft", lane: "quick" }));
    const res = await S.runEmpleosStaffAction({ id: UUID(1), action: "unsuspend" }, h.deps);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, "payment_required");
    assert.equal(h.updates.length, 0);
    assert.equal(h.audits.length, 0);
    assert.equal(h.revalidated.length, 0);
  });

  await check("server: the payment truth is READ from leonix_payment_records — a 'pending' record is not cleared, a 'paid' one is", async () => {
    const pendingH = harness(listingRow({ lifecycle_status: "pending_review", lane: "premium" }), [paymentRow({ payment_status: "pending", paid_at: null })]);
    const pendingRes = await S.runEmpleosStaffAction({ id: UUID(1), action: "unsuspend" }, pendingH.deps);
    assert.equal(pendingRes.status, 409);
    assert.equal(pendingH.updates.length, 0);

    const noneH = harness(listingRow({ lifecycle_status: "draft", lane: "quick" }), []);
    assert.equal((await S.runEmpleosStaffAction({ id: UUID(1), action: "republish" }, noneH.deps)).status, 409);

    const paidH = harness(listingRow({ lifecycle_status: "pending_review", lane: "premium" }), [paymentRow()]);
    const paidRes = await S.runEmpleosStaffAction({ id: UUID(1), action: "unsuspend" }, paidH.deps);
    assert.equal(paidRes.status, 200, JSON.stringify(paidRes.body));
    assert.equal(paidH.updates.length, 1);
    assert.equal(paidH.updates[0].patch.lifecycle_status, "published");
    assert.equal(paidH.updates[0].patch.published_at, paidRes.body.published_at);
  });

  await check("server: feria draft + Restore => 200, audit row written (empleos_admin_unsuspend), public + admin paths revalidated", async () => {
    const h = harness(listingRow({ lifecycle_status: "draft", lane: "feria" }));
    const res = await S.runEmpleosStaffAction({ id: UUID(1), action: "unsuspend" }, h.deps);
    assert.equal(res.status, 200);
    assert.equal(res.body.lifecycle_status, "published");
    assert.equal(h.updates.length, 1);
    assert.equal(h.audits.length, 1);
    assert.equal(h.audits[0].action, "empleos_admin_unsuspend");
    assert.equal(h.audits[0].targetType, "empleos_public_listing");
    assert.equal(h.audits[0].targetId, UUID(1));
    assert.equal(h.audits[0].meta.previous_status, "draft");
    assert.ok(h.revalidated.includes("/clasificados/empleos/cocinero-1"));
    assert.ok(h.revalidated.includes("/admin/workspace/clasificados/empleos"));
  });

  await check("server: staff suspend -> marker; lifting it (Restore of a row that was live) clears the marker and keeps published_at", async () => {
    const h = harness(listingRow({ lifecycle_status: "published", lane: "quick", published_at: LIVE_AT }));
    const s = await S.runEmpleosStaffAction({ id: UUID(1), action: "suspend" }, h.deps);
    assert.equal(s.status, 200);
    assert.equal(h.tables.empleos_public_listings[0].moderation_reason, "staff_suspended");
    assert.equal(h.tables.empleos_public_listings[0].lifecycle_status, "paused");
    const r = await S.runEmpleosStaffAction({ id: UUID(1), action: "unsuspend" }, h.deps);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(h.tables.empleos_public_listings[0].lifecycle_status, "published");
    assert.equal(h.tables.empleos_public_listings[0].moderation_reason, null);
    assert.equal(h.tables.empleos_public_listings[0].published_at, LIVE_AT);
    assert.deepEqual(h.audits.map((a) => a.action), ["empleos_admin_suspend", "empleos_admin_unsuspend"]);
  });

  await check("server: reject / send_to_review (the legacy capabilities) go through the same function with a reason and an audit row", async () => {
    const h = harness(listingRow({ lifecycle_status: "published", lane: "quick", published_at: LIVE_AT }));
    const rej = await S.runEmpleosStaffAction({ id: UUID(1), action: "reject", reason: "Fake employer" }, h.deps);
    assert.equal(rej.status, 200);
    assert.equal(h.tables.empleos_public_listings[0].lifecycle_status, "rejected");
    assert.equal(h.tables.empleos_public_listings[0].moderation_reason, "Fake employer");
    const rev = await S.runEmpleosStaffAction({ id: UUID(1), action: "send_to_review", reason: "Second look" }, h.deps);
    assert.equal(rev.status, 200);
    assert.equal(h.tables.empleos_public_listings[0].lifecycle_status, "pending_review");
    assert.deepEqual(h.audits.map((a) => a.action), ["empleos_admin_reject", "empleos_admin_send_to_review"]);
    assert.equal(h.audits[0].meta.reason, "Fake employer");
  });

  await check("server: the payment record is not read for actions that cannot publish", async () => {
    const h = harness(listingRow({ lifecycle_status: "draft", lane: "quick" }));
    let reads = 0;
    const deps = { ...h.deps, paymentCleared: async () => (reads++, true) };
    for (const action of ["promote_on", "verify_on", "suspend", "reject", "archive"]) {
      const res = await S.runEmpleosStaffAction({ id: UUID(1), action }, deps);
      assert.equal(res.status, 200, action);
    }
    assert.equal(reads, 0);
  });

  await check("server: unknown row => 404; bad action / missing id => 400; a status changed under the actor => 409 state_changed (no blind overwrite)", async () => {
    const h = harness(listingRow());
    assert.equal((await S.runEmpleosStaffAction({ id: UUID(99), action: "archive" }, h.deps)).status, 404);
    assert.equal((await S.runEmpleosStaffAction({ id: UUID(1), action: "publish" }, h.deps)).status, 400);
    assert.equal((await S.runEmpleosStaffAction({ id: "", action: "archive" }, h.deps)).status, 400);
    // stale read: the decision is made against 'draft', but the stored row has moved on (webhook / owner)
    const stale = harness(listingRow({ lifecycle_status: "draft", lane: "feria" }));
    const realGet = (stale.tables.empleos_public_listings[0] as { lifecycle_status: string });
    const supa = stale.deps.supabase as unknown as { from: (t: string) => Record<string, (...a: unknown[]) => unknown> };
    const origFrom = supa.from.bind(supa);
    let flipped = false;
    (supa as { from: unknown }).from = (t: string) => {
      const b = origFrom(t) as Record<string, (...a: unknown[]) => unknown>;
      const origMaybe = b.maybeSingle;
      b.maybeSingle = () => {
        const p = origMaybe();
        if (!flipped && t === "empleos_public_listings") {
          flipped = true;
          return (p as Promise<unknown>).then((r) => {
            const snapshot = JSON.parse(JSON.stringify(r));
            realGet.lifecycle_status = "published"; // moved on after our read
            return snapshot;
          });
        }
        return p;
      };
      return b;
    };
    const res = await S.runEmpleosStaffAction({ id: UUID(1), action: "archive" }, stale.deps);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, "state_changed");
    assert.equal(stale.audits.length, 0);
  });

  // ═══ publication truth for the row card ═══════════════════════════════════════════════════════
  await check("listing truth: an unpaid paid-lane draft reads 'waiting for payment', published reads PUBLIC, pending_review shows its own reason", () => {
    assert.equal(pub.classifyPublication("empleos_public_listings", { lifecycle_status: "draft" }).semantic, "NOT_PUBLIC_PAYMENT");
    assert.equal(pub.classifyPublication("empleos_public_listings", { lifecycle_status: "published" }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("empleos_public_listings", { lifecycle_status: "pending_review", moderation_reason: "staff_review" }).reason, "staff_review");
    assert.ok(shell.adminStatusOptionsForCategory("empleos").map((o) => o.value).includes("pending_review"));
    assert.deepEqual(
      shell.adminStatusOptionsForCategory("empleos").map((o) => o.value).sort(),
      ["archived", "draft", "paused", "pending_review", "published", "rejected"],
    );
  });

  // ═══ RENDERED shell pieces with Empleos props ═════════════════════════════════════════════════
  let renderOk = true;
  let html: (el: unknown) => string = () => "";
  let h: (t: unknown, p?: unknown, ...c: unknown[]) => unknown = () => null;
  try {
    const React = await import("react");
    (globalThis as unknown as { React: unknown }).React = React;
    const server = await import("react-dom/server");
    h = (t, p, ...c) => React.createElement(t as never, p as never, ...(c as never[]));
    html = (el) => server.renderToStaticMarkup(el as never);
  } catch {
    renderOk = false;
  }
  if (renderOk) {
    const header = await import("../app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader");
    const filterBar = await import("../app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminCategoryFilterBar");
    const sections = await import("../app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminListingCardSections");

    await check("render: header is scope-aware for Empleos and keeps Public / Publish links + the source under Advanced", () => {
      assert.equal(header.resolveCategoryHeaderTitle({ categoryName: "Empleos", scope: "live" }), "Empleos — Live");
      assert.equal(header.resolveCategoryHeaderTitle({ categoryName: "Empleos", scope: "queue" }), "Empleos — Queue");
      const out = html(
        h(header.ClasificadosQueueHeader, {
          categoryName: "Empleos",
          scope: "live",
          sourceTable: "public.empleos_public_listings",
          publicHref: "/clasificados/empleos",
          publishHref: "/clasificados/publicar/empleos",
          queueHref: "/admin/workspace/clasificados/empleos",
          liveHref: "/admin/workspace/clasificados/empleos?scope=live",
        }),
      );
      assert.match(out, /Empleos — Live/);
      assert.match(out, /data-testid="clasificados-header-public"/);
      assert.match(out, /data-testid="clasificados-header-publish"/);
      assert.match(out, /clasificados-header-advanced/);
    });

    await check("render: filter bar — status <select> with the Empleos vocabulary, Owner, Leonix Ad ID, Limit, the lane filter owned by the child (no duplicate hidden lane)", () => {
      const out = html(
        h(
          filterBar.AdminCategoryFilterBar,
          {
            action: "/admin/workspace/clasificados/empleos",
            searchParams: { scope: "live", q: "cook", status: "pending_review", lane: "quick", limit: "100" },
            statusOptions: shell.adminStatusOptionsForCategory("empleos"),
            clearHref: "/admin/workspace/clasificados/empleos",
            extraFieldNames: ["lane"],
          },
          h("select", { name: "lane", defaultValue: "quick" }, h("option", { value: "quick" }, "Quick")),
        ),
      );
      assert.match(out, /<select name="status"/);
      assert.match(out, /<option value="pending_review" selected/);
      assert.match(out, /<option value="rejected"/);
      assert.match(out, /name="owner"/);
      assert.match(out, /name="leonix_ad_id"/);
      assert.match(out, /<option value="100" selected/);
      assert.match(out, /<input type="hidden" name="scope" value="live"/);
      assert.ok(!/type="hidden" name="lane"/.test(out));
      assert.match(out, /<select name="lane"/);
    });

    await check("render: an Empleos row card — listing truth explains the unpaid draft; commercial truth never claims paid without a record", () => {
      const truth = pub.classifyPublication("empleos_public_listings", { lifecycle_status: "draft" });
      const out = html(
        h(sections.AdminListingCardSections, {
          listingTruth: h(sections.AdminListingTruthSection, { status: "draft", truth }),
          commercialTruth: h(sections.AdminCommercialTruthSection, { truth: { listingId: UUID(1), state: "no_payment_record", entitlementStatus: null, subscriptionStatus: null, unreadable: [] } }),
          performance: h("div", null, "Applications: 3"),
          actions: h("i", null, "ACTIONS"),
        }),
      );
      assert.match(out, /waiting|payment/i);
      assert.match(out, /No payment record/i);
      assert.ok(!/>Paid</i.test(out));
      const order = ["listing", "commercial", "performance", "actions"].map((k) => out.indexOf(`admin-card-section-${k}`));
      assert.ok(order.every((i) => i >= 0) && order.every((v, i) => i === 0 || order[i - 1] < v), "section order");
    });
  } else {
    console.log("SKIP: render checks (react-dom/server unavailable)");
  }

  // ═══ SOURCE GUARDS ════════════════════════════════════════════════════════════════════════════
  await check("ONE action system: the page no longer carries the legacy Pub/Review/Pause/Arch/Reject buttons or any /moderate call", () => {
    for (const rel of [P.page, P.client]) {
      const src = strip(raw(rel));
      assert.ok(!/listings\/moderate/.test(src), `${rel}: no call to the legacy moderate route`);
      assert.ok(!/async function moderate\(/.test(src) && !/void moderate\(/.test(src), `${rel}: no legacy moderate()`);
      assert.ok(!/>\s*(Pub|Arch|Pause)\s*</.test(src), `${rel}: no legacy button labels`);
      assert.ok(!/method:\s*"POST"/.test(src), `${rel}: no POST lifecycle call`);
    }
    const client = strip(raw(P.client));
    assert.equal((client.match(/<ClassifiedAdminRowActions/g) ?? []).length, 1, "exactly one row-action component per row");
    assert.match(client, /variant="empleos"/);
    assert.match(client, /extraActions=\{extraActions\}/);
    assert.match(client, /action: "send_to_review"/);
    assert.match(client, /action: "reject"/);
  });

  await check("row actions: additive props only; every action (incl. reject / send_to_review) uses the SAME empleos PATCH url; reason is sent", () => {
    const src = raw(P.rowActions);
    assert.match(src, /case "empleos":\s*\n\s*return `\/api\/admin\/empleos\/listings\/\$\{id\}`/);
    assert.match(src, /extraActions\?: ReadonlyArray</);
    assert.match(src, /restoreDisabledReason\?: string \| null/);
    assert.match(src, /JSON\.stringify\(\{ action, \.\.\.\(extraBody \?\? \{\}\) \}\)/);
    assert.match(src, /window\.prompt\(/);
    assert.match(src, /Boolean\(restoreDisabledReason\)/);
    // round-1 / d3ed73ab wiring untouched
    assert.match(src, /variant: ClassifiedStaffOpsVariant/);
    assert.match(src, /runConfirmed\(\s*"republish"/);
    assert.match(src, /"unsuspend"/);
    assert.match(src, /"promote_off"/);
    assert.match(src, /"verify_on"/);
  });

  await check("canonical route: cookie auth via requireAdminCookie, NO lifecycle logic of its own — delegates to the shared function (audit + preconditions live there)", () => {
    const src = strip(raw(P.idRoute));
    assert.match(src, /requireAdminCookie\(jar\)/);
    assert.match(src, /runEmpleosStaffAction\(/);
    assert.ok(!/\.update\(/.test(src) && !/lifecycle_status\s*=/.test(src), "no update / status writes in the route");
    assert.ok(!/from\("empleos_public_listings"\)/.test(src));
    const server = strip(raw(P.server));
    assert.match(server, /appendAdminAuditLog/);
    assert.match(server, /decideEmpleosStaffAction\(/);
    assert.match(server, /\.eq\("lifecycle_status", rowState\.lifecycle_status\)/, "optimistic status guard");
    assert.ok((server.match(/\.update\(/g) ?? []).length === 1, "exactly one write in the shared function");
    assert.ok(!/payment_status:\s*"paid"|\.insert\(|\.upsert\(/.test(server), "never writes or fabricates payment truth");
  });

  await check("legacy /moderate route is a thin delegate: requireAdminCookie, same shared function, no second lifecycle writer", () => {
    const src = strip(raw(P.moderateRoute));
    assert.match(src, /requireAdminCookie\(jar\)/);
    assert.match(src, /runEmpleosStaffAction\(/);
    assert.match(src, /legacyEmpleosStatusToAction\(/);
    assert.ok(!/updateEmpleosListingLifecycleAdmin/.test(src), "no direct lifecycle writer");
    assert.ok(!/req\.cookies\.get\("leonix_admin"\)/.test(src), "cookie auth goes through the shared helper");
    assert.ok(!/\.update\(/.test(src));
    // no admin route reaches the raw lifecycle writer any more
    for (const rel of [P.idRoute, P.moderateRoute, P.listRoute]) assert.ok(!/updateEmpleosListingLifecycleAdmin/.test(strip(raw(rel))), rel);
  });

  await check("list API: status / owner / Leonix Ad ID / lane / q run in ONE predicate BEFORE the row limit; commercial + publication truth returned with the rows", () => {
    const src = raw(P.listRoute);
    const built = src.indexOf("rowFilter = (r) =>");
    const fetched = src.indexOf("fetchAllEmpleosListingsForAdmin({ limit, scope, rowFilter })");
    assert.ok(built > 0 && fetched > built, "filter built before the fetch (the limit applies after filtering)");
    assert.ok(!/rows = rows\.filter\(\(r\) => \{\s*const job = rowToJobRecord/.test(src), "old post-limit search filter is gone");
    for (const p of ["statusFilter", "ownerFilter", "leonixAdIdFilter", "laneFilter", "adminRowMatchesOwnerFilter", "adminRowMatchesLeonixAdIdFilter"]) assert.ok(src.includes(p), p);
    assert.match(src, /String\(r\.lane \?\? ""\)\.toLowerCase\(\) !== laneFilter/);
    assert.match(src, /String\(r\.lifecycle_status\)\.toLowerCase\(\) !== statusFilter/);
    assert.match(src, /loadAdminListingCommercialTruth\(\{ category: "empleos"/);
    assert.match(src, /classifyPublication\("empleos_public_listings"/);
    assert.match(src, /restore_blocked_reason: empleosStaffRestoreBlockedReason/);
    assert.match(src, /NextResponse\.json\(\{ ok: true, rows: enriched, commercial \}\)/);
    // applications intelligence preserved
    assert.match(src, /fetchEmpleosApplicationHealthByListingIds\(ids\)/);
    assert.match(src, /application_health: health\.get\(r\.id\)/);
    assert.match(src, /apply_count:/);
    assert.match(src, /view_count:/);
    // read-only: the list route never writes
    assert.ok(!/\.(insert|update|upsert|delete)\(/.test(strip(src)));
  });

  await check("normalized shell: server page uses the round-1 header / summary / filter bar with Empleos props; the client list uses the shared card sections", () => {
    const page = strip(raw(P.page));
    assert.ok(!/^\s*"use client"/.test(raw(P.page)), "page is a server component (summary is a server function)");
    assert.match(page, /categoryName="Empleos"/);
    assert.match(page, /scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(page, /fetchAdminCategorySummary\("empleos"\)/);
    assert.match(page, /<AdminCategorySummaryPanel/);
    assert.match(page, /<AdminCategoryFilterBar/);
    assert.match(page, /adminStatusOptionsForCategory\("empleos"\)/);
    assert.match(page, /extraFieldNames=\{\["lane"\]\}/);
    assert.match(page, /name="lane"/);
    for (const lane of ["quick", "premium", "feria"]) assert.ok(page.includes(`value: "${lane}"`), lane);
    assert.match(page, /sourceTable=\{surface\.sourceTable\}/);
    assert.match(page, /publicHref=\{surface\.publicHref\}/);
    assert.match(page, /publishHref=\{surface\.publishHref\}/);
    assert.match(page, /queueHref=\{/);
    assert.match(page, /liveHref=\{/);
    assert.match(page, /<EmpleosAdminListClient/);
    const client = raw(P.client);
    assert.match(client, /<AdminListingCardSections/);
    assert.match(client, /<AdminListingTruthSection/);
    assert.match(client, /<AdminCommercialTruthSection/);
    assert.match(client, /commercial\[r\.id\]/);
    const truthImports = client.match(/import[^;]*adminListingCommercialTruth"/g) ?? [];
    assert.ok(truthImports.length > 0 && truthImports.every((i) => /import type/.test(i)), "client imports only the TYPE from the server-side loader");
    assert.ok(!/publicationSemantics"/.test(client.replace(/import type \{ PublicationTruth \} from "@\/app\/admin\/_lib\/publicationSemantics";/, "")), "client imports only the PublicationTruth type");
    for (const p of ["q", "status", "owner", "leonix_ad_id", "lane", "limit"]) assert.ok(client.includes(`"${p}"`), p);
  });

  await check("applications intelligence + Public / Publish links preserved (apply_count, health breakdown, views, public view, advertiser panel)", () => {
    const client = raw(P.client);
    for (const p of ["application_health", "apply_count", "view_count", "submitted", "shortlisted", "hired", "View public", "Advertiser panel", "Admin profile"]) {
      assert.ok(client.includes(p), p);
    }
    assert.match(client, /data-testid="empleos-admin-applications"/);
    assert.match(client, /\/clasificados\/empleos\/\$\{r\.slug\}/);
    assert.match(client, /AdminListingMonetizationSummary/, "plan configuration still available (labelled as not payment truth)");
    assert.match(client, /not payment truth/);
  });

  await check("round-1 work intact: lifecycle policy, staff-suspend marker, adminReactivationPolicy wiring, live predicates, no schema/migration touched", () => {
    assert.match(raw("app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy.ts"), /export function isEmpleosFreeLane/);
    assert.match(raw("app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy.ts"), /resolveEmpleosOwnerTransition/);
    assert.match(raw(P.pure), /EMPLEOS_STAFF_SUSPENDED_MARKER = "staff_suspended"/);
    assert.match(raw("app/admin/_lib/adminReactivationPolicy.ts"), /decideAdminReactivation/);
    assert.match(raw("app/api/admin/clasificados/listings/[id]/route.ts"), /decideAdminReactivation\(/);
    assert.match(raw("app/admin/_lib/adminLivePredicates.ts"), /isEmpleosRowPubliclyLive/);
    assert.match(raw(P.pure), /isEmpleosFreeLane/);
  });

  await check("AI moderation stays advisory and nothing here can mark a listing paid", () => {
    for (const rel of [P.pure, P.server, P.idRoute, P.moderateRoute, P.listRoute, P.client, P.page]) {
      const src = strip(raw(rel));
      assert.ok(!/payment_status\s*[:=]\s*["']paid["']/.test(src), `${rel}: no paid write`);
      assert.ok(!/leonix_payment_records"\)\s*\.(insert|update|upsert)/.test(src), rel);
    }
    const b = raw(`${CLAS}/_components/AdminListingFlagTruthBlock.tsx`);
    assert.match(b, /AI_REVIEW_ADVISORY_COPY/);
  });

  if (failures.length) {
    console.error(`\nverify-closeout2-empleos-admin FAILED (${failures.length})`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nverify-closeout2-empleos-admin PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
