/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 8 (resume payment, 2026-09-18).
 *
 * A listing-bound preview of a row still awaiting its base purchase (pending_payment / draft /
 * preview_ready / publish_ready — same detection as Gate 7's `listingBoundAwaitsBasePurchase`) had
 * NO way to resume Revenue OS checkout at all: `showFinalCheckout` unconditionally excluded every
 * listing-bound preview, so only a brand-new application could ever reach the (already fully
 * built and proven) `PublishCheckoutCheckpoint` + `onCheckout` + `startRevenueCategoryCheckout`
 * pipeline.
 *
 * Fix: `showFinalCheckout` now also covers a listing-bound row still awaiting purchase, and the
 * bottom action bar shows a "Completar pago" button next to (not instead of) "Guardar cambios" for
 * that case. No new checkout logic was written — `onCheckout` already resolves `listingId`/
 * `leonixAdId` fresh from the pending-payment save result each time, so resuming an existing row
 * PATCHes/reuses it (Gate 6) rather than creating a duplicate, and a published listing-bound
 * preview (`listingBoundAwaitsBasePurchase` false) never reaches this branch — it keeps its
 * separate Publish/Republish button, never re-exposing base-plan checkout.
 *
 * The Mis Anuncios dashboard card gets its own direct "Completar pago" action for a
 * `pending_payment` row (owner lock: "Complete Payment available" is its own listed dashboard
 * capability, not merely reachable two clicks deep through Edit -> Preview) — it routes to the
 * SAME canonical listing-bound Preview href the existing "Preview" action already uses, anchored
 * to the checkout checkpoint added above, so there is exactly one resume-payment implementation.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate8-resume-payment.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const DASHBOARD_TOOLS = "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts";

check("showFinalCheckout now also covers a listing-bound row still awaiting its base purchase", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("const showFinalCheckout =");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 260);
  assert.ok(block.includes("(!listingBoundPreview || listingBoundAwaitsBasePurchase)"));
});

check("a published/paused/pending_review listing-bound preview is EXCLUDED (never re-exposes base-plan checkout)", () => {
  const src = raw(PREVIEW);
  // listingBoundAwaitsBasePurchase is only true for the awaiting-purchase status set (proven by
  // Gate 7's own regression guard on SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES); a published row's
  // listingBoundPreview=true and listingBoundAwaitsBasePurchase=false makes the OR-clause false.
  assert.ok(src.includes("listingBoundAwaitsBasePurchase =") && src.includes("SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES.has("));
});

check("'Completar pago' / 'Complete payment' renders next to 'Guardar cambios', not replacing it", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("{showFinalCheckout ? (");
  assert.ok(idx > 0);
  const end = src.indexOf("</>\n            ) : (", idx);
  assert.ok(end > idx, "must find the closing fragment before the fresh-application-only else branch");
  const block = src.slice(idx, end);
  assert.ok(block.includes("handleSaveChangesForPendingListing()"), "Guardar cambios must still be reachable here");
  assert.ok(block.includes('"Complete payment"') && block.includes('"Completar pago"'));
  assert.ok(block.includes('"Continue to payment"') && block.includes('"Continuar al pago"'), "the original fresh-application copy must be preserved verbatim");
});

check("resume-payment reuses the SAME onCheckout / startRevenueCategoryCheckout pipeline — no new checkout path was written", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("const onCheckout = useCallback(");
  assert.ok(idx > 0);
  const end = src.indexOf("[appState,", src.indexOf("setCheckoutBusy(false);\n    }\n  },", idx));
  const body = src.slice(idx, end > idx ? end : idx + 3000);
  assert.ok(body.includes("saveServiciosPendingBeforeCheckout({ state: appState, lang, accessToken })"));
  assert.ok(body.includes("startRevenueCategoryCheckout({"));
  assert.ok(body.includes("listingId: pending.listingId,") && body.includes("leonixAdId: pending.leonixAdId,"), "checkout must always target the id the save just returned, never a stale prop");
});

check("REGRESSION GUARD: the checkpoint UI itself (confirmations, promo, newsletter, rules modal) is untouched", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("<PublishCheckoutCheckpoint"));
  assert.ok(src.includes("confirmations: SERVICIOS_CHECKPOINT_CONFIRMATIONS,"));
  assert.ok(src.includes("onPromoApply={handlePromoApply}"));
});

check("the Mis Anuncios dashboard card exposes a direct 'Completar pago' action for a pending_payment Servicios row", () => {
  const src = raw(DASHBOARD_TOOLS);
  const idx = src.indexOf('item.status === "pending_payment"');
  assert.ok(idx > 0, "must gate specifically on the real pending_payment status, not infer it");
  const block = src.slice(idx, idx + 1000);
  assert.ok(block.includes("#servicios-publish-checkout-checkpoint"), "must route into the SAME checkpoint Preview adds, not a new checkout entry point");
  assert.ok(block.includes('"Completar pago"') && block.includes('"Complete payment"'));
});

check("REGRESSION GUARD: the dashboard resume-payment href is built from the same canonical preview href the 'Preview' action already uses", () => {
  const src = raw(DASHBOARD_TOOLS);
  const idx = src.indexOf('item.status === "pending_payment"');
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 1000);
  assert.ok(block.includes('canonical.get("preview")?.href ?? item.previewHref'));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate8-resume-payment: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate8-resume-payment: PASS");
