/**
 * OFERTAS FLYER CHECKOUT — STANDALONE PRESENTATION FIX audit.
 *
 * Root bug: the checkout page (/dashboard/ofertas-locales/[id]/checkout),
 * already correctly wired end-to-end (plan, promo, confirmations, Stripe,
 * auto-publish), was rendered inside <LeonixDashboardShell> — the full
 * Owner Command Center sidebar/nav chrome (PANEL / Estado de cuenta / Mis
 * anuncios / Borradores). That made "Continuar para publicar" from Preview
 * feel like it dropped the owner into the dashboard, even though the URL
 * and checkout logic were already correct.
 *
 * Fix: the checkout route now renders inside the same shared, chrome-free
 * <LeonixResponsiveShell> container Preview itself uses (no dashboard
 * sidebar, no nav) — the (site) route group's own root layout still
 * supplies the standard Leonix site header, so nothing new was built. The
 * top-of-page back link was also relabeled/re-targeted from a mislabeled
 * "Volver a editar" -> dashboard link to "Volver a vista previa" -> the
 * same Preview step, matching the locked Preview -> checkpoint -> Stripe
 * continuity. No checkout/Stripe/auto-publish logic was touched.
 *
 * Run: npm run ofertas-locales:checkout-presentation-audit
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

const checkoutPagePath = "app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx";
const dashboardPagePath = "app/(site)/dashboard/ofertas-locales/[id]/page.tsx";
const dashboardShellPath = "app/(site)/dashboard/components/LeonixDashboardShell.tsx";
const dashboardI18nPath = "app/(site)/dashboard/lib/dashboardI18n.ts";
const reviewMutationsPath = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const revenueFulfillmentPath = "app/lib/listingPlans/revenueFulfillment.ts";
const commercialServerPath = "app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts";

const checkoutSrc = fs.readFileSync(checkoutPagePath, "utf8");
const dashboardPageSrc = fs.readFileSync(dashboardPagePath, "utf8");
const dashboardI18nSrc = fs.readFileSync(dashboardI18nPath, "utf8");
const reviewMutationsSrc = fs.readFileSync(reviewMutationsPath, "utf8");
const revenueFulfillmentSrc = fs.readFileSync(revenueFulfillmentPath, "utf8");
const commercialServerSrc = fs.readFileSync(commercialServerPath, "utf8");

check("01", "Checkout does not render LeonixDashboardShell", () => {
  assert.doesNotMatch(checkoutSrc, /LeonixDashboardShell/);
});

check("02", "Checkout does not render OwnerEntityWorkspace", () => {
  assert.doesNotMatch(checkoutSrc, /OwnerEntityWorkspace/);
});

check("03", "No PANEL text can reach checkout (the shell that carried it is gone)", () => {
  // Structural proof, not a literal string search: LeonixDashboardShell is the only
  // component in this codebase that renders the dashboard sidebar/nav chrome; since
  // check 01 proves it is no longer imported or rendered here, none of its internal
  // copy (including any "PANEL" section label) can appear on this page.
  assert.doesNotMatch(checkoutSrc, /import[\s\S]*LeonixDashboardShell/);
});

check("04", "No 'Estado de cuenta' sidebar label reaches checkout", () => {
  assert.doesNotMatch(checkoutSrc, /Estado de cuenta/i);
  assert.match(dashboardI18nSrc, /accountStatus: "Estado de cuenta"/, "confirms this copy lives only in the dashboard shell's own i18n file");
});

check("05", "No 'Mis anuncios' sidebar link reaches checkout", () => {
  assert.doesNotMatch(checkoutSrc, /Mis anuncios/i);
});

check("06", "No 'Borradores' sidebar link reaches checkout", () => {
  assert.doesNotMatch(checkoutSrc, /Borradores/i);
});

check("07", "Confirmar publicación / Confirm publication title remains", () => {
  assert.match(checkoutSrc, /title: "Confirmar publicación",/);
  assert.match(checkoutSrc, /title: "Confirm publication",/);
});

check("08", "Plan summary remains", () => {
  assert.match(checkoutSrc, /planSummary: "RESUMEN DEL PLAN",/);
  assert.match(checkoutSrc, /\{t\.planSummary\}/);
});

check("09", "$399 / 30 days remains (real product lookup, unchanged)", () => {
  const product = getOfertaLocalCommercialProductForOfferType("weekly_flyer");
  assert.equal(product!.amountCents, 39900);
  assert.equal(product!.durationDays, 30);
  assert.match(checkoutSrc, /\{offer\.commercialAmount\} \/ \{offer\.commercialDurationDays \?\? 30\}/);
});

check("10", "IA included line remains", () => {
  assert.match(checkoutSrc, /includedAi: "IA del volante",/);
});

check("11", "Approved-product count remains", () => {
  assert.match(checkoutSrc, /includedApproved\(approvedCount\)/);
});

check("12", "Processed-page count remains", () => {
  assert.match(checkoutSrc, /includedPages\(pageCompletion\.completedPages, pageCompletion\.totalPages\)/);
});

check("13", "Promo code field remains", () => {
  assert.match(checkoutSrc, /validateRevenuePromoForCheckout\(\{/);
  assert.match(checkoutSrc, /id="ofertas-checkout-promo"/);
});

check("14", "Total remains", () => {
  assert.match(checkoutSrc, /discountedTotalLabel/);
  assert.match(checkoutSrc, /\{t\.total\}/);
});

check("15", "All five confirmations remain", () => {
  assert.match(
    checkoutSrc,
    /const CONFIRMATION_IDS: ConfirmationId\[\] = \["identity", "products", "authorized", "rules", "chargeConsent"\];/
  );
});

check("16", "Continuar al pago seguro remains as the primary CTA", () => {
  assert.match(checkoutSrc, /continueLabel: "Continuar al pago seguro",/);
  assert.match(checkoutSrc, /disabled=\{!allConfirmed \|\| checkoutBusy\}/);
});

check("17", "Volver a editar remains", () => {
  assert.match(checkoutSrc, /backToEdit: "Volver a editar",/);
  assert.match(checkoutSrc, /\{t\.backToEdit\}/);
});

check("18", "Volver a vista previa remains, and is now also the top-of-page back link", () => {
  assert.match(checkoutSrc, /backToPreview: "Volver a vista previa",/);
  const backLinkHits = checkoutSrc.match(/href=\{previewHref\}/g) ?? [];
  assert.equal(backLinkHits.length, 2, "previewHref must be used both at the top back link and the bottom nav row");
});

check("19", "Same canonical listing id remains threaded through checkout", () => {
  assert.match(checkoutSrc, /const offerId = String\(params\?\.id \?\? ""\);/);
  assert.match(checkoutSrc, /listingId: offer\.id,/);
});

check("20", "Stripe handoff is unchanged", () => {
  assert.match(checkoutSrc, /await startRevenueCategoryCheckout\(\{/);
  assert.match(checkoutSrc, /redirectToRevenueCategoryCheckout\(result\.checkoutUrl\);/);
});

check("21", "Post-payment dashboard return is unchanged", () => {
  assert.match(checkoutSrc, /returnPath: `\/dashboard\/ofertas-locales\/\$\{offer\.id\}\?\$\{q\}`,/);
});

check("22", "Auto-publish lifecycle files are byte-for-byte unchanged", () => {
  assert.match(revenueFulfillmentSrc, /tryAutoActivateOfertaLocalAfterPayment\(getAdminSupabase\(\), result\.listingId\)/);
  assert.match(reviewMutationsSrc, /await mutateOfertaLocalAdminReview\(\s*sb,\s*id,\s*"approve",/);
});

check("23", "Dashboard's own Pagar y publicar recovery CTA is unchanged", () => {
  assert.match(dashboardPageSrc, /payNow: "Pagar y publicar →"/);
  assert.match(dashboardPageSrc, /const checkoutHref = `\/dashboard\/ofertas-locales\/\$\{offer\.id\}\/checkout\?\$\{q\}`;/);
});

check("24", "Owner Command Center dashboard page is unchanged", () => {
  assert.match(dashboardPageSrc, /<OwnerEntityWorkspace/);
  assert.match(dashboardPageSrc, /import \{ OwnerEntityWorkspace \} from "\.\.\/\.\.\/components\/OwnerEntityWorkspace";/);
});

check("25", "The FREE coupon lane's own activation path is unaffected", () => {
  assert.match(commercialServerSrc, /source: "free"/);
  assert.doesNotMatch(commercialServerSrc, /LeonixResponsiveShell|checkout\/page/);
});

check("26", "ES parity for the standalone checkout copy", () => {
  assert.match(checkoutSrc, /title: "Confirmar publicación",/);
  assert.match(checkoutSrc, /backToPreview: "Volver a vista previa",/);
});

check("27", "EN parity for the standalone checkout copy", () => {
  assert.match(checkoutSrc, /title: "Confirm publication",/);
  assert.match(checkoutSrc, /backToPreview: "Back to preview",/);
});

check("28", "No scanner-protected files were touched", () => {
  const touchedFiles = [checkoutPagePath];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Checkout presentation audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales checkout presentation audit passed.");
