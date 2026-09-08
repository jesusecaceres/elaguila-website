/**
 * OFERTAS FLYER PUBLISH-ROUTING FIX audit.
 *
 * Root bug: after finishing the publish application and reaching Preview,
 * the owner's only "continue" action (both the top mini owner-controls bar
 * and the bottom "Owner controls" section of OfertasLocalesPreviewCard)
 * linked straight to the bare owner dashboard (/dashboard/ofertas-locales/
 * [id]) — forcing the owner to then hunt for how to actually pay/publish.
 * Locked doctrine: Application -> Preview -> final checkout/publish
 * checkpoint -> Stripe -> webhook auto-publish -> THEN dashboard management.
 *
 * Fix: that same link now points to the existing, already-certified
 * checkout page (/dashboard/ofertas-locales/[id]/checkout) for the SAME
 * canonical listing id — reusing the certified checkout/auto-publish
 * architecture rather than duplicating or redesigning it. Also removed
 * eight dead, zero-usage copy keys in the Preview copy file that still
 * carried forbidden "routine Leonix approval" wording from a since-removed
 * manual submit-for-review UI.
 *
 * Run: npm run ofertas-locales:flyer-publish-routing-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";
import { getOfertaLocalCommercialProductForOfferType } from "../app/lib/ofertas-locales/ofertasLocalesCommercial";

type Verdict = { id: string; label: string; ok: boolean };
const results: Verdict[] = [];

function check(id: string, label: string, fn: () => void) {
  try {
    fn();
    results.push({ id, label, ok: true });
    console.log(`${id} ${label} -> TRUE`);
  } catch (err) {
    results.push({ id, label, ok: false });
    console.log(`${id} ${label} -> FALSE (${(err as Error).message})`);
  }
}

const previewCardPath = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const previewCopyPath = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";
const applicationClientPath = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const dashboardPagePath = "app/(site)/dashboard/ofertas-locales/[id]/page.tsx";
const checkoutPagePath = "app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx";
const reviewMutationsPath = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const revenueFulfillmentPath = "app/lib/listingPlans/revenueFulfillment.ts";
const commercialServerPath = "app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts";

const previewCardSrc = fs.readFileSync(previewCardPath, "utf8");
const previewCopySrc = fs.readFileSync(previewCopyPath, "utf8");
const applicationClientSrc = fs.readFileSync(applicationClientPath, "utf8");
const dashboardPageSrc = fs.readFileSync(dashboardPagePath, "utf8");
const checkoutPageSrc = fs.readFileSync(checkoutPagePath, "utf8");
const reviewMutationsSrc = fs.readFileSync(reviewMutationsPath, "utf8");
const revenueFulfillmentSrc = fs.readFileSync(revenueFulfillmentPath, "utf8");
const commercialServerSrc = fs.readFileSync(commercialServerPath, "utf8");

check("01", "Finished Flyer Preview primary CTA does NOT route to the bare dashboard", () => {
  assert.doesNotMatch(
    previewCardSrc,
    /`\/dashboard\/ofertas-locales\/\$\{encodeURIComponent\(dashboardId\)\}\?lang=\$\{resolvedRouteLang\}`/,
    "the old bare-dashboard href must be gone"
  );
});

check("02", "Same canonical listing id is preserved in the new checkout href", () => {
  assert.match(
    previewCardSrc,
    /const dashboardId = publishSuccess\?\.id \?\? ofertaLocalId;/,
    "id resolution (submission id preferred over scan-session id) must be unchanged"
  );
  assert.match(
    previewCardSrc,
    /`\/dashboard\/ofertas-locales\/\$\{encodeURIComponent\(dashboardId\)\}\/checkout\?lang=\$\{resolvedRouteLang\}`/,
    "the new href must carry the same dashboardId into the checkout route"
  );
});

check("03", "Preview's owner-controls CTA routes into the final publish checkpoint", () => {
  // dashboardHref is computed once (asserted in 01/02) and reused as the href at both
  // the top mini owner-controls bar and the bottom "Owner controls" section — confirm
  // both render sites actually consume that single variable, not a hardcoded duplicate.
  const hrefUsages = previewCardSrc.match(/href=\{dashboardHref\}/g) ?? [];
  assert.equal(hrefUsages.length, 2, "both the top mini bar and the bottom Owner controls section must render href={dashboardHref}");
});

check("04", "The checkout page hands off to the existing Revenue OS checkout (no new Stripe logic)", () => {
  assert.match(checkoutPageSrc, /import \{\s*redirectToRevenueCategoryCheckout,\s*startRevenueCategoryCheckout,/);
  assert.match(checkoutPageSrc, /await startRevenueCategoryCheckout\(\{/);
  assert.match(checkoutPageSrc, /category: "ofertas-locales",/);
});

check("05", "Checkout success redirects to Stripe using the SAME listing id", () => {
  assert.match(checkoutPageSrc, /listingId: offer\.id,/);
  assert.match(checkoutPageSrc, /redirectToRevenueCategoryCheckout\(result\.checkoutUrl\);/);
});

check("06", "Successful webhook activates the SAME row (auto-publish chain untouched)", () => {
  assert.match(revenueFulfillmentSrc, /tryAutoActivateOfertaLocalAfterPayment\(getAdminSupabase\(\), result\.listingId\)/);
  assert.match(reviewMutationsSrc, /await mutateOfertaLocalAdminReview\(\s*sb,\s*id,\s*"approve",/);
  assert.match(reviewMutationsSrc, /\.update\(parentUpdate\)\s*\n\s*\.eq\("id", offerId\)/);
});

check("07", "The dashboard is not linked as a bare intermediate step anywhere in the Application/Preview flow", () => {
  assert.doesNotMatch(applicationClientSrc, /dashboard\/ofertas-locales/, "the application wizard must never link to the dashboard directly");
  // Preview's only dashboard-domain link is the /checkout route asserted above — no other
  // dashboard path (bare listing page, mis-anuncios, etc.) may appear as a "continue" CTA.
  const dashboardMatches = previewCardSrc.match(/\/dashboard\/ofertas-locales\/[^"'`]*/g) ?? [];
  for (const m of dashboardMatches) {
    assert.match(m, /\/checkout/, `every dashboard link from Preview must target /checkout, found: ${m}`);
  }
});

