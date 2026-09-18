/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 7 (pending-payment dashboard edit,
 * 2026-09-18).
 *
 * Dashboard -> Edit -> Application -> Preview was effectively unusable for an existing
 * `pending_payment` listing: `canPublishFromPreview` unconditionally required the three legal
 * confirmations, which listing-bound hydration always hardcodes false (owner lock: an ordinary
 * edit does NOT recollect them) — so the Save action was permanently disabled with no path
 * forward. Separately, even if it had been enabled, the underlying call omitted
 * `activationMode: "pending_payment"`, which for an `pending_payment`/draft/preview_ready/
 * publish_ready row would have advanced `listing_status` straight to `published` per
 * `decideServiciosOwnerSaveStatus` — silently publishing an unpaid listing from a content edit.
 * The preview's mock professional card also always hardcoded `published_at`/`listing_status` as
 * "published now", even for a listing-bound preview of a still-hidden row.
 *
 * Fix:
 *  - `canPublishFromPreview` exempts the three confirmations for a listing-bound preview (mirrors
 *    the existing `previewReadiness` exemption).
 *  - A dedicated "Guardar cambios" path (`handleSaveChangesForPendingListing`) reuses the already-
 *    proven `saveServiciosPendingBeforeCheckout` (Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01)
 *    whenever the listing's REAL hydrated status is still awaiting its base purchase: it PATCHes
 *    the durable row (Gate 6), explicitly requests `activationMode: "pending_payment"` so the row
 *    stays `pending_payment`, makes zero Stripe calls, and — unlike a first publish — never clears
 *    the draft or navigates away; it shows a truthful "saved, still hidden" confirmation instead.
 *  - Hydration no longer unconditionally overwrites an in-progress local draft for the SAME listing
 *    with a stale database snapshot (it still always refreshes identity + the real listing_status).
 *  - The mock preview card no longer fakes `published_at`/`listing_status` for a listing-bound
 *    preview; it uses the real hydrated status (or `null` for the not-yet-real `published_at`).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate7-pending-payment-edit.ts
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
const PENDING_CHECKOUT = "app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts";
const POLICY = "app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy.ts";

check("canPublishFromPreview exempts the three confirmations for a listing-bound preview", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("const canPublishFromPreview =");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 400);
  assert.ok(block.includes("listingBoundPreview ||"), "must exempt when listing-bound");
  assert.ok(block.includes("appState.confirmListingAccurate"), "must still require the confirmations for a FRESH application");
});

check("a listing-bound row still awaiting its base purchase is detected from the REAL hydrated status", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES.has(listingBoundStatus.trim().toLowerCase())"));
  assert.ok(src.includes("setListingBoundStatus(hydrated.editIdentity.status)"), "hydration must capture the real status, not fabricate it");
});

check("the pending-payment save path reuses the proven pre-checkout helper with activationMode set, never Stripe", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("const handleSaveChangesForPendingListing = useCallback(");
  assert.ok(idx > 0, "dedicated listing-bound save handler must exist");
  const end = src.indexOf("[appState, canPublishFromPreview, lang]);", idx);
  const body = src.slice(idx, end);
  assert.ok(body.includes("saveServiciosPendingBeforeCheckout({ state: appState, lang, accessToken })"));
  assert.ok(!/startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout/.test(body), "must never initiate Stripe checkout from an ordinary content save");
  assert.ok(!body.includes("clearServiciosDraftStorageAndIdb"), "must NOT clear the draft on an edit-save (unlike a first-time publish)");
  assert.ok(!body.includes("router.push"), "must NOT navigate away as if newly published");
  assert.ok(body.includes("setSavedChangesNotice(true)"), "must show a truthful saved confirmation instead");
});

check("REGRESSION GUARD: saveServiciosPendingBeforeCheckout itself still requests activationMode pending_payment and makes no Stripe call", () => {
  const src = raw(PENDING_CHECKOUT);
  assert.ok(src.includes('activationMode: "pending_payment",'));
  assert.ok(!/stripe/i.test(src), "must remain a pure pre-payment persistence helper");
});

check("the Save CTA reads 'Guardar cambios' / 'Save changes' for a listing-bound pending-purchase row, not 'Publish'", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("listingBoundAwaitsBasePurchase ? (");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 700);
  assert.ok(block.includes("handleSaveChangesForPendingListing()"));
  assert.ok(block.includes('"Save changes"') && block.includes('"Guardar cambios"'));
  assert.ok(!/"Publish"|"Publicar"(?!\s*para)/.test(block), "must not still say Publish/Publicar for this branch");
});

check("hydration prefers an in-progress local draft for the SAME listing over a stale database snapshot", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("alreadyEditingThisListing = Boolean(listingId) && primedId === listingId"));
  const idx = src.indexOf("if (alreadyEditingThisListing) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 250);
  assert.ok(block.includes("loadClasificadosServiciosApplicationResolved()"));
  // Identity + real status must still always come from the fresh database fetch, never the stale local draft.
  const primeIdx = src.indexOf("primeServiciosExistingListingId(hydrated.editIdentity.id);");
  assert.ok(primeIdx > 0 && primeIdx < idx, "identity priming must happen unconditionally, before the local-draft preference branch");
});

check("the mock preview card no longer fakes published_at/listing_status for a listing-bound preview", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf("const previewListingRow = useMemo(");
  assert.ok(idx > 0);
  const end = src.indexOf("[useProfessionalPreview, appState, appDraft, profile, listingBoundPreview, listingBoundStatus]);", idx);
  const block = src.slice(idx, end);
  assert.ok(block.includes("published_at: listingBoundPreview ? null : new Date().toISOString(),"));
  assert.ok(
    block.includes("listing_status: listingBoundPreview && listingBoundStatus ? listingBoundStatus : SERVICIOS_LISTING_STATUS_PUBLISHED,"),
  );
});

check("REGRESSION GUARD: a fresh (non listing-bound) application preview is untouched — still fakes an honest 'now'/'published' stand-in and still requires the three confirmations", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("listingBoundPreview ? null : new Date().toISOString()"));
  assert.ok(src.includes("(appState.confirmListingAccurate && appState.confirmPhotosRepresentBusiness && appState.confirmCommunityRules)"));
});

check("REGRESSION GUARD: SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES is untouched (pending_payment, draft, preview_ready, publish_ready)", () => {
  const src = raw(POLICY);
  const idx = src.indexOf("export const SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 250);
  for (const s of ["pending_payment", "draft", "preview_ready", "publish_ready"]) {
    assert.ok(block.includes(`"${s}"`), `must still include ${s}`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate7-pending-payment-edit: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate7-pending-payment-edit: PASS");
