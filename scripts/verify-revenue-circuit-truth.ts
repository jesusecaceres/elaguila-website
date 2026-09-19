/**
 * GLOBAL PUBLICATION CIRCUIT / REVENUE OS / ADMIN TRUTH — regression suite (2026-09-18).
 *
 * Pins, with executable checks against the real pure modules (plus narrow source guards where the
 * behaviour lives in a route/server module that cannot be imported under raw tsx):
 *   1. Webhook health classifier: config presence ≠ runtime proof ≠ recent failure; a missing signing
 *      secret is DEGRADED (never "healthy"); no fake reachability from env presence.
 *   2. Payment circuit: CHECKOUT CREATED ≠ PAID ≠ ENTITLEMENT ACTIVE ≠ LISTING LIVE; a pending row
 *      with a session and no confirmation points at the webhook; cancelled is not a failure.
 *   3. Publication semantics: pending_payment is never PUBLIC; paid+activated is PUBLIC; hidden/expired/
 *      moderated states are reported honestly; unknown category never gets a guessed table.
 *   4. Empleos lifecycle policy: paid draft cannot be published by the owner or the publish mode;
 *      staff-held / rejected / archived rows cannot be re-published; draft saves never demote.
 *   5. Empleos one-application-one-listing client identity.
 *   6. Autos: checkout pre-flight + conditional pending_payment flip; staff suspension is not
 *      owner-restorable; lane selector work preserved.
 *   7. Ofertas Locales hub card + ops contract + honest hub counts (no false "0" from `listings`).
 *   8. Payment Tracker renders the circuit column and cross-link.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-revenue-circuit-truth.ts
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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

async function main() {
  const health = await import("../app/admin/_lib/revenueWebhookHealth");
  const circuit = await import("../app/admin/_lib/paymentCircuit");
  const pub = await import("../app/admin/_lib/publicationSemantics");
  const policy = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const ident = await import("../app/(site)/publicar/empleos/shared/publish/empleosPendingCheckoutIdentity");

  // ── 1. webhook health ────────────────────────────────────────────────────────────────────────
  const emptyLedger = { available: true, lastReceivedAt: null, lastCheckoutCompletedAt: null, failedRetryable7d: 0, failedTerminal7d: 0, latestLivemode: null };
  const NOW = new Date("2026-09-18T12:00:00Z");
  await check("webhook health: key present + webhook secret MISSING → DEGRADED with 503 explanation", () => {
    const h = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "test", webhookSecretPresent: false, supabaseProjectRef: "abc", ledger: emptyLedger, now: NOW });
    assert.equal(h.state, "DEGRADED");
    assert.match(h.message, /503/);
    assert.match(h.message, /STRIPE_WEBHOOK_SECRET/);
  });
  await check("webhook health: neither var → NOT_CONFIGURED", () => {
    assert.equal(health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: false, keyMode: "absent", webhookSecretPresent: false, supabaseProjectRef: null, ledger: emptyLedger, now: NOW }).state, "NOT_CONFIGURED");
  });
  await check("webhook health: config present but NO delivery proof → UNKNOWN (never HEALTHY from env presence)", () => {
    const h = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "live", webhookSecretPresent: true, supabaseProjectRef: null, ledger: emptyLedger, now: NOW });
    assert.equal(h.state, "UNKNOWN");
    assert.match(h.message, /NOT proven/);
    assert.match(h.message, /CONFIG PRESENT/);
  });
  await check("webhook health: recent verified delivery, no failures → HEALTHY; ledger unreadable → UNKNOWN", () => {
    const ok = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "test", webhookSecretPresent: true, supabaseProjectRef: null, now: NOW, ledger: { ...emptyLedger, lastReceivedAt: "2026-09-17T10:00:00Z", lastCheckoutCompletedAt: "2026-09-17T10:00:00Z", latestLivemode: false } });
    assert.equal(ok.state, "HEALTHY");
    const na = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "test", webhookSecretPresent: true, supabaseProjectRef: null, now: NOW, ledger: { ...emptyLedger, available: false } });
    assert.equal(na.state, "UNKNOWN");
  });
  await check("webhook health: failed fulfilments and live/test mode mismatch → DEGRADED", () => {
    const fail = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "test", webhookSecretPresent: true, supabaseProjectRef: null, now: NOW, ledger: { ...emptyLedger, lastReceivedAt: "2026-09-17T10:00:00Z", failedRetryable7d: 2, latestLivemode: false } });
    assert.equal(fail.state, "DEGRADED");
    const mm = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: "live", webhookSecretPresent: true, supabaseProjectRef: null, now: NOW, ledger: { ...emptyLedger, lastReceivedAt: "2026-09-17T10:00:00Z", latestLivemode: false } });
    assert.equal(mm.state, "DEGRADED");
    assert.match(mm.message, /MODE MISMATCH/);
  });
  await check("webhook health: key mode is prefix-only and never echoes the key", () => {
    assert.equal(health.classifyStripeKeyMode("sk_test_SECRET"), "test");
    assert.equal(health.classifyStripeKeyMode("sk_live_SECRET"), "live");
    assert.equal(health.classifyStripeKeyMode(""), "absent");
    const h = health.classifyRevenueWebhookHealth({ stripeSecretKeyPresent: true, keyMode: health.classifyStripeKeyMode("sk_test_TOPSECRET"), webhookSecretPresent: true, supabaseProjectRef: null, ledger: emptyLedger, now: NOW });
    assert.ok(!h.message.includes("TOPSECRET"));
  });
  await check("webhook route logs a SANITIZED rejection (code/status/presence only)", () => {
    const src = raw("app/api/revenue-os/webhook/route.ts");
    assert.match(src, /rejected before ledger/);
    assert.match(src, /signaturePresent: Boolean\(signature\)/);
    assert.ok(!/console\.(error|log)\([^)]*(rawBody|getStripeWebhookSecret|getStripeSecretKey)/.test(src), "must not log body or secrets");
  });
  await check("System Health wires the revenue webhook component", () => {
    const src = raw("app/admin/_lib/adminSystemHealth.ts");
    assert.match(src, /buildRevenueWebhookHealthComponent/);
    assert.match(src, /classifyRevenueWebhookHealth/);
  });

  // ── 2. payment circuit ───────────────────────────────────────────────────────────────────────
  const base = { source: "stripe_checkout", hasCheckoutSession: true, hasListingId: true, billingMode: "subscription", packageEntitlementId: null, entitlementStatus: null, subscriptionStatus: null, listing: null, webhook: null };
  const publicListing = { semantic: "PUBLIC", reason: "Live: published.", rawStatus: "published", source: "servicios_public_listings" } as const;
  const pendingListing = { semantic: "NOT_PUBLIC_PAYMENT", reason: "Saved, waiting for payment.", rawStatus: "pending_payment", source: "servicios_public_listings" } as const;
  await check("circuit: pending + checkout session + no webhook → attention, points to System Health webhook", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "pending", listing: pendingListing });
    assert.equal(c.checkout, "done");
    assert.equal(c.paid, "waiting");
    assert.equal(c.severity, "attention");
    assert.match(c.headline, /Checkout created/);
    assert.match(c.detail, /Revenue OS webhook/);
  });
  await check("circuit: pending without a checkout session is 'Checkout not started' (nothing charged)", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "pending", hasCheckoutSession: false });
    assert.equal(c.checkout, "missing");
    assert.match(c.headline, /not started/);
    assert.equal(c.severity, "waiting");
  });
  await check("circuit: canceled is NOT a failure; failed is attention", () => {
    assert.equal(circuit.derivePaymentCircuit({ ...base, paymentStatus: "canceled" }).severity, "waiting");
    assert.equal(circuit.derivePaymentCircuit({ ...base, paymentStatus: "failed" }).severity, "attention");
  });
  await check("circuit: paid but no entitlement → 'fulfilment did not finish'", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "paid" });
    assert.equal(c.paid, "done");
    assert.equal(c.entitlement, "missing");
    assert.match(c.headline, /fulfilment did not finish/);
  });
  await check("circuit: paid + entitled + listing pending_payment → 'paid but listing not live' (payment ≠ listing)", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "paid", packageEntitlementId: "e1", entitlementStatus: "active", subscriptionStatus: "active", listing: pendingListing });
    assert.equal(c.entitlement, "done");
    assert.equal(c.listing, "blocked");
    assert.equal(c.severity, "attention");
    assert.match(c.headline, /listing is not live/);
  });
  await check("circuit: paid → entitled → live is 'ok' and complete", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "paid", packageEntitlementId: "e1", entitlementStatus: "active", subscriptionStatus: "active", listing: publicListing });
    assert.equal(c.severity, "ok");
    assert.match(c.headline, /Complete/);
  });
  await check("circuit: subscription package with no subscription record is flagged", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "paid", packageEntitlementId: "e1", entitlementStatus: "active", subscriptionStatus: null, listing: publicListing });
    assert.equal(c.severity, "attention");
    assert.match(c.headline, /no subscription record/);
  });
  await check("circuit: failed webhook for a pending payment is surfaced, not hidden", () => {
    const c = circuit.derivePaymentCircuit({ ...base, paymentStatus: "pending", webhook: { status: "failed_retryable", resultCode: "unsafe_status", receivedAt: null } });
    assert.match(c.headline, /fulfilment failed/);
    assert.match(c.detail, /unsafe_status/);
  });

  // ── 3. publication semantics ─────────────────────────────────────────────────────────────────
  await check("semantics: pending_payment is never PUBLIC in any lane vocabulary", () => {
    assert.notEqual(pub.classifyPublication("servicios_public_listings", { listing_status: "pending_payment" }).semantic, "PUBLIC");
    assert.notEqual(pub.classifyPublication("restaurantes_public_listings", { status: "pending_payment" }).semantic, "PUBLIC");
    assert.notEqual(pub.classifyPublication("autos_classifieds_listings", { status: "pending_payment", lane: "negocios" }).semantic, "PUBLIC");
    assert.notEqual(pub.classifyPublication("empleos_public_listings", { lifecycle_status: "draft" }).semantic, "PUBLIC");
    assert.notEqual(pub.classifyPublication("listings", { status: "pending", is_published: false }, { paymentCleared: false }).semantic, "PUBLIC");
  });
  await check("semantics: paid + activated rows are PUBLIC in each vocabulary", () => {
    assert.equal(pub.classifyPublication("servicios_public_listings", { listing_status: "published" }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("restaurantes_public_listings", { status: "published" }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("empleos_public_listings", { lifecycle_status: "published" }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("autos_classifieds_listings", { status: "active", lane: "negocios" }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("listings", { status: "active", is_published: true }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("ofertas_locales", { status: "approved", published_at: "2026-09-01T00:00:00Z" }, { now: NOW }).semantic, "PUBLIC");
    assert.equal(pub.classifyPublication("viajes_staged_listings", { lifecycle_status: "approved", is_public: true }, { now: NOW }).semantic, "PUBLIC");
  });
  await check("semantics: expired privado, hidden generic, expired offer are not PUBLIC", () => {
    assert.equal(pub.classifyPublication("autos_classifieds_listings", { status: "active", lane: "privado", expires_at: "2026-09-01T00:00:00Z" }, { now: NOW }).semantic, "EXPIRED");
    assert.equal(pub.classifyPublication("listings", { status: "active", is_published: false }).semantic, "PAUSED");
    assert.equal(pub.classifyPublication("ofertas_locales", { status: "expired" }).semantic, "EXPIRED");
    assert.equal(pub.classifyPublication("ofertas_locales", { status: "approved", expires_at: "2026-09-01T00:00:00Z", published_at: "2026-08-01T00:00:00Z" }, { now: NOW }).semantic, "EXPIRED");
  });
  await check("semantics: staff moderation is reported as moderation with an honest reason", () => {
    assert.equal(pub.classifyPublication("servicios_public_listings", { listing_status: "suspended", suspended_reason: "payment" }).semantic, "PAUSED");
    const staff = pub.classifyPublication("servicios_public_listings", { listing_status: "suspended" });
    assert.equal(staff.semantic, "NOT_PUBLIC_MODERATION");
    assert.match(staff.reason, /no reason is stored/);
    assert.equal(pub.classifyPublication("autos_classifieds_listings", { status: "removed", suspended_reason: "moderation" }).semantic, "NOT_PUBLIC_MODERATION");
    assert.equal(pub.classifyPublication("autos_classifieds_listings", { status: "removed" }).semantic, "REMOVED");
  });
  await check("semantics: missing row / unrecognised status → UNKNOWN (never a guess); unknown category → no table", () => {
    assert.equal(pub.classifyPublication("listings", null).semantic, "UNKNOWN");
    assert.equal(pub.classifyPublication("listings", { status: "zzz" }).semantic, "UNKNOWN");
    assert.equal(pub.publicationSourceForCategory("mystery"), null);
    assert.equal(pub.publicationSourceForCategory("iglesias"), null);
    assert.equal(pub.publicationSourceForCategory("bienes_raices"), "listings");
    assert.equal(pub.publicationSourceForCategory("ofertas-locales"), "ofertas_locales");
    assert.equal(pub.publicationSourceForCategory("servicios"), "servicios_public_listings");
  });

  // ── 4. empleos lifecycle policy ──────────────────────────────────────────────────────────────
  await check("empleos: paid-lane owner cannot publish a draft; free lane (feria) can", () => {
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "draft", next: "published", hasStaffReason: false }), { ok: false, error: "payment_required" });
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "premium", current: "draft", next: "published", hasStaffReason: false }), { ok: false, error: "payment_required" });
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "feria", current: "draft", next: "published", hasStaffReason: false }), { ok: true });
  });
  await check("empleos: owner cannot resume a staff-held row or reopen a rejected one; pause/resume own is fine", () => {
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "paused", next: "published", hasStaffReason: true }), { ok: false, error: "staff_hold" });
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "rejected", next: "published", hasStaffReason: false }), { ok: false, error: "forbidden_transition" });
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "published", next: "paused", hasStaffReason: false }), { ok: true });
    assert.deepEqual(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "paused", next: "published", hasStaffReason: false }), { ok: true });
  });
  await check("empleos: a never-live archived row cannot be opened by the owner; a once-live one can", () => {
    assert.equal(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "archived", next: "published", hasStaffReason: false, everPublished: false }).ok, false);
    assert.equal(policy.resolveEmpleosOwnerTransition({ lane: "quick", current: "archived", next: "published", hasStaffReason: false, everPublished: true }).ok, true);
  });
  await check("empleos: publish mode — paid lane requires payment; feria publishes; rejected/archived never re-published", () => {
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "quick", existingStatus: null, requireReview: false }), { ok: false, error: "payment_required" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "quick", existingStatus: "draft", requireReview: false }), { ok: false, error: "payment_required" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: null, requireReview: false }), { ok: true, lifecycle: "published" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: null, requireReview: true }), { ok: true, lifecycle: "pending_review" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: "rejected", requireReview: false }), { ok: false, error: "not_publishable" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: "archived", requireReview: false }), { ok: false, error: "not_publishable" });
  });
  await check("empleos: draft save never demotes an existing row; new rows stay draft; published edit stays published", () => {
    for (const st of ["published", "paused", "pending_review", "rejected", "archived"]) {
      assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "draft", lane: "quick", existingStatus: st, requireReview: false }), { ok: true, lifecycle: st });
    }
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "draft", lane: "quick", existingStatus: null, requireReview: false }), { ok: true, lifecycle: "draft" });
    assert.deepEqual(policy.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "quick", existingStatus: "published", requireReview: false }), { ok: true, lifecycle: "published" });
  });
  await check("empleos: owner PATCH route + envelope writer use the policy and the writer preserves staff notes", () => {
    const db = raw("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    assert.match(db, /resolveEmpleosUpsertLifecycle\(/);
    assert.match(db, /resolveEmpleosOwnerTransition\(/);
    assert.match(db, /moderation_reason: prior\.moderation_reason/);
    const route = raw("app/api/clasificados/empleos/listings/[listingId]/route.ts");
    assert.match(route, /payment_required/);
  });

  // ── 5. empleos identity (one application, one listing) ───────────────────────────────────────
  class Mem {
    m = new Map<string, string>();
    getItem(k: string) { return this.m.has(k) ? (this.m.get(k) as string) : null; }
    setItem(k: string, v: string) { this.m.set(k, v); }
    removeItem(k: string) { this.m.delete(k); }
  }
  const ID = "11111111-2222-3333-4444-555555555555";
  await check("empleos identity: remembered id is reused for the same lane+title, never for another post", () => {
    const s = new Mem();
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "Cocinero" }), null);
    ident.rememberEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "Cocinero", listingId: ID });
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "  cocinero " }), ID);
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "premium", title: "Cocinero" }), null);
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "Mesero" }), null);
    ident.clearEmpleosPendingCheckoutListingId(s);
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "Cocinero" }), null);
  });
  await check("empleos identity: garbage / non-uuid / unavailable storage never throws or blocks checkout", () => {
    const s = new Mem();
    s.setItem(ident.EMPLEOS_PENDING_CHECKOUT_LISTING_KEY, "{not json");
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "x" }), null);
    ident.rememberEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "x", listingId: "not-a-uuid" });
    assert.equal(ident.readEmpleosPendingCheckoutListingId(s, { lane: "quick", title: "x" }), null);
    const boom = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
    assert.equal(ident.readEmpleosPendingCheckoutListingId(boom, { lane: "quick", title: "x" }), null);
    ident.rememberEmpleosPendingCheckoutListingId(boom, { lane: "quick", title: "x", listingId: ID });
    ident.clearEmpleosPendingCheckoutListingId(boom);
    assert.equal(ident.readEmpleosPendingCheckoutListingId(null, { lane: "quick", title: "x" }), null);
  });
  await check("empleos paid checkout helper sends the remembered id and retries fresh on a stale one", () => {
    const src = raw("app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts");
    assert.match(src, /readEmpleosPendingCheckoutListingId/);
    assert.match(src, /rememberEmpleosPendingCheckoutListingId/);
    assert.match(src, /clearEmpleosPendingCheckoutListingId/);
  });

  // ── 6. autos authority ───────────────────────────────────────────────────────────────────────
  await check("autos: checkout pre-flight refuses missing / foreign / non-payable listings BEFORE Stripe", () => {
    const src = raw("app/api/revenue-os/checkout/route.ts");
    const pre = src.indexOf("autos_listing_not_payable");
    const stripe = src.indexOf("createPendingPaymentRecord({");
    assert.ok(pre > 0 && stripe > 0 && pre < stripe, "pre-flight must precede payment-record / Stripe session creation");
    assert.match(src, /autos_listing_owner_mismatch/);
    assert.match(src, /autos_listing_not_found/);
    assert.match(src, /isAutosListingPayableStatus\(autosRow\.status\)/);
  });
  await check("autos: setAutosListingPendingPayment is a status-CONDITIONAL update (never flips active/removed/cancelled)", () => {
    const src = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(src, /AUTOS_PAYABLE_LISTING_STATUSES/);
    const fn = src.slice(src.indexOf("export async function setAutosListingPendingPayment"));
    assert.match(fn.slice(0, 700), /\.in\("status", \[\.\.\.AUTOS_PAYABLE_LISTING_STATUSES\]\)/);
  });
  await check("autos: only pre-payment statuses are payable", async () => {
    const src = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const m = src.match(/AUTOS_PAYABLE_LISTING_STATUSES[^=]*=\s*\[([^\]]*)\]/);
    assert.ok(m, "constant present");
    const vals = (m as RegExpMatchArray)[1].split(",").map((x) => x.replace(/["'\s]/g, "")).filter(Boolean).sort();
    assert.deepEqual(vals, ["draft", "payment_failed", "pending_payment"]);
  });
  await check("autos: a VERIFIED payment activates draft/payment_failed rows too (paid-but-stuck-in-draft fix); removed/cancelled stay refused", () => {
    const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const fn = svc.slice(svc.indexOf("export async function tryActivateAutosListingAfterPayment"));
    assert.match(fn.slice(0, 2500), /!isAutosListingPayableStatus\(existing\.status\)/);
    assert.match(fn.slice(0, 2500), /fromStatus: existing\.status/);
    assert.match(fn, /\.in\("status", \[\.\.\.AUTOS_PAYABLE_LISTING_STATUSES\]\)/);
    assert.ok(!/removed|cancelled/.test(svc.match(/AUTOS_PAYABLE_LISTING_STATUSES[^=]*=\s*\[([^\]]*)\]/)![1]), "removed/cancelled must not be payable/activatable");
    assert.match(raw("app/lib/listingPlans/revenueAutosPrivadoFulfillment.ts"), /!isAutosListingPayableStatus\(row\.status\)/);
    assert.match(raw("app/lib/listingPlans/revenueAutosDealerFulfillment.ts"), /!isAutosListingPayableStatus\(row\.status\) && row\.status !== "active"/);
  });
  await check("autos: staff suspend/remove writes suspended_reason=moderation; owner restore refuses it (both restore paths)", () => {
    const admin = raw("app/api/admin/autos/listings/[id]/route.ts");
    assert.match(admin, /patch\.suspended_reason = "moderation"/);
    assert.match(admin, /patch\.suspended_reason = null/);
    const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(svc, /if \(row\.suspended_reason\) return false;/);
    const restore = raw("app/api/clasificados/autos/listings/[id]/restore/route.ts");
    assert.match(restore, /suspended_by_staff/);
    assert.ok(restore.indexOf("suspended_by_staff") < restore.indexOf("activateAutosDealerListingAtomic({ listingId: id"), "guard precedes the RPC path");
  });
  await check("autos: Dealer / Privado lane selector work is preserved", () => {
    const lanes = raw("app/admin/_lib/adminAutosLanes.ts");
    assert.match(lanes, /Dealers de Autos/);
    assert.match(lanes, /Autos Privados/);
    const page = raw("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
    assert.match(page, /adminAutosLaneHref|laneHref/);
    const panel = raw("app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx");
    assert.match(panel, /clasificados-autos-lane-panel/);
    const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(svc, /\.eq\("lane", opts\.lane\)/);
  });

  // ── 7. ofertas locales hub coverage ──────────────────────────────────────────────────────────
  await check("ofertas-locales: ops contract + hub card exist and resolve to the real Admin queue (no dead link)", async () => {
    const ops = await import("../app/admin/_lib/classifiedsOpsContract");
    const c = ops.getClassifiedsOpsContract("ofertas-locales");
    assert.ok(c, "ops contract entry");
    assert.equal(c!.writableTable, "ofertas_locales");
    assert.equal(c!.adQueueAdminPath, "/admin/workspace/clasificados/ofertas-locales");
    assert.ok(!c!.fieldsNotesAdminPath.includes("/category/ofertas-locales"), "must not link a schema-less /category page (404)");
    const hub = await import("../app/admin/_lib/adminCategoriesHubEntries");
    const merged = hub.mergeAdminCategoriesHubEntries([]);
    assert.ok(merged.some((e: { slug: string }) => e.slug === "ofertas-locales"), "hub card present");
    assert.ok(merged.some((e: { slug: string }) => e.slug === "comida-local"), "existing supplemental card kept");
    assert.ok(!merged.some((e: { slug: string }) => e.slug === "iglesias" || e.slug === "recursos"), "Iglesias / Recursos are not classifieds");
  });
  await check("ofertas-locales: hub stats and ops audit read the dedicated table (no false 0 from `listings`)", () => {
    const stats = raw("app/admin/_lib/adminCategoryListingStats.ts");
    assert.match(stats, /"ofertas-locales": \{ table: "ofertas_locales"/);
    const audit = raw("app/admin/_lib/adminClasificadosCategoryOpsAudit.ts");
    assert.match(audit, /"ofertas-locales": \{ table: "ofertas_locales"/);
    const href = raw("app/admin/_lib/adminCategoryWorkspaceQueueHref.ts");
    assert.match(href, /case "ofertas-locales":/);
  });

  // ── 8. payment tracker surfaces the circuit ──────────────────────────────────────────────────
  await check("payment tracker: circuit column, four-facts legend, and listing cross-link are rendered", () => {
    const page = raw("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
    assert.match(page, /payment-circuit-legend/);
    assert.match(page, /Circuit \/ diagnosis/);
    assert.match(page, /Open listing in Admin/);
    assert.match(page, /Checkout created ≠ Paid ≠ Entitlement active ≠ Listing live/);
    const data = raw("app/admin/_lib/paymentTrackerData.ts");
    assert.match(data, /derivePaymentCircuit\(/);
    assert.match(data, /publicationSourceForCategory/);
    assert.match(data, /leonix_stripe_webhook_events/);
    // Read-only: the enrichment module must not write.
    assert.ok(!/\.(insert|update|upsert|delete)\(/.test(data), "payment tracker data layer must be read-only");
  });
  await check("payment circuit + publication semantics modules perform no I/O and no writes", () => {
    for (const f of ["app/admin/_lib/paymentCircuit.ts", "app/admin/_lib/publicationSemantics.ts", "app/admin/_lib/revenueWebhookHealth.ts"]) {
      const src = raw(f);
      assert.ok(!/from\("|\.from\(|fetch\(|process\.env/.test(src), `${f} must be pure`);
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
