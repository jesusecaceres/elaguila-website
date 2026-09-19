/**
 * FINAL PAID / FREE CIRCUIT DEFECT CLOSEOUT (2026-09) - source fixes for the defects recorded in
 *   docs/admin-os/PAID_CIRCUIT_MATRIX_2026-09.md  (D1, D3, D4, D9, D10, D13)
 *   docs/admin-os/FREE_CIRCUIT_MATRIX_2026-09.md  (F1, F2, F6, F7)
 *
 * Executable checks against the real pure modules, plus narrow source guards where the behaviour lives in a route /
 * client component / server-only module that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-paid-defects.ts
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
const noComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

function feriaPayload(over: Record<string, unknown> = {}) {
  return {
    lane: "feria",
    data: {
      title: "Feria de empleo",
      dateLine: "12 de octubre",
      venue: "Centro comunitario",
      organizer: "Leonix",
      detailsBullets: [],
      secondaryDetails: [],
      ...over,
    },
  };
}

async function main() {
  const lane = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const react = await import("../app/admin/_lib/adminReactivationPolicy");
  const identity = await import("../app/(site)/publicar/empleos/shared/publish/empleosPendingCheckoutIdentity");
  const client = await import("../app/lib/listingPlans/revenueCategoryCheckoutClient");

  // ── D13 / F1 - Empleos lane forgery ──────────────────────────────────────────────────────────────
  await check("D13/F1: lane derived from payload.lane; a forged free top-level lane over a paid payload is refused", () => {
    const forged = lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: "quick", data: { title: "Cocinero" } } }, "publish");
    assert.deepEqual(forged, { ok: false, error: "lane_payload_mismatch" });
    const forgedPremium = lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: "premium", data: { title: "Gerente" } } }, "publish");
    assert.deepEqual(forgedPremium, { ok: false, error: "lane_payload_mismatch" });
    // the reverse (paid top-level over a feria payload) is a mismatch too - one source of truth
    assert.equal(lane.resolveEmpleosEnvelopeLane({ lane: "quick", payload: feriaPayload() }, "publish").ok, false);
    // a missing top-level lane can never be used to skip the comparison
    assert.deepEqual(lane.resolveEmpleosEnvelopeLane({ payload: { lane: "quick", data: { title: "X" } } }, "publish"), {
      ok: false,
      error: "lane_payload_mismatch",
    });
  });
  await check("D13/F1: consistent envelopes resolve to their lane; paid lanes stay paid (policy still demands payment)", () => {
    for (const l of ["quick", "premium"] as const) {
      const d = lane.resolveEmpleosEnvelopeLane({ lane: l, payload: { lane: l, data: { title: "Puesto" } } }, "publish");
      assert.deepEqual(d, { ok: true, lane: l });
      const life = lane.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: l, existingStatus: null, requireReview: false });
      assert.deepEqual(life, { ok: false, error: "payment_required" });
    }
    const feria = lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload() }, "publish");
    assert.deepEqual(feria, { ok: true, lane: "feria" });
    assert.deepEqual(lane.resolveEmpleosUpsertLifecycle({ mode: "publish", lane: "feria", existingStatus: null, requireReview: false }), {
      ok: true,
      lifecycle: "published",
    });
  });
  await check("D13/F1: a free (feria) publish must carry a real feria payload (server-side validation)", () => {
    const quickShaped = { lane: "feria", payload: { lane: "feria", data: { title: "Cocinero", pay: "$20/h" } } };
    assert.deepEqual(lane.resolveEmpleosEnvelopeLane(quickShaped, "publish"), { ok: false, error: "invalid_feria_payload" });
    for (const missing of ["dateLine", "venue", "organizer"]) {
      const env = { lane: "feria", payload: feriaPayload({ [missing]: "  " }) };
      assert.deepEqual(lane.resolveEmpleosEnvelopeLane(env, "publish"), { ok: false, error: "invalid_feria_payload" }, `blank ${missing}`);
    }
    // a draft may be incomplete in content, but its shape must still be a feria one
    assert.equal(lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload({ organizer: "" }) }, "draft").ok, true);
    assert.equal(lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: feriaPayload({ detailsBullets: undefined }) }, "draft").ok, false);
    assert.equal(lane.resolveEmpleosEnvelopeLane({ lane: "feria", payload: { lane: "feria" } }, "publish").ok, false);
    assert.equal(lane.resolveEmpleosEnvelopeLane({ lane: "weird", payload: { lane: "weird", data: { title: "x" } } }, "publish").ok, false);
    assert.equal(lane.resolveEmpleosEnvelopeLane(null, "publish").ok, false);
  });
  await check("D13/F1 source: upsert derives the lane FIRST, judges an existing row by ITS stored lane, never reads envelope.lane for payment", () => {
    const s = raw("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
    const fn = s.slice(s.indexOf("export async function upsertEmpleosListingFromEnvelope"), s.indexOf("export async function fetchEmpleosPublishedJobRecords"));
    assert.ok(fn.length > 500);
    assert.match(fn, /resolveEmpleosEnvelopeLane\(input\.envelope, input\.mode\)/);
    assert.ok(fn.indexOf("resolveEmpleosEnvelopeLane") < fn.indexOf("getAdminSupabase()"), "lane check runs before any DB access");
    assert.doesNotMatch(noComments(fn), /input\.envelope\.lane/, "the top-level envelope lane is never read for a decision");
    assert.match(fn, /existingLane && existingLane !== authoritativeLane/);
    assert.match(fn, /lane: existing \? \(existing as EmpleosPublicListingRow\)\.lane : authoritativeLane/);
    assert.match(fn, /envelope,\n\s*canonical,/, "the snapshot stores the normalised envelope");
    const route = raw("app/api/clasificados/empleos/listings/route.ts");
    for (const c of ["lane_payload_mismatch", "invalid_feria_payload", "invalid_lane", "invalid_envelope"]) assert.ok(route.includes(c), `route maps ${c} to a 4xx`);
  });

  // ── D1 / F2 - Restaurantes free first-save ────────────────────────────────────────────────────────
  await check("D1/F2 source: Restaurantes POST refuses a NEW row without pending_payment (402 payment_required) before any insert", () => {
    const s = raw("app/api/clasificados/restaurantes/publish/route.ts");
    const elseBranch = s.indexOf("} else {\n      // D1 / F2");
    assert.ok(elseBranch > 0, "guard is the first statement of the new-row branch");
    const guard = s.indexOf('if (!pendingPayment) {\n        return NextResponse.json({ ok: false, error: "payment_required" }, { status: 402 });', elseBranch);
    assert.ok(guard > elseBranch && guard < s.indexOf("allocateSlug(base)", elseBranch), "guard precedes slug allocation");
    assert.ok(guard < s.indexOf('.from("restaurantes_public_listings").insert(', elseBranch), "guard precedes the insert");
    // the existing-row branch still owns its status via resolveRestauranteOwnerEditTargetStatus, untouched
    assert.match(s, /resolveRestauranteOwnerEditTargetStatus\(ex\.status\)/);
  });
  await check("D1/F2: every real client still sends pending_payment for a NEW row (paid checkout) and the free path is only an existing-row edit", () => {
    const b = raw("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
    assert.match(b, /activation_mode: "pending_payment"/);
    const pend = raw("app/(site)/clasificados/restaurantes/application/saveRestaurantePendingBeforeCheckout.ts");
    assert.match(pend, /activationMode: "pending_payment"/);
    const app = raw("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
    // the only fetch to the publish route without the flag lives in saveExistingDashboardListing (an existing row)
    const idx = app.indexOf('fetch("/api/clasificados/restaurantes/publish"');
    assert.ok(idx > 0 && app.lastIndexOf("saveExistingDashboardListing", idx) > app.lastIndexOf("useCallback(async () => {", idx - 4000), "unflagged POST is the existing-dashboard-listing save");
    assert.equal((app.match(/api\/clasificados\/restaurantes\/publish/g) ?? []).length, 1);
  });

  // ── D3 - checkout requires a verified bearer, owner only from the bearer ───────────────────────────
  await check("D3 source: checkout refuses a request with no bearer (401 auth_required) and never trusts body.ownerUserId", () => {
    const s = raw("app/api/revenue-os/checkout/route.ts");
    const code = noComments(s);
    assert.match(code, /const bearerUserId = await getBearerUserId\(request\);\n\s*if \(!bearerUserId\) \{\n\s*return NextResponse\.json\(\n\s*\{ ok: false, code: "auth_required"/);
    assert.match(code, /status: 401/);
    assert.doesNotMatch(code, /body\.ownerUserId/, "no client-supplied owner id is read anywhere");
    assert.ok(s.indexOf('code: "auth_required"') < s.indexOf("isAutosDealerInventoryAddonEarly"), "401 precedes every owner pre-flight");
    assert.match(code, /: bearerUserId;/);
  });
  await check("D3: every real caller of the checkout route sends the bearer and refuses to call without a session (no legitimate guest checkout)", () => {
    const a = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
    const r = raw("app/lib/listingLifecycle/listingRenewalCheckout.ts");
    for (const src of [a, r]) {
      assert.match(src, /Authorization: `Bearer \$\{token\}`/);
      assert.match(src, /if \(!token\)/);
    }
    // nothing else posts to the route
    const payload = raw("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
    assert.doesNotMatch(payload, /ownerUserId/, "the client body never carries an owner id");
  });

  // ── D4 - subscription base-package pre-flights + BR terminal outcome ───────────────────────────────
  await check("D4 source: servicios / restaurantes / comida-local / br_agent_monthly have owner + lane + status pre-flights using the activators' own sets", () => {
    const s = raw("app/api/revenue-os/checkout/route.ts");
    const start = s.indexOf("Subscription base-package pre-flights");
    const end = s.indexOf("viajes_business_monthly is Stripe-eligible");
    assert.ok(start > 0 && end > start);
    const blk = s.slice(start, end);
    for (const k of [
      "SERVICIOS_BASE_MONTHLY_PACKAGE_KEY",
      "SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY",
      "RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY",
      "COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES",
      "BIENES_NEGOCIO_BASE_PACKAGE_KEY",
      'statusColumn: "listing_status"',
      "listing_owner_mismatch",
      "listing_not_found",
      "listing_not_checkout_eligible",
      'seller_type ?? "").trim().toLowerCase() !== "business"',
      'brRole !== "main"',
      'toLowerCase() !== "pending" || brRow.is_published === true',
    ]) {
      assert.ok(blk.includes(k), `pre-flight block references ${k}`);
    }
    // the pre-flights run BEFORE any payment record / Stripe session exists
    assert.ok(start < s.indexOf("createPendingPaymentRecord({"));
    assert.ok(start < s.indexOf("createRevenueStripeCheckoutSession("));
    // renewals / add-on-only branches are untouched
    for (const k of ["isRentasRenewalEarly", "isAutosPrivadoRenewalEarly", "isBienesFsboRenewalEarly", "isRestauranteAddonOnlyEarly", "isBienesInventoryAddonOnlyEarly", "isAutosDealerInventoryAddonEarly", "isServiciosOffersAddonOnlyEarly", "isOfertasLocalesCheckoutEarly"]) {
      assert.ok(s.includes(k), `${k} branch preserved`);
    }
  });
  await check("D4 source: BR Negocio paused / expired parent is a TERMINAL non-retried outcome recorded as paid-needs-staff-action, never activated", () => {
    const f = raw("app/lib/listingPlans/revenueBienesNegocioFulfillment.ts");
    const idx = f.indexOf('if (row.status !== "pending" || row.is_published !== false) {');
    assert.ok(idx > 0);
    const blk = f.slice(idx, f.indexOf("const activation = await tryActivateBrListingAfterPayment", idx));
    assert.match(blk, /ok: true,\n\s*outcome: "unsafe_status"/);
    assert.doesNotMatch(blk, /ok: false/);
    assert.match(blk, /needs staff action/);
    assert.doesNotMatch(blk, /tryActivateBrListingAfterPayment/, "not activated in this branch");
    assert.ok(f.indexOf("tryActivateBrListingAfterPayment(listingId") > idx, "activation only after the status guard");
    const rf = raw("app/lib/listingPlans/revenueFulfillment.ts");
    const h = rf.slice(rf.indexOf("async function tryActivateBienesNegocioListingAfterEntitlement"));
    assert.match(h.slice(0, 2500), /activation\.outcome === "unsafe_status" && activation\.ok/);
    assert.match(h.slice(0, 2500), /needs_staff_action: true/);
  });

  // ── D9 - archived is not activatable ──────────────────────────────────────────────────────────────
  await check("D9 source: Restaurantes fulfilment activates only from pending_payment; a paid-but-archived row is terminal (no retry loop), never re-published", () => {
    const f = raw("app/lib/listingPlans/revenueRestaurantFulfillment.ts");
    assert.match(f, /RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES = \[RESTAURANTE_PENDING_CHECKOUT_STATUS\] as const/);
    assert.doesNotMatch(noComments(f.slice(0, f.indexOf("export type RestauranteRevenueActivationOutcome"))), /"archived"/, "archived is not in the activatable set");
    assert.match(f, /status === "suspended" \|\| status === "archived"/);
    const i = f.indexOf('status === "suspended" || status === "archived"');
    assert.match(f.slice(i, i + 700), /ok: true,\n\s*outcome: "unsafe_status"/);
  });

  // ── F6 - free Clases restore ───────────────────────────────────────────────────────────────────────
  await check("F6: a suspended FREE Clases row (no published_at) can be Restored / Republished; paid Clases and Rentas / Bienes keep the never-live rule", () => {
    const free = react.decideAdminReactivation({ category: "clases", status: "flagged", published_at: null, expires_at: null, is_free: true });
    assert.equal(free.blocked, false);
    for (const status of ["flagged", "removed", "paused", "sold"]) {
      assert.equal(react.decideAdminReactivation({ category: "clases", status, is_free: true }).blocked, false, `free clases ${status}`);
    }
    // paid / unknown flag stays blocked (fail closed)
    for (const is_free of [false, null, undefined]) {
      assert.equal(react.decideAdminReactivation({ category: "clases", status: "flagged", published_at: null, is_free }).blocked, true);
    }
    // a never-paid pending row is blocked even when the (staff-editable) flag says free
    assert.equal(react.decideAdminReactivation({ category: "clases", status: "pending", is_free: true }).blocked, true);
    // the exemption is Clases-only
    assert.equal(react.decideAdminReactivation({ category: "rentas", status: "flagged", published_at: null, is_free: true }).blocked, true);
    assert.equal(react.decideAdminReactivation({ category: "bienes-raices", status: "removed", is_free: true }).blocked, true);
    // a free Clases row that WAS live, and paid rows that were live, behave as before
    assert.equal(react.decideAdminReactivation({ category: "clases", status: "flagged", published_at: "2026-09-01T00:00:00Z", is_free: false }).blocked, false);
  });
  await check("F6 source: both callers pass is_free (argument only)", () => {
    const r = raw("app/api/admin/clasificados/listings/[id]/route.ts");
    assert.equal((r.match(/is_free: rowRec\.is_free as boolean \| null \| undefined/g) ?? []).length, 2, "unsuspend + republish");
    const g = raw("app/admin/_lib/adminStaffCoreFieldGuard.ts");
    assert.match(g, /is_free: current\.is_free,/);
    assert.match(g, /is_free\?: boolean \| null;/);
  });

  // ── F7 - feria Publish -> Back -> Publish ─────────────────────────────────────────────────────────
  await check("F7: the feria row id is remembered per lane+title in its OWN storage slot and reused on re-publish", () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
    const id = "11111111-1111-4111-8111-111111111111";
    const K = identity.EMPLEOS_FERIA_LISTING_KEY;
    assert.notEqual(K, identity.EMPLEOS_PENDING_CHECKOUT_LISTING_KEY);
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "Feria de empleo" }, K), null);
    identity.rememberEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "Feria de empleo", listingId: id }, K);
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "  feria DE empleo " }, K), id);
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "Otra feria" }, K), null, "a different fair never reuses the row");
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "quick", title: "Feria de empleo" }, K), null);
    // the paid checkout memo is a different slot: neither clobbers the other
    identity.rememberEmpleosPendingCheckoutListingId(storage, { lane: "quick", title: "Cocinero", listingId: "22222222-2222-4222-8222-222222222222" });
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "Feria de empleo" }, K), id);
    identity.clearEmpleosPendingCheckoutListingId(storage, K);
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "feria", title: "Feria de empleo" }, K), null);
    assert.equal(identity.readEmpleosPendingCheckoutListingId(storage, { lane: "quick", title: "Cocinero" }), "22222222-2222-4222-8222-222222222222");
  });
  await check("F7 source: the feria client sends the remembered id on draft AND publish, retries fresh only on a stale id, and forgets it on delete", () => {
    const s = raw("app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx");
    assert.match(s, /readEmpleosPendingCheckoutListingId\(storage, identityKey, EMPLEOS_FERIA_LISTING_KEY\)/);
    assert.match(s, /rememberEmpleosPendingCheckoutListingId\(storage, \{ \.\.\.identityKey, listingId: out\.json\.id \}, EMPLEOS_FERIA_LISTING_KEY\)/);
    assert.match(s, /\[400, 403, 404\]\.includes\(out\.res\.status\)/);
    assert.match(s, /saveFeriaEnvelope\(data\.session\.access_token, "draft"\)/);
    assert.match(s, /saveFeriaEnvelope\(data\.session\.access_token, "publish"\)/);
    assert.equal((s.match(/fetch\("\/api\/clasificados\/empleos\/listings"/g) ?? []).length, 1, "one save path (no second unguarded POST)");
    const del = s.slice(s.indexOf("const handleDeleteApplication"), s.indexOf("const handleDeleteApplication") + 400);
    assert.match(del, /clearEmpleosPendingCheckoutListingId\(window\.sessionStorage, EMPLEOS_FERIA_LISTING_KEY\)/);
  });

  // ── D10 - checkout refusal copy ────────────────────────────────────────────────────────────────────
  await check("D10: every server refusal code has accurate ES + EN copy; none claims 'changes saved'; unknown codes fall back to generic", () => {
    const codes = [
      "auth_required",
      "active_entitlement_no_recharge",
      "already_published_no_recharge",
      "entitlement_already_active",
      "payment_in_progress",
      "checkout_attempt_in_progress",
      "checkout_state_unverifiable",
      "autos_listing_not_payable",
      "listing_not_checkout_eligible",
      "child_listing_not_eligible",
      "listing_not_eligible",
      "autos_listing_package_mismatch",
      "listing_package_mismatch",
      "package_listing_mismatch",
      "autos_listing_owner_mismatch",
      "empleos_listing_owner_mismatch",
      "listing_owner_mismatch",
      "autos_listing_not_found",
      "empleos_listing_not_found",
      "listing_not_found",
    ];
    for (const code of codes) {
      const es = client.revenueCheckoutRefusalMessage(code, "es");
      const en = client.revenueCheckoutRefusalMessage(code, "en");
      assert.ok(es && en && es !== en, `${code} has ES and EN copy`);
      for (const m of [es, en] as string[]) {
        assert.doesNotMatch(m, /se guardaron|changes are saved|changes were saved/i, `${code} must not claim a save`);
        assert.notEqual(m, client.revenueCategoryCheckoutErrorMessage(m === es ? "es" : "en"), `${code} is not the generic error`);
      }
    }
    assert.match(client.revenueCheckoutRefusalMessage("payment_in_progress", "en") as string, /do not pay again/);
    assert.match(client.revenueCheckoutRefusalMessage("payment_in_progress", "es") as string, /no pagues de nuevo/);
    assert.match(client.revenueCheckoutRefusalMessage("already_published_no_recharge", "en") as string, /No charge was started/);
    assert.equal(client.revenueCheckoutRefusalMessage("stripe_not_configured", "es"), null);
    assert.equal(client.revenueCheckoutRefusalMessage(undefined, "en"), null);
  });
  await check("D10 source: the client routes a non-ok response through the refusal copy before the generic message", () => {
    const s = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
    const i = s.indexOf("revenueCheckoutRefusalMessage(j.code, lang)");
    assert.ok(i > 0 && i < s.indexOf("return { ok: false, userMessage: revenueCategoryCheckoutErrorMessage(lang) };", i));
    // every code the checkout route can refuse with that the copy claims to handle exists in the route or its owner gates
    const route = raw("app/api/revenue-os/checkout/route.ts");
    for (const c of ["payment_in_progress", "checkout_state_unverifiable", "autos_listing_package_mismatch", "autos_listing_not_payable", "already_published_no_recharge", "checkout_attempt_in_progress"]) {
      assert.ok(route.includes(`"${c}"`), `route emits ${c}`);
      assert.ok(s.includes(`"${c}"`), `client handles ${c}`);
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nAll final paid/free defect checks passed.");
}

void main();
