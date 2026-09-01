/**
 * OWNER DASHBOARD + CHECKOUT HANDOFF audit.
 *
 * Verifies: the dashboard no longer shows a false "scan needs attention"
 * status once item review is complete; the 127-form wall is replaced by a
 * compact, paginated product summary that deep-links into the existing
 * publish-wizard workbench; the "Analizar" CTA is hidden once analysis is
 * complete; premature renewal controls are hidden pre-first-publication;
 * a clear first-publication card routes to a dedicated checkout page with
 * the 5 exact confirmation checkboxes and no routine-approval language;
 * and the payment webhook auto-publishes the SAME listing id with no
 * duplicate row and the standard 30-day term.
 *
 * Run: npm run ofertas-locales:owner-dashboard-checkout-audit
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

const pagePath = "app/(site)/dashboard/ofertas-locales/[id]/page.tsx";
const manageSectionPath = "app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx";
const checkoutPath = "app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx";
const renewalsPath = "app/lib/ofertas-locales/ofertasLocalesRenewals.ts";
const reviewMutationsPath = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const revenueFulfillmentPath = "app/lib/listingPlans/revenueFulfillment.ts";
const runtimePath = "app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts";

const pageSrc = fs.readFileSync(pagePath, "utf8");
const manageSrc = fs.readFileSync(manageSectionPath, "utf8");
const checkoutSrc = fs.readFileSync(checkoutPath, "utf8");
const renewalsSrc = fs.readFileSync(renewalsPath, "utf8");
const reviewMutationsSrc = fs.readFileSync(reviewMutationsPath, "utf8");
const revenueFulfillmentSrc = fs.readFileSync(revenueFulfillmentPath, "utf8");
const runtimeSrc = fs.readFileSync(runtimePath, "utf8");

check("01", "Completed 127/8 listing does NOT show the scan-attention warning as primary status", () => {
  assert.match(
    pageSrc,
    /reviewCompleteBannerActive \? t\.reviewCompleteTitle : offer\.displayStatus/,
    "the status badge must be overridden when review is complete"
  );
  assert.match(
    pageSrc,
    /reviewCompleteBannerActive && reviewSummary\s*\n\s*\? t\.reviewCompleteBody\(/,
    "the status message box must be overridden when review is complete"
  );
});

check("02", "Shows N approved products in the review-complete banner", () => {
  assert.match(pageSrc, /reviewCompleteBody\(reviewSummary\.approvedCount, reviewSummary\.completedPages, reviewSummary\.totalPages\)/);
  assert.match(pageSrc, /reviewCompleteBody: \(approved: number, pages: number, totalPages: number\) =>/);
  assert.match(pageSrc, /\$\{approved\} productos aprobados/);
});

check("03", "Shows X de Y páginas completas in the review-complete banner", () => {
  assert.match(pageSrc, /\$\{pages\} de \$\{totalPages\} páginas completas/);
  assert.match(pageSrc, /\$\{pages\} of \$\{totalPages\} pages complete/);
  assert.match(runtimeSrc, /export function summarizeOfertaLocalPageCompletion\(/);
});

check("04", "Raw internal scan/payment/entitlement enums are not rendered to the owner", () => {
  // Command-center architecture: detailItems only ever carries translated labels
  // (paymentLabel/entitlementLabel), never the raw offer.* enum values directly.
  assert.doesNotMatch(pageSrc, /value: offer\.paymentStatus[,}]/);
  assert.doesNotMatch(pageSrc, /value: offer\.entitlementStatus[,}]/);
  assert.doesNotMatch(pageSrc, /\{offer\.commercialEligibilitySource\}/);
  assert.doesNotMatch(pageSrc, /\{offer\.assetLifecycleStatus\}/);
  assert.doesNotMatch(pageSrc, /blockingReasons\.join/);
  assert.doesNotMatch(pageSrc, /"TRUE" : "FALSE"/);
  assert.match(pageSrc, /function paymentLabel\(status: string, lang: Lang\): string \{/);
  assert.match(pageSrc, /function entitlementLabel\(status: string, lang: Lang\): string \{/);
  assert.match(pageSrc, /value: `\$\{paymentLabel\(offer\.paymentStatus, lang\)\}/);
  assert.match(pageSrc, /value: entitlementLabel\(offer\.entitlementStatus, lang\)/);
});

check("05", "The 127-item review-form wall is no longer rendered in the dashboard", () => {
  assert.doesNotMatch(manageSrc, /OfertasLocalesAiItemReviewPanel/);
  assert.doesNotMatch(manageSrc, /variant="grid"/);
});

check("06", "A compact product summary exists (two cards, review counts)", () => {
  assert.match(manageSrc, /function ProductSummaryCard/);
  assert.match(manageSrc, /grid gap-3 sm:grid-cols-2/);
  assert.match(manageSrc, /t\.summaryLine\(counts\.approved, items\.length\)/);
});

check("07", "The product summary supports prev/next navigation without loading all items as forms", () => {
  assert.match(manageSrc, /setPageOffset\(\(p\) => Math\.max\(0, p - ITEMS_PER_PAGE\)\)/);
  assert.match(manageSrc, /setPageOffset\(\(p\) => p \+ ITEMS_PER_PAGE\)/);
  assert.match(manageSrc, /const ITEMS_PER_PAGE = 2;/);
  assert.match(manageSrc, /rangeLabel/);
});

check("08", "Gestionar productos routes into the existing publish-wizard review workbench (no second review system)", () => {
  assert.match(
    manageSrc,
    /withClasificadosPublishLang\("\/publicar\/ofertas-locales", lang, \{\s*id: offerId,\s*step: 5,\s*review: 1,\s*intent: "continue",\s*\}\)/
  );
  assert.match(manageSrc, /href=\{manageHref\}/);
});

check("09", "The rescan CTA is hidden once analysis is complete (shows a completion message instead)", () => {
  assert.match(manageSrc, /reviewComplete \? \(/);
  assert.match(manageSrc, /t\.analysisComplete\}[\s\S]*?t\.productsFound\(items\.length\)/);
  assert.match(manageSrc, /: canScan \? \(/);
});

check("10", "Premature renewal controls are hidden before first publication", () => {
  assert.match(
    pageSrc,
    /\{offer\.publishedAt \? <OfertasLocalesOwnerRenewalActionCenter offer=\{offer\} lang=\{lang\} \/> : null\}/,
    "the command-center campaign-tools slot must gate the renewal center on publishedAt"
  );
  assert.match(
    renewalsSrc,
    /if \(!input\.parent\.published_at\) \{\s*return \{ code: "blocked_status"/,
    "resolveOfertaLocalRenewalEligibility must block renewal for a never-published listing"
  );
});

check("11", "A clear first-publication card exists (PUBLICAR ESTA OFERTA / PUBLISH THIS DEAL)", () => {
  assert.match(pageSrc, /publishCardTitle: "PUBLICAR ESTA OFERTA"/);
  assert.match(pageSrc, /publishCardTitle: "PUBLISH THIS DEAL"/);
  assert.match(pageSrc, /\{offer\.checkoutEligible && offer\.canEdit \? \(/);
});

check("12", "Price is $399 / 30 days (real product lookup, not a hardcoded UI string)", () => {
  const product = getOfertaLocalCommercialProductForOfferType("weekly_flyer");
  assert.ok(product, "weekly_flyer must resolve to a commercial product");
  assert.equal(product!.amountCents, 39900, "flyer product must be $399.00");
  assert.equal(product!.durationDays, 30, "flyer product must run 30 days");
  assert.match(pageSrc, /publishCardPerDays\(offer\.commercialDurationDays \?\? 30\)/);
});

check("13", "IA / searchable-products-included is shown on the publish card", () => {
  assert.match(pageSrc, /publishCardIncluded: "IA y productos buscables incluidos"/);
  assert.match(pageSrc, /publishCardIncluded: "AI and searchable products included"/);
});

check("14", "Volver a editar / Back to edit exists", () => {
  assert.match(pageSrc, /backToEdit: "Volver a editar"/);
  assert.match(checkoutSrc, /backToEdit: "Volver a editar"/);
});

check("15", "Ver vista previa / View preview exists and deep-links into the existing wizard preview step", () => {
  assert.match(pageSrc, /viewPreview: "Ver vista previa"/);
  assert.match(pageSrc, /step: offer\.offerType === "weekly_flyer" \? 7 : 6/);
  assert.match(checkoutSrc, /backToPreview: "Volver a vista previa"/);
});

check("16", "Pagar y publicar routes to the dedicated checkout page (not directly to Stripe)", () => {
  assert.match(pageSrc, /payNow: "Pagar y publicar →"/);
  assert.match(pageSrc, /const checkoutHref = `\/dashboard\/ofertas-locales\/\$\{offer\.id\}\/checkout\?\$\{q\}`;/);
  // Both the command-center primaryAction and the rich publish card must route
  // through checkoutHref — never call Stripe checkout directly from the dashboard.
  assert.match(pageSrc, /primaryAction = \{ href: checkoutHref, label: t\.payNow \};/);
  assert.match(pageSrc, /href=\{checkoutHref\}/);
  assert.doesNotMatch(pageSrc, /startRevenueCategoryCheckout/);
  assert.doesNotMatch(pageSrc, /redirectToRevenueCategoryCheckout/);
});

check("17", "Checkout page shows RESUMEN DEL PLAN / plan summary", () => {
  assert.match(checkoutSrc, /planSummary: "RESUMEN DEL PLAN"/);
  assert.match(checkoutSrc, /\{t\.planSummary\}/);
});

check("18", "Checkout page has a real promo-code field wired to server validation", () => {
  assert.match(checkoutSrc, /promoTitle: "Código promocional"/);
  assert.match(checkoutSrc, /validateRevenuePromoForCheckout\(\{/);
  assert.match(checkoutSrc, /promoCode: appliedPromoCode/);
});

check("19", "Checkout total reflects the real $399 product price", () => {
  const product = getOfertaLocalCommercialProductForOfferType("weekly_flyer");
  assert.equal(product!.amountCents, 39900);
  assert.match(checkoutSrc, /\{t\.total\}/);
  assert.match(checkoutSrc, /discountedTotalLabel/);
});

check("20", "All 5 confirmations are required before checkout proceeds", () => {
  assert.match(
    checkoutSrc,
    /const CONFIRMATION_IDS: ConfirmationId\[\] = \["identity", "products", "authorized", "rules", "chargeConsent"\];/
  );
  assert.match(checkoutSrc, /const allConfirmed = CONFIRMATION_IDS\.every\(\(id\) => checkedIds\.has\(id\)\);/);
  assert.match(checkoutSrc, /disabled=\{!allConfirmed \|\| checkoutBusy\}/);
  assert.match(checkoutSrc, /confirmCharge:\s*\n\s*"Entiendo y autorizo el cobro de \$399/);
});

check("21", "No routine Leonix staff-approval language remains", () => {
  for (const src of [pageSrc, checkoutSrc, manageSrc]) {
    assert.doesNotMatch(src, /revisión por Leonix/i);
    assert.doesNotMatch(src, /Leonix debe revisar/i);
    assert.doesNotMatch(src, /los 30 días empiezan cuando Leonix la aprueba/i);
  }
});

check("22", "No 'send to Leonix for approval' CTA remains", () => {
  for (const src of [pageSrc, checkoutSrc, manageSrc]) {
    assert.doesNotMatch(src, /Enviar a Leonix para aprobación/i);
    assert.doesNotMatch(src, /send to Leonix/i);
  }
});

check("23", "No 'payment does not publish' language remains", () => {
  for (const src of [pageSrc, checkoutSrc]) {
    assert.doesNotMatch(src, /El pago no publica/i);
    assert.doesNotMatch(src, /Payment does not publish/i);
  }
});

check("24", "Successful payment activates the SAME listing id (reuses the existing admin-approve mutation, scoped by id)", () => {
  assert.match(
    revenueFulfillmentSrc,
    /tryAutoActivateOfertaLocalAfterPayment\(getAdminSupabase\(\), result\.listingId\)/,
    "the auto-activation call must use the entitlement fulfillment's own listingId"
  );
  assert.match(
    reviewMutationsSrc,
    /await mutateOfertaLocalAdminReview\(\s*sb,\s*id,\s*"approve",/,
    "auto-activation must call the same approve mutation the admin UI uses"
  );
  assert.match(reviewMutationsSrc, /\.update\(parentUpdate\)\s*\n\s*\.eq\("id", offerId\)/, "the approve mutation must update by id");
});

check("25", "No duplicate listing row is created by auto-activation", () => {
  const autoActivateFn = reviewMutationsSrc.match(
    /export async function tryAutoActivateOfertaLocalAfterPayment[\s\S]*$/
  );
  assert.ok(autoActivateFn, "tryAutoActivateOfertaLocalAfterPayment must exist");
  assert.doesNotMatch(autoActivateFn![0], /\.insert\(/, "auto-activation must never insert a new ofertas_locales row");
});

check("26", "The standard 30-day activation semantics are preserved on auto-publish", () => {
  assert.match(reviewMutationsSrc, /parentUpdate\.published_at = now;/);
  assert.match(reviewMutationsSrc, /parentUpdate\.expires_at = calculateOfertaLocalPublicTermExpiresAt\(now\);/);
});

check("27", "ES parity for all new owner-facing copy", () => {
  const esKeys = [
    "reviewCompleteTitle",
    "publishCardTitle",
    "publishCardIncluded",
    "publishCardTermNote",
    "backToEdit",
    "viewPreview",
    "paidBadge",
  ];
  for (const key of esKeys) {
    assert.match(pageSrc, new RegExp(`${key}:`), `page.tsx must define ES copy for ${key}`);
  }
  assert.match(checkoutSrc, /confirmIdentity: "Confirmo que la información del negocio/);
  assert.match(manageSrc, /productsTitle: "PRODUCTOS DEL VOLANTE"/);
});

check("28", "EN parity for all new owner-facing copy", () => {
  assert.match(checkoutSrc, /confirmIdentity: "I confirm the business, contact, flyer/);
  assert.match(manageSrc, /productsTitle: "FLYER PRODUCTS"/);
  assert.match(pageSrc, /reviewCompleteTitle: "✅ Product review complete"/);
});

check("29", "Mobile dashboard layout is reasonable (no desktop-only hidden classes on new sections)", () => {
  assert.doesNotMatch(manageSrc, /\bhidden\b(?!-)/);
  assert.doesNotMatch(checkoutSrc, /\bhidden\b(?!-)/);
});

check("30", "Desktop dashboard layout shows two product cards side by side", () => {
  assert.match(manageSrc, /sm:grid-cols-2/);
});

check("31", "No scanner-protected files were touched", () => {
  const touchedFiles = [
    pagePath,
    manageSectionPath,
    checkoutPath,
    renewalsPath,
    reviewMutationsPath,
    revenueFulfillmentPath,
    runtimePath,
    "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts",
    "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
    "app/lib/listingPlans/revenueAuditLog.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

check("32", "The global Owner Command Center architecture is preserved (not reverted to the old bespoke dashboard)", () => {
  assert.match(pageSrc, /import \{ OwnerEntityWorkspace \} from "\.\.\/\.\.\/components\/OwnerEntityWorkspace";/);
  assert.match(pageSrc, /<OwnerEntityWorkspace/);
  assert.match(pageSrc, /detailItems=\{detailItems\}/);
  assert.match(pageSrc, /performance=\{performance\}/);
  assert.match(pageSrc, /primaryAction=\{primaryAction\}/);
  assert.match(pageSrc, /quickActions=\{quickActions\}/);
  assert.match(pageSrc, /specialized=\{\{/);
  assert.match(pageSrc, /getOwnerEntityCapabilities\("ofertas-locales"\)/);
  assert.match(pageSrc, /offerLaneBadge\(offer\.offerType, lang\)/, "lane badges must still be derived and passed through");
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Owner dashboard + checkout audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales owner dashboard + checkout audit passed.");
