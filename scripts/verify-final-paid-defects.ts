/**
 * FINAL PAID CIRCUIT DEFECTS — semantic port onto the golden survivor (2026-09-25).
 *
 * Source: integration/category-circuit-closeout-2026-09 (d3ed73abf, 8b25d418a, 1e80c0240) and the narrow
 * checkout part of 078c806c7. Only the checkout / Restaurantes-publish / Comida-consent parts were ported; the
 * Empleos-lane (D13/F1), free-Clases restore (F6) and feria (F7) checks of the branch verifier belong to other
 * files and are NOT pinned here.
 *
 * ADAPTED to golden:
 *  - D3: the owner is the bearer ONLY (body.ownerUserId never read). A global "no bearer -> 401" was NOT added
 *    (golden's IX rewards mutation harness keeps a bearer-absent credits mutation reachable); instead every new
 *    pre-flight refuses a bearer-absent request as auth_required.
 *  - D4: the subscription pre-flights gate on isBusinessBasePackageKey (Quick AND Full) for Servicios /
 *    Restaurantes / Bienes Negocio, and SKIP the pre-publish status check for golden's server-derived
 *    `businessUpgradeInPlace` (a live Simple listing buying Full must still work).
 *
 * The checkout route is EXECUTED through the harness (scripts/lib/tsconfig.harness.json maps Stripe / Supabase /
 * server-only onto recorders); a few source guards remain where the behaviour lives in a client component or in
 * the Restaurantes publish route.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-final-paid-defects.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

import { RECURRING_CONSENT_TEXT_VERSION } from "@/app/lib/listingPlans/recurringConsentCopy";
import { computeCheckoutAttemptKey } from "@/app/lib/listingPlans/checkoutAttemptIdentity";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY,
  resolveCheckoutListingSource,
} from "@/app/lib/listingPlans/revenueListingSourceResolver";
import { businessCategoryListingSource } from "@/app/lib/listingPlans/businessBasePlanOfferPolicy";
import {
  __reset,
  __rows,
  __seed,
  __setBearerTokens,
  __resetStripe,
  __stripeSessions,
} from "./lib/harnessControls";

const failures: string[] = [];
let checks = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  checks += 1;
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");
const noComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONSENT = { accepted: true, consentTextVersion: RECURRING_CONSENT_TEXT_VERSION, lang: "es" };
const PAST = "2026-01-01T00:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";

async function main() {
  process.env.STRIPE_SECRET_KEY = "sk_test_harness";
  const checkout = await import("@/app/api/revenue-os/checkout/route");
  const client = await import("@/app/lib/listingPlans/revenueCategoryCheckoutClient");
  const restFulfil = await import("@/app/lib/listingPlans/revenueRestaurantFulfillment");

  function fresh(): void {
    __reset();
    __resetStripe();
    __setBearerTokens({ tok: OWNER });
  }
  async function post(body: Record<string, unknown>, opts: { bearer?: boolean } = {}): Promise<{ status: number; json: Record<string, unknown> }> {
    process.env.STRIPE_SECRET_KEY = "sk_test_harness";
    const url = "http://x/api/revenue-os/checkout";
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (opts.bearer !== false) headers.authorization = "Bearer tok";
    const req = new Request(url, { method: "POST", headers, body: JSON.stringify(body) });
    Object.defineProperty(req, "nextUrl", { value: new URL(url), configurable: true });
    const res = await checkout.POST(req as never);
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, json };
  }
  const base = (category: string, packageKey: string, listingId: string, extra: Record<string, unknown> = {}) => ({
    category,
    packageKey,
    listingId,
    successUrl: "http://x/ok",
    cancelUrl: "http://x/no",
    ...extra,
  });
  const noSession = () => assert.equal(__stripeSessions().length, 0, "no Stripe session was created");
  const noPaymentRecord = () => assert.equal(__rows("leonix_payment_records").length, 0, "no payment record was written");

  // ── D3 — owner is the bearer only ─────────────────────────────────────────────────────────────────
  await check("D3 source: the default branch owner is the bearer only; body.ownerUserId is never read by the route", () => {
    const code = noComments(raw("app/api/revenue-os/checkout/route.ts"));
    assert.doesNotMatch(code, /body\.ownerUserId/);
    const i = code.indexOf("const ownerUserId = isRestauranteAddonOnlyEarly");
    assert.ok(i > 0);
    assert.match(code.slice(i, i + 600), /\? serverVerifiedOwnerUserId \?\? bearerUserId\n\s*: bearerUserId;/);
  });
  await check("D3: every real caller sends the bearer and refuses to call without a session; the payload never carries an owner id", () => {
    for (const f of ["app/lib/listingPlans/revenueCategoryCheckoutClient.ts", "app/lib/listingLifecycle/listingRenewalCheckout.ts"]) {
      const s = raw(f);
      assert.match(s, /Authorization: `Bearer \$\{token\}`/, f);
      assert.match(s, /if \(!token\)/, f);
    }
    assert.doesNotMatch(raw("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts"), /ownerUserId/);
  });
  await check("D3 behaviour: a body.ownerUserId naming another customer never becomes the payment owner", async () => {
    fresh();
    __seed("empleos_public_listings", [{ id: "emp-1", owner_user_id: OWNER, lifecycle_status: "draft" }]);
    const r = await post({ ...base("empleos", "empleos_job_post_paid", "emp-1"), ownerUserId: OTHER });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const recs = __rows("leonix_payment_records");
    assert.equal(recs.length, 1);
    assert.equal(recs[0]!.owner_user_id, OWNER);
  });
  await check("D3 behaviour: a bearer-absent request naming an owner is refused by the pre-flights (auth_required), nothing written", async () => {
    fresh();
    __seed("empleos_public_listings", [{ id: "emp-1", owner_user_id: OWNER, lifecycle_status: "draft" }]);
    const r = await post({ ...base("empleos", "empleos_job_post_paid", "emp-1"), ownerUserId: OWNER }, { bearer: false });
    assert.equal(r.status, 401, JSON.stringify(r.json));
    assert.equal(r.json.code, "auth_required");
    noSession();
    noPaymentRecord();
    __seed("servicios_public_listings", [{ id: "svc-1", owner_user_id: OWNER, listing_status: "pending_payment" }]);
    const s = await post({ ...base("servicios", "servicios_quick_monthly", "svc-1"), ownerUserId: OWNER, recurringConsent: CONSENT }, { bearer: false });
    assert.equal(s.status, 401, JSON.stringify(s.json));
    assert.equal(__rows("leonix_billing_consents").length, 0, "no consent row for a forged owner");
  });

  // ── Empleos / listings paid lanes / Viajes (d3 #1 + 8b amendment) ─────────────────────────────────
  await check("Empleos paid post: missing 404, other owner 403, non-draft 409 no-recharge, owned draft 200", async () => {
    fresh();
    assert.equal((await post(base("empleos", "empleos_job_post_paid", "nope"))).json.code, "empleos_listing_not_found");
    __seed("empleos_public_listings", [
      { id: "emp-o", owner_user_id: OTHER, lifecycle_status: "draft" },
      { id: "emp-live", owner_user_id: OWNER, lifecycle_status: "published" },
      { id: "emp-d", owner_user_id: OWNER, lifecycle_status: "draft" },
    ]);
    const o = await post(base("empleos", "empleos_job_post_paid", "emp-o"));
    assert.equal(o.status, 403);
    assert.equal(o.json.code, "empleos_listing_owner_mismatch");
    const l = await post(base("empleos", "empleos_job_post_paid", "emp-live"));
    assert.equal(l.status, 409);
    assert.equal(l.json.code, "already_published_no_recharge");
    noSession();
    const d = await post(base("empleos", "empleos_job_post_paid", "emp-d"));
    assert.equal(d.status, 200, JSON.stringify(d.json));
  });
  await check("listings lanes: rentas / FSBO / Clases need an owned, unpublished `pending` row of the right category (FSBO = private seller)", async () => {
    fresh();
    __seed("listings", [
      { id: "r-live", owner_id: OWNER, category: "rentas", status: "active", is_published: true },
      { id: "r-other", owner_id: OTHER, category: "rentas", status: "pending", is_published: false },
      { id: "r-wrongcat", owner_id: OWNER, category: "en-venta", status: "pending", is_published: false },
      { id: "r-ok", owner_id: OWNER, category: "rentas", status: "pending", is_published: false },
      { id: "br-biz", owner_id: OWNER, category: "bienes-raices", status: "pending", is_published: false, seller_type: "business", listing_json: {} },
      { id: "br-fsbo", owner_id: OWNER, category: "bienes-raices", status: "pending", is_published: false, seller_type: "personal", listing_json: {} },
    ]);
    const live = await post(base("rentas", "rentas_30d", "r-live"));
    assert.equal(live.status, 409);
    assert.equal(live.json.code, "already_published_no_recharge");
    assert.equal((await post(base("rentas", "rentas_30d", "r-other"))).status, 403);
    assert.equal((await post(base("rentas", "rentas_30d", "r-wrongcat"))).status, 404);
    const biz = await post(base("bienes-raices", "br_fsbo_45d", "br-biz"));
    assert.equal(biz.status, 404, "an FSBO payment for a Negocio row is refused");
    noSession();
    assert.equal((await post(base("rentas", "rentas_30d", "r-ok"))).status, 200);
    assert.equal((await post(base("bienes-raices", "br_fsbo_45d", "br-fsbo"))).status, 200);
  });
  await check("listings lanes source: renew_listing keeps its own validators (pre-flight skipped for renewals)", () => {
    const s = raw("app/api/revenue-os/checkout/route.ts");
    assert.match(s, /expectedListingsCategory && operationEarly !== "renew_listing" && listingRef/);
  });
  await check("Viajes business monthly is refused (no fulfilment, no golden client) before consent / payment record / Stripe", async () => {
    fresh();
    const r = await post(base("viajes", "viajes_business_monthly", "v-1", { recurringConsent: CONSENT }));
    assert.equal(r.status, 422, JSON.stringify(r.json));
    assert.equal(r.json.code, "viajes_checkout_not_available");
    noSession();
    noPaymentRecord();
    assert.equal(__rows("leonix_billing_consents").length, 0);
  });

  // ── 8b #7 — Autos lane / inventory child ──────────────────────────────────────────────────────────
  await check("Autos: package lane must equal row.lane; an inventory_vehicle never starts its own base charge", async () => {
    fresh();
    const row = (id: string, lane: string, role: string | null, status = "draft") => ({
      id,
      owner_user_id: OWNER,
      lane,
      inventory_role: role,
      status,
      listing_payload: {},
      lang: "es",
    });
    __seed("autos_classifieds_listings", [
      row("a-neg", "negocios", "main"),
      row("a-child", "negocios", "inventory_vehicle"),
      row("a-priv", "privado", null),
    ]);
    const m1 = await post(base("autos", "autos_privado_30d", "a-neg"));
    assert.equal(m1.status, 409);
    assert.equal(m1.json.code, "autos_listing_package_mismatch");
    const m2 = await post(base("autos", "autos_dealer_quick_monthly", "a-priv", { recurringConsent: CONSENT }));
    assert.equal(m2.json.code, "autos_listing_package_mismatch", "Quick dealer key is covered too");
    const m3 = await post(base("autos", "autos_dealer_monthly", "a-child", { recurringConsent: CONSENT }));
    assert.equal(m3.json.code, "autos_listing_package_mismatch");
    noSession();
    const ok = await post(base("autos", "autos_privado_30d", "a-priv"));
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
  });

  // ── D4 — subscription base pre-flights, adapted (Quick + Full + upgrade in place) ─────────────────
  await check("D4 Servicios (Quick and Full): owner + activatable status; published without upgrade = no-recharge", async () => {
    fresh();
    __seed("servicios_public_listings", [
      { id: "s-pend", owner_user_id: OWNER, listing_status: "pending_payment" },
      { id: "s-paused", owner_user_id: OWNER, listing_status: "paused_unpublished" },
      { id: "s-other", owner_user_id: OTHER, listing_status: "pending_payment" },
      { id: "s-live", owner_user_id: OWNER, listing_status: "published" },
      { id: "s-susp", owner_user_id: OWNER, listing_status: "suspended" },
    ]);
    assert.equal((await post(base("servicios", "servicios_quick_monthly", "s-other", { recurringConsent: CONSENT }))).json.code, "listing_owner_mismatch");
    assert.equal((await post(base("servicios", "servicios_base_monthly", "missing", { recurringConsent: CONSENT }))).json.code, "listing_not_found");
    assert.equal((await post(base("servicios", "servicios_base_monthly", "s-live", { recurringConsent: CONSENT }))).json.code, "already_published_no_recharge");
    assert.equal((await post(base("servicios", "servicios_quick_monthly", "s-susp", { recurringConsent: CONSENT }))).json.code, "listing_not_checkout_eligible");
    noSession();
    assert.equal(__rows("leonix_billing_consents").length, 0, "refused before the consent row");
    assert.equal((await post(base("servicios", "servicios_quick_monthly", "s-pend", { recurringConsent: CONSENT }))).status, 200);
    assert.equal((await post(base("servicios", "servicios_base_monthly", "s-paused", { recurringConsent: CONSENT }))).status, 200);
  });
  await check("D4 upgrade in place: a LIVE Simple (Quick) Servicios listing buying Full passes the status pre-flight", async () => {
    fresh();
    __seed("servicios_public_listings", [{ id: "s-up", owner_user_id: OWNER, listing_status: "published" }]);
    __seed("listing_package_entitlements", [
      {
        id: "ent-q",
        listing_id: "s-up",
        listing_source: "servicios_public_listings",
        category: "servicios",
        package_key: "servicios_quick_monthly",
        status: "active",
        grant_source: "admin_manual",
        package_tier: null,
        starts_at: PAST,
        ends_at: FUTURE,
      },
    ]);
    const r = await post(base("servicios", "servicios_base_monthly", "s-up", { recurringConsent: CONSENT }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    // ...but the owner check still applies to an upgrade.
    __setBearerTokens({ tok: OTHER });
    const o = await post(base("servicios", "servicios_base_monthly", "s-up", { recurringConsent: CONSENT }));
    assert.equal(o.json.code, "listing_owner_mismatch");
  });
  await check("D4 Restaurantes (Quick + Full): archived / suspended never start a base payment; pending_payment does", async () => {
    fresh();
    __seed("restaurantes_public_listings", [
      { id: "rs-arch", owner_user_id: OWNER, status: "archived" },
      { id: "rs-pend", owner_user_id: OWNER, status: "pending_payment" },
    ]);
    assert.equal((await post(base("restaurantes", "restaurantes_base_monthly", "rs-arch", { recurringConsent: CONSENT }))).json.code, "listing_not_checkout_eligible");
    assert.equal((await post(base("restaurantes", "restaurantes_quick_monthly", "rs-arch", { recurringConsent: CONSENT }))).json.code, "listing_not_checkout_eligible");
    noSession();
    assert.equal((await post(base("restaurantes", "restaurantes_quick_monthly", "rs-pend", { recurringConsent: CONSENT }))).status, 200);
  });
  await check("D4 Comida Local base: owner + draft/pending_payment only", async () => {
    fresh();
    __seed("comida_local_public_listings", [
      { id: "c-pub", owner_user_id: OWNER, status: "published" },
      { id: "c-pend", owner_user_id: OWNER, status: "pending_payment" },
    ]);
    assert.equal((await post(base("comida-local", "comida_local_base_monthly", "c-pub", { recurringConsent: CONSENT }))).json.code, "already_published_no_recharge");
    assert.equal((await post(base("comida-local", "comida_local_base_monthly", "c-pend", { recurringConsent: CONSENT }))).status, 200);
  });
  await check("D4 Bienes Negocio (Quick + Full): business MAIN parent, owned, pending + unpublished", async () => {
    fresh();
    const br = (id: string, over: Record<string, unknown>) => ({
      id,
      owner_id: OWNER,
      category: "bienes-raices",
      status: "pending",
      is_published: false,
      seller_type: "business",
      inventory_role: "main",
      ...over,
    });
    __seed("listings", [
      br("b-child", { inventory_role: "inventory" }),
      br("b-fsbo", { seller_type: "personal" }),
      br("b-paused", { status: "paused" }),
      br("b-other", { owner_id: OTHER }),
      br("b-ok", {}),
      br("b-legacy", { inventory_role: null }),
    ]);
    const c = CONSENT;
    assert.equal((await post(base("bienes-raices", "br_agent_monthly", "b-child", { recurringConsent: c }))).json.code, "listing_package_mismatch");
    assert.equal((await post(base("bienes-raices", "br_agent_quick_monthly", "b-fsbo", { recurringConsent: c }))).json.code, "listing_not_found");
    assert.equal((await post(base("bienes-raices", "br_agent_monthly", "b-paused", { recurringConsent: c }))).json.code, "listing_not_checkout_eligible");
    assert.equal((await post(base("bienes-raices", "br_agent_monthly", "b-other", { recurringConsent: c }))).json.code, "listing_owner_mismatch");
    noSession();
    assert.equal((await post(base("bienes-raices", "br_agent_monthly", "b-ok", { recurringConsent: c }))).status, 200);
    assert.equal((await post(base("bienes-raices", "br_agent_quick_monthly", "b-legacy", { recurringConsent: c }))).status, 200);
  });
  await check("D4 source: pre-flights use the activators' own status sets, gate on isBusinessBasePackageKey, honour businessUpgradeInPlace, and run before consent / payment record / Stripe", () => {
    const s = raw("app/api/revenue-os/checkout/route.ts");
    const start = s.indexOf("// ── Per-lane pre-flights");
    const end = s.indexOf("const canonicalListingSource = resolveCheckoutListingSource(");
    assert.ok(start > 0 && end > start);
    const blk = s.slice(start, end);
    for (const k of [
      'isBusinessBasePackageKey("servicios", packageDef.packageKey)',
      'isBusinessBasePackageKey("restaurantes", packageDef.packageKey)',
      'isBusinessBasePackageKey("bienes-raices", packageDef.packageKey)',
      "COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY",
      "SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "!businessUpgradeInPlace && !subscriptionLane.activatable.includes(laneStatus)",
      "!businessUpgradeInPlace &&\n      (String(brRow.status",
      'brRole && brRole !== "main"',
    ]) {
      assert.ok(blk.includes(k), `pre-flight block references ${k}`);
    }
    assert.ok(s.indexOf("const businessUpgradeInPlace =") < start, "upgrade decision is made before the pre-flights");
    for (const later of ["createRecurringConsentRecord({", "createPendingPaymentRecord({", "createRevenueStripeCheckoutSession("]) {
      assert.ok(end < s.indexOf(later), `pre-flights precede ${later}`);
    }
  });

  // ── 8b #6 — no second Stripe session while the first may be paid ─────────────────────────────────
  await check("prior session: an unverifiable prior session answers 503 and releases NOTHING (record + credit hold kept)", async () => {
    fresh();
    __seed("empleos_public_listings", [{ id: "emp-p", owner_user_id: OWNER, lifecycle_status: "draft" }]);
    const def = getRevenuePackageDefinition("empleos_job_post_paid")!;
    const key = computeCheckoutAttemptKey({
      ownerUserId: OWNER,
      listingSource: "empleos_public_listings",
      listingId: "emp-p",
      packageKey: "empleos_job_post_paid",
      addOns: [],
      billingMode: def.billingMode,
      operation: null,
    });
    __seed("leonix_payment_records", [
      { id: "pr-prior", checkout_attempt_key: key, payment_status: "pending", stripe_checkout_session_id: "cs_test_prior", attempt_generation: 1 },
    ]);
    // The harness Stripe stub answers `sessions.retrieve` without a status -> "unknown".
    const r = await post(base("empleos", "empleos_job_post_paid", "emp-p"));
    assert.equal(r.status, 503, JSON.stringify(r.json));
    assert.equal(r.json.code, "checkout_state_unverifiable");
    noSession();
    const prior = __rows("leonix_payment_records").find((x) => x.id === "pr-prior");
    assert.equal(prior?.payment_status, "pending", "the prior attempt is not released");
  });
  await check("prior session source: `complete` -> 409 payment_in_progress, checked for ANY prior session before the stale release and the credit-hold release", () => {
    const s = raw("app/api/revenue-os/checkout/route.ts");
    const guard = s.indexOf("if (priorSessionId) {\n      const priorState = await retrieveRevenueCheckoutSessionState(priorSessionId);");
    assert.ok(guard > 0);
    assert.match(s.slice(guard, guard + 900), /priorState\.status === "complete"[\s\S]*code: "payment_in_progress"[\s\S]*status: 409[\s\S]*priorState\.status === "unknown"[\s\S]*code: "checkout_state_unverifiable"[\s\S]*status: 503/);
    assert.ok(guard < s.indexOf("await releaseStaleCheckoutAttempt(existingAttempt.id);"));
    assert.ok(guard < s.indexOf('reason: "stale_checkout_attempt_released"'), "golden credit-hold release stays after");
    assert.ok(s.indexOf("if (discountSourceMatches && priorSessionId) {") < guard, "open-session reuse still runs first");
  });

  // ── 078c806c7 (narrow) — server-derived listing source ────────────────────────────────────────────
  await check("listing source: every matrix category maps to the table golden actually uses; business map agrees", () => {
    const expected: Record<string, string> = {
      servicios: "servicios_public_listings",
      restaurantes: "restaurantes_public_listings",
      autos: "autos_classifieds_listings",
      "bienes-raices": "listings",
      rentas: "listings",
      clases: "listings",
      empleos: "empleos_public_listings",
      "comida-local": "comida_local_public_listings",
      "ofertas-locales": "ofertas_locales",
      viajes: "viajes_staged_listings",
    };
    for (const [cat, table] of Object.entries(expected)) assert.equal(CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[cat], table, cat);
    for (const cat of ["servicios", "restaurantes", "autos", "bienes-raices"]) {
      assert.equal(CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[cat], businessCategoryListingSource(cat)?.table, `${cat} agrees with the Quick/Full source map`);
    }
    const matrix = raw("app/lib/listingPlans/revenuePricingMatrix.ts");
    for (const m of matrix.matchAll(/category: "([a-z-]+)"/g)) {
      assert.ok(CANONICAL_REVENUE_LISTING_SOURCE_BY_CATEGORY[m[1]!], `matrix category ${m[1]} has a canonical source`);
    }
    assert.equal(resolveCheckoutListingSource({ category: "servicios", clientSourceTable: "evil" }), "servicios_public_listings");
    assert.equal(resolveCheckoutListingSource({ category: "unknown-cat", clientSourceTable: " legacy " }), "legacy");
    assert.equal(resolveCheckoutListingSource({ category: "unknown-cat" }), null);
  });
  await check("listing source behaviour: a client sourceTable cannot steer the consent row or the attempt key", async () => {
    fresh();
    __seed("servicios_public_listings", [{ id: "s-src", owner_user_id: OWNER, listing_status: "pending_payment" }]);
    const r = await post(base("servicios", "servicios_quick_monthly", "s-src", { recurringConsent: CONSENT, sourceTable: "evil_table" }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const consents = __rows("leonix_billing_consents");
    assert.equal(consents.length, 1);
    assert.equal(consents[0]!.listing_source, "servicios_public_listings");
    const def = getRevenuePackageDefinition("servicios_quick_monthly")!;
    const key = computeCheckoutAttemptKey({
      ownerUserId: OWNER,
      listingSource: "servicios_public_listings",
      listingId: "s-src",
      packageKey: "servicios_quick_monthly",
      addOns: [],
      billingMode: def.billingMode,
      operation: null,
    });
    assert.equal(__rows("leonix_payment_records")[0]!.checkout_attempt_key, key);
  });

  // ── D1/F2 + d3 #8 — Restaurantes publish ──────────────────────────────────────────────────────────
  await check("D1/F2 source: a NEW Restaurantes row needs pending_payment or a staff save_for_client (402 otherwise), before slug / insert", () => {
    const s = raw("app/api/clasificados/restaurantes/publish/route.ts");
    const elseBranch = s.indexOf("} else {\n      // D1 / F2");
    assert.ok(elseBranch > 0, "guard is the first statement of the new-row branch");
    const guard = s.indexOf('if (!pendingPayment && !isAssistedSaveForClient) {\n        return NextResponse.json({ ok: false, error: "payment_required" }, { status: 402 });', elseBranch);
    assert.ok(guard > elseBranch && guard < s.indexOf("allocateSlug(base)", elseBranch));
    assert.ok(guard < s.indexOf('.from("restaurantes_public_listings").insert(', elseBranch));
    assert.match(s, /resolveRestauranteOwnerEditTargetStatus\(ex\.status\)/, "existing-row status authority untouched");
    assert.match(s, /if \(isAssistedPublishForClient\) \{\n\s*if \(!existingByDraft\?\.id\) \{/, "assisted publish still requires an existing row");
  });
  await check("D1/F2: every NEW-row caller sends pending_payment (self-service/Quick pre-checkout save + staff Quick Sales save)", () => {
    assert.match(raw("app/(site)/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts"), /activationMode: "pending_payment"/);
    assert.match(raw("app/lib/sales/assistedSaveForClientClient.ts"), /assistedAction: "save_for_client", draft: payload\.draft, activation_mode: "pending_payment"/);
    const app = raw("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
    assert.equal((app.match(/api\/clasificados\/restaurantes\/publish/g) ?? []).length, 1, "one unflagged POST: the existing dashboard listing save");
    assert.match(app, /isExistingDashboardListingMode/);
  });
  await check("d3 #8 source: duplicate-tolerant lookup (oldest, limit 1) and compare-and-set update by primary key", () => {
    const s = raw("app/api/clasificados/restaurantes/publish/route.ts");
    assert.match(s, /\.order\("published_at", \{ ascending: true, nullsFirst: false \}\)\n\s*\.order\("id", \{ ascending: true \}\)\n\s*\.limit\(1\);\n\s*const existingByDraft = \(existingRowsByDraft \?\? \[\]\)\[0\] \?\? null;/);
    assert.match(s, /\.eq\("id", existingListingId as string\)\n\s*\.eq\("status", statusDecision\.targetStatus\)/);
    assert.doesNotMatch(noComments(s), /\.eq\("draft_listing_id", draft\.draftListingId\)\n\s*\.eq\("status"/);
  });

  // ── D9 — archived not activatable ─────────────────────────────────────────────────────────────────
  await check("D9 behaviour: a paid Restaurantes row that is archived stays archived (terminal ok:true unsafe_status); pending_payment activates", async () => {
    __reset();
    assert.deepEqual([...restFulfil.RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES], ["pending_payment"]);
    __seed("restaurantes_public_listings", [
      { id: "ra", status: "archived", published_at: null, listing_json: {} },
      { id: "rp", status: "pending_payment", published_at: null, listing_json: {} },
    ]);
    const a = await restFulfil.activatePaidRestauranteListingFromRevenueOs({ listingId: "ra", packageKey: "restaurantes_base_monthly" });
    assert.equal(a.ok, true);
    assert.equal(a.outcome, "unsafe_status");
    assert.match(String(a.message), /needs staff action/);
    assert.equal(__rows("restaurantes_public_listings").find((r) => r.id === "ra")?.status, "archived");
    const p = await restFulfil.activatePaidRestauranteListingFromRevenueOs({ listingId: "rp", packageKey: "restaurantes_quick_monthly" });
    assert.equal(p.outcome, "activated");
  });
  await check("BR Negocio unsafe_status audit meta carries needs_staff_action", () => {
    const rf = raw("app/lib/listingPlans/revenueFulfillment.ts");
    const i = rf.indexOf('reason: "bienes_negocio_activation_unsafe_status"');
    assert.ok(i > 0);
    assert.match(rf.slice(i, i + 200), /needs_staff_action: true/);
  });

  // ── 8b #5 — Comida Local consent forwarding ───────────────────────────────────────────────────────
  await check("Comida Local preview forwards the recurring-billing consent the checkpoint collected", () => {
    const s = raw("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
    assert.match(s, /recurringConsent\?: \{ accepted: true; consentTextVersion: string; lang: "es" \| "en" \} \| null;/);
    assert.match(s, /recurringConsent: ctx\.recurringConsent \?\? null/);
  });

  // ── D10 — refusal copy ────────────────────────────────────────────────────────────────────────────
  await check("D10: every refusal code has distinct ES + EN copy; none claims 'changes saved'; unknown codes fall back", () => {
    const codes = [
      "auth_required",
      "active_entitlement_no_recharge",
      "already_published_no_recharge",
      "payment_in_progress",
      "checkout_state_unverifiable",
      "autos_listing_not_payable",
      "listing_not_checkout_eligible",
      "autos_listing_package_mismatch",
      "listing_package_mismatch",
      "autos_listing_owner_mismatch",
      "empleos_listing_owner_mismatch",
      "listing_owner_mismatch",
      "autos_listing_not_found",
      "empleos_listing_not_found",
      "listing_not_found",
      "viajes_checkout_not_available",
    ];
    for (const code of codes) {
      const es = client.revenueCheckoutRefusalMessage(code, "es");
      const en = client.revenueCheckoutRefusalMessage(code, "en");
      assert.ok(es && en && es !== en, `${code} has ES and EN copy`);
      for (const m of [es, en] as string[]) {
        assert.doesNotMatch(m, /se guardaron|changes are saved|changes were saved/i, `${code} must not claim a save`);
      }
    }
    assert.match(client.revenueCheckoutRefusalMessage("payment_in_progress", "en") as string, /do not pay again/);
    assert.equal(client.revenueCheckoutRefusalMessage("stripe_not_configured", "es"), null);
    assert.equal(client.revenueCheckoutRefusalMessage(undefined, "en"), null);
  });
  await check("D10 source: the client routes a non-ok response through the refusal copy before the generic message; every route code is handled", () => {
    const c = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
    const i = c.indexOf("revenueCheckoutRefusalMessage(j.code, lang)");
    assert.ok(i > 0 && i < c.indexOf("return { ok: false, userMessage: revenueCategoryCheckoutErrorMessage(lang) };", i));
    const route = raw("app/api/revenue-os/checkout/route.ts");
    for (const code of [
      "payment_in_progress",
      "checkout_state_unverifiable",
      "autos_listing_package_mismatch",
      "listing_package_mismatch",
      "listing_not_checkout_eligible",
      "already_published_no_recharge",
      "viajes_checkout_not_available",
    ]) {
      assert.ok(route.includes(`"${code}"`), `route emits ${code}`);
      assert.ok(c.includes(`"${code}"`), `client handles ${code}`);
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length}/${checks} check(s) FAILED`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log(`\nverify-final-paid-defects: PASS (${checks} checks, checkout route executed through the harness)`);
}

void main();
