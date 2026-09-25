/**
 * OWNER DASHBOARD AUTHORITY + RESTAURANTES PAYMENT RESUME (golden-survivor semantic port).
 *
 * Ported from integration/category-circuit-closeout-2026-09 (a4a1749b4):
 *  - scripts/verify-category-circuit-closeout.ts  "dashboard: ..." + the dashboardOwnerStatusDisplay half of
 *    "restaurantes: ..." (the restaurantes publish-route half belongs to the restaurantes publish lane);
 *  - scripts/verify-forensic-closeout.ts          "owner relist policy ..." + "Autos identity cleanup is scoped ...";
 *  - scripts/verify-closeout2-dashboard.ts         the Restaurantes resume checks, ADAPTED to golden's Quick ($249) /
 *    Full ($399) checkpoint: the resume carries the plan the row's unresolved checkout was started on
 *    (ledger `resume` offer) and falls back to the Quick/Full checkpoint selector when it cannot be proven.
 * Plus golden-specific guards: owner pause -> resume of a paid live listing and checkout renewals are untouched.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-closeout-dashboard-owner-authority.ts
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
const P = "app/(site)/dashboard";

function fnBody(src: string, header: string, nextHeader: string): string {
  const start = src.indexOf(header);
  assert.ok(start >= 0, `missing ${header}`);
  const rest = src.slice(start);
  const end = rest.indexOf(nextHeader, header.length);
  return end > 0 ? rest.slice(0, end) : rest.slice(0, 8000);
}

async function main() {
  const relist = await import("../app/(site)/dashboard/lib/dashboardOwnerRelistPolicy");
  const pp = await import("../app/(site)/dashboard/lib/dashboardPendingPayment");

  // ── A. owner self-activation authority ──────────────────────────────────────────────────────
  await check("owner relist policy allows only paused / sold / active", () => {
    for (const s of ["paused", "sold", "active", " Paused "]) assert.equal(relist.dashboardOwnerMayActivateFromStatus(s), true, s);
    for (const s of ["pending", "flagged", "removed", "draft", "expired", "pending_payment", "", null, undefined]) {
      assert.equal(relist.dashboardOwnerMayActivateFromStatus(s), false, String(s));
    }
    for (const rel of [`${P}/mis-anuncios/[id]/page.tsx`, `${P}/mis-anuncios/[id]/editar/page.tsx`, `${P}/mis-anuncios/page.tsx`]) {
      assert.match(raw(rel), /dashboardOwnerMayActivateFromStatus\(/, rel);
    }
  });

  await check("dashboard: Rentas/FSBO republish never flips a non-live row; markStatus active only from paused/sold; En Venta sold stays viewable", () => {
    const p = raw(`${P}/mis-anuncios/page.tsx`);
    const rentasBlock = fnBody(p, "async function renewListingsTableRepublish", "async function startRentasRenewal");
    assert.match(rentasBlock, /if \(!live\) \{\s*\/\/ 2026-09 category closeout — Republish only bumps/);
    assert.ok(!/patch\.status = "active";/.test(rentasBlock), "Rentas/BR block must not set active client-side");
    const mark = fnBody(p, "async function markStatus(", "async function renewListingsTableRepublish");
    assert.match(mark, /!dashboardOwnerMayActivateFromStatus\(cur\)/);
    // the refusal happens BEFORE any client write
    assert.ok(mark.indexOf("dashboardOwnerMayActivateFromStatus(cur)") < mark.indexOf("applyOwnerListingPatch("));
    assert.match(mark, /if \(soldEnVenta\) delete patch\.is_published;/);
    const ev = fnBody(p, "async function renewEnVentaRepublish", "async function softArchiveListing");
    assert.match(ev, /rowStatusForRepublish !== "paused" && rowStatusForRepublish !== "sold"/);
    assert.ok(ev.indexOf("rowStatusForRepublish !==") < ev.indexOf("applyOwnerListingPatch("));
    assert.ok(p.includes('if (status === "sold") patch.is_published = false;'), "literal pinned by verify-bienes-final-launch-golden-stack-01");
  });

  await check("listing workspace + editor: Refrescar / status change refuse activation outside paused|sold|active, before any write", () => {
    const w = raw(`${P}/mis-anuncios/[id]/page.tsx`);
    const refresh = fnBody(w, "async function refreshEnVentaListing", "async function markStatus(");
    assert.match(refresh, /if \(!live\) \{[\s\S]{0,300}if \(!dashboardOwnerMayActivateFromStatus\(row\.status\)\) \{\s*setResumeError\(dashboardSafeMutationErrorCopy\(lang\)\);\s*setBusy\(false\);\s*return;/);
    const ms = fnBody(w, "async function markStatus(", "async function startFsboRenewal");
    assert.match(ms, /if \(status === "active" && !dashboardOwnerMayActivateFromStatus\(row\.status\)\) \{/);
    assert.ok(ms.indexOf("dashboardOwnerMayActivateFromStatus") < ms.indexOf("applyOwnerListingPatch("));
    const e = raw(`${P}/mis-anuncios/[id]/editar/page.tsx`);
    assert.match(e, /if \(status === "active" && !dashboardOwnerMayActivateFromStatus\(\(listing as \{ status\?: unknown \} \| null\)\?\.status\)\) \{/);
    assert.ok(e.indexOf("!dashboardOwnerMayActivateFromStatus(") < e.indexOf("applyOwnerListingPatch(supabase, id, userId, { status })"));
  });

  await check("golden: owner pause -> resume of a paid live listing is untouched; paid renewals still go through Revenue OS checkout", () => {
    const p = raw(`${P}/mis-anuncios/page.tsx`);
    const resume = fnBody(p, "async function markResumeListing", "async function openRestauranteCouponEdit");
    assert.match(resume, /ownerListingResumeFromPausePatch\(\)/, "client resume-from-pause patch unchanged");
    assert.ok(!/dashboardOwnerMayActivateFromStatus/.test(resume), "resume path not re-gated (only shown for a paused row)");
    assert.equal(relist.dashboardOwnerMayActivateFromStatus("paused"), true, "a paused row may always be relisted by its owner");
    for (const fn of ["async function startRentasRenewal", "async function startBienesFsboRenewal"]) {
      const body = fnBody(p, fn, "async function ");
      assert.match(body, /startListingRenewalCheckout\(\{/, fn);
      assert.ok(!/dashboardOwnerMayActivateFromStatus|applyOwnerListingPatch/.test(body), `${fn} is payment-authority only`);
    }
  });

  // ── B. Restaurantes payment resume (golden Quick/Full checkpoint) ───────────────────────────
  await check("restaurantes: pending_payment is mapped in the owner status display", () => {
    assert.match(raw(`${P}/lib/dashboardOwnerStatusDisplay.ts`), /pending_payment: "pending_payment",/);
  });

  await check("restaurantes: only pending_payment awaits payment", () => {
    assert.equal(pp.isRestauranteAwaitingPayment("pending_payment"), true);
    assert.equal(pp.isRestauranteAwaitingPayment(" Pending_Payment "), true);
    for (const st of ["published", "paused", "suspended", "archived", "", null, undefined]) {
      assert.equal(pp.isRestauranteAwaitingPayment(st as string), false, String(st));
    }
  });

  await check("restaurantes resume keeps the row's chosen plan: ledger resume Quick -> plan=quick, Full -> no marker, unknown -> Quick/Full checkpoint", () => {
    assert.equal(pp.restauranteResumePlanFromOffer({ mode: "resume", sellPackageKey: "restaurantes_quick_monthly" }), "quick");
    assert.equal(pp.restauranteResumePlanFromOffer({ mode: "resume", sellPackageKey: "restaurantes_base_monthly" }), "full");
    for (const o of [
      null,
      undefined,
      { mode: "new", sellPackageKey: null },
      { mode: "upgrade", sellPackageKey: "restaurantes_base_monthly" },
      { mode: "settled", sellPackageKey: null },
      { mode: "resume", sellPackageKey: "servicios_quick_monthly" },
    ]) assert.equal(pp.restauranteResumePlanFromOffer(o), null, JSON.stringify(o));

    const quick = pp.restauranteResumePaymentHref("es", "checkout", "quick");
    assert.equal(quick, "/clasificados/restaurantes/preview?lang=es&plan=quick#publish-checkout-checkpoint");
    const full = pp.restauranteResumePaymentHref("en", "checkout", "full");
    assert.equal(full, "/clasificados/restaurantes/preview?lang=en#publish-checkout-checkpoint");
    assert.doesNotMatch(full, /plan=/, "Full is never written into a link");
    assert.equal(pp.restauranteResumePaymentHref("es", "preview", "full"), "/clasificados/restaurantes/preview?lang=es");
    assert.equal(pp.restauranteResumePaymentHref("es", "checkout", null), "/clasificados/publicar/restaurantes?lang=es");
    for (const h of [quick, full]) assert.doesNotMatch(h, /source=dashboard|listingId=|preview=listing/, "never listing-bound (that suppresses checkout)");
  });

  await check("restaurantes resume module: subscription => never a direct checkout; owner-scoped; ledger offer only chooses the plan", () => {
    const r = raw(`${P}/lib/restaurantesDashboardResumePayment.ts`);
    const code = r.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    assert.doesNotMatch(code, /startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout|revenue-os\/checkout/);
    assert.match(code, /BUSINESS_BASE_PLAN_OFFER_ROUTE\}\?category=restaurantes&listingId=/, "the only fetch is the read-only base-plan offer");
    assert.equal((code.match(/fetch\(/g) ?? []).length, 1);
    assert.match(r, /\.eq\("owner_user_id", user\.id\)/, "owner-scoped read");
    assert.match(r, /isRestauranteAwaitingPayment\(/, "only a pending_payment row resumes");
    assert.match(r, /saveRestauranteDraftToStorageResolved\(merged\)/);
    assert.match(r, /merged\.draftListingId = stableDraftId;/, "same draftListingId -> the preview's pending save updates THIS row");
    assert.match(r, /restauranteResumePaymentHref\(lang, input\.target, plan\)/);
    // golden's preview: checkpoint only when NOT listing-bound; plan from `plan=quick` marker; Quick vs Full keys
    const prev = raw("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
    assert.match(prev, /suppressListingBoundCheckout/);
    assert.match(prev, /selectBusinessBaseCheckout\(\{\s*quick: RESTAURANTES_QUICK_CHECKOUT,\s*full: RESTAURANTES_BASE_CHECKOUT,/);
    assert.match(prev, /basePackageKey: isQuickPreview \? RESTAURANTES_QUICK_CHECKOUT\.packageKey : null,/);
    assert.match(raw("app/lib/listingPlans/businessQuickPlanSignal.ts"), /export function carryBusinessPlanParam/);
  });

  await check("restaurantes dashboard page: public 'View' only when published; pending_payment gets Completar pago; 'Published' date hidden", () => {
    const s = raw(`${P}/restaurantes/page.tsx`);
    assert.match(s, /const awaitingPayment = isRestauranteAwaitingPayment\(r\.status\);/);
    assert.match(s, /\.\.\.\(r\.status === "published"/);
    assert.match(s, /resumePayment\(r, "checkout"\)/);
    assert.ok(!/previewLabel\(lang\)/.test(s), "no fabricated per-listing preview action");
    assert.match(s, /\.\.\.\(awaitingPayment \? \[\] : \[\{ label: t\.cardPublished/);
    assert.match(s, /note=\{awaitingPayment \? \{ text: dashboardNotLiveNote\(lang\), tone: "warning" \} : lifecycleNote\}/);
  });

  // ── C. Autos paid-return identity cleanup ───────────────────────────────────────────────────
  await check("Autos identity cleanup is scoped to the paid listing (Quick dealer base included)", () => {
    const c = raw("app/(site)/revenue-os/pago/_components/AutosPaidReturnIdentityCleanup.tsx");
    assert.match(c, /stored\?\.listingId === paid/);
    for (const k of ["autos_privado_30d", "autos_dealer_monthly", "autos_dealer_quick_monthly"]) assert.ok(c.includes(`"${k}"`), k);
    assert.match(raw("app/(site)/revenue-os/pago/exito/page.tsx"), /paidListingId=\{proof\.listingId\}/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
