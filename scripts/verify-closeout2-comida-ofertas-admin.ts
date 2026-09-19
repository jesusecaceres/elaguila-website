/**
 * CLOSEOUT 2 — COMIDA LOCAL + OFERTAS LOCALES ADMIN: canonical action system, reachable views, normalized shell.
 *
 * Executable checks against the real pure policy / query / mutation modules (with an injected fake Supabase
 * client, no network, no writes) plus narrow source guards where behaviour lives in a server page / route.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-comida-ofertas-admin.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const exists = (rel: string) => existsSync(new URL(`../${rel}`, import.meta.url));

const CLAS = "app/admin/(dashboard)/workspace/clasificados";
const P = {
  comidaPage: `${CLAS}/comida-local/page.tsx`,
  comidaView: `${CLAS}/comida-local/comidaAdminView.ts`,
  comidaActionsOld: `${CLAS}/comida-local/actions.ts`,
  comidaList: "app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx",
  comidaQueries: "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts",
  comidaPolicy: "app/lib/clasificados/comida-local/comidaLocalAdminModeration.ts",
  comidaRoute: "app/api/admin/comida-local/listings/[id]/route.ts",
  ofertasPage: `${CLAS}/ofertas-locales/page.tsx`,
  ofertasView: `${CLAS}/ofertas-locales/ofertasAdminView.ts`,
  ofertasList: `${CLAS}/ofertas-locales/OfertasLocalesAdminReviewList.tsx`,
  ofertasAi: `${CLAS}/ofertas-locales/OfertasLocalesAdminAiItemReviewSection.tsx`,
  ofertasActions: `${CLAS}/ofertas-locales/actions.ts`,
  ofertasMut: "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts",
  ofertasMsgs: "app/lib/ofertas-locales/ofertasLocalesAdminReviewMessages.ts",
  ofertasService: "app/lib/ofertas-locales/ofertasLocalesAdminReviewService.ts",
  ofertasRoute: "app/api/admin/ofertas-locales/listings/[id]/route.ts",
  ofertasLegacyRoute: "app/api/ofertas-locales/admin/[id]/review/route.ts",
  rowActions: `${CLAS}/_components/ClassifiedAdminRowActions.tsx`,
  scopeNav: `${CLAS}/_components/ClasificadosScopeNav.tsx`,
  opStatus: "app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts",
};

// ── chainable PostgREST stand-in: records every call, resolves through `handler` ────────────────────
type Call = [string, unknown[]];
type Resolved = { count?: number | null; data?: unknown; error?: { message: string } | null };
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
                  return Promise.resolve({ count: r.count ?? null, data: r.data ?? null, error: r.error ?? null }).then(resolve, reject);
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
const has = (calls: Call[], method: string, ...args: unknown[]) =>
  calls.some(([m, a]) => m === method && args.every((x, i) => JSON.stringify(a[i]) === JSON.stringify(x)));
const callsOf = (calls: Call[], method: string) => calls.filter(([m]) => m === method);
const updatePayload = (calls: Call[]) => (callsOf(calls, "update")[0]?.[1] as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined;

const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PAST = "2020-01-01T00:00:00Z";
const FUTURE = "2099-01-01T00:00:00Z";

async function main() {
  const policy = await import("../app/lib/clasificados/comida-local/comidaLocalAdminModeration");
  const queries = await import("../app/lib/clasificados/comida-local/comidaLocalAdminQueries");
  const comidaView = await import("../app/admin/(dashboard)/workspace/clasificados/comida-local/comidaAdminView");
  const ofertasView = await import("../app/admin/(dashboard)/workspace/clasificados/ofertas-locales/ofertasAdminView");
  const mut = await import("../app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations");
  const msgs = await import("../app/lib/ofertas-locales/ofertasLocalesAdminReviewMessages");
  const strings = await import("../app/admin/_lib/adminStrings");

  const row = (over: Partial<import("../app/lib/clasificados/comida-local/comidaLocalAdminModeration").ComidaLocalAdminActionRow> = {}) => ({
    status: "published",
    payment_status: "paid",
    published_at: PAST,
    suspended_reason: null,
    ...over,
  });

  // ═══ COMIDA LOCAL — policy ═════════════════════════════════════════════════════════════════════
  await check("comida policy: staff can NEVER publish a never-paid row — draft / pending_payment refuse every action (409 payment_required or invalid transition)", () => {
    for (const status of ["draft", "pending_payment"]) {
      for (const pay of ["pending", "failed", "", "not_required_for_l5b"]) {
        for (const action of policy.COMIDA_LOCAL_ADMIN_ACTIONS) {
          const d = policy.decideComidaLocalAdminAction(action, row({ status, payment_status: pay }));
          assert.equal(d.ok, false, `${action} on ${status}/${pay} must be refused`);
        }
      }
    }
    const d = policy.decideComidaLocalAdminAction("republish", row({ status: "pending_payment", payment_status: "pending" }));
    assert.ok(!d.ok && d.httpStatus === 409 && d.error === "payment_required");
  });

  await check("comida policy: published_at alone is NOT payment proof (column is NOT NULL DEFAULT now(), so an unpaid row already has one)", () => {
    const paused = policy.decideComidaLocalAdminAction("republish", row({ status: "paused", payment_status: "pending", published_at: PAST }));
    assert.ok(!paused.ok && paused.error === "payment_required");
    const suspended = policy.decideComidaLocalAdminAction("unsuspend", row({ status: "suspended", payment_status: "failed", suspended_reason: "moderation" }));
    assert.ok(!suspended.ok && suspended.error === "payment_required");
    assert.equal(policy.comidaLocalRowHasPaymentProof({ payment_status: "pending", published_at: PAST }), false);
    assert.equal(policy.comidaLocalRowHasPaymentProof({ payment_status: "paid" }), true);
    assert.equal(policy.comidaLocalRowHasPaymentProof({ payment_status: "waived" }), true);
    assert.equal(policy.comidaLocalRowHasPaymentProof({ payment_status: "not_required_for_l5b", published_at: PAST }), true, "legacy live row");
    assert.equal(policy.comidaLocalRowHasPaymentProof({ payment_status: "not_required_for_l5b", published_at: null }), false, "legacy row that never went live");
  });

  await check("comida policy: republish (paused, paid) and restore (suspended by staff, paid) are allowed and CAS on the current status", () => {
    const rep = policy.decideComidaLocalAdminAction("republish", row({ status: "paused" }));
    assert.ok(rep.ok && rep.expectStatus === "paused" && rep.patch.status === "published");
    const res = policy.decideComidaLocalAdminAction("unsuspend", row({ status: "suspended", suspended_reason: "moderation" }));
    assert.ok(res.ok && res.expectStatus === "suspended" && res.patch.status === "published" && res.patch.suspended_reason === null);
    assert.ok(res.ok && res.requireNonPaymentReason === true, "restore CAS excludes payment suspensions");
    const legacy = policy.decideComidaLocalAdminAction("unsuspend", row({ status: "suspended", suspended_reason: null }));
    assert.ok(legacy.ok, "a legacy staff suspension with no stored reason is restorable when paid");
  });

  await check("comida policy: a payment-engine suspension ('payment') is NEVER restored by staff — even when paid", () => {
    const d = policy.decideComidaLocalAdminAction("unsuspend", row({ status: "suspended", payment_status: "paid", suspended_reason: "payment" }));
    assert.ok(!d.ok && d.httpStatus === 409 && d.error === "payment_suspended");
    assert.match(d.ok ? "" : d.message, /payment/i);
  });

  await check("comida policy: suspend writes suspended_reason='moderation'; archive is a pause of a published row; transitions are exact", () => {
    const s = policy.decideComidaLocalAdminAction("suspend", row({ status: "published" }));
    assert.ok(s.ok && s.patch.status === "suspended" && s.patch.suspended_reason === "moderation");
    assert.ok(policy.decideComidaLocalAdminAction("suspend", row({ status: "paused" })).ok);
    assert.ok(!policy.decideComidaLocalAdminAction("suspend", row({ status: "suspended" })).ok, "already suspended");
    assert.ok(!policy.decideComidaLocalAdminAction("suspend", row({ status: "draft" })).ok);
    const a = policy.decideComidaLocalAdminAction("archive", row({ status: "published" }));
    assert.ok(a.ok && a.patch.status === "paused");
    assert.ok(!policy.decideComidaLocalAdminAction("archive", row({ status: "paused" })).ok);
    assert.ok(!policy.decideComidaLocalAdminAction("unsuspend", row({ status: "published" })).ok);
    assert.ok(!policy.decideComidaLocalAdminAction("republish", row({ status: "suspended" })).ok, "a suspended row is Restored, not Republished");
  });

  await check("comida policy: no decision ever writes payment_status / payment fields; only table-CHECK statuses are written", () => {
    const statuses = ["published", "paused", "suspended", "draft", "pending_payment", "weird"];
    for (const status of statuses) {
      for (const action of policy.COMIDA_LOCAL_ADMIN_ACTIONS) {
        const d = policy.decideComidaLocalAdminAction(action, row({ status, suspended_reason: "moderation" }));
        if (!d.ok) continue;
        assert.deepEqual(Object.keys(d.patch).filter((k) => !["status", "suspended_reason"].includes(k)), []);
        assert.ok((policy.COMIDA_LOCAL_STATUS_VOCAB as readonly string[]).includes(d.patch.status));
      }
    }
    assert.equal(policy.isComidaLocalAdminAction("published"), false, "the raw dropdown vocabulary is not an action");
    assert.equal(policy.isComidaLocalAdminAction("set_status"), false);
    assert.deepEqual([...policy.COMIDA_LOCAL_ADMIN_ACTIONS].sort(), ["archive", "republish", "suspend", "unsuspend"]);
  });

  // ═══ COMIDA LOCAL — the one mover, against a fake client ════════════════════════════════════════
  type DbRow = Record<string, unknown>;
  const comidaDb = (r: DbRow | null, opts: { updateRows?: number; readError?: boolean; updateError?: string } = {}) =>
    fakeClient((table, calls) => {
      assert.equal(table, "comida_local_public_listings");
      if (calls.some(([m]) => m === "update")) {
        if (opts.updateError) return { error: { message: opts.updateError } };
        return { data: Array.from({ length: opts.updateRows ?? 1 }, () => ({ id: r?.id })) };
      }
      if (opts.readError) return { error: { message: "boom" } };
      return { data: r };
    });
  const base = (over: DbRow = {}): DbRow => ({
    id: UUID(1), slug: "tacos", leonix_ad_id: "COMIDA-2026-000001", status: "paused", payment_status: "paid", published_at: PAST, suspended_reason: null, ...over,
  });

  await check("comida mover: refused actions perform NO write (payment_required / payment_suspended / invalid transition)", async () => {
    for (const [r, action, error] of [
      [base({ status: "pending_payment", payment_status: "pending" }), "republish", "payment_required"],
      [base({ status: "suspended", suspended_reason: "payment" }), "unsuspend", "payment_suspended"],
      [base({ status: "paused", payment_status: "pending" }), "republish", "payment_required"],
      [base({ status: "draft", payment_status: "not_required_for_l5b" }), "suspend", "invalid_status_transition"],
    ] as const) {
      const db = comidaDb(r);
      const res = await queries.applyAdminComidaLocalAction(db.client, UUID(1), action);
      assert.ok(!res.ok && res.error === error && res.httpStatus === 409, `${action}: ${JSON.stringify(res)}`);
      assert.equal(db.seen.flatMap((s) => callsOf(s.calls, "update")).length, 0, "no update issued");
    }
  });

  await check("comida mover: republish (paid, paused) issues ONE compare-and-set update that writes only status + updated_at", async () => {
    const db = comidaDb(base({ status: "paused" }));
    const res = await queries.applyAdminComidaLocalAction(db.client, UUID(1), "republish");
    assert.ok(res.ok && res.fromStatus === "paused" && res.toStatus === "published");
    const upd = db.seen.filter((s) => callsOf(s.calls, "update").length);
    assert.equal(upd.length, 1);
    assert.deepEqual(Object.keys(updatePayload(upd[0].calls)!).sort(), ["status", "updated_at"]);
    assert.ok(has(upd[0].calls, "eq", "status", "paused"), "CAS on the status the decision was made against");
    assert.ok(has(upd[0].calls, "eq", "id", UUID(1)));
  });

  await check("comida mover: restore CAS excludes payment suspensions and clears the reason; suspend writes reason 'moderation'", async () => {
    const restore = comidaDb(base({ status: "suspended", suspended_reason: "moderation" }));
    const rr = await queries.applyAdminComidaLocalAction(restore.client, UUID(1), "unsuspend");
    assert.ok(rr.ok && rr.suspendedReason === null);
    const upd = restore.seen.find((s) => callsOf(s.calls, "update").length)!;
    assert.ok(has(upd.calls, "or", "suspended_reason.is.null,suspended_reason.eq.moderation"), "CAS never matches suspended_reason='payment'");
    assert.deepEqual(updatePayload(upd.calls), { ...updatePayload(upd.calls), status: "published", suspended_reason: null });
    const sus = comidaDb(base({ status: "published" }));
    const sr = await queries.applyAdminComidaLocalAction(sus.client, UUID(1), "suspend");
    assert.ok(sr.ok && sr.suspendedReason === "moderation");
    assert.equal(updatePayload(sus.seen.find((s) => callsOf(s.calls, "update").length)!.calls)!.suspended_reason, "moderation");
  });

  await check("comida mover: zero-row update => 409 no_row_updated (never claimed as success); non-UUID id => 404 with no query; lookup errors are not swallowed", async () => {
    const moved = comidaDb(base({ status: "paused" }), { updateRows: 0 });
    const r1 = await queries.applyAdminComidaLocalAction(moved.client, UUID(1), "republish");
    assert.ok(!r1.ok && r1.error === "no_row_updated" && r1.httpStatus === 409);
    const bad = comidaDb(base());
    const r2 = await queries.applyAdminComidaLocalAction(bad.client, "not-a-uuid", "suspend");
    assert.ok(!r2.ok && r2.httpStatus === 404);
    assert.equal(bad.seen.length, 0);
    const err = comidaDb(null, { readError: true });
    const r3 = await queries.applyAdminComidaLocalAction(err.client, UUID(1), "suspend");
    assert.ok(!r3.ok && r3.httpStatus === 500);
    const missing = comidaDb(null);
    const r4 = await queries.applyAdminComidaLocalAction(missing.client, UUID(1), "suspend");
    assert.ok(!r4.ok && r4.httpStatus === 404);
  });

  // ═══ COMIDA LOCAL — list query ══════════════════════════════════════════════════════════════════
  await check("comida list: status / owner / Ad ID / id filters are SQL (before the limit); live = status published; invalid uuid / status is REPORTED, not swallowed", async () => {
    const f = fakeClient(() => ({ data: [] }));
    await queries.listAdminComidaLocalListingsDetailed(f.client, { scope: "live", status: "PAUSED", owner_user_id: UUID(7), leonix_ad_id: "COMIDA-2026", id: UUID(3), limit: 30 });
    const c = f.seen[0].calls;
    assert.ok(has(c, "eq", "status", "published"), "live scope");
    assert.ok(has(c, "eq", "status", "paused"), "status filter (lower-cased)");
    assert.ok(has(c, "eq", "owner_user_id", UUID(7)));
    assert.ok(has(c, "eq", "id", UUID(3)));
    assert.ok(has(c, "ilike", "leonix_ad_id", "%COMIDA-2026%"), "Ad ID is contains");
    assert.ok(has(c, "limit", 30));
    const badOwner = await queries.listAdminComidaLocalListingsDetailed(fakeClient(() => ({ data: [] })).client, { owner_user_id: "abc" });
    assert.match(badOwner.error ?? "", /owner/);
    const badId = await queries.listAdminComidaLocalListingsDetailed(fakeClient(() => ({ data: [] })).client, { id: "abc" });
    assert.match(badId.error ?? "", /id must be/);
    const badStatus = await queries.listAdminComidaLocalListingsDetailed(fakeClient(() => ({ data: [] })).client, { status: "archived" });
    assert.match(badStatus.error ?? "", /unknown status/, "'archived' is not a status of this table");
    const dbErr = await queries.listAdminComidaLocalListingsDetailed(fakeClient(() => ({ error: { message: "kaput" } })).client, {});
    assert.equal(dbErr.error, "kaput");
  });

  await check("comida list: q search keeps the uuid guard (closeout 1) — id/owner .eq only for a real UUID, text search never errors", async () => {
    const text = fakeClient(() => ({ data: [] }));
    await queries.listAdminComidaLocalListingsDetailed(text.client, { q: "COMIDA-2026-000001" });
    const orArg = String(callsOf(text.seen[0].calls, "or")[0][1][0]);
    assert.match(orArg, /leonix_ad_id\.ilike\.%COMIDA-2026-000001%/);
    assert.ok(!/id\.eq\./.test(orArg), "free text is never .eq on a uuid column");
    const uu = fakeClient(() => ({ data: [] }));
    await queries.listAdminComidaLocalListingsDetailed(uu.client, { q: UUID(9) });
    assert.match(String(callsOf(uu.seen[0].calls, "or")[0][1][0]), new RegExp(`id\\.eq\\.${UUID(9)},owner_user_id\\.eq\\.${UUID(9)}`));
    assert.match(raw(P.comidaQueries), /isUuidSearch \? \[`id\.eq\.\$\{search\}`, `owner_user_id\.eq\.\$\{search\}`\]/);
    const arr = await queries.listAdminComidaLocalListings(fakeClient(() => ({ error: { message: "x" } })).client, {});
    assert.deepEqual(arr, [], "back-compat array form still swallows errors for the global search");
  });

  await check("comida list: select carries suspended_reason (the payment-vs-moderation marker)", () => {
    assert.match(queries.COMIDA_LOCAL_ADMIN_LISTING_SELECT, /suspended_reason/);
  });

  // ═══ COMIDA LOCAL — truth + row actions ═════════════════════════════════════════════════════════
  await check("comida listing truth: payment suspension reads as payment; published rows agree with the public reader (Live = status published)", () => {
    const paySusp = comidaView.comidaListingTruth({ status: "suspended", payment_status: "paid", suspended_reason: "payment" });
    assert.equal(paySusp.semantic, "PAUSED");
    assert.match(paySusp.reason, /payment/i);
    const staffSusp = comidaView.comidaListingTruth({ status: "suspended", payment_status: "paid", suspended_reason: "moderation" });
    assert.equal(staffSusp.semantic, "NOT_PUBLIC_MODERATION");
    assert.match(staffSusp.reason, /moderation/);
    assert.equal(comidaView.comidaListingTruth({ status: "published", payment_status: "paid" }).semantic, "PUBLIC");
    const waived = comidaView.comidaListingTruth({ status: "published", payment_status: "waived" });
    assert.equal(waived.semantic, "PUBLIC", "the public reader shows every status=published row");
    const anomaly = comidaView.comidaListingTruth({ status: "published", payment_status: "pending" });
    assert.equal(anomaly.semantic, "PUBLIC");
    assert.match(anomaly.reason, /anomaly/);
    assert.equal(comidaView.comidaPublishedPaymentAnomaly({ status: "published", payment_status: "pending" }), "pending");
    assert.equal(comidaView.comidaPublishedPaymentAnomaly({ status: "published", payment_status: "paid" }), null);
    assert.equal(comidaView.comidaPublishedPaymentAnomaly({ status: "paused", payment_status: "pending" }), null);
    assert.equal(comidaView.comidaListingTruth({ status: "pending_payment", payment_status: "pending" }).semantic, "NOT_PUBLIC_PAYMENT");
  });

  await check("comida row actions: built from the same policy; refused actions are disabled WITH the reason; there is no publish button", () => {
    const pub = comidaView.comidaRowLifecycleActions(row({ status: "published" }));
    assert.deepEqual(pub.map((a) => a.action), ["suspend", "archive"]);
    assert.ok(pub.every((a) => !a.disabled));
    const paused = comidaView.comidaRowLifecycleActions(row({ status: "paused" }));
    assert.deepEqual(paused.map((a) => a.action), ["republish", "suspend"]);
    const unpaid = comidaView.comidaRowLifecycleActions(row({ status: "pending_payment", payment_status: "pending" }));
    assert.deepEqual(unpaid.map((a) => a.action), ["republish"]);
    assert.equal(unpaid[0].disabled, true);
    assert.match(unpaid[0].reason ?? "", /verified payment/i);
    const paySusp = comidaView.comidaRowLifecycleActions(row({ status: "suspended", suspended_reason: "payment" }));
    assert.deepEqual(paySusp.map((a) => a.action), ["unsuspend"]);
    assert.equal(paySusp[0].disabled, true);
    assert.match(paySusp[0].reason ?? "", /payment system/i);
    const staffSusp = comidaView.comidaRowLifecycleActions(row({ status: "suspended", suspended_reason: "moderation" }));
    assert.equal(staffSusp[0].disabled, false);
    const all = [...pub, ...paused, ...unpaid, ...paySusp, ...staffSusp];
    assert.ok(all.every((a) => a.confirm.length > 20), "every action carries confirmation copy");
    assert.ok(!all.some((a) => /publish$/i.test(a.action) && a.action !== "republish"));
  });

  await check("comida status filter vocabulary = the table's real statuses only (no archived / rejected / pending_review that match nothing)", () => {
    const vals = comidaView.COMIDA_LOCAL_STATUS_FILTER_OPTIONS.map((o) => o.value).sort();
    assert.deepEqual(vals, [...policy.COMIDA_LOCAL_STATUS_VOCAB].sort());
  });

  // ═══ COMIDA LOCAL — source guards ═══════════════════════════════════════════════════════════════
  await check("comida UI: the raw status <select> and its server action are GONE; one admin route with cookie auth, audit and revalidation", () => {
    assert.equal(exists(P.comidaActionsOld), false, "raw status server action removed");
    const list = strip(raw(P.comidaList));
    assert.ok(!/listing_status/.test(list) && !/STATUS_OPTIONS/.test(list) && !/<select/.test(list) && !/statusUpdateAction/.test(list), "no raw status dropdown in the list component");
    const page = strip(raw(P.comidaPage));
    assert.ok(!/updateComidaLocalPublicListingStatusAction/.test(page) && !/statusUpdateAction/.test(page));
    assert.ok(!/updateAdminComidaLocalListingStatus/.test(strip(raw(P.comidaQueries))), "the raw writer is gone");
    const route = strip(raw(P.comidaRoute));
    assert.match(route, /export async function PATCH/);
    assert.match(route, /requireAdminCookie\(jar\)/);
    assert.match(route, /appendAdminAuditLog\(/);
    assert.match(route, /revalidatePath\("\/clasificados\/comida-local"\)/);
    assert.match(route, /applyAdminComidaLocalAction\(/);
    assert.ok(!/\.update\(/.test(route), "the route itself never writes — the one mover does");
    assert.ok(!/["']paid["']/.test(route), "the route never sets anything to paid (payment_status only appears as audit context)");
  });

  await check("comida page: normalized header (Queue/Live), summary, filter bar (status/owner/Ad ID/limit + slug/id), listing + commercial truth, row actions", () => {
    const src = strip(raw(P.comidaPage));
    assert.match(src, /categoryName="Comida Local"/);
    assert.match(src, /scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(src, /queueHref=\{queueHref\}/);
    assert.match(src, /liveHref=\{liveHref\}/);
    assert.match(src, /fetchAdminCategorySummary\("comida-local"\)/);
    assert.match(src, /<AdminCategorySummaryPanel/);
    assert.match(src, /<AdminCategoryFilterBar/);
    assert.match(src, /COMIDA_LOCAL_STATUS_FILTER_OPTIONS/);
    assert.match(src, /listAdminComidaLocalListingsDetailed\(/);
    for (const f of ["status: status || undefined", "owner_user_id: owner || undefined", "leonix_ad_id: leonixAdId || undefined", "limit: queueLimit"]) assert.ok(src.includes(f), f);
    assert.match(src, /loadAdminListingCommercialTruth\(/);
    assert.match(src, /category: "comida-local"/);
    assert.match(src, /comidaListingTruth\(/);
    assert.match(src, /comidaRowLifecycleActions\(/);
    const list = raw(P.comidaList);
    assert.match(list, /<ClassifiedAdminRowActions/);
    assert.match(list, /variant="comida-local"/);
    assert.match(list, /<AdminListingTruthSection/);
    assert.match(list, /<AdminCommercialTruthSection/);
    assert.match(list, /Ver ficha/);
    assert.match(list, /No hay publicaciones de Comida Local todavía/);
    assert.match(raw(P.comidaList), /import type \{ AdminListingCommercialTruthMap \}/, "client-reachable code imports only the TYPE from the server loader");
  });

  // ═══ OFERTAS — views ════════════════════════════════════════════════════════════════════════════
  await check("ofertas scope: queue (default) / live / history are parsed and linked; scope switch keeps filters but drops status vocab that differs per scope", () => {
    const v = ofertasView;
    assert.equal(v.parseOfertasAdminScope({}), "queue");
    assert.equal(v.parseOfertasAdminScope({ scope: "live" }), "live");
    assert.equal(v.parseOfertasAdminScope({ scope: "history" }), "history");
    assert.equal(v.parseOfertasAdminScope({ scope: "bogus" }), "queue");
    const sp = { q: "x", lane: "flyer", term: "expired", commercial: "blocked", status: "rejected", status_group: "archived", owner: "u", scope: "history" };
    const base = "/admin/workspace/clasificados/ofertas-locales";
    const hist = new URL(v.ofertasScopeHref(base, sp, "history"), "https://x.test");
    assert.equal(hist.searchParams.get("scope"), "history");
    for (const [k, val] of Object.entries({ q: "x", lane: "flyer", term: "expired", commercial: "blocked", owner: "u" })) assert.equal(hist.searchParams.get(k), val, k);
    assert.equal(hist.searchParams.get("status"), null);
    assert.equal(hist.searchParams.get("status_group"), null);
    const live = new URL(v.ofertasScopeHref(base, sp, "live"), "https://x.test");
    assert.equal(live.searchParams.get("scope"), "live");
    assert.equal(live.searchParams.get("status_group"), null);
    // `term` has a per-scope vocabulary: Expired exists only in History, so a switch to Live drops it.
    assert.equal(live.searchParams.get("term"), null);
    const queue = new URL(v.ofertasScopeHref(base, sp, "queue"), "https://x.test");
    assert.equal(queue.searchParams.get("scope"), null);
    assert.equal(queue.searchParams.get("lane"), "flyer");
    assert.equal(v.ofertasScopeHref(base, { scope: "history" }, "history"), `${base}?scope=history`);
    assert.equal(v.ofertasScopeHref(base, {}, "queue"), base);
  });

  await check("ofertas history is REACHABLE from the UI: scope nav has an additive History tab; existing Queue/Live callers are unaffected", () => {
    const nav = strip(raw(P.scopeNav));
    assert.match(nav, /historyHref\?: string;/, "optional third scope");
    assert.match(nav, /active: "queue" \| "live" \| "history"/);
    assert.match(nav, /scopeNav\.queue/);
    assert.match(nav, /scopeNav\.live/);
    assert.match(nav, /scopeNav\.history/);
    assert.match(nav, /\{historyHref \? \(/, "no History tab unless a caller passes historyHref");
    const page = strip(raw(P.ofertasPage));
    assert.match(page, /historyHref=\{historyHref\}/);
    assert.match(page, /ofertasScopeHref\(BASE_PATH, sp, "history"\)/);
    assert.match(page, /scope,\n?\s*q: ofertasServerSearchTerm/, "the scope is passed to the data layer");
  });

  await check("ofertas filters: every option of each scope is a REAL operational key / status (none that can never match the scope's rows)", () => {
    const src = raw(P.opStatus);
    const union = src.slice(src.indexOf("export type OfertaLocalAdminOperationalStatusKey"), src.indexOf("export type OfertaLocalOperationalStatus"));
    const keys = new Set([...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
    assert.ok(keys.size >= 15);
    for (const scope of ["queue", "live", "history"] as const) {
      for (const o of ofertasView.OFERTAS_ADMIN_STATUS_GROUP_OPTIONS[scope]) assert.ok(keys.has(o.value), `${scope}: ${o.value} is not an operational key`);
    }
    const queueGroups = ofertasView.OFERTAS_ADMIN_STATUS_GROUP_OPTIONS.queue.map((o) => o.value);
    for (const dead of ["active", "expiring", "expired", "changes_requested", "archived", "activation_incomplete"]) {
      assert.ok(!queueGroups.includes(dead), `Queue can never contain "${dead}" rows (the old filter offered it)`);
    }
    const liveGroups = ofertasView.OFERTAS_ADMIN_STATUS_GROUP_OPTIONS.live.map((o) => o.value);
    assert.deepEqual(liveGroups.filter((v) => ["approval_ready", "source_missing", "archived", "expired"].includes(v)), []);
    const historyGroups = ofertasView.OFERTAS_ADMIN_STATUS_GROUP_OPTIONS.history.map((o) => o.value);
    for (const need of ["changes_requested", "archived", "expired", "activation_incomplete"]) assert.ok(historyGroups.includes(need), need);
    assert.deepEqual(ofertasView.OFERTAS_ADMIN_STATUS_OPTIONS.queue.map((o) => o.value).sort(), ["draft", "pending_review", "submitted"]);
    assert.deepEqual(ofertasView.OFERTAS_ADMIN_STATUS_OPTIONS.live.map((o) => o.value), ["approved"]);
    assert.deepEqual(ofertasView.OFERTAS_ADMIN_STATUS_OPTIONS.history.map((o) => o.value).sort(), ["approved", "archived", "expired", "rejected"]);
    assert.ok(!ofertasView.OFERTAS_ADMIN_TERM_OPTIONS.queue.some((o) => o.value === "expired"), "no Expired term in the Queue");
  });

  await check("ofertas listing truth: classifyPublication + honest correction — approved-in-term but hidden by the public reader is NOT 'live'", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    const live = ofertasView.ofertaListingTruth(
      { status: "approved", published_at: PAST, expires_at: FUTURE, public_source_asset_id: "a", asset_lifecycle_status: "current", offer_type: "weekly_flyer", business_name: "T", title: "T", valid_from: "2026-09-01", valid_until: "2099-12-31" },
      now,
    );
    assert.equal(live.semantic, "PUBLIC");
    const hidden = ofertasView.ofertaListingTruth(
      { status: "approved", published_at: PAST, expires_at: FUTURE, public_source_asset_id: null, offer_type: "weekly_flyer", business_name: "T", title: "T", valid_from: "2026-09-01", valid_until: "2099-12-31" },
      now,
    );
    assert.notEqual(hidden.semantic, "PUBLIC");
    assert.match(hidden.reason, /does not show it/);
    assert.equal(ofertasView.ofertaListingTruth({ status: "rejected" }, now).semantic, "REJECTED");
    assert.equal(ofertasView.ofertaListingTruth({ status: "archived" }, now).semantic, "REMOVED");
    assert.equal(ofertasView.ofertaListingTruth({ status: "approved", published_at: PAST, expires_at: PAST }, now).semantic, "EXPIRED");
    assert.equal(ofertasView.ofertaListingTruth({ status: "pending_review" }, now).semantic, "NOT_PUBLIC_MODERATION");
  });

  // ═══ OFERTAS — actions ══════════════════════════════════════════════════════════════════════════
  await check("ofertas actions: transition table — approve/reject from the queue, restore ONLY from rejected/archived, archive from approved/queue/rejected/expired", () => {
    const a = (s: string) => [...mut.ofertaLocalAdminActionsForStatus(s)].sort();
    for (const s of ["draft", "submitted", "pending_review"]) assert.deepEqual(a(s), ["approve", "archive", "reject"], s);
    assert.deepEqual(a("approved"), ["archive"]);
    assert.deepEqual(a("rejected"), ["archive", "restore"]);
    assert.deepEqual(a("archived"), ["restore"]);
    assert.deepEqual(a("expired"), ["archive"]);
    assert.deepEqual(a("nonsense"), []);
    assert.equal(mut.OFERTAS_LOCALES_RESTORE_TARGET_STATUS, "pending_review", "restore never returns straight to approved");
  });

  const OFFER_ID = UUID(50);
  const offerRow = (over: DbRow = {}): DbRow => ({
    id: OFFER_ID, owner_id: UUID(2), status: "rejected", offer_type: "weekly_flyer", leonix_ad_id: "LNX-ABCDEFGH",
    payment_status: "pending", entitlement_status: null, package_entitlement_id: null, payment_record_id: null,
    published_at: PAST, expires_at: FUTURE, internal_notes: "user note", ...over,
  });
  const ofertasDb = (r: DbRow | null) =>
    fakeClient((table, calls) => {
      if (table === "ofertas_locales") {
        if (calls.some(([m]) => m === "update")) return { data: { id: OFFER_ID } };
        const sel = String(callsOf(calls, "select")[0]?.[1]?.[0] ?? "");
        if (sel.startsWith("public_source_asset_id")) return { data: { public_source_asset_id: "asset1", active_source_asset_id: "asset1", asset_lifecycle_status: "current" } };
        return { data: r };
      }
      if (table === "oferta_local_items") {
        if (calls.some(([m]) => m === "update")) return {};
        return { count: has(calls, "in", "review_status", ["pending", "needs_review"]) ? 0 : 1 };
      }
      if (table === "oferta_local_scan_pages") return { count: 0 };
      return { data: null };
    });
  const ofertasUpdates = (db: ReturnType<typeof ofertasDb>) => db.seen.filter((s) => s.table === "ofertas_locales" && callsOf(s.calls, "update").length);

  await check("ofertas restore: rejected -> pending_review (CAS on rejected); touches NO payment / entitlement / term field; records a restore note", async () => {
    const db = ofertasDb(offerRow({ status: "rejected" }));
    const res = await mut.mutateOfertaLocalAdminReview(db.client, OFFER_ID, "restore", "Owner fixed the flyer");
    assert.ok(res.ok && res.previousStatus === "rejected" && res.newStatus === "pending_review", JSON.stringify(res));
    const upd = ofertasUpdates(db);
    assert.equal(upd.length, 1);
    const payload = updatePayload(upd[0].calls)!;
    assert.equal(payload.status, "pending_review");
    assert.notEqual(payload.status, "approved");
    assert.deepEqual(Object.keys(payload).sort(), ["internal_notes", "status", "updated_at"], "no payment_*, entitlement_*, published_at or expires_at");
    assert.match(String(payload.internal_notes), /"action":"restore"/);
    assert.match(String(payload.internal_notes), /Owner fixed the flyer/);
    assert.ok(has(upd[0].calls, "eq", "status", "rejected"), "compare-and-set on the current status");
  });

  await check("ofertas restore: archived -> pending_review too; approved / pending_review / expired cannot be restored (invalid_transition, no write)", async () => {
    const arch = ofertasDb(offerRow({ status: "archived" }));
    const ra = await mut.mutateOfertaLocalAdminReview(arch.client, OFFER_ID, "restore", null);
    assert.ok(ra.ok && ra.newStatus === "pending_review");
    assert.match(String(updatePayload(ofertasUpdates(arch)[0].calls)!.internal_notes), /Restored to review by staff/, "default note when none is typed");
    for (const status of ["approved", "pending_review", "submitted", "draft", "expired"]) {
      const db = ofertasDb(offerRow({ status }));
      const r = await mut.mutateOfertaLocalAdminReview(db.client, OFFER_ID, "restore", null);
      assert.ok(!r.ok && r.error === "invalid_transition", status);
      assert.equal(ofertasUpdates(db).length, 0, `${status}: no write`);
    }
  });

  await check("ofertas approve stays gated exactly as before: an unpaid offer with no partner courtesy => commercial_entitlement_required, NO write, payment never fabricated", async () => {
    const db = ofertasDb(offerRow({ status: "pending_review", payment_status: "pending", entitlement_status: null }));
    const res = await mut.mutateOfertaLocalAdminReview(db.client, OFFER_ID, "approve", null);
    assert.ok(!res.ok && res.error === "commercial_entitlement_required", JSON.stringify(res));
    assert.equal(ofertasUpdates(db).length, 0);
    const noAd = ofertasDb(offerRow({ status: "pending_review", leonix_ad_id: null }));
    const r2 = await mut.mutateOfertaLocalAdminReview(noAd.client, OFFER_ID, "approve", null);
    assert.ok(!r2.ok && r2.error === "leonix_ad_id_required");
    const src = strip(raw(P.ofertasMut));
    for (const gate of ["assertNoUnresolvedItemsBeforeApproval", "assertSourceVersionReadyBeforeApproval", "validateOfertaLocalPartnerCourtesyEligibility", "hasPaidEntitlement", "commercial_entitlement_required", "leonix_ad_id_required"]) {
      assert.ok(src.includes(gate), `gate kept: ${gate}`);
    }
    assert.ok(!/payment_status\s*:|entitlement_status\s*:|paid_at\s*:/.test(src), "the mutation module never writes payment / entitlement truth");
  });

  await check("ofertas reject requires a reason; archive still allowed from approved (live offers can be taken down)", async () => {
    const db = ofertasDb(offerRow({ status: "pending_review" }));
    const r = await mut.mutateOfertaLocalAdminReview(db.client, OFFER_ID, "reject", "   ");
    assert.ok(!r.ok && r.error === "rejection_reason_required");
    const live = ofertasDb(offerRow({ status: "approved" }));
    const a = await mut.mutateOfertaLocalAdminReview(live.client, OFFER_ID, "archive", null);
    assert.ok(a.ok && a.newStatus === "archived");
  });

  await check("ofertas row actions: built from the transition table; approve disabled WITH blockers; reject requires a note; restore/archive present where valid", () => {
    const q = ofertasView.ofertaRowActions({ status: "pending_review", approvalAllowed: false, blockingReasons: ["payment_required", "scan_pending"] });
    assert.deepEqual(q.map((x) => x.action), ["approve", "reject", "archive"]);
    assert.equal(q[0].disabled, true);
    assert.match(q[0].reason ?? "", /payment_required, scan_pending/);
    assert.equal(q[1].note, "required");
    assert.equal(ofertasView.ofertaRowActions({ status: "draft", approvalAllowed: true })[0].disabled, false);
    const rej = ofertasView.ofertaRowActions({ status: "rejected", approvalAllowed: false });
    assert.deepEqual(rej.map((x) => x.action), ["restore", "archive"]);
    assert.match(rej[0].confirm, /pending_review/);
    assert.match(rej[0].confirm, /approved again/);
    assert.deepEqual(ofertasView.ofertaRowActions({ status: "archived", approvalAllowed: false }).map((x) => x.action), ["restore"]);
    assert.deepEqual(ofertasView.ofertaRowActions({ status: "approved", approvalAllowed: false }).map((x) => x.action), ["archive"]);
    assert.ok(!ofertasView.ofertaRowActions({ status: "approved", approvalAllowed: true }).some((x) => x.action === "approve"), "an approved offer cannot be approved again");
  });

  await check("ofertas messages: every gate has a specific message and status; restore is a valid action, unknown is not", () => {
    assert.equal(msgs.isOfertaLocalAdminReviewAction("restore"), true);
    assert.equal(msgs.isOfertaLocalAdminReviewAction("approve"), true);
    assert.equal(msgs.isOfertaLocalAdminReviewAction("delete"), false);
    assert.match(msgs.ofertaReviewErrorMessage("commercial_entitlement_required"), /paid, active entitlement/);
    assert.match(msgs.ofertaReviewErrorMessage("commercial_entitlement_required"), /cannot mark an offer paid/);
    assert.equal(msgs.ofertaReviewErrorHttpStatus("invalid_transition"), 409);
    assert.equal(msgs.ofertaReviewErrorHttpStatus("commercial_entitlement_required"), 422);
    assert.equal(msgs.ofertaReviewErrorHttpStatus("not_found"), 404);
    assert.equal(msgs.ofertaReviewErrorHttpStatus("update_failed"), 500);
  });

  await check("ofertas audit + revalidation: server action, PATCH row route and legacy review route all write an audit row; PATCH requires the operational confirmation", () => {
    const svc = strip(raw(P.ofertasService));
    assert.match(svc, /appendAdminAuditLog\(/);
    assert.match(svc, /ofertas_locales_admin_\$\{input\.action\}/);
    assert.match(svc, /revalidatePath\("\/admin\/workspace\/clasificados\/ofertas-locales"\)/);
    assert.match(svc, /mutateOfertaLocalAdminReview\(/);
    const act = strip(raw(P.ofertasActions));
    assert.match(act, /runOfertaLocalAdminReview\(/);
    assert.ok(!/mutateOfertaLocalAdminReview\(/.test(act), "the server action no longer bypasses the audited service");
    assert.match(act, /confirmed/);
    const route = strip(raw(P.ofertasRoute));
    assert.match(route, /export async function PATCH/);
    assert.match(route, /requireAdminCookie\(jar\)/);
    assert.match(route, /body\?\.confirmed !== true/);
    assert.match(route, /runOfertaLocalAdminReview\(/);
    const legacy = strip(raw(P.ofertasLegacyRoute));
    assert.match(legacy, /appendAdminAuditLog\(/);
    assert.match(legacy, /"restore"/);
    assert.match(legacy, /mutateOfertaLocalAdminReview\(/, "existing audits still find the mutation helper");
    assert.match(legacy, /\/clasificados\/ofertas-locales\/results/);
  });

  // ═══ OFERTAS — page / list source guards ════════════════════════════════════════════════════════
  await check("ofertas page: filters run in the data layer BEFORE the limit (no post-limit .filter), history/live/queue scope passed through", () => {
    const src = strip(raw(P.ofertasPage));
    assert.match(src, /listOfertasLocalesAdminRowsDetailed\(/);
    for (const k of ["status_group: statusGroup || undefined", "lane: laneFilter || undefined", "commercial: commercial || undefined", "scan_review: scanReview || undefined", "term: term || undefined", "owner_id: ownerRaw || undefined", "id: inspectId || undefined"]) {
      assert.ok(src.includes(k), k);
    }
    assert.ok(!/itemsUnfiltered/.test(src) && !/item\.operationalStatus\.adminKey !== statusGroup/.test(src), "the old post-limit filter chain is gone");
    assert.match(src, /capped/);
    assert.match(src, /filterError/);
  });

  await check("ofertas page: normalized header / summary / filter bar with the Ofertas filters as children; listing + commercial truth loaded", () => {
    const src = strip(raw(P.ofertasPage));
    assert.match(src, /categoryName: CATEGORY_NAME, scope/);
    assert.match(src, /catShell\.titleHistory/);
    assert.match(src, /fetchAdminCategorySummary\("ofertas-locales"\)/);
    assert.match(src, /<AdminCategorySummaryPanel/);
    assert.match(src, /<AdminCategoryFilterBar/);
    assert.match(src, /statusOptions=\{\[\.\.\.OFERTAS_ADMIN_STATUS_OPTIONS\[scope\]\]\}/);
    for (const name of ["status_group", "lane", "commercial", "scan_review", "term"]) assert.ok(src.includes(`name="${name}"`), name);
    assert.match(src, /extraFieldNames=\{\["id", "owner_id", "status_group", "lane", "commercial", "scan_review", "term"\]\}/);
    assert.match(src, /loadAdminListingCommercialTruth\(/);
    assert.match(src, /category: "ofertas-locales"/);
    assert.match(src, /ofertaListingTruth\(/);
    assert.match(src, /leonix_ad_id/);
    assert.match(src, /adminRowMatchesLeonixAdIdFilter\(/);
    assert.match(src, /OFERTAS_LOCALES_ADMIN_SELECT/, "an offer that left the scope is still inspectable by id");
  });

  await check("ofertas list: listing + commercial truth (row payment/entitlement/term end + loader), canonical row actions; AI item review + flyer/coupon intelligence untouched", () => {
    const src = raw(P.ofertasList);
    assert.match(src, /<AdminListingTruthSection/);
    assert.match(src, /<AdminCommercialTruthSection/);
    assert.match(src, /variant="ofertas"/);
    assert.match(src, /lifecycleActions=\{ofertaRowActions\(/);
    assert.match(src, /payment \{item\.paymentStatus\} · entitlement \{item\.entitlementStatus\}/);
    assert.match(src, /term end/);
    assert.match(src, /import type \{ AdminListingCommercialTruthMap \}/, "client-reachable code imports only the TYPE from the server loader");
    // preserved
    assert.match(src, /<OfertasLocalesAdminAiItemReviewSection ofertaLocalId=\{item\.id\} \/>/);
    assert.match(src, /wantsAiSearchableSpecials/);
    assert.match(src, /label="Volantes \/ flyers"/);
    assert.match(src, /label="Cupones"/);
    assert.match(src, /Featured placement intent/);
    assert.match(src, /reviewOfertaLocalAdminAction/);
    assert.ok(exists(P.ofertasAi));
    // moderation block: reachable for approved / rejected / archived, restore present, approve keeps its blocker gate
    assert.match(src, /reviewActions\.has\("restore"\)/);
    assert.match(src, /reviewActions\.has\("approve"\)/);
    assert.match(src, /disabled=\{!item\.operationalStatus\.adminApprovalAllowed\}/);
    assert.ok(!/item\.status !== "approved" && item\.status !== "archived"/.test(src), "moderation is no longer hidden for approved / archived / rejected offers");
  });

  await check("AI moderation stays advisory: Ofertas AI item review section is untouched and approval still requires the unresolved-items gate", () => {
    const ai = raw(P.ofertasAi);
    assert.ok(ai.length > 500);
    assert.match(strip(raw(P.ofertasMut)), /review_status", \["pending", "needs_review"\]/);
  });

  // ═══ SHARED ROW-ACTIONS COMPONENT — additive ════════════════════════════════════════════════════
  await check("row actions: comida-local + ofertas variants added ADDITIVELY (existing variants / URLs intact), data-driven lifecycle set, server message surfaced", () => {
    const src = raw(P.rowActions);
    for (const v of ['"restaurante"', '"listings"', '"servicios"', '"empleos"', '"autos"', '"viajes"']) assert.ok(src.includes(v), v);
    assert.match(src, /\| "comida-local"\s*\n\s*\| "ofertas";/);
    assert.match(src, /\/api\/admin\/comida-local\/listings\/\$\{id\}/);
    assert.match(src, /\/api\/admin\/ofertas-locales\/listings\/\$\{id\}/);
    assert.match(src, /\/api\/admin\/restaurantes\/listings\/\$\{id\}/);
    assert.match(src, /\/api\/admin\/servicios\/listings\/\$\{id\}/);
    assert.match(src, /lifecycleActions\?: readonly ClassifiedAdminLifecycleAction\[\]/);
    assert.match(src, /variant === "comida-local" \|\| variant === "ofertas"/);
    assert.match(src, /j\.message \?\? j\.error/);
    assert.match(src, /confirmed: true/);
    // no feature / verify controls in the data-driven branch
    const start = src.indexOf('if (variant === "comida-local" || variant === "ofertas")');
    const end = src.indexOf("<AdminActionExplainerGrid actions=", start);
    assert.ok(start > 0 && end > start, "data-driven branch located");
    const branch = src.slice(start, end);
    assert.ok(branch.length > 200 && !/promote_on|verify_on|Feature/.test(branch));
  });

  await check("strings: every new key exists in BOTH dictionaries and resolves (no raw key leaks)", () => {
    const rep = strings.getAdminStringsKeyCoverageReport();
    const mine = (k: string) => k.startsWith("comidaAdmin.") || k.startsWith("ofertasAdmin.") || k === "scopeNav.history" || k === "scopeNav.historyTitle" || k === "catShell.titleHistory" || k === "catShell.scopeHistory";
    assert.deepEqual([...rep.missingInEs, ...rep.missingInEn].filter(mine), []);
    for (const k of ["scopeNav.history", "comidaAdmin.subQueue", "ofertasAdmin.subHistory", "ofertasAdmin.empty.history", "catShell.titleHistory"]) {
      assert.notEqual(strings.adminTr("en", k), k, k);
      assert.notEqual(strings.adminTr("es", k), k, k);
    }
    assert.equal(strings.adminTr("en", "catShell.titleHistory", { name: "Ofertas Locales" }), "Ofertas Locales — History");
    assert.match(strings.adminTr("en", "ofertasAdmin.capped", { scanned: 900 }), /900/);
  });

  // ═══ RENDERED COMPONENTS ════════════════════════════════════════════════════════════════════════
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
    try {
      const listMod = await import("../app/lib/clasificados/comida-local/ComidaLocalAdminListings");
      const mapper = await import("../app/lib/clasificados/comida-local/mapComidaLocalAdminListing");
      const dbRow = (over: DbRow) =>
        ({
          id: UUID(1), owner_user_id: UUID(2), leonix_ad_id: "COMIDA-2026-000001", slug: "tacos", status: "pending_payment", package_tier: "basic", payment_status: "pending",
          published_at: PAST, expires_at: null, created_at: PAST, updated_at: PAST, business_name: "Tacos El Chuy", food_type: "tacos", food_type_custom: null,
          city_display: "San Jose", city_canonical: "san-jose", phone: null, whatsapp: null, instagram_url: null, facebook_url: null, tiktok_url: null, main_photo: null, listing_json: {}, suspended_reason: null,
          ...over,
        }) as never;
      const rows = [dbRow({}), dbRow({ id: UUID(3), status: "suspended", payment_status: "paid", suspended_reason: "payment", slug: "b", leonix_ad_id: "COMIDA-2026-000002" })];
      const items = mapper.mapComidaLocalRowsToAdminVms(rows, "es");
      const rec = (r: unknown) => r as Record<string, unknown>;
      const out = html(
        h(listMod.ComidaLocalAdminListings, {
          lang: "es",
          items,
          listingTruthById: Object.fromEntries(rows.map((r: never) => [rec(r).id as string, comidaView.comidaListingTruth(rec(r))])),
          actionsById: Object.fromEntries(rows.map((r: never) => [rec(r).id as string, comidaView.comidaRowLifecycleActions(rec(r) as never)])),
          suspendedReasonById: { [UUID(3)]: "payment" },
          paymentAnomalyById: {},
        }),
      );
      await check("render comida list: NO raw status <select>; listing truth + payment-suspension reason + disabled Republish/Restore with reasons", () => {
        assert.ok(!/<select/.test(out) && !/listing_status/.test(out), "no raw status dropdown");
        assert.match(out, /admin-listing-truth/);
        assert.match(out, /Suspension reason: payment|Motivo de suspensión: payment/);
        assert.match(out, /payment system/i);
        assert.match(out, /verified payment/i);
        assert.match(out, /data-variant="comida-local"/);
        assert.match(out, /Ver ficha/);
        assert.ok(!/Guardar estado/.test(out));
      });
      const empty = html(h(listMod.ComidaLocalAdminListings, { lang: "es", items: [] }));
      await check("render comida list: empty state keeps the audited copy; a filtered empty state can override it", () => {
        assert.match(empty, /No hay publicaciones de Comida Local todavía/);
        const filtered = html(h(listMod.ComidaLocalAdminListings, { lang: "es", items: [], emptyMessage: "sin resultados" }));
        assert.match(filtered, /sin resultados/);
      });
    } catch (e) {
      failures.push(`render comida list: ${e instanceof Error ? e.message : String(e)}`);
      console.error(`FAIL: render comida list\n  ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
    console.log("SKIP: render checks (react-dom/server unavailable)");
  }

  if (failures.length) {
    console.error(`\nverify-closeout2-comida-ofertas-admin FAILED (${failures.length})`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nverify-closeout2-comida-ofertas-admin PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