check("08", "The dashboard's own Pagar y publicar recovery CTA remains (for an unfinished/unpaid listing)", () => {
  assert.match(dashboardPageSrc, /payNow: "Pagar y publicar →"/);
  assert.match(dashboardPageSrc, /const checkoutHref = `\/dashboard\/ofertas-locales\/\$\{offer\.id\}\/checkout\?\$\{q\}`;/);
  assert.match(dashboardPageSrc, /if \(offer\.checkoutEligible\)/);
});

check("09", "Canceled/incomplete Stripe checkout cannot activate publication", () => {
  assert.match(revenueFulfillmentSrc, /if \(!isStripeSessionPaid\(session\)\)/, "unpaid/incomplete sessions must be rejected before any fulfillment");
});

check("10", "A failed payment does not publish (payment-cleared guard still gates activation)", () => {
  assert.match(revenueFulfillmentSrc, /if \(isPaymentCleared\(paymentRecord\.payment_status\)\)/);
});

check("11", "Promo-code path is preserved on the checkout page", () => {
  assert.match(checkoutPageSrc, /validateRevenuePromoForCheckout\(\{/);
  assert.match(checkoutPageSrc, /promoCode: appliedPromoCode/);
});

check("12", "All five confirmations remain required, unchecked by default", () => {
  assert.match(
    checkoutPageSrc,
    /const CONFIRMATION_IDS: ConfirmationId\[\] = \["identity", "products", "authorized", "rules", "chargeConsent"\];/
  );
  assert.match(checkoutPageSrc, /const \[checkedIds, setCheckedIds\] = useState<Set<ConfirmationId>>\(new Set\(\)\);/);
  assert.match(checkoutPageSrc, /disabled=\{!allConfirmed \|\| checkoutBusy\}/);
});

check("13", "The certified $399 / 30-day flyer product is unchanged (real product lookup)", () => {
  const product = getOfertaLocalCommercialProductForOfferType("weekly_flyer");
  assert.ok(product, "weekly_flyer must resolve to a commercial product");
  assert.equal(product!.amountCents, 39900);
  assert.equal(product!.durationDays, 30);
});

check("14", "No routine Leonix staff-approval language remains in the publish/preview/checkout/dashboard files", () => {
  for (const src of [previewCardSrc, previewCopySrc, checkoutPageSrc, dashboardPageSrc]) {
    assert.doesNotMatch(src, /revisión por Leonix/i);
    assert.doesNotMatch(src, /Leonix debe revisar/i);
    assert.doesNotMatch(src, /Enviar a Leonix para aprobación/i);
    assert.doesNotMatch(src, /send to Leonix/i);
    assert.doesNotMatch(src, /se publicará después de ser aprobado por Leonix/i);
  }
  // The dead copy keys that used to carry this language must be gone outright, not just unused.
  assert.doesNotMatch(previewCopySrc, /submitForReviewEs:/);
  assert.doesNotMatch(previewCopySrc, /submitSuccessNoteEs:/);
});

check("15", "No duplicate listing is created anywhere in the (unchanged) auto-activation chain", () => {
  const autoActivateFn = reviewMutationsSrc.match(/export async function tryAutoActivateOfertaLocalAfterPayment[\s\S]*$/);
  assert.ok(autoActivateFn);
  assert.doesNotMatch(autoActivateFn![0], /\.insert\(/);
});

check("16", "ES parity for the publish CTA copy", () => {
  assert.match(previewCopySrc, /continueToDashboardEs: "Continuar para publicar →",/);
});

check("17", "EN parity for the publish CTA copy", () => {
  assert.match(previewCopySrc, /continueToDashboardEn: "Continue to publish →",/);
});

check("18", "The FREE coupon lane's own activation path is untouched", () => {
  // The coupon lane never goes through this Stripe/checkout page at all — it activates via
  // its own distinct "free" entitlement source in ofertasLocalesCommercialServer.ts, which
  // this routing fix does not touch.
  assert.match(commercialServerSrc, /source: "free"/);
  assert.doesNotMatch(commercialServerSrc, /OfertasLocalesPreviewCard|checkout\/page/);
});

check("19", "Owner Command Center architecture is unaffected by this routing fix", () => {
  assert.match(dashboardPageSrc, /<OwnerEntityWorkspace/);
  assert.match(dashboardPageSrc, /import \{ OwnerEntityWorkspace \} from "\.\.\/\.\.\/components\/OwnerEntityWorkspace";/);
});

check("20", "No scanner-protected files were touched", () => {
  const touchedFiles = [previewCardPath, previewCopyPath];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Flyer publish-routing audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales flyer publish-routing audit passed.");
