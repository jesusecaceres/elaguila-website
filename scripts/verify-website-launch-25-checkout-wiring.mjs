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
const autos = "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx";
const doc = "docs/newsletter-promo-code-readiness.md";
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
  autos,
  doc,
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
const autosSrc = read(autos);
const docSrc = read(doc);
const pkgSrc = read(pkg);

// website_launch_25 metadata support + allowlist
if (!redemptionsSrc.includes("website_launch_25")) fail("Redemptions must recognize website_launch_25 family");
if (!redemptionsSrc.includes("WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS")) {
  fail("Redemptions must define the allowlisted package keys");
}
for (const key of ["rentas_30d", "empleos_job_post_paid", "autos_privado_30d", "restaurantes_base_monthly"]) {
  if (!redemptionsSrc.includes(key)) fail(`Allowlist missing package key: ${key}`);
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

// Category surfaces forward promo code
if (!rentasSrc.includes("RevenuePromoField") || !rentasSrc.includes("promoCode: appliedPromoCode")) {
  fail("Rentas privado must render promo field and forward code");
}
if (!empleosModalSrc.includes("RevenuePromoField") || !empleosModalSrc.includes("onConfirm(promoCode)")) {
  fail("Empleos confirm modal must render promo field and forward code");
}
if (!empleosCheckoutSrc.includes("promoCode")) fail("Empleos checkout helper must accept promo code");
if (!empleosQuickSrc.includes("promo={{") || !empleosPremiumSrc.includes("promo={{")) {
  fail("Empleos quick + premium must pass promo props");
}
if (!autosSrc.includes("RevenuePromoField") || !autosSrc.includes("promoCode: appliedPromoCode")) {
  fail("Autos privado must render promo field and forward code");
}
if (!autosSrc.includes('lane === "privado" && publishConfirmMode === "stripe"')) {
  fail("Autos promo field must be gated to private paid Stripe checkout");
}
// Autos dealer/negocios legacy checkout must remain untouched by promo field
if (autosSrc.includes("AUTOS_NEGOCIOS_CHECKOUT_PROMO") || autosSrc.match(/negocios[^\n]*RevenuePromoField/)) {
  fail("Autos negocio/dealer checkout must not receive promo field");
}
ok("eligible category surfaces wired; dealer/legacy untouched");

// Doc mentions doctrine
for (const s of ["website checkout only", "webhook"]) {
  if (!docSrc.toLowerCase().includes(s)) fail(`Doc must mention: ${s}`);
}
ok("documentation doctrine present");

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

// Selector cards use the official badge variant; free/dealer excluded.
if (!empleosHubSrc.includes("LeonixLaunchCouponCard") || !empleosHubSrc.includes('variant="badge"')) {
  fail("Empleos paid selector must use the official badge variant");
}
if (!autosBranchClientSrc.includes("LeonixLaunchCouponCard") || !autosBranchClientSrc.includes('variant="badge"')) {
  fail("Autos private selector must use the official badge variant");
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
