/**
 * WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01 verification.
 * Static assertions only — no live Supabase/Stripe.
 * Run: npm run verify:website-launch-25-checkout-wiring
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-website-launch-25-checkout-wiring: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const redemptions = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const validationLib = "app/lib/listingPlans/revenuePromoValidation.ts";
const checkoutRoute = "app/api/revenue-os/checkout/route.ts";
const paymentRecords = "app/lib/listingPlans/revenuePaymentRecords.ts";
const promoField = "app/(site)/clasificados/components/RevenuePromoField.tsx";
const rentas = "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx";
const empleosModal = "app/(site)/publicar/empleos/shared/publish/EmpleosPublishConfirmModal.tsx";
const empleosCheckout = "app/(site)/publicar/empleos/shared/publish/empleosRevenueCheckout.ts";
const empleosQuick = "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx";
const empleosPremium = "app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx";
const empleosQuickPreview = "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx";
const empleosPremiumPreview = "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx";
const autosPrivadoPreview = "app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx";
const autosConfirmCore = "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx";
const restaurantesPreview = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const bienesAgentPreview =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const doc = "docs/newsletter-promo-code-readiness.md";
const docPromoUi = "docs/publish-checkout-promo-validation-ui-01.md";
const docStripe = "docs/stripe-revenue-os-category-checkout-wiring-01.md";
const docPricing = "docs/pricing-promo-code-sales-model.md";
const pkg = "package.json";

for (const rel of [
  redemptions,
  validationLib,
  checkoutRoute,
  paymentRecords,
  promoField,
  rentas,
  empleosModal,
  empleosCheckout,
  empleosQuick,
  empleosPremium,
  empleosQuickPreview,
  empleosPremiumPreview,
  autosPrivadoPreview,
  autosConfirmCore,
  restaurantesPreview,
  bienesAgentPreview,
  doc,
  docPromoUi,
  docStripe,
  docPricing,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const redemptionsSrc = read(redemptions);
const validationSrc = read(validationLib);
const checkoutSrc = read(checkoutRoute);
const paymentSrc = read(paymentRecords);
const fieldSrc = read(promoField);
const rentasSrc = read(rentas);
const empleosModalSrc = read(empleosModal);
const empleosCheckoutSrc = read(empleosCheckout);
const empleosQuickSrc = read(empleosQuick);
const empleosPremiumSrc = read(empleosPremium);
const docSrc = read(doc);
const pkgSrc = read(pkg);

// website_launch_25 metadata support + allowlist
if (!redemptionsSrc.includes("website_launch_25")) fail("Redemptions must recognize website_launch_25 family");
if (!redemptionsSrc.includes("WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS")) {
  fail("Redemptions must define the allowlisted package keys");
}
const LAUNCH_25_READY_PACKAGE_KEYS = [
  "rentas_30d",
  "empleos_job_post_paid",
  "autos_privado_30d",
  "restaurantes_base_monthly",
  "servicios_base_monthly",
];
for (const key of LAUNCH_25_READY_PACKAGE_KEYS) {
  if (!redemptionsSrc.includes(key)) fail(`Allowlist missing package key: ${key}`);
}
// Ineligible / not-ready keys must never appear in the Launch 25 allowlist.
const LAUNCH_25_FORBIDDEN_ALLOWLIST_KEYS = [
  "br_agent_monthly",
  "br_fsbo_45d",
  "br_inventory_pack_monthly",
  "autos_dealer_monthly",
  "autos_dealer_inventory_pack_monthly",
  "restaurantes_offers_addon",
  "servicios_offers_addon",
  "clases_paid_30d",
  "clases_free",
  "comunidad_free",
  "en_venta_free_v1",
  "empleos_job_fair_free",
  "viajes_business_monthly",
  "mascotas_free",
  "busco_free",
];
for (const key of LAUNCH_25_FORBIDDEN_ALLOWLIST_KEYS) {
  if (new RegExp(`["']${key}["']`).test(redemptionsSrc.match(/WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS[\s\S]*?];/)?.[0] ?? "")) {
    fail(`Allowlist must not include ineligible package key: ${key}`);
  }
}
if (!redemptionsSrc.includes("isWebsiteLaunch25Promo") || !redemptionsSrc.includes("resolveWebsiteLaunch25Rejection")) {
  fail("Redemptions must expose Launch 25 detection + rejection helpers");
}
ok("website_launch_25 metadata support + allowlist present");

// Enforcement in both validation surfaces
if (!validationSrc.includes("resolveWebsiteLaunch25Rejection")) {
  fail("Preview validation must enforce Launch 25 allowlist");
}
if (!redemptionsSrc.includes("resolveWebsiteLaunch25Rejection(row, input.packageDef.packageKey)")) {
  fail("Checkout resolution must enforce Launch 25 allowlist");
}
ok("Launch 25 allowlist enforced in preview + checkout validation");

// Server-owned discount only (no inference from code text)
if (!redemptionsSrc.includes("resolvePromoPercentOff") || !redemptionsSrc.includes("resolveRevenuePromoTypeFromRow")) {
  fail("Discount must resolve from server-owned columns/metadata");
}
if (/percent.*=.*25\b/.test(redemptionsSrc) && !redemptionsSrc.includes("percent_off")) {
  fail("Discount must not be inferred from code text");
}
ok("discount resolves from server-owned fields only");

// Checkout server revalidation + metadata + webhook-only redemption
if (!checkoutSrc.includes("resolvePromoForCheckout")) fail("Checkout must revalidate promo server-side");
if (!checkoutSrc.includes("finalAmountCents")) fail("Checkout must use server final amount");
if (!checkoutSrc.includes("promoFamilyForRecord") || !checkoutSrc.includes("promoWebsiteCheckoutOnly")) {
  fail("Checkout must forward promo family / website-checkout-only to payment record");
}
if (checkoutSrc.includes("markPromoRedemptionRedeemed")) {
  fail("Checkout route must not redeem on session creation (webhook-only)");
}
if (!paymentSrc.includes("promo_family") || !paymentSrc.includes("website_checkout_only")) {
  fail("Payment record must persist promo_family + website_checkout_only");
}
if (!paymentSrc.includes("base_amount_cents") || !paymentSrc.includes("final_amount_cents")) {
  fail("Payment record must persist base/final amount cents");
}
ok("checkout revalidation + honest metadata + webhook-only redemption preserved");

// Shared promo field copy + calm error
for (const s of ["Código promocional", "Promo code", "Este código no aplica a este pago.", "This code does not apply to this checkout."]) {
  if (!fieldSrc.includes(s)) fail(`Shared promo field missing copy: ${s}`);
}
// Strip comments so the negative check only inspects user-facing code, not the doctrine header.
const fieldSrcNoComments = fieldSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
if (fieldSrcNoComments.match(/placement|ranking|verified|verification/i)) {
  fail("Promo field must not promise placement/ranking/verification");
}
ok("shared promo field copy present, no placement/ranking claims");

// Category surfaces forward promo code via PublishCheckoutCheckpoint (central Revenue OS pattern)
if (!rentasSrc.includes("PublishCheckoutCheckpoint") || !rentasSrc.includes("onPromoApply")) {
  fail("Rentas privado must use PublishCheckoutCheckpoint with server promo validation");
}
if (!rentasSrc.includes("promoCode: ctx.promoCode") || !rentasSrc.includes("startRevenueCategoryCheckout")) {
  fail("Rentas privado must forward promo code into central Revenue OS checkout");
}
const empleosQuickPreviewSrc = read(empleosQuickPreview);
const empleosPremiumPreviewSrc = read(empleosPremiumPreview);
for (const [name, src] of [
  ["Empleos quick preview", empleosQuickPreviewSrc],
  ["Empleos premium preview", empleosPremiumPreviewSrc],
]) {
  if (!src.includes("PublishCheckoutCheckpoint") || !src.includes("onPromoApply")) {
    fail(`${name} must use PublishCheckoutCheckpoint with server promo validation`);
  }
  if (!src.includes("promoCode: ctx.promoCode")) {
    fail(`${name} must forward promo code into checkout`);
  }
  if (!src.includes("saveEmpleosDraftAndStartPaidJobCheckout") && !src.includes("startRevenueCategoryCheckout")) {
    fail(`${name} must call central Revenue OS checkout helper`);
  }
}
if (!empleosCheckoutSrc.includes("promoCode")) fail("Empleos checkout helper must accept promo code");
const autosPrivadoPreviewSrc = read(autosPrivadoPreview);
const autosConfirmCoreSrc = read(autosConfirmCore);
if (!autosPrivadoPreviewSrc.includes("PublishCheckoutCheckpoint") || !autosPrivadoPreviewSrc.includes("onPromoApply")) {
  fail("Autos privado preview must use PublishCheckoutCheckpoint with server promo validation");
}
if (!autosPrivadoPreviewSrc.includes("promoCode: ctx.promoCode") || !autosPrivadoPreviewSrc.includes("startRevenueCategoryCheckout")) {
  fail("Autos privado preview must forward promo code into central Revenue OS checkout");
}
// Autos dealer/negocios legacy checkout must remain untouched by promo field
if (autosConfirmCoreSrc.includes("AUTOS_NEGOCIOS_CHECKOUT_PROMO") || autosConfirmCoreSrc.match(/negocios[^\n]*RevenuePromoField/)) {
  fail("Autos negocio/dealer checkout must not receive promo field");
}
const restaurantesPreviewSrc = read(restaurantesPreview);
if (!restaurantesPreviewSrc.includes("PublishCheckoutCheckpoint") || !restaurantesPreviewSrc.includes("onPromoApply")) {
  fail("Restaurantes preview must use PublishCheckoutCheckpoint with server promo validation");
}
if (!restaurantesPreviewSrc.includes("promoCode: ctx.promoCode") || !restaurantesPreviewSrc.includes("startRevenueCategoryCheckout")) {
  fail("Restaurantes preview must forward promo code into central Revenue OS checkout");
}
// Bienes negocio is NOT Launch 25 ready — promo deferred without onPromoApply forward
const bienesAgentPreviewSrc = read(bienesAgentPreview);
if (bienesAgentPreviewSrc.includes("onPromoApply")) {
  fail("Bienes negocio must not wire Launch 25 promo apply until a future gate");
}
if (new RegExp(`["']br_agent_monthly["']`).test(redemptionsSrc.match(/WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS[\s\S]*?];/)?.[0] ?? "")) {
  fail("Bienes br_agent_monthly must not be in Launch 25 allowlist until promo forward is complete");
}

// Servicios — Revenue OS checkpoint checkout (PublishCheckoutCheckpoint + server validation)
const serviciosPreview = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const serviciosApp = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
for (const rel of [serviciosPreview, serviciosApp]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing Servicios file: ${rel}`);
}
const serviciosPreviewSrc = read(serviciosPreview);
const serviciosAppSrc = read(serviciosApp);
if (!serviciosPreviewSrc.includes("PublishCheckoutCheckpoint") || !serviciosPreviewSrc.includes("onPromoApply")) {
  fail("Servicios preview must use PublishCheckoutCheckpoint with server promo validation");
}
if (!serviciosPreviewSrc.includes("promoCode: ctx.promoCode") || !serviciosPreviewSrc.includes("startRevenueCategoryCheckout")) {
  fail("Servicios preview must forward promo code into central Revenue OS checkout");
}
if (!serviciosPreviewSrc.includes("promoEligible: true")) {
  fail("Servicios preview checkpoint must mark promoEligible");
}
if (!serviciosPreviewSrc.includes("LeonixLaunchCouponCard")) {
  fail("Servicios preview checkout must render LeonixLaunchCouponCard");
}
if (!serviciosPreviewSrc.match(/variant="(mini|compact)"/)) {
  fail("Servicios preview must use mini/compact Launch 25 coupon variant");
}
if (!serviciosPreviewSrc.includes("Usa tu código Leonix Launch 25 si aplica a este pago.")) {
  fail("Servicios preview must show Launch 25 checkout helper copy");
}
if (!serviciosAppSrc.includes("LeonixLaunchCouponCard") || !serviciosAppSrc.includes('variant="mini"')) {
  fail("Servicios paid application form must render LeonixLaunchCouponCard mini variant");
}
if (!serviciosAppSrc.includes("!isExistingDashboardListingMode")) {
  fail("Servicios Launch 25 reminder must exclude dashboard edit mode");
}
if (serviciosPreviewSrc.match(/print discount|combo package|manual contract|free post|guaranteed placement/i)) {
  fail("Servicios checkout must not promise print/combo/manual/free/placement");
}
ok("eligible category surfaces wired; Servicios Revenue OS checkpoint included; dealer/legacy untouched");

// Doc mentions doctrine + final eligibility matrix (LAUNCH-25-PAID-CATEGORY-ELIGIBILITY-AUDIT-01)
const docPromoUiSrc = read(docPromoUi);
const docStripeSrc = read(docStripe);
const docPricingSrc = read(docPricing);
for (const s of ["website checkout only", "webhook"]) {
  if (!docSrc.toLowerCase().includes(s)) fail(`Doc must mention: ${s}`);
}
for (const [name, src] of [
  ["newsletter-promo-code-readiness", docSrc],
  ["publish-checkout-promo-validation-ui-01", docPromoUiSrc],
  ["stripe-revenue-os-category-checkout-wiring-01", docStripeSrc],
  ["pricing-promo-code-sales-model", docPricingSrc],
]) {
  if (!src.includes("LAUNCH-25-PAID-CATEGORY-ELIGIBILITY-AUDIT-01")) {
    fail(`${name} must document LAUNCH-25-PAID-CATEGORY-ELIGIBILITY-AUDIT-01 matrix`);
  }
  for (const key of LAUNCH_25_READY_PACKAGE_KEYS) {
    if (!src.includes(key)) fail(`${name} matrix must list ready package key: ${key}`);
  }
  if (!src.includes("NOT READY") || !src.includes("EXCLUDED")) {
    fail(`${name} matrix must document NOT READY and EXCLUDED categories`);
  }
}
ok("documentation doctrine + eligibility matrix present");

// LAUNCH-25-COUPON-DESIGN-SYSTEM-UNIFICATION-01: one official Launch 25 component family
const officialCard = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const empleosHub = "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx";
const autosBranchCopy = "app/(site)/publicar/autos/autosBranchCopy.ts";
const rentasForm = "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx";
const autosPrivadoApp = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const autosBranchClient = "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx";
const newsletter = "app/(site)/newsletter/NewsletterPageClient.tsx";
for (const rel of [officialCard, empleosHub, autosBranchCopy, rentasForm, autosPrivadoApp, autosBranchClient, newsletter]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing UX file: ${rel}`);
}
const officialCardSrc = read(officialCard);
const empleosHubSrc = read(empleosHub);
const autosBranchSrc = read(autosBranchCopy);
const rentasFormSrc = read(rentasForm);
const autosPrivadoAppSrc = read(autosPrivadoApp);
const autosBranchClientSrc = read(autosBranchClient);
const newsletterSrc = read(newsletter);

// The deprecated separate mini notice must be gone.
if (existsSync(path.join(root, "app/components/leonix/LeonixLaunch25MiniNotice.tsx"))) {
  fail("LeonixLaunch25MiniNotice.tsx must be removed (single source of truth)");
}

// Official component supports the full variant family + centralized copy.
for (const v of ['"public"', '"dashboard"', '"compact"', '"mini"', '"badge"']) {
  if (!officialCardSrc.includes(v)) fail(`Official card must declare variant ${v}`);
}
for (const s of [
  "Obtén tu código Leonix Launch 25",
  "Get your Leonix Launch 25 code",
  "ACEPTA CÓDIGO LEONIX LAUNCH 25",
  "LAUNCH 25 CODE ELIGIBLE",
  "LEONIX LAUNCH CODE",
]) {
  if (!officialCardSrc.includes(s)) fail(`Official card missing centralized copy: ${s}`);
}
const officialNoComments = officialCardSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
if (officialNoComments.match(/guarantee (placement|ranking)/i) === null && !officialNoComments.includes("garantiza")) {
  fail("Official card fine print must keep no-placement/ranking doctrine");
}
ok("official Launch 25 component family present with centralized copy");

// No file may import or render the removed mini notice.
for (const [name, src] of [
  ["rentas form", rentasFormSrc],
  ["empleos quick", empleosQuickSrc],
  ["empleos premium", empleosPremiumSrc],
  ["autos privado form", autosPrivadoAppSrc],
  ["empleos hub", empleosHubSrc],
  ["autos branch client", autosBranchClientSrc],
]) {
  if (src.includes("LeonixLaunch25MiniNotice")) fail(`${name} must not reference the removed mini notice`);
}

// Eligible form reminders render the official card (mini/compact).
for (const [name, src] of [
  ["rentas form", rentasFormSrc],
  ["empleos quick", empleosQuickSrc],
  ["empleos premium", empleosPremiumSrc],
  ["autos privado form", autosPrivadoAppSrc],
]) {
  if (!src.includes("LeonixLaunchCouponCard")) fail(`${name} must render LeonixLaunchCouponCard`);
  if (!src.match(/variant="(mini|compact)"/)) fail(`${name} must use mini/compact coupon variant`);
}

// Newsletter keeps the full public card.
if (!newsletterSrc.includes("LeonixLaunchCouponCard") || !newsletterSrc.includes('variant="public"')) {
  fail("Newsletter must keep the official public coupon card");
}

// Selector cards: Empleos hub uses badge variant; Autos privado form uses mini (checkpoint-first routing).
if (!empleosHubSrc.includes("LeonixLaunchCouponCard") || !empleosHubSrc.includes('variant="badge"')) {
  fail("Empleos paid selector must use the official badge variant");
}
if (!autosPrivadoAppSrc.includes("LeonixLaunchCouponCard") || !autosPrivadoAppSrc.match(/variant="(mini|compact)"/)) {
  fail("Autos privado paid form must use the official mini/compact coupon variant");
}
// No page defines its own Launch 25 marketing copy anymore.
for (const [name, src] of [
  ["empleos hub", empleosHubSrc],
  ["autos branch copy", autosBranchSrc],
]) {
  if (src.includes("launchBadge")) fail(`${name} must not define its own Launch 25 badge copy`);
}
// Dealer keeps a neutral, non-Launch-25 note only.
if (!autosBranchSrc.includes("Paquete de negocio — promociones separadas")) {
  fail("Autos dealer must keep the neutral separate-promotions note");
}
if (autosBranchSrc.match(/negocios[\s\S]*?(ACEPTA CÓDIGO|LAUNCH 25 CODE ELIGIBLE)/)) {
  fail("Autos dealer must not carry Launch 25 eligibility copy");
}

// Final promo field helper copy stays aligned with the campaign.
for (const s of ["Usa tu código Leonix Launch 25 si aplica a este pago.", "Use your Leonix Launch 25 code if it applies to this checkout."]) {
  if (!fieldSrc.includes(s)) fail(`Promo field missing helper copy: ${s}`);
}
ok("one Launch 25 design source; eligible surfaces unified; free/dealer excluded");

if (!pkgSrc.includes("verify:website-launch-25-checkout-wiring")) {
  fail("package.json missing verifier script");
}

const secretPatterns = [/sk_(live|test)_[A-Za-z0-9]{16,}/, /whsec_[A-Za-z0-9]{16,}/];
for (const file of [redemptionsSrc, validationSrc, checkoutSrc, fieldSrc, docSrc, pkgSrc]) {
  for (const pattern of secretPatterns) {
    if (pattern.test(file)) fail(`Secret-like content forbidden matching ${pattern}`);
  }
}
ok("no secrets in gate artifacts");

console.log("verify-website-launch-25-checkout-wiring: PASS");
