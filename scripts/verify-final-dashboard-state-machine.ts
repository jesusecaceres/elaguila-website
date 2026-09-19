/**
 * FINAL DASHBOARD STATE MACHINE (2026-09 Gate 2) - executable verifier.
 *
 * DOCTRINE: payment truth != entitlement != listing lifecycle != public visibility != moderation.
 * The owner dashboard must consume the SAME lifecycle truth as the public readers and Admin Live.
 *
 *  A. pure-helper matrices: public-link predicate + action availability per category x status
 *     (`dashboardListingStateMachine.ts`, `comidaLocalPaymentResume.ts`, `dashboardPendingPayment.ts`)
 *  B. owner counts / tabs never treat a term-elapsed Rentas / FSBO / Clases row as active
 *  C. Empleos owner buttons are never looser than the server transition policy
 *  D. read failures are reported, not rendered as "no listings" (fake Supabase clients)
 *  E. Comida edit-context marker cannot hijack a new application preview
 *  F. every Complete-payment doorway carries the SAME listing id
 *  G. narrow source guards for the React surfaces that cannot be imported under raw tsx
 *  H. the state-machine module is pure and is not a publication authority; the doc exists
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-dashboard-state-machine.ts
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
/** Source with block + line comments removed (guards must look at code, not prose). */
const code = (rel: string) => raw(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const P = "app/(site)/dashboard";
const NOW = Date.parse("2026-09-18T12:00:00.000Z");
const PAST = "2026-09-01T00:00:00.000Z";
const FUTURE = "2026-10-15T00:00:00.000Z";

async function main() {
  const sm = await import("../app/(site)/dashboard/lib/dashboardListingStateMachine");
  const cl = await import("../app/lib/clasificados/comida-local/comidaLocalPaymentResume");
  const ctxMod = await import("../app/lib/clasificados/comida-local/comidaLocalListingEditContext");
  const pp = await import("../app/(site)/dashboard/lib/dashboardPendingPayment");
  const inv = await import("../app/(site)/dashboard/lib/dashboardInventory");
  const plan = await import("../app/(site)/dashboard/lib/dashboardMisAnunciosCategoryLoadPlan");
  const cq = await import("../app/lib/clasificados/comida-local/comidaLocalDashboardQueries");
  const map = await import("../app/lib/clasificados/comida-local/mapComidaLocalDashboardListing");
  const empPolicy = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const payClient = await import("../app/(site)/dashboard/lib/dashboardResumePaymentClient");
  const tools = await import("../app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools");

  const T = (dashboardStatus: string, over: Record<string, unknown> = {}) => ({ status: dashboardStatus, ...over });
  const P_ = (category: Parameters<typeof sm.dashboardOwnerActionPlan>[0], row: Record<string, unknown>, ctx: Record<string, unknown> = {}) =>
    sm.dashboardOwnerActionPlan(category, row, { nowMs: NOW, ...ctx });

  // ── A1. Comida Local (items 1, 8) ───────────────────────────────────────────────────────────
  await check("comida: 'View public' exists ONLY for a published row (paused / suspended / pending_payment / draft / unknown = no dead link)", () => {
    assert.equal(cl.comidaLocalRowHasPublicPage("published"), true);
    assert.equal(cl.comidaLocalRowHasPublicPage(" Published "), true);
    for (const s of ["paused", "suspended", "pending_payment", "draft", "", null, undefined, "archived", "weird"]) {
      assert.equal(cl.comidaLocalRowHasPublicPage(s as string | null), false, String(s));
    }
  });

  await check("comida: owner plan per status - published (view/pause), pending_payment (complete payment, same row), draft, paused, suspended, unknown", () => {
    const published = cl.comidaLocalOwnerActionPlan({ status: "published" });
    assert.deepEqual(
      { v: published.viewPublic, p: published.pause, r: published.resume, c: published.completePayment, e: published.edit },
      { v: true, p: true, r: false, c: false, e: true },
    );
    const pending = cl.comidaLocalOwnerActionPlan({ status: "pending_payment" });
    assert.deepEqual({ v: pending.viewPublic, c: pending.completePayment, r: pending.resume, p: pending.pause }, { v: false, c: true, r: false, p: false });
    const draft = cl.comidaLocalOwnerActionPlan({ status: "draft" });
    assert.deepEqual({ v: draft.viewPublic, c: draft.completePayment, r: draft.resume, e: draft.edit }, { v: false, c: false, r: false, e: true });
    const paused = cl.comidaLocalOwnerActionPlan({ status: "paused" });
    assert.deepEqual({ v: paused.viewPublic, r: paused.resume, reason: paused.reason }, { v: false, r: true, reason: "paused_by_owner" });
    const susp = cl.comidaLocalOwnerActionPlan({ status: "suspended" });
    assert.deepEqual({ v: susp.viewPublic, r: susp.resume, p: susp.pause, reason: susp.reason }, { v: false, r: false, p: false, reason: "suspended_moderation" });
    assert.equal(cl.comidaLocalOwnerActionPlan({ status: "suspended", suspendedReason: "payment" }).reason, "suspended_payment");
    const unknown = cl.comidaLocalOwnerActionPlan({ status: "weird" });
    assert.deepEqual({ v: unknown.viewPublic, c: unknown.completePayment, e: unknown.edit, r: unknown.resume }, { v: false, c: false, e: false, r: false });
  });

  await check("comida ARCHIVE MARKER: a paused row carrying a staff marker is a staff hold (never owner-resumable); an unmarked pause resumes", () => {
    const held = cl.comidaLocalOwnerActionPlan({ status: "paused", suspendedReason: "staff_archived" });
    assert.equal(held.resume, false);
    assert.equal(held.reason, "paused_staff_hold");
    assert.equal(held.viewPublic, false);
    assert.ok(cl.comidaLocalOwnerReasonNote("paused_staff_hold", "en")?.includes("only Leonix"));
    assert.equal(cl.comidaLocalOwnerActionPlan({ status: "paused", suspendedReason: null }).resume, true);
  });

  await check("comida: every reason has owner copy in ES and EN (payment / suspension / staff hold / unknown say WHY)", () => {
    for (const r of ["payment_pending", "draft", "paused_by_owner", "paused_staff_hold", "suspended_moderation", "suspended_payment", "unknown"] as const) {
      assert.ok(cl.comidaLocalOwnerReasonNote(r, "es"), `es ${r}`);
      assert.ok(cl.comidaLocalOwnerReasonNote(r, "en"), `en ${r}`);
    }
    assert.equal(cl.comidaLocalOwnerReasonNote("published", "es"), null);
  });

  await check("comida: dashboard inventory item (legacy builder) is listing-bound and has no unconditional public link", () => {
    const row = {
      id: "c1", slug: "taco", leonix_ad_id: "LX-1", status: "paused", package_tier: "base", payment_status: "paid", published_at: PAST,
      business_name: "Taco", food_type: "tacos", food_type_custom: null, city_canonical: "x", city_display: "x", phone: null, whatsapp: null,
      main_photo: null, suspended_reason: null,
    } as unknown as Parameters<typeof map.buildComidaLocalDashboardInventoryItems>[0][number];
    const [item] = map.buildComidaLocalDashboardInventoryItems([row], "en");
    assert.equal(item.isPublicLive, false);
    assert.match(item.editHref, /edit=1&listingId=c1/, "Edit opens THIS row, not a new application");
    const [pub] = map.buildComidaLocalDashboardInventoryItems([{ ...row, status: "published" }], "en");
    assert.equal(pub.isPublicLive, true);
    const [pend] = map.buildComidaLocalDashboardInventoryItems([{ ...row, status: "pending_payment" }], "en");
    assert.equal(pend.awaitingPayment, true);
    assert.equal(pend.isPublicLive, false);
  });

  // ── A2. state machine matrix ────────────────────────────────────────────────────────────────
  await check("rentas: active + future term = live; active + elapsed term = EXPIRED (no public link, renew, no pause); null term / rented = not public", () => {
    const live = P_("rentas", { category: "rentas", status: "active", is_published: true, expires_at: FUTURE });
    assert.deepEqual({ l: live.live, v: live.viewPublic, p: live.pause, x: live.termElapsed, r: live.reason }, { l: true, v: true, p: true, x: false, r: "live" });
    const elapsed = P_("rentas", { category: "rentas", status: "active", is_published: true, expires_at: PAST });
    assert.deepEqual(
      { l: elapsed.live, v: elapsed.viewPublic, p: elapsed.pause, x: elapsed.termElapsed, n: elapsed.renew, r: elapsed.reason },
      { l: false, v: false, p: false, x: true, n: true, r: "expired" },
    );
    const noTerm = P_("rentas", { category: "rentas", status: "active", is_published: true, expires_at: null });
    assert.deepEqual({ l: noTerm.live, v: noTerm.viewPublic }, { l: false, v: false });
    const rented = P_("rentas", {
      category: "rentas", status: "active", is_published: true, expires_at: FUTURE,
      detail_pairs: [{ label: "Leonix:rent:listing_status", value: "rentado" }],
    });
    assert.deepEqual({ l: rented.live, v: rented.viewPublic, r: rented.reason }, { l: false, v: false, r: "rented" });
    const pending = P_("rentas", { category: "rentas", status: "pending", is_published: false });
    assert.deepEqual({ v: pending.viewPublic, c: pending.completePayment, r: pending.reason }, { v: false, c: true, r: "payment_pending" });
    const paused = P_("rentas", { category: "rentas", status: "paused", is_published: false, expires_at: FUTURE });
    assert.deepEqual({ v: paused.viewPublic, res: paused.resume, r: paused.reason }, { v: false, res: true, r: "paused" });
    const pausedElapsed = P_("rentas", { category: "rentas", status: "paused", is_published: false, expires_at: PAST });
    assert.equal(pausedElapsed.resume, false, "a paused row whose term elapsed must renew, not 'resume' into a dead row");
    const removed = P_("rentas", { category: "rentas", status: "removed" });
    assert.deepEqual({ v: removed.viewPublic, e: removed.edit, a: removed.archive, r: removed.reason }, { v: false, e: false, a: false, r: "removed" });
  });

  await check("bienes-raices FSBO: 45-day term elapsed = expired (no public link, renew); inside term = live; sold keeps a direct-URL link but is not live", () => {
    const base = { category: "bienes-raices", seller_type: "personal", is_published: true, detail_pairs: [{ label: "Leonix:branch", value: "bienes_raices_privado" }] };
    const elapsed = P_("bienes-raices", { ...base, status: "active", expires_at: PAST });
    assert.deepEqual({ l: elapsed.live, v: elapsed.viewPublic, x: elapsed.termElapsed, n: elapsed.renew, r: elapsed.reason }, { l: false, v: false, x: true, n: true, r: "expired" });
    const live = P_("bienes-raices", { ...base, status: "active", expires_at: FUTURE });
    assert.deepEqual({ l: live.live, v: live.viewPublic, s: live.markSold }, { l: true, v: true, s: true });
    const sold = P_("bienes-raices", { ...base, status: "sold", expires_at: FUTURE });
    assert.deepEqual({ l: sold.live, v: sold.viewPublic, s: sold.markSold, r: sold.reason }, { l: false, v: true, s: false, r: "sold" });
    const pending = P_("bienes-raices", { ...base, status: "pending", is_published: false });
    assert.deepEqual({ v: pending.viewPublic, c: pending.completePayment }, { v: false, c: true });
    // Negocio (no fixed term) is never expired by this rule
    const negocio = P_("bienes-raices", { category: "bienes-raices", seller_type: "business", is_published: true, status: "active", expires_at: null, inventory_role: "main" });
    assert.deepEqual({ l: negocio.live, x: negocio.termElapsed }, { l: true, x: false });
  });

  await check("clases: paid term elapsed = expired (no public link); sold is live; pagada pending = complete payment; free pending = in review", () => {
    const paidPair = [{ label: "Leonix:classCostType", value: "pagada" }];
    const elapsed = P_("clases", { category: "clases", status: "active", is_published: true, expires_at: PAST, detail_pairs: paidPair });
    assert.deepEqual({ l: elapsed.live, v: elapsed.viewPublic, x: elapsed.termElapsed, r: elapsed.reason }, { l: false, v: false, x: true, r: "expired" });
    const sold = P_("clases", { category: "clases", status: "sold", is_published: true, expires_at: FUTURE });
    assert.deepEqual({ l: sold.live, v: sold.viewPublic }, { l: true, v: true });
    const paidPending = P_("clases", { category: "clases", status: "pending", is_published: false, detail_pairs: paidPair });
    assert.deepEqual({ c: paidPending.completePayment, v: paidPending.viewPublic, r: paidPending.reason }, { c: true, v: false, r: "payment_pending" });
    const freePending = P_("clases", { category: "clases", status: "pending", is_published: false, detail_pairs: [] });
    assert.deepEqual({ c: freePending.completePayment, v: freePending.viewPublic, r: freePending.reason }, { c: false, v: false, r: "in_review" });
  });

  await check("en-venta / busco / comunidad / mascotas: sold semantics, moderation, drafts", () => {
    const evSold = P_("en-venta", { category: "en-venta", status: "sold", is_published: true });
    assert.deepEqual({ l: evSold.live, v: evSold.viewPublic }, { l: false, v: true }, "En Venta sold = direct-URL only, never a results/Admin Live state");
    const evSoldHidden = P_("en-venta", { category: "en-venta", status: "sold", is_published: false });
    assert.equal(evSoldHidden.viewPublic, false);
    for (const cat of ["busco", "comunidad", "mascotas"] as const) {
      const sold = P_(cat, { category: cat === "mascotas" ? "mascotas-y-perdidos" : cat, status: "sold", is_published: true });
      assert.deepEqual({ l: sold.live, v: sold.viewPublic }, { l: true, v: true }, cat);
      const paused = P_(cat, { category: cat === "mascotas" ? "mascotas-y-perdidos" : cat, status: "paused", is_published: false });
      assert.deepEqual({ v: paused.viewPublic, r: paused.resume }, { v: false, r: true }, cat);
    }
    const flagged = P_("en-venta", { category: "en-venta", status: "flagged", is_published: true });
    assert.deepEqual({ v: flagged.viewPublic, res: flagged.resume, r: flagged.reason }, { v: false, res: false, r: "suspended_moderation" });
    const draft = P_("en-venta", { category: "en-venta", status: "active", is_published: false });
    assert.deepEqual({ v: draft.viewPublic, r: draft.reason }, { v: false, r: "draft" });
    const expired = P_("en-venta", { category: "en-venta", status: "expired", is_published: true });
    assert.deepEqual({ v: expired.viewPublic, r: expired.reason }, { v: false, r: "expired" });
  });

  await check("bienes negocio CHILD (item 3): public link only while the canonical main parent is active + published + same owner", () => {
    const parentActive = { id: "p1", category: "bienes-raices", seller_type: "business", inventory_role: "main", status: "active", is_published: true };
    const child = { id: "k1", category: "bienes-raices", seller_type: "business", status: "active", is_published: true, inventory_role: "inventory_property", br_inventory_parent_listing_id: "p1" };
    const ok = P_("bienes-raices", child, { ownerId: "u1", brParentsById: sm.dashboardBrParentsFromOwnerRows([parentActive], "u1") });
    assert.equal(ok.viewPublic, true);
    const parentPaused = sm.dashboardBrParentsFromOwnerRows([{ ...parentActive, status: "paused" }], "u1");
    assert.equal(P_("bienes-raices", child, { ownerId: "u1", brParentsById: parentPaused }).viewPublic, false, "child under a paused parent has no public page");
    const noParent = sm.dashboardBrParentsFromOwnerRows([], "u1");
    assert.equal(P_("bienes-raices", child, { ownerId: "u1", brParentsById: noParent }).viewPublic, false, "orphaned child");
    const foreign = sm.dashboardBrParentsFromOwnerRows([parentActive], "someone-else");
    assert.equal(P_("bienes-raices", child, { ownerId: "u1", brParentsById: foreign }).viewPublic, false, "different owner parent");
    const childPaused = P_("bienes-raices", { ...child, status: "paused" }, { ownerId: "u1", brParentsById: sm.dashboardBrParentsFromOwnerRows([parentActive], "u1") });
    assert.equal(childPaused.viewPublic, false);
    assert.equal(sm.dashboardViewPublicAllowed("bienes-raices", child, { nowMs: NOW, ownerId: "u1", brParentsById: sm.dashboardBrParentsFromOwnerRows([parentActive], "u1") }), true);
  });

  await check("autos: Privado past its term = expired (no public link); active live; pending_payment / payment_failed / draft = complete payment; removed by staff is not owner-restorable", () => {
    const live = P_("autos", { status: "active", lane: "privado", expires_at: FUTURE });
    assert.deepEqual({ l: live.live, v: live.viewPublic, a: live.archive }, { l: true, v: true, a: true });
    const elapsed = P_("autos", { status: "active", lane: "privado", expires_at: PAST });
    assert.deepEqual({ l: elapsed.live, v: elapsed.viewPublic, x: elapsed.termElapsed, n: elapsed.renew, r: elapsed.reason }, { l: false, v: false, x: true, n: true, r: "expired" });
    for (const st of ["draft", "pending_payment", "payment_failed"]) {
      const p = P_("autos", { status: st, lane: "privado" });
      assert.deepEqual({ v: p.viewPublic, c: p.completePayment }, { v: false, c: true }, st);
    }
    assert.equal(P_("autos", { status: "pending_payment", lane: "negocios" }).completePayment, false, "dealer base is a subscription with consent: never a dashboard checkout");
    const ownerRemoved = P_("autos", { status: "removed", lane: "privado" });
    assert.deepEqual({ v: ownerRemoved.viewPublic, r: ownerRemoved.resume }, { v: false, r: true });
    const staffRemoved = P_("autos", { status: "removed", lane: "privado", suspended_reason: "moderation" });
    assert.deepEqual({ r: staffRemoved.resume, reason: staffRemoved.reason }, { r: false, reason: "suspended_moderation" });
    assert.equal(P_("autos", { status: "cancelled", lane: "privado" }).viewPublic, false);
    // dealer child needs an active same-owner main
    const child = { id: "v1", status: "active", lane: "negocios", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "m1", owner_user_id: "u1" };
    const parents = (st: string) => (pid: string) => (pid === "m1" ? { id: "m1", lane: "negocios", inventory_role: "main", owner_user_id: "u1", status: st } : null);
    assert.equal(P_("autos", child, { autosParents: parents("active") }).viewPublic, true);
    assert.equal(P_("autos", child, { autosParents: parents("removed") }).viewPublic, false, "child of a removed dealer has no public page");
  });

  await check("restaurantes / servicios / empleos / viajes / comida: public only on their own published statuses; unpaid rows show payment pending, not a public state", () => {
    assert.equal(P_("restaurantes", T("published")).viewPublic, true);
    for (const st of ["pending_payment", "suspended", "archived", "draft"]) assert.equal(P_("restaurantes", T(st)).viewPublic, false, `restaurantes ${st}`);
    assert.deepEqual({ c: P_("restaurantes", T("pending_payment")).completePayment, r: P_("restaurantes", T("pending_payment")).reason }, { c: true, r: "payment_pending" });
    assert.equal(P_("restaurantes", T("suspended", { suspended_reason: "payment" })).reason, "suspended_payment");
    assert.equal(P_("servicios", T("published")).viewPublic, true);
    for (const st of ["pending_payment", "paused_unpublished", "suspended", "draft"]) assert.equal(P_("servicios", T(st)).viewPublic, false, `servicios ${st}`);
    assert.deepEqual({ p: P_("servicios", T("published")).pause, r: P_("servicios", T("paused_unpublished")).resume }, { p: true, r: true });
    assert.equal(P_("servicios", T("pending_payment")).completePayment, true);
    assert.equal(P_("empleos", { lifecycle_status: "published", status: "published", lane: "quick" }).viewPublic, true);
    for (const st of ["draft", "pending_review", "paused", "archived", "rejected"]) assert.equal(P_("empleos", T(st, { lane: "quick" })).viewPublic, false, `empleos ${st}`);
    assert.equal(P_("viajes", T("approved", { is_public: true })).viewPublic, true);
    assert.equal(P_("viajes", T("approved", { is_public: false })).viewPublic, false);
    for (const st of ["draft", "submitted", "in_review", "changes_requested", "rejected", "expired", "unpublished"]) {
      assert.equal(P_("viajes", T(st, { is_public: false })).viewPublic, false, `viajes ${st}`);
    }
    assert.deepEqual({ r: P_("viajes", T("changes_requested")).resubmit, u: P_("viajes", T("approved", { is_public: true })).unpublish }, { r: true, u: true });
    assert.equal(P_("viajes", T("approved", { is_public: true })).completePayment, false, "Viajes has no payment product");
    assert.equal(P_("comida-local", T("published")).viewPublic, true);
    for (const st of ["paused", "suspended", "pending_payment", "draft"]) assert.equal(P_("comida-local", T(st)).viewPublic, false, `comida ${st}`);
  });

  await check("every category x status: 'View public' implies live-or-documented-direct-URL, and never coexists with a payment doorway", () => {
    const cats = ["en-venta", "rentas", "bienes-raices", "clases", "comunidad", "busco", "mascotas", "autos", "restaurantes", "servicios", "empleos", "viajes", "comida-local"] as const;
    const statuses = ["draft", "pending", "pending_payment", "payment_failed", "published", "active", "paused", "paused_unpublished", "suspended", "rejected", "expired", "sold", "archived", "removed", "cancelled", "flagged", "approved", "submitted", "in_review", "changes_requested", "unpublished", "pending_review", "weird", ""];
    for (const c of cats) {
      for (const st of statuses) {
        const p = P_(c, { status: st, lane: c === "autos" ? "privado" : "quick", category: c === "mascotas" ? "mascotas-y-perdidos" : c, is_published: true, is_public: true, expires_at: PAST });
        assert.equal(p.viewPublic, p.linkResolves, `${c}/${st}`);
        assert.ok(!(p.viewPublic && p.completePayment), `${c}/${st}: a payment doorway and a public link never coexist`);
        if (p.live) assert.ok(p.viewPublic, `${c}/${st}: live implies a resolvable link`);
        assert.ok(!(p.live && p.termElapsed), `${c}/${st}: live and term-elapsed are exclusive`);
        const d = sm.dashboardOwnerReasonNote(p.reason, "en");
        assert.ok(p.reason === "live" || d === null || typeof d === "string");
      }
    }
  });

  await check("inventory helper: Autos Privado past its term is not public-live; unaffected categories keep their contract", () => {
    const live = pp.dashboardInventoryRowIsPubliclyLive;
    assert.equal(live({ category: "autos_paid", status: "active", lane: "privado", expiresAt: PAST, nowMs: NOW }), false);
    assert.equal(live({ category: "autos_paid", status: "active", lane: "privado", expiresAt: FUTURE, nowMs: NOW }), true);
    assert.equal(live({ category: "autos_paid", status: "active", lane: "negocios", expiresAt: PAST, nowMs: NOW }), true, "dealer rows have no fixed term");
    assert.equal(live({ category: "empleos", status: "published" }), true);
    assert.equal(live({ category: "empleos", status: "paused" }), false);
    assert.equal(live({ category: "viajes", status: "approved", isPublic: true }), true);
  });

  // ── B. tabs / counts (items 5-7) ────────────────────────────────────────────────────────────
  await check("tabs + owner counts: a term-elapsed Rentas / FSBO / Clases row is EXPIRED, never counted as active", () => {
    const b = (cat: Parameters<typeof sm.dashboardListingsRowBucket>[0], row: Record<string, unknown>) => sm.dashboardListingsRowBucket(cat, row, { nowMs: NOW });
    assert.equal(b("rentas", { category: "rentas", status: "active", is_published: true, expires_at: FUTURE }), "active");
    assert.equal(b("rentas", { category: "rentas", status: "active", is_published: true, expires_at: PAST }), "expired");
    assert.equal(b("bienes-raices", { category: "bienes-raices", seller_type: "personal", status: "active", is_published: true, expires_at: PAST }), "expired");
    assert.equal(b("bienes-raices", { category: "bienes-raices", seller_type: "business", status: "active", is_published: true, expires_at: null }), "active");
    assert.equal(b("clases", { category: "clases", status: "active", is_published: true, expires_at: PAST }), "expired");
    assert.equal(b("clases", { category: "clases", status: "active", is_published: true, expires_at: FUTURE }), "active");
    assert.equal(b("en-venta", { category: "en-venta", status: "sold" }), "expired");
    assert.equal(b("en-venta", { category: "en-venta", status: "paused" }), "moderation");
    assert.equal(b("en-venta", { category: "en-venta", status: "pending" }), "moderation");
    assert.equal(b("en-venta", { category: "en-venta", status: "removed" }), "removed");
    assert.equal(b("en-venta", { category: "en-venta", status: "active", is_published: false }), "other", "an unpublished draft is not 'active'");
    const rows = [
      { id: "1", category: "rentas", status: "active", is_published: true, expires_at: FUTURE },
      { id: "2", category: "rentas", status: "active", is_published: true, expires_at: PAST },
      { id: "3", category: "bienes-raices", seller_type: "personal", status: "active", is_published: true, expires_at: PAST },
      { id: "4", category: "clases", status: "active", is_published: true, expires_at: PAST },
      { id: "5", category: "clases", status: "active", is_published: true, expires_at: FUTURE },
      { id: "6", category: "en-venta", status: "active", is_published: true },
      { id: "7", category: "en-venta", status: "active", is_published: false },
    ];
    assert.equal(sm.dashboardCountLiveListingRows(rows, "u1", NOW), 3, "only rows 1, 5 and 6 are live");
  });

  // ── C. Empleos owner buttons never looser than the server (item 9) ──────────────────────────
  await check("empleos: paid draft never resumes; feria draft may publish; staff hold / never-live archive never offers a dead Reactivate", () => {
    const t = sm.dashboardEmpleosOwnerTransitions;
    assert.equal(t({ lane: "quick", lifecycle_status: "draft" }).resume, false);
    assert.equal(t({ lane: "premium", lifecycle_status: "draft" }).resume, false);
    assert.equal(t({ lane: "feria", lifecycle_status: "draft" }).resume, true);
    assert.deepEqual(
      { p: t({ lane: "quick", lifecycle_status: "published" }).pause, a: t({ lane: "quick", lifecycle_status: "published" }).archive, r: t({ lane: "quick", lifecycle_status: "published" }).resume },
      { p: true, a: true, r: false },
    );
    assert.equal(t({ lane: "quick", lifecycle_status: "paused" }).resume, true);
    assert.equal(t({ lane: "quick", lifecycle_status: "paused", moderation_reason: "staff_suspended" }).resume, false, "staff-held pause");
    assert.equal(t({ lane: "quick", lifecycle_status: "paused", moderation_reason: "staff_suspended" }).staffHold, true);
    assert.equal(t({ lane: "quick", lifecycle_status: "archived", published_at: PAST }).resume, true, "owner-archived post that WAS live reopens");
    assert.equal(t({ lane: "quick", lifecycle_status: "archived", published_at: null }).resume, false, "never live: archiving cannot open it");
    assert.equal(t({ lane: "quick", lifecycle_status: "archived", published_at: PAST, moderation_reason: "spam" }).resume, false, "archived with a staff reason = staff archive");
    assert.equal(t({ lane: "quick", lifecycle_status: "pending_review" }).resume, false);
    assert.equal(t({ lane: "quick", lifecycle_status: "pending_review" }).archive, true);
    assert.equal(t({ lane: "quick", lifecycle_status: "rejected" }).resume, false);
    assert.equal(t({ lane: "quick", lifecycle_status: "archived", published_at: PAST }).archive, false);
  });

  await check("empleos: the dashboard is NEVER looser than resolveEmpleosOwnerTransition (every lane x status x marker x ever-live)", () => {
    const lanes = ["quick", "premium", "feria", "unknown-lane"];
    const statuses = ["draft", "pending_review", "published", "paused", "archived", "rejected", "weird"];
    for (const lane of lanes) {
      for (const st of statuses) {
        for (const reason of [null, "staff_suspended", "free text"]) {
          for (const published_at of [null, PAST]) {
            const tr = sm.dashboardEmpleosOwnerTransitions({ lane, lifecycle_status: st, published_at, moderation_reason: reason });
            const ok = (next: string) =>
              empPolicy.resolveEmpleosOwnerTransition({ lane, current: st, next, hasStaffReason: Boolean(reason), everPublished: Boolean(published_at) }).ok;
            const tag = `${lane}/${st}/${reason}/${published_at}`;
            if (tr.pause) assert.ok(ok("paused"), `pause ${tag}`);
            if (tr.resume) assert.ok(ok("published"), `resume ${tag}`);
            if (tr.archive) assert.ok(ok("archived"), `archive ${tag}`);
          }
        }
      }
    }
  });

  await check("empleos: refusal codes map to owner copy (never a silent failure)", () => {
    for (const code of ["payment_required", "staff_hold", "forbidden_transition", "boom", undefined]) {
      assert.ok(sm.dashboardEmpleosTransitionErrorMessage(code as string | undefined, "es").length > 10);
      assert.ok(sm.dashboardEmpleosTransitionErrorMessage(code as string | undefined, "en").length > 10);
    }
    assert.equal(sm.dashboardVisibleModerationReason("staff_suspended"), null, "machine markers are not echoed as copy");
    assert.equal(sm.dashboardVisibleModerationReason("Missing salary range"), "Missing salary range");
  });

  await check("empleos list card offers Reactivate for an owner-archived live post, not for a staff hold (buildInventoryListingActions)", () => {
    const item = (over: Record<string, unknown>) =>
      ({
        id: "e1", category: "empleos", title: "t", status: "archived", publicHref: "/x", editHref: "/edit", empleosLane: "quick",
        publishedAt: PAST, moderationReason: null, source: "empleos_public_listings", isPublicLive: false, ...over,
      }) as unknown as Parameters<typeof tools.buildInventoryListingActions>[1];
    const labels = (i: ReturnType<typeof item>) =>
      tools.buildInventoryListingActions("empleos", i, "en", "lang=en", { onEmpleosLifecycle: () => undefined }).map((a) => a.label);
    assert.ok(labels(item({})).some((l) => /Reactivate/i.test(l)));
    assert.ok(!labels(item({ moderationReason: "spam" })).some((l) => /Reactivate/i.test(l)), "staff-archived");
    assert.ok(!labels(item({ publishedAt: null })).some((l) => /Reactivate/i.test(l)), "never live");
    assert.ok(!labels(item({ status: "paused", moderationReason: "staff_suspended" })).some((l) => /Reactivate/i.test(l)), "staff-held pause");
    const pubActions = tools.buildInventoryListingActions("empleos", item({ status: "published", isPublicLive: true }), "en", "lang=en", { onEmpleosLifecycle: () => undefined });
    assert.ok(pubActions.some((a) => /View public/i.test(a.label)));
  });

  // ── viajes preview (item 4) ─────────────────────────────────────────────────────────────────
  await check("viajes: the staged preview href carries the row's own stagedId (both lanes) and the card uses it", () => {
    assert.match(inv.viajesStagedPreviewHref({ id: "s 1", lane: "private" }, "es"), /\/preview\/privado\?stagedId=s%201/);
    assert.match(inv.viajesStagedPreviewHref({ id: "s1", lane: "business" }, "en"), /\/preview\/negocios\?stagedId=s1/);
    const [item] = inv.buildViajesInventoryItems(
      [{ id: "v9", slug: "x", title: "T", category: "c", lane: "business", owner_user_id: "u", lifecycle_status: "submitted", is_public: false, hero_image_url: null, published_at: null, updated_at: PAST }],
      "en",
    );
    assert.match(String(item.previewHref), /stagedId=v9/);
    assert.equal(item.isPublicLive, false);
  });

  // ── D. read failures (fake Supabase) ────────────────────────────────────────────────────────
  const fakeSb = (result: { data?: unknown; error?: { message: string } | null; count?: number | null }) => {
    const res = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null };
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "in"]) chain[m] = () => chain;
    chain.then = (resolve: (v: unknown) => unknown) => resolve(res);
    return { from: () => chain } as unknown as Parameters<typeof inv.readOwnerEmpleosListings>[0];
  };
  const boom = { message: "boom" };

  await check("read failures: every dedicated owner read reports ok:false (never an empty success) and success reports rows", async () => {
    const good = fakeSb({ data: [{ id: "a" }] });
    const bad = fakeSb({ error: boom });
    const nullData = fakeSb({ data: null });
    for (const fn of [inv.readOwnerRestaurantListings, inv.readOwnerEmpleosListings, inv.readOwnerViajesListings, inv.readOwnerAutosClassifiedsListings] as const) {
      const okRes = await fn(good, "u1");
      assert.equal(okRes.ok, true);
      assert.equal(okRes.rows.length, 1);
      const failRes = await fn(bad, "u1");
      assert.equal(failRes.ok, false);
      assert.equal(failRes.rows.length, 0);
      assert.equal((await fn(nullData, "u1")).ok, false, "no data + no error is still not a success");
    }
    const cGood = await cq.listUserComidaLocalListingsResult(good as never, "u1");
    assert.equal(cGood.ok, true);
    const cBad = await cq.listUserComidaLocalListingsResult(bad as never, "u1");
    assert.equal(cBad.ok, false);
    assert.equal((await cq.listUserComidaLocalListingsResult(good as never, " ")).ok, false, "no owner id is a failed read, not an empty list");
    // legacy wrappers keep their best-effort `[]`
    assert.deepEqual(await inv.fetchOwnerEmpleosListings(bad, "u1"), []);
    assert.deepEqual(await cq.fetchOwnerComidaLocalListings(bad as never, "u1"), []);
    assert.equal(cq.fetchOwnerComidaLocalListingsResult, cq.listUserComidaLocalListingsResult);
  });

  await check("read failures: dedicated counts report `failed` when any count query errored (0 alone is ambiguous)", async () => {
    const okCounts = await plan.fetchDedicatedCategoryCountsChecked(fakeSb({ count: 4 }) as never, "u1");
    assert.equal(okCounts.failed, false);
    assert.equal(okCounts.counts.empleos, 4);
    const badCounts = await plan.fetchDedicatedCategoryCountsChecked(fakeSb({ error: boom }) as never, "u1");
    assert.equal(badCounts.failed, true);
    assert.equal(badCounts.counts.empleos, 0);
    assert.equal((await plan.fetchDedicatedCategoryCounts(fakeSb({ error: boom }) as never, "u1")).empleos, 0, "legacy wrapper shape unchanged");
  });

  await check("read failures: Servicios owner read without a session token is a failed read, not an empty inventory", async () => {
    const r = await inv.readOwnerServiciosListings(null);
    // under raw tsx there is no `window`, so the SSR guard answers ok:true/empty - assert the client path via source instead
    assert.ok(r.ok === true || r.error === "no_session");
    const src = code(`${P}/lib/dashboardInventory.ts`);
    assert.match(src, /if \(!accessToken\?\.trim\(\)\) return \{ ok: false, rows: \[\], error: "no_session" \};/);
    assert.match(src, /if \(!res\.ok\) return \{ ok: false, rows: \[\], error: `http_\$\{res\.status\}` \};/);
  });

  // ── E. Comida edit-context marker (item 10) ─────────────────────────────────────────────────
  await check("comida edit-context marker: URL wins; marker fallback ONLY for the signed-in owner's pending_payment row; anything else = new application", () => {
    const r = ctxMod.resolveComidaLocalPreviewEditTarget;
    const marker = (over: Record<string, unknown> = {}) =>
      ({ listingId: "L1", slug: "s", leonixAdId: null, status: "pending_payment", draftListingId: "d1", sourceUpdatedAt: null, ownerUserId: "u1", ...over }) as Parameters<typeof r>[0]["marker"];
    assert.deepEqual(r({ urlListingId: "URLID", marker: marker(), sessionUserId: "u1" }), { listingId: "URLID", source: "url" });
    assert.deepEqual(r({ urlListingId: "", marker: marker(), sessionUserId: "u1" }), { listingId: "L1", source: "marker" });
    assert.equal(r({ urlListingId: "", marker: marker({ status: "published" }), sessionUserId: "u1" }).source, "none", "stale marker of a published edit must not hijack a new application");
    assert.equal(r({ urlListingId: "", marker: marker({ ownerUserId: "other" }), sessionUserId: "u1" }).source, "none", "another account's marker");
    assert.equal(r({ urlListingId: "", marker: marker({ ownerUserId: null }), sessionUserId: "u1" }).source, "none", "pre-owner marker fails closed");
    assert.equal(r({ urlListingId: "", marker: marker(), sessionUserId: "" }).source, "none", "no session");
    assert.equal(r({ urlListingId: "", marker: null, sessionUserId: "u1" }).source, "none");
  });

  await check("comida edit-context: hydration stamps the owner on the marker; the preview uses the resolver, clears a stale marker, and refuses a different-row payment", () => {
    const ctxSrc = code("app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts");
    assert.match(ctxSrc, /ownerUserId,\s*\n?\s*\},\s*\n?\s*\};/);
    const pv = code("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
    assert.match(pv, /resolveComidaLocalPreviewEditTarget\(\{ urlListingId: editListingIdParam, marker, sessionUserId \}\)/);
    assert.match(pv, /if \(!resolvedEditId && marker\) clearComidaLocalEditContext\(\);/);
    assert.match(pv, /target\.source === "marker" && !isComidaLocalAwaitingPayment\(rowStatus\)/);
    assert.match(pv, /editListingId && pending\.listingId !== editListingId/);
    assert.doesNotMatch(pv, /editListingIdParam \|\| \(marker \? marker\.listingId : ""\)/, "the unconditional marker fallback is gone");
  });

  // ── F. same-listing payment doorways (item 12) ──────────────────────────────────────────────
  await check("resume payment: the payload carries the row's OWN listing id for every lane (trimmed), and a blank id is refused before any request", async () => {
    for (const lane of ["empleos", "rentas", "bienes-raices-fsbo", "clases", "autos-privado"] as const) {
      const p = pp.buildDashboardResumePaymentPayload({ lane, listingId: "  abc-123 ", leonixAdId: " LX-9 ", lang: "es" });
      assert.equal(p.listingId, "abc-123", lane);
      assert.equal(p.leonixAdId, "LX-9", lane);
    }
    const res = await payClient.startDashboardResumePayment({ lane: "rentas", listingId: "   ", lang: "en" });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.userMessage, payClient.dashboardResumePaymentMissingListingMessage("en"));
    assert.ok(payClient.dashboardResumePaymentMissingListingMessage("es").length > 10);
  });

  await check("comida resume payment href targets the same listing id; only a pending_payment row is offered it", () => {
    assert.match(cl.comidaLocalResumePaymentHref("row 1", "en"), /listingId=row%201&source=dashboard&resume=payment/);
    assert.equal(cl.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: "pending_payment" }), "resume_payment");
    assert.equal(cl.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: "paused" }), "none");
    assert.equal(cl.decideComidaLocalPreviewCheckout({ listingBound: true, rowStatus: "published" }), "none");
  });

  await check("every Complete-payment entry passes the listing row's own id (source guards)", () => {
    const page = code(`${P}/mis-anuncios/page.tsx`);
    assert.match(page, /startDashboardResumePayment\(\{ lane, listingId: id, leonixAdId, lang \}\)/);
    for (const call of [
      /startPendingPayment\("empleos", item\.id, item\.leonixAdId\)/,
      /startPendingPayment\(realEstatePayLane, x\.id, x\.leonix_ad_id\)/,
      /startPendingPayment\("clases", x\.id, x\.leonix_ad_id\)/,
    ]) assert.match(page, call);
    assert.match(page, /startPendingPayment\(cp\.lane, cp\.listingId, cp\.leonixAdId\)/);
    assert.match(page, /resumeRestaurantePayment\(item\.id, "checkout"\)/);
    for (const f of [`${P}/empleos/page.tsx`, `${P}/empleos/[listingId]/page.tsx`]) {
      assert.match(code(f), /listingId: (r|row)\.id,/, f);
    }
    assert.match(code(`${P}/mis-anuncios/[id]/page.tsx`), /startDashboardResumePayment\(\{\s*lane: unpaidPayLane,\s*listingId: row\.id,/);
    assert.match(code("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx"), /startDashboardResumePayment\(\{ lane: "autos-privado", listingId: id, leonixAdId, lang \}\)/);
    const comida = code("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
    assert.match(comida, /comidaLocalResumePaymentHref\(item\.id, lang\)/);
  });

  // ── G. source guards ────────────────────────────────────────────────────────────────────────
  await check("mis-anuncios: tabs use the state machine; dedicated loads report failure; generic card link uses the public predicate", () => {
    const page = code(`${P}/mis-anuncios/page.tsx`);
    assert.match(page, /function passesTab\(row: ListingRow, tab: Tab, ownerId\?: string \| null\): boolean/);
    assert.match(page, /dashboardListingsRowBucket\(catKey as DashboardStateCategory, row, \{ ownerId \}\)/);
    assert.match(page, /listings\.filter\(\(x\) => passesTab\(x, tab, userId\)\)/);
    for (const fn of ["readOwnerRestaurantListings", "readOwnerEmpleosListings", "readOwnerViajesListings", "readOwnerAutosClassifiedsListings", "fetchOwnerComidaLocalListingsResult"]) {
      assert.match(page, new RegExp(`await ${fn}\\(supabase, userId\\)`), fn);
    }
    assert.match(page, /readOwnerServiciosListings\(token\)/);
    assert.match(page, /fetchDedicatedCategoryCountsChecked\(supabase, u\.id\)/);
    assert.doesNotMatch(page, /const fetched = await fetchOwner(Restaurant|Empleos|Viajes|AutosClassifieds)Listings\(supabase, userId\);\s*\n\s*if \(cancelled\) return;\s*\n\s*set/);
    assert.match(page, /setCategoryLoadError\(categoryFilter\)/);
    assert.match(page, /!hasAnyInventory && \(loadFailed \|\| countsFailed\)/);
    assert.match(page, /!hasSelectedCategoryListings && selectedCategoryReadFailed/);
    assert.match(page, /genericPlan \? genericPlan\.viewPublic : !isSharedListingsRowNotLive\(x\)/);
    assert.match(page, /\{!genericPublicLinkOk \? null : \(/);
    assert.doesNotMatch(page, /genericNotLive/);
    assert.match(page, /genericPlan\?\.termElapsed\s*\?\s*"expired"/);
    assert.match(page, /repKindRaw === "move_to_top" \? repKindRaw : null/);
    assert.match(page, /publicViewAllowed=\{dashboardViewPublicAllowed\("en-venta", x, \{ ownerId: userId \}\)\}/);
    assert.match(page, /publicViewAllowed=\{listingsRowIsPublicLive\(x as unknown as Record<string, unknown>\)\}/);
    assert.match(page, /dashboardEmpleosTransitionErrorMessage\(refusal\?\.error, lang\)/);
  });

  await check("mis-anuncios: a failed dedicated read is never marked loaded (so it retries) and the empty state is not shown for it", () => {
    const page = code(`${P}/mis-anuncios/page.tsx`);
    assert.match(page, /if \(readOk\) \{\s*setLoadedDedicatedCategories/);
    assert.match(page, /\}, \[inventoryReady, userId, categoryFilter, loadedDedicatedCategories, retryNonce\]\);/);
    assert.match(page, /setLoadFailed\(true\);/);
  });

  await check("real-estate card: status chip + View public + FSBO preview follow the REAL public state; child card and 'View main listing' are gated", () => {
    const card = code(`${P}/components/LeonixRealEstateListingManageCard.tsx`);
    assert.match(card, /const liveState = dashboardLiveState\(stateCategory, row, \{ ownerId: ownerUserId, brParentsById \}\);/);
    assert.match(card, /\{!liveState\.linkResolves \? null : \(\s*<Link\s+href=\{publicViewHref\}/);
    assert.match(card, /liveState\.termElapsed \? \(/);
    assert.match(card, /!\(\(notLive \|\| !liveState\.linkResolves\) && effectiveBranch === "bienes_raices_privado"\)/);
    assert.doesNotMatch(card, /\{notLive \? null : \(\s*<Link\s+href=\{publicViewHref\}/);
    const child = code("app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx");
    assert.match(child, /const childPublicOk = dashboardViewPublicAllowed\("bienes-raices", row, \{/);
    assert.match(child, /\{childPublicOk \? \(\s*<Link\s+href=\{childPublicHref\}/);
    const section = code("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx");
    assert.match(section, /mainId && mainPublicOk \? \(/);
  });

  await check("workspace / legacy cards: 'View public' gated by the public predicate; Comida card uses the owner plan", () => {
    const ws = code(`${P}/mis-anuncios/[id]/page.tsx`);
    assert.match(ws, /row && wsViewPublic \? \[\{ href: publicListingHref/);
    assert.doesNotMatch(ws, /row && !rowNotLive \? \[\{ href: publicListingHref/);
    assert.match(code("app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx"), /\{publicViewAllowed \? \(\s*<Link\s+href=\{`\/clasificados\/anuncio\/\$\{row\.id\}\?lang=\$\{lang\}`\}/);
    assert.match(code("app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx"), /isPrePublicationStatus\(row\.status\) \|\| !publicViewAllowed/);
    const auto = code("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
    assert.match(auto, /dashboardViewPublicAllowed\("autos", row\) && isLiveCapability\(privadoCaps\.identity\.publicView\)/);
    assert.match(auto, /if \(childPublicOk\) \{/);
    assert.match(auto, /setLoadFailed\(true\)/);
    assert.match(auto, /loadFailed && rows\.length === 0/);
    const comida = code("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
    assert.match(comida, /comidaLocalOwnerActionPlan\(\{ status: item\.status, suspendedReason: item\.suspendedReason \}\)/);
    assert.match(comida, /comidaLocalRowHasPublicPage\(item\.status\) &&\s*plan\.viewPublic/);
    // strict transitions: the raw-status literals (pinned by gate-pkgA-edit-save-truth-selftest) stay, the plan adds the marker rule
    assert.match(comida, /isLiveCapability\(capabilities\.lifecycle\.pause\) && item\.status === "published" && plan\.pause/);
    assert.match(comida, /isLiveCapability\(capabilities\.lifecycle\.reactivate\) && item\.status === "paused" && plan\.resume/);
    assert.doesNotMatch(comida, /resolveListingUiStatus/, "the generic status collapse (suspended -> paused) is gone");
    assert.match(comida, /plan\.reason !== "payment_pending" && plan\.reason !== "draft"/, "an unpaid row does not show a fake 'Published' date");
  });

  await check("empleos pages + servicios / ofertas lists: policy-driven buttons, read errors are errors", () => {
    for (const f of [`${P}/empleos/page.tsx`, `${P}/empleos/[listingId]/page.tsx`]) {
      const s = code(f);
      assert.match(s, /dashboardEmpleosOwnerTransitions\(/, f);
      assert.match(s, /empleosTransitions\.pause/, f);
      assert.match(s, /empleosTransitions\.resume/, f);
      assert.match(s, /empleosTransitions\.archive/, f);
      assert.match(s, /empleosPlan\.viewPublic/, f);
      assert.match(s, /dashboardEmpleosTransitionErrorMessage\(json\.error, lang\)/, f);
    }
    assert.match(code(`${P}/empleos/page.tsx`), /error=\{!authLoading \? loadError : null\}/);
    assert.match(code(`${P}/empleos/[listingId]/page.tsx`), /setReadFailed\(true\)/);
    assert.match(code(`${P}/servicios/page.tsx`), /empty=\{!loading && !cloudReadFailed && rows\.length === 0\}/);
    assert.match(code(`${P}/ofertas-locales/page.tsx`), /empty=\{!authLoading && !readFailed && offers\.length === 0\}/);
    const tl = code(`${P}/lib/dashboardMisAnunciosCategoryTools.ts`);
    assert.match(tl, /empleosTransitions\.resume && listingToolIsReady\(category, "reactivate"\)/);
    assert.doesNotMatch(tl, /item\.status === "paused" && listingToolIsReady\(category, "reactivate"\)/);
  });

  await check("owner 'active' count reads rows and applies the per-category public predicate (Autos Privado term too)", () => {
    const k = code("app/lib/ownerEngagementListingKeys.ts");
    assert.match(k, /dashboardCountLiveListingRows\(rowsQ\.data as unknown as Record<string, unknown>\[\], ownerId\)/);
    assert.match(k, /isAutosRowLiveRowLevel\(r\)/);
    // the Gate 2A parallelization + six-table pins stay intact
    assert.match(k, /Promise\.all\(\[\s*countListings\(\),\s*countServicios\(\),\s*countEmpleos\(\),\s*countAutos\(\),\s*countRestaurantes\(\),\s*countViajes\(\),?\s*\]\)/);
  });

  // ── H. purity + doc ─────────────────────────────────────────────────────────────────────────
  await check("the state-machine module is pure: no Supabase / fetch / React, and it is not a publication authority", () => {
    const src = code(`${P}/lib/dashboardListingStateMachine.ts`);
    assert.doesNotMatch(src, /supabase/i);
    assert.doesNotMatch(src, /\bfetch\(/);
    assert.doesNotMatch(src, /from "react"|useState|useEffect/);
    assert.doesNotMatch(src, /\.update\(|\.insert\(|\.upsert\(|\.rpc\(/);
    assert.doesNotMatch(src, /is_published: true|status: "active"|status: "published"/);
    const cs = code("app/lib/clasificados/comida-local/comidaLocalPaymentResume.ts");
    assert.doesNotMatch(cs, /supabase|fetch\(/i);
  });

  await check("the per-category x status doc exists and covers every category and every status", () => {
    const docPath = "docs/admin-os/DASHBOARD_STATE_MACHINE_2026-09.md";
    assert.ok(existsSync(new URL(`../${docPath}`, import.meta.url)), docPath);
    const doc = raw(docPath).toLowerCase();
    for (const cat of ["en venta", "rentas", "bienes ra", "clases", "comunidad", "busco", "mascotas", "autos", "restaurantes", "servicios", "empleos", "viajes", "comida local"]) {
      assert.ok(doc.includes(cat), `category ${cat}`);
    }
    for (const st of ["draft", "pending", "pending_payment", "payment_failed", "published", "active", "paused", "suspended", "rejected", "expired", "sold", "archived", "removed", "cancelled"]) {
      assert.ok(doc.includes(st), `status ${st}`);
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length} FAILURE(S):\n - ${failures.join("\n - ")}`);
    process.exit(1);
  }
  console.log("\nverify-final-dashboard-state-machine: ALL CHECKS PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
