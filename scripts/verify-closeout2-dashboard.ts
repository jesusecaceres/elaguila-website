/**
 * CLOSEOUT 2 (2026-09) — DASHBOARD COMPLETION verifier.
 *
 * Owner dashboards for the paid lanes must show a TRUTHFUL not-live state for an unpaid listing, offer
 * Edit / Preview / "Completar pago" only where a valid Revenue OS checkout exists, never show a public
 * "View listing" CTA before the row is live, and the Viajes tab count / list must agree.
 *
 * Executable checks against the real pure modules, plus narrow source guards where the behaviour lives in
 * a React client component that cannot be imported under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-dashboard.ts
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
/** Source with block + line comments removed (guards must look at code, not prose). */
const code = (rel: string) => raw(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
/** Body of a top-level `export (async )?function name(` up to the next top-level export/function. */
function fnBody(src: string, name: string): string {
  const start = src.search(new RegExp(`export (async )?function ${name}\\b`));
  assert.ok(start >= 0, `function ${name} not found`);
  const rest = src.slice(start + 10);
  const next = rest.search(/\nexport (async )?function |\nexport const |\nfunction /);
  return next < 0 ? src.slice(start) : src.slice(start, start + 10 + next);
}

const P = "app/(site)/dashboard";

async function main() {
  const pp = await import("../app/(site)/dashboard/lib/dashboardPendingPayment");
  const attn = await import("../app/(site)/dashboard/lib/dashboardAttentionItems");
  const payload = await import("../app/lib/listingPlans/revenueCategoryCheckoutPayload");
  const matrix = await import("../app/lib/listingPlans/revenuePricingMatrix");

  // ── eligibility mirrors the server pre-payment guard ────────────────────────────────────────
  await check("empleos: only a quick/premium DRAFT awaits payment; feria (free) and every other state never does", () => {
    for (const lane of ["quick", "premium"]) {
      assert.equal(pp.isEmpleosDraftAwaitingPayment({ lane, lifecycle_status: "draft" }), true, lane);
      for (const st of ["published", "paused", "archived", "pending_review", "rejected"]) {
        assert.equal(pp.isEmpleosDraftAwaitingPayment({ lane, lifecycle_status: st }), false, `${lane}/${st}`);
      }
    }
    assert.equal(pp.isEmpleosDraftAwaitingPayment({ lane: "feria", lifecycle_status: "draft" }), false, "Feria is free");
    assert.equal(pp.isEmpleosDraftAwaitingPayment({ lane: " Quick ", lifecycle_status: " DRAFT " }), true, "normalized");
    assert.equal(pp.isEmpleosDraftAwaitingPayment({}), false);
  });

  await check("shared listings: Rentas / BR FSBO / Clases-pagada payable ONLY when pending and not published", () => {
    const fsboPairs = [{ label: "Leonix:branch", value: "bienes_raices_privado" }];
    const negocioPairs = [{ label: "Leonix:branch", value: "bienes_raices_negocio" }];
    const clasesPaid = [{ label: "Leonix:classCostType", value: "pagada" }];
    const clasesFree = [{ label: "Leonix:classCostType", value: "gratis" }];
    const lane = pp.resolveSharedListingPaymentLane;
    assert.equal(lane({ category: "rentas", status: "pending", is_published: false }), "rentas");
    assert.equal(lane({ category: "Rentas", status: " Pending ", is_published: null }), "rentas", "null is_published is not live");
    assert.equal(lane({ category: "bienes-raices", status: "pending", is_published: false, detail_pairs: fsboPairs }), "bienes-raices-fsbo");
    assert.equal(lane({ category: "bienes-raices", status: "pending", is_published: false, branch: "bienes_raices_privado" }), "bienes-raices-fsbo");
    assert.equal(lane({ category: "clases", status: "pending", is_published: false, detail_pairs: clasesPaid }), "clases");
    // never offered
    assert.equal(lane({ category: "bienes-raices", status: "pending", is_published: false, detail_pairs: negocioPairs }), null, "Bienes Negocio is a subscription with consent: never here");
    assert.equal(lane({ category: "bienes-raices", status: "pending", is_published: false }), null, "unknown branch fails closed");
    assert.equal(lane({ category: "clases", status: "pending", is_published: false, detail_pairs: clasesFree }), null, "a free class is never charged");
    assert.equal(lane({ category: "clases", status: "pending", is_published: false }), null);
    for (const st of ["active", "paused", "removed", "sold", "flagged", "draft", "pending_payment"]) {
      assert.equal(lane({ category: "rentas", status: st, is_published: false }), null, `rentas/${st}`);
    }
    assert.equal(lane({ category: "rentas", status: "pending", is_published: true }), null, "already published");
    for (const c of ["en-venta", "busco", "comunidad", "autos", "mascotas-y-perdidos", null, undefined]) {
      assert.equal(lane({ category: c as string, status: "pending", is_published: false }), null, String(c));
    }
  });

  await check("autos privado: payable exactly draft | pending_payment | payment_failed (server pre-flight), privado lane only", () => {
    for (const st of ["draft", "pending_payment", "payment_failed"]) {
      assert.equal(pp.isAutosPrivadoAwaitingPayment({ lane: "privado", status: st }), true, st);
      assert.equal(pp.isAutosPrivadoAwaitingPayment({ lane: "negocios", status: st }), false, `negocios/${st}`);
    }
    for (const st of ["active", "removed", "sold", "cancelled", "suspended", "expired"]) {
      assert.equal(pp.isAutosPrivadoAwaitingPayment({ lane: "privado", status: st }), false, st);
    }
  });

  await check("restaurantes: only pending_payment awaits payment", () => {
    assert.equal(pp.isRestauranteAwaitingPayment("pending_payment"), true);
    for (const st of ["published", "suspended", "archived", "", null, undefined]) {
      assert.equal(pp.isRestauranteAwaitingPayment(st as string), false, String(st));
    }
  });

  // ── payloads: existing Revenue OS constants only ────────────────────────────────────────────
  await check("payloads: every lane spreads an EXISTING Revenue OS constant (no new package key/price/route)", () => {
    const expected: Array<[string, { category: string; packageKey: string }]> = [
      ["empleos", payload.EMPLEOS_PAID_JOB_CHECKOUT],
      ["rentas", payload.RENTAS_CATEGORY_CHECKOUT],
      ["bienes-raices-fsbo", payload.BIENES_RAICES_FSBO_CHECKOUT],
      ["clases", payload.CLASES_CATEGORY_CHECKOUT],
      ["autos-privado", payload.AUTOS_PRIVADO_CHECKOUT],
    ];
    for (const [lane, base] of expected) {
      const p = pp.buildDashboardResumePaymentPayload({
        lane: lane as never,
        listingId: "  11111111-1111-1111-1111-111111111111 ",
        leonixAdId: " LNX-1 ",
        lang: "es",
      });
      assert.equal(p.category, base.category, lane);
      assert.equal(p.packageKey, base.packageKey, lane);
      assert.equal(p.listingId, "11111111-1111-1111-1111-111111111111", `${lane} listingId trimmed`);
      assert.equal(p.leonixAdId, "LNX-1");
      assert.equal(p.locale, "es");
      assert.equal(p.operation, undefined, `${lane}: never a renewal`);
      assert.equal(p.addOns, undefined, `${lane}: no add-ons`);
      assert.equal(p.promoCode, undefined);
      assert.equal(p.listingDraftId, undefined, `${lane}: the listing row exists`);
      assert.match(p.returnPath, /^\/dashboard\//, `${lane} returns to the owner dashboard`);
      const body = payload.buildRevenueCategoryCheckoutBody(p);
      assert.equal(body.packageKey, base.packageKey);
      assert.equal(body.listingId, "11111111-1111-1111-1111-111111111111");
      assert.equal("operation" in body, false);
    }
    assert.equal(payload.RENTAS_CATEGORY_CHECKOUT.packageKey, "rentas_30d");
    assert.equal(payload.BIENES_RAICES_FSBO_CHECKOUT.packageKey, "br_fsbo_45d");
    assert.equal(payload.CLASES_CATEGORY_CHECKOUT.packageKey, "clases_paid_30d");
    assert.equal(payload.AUTOS_PRIVADO_CHECKOUT.packageKey, "autos_privado_30d");
    assert.equal(payload.EMPLEOS_PAID_JOB_CHECKOUT.packageKey, matrix.EMPLEOS_JOB_POST_PAID_PACKAGE_KEY);
  });

  await check("payloads: every direct dashboard lane is ONE-TIME billing (no recurring-consent hard-requirement)", () => {
    for (const k of ["rentas_30d", "br_fsbo_45d", "clases_paid_30d", "autos_privado_30d", matrix.EMPLEOS_JOB_POST_PAID_PACKAGE_KEY]) {
      const def = matrix.getRevenuePackageDefinition(k);
      assert.ok(def, k);
      assert.equal(def!.billingMode, "one_time", k);
    }
    // ...whereas the subscription lanes must go through the consent checkpoint, never a direct dashboard call.
    for (const k of ["restaurantes_base_monthly", "servicios_base_monthly", "br_agent_monthly"]) {
      assert.equal(matrix.getRevenuePackageDefinition(k)!.billingMode, "monthly_subscription", k);
    }
  });

  await check("return path: paid lanes come back to the owner's own dashboard tab; empleos to /dashboard/empleos", () => {
    assert.equal(pp.dashboardPendingPaymentReturnPath("empleos", "en"), "/dashboard/empleos?lang=en");
    assert.equal(pp.dashboardPendingPaymentReturnPath("rentas", "es"), "/dashboard/mis-anuncios?lang=es&cat=rentas");
    assert.equal(pp.dashboardPendingPaymentReturnPath("bienes-raices-fsbo", "es"), "/dashboard/mis-anuncios?lang=es&cat=bienes-raices");
    assert.equal(pp.dashboardPendingPaymentReturnPath("clases", "es"), "/dashboard/mis-anuncios?lang=es&cat=clases");
    assert.equal(pp.dashboardPendingPaymentReturnPath("autos-privado", "es"), "/dashboard/mis-anuncios?lang=es&cat=autos");
  });

  await check("restaurantes resume href opens the DRAFT preview (never source=dashboard, which suppresses checkout)", () => {
    const checkout = pp.restauranteResumePaymentPreviewHref("es", "checkout");
    assert.equal(checkout, "/clasificados/restaurantes/preview?lang=es#publish-checkout-checkpoint");
    assert.equal(pp.restauranteResumePaymentPreviewHref("en", "preview"), "/clasificados/restaurantes/preview?lang=en");
    assert.doesNotMatch(checkout, /source=dashboard|listingId=|preview=listing/);
  });

  // ── status / public-link truth ──────────────────────────────────────────────────────────────
  await check("public-live truth: restaurantes/servicios/empleos=published, autos=active, viajes=approved AND is_public", () => {
    const live = pp.dashboardInventoryRowIsPubliclyLive;
    for (const c of ["restaurantes", "servicios", "empleos"]) {
      assert.equal(live({ category: c, status: "published" }), true, c);
      for (const st of ["pending_payment", "draft", "paused", "pending_review", "archived", "suspended", "paused_unpublished"]) {
        assert.equal(live({ category: c, status: st }), false, `${c}/${st}`);
      }
    }
    assert.equal(live({ category: "autos_paid", status: "active" }), true);
    for (const st of ["draft", "pending_payment", "payment_failed", "removed"]) assert.equal(live({ category: "autos_paid", status: st }), false, st);
    assert.equal(live({ category: "viajes", status: "approved", isPublic: true }), true);
    assert.equal(live({ category: "viajes", status: "approved", isPublic: false }), false, "approved but hidden");
    for (const st of ["draft", "submitted", "in_review", "changes_requested", "rejected", "expired", "unpublished"]) {
      assert.equal(live({ category: "viajes", status: st, isPublic: true }), false, `viajes/${st}`);
    }
    assert.equal(live({ category: "something-else", status: "x" }), true, "no evidence => no claim (never hides an unknown link)");
  });

  await check("pre-publication predicate + shared-listings not-live", () => {
    for (const st of ["pending", "pending_payment", "draft", "payment_failed", "pending_review"]) {
      assert.equal(pp.isPrePublicationStatus(st), true, st);
      assert.equal(pp.isSharedListingsRowNotLive({ status: st, is_published: false }), true, st);
    }
    for (const st of ["active", "paused", "sold", "removed", "expired"]) assert.equal(pp.isPrePublicationStatus(st), false, st);
    assert.equal(pp.isSharedListingsRowNotLive({ status: "pending", is_published: true }), false, "published wins");
  });

  await check("attention: complete-payment action attaches to payment_required items only", () => {
    const items = attn.resolveOwnerDashboardAttentionItems({ id: "r1", category: "rentas", statusDisplayKey: "pending_payment", isPublished: false });
    assert.ok(items.some((i) => i.reasonKey === "payment_required"));
    const out = attn.attachCompletePaymentAction(items, { lane: "rentas", listingId: "r1" });
    for (const i of out) {
      if (i.reasonKey === "payment_required") assert.equal(i.completePayment?.listingId, "r1");
      else assert.equal(i.completePayment, undefined);
    }
    const live = attn.resolveOwnerDashboardAttentionItems({ id: "r2", category: "rentas", statusDisplayKey: "active", isPublished: true });
    assert.equal(attn.attachCompletePaymentAction(live, { lane: "rentas", listingId: "r2" }).some((i) => i.completePayment), false);
  });

  // ── inventory builders + action builder (real modules) ──────────────────────────────────────
  let inv: typeof import("../app/(site)/dashboard/lib/dashboardInventory") | null = null;
  let tools: typeof import("../app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools") | null = null;
  try {
    inv = await import("../app/(site)/dashboard/lib/dashboardInventory");
    tools = await import("../app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools");
  } catch (e) {
    failures.push(`import dashboardInventory / CategoryTools: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (inv && tools) {
    const I = inv;
    const T = tools;
    const emp = (lane: string, st: string) =>
      I.buildEmpleosInventoryItems(
        [{ id: "e1", slug: "job-1", title: "Job", company_name: "Co", lifecycle_status: st, lane, updated_at: "2026-09-01T00:00:00Z", leonix_ad_id: "EMP-1" }],
        "es",
      )[0];
    const rest = (st: string) =>
      I.buildRestaurantInventoryItems(
        [{ id: "r1", slug: "taco", leonix_ad_id: "REST-1", status: st, promoted: false, leonix_verified: false, package_tier: null, published_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", business_name: "Taco", draft_listing_id: "d1" }],
        "es",
      )[0];
    const via = (st: string, isPublic: boolean) =>
      I.buildViajesInventoryItems(
        [{ id: "v1", slug: "trip", title: "Trip", category: "x", lane: "business", owner_user_id: "u", lifecycle_status: st as never, is_public: isPublic, hero_image_url: null, published_at: null, updated_at: "2026-09-01T00:00:00Z" }],
        "es",
      )[0];
    const autosRow = (st: string, lane = "privado") =>
      I.buildAutosClassifiedsInventoryItems(
        [{ id: "a1", status: st, lane, lang: "es", listing_payload: { vehicleTitle: "Civic" }, published_at: null, updated_at: "2026-09-01T00:00:00Z", leonix_ad_id: "AUTO-1" }],
        "es",
      )[0];

    await check("empleos builder: paid draft = 'Pago pendiente' + awaitingPayment + no public preview; feria/published unchanged", () => {
      const draft = emp("quick", "draft");
      assert.equal(draft.awaitingPayment, true);
      assert.equal(draft.statusDisplay?.labelEs, "Pago pendiente");
      assert.equal(draft.statusDisplay?.displayKey, "pending_payment");
      assert.equal(draft.statusDisplay?.rawStatus, "draft");
      assert.equal(draft.isPublicLive, false);
      assert.equal(draft.previewHref, null, "the public slug page does not exist for a draft");
      assert.equal(emp("premium", "draft").awaitingPayment, true);
      assert.equal(emp("feria", "draft").awaitingPayment, false);
      assert.equal(emp("feria", "draft").statusDisplay?.displayKey, "draft");
      const pub = emp("quick", "published");
      assert.equal(pub.awaitingPayment, false);
      assert.equal(pub.isPublicLive, true);
      assert.ok(pub.previewHref, "live row keeps its preview link");
    });

    await check("restaurantes builder: pending_payment = awaiting, not live, no public-page preview", () => {
      const p = rest("pending_payment");
      assert.equal(p.awaitingPayment, true);
      assert.equal(p.isPublicLive, false);
      assert.equal(p.previewHref, null);
      assert.equal(p.statusDisplay?.displayKey, "pending_payment");
      const live = rest("published");
      assert.equal(live.awaitingPayment, false);
      assert.equal(live.isPublicLive, true);
      assert.ok(live.previewHref);
    });

    await check("viajes builder: public link only when approved AND is_public", () => {
      assert.equal(via("draft", false).isPublicLive, false);
      assert.equal(via("submitted", false).isPublicLive, false);
      assert.equal(via("changes_requested", false).isPublicLive, false);
      assert.equal(via("approved", true).isPublicLive, true);
      assert.equal(via("approved", false).isPublicLive, false);
    });

    await check("autos paid builder: privado draft/pending_payment/payment_failed await payment; active is live", () => {
      for (const st of ["draft", "pending_payment", "payment_failed"]) {
        const it = autosRow(st);
        assert.equal(it.awaitingPayment, true, st);
        assert.equal(it.isPublicLive, false, st);
        assert.equal(it.previewHref, null, st);
      }
      assert.equal(autosRow("active").awaitingPayment, false);
      assert.equal(autosRow("active").isPublicLive, true);
      assert.equal(autosRow("draft", "negocios").awaitingPayment, false, "dealer is a subscription, handled elsewhere");
    });

    await check("actions: restaurante pending_payment = Completar pago + Vista previa + Administrar, NO public 'Ver público'", () => {
      const item = rest("pending_payment");
      const noop = () => undefined;
      const acts = T.buildInventoryListingActions("restaurantes", item, "es", "lang=es", {
        onCompletePayment: noop,
        onDraftPreview: noop,
        ownerUserId: "u1",
      });
      const labels = acts.map((a) => a.label);
      assert.ok(labels.includes("Completar pago"), labels.join("|"));
      assert.ok(labels.includes("Vista previa"), labels.join("|"));
      assert.ok(labels.includes("Administrar anuncio"), "Edit doorway stays");
      assert.ok(!labels.includes("Ver público"), "no public view CTA before the row is live");
      assert.ok(!acts.some((a) => a.href === item.publicHref), "no action targets the public page");
      const pay = acts.find((a) => a.label === "Completar pago")!;
      assert.equal(typeof pay.onClick, "function");
      assert.equal(pay.href, undefined, "restaurant payment is a resume click, not a raw link");
      // callbacks absent => actions absent (never a dead button)
      const bare = T.buildInventoryListingActions("restaurantes", item, "es", "lang=es", { ownerUserId: "u1" });
      assert.ok(!bare.some((a) => a.label === "Completar pago"));
    });

    await check("actions: live restaurante keeps 'Ver público' and shows no payment action", () => {
      const item = rest("published");
      const acts = T.buildInventoryListingActions("restaurantes", item, "es", "lang=es", { onCompletePayment: () => undefined, onDraftPreview: () => undefined, ownerUserId: "u1" });
      const labels = acts.map((a) => a.label);
      assert.ok(labels.includes("Ver público"));
      assert.ok(!labels.includes("Completar pago"));
    });

    await check("actions: empleos paid draft = Completar pago + Administrar; NO 'Ver público', NO preview; published unchanged", () => {
      const item = emp("quick", "draft");
      const acts = T.buildInventoryListingActions("empleos", item, "es", "lang=es", { onCompletePayment: () => undefined, onEmpleosLifecycle: () => undefined });
      const labels = acts.map((a) => a.label);
      assert.ok(labels.includes("Completar pago"), labels.join("|"));
      assert.ok(labels.includes("Administrar anuncio"));
      assert.ok(!labels.includes("Ver público"));
      assert.ok(!labels.includes("Vista previa"), "no public-page preview for a draft");
      assert.ok(!labels.includes("Reanudar") && !labels.includes("Restaurar"), "no dead resume for a paid draft");
      const pub = T.buildInventoryListingActions("empleos", emp("quick", "published"), "es", "lang=es", { onCompletePayment: () => undefined, onEmpleosLifecycle: () => undefined });
      assert.ok(pub.some((a) => a.label === "Ver público"));
      assert.ok(!pub.some((a) => a.label === "Completar pago"));
      // Feria (free) never gets a pay action even if the caller wires the handler
      const feria = T.buildInventoryListingActions("empleos", emp("feria", "draft"), "es", "lang=es", { onCompletePayment: () => undefined });
      assert.ok(!feria.some((a) => a.label === "Completar pago"));
    });

    await check("actions: viajes rows that are not approved+public expose no public link; approved+public does", () => {
      const hidden = T.buildInventoryListingActions("viajes", via("submitted", false), "es", "lang=es");
      assert.ok(!hidden.some((a) => a.href && /viajes\/oferta\//.test(a.href)), "no /oferta/ link before approval");
      const shown = T.buildInventoryListingActions("viajes", via("approved", true), "es", "lang=es");
      assert.ok(shown.some((a) => a.href && /viajes\/oferta\//.test(a.href)));
    });
  }

  // ── Viajes count/list parity (source guards) ────────────────────────────────────────────────
  await check("viajes: list and tab-count BOTH count every owner row (neither filters is_public)", () => {
    const inventory = raw(`${P}/lib/dashboardInventory.ts`);
    // Gate 2 (2026-09 dashboard state machine): the select moved into `readOwnerViajesListings` (the read that
    // returns its outcome so a failed read is not rendered as "no listings"); `fetchOwnerViajesListings` is a thin wrapper.
    const listFn = fnBody(inventory, "readOwnerViajesListings");
    assert.match(listFn, /\.from\("viajes_staged_listings"\)/);
    assert.match(listFn, /\.eq\("owner_user_id", ownerId\)/);
    assert.doesNotMatch(listFn.replace(/\/\/[^\n]*/g, ""), /\.eq\("is_public"/, "list must not hide non-public staged rows");
    const plan = raw(`${P}/lib/dashboardMisAnunciosCategoryLoadPlan.ts`);
    const viajesCount = plan.split("\n").find((l) => l.includes('from("viajes_staged_listings")')) ?? "";
    assert.ok(viajesCount, "count query present");
    assert.doesNotMatch(viajesCount, /is_public/, "count must not filter is_public either");
    assert.match(viajesCount, /\.eq\("owner_user_id", ownerId\)/);
    // /dashboard/viajes (the per-lane page) also lists all statuses
    const viajesPage = raw(`${P}/viajes/page.tsx`);
    const q = viajesPage.slice(viajesPage.indexOf('.from("viajes_staged_listings")'), viajesPage.indexOf('.from("viajes_staged_listings")') + 400);
    assert.doesNotMatch(q, /\.eq\("is_public"/);
    // and its public link is still approved+public only
    assert.match(viajesPage, /r\.lifecycle_status === "approved" && r\.is_public/);
  });

  // ── source guards: Revenue OS only, no invented payment path ────────────────────────────────
  await check("client action: Revenue OS only (startRevenueCategoryCheckout -> redirect), no fetch/Stripe/new route", () => {
    const c = raw(`${P}/lib/dashboardResumePaymentClient.ts`);
    assert.match(c, /startRevenueCategoryCheckout\(buildDashboardResumePaymentPayload\(input\)\)/);
    assert.match(c, /redirectToRevenueCategoryCheckout\(checkout\.checkoutUrl\)/);
    const code = c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(code, /fetch\(|stripe|\/api\/|createCheckoutSession|window\.location/i);
    assert.match(c, /return \{ ok: false, userMessage: checkout\.userMessage \}/, "server 404/403/409 message shown as returned");
    const chk = raw("app/lib/listingPlans/revenueCategoryCheckoutClient.ts");
    assert.match(chk, /active_entitlement_no_recharge/);
    assert.match(chk, /already_published_no_recharge/);
    const pl = raw(`${P}/lib/dashboardPendingPayment.ts`);
    for (const k of ["EMPLEOS_PAID_JOB_CHECKOUT", "RENTAS_CATEGORY_CHECKOUT", "BIENES_RAICES_FSBO_CHECKOUT", "CLASES_CATEGORY_CHECKOUT", "AUTOS_PRIVADO_CHECKOUT"]) {
      assert.match(pl, new RegExp(k));
    }
    assert.doesNotMatch(pl.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, ""), /_30d"|_45d"|_monthly"/, "no hard-coded package key");
  });

  await check("no dashboard UI file talks to the checkout route itself (single choke point)", () => {
    const uiFiles = [
      `${P}/mis-anuncios/page.tsx`,
      `${P}/empleos/page.tsx`,
      `${P}/empleos/[listingId]/page.tsx`,
      `${P}/restaurantes/page.tsx`,
      `${P}/components/LeonixRealEstateListingManageCard.tsx`,
      "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
      "app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx",
    ];
    for (const f of uiFiles) {
      const s = code(f);
      assert.doesNotMatch(s, /\/api\/revenue-os\/checkout|REVENUE_CATEGORY_CHECKOUT_ROUTE/, f);
      assert.doesNotMatch(s, /startRevenueCategoryCheckout/, `${f} must go through dashboardResumePaymentClient`);
    }
  });

  await check("restaurantes resume: subscription => never a direct checkout; hydrates the draft and opens the consent checkpoint", () => {
    const r = raw(`${P}/lib/restaurantesDashboardResumePayment.ts`);
    const code = r.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(code, /startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout|fetch\(/);
    assert.match(r, /\.eq\("owner_user_id", user\.id\)/, "owner-scoped read");
    assert.match(r, /isRestauranteAwaitingPayment\(/, "only a pending_payment row resumes");
    assert.match(r, /saveRestauranteDraftToStorageResolved\(merged\)/);
    assert.match(r, /restauranteResumePaymentPreviewHref\(lang, input\.target\)/);
    // the preview page renders the checkpoint only when NOT listing-bound (source=dashboard suppresses it)
    const prev = raw("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
    assert.match(prev, /suppressListingBoundCheckout/);
    assert.match(prev, /RESTAURANTES_BASE_CHECKOUT/);
  });

  await check("mis-anuncios: payment action only for the lanes with a Revenue OS package; Negocio never; pinned literals kept", () => {
    const s = raw(`${P}/mis-anuncios/page.tsx`);
    assert.match(s, /if \(status === "sold"\) patch\.is_published = false;/, "pinned literal from d3ed73ab");
    assert.match(s, /realEstatePayLaneRaw === "rentas" \|\| realEstatePayLaneRaw === "bienes-raices-fsbo"/);
    assert.match(s, /onCompletePayment=\{\s*realEstatePayLane\s*\?/);
    assert.match(s, /genericPayLane === "clases"/);
    assert.match(s, /startPendingPayment\("clases", x\.id, x\.leonix_ad_id\)/);
    assert.match(s, /startPendingPayment\("empleos", item\.id, item\.leonixAdId\)/);
    assert.match(s, /resumeRestaurantePayment\(item\.id, "checkout"\)/);
    // Gate 2 (2026-09 dashboard state machine): the pre-publication-only `genericNotLive` gate became the full public-truth gate
    // (`genericPublicLinkOk` = dashboardOwnerActionPlan().viewPublic, which also hides paused / expired / term-elapsed / removed rows).
    // Still asserts the unpaid case: a pending row can never resolve a public link (executable in verify-final-dashboard-state-machine.ts).
    assert.match(s, /\{!genericPublicLinkOk \? null : \(/, "generic card hides 'View public' while not live");
    assert.match(s, /data-testid="mis-anuncios-attention-complete-payment"/);
    // Bienes Negocio has no pay wiring anywhere in the dashboard
    assert.doesNotMatch(s, /startPendingPayment\("bienes-raices-negocio/);
    assert.doesNotMatch(s, /BIENES_RAICES_NEGOCIO_CHECKOUT|br_agent_monthly/);
  });

  await check("real-estate card: FSBO/Rentas pay button + status only for an unpaid pending row; public link + FSBO public preview hidden until live", () => {
    const s = raw(`${P}/components/LeonixRealEstateListingManageCard.tsx`);
    assert.match(s, /const notLive = isSharedListingsRowNotLive\(row\);/);
    assert.match(s, /onCompletePayment && notLive && awaitingPaymentLane/);
    // Gate 2: the gate widened from "not pre-publication" to the REAL public state (`liveState.linkResolves`: term / rented / BR parent
    // gate). `notLive` still drives the pending chip + payment button asserted above. A pending row is never `linkResolves`.
    assert.match(s, /\{!liveState\.linkResolves \? null : \(\s*<Link\s+href=\{publicViewHref\}/);
    assert.match(s, /brDashboardPreviewHref && !\(\(notLive \|\| !liveState\.linkResolves\) && effectiveBranch === "bienes_raices_privado"\)/);
    assert.match(s, /data-testid="listing-not-live-status"/);
    assert.match(s, /dashboardAwaitingPaymentLabel\(lang\)/);
  });

  await check("autos: privado card offers Completar pago via Revenue OS for draft/pending_payment/payment_failed; legacy card hides public link", () => {
    const sec = raw("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
    assert.match(sec, /isAutosPrivadoAwaitingPayment\(\{ lane: row\.lane, status: row\.status \}\)/);
    assert.match(sec, /startDashboardResumePayment\(\{ lane: "autos-privado", listingId: id, leonixAdId, lang \}\)/);
    // Gate 2: "View public" was `status === "active"` only; a Privado row past its fixed term stays `active` but has no public page, so it now
    // needs the public predicate (`dashboardViewPublicAllowed("autos", row)` -> isAutosRowPubliclyLive). draft / pending_payment / payment_failed
    // are still never public (executable in verify-final-dashboard-state-machine.ts).
    assert.match(sec, /dashboardViewPublicAllowed\("autos", row\) && isLiveCapability\(privadoCaps\.identity\.publicView\)/, "public view needs the public predicate");
    assert.match(sec, /autosPrivadoPreviewHref\(row\.id\)/, "Preview stays");
    const card = raw("app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx");
    assert.match(card, /const notLive = isPrePublicationStatus\(row\.status\) \|\| !publicViewAllowed;/);
    assert.match(card, /\{notLive \? null : \(/);
  });

  await check("listing workspace (/dashboard/mis-anuncios/[id]): unpaid row = 'Pago pendiente' + Completar pago; no public link until live", () => {
    const s = raw(`${P}/mis-anuncios/[id]/page.tsx`);
    assert.match(s, /const rowNotLive = row \? isSharedListingsRowNotLive\(row\) : false;/);
    // Gate 2: `!rowNotLive` (pre-publication only) -> `wsViewPublic` (the public predicate incl. term + BR parent gate).
    assert.match(s, /row && wsViewPublic \? \[\{ href: publicListingHref/);
    assert.match(s, /startDashboardResumePayment\(\{\s*lane: unpaidPayLane,/);
    assert.match(s, /statusLabel: unpaidPayLane \? dashboardAwaitingPaymentLabel\(lang\)/);
    assert.doesNotMatch(code(`${P}/mis-anuncios/[id]/page.tsx`), /BIENES_RAICES_NEGOCIO_CHECKOUT|startRevenueCategoryCheckout/);
  });

  await check("mis-anuncios attention memo keeps the pinned deps literal (Servicios gate 9) and layers the restaurant/autos payment items on top", () => {
    const s = raw(`${P}/mis-anuncios/page.tsx`);
    assert.ok(s.includes("[empleosInventory, viajesInventory, serviciosInventory, listings, q]);"));
    assert.match(s, /const coreAttentionItems = useMemo<OwnerAttentionItem\[\]>/);
    assert.match(s, /\[coreAttentionItems, restaurantInventory, autosPaidInventory\]/);
  });

  await check("empleos pages: paid draft shows 'Pago pendiente' + Completar pago; the dead 'Resume' for paid drafts stays hidden", () => {
    for (const f of [`${P}/empleos/page.tsx`, `${P}/empleos/[listingId]/page.tsx`]) {
      const s = raw(f);
      assert.match(s, /isEmpleosDraftAwaitingPayment\(/, f);
      assert.match(s, /startDashboardResumePayment\(\{\s*lane: "empleos"/, f);
      assert.match(s, /dashboardAwaitingPaymentLabel\(lang\)/, f);
      // Gate 2 (2026-09 dashboard state machine): the literal Feria-only condition was replaced by
      // `dashboardEmpleosOwnerTransitions` (which calls the SAME `resolveEmpleosOwnerTransition` the PATCH route runs), so
      // the paid-draft 'Resume' stays hidden AND a staff-held / never-live archive is never offered a dead Reactivate.
      // The behavior is executable in scripts/verify-final-dashboard-state-machine.ts (paid draft, feria draft, staff hold, archive matrix).
      assert.match(s, /dashboardEmpleosOwnerTransitions\(/, `${f}: resume/pause/archive come from the server transition policy`);
      assert.match(s, /empleosTransitions\.resume/, `${f}: 'Resume' is gated by the transition policy (paid drafts never resume)`);
    }
  });

  await check("restaurantes dashboard page: public 'View' only when published; pending_payment gets resume actions; 'Published' date hidden", () => {
    const s = raw(`${P}/restaurantes/page.tsx`);
    assert.match(s, /const awaitingPayment = isRestauranteAwaitingPayment\(r\.status\);/);
    assert.match(s, /\.\.\.\(r\.status === "published"/);
    assert.match(s, /resumePayment\(r, "checkout"\)/);
    // Owner rule pinned by verify-owner-command-center-package2-gate2d: Restaurantes never fabricates a
    // per-listing "Vista previa" action; Complete payment resumes into the existing checkpoint instead.
    assert.ok(!/previewLabel\(lang\)/.test(s), "no fabricated per-listing preview action");
    assert.match(s, /\.\.\.\(awaitingPayment \? \[\] : \[\{ label: t\.cardPublished/);
  });

  await check("Comida Local + Servicios flows untouched by this change", () => {
    for (const f of ["dashboardPendingPayment.ts", "dashboardResumePaymentClient.ts", "restaurantesDashboardResumePayment.ts"]) {
      assert.doesNotMatch(code(`${P}/lib/${f}`), /comida/i, f);
    }
    // Servicios' own "Completar pago" link pattern (Gate 8) is still there
    const tools = raw(`${P}/lib/dashboardMisAnunciosCategoryTools.ts`);
    assert.match(tools, /#servicios-publish-checkout-checkpoint/);
    assert.match(tools, /category === "servicios" && item\.status === "pending_payment"/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} FAILURE(S):\n - ${failures.join("\n - ")}`);
    process.exit(1);
  }
  console.log("\nverify-closeout2-dashboard: ALL CHECKS PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
