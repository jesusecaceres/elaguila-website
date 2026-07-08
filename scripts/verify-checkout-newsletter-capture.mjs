/**
 * Checkout Newsletter Checkbox Capture — static verification.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01
 *
 * No live Supabase/Stripe. Run: npm run verify:checkout-newsletter-capture
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
  console.error(`verify-checkout-newsletter-capture: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const helper = "app/lib/newsletter/checkoutNewsletterCapture.ts";
const apiRoute = "app/api/newsletter/checkout-capture/route.ts";
const restaurantes = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const rentas = "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx";
const empleosModal = "app/(site)/publicar/empleos/shared/publish/EmpleosPublishConfirmModal.tsx";
const empleosQuick = "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx";
const empleosPremium = "app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx";
const empleosFeria = "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx";
const autos = "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx";
const doc = "docs/checkout-newsletter-checkbox-capture-01.md";
const pkg = "package.json";

for (const rel of [
  helper,
  apiRoute,
  restaurantes,
  rentas,
  empleosModal,
  empleosQuick,
  empleosPremium,
  empleosFeria,
  autos,
  doc,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const helperSrc = read(helper);
const apiSrc = read(apiRoute);
const restaurantesSrc = read(restaurantes);
const rentasSrc = read(rentas);
const modalSrc = read(empleosModal);
const quickSrc = read(empleosQuick);
const premiumSrc = read(empleosPremium);
const feriaSrc = read(empleosFeria);
const autosSrc = read(autos);
const docSrc = read(doc);
const pkgSrc = read(pkg);

const SOURCES = [
  "restaurantes_checkout",
  "rentas_checkout",
  "empleos_checkout",
  "autos_privado_checkout",
];

// Shared helper contract
if (!helperSrc.includes("captureCheckoutNewsletterSubscriber")) {
  fail("Helper must export captureCheckoutNewsletterSubscriber");
}
for (const s of SOURCES) {
  if (!helperSrc.includes(s)) fail(`Helper missing source: ${s}`);
}
if (!helperSrc.includes("unchecked") || !helperSrc.includes("missing_email")) {
  fail("Helper must skip on unchecked and missing_email");
}
if (!/checked\b/.test(helperSrc)) fail("Helper must gate on checked flag");
ok("shared capture helper present with all sources + skip branches");

// API route reuses existing save pattern, never creates promo/email/Stripe
if (!apiSrc.includes("saveNewsletterSubscriber")) {
  fail("API must reuse saveNewsletterSubscriber (existing pattern)");
}
for (const s of SOURCES) {
  if (!apiSrc.includes(s)) fail(`API allowlist missing source: ${s}`);
}
if (/ensureNewsletterPromoCode|buildNewsletterPromoCodeEmail|sendLeonixResendEmail|resend\.batch/i.test(apiSrc)) {
  fail("Capture API must NOT create promo codes or send email");
}
if (/from ["']stripe["']|new Stripe\(|stripe\.checkout|revenue-os\/checkout/i.test(apiSrc)) {
  fail("Capture API must NOT import or call Stripe/checkout");
}
ok("capture API reuses save pattern; no promo/email/Stripe");

// Each flow calls the helper with its source (non-blocking)
if (!restaurantesSrc.includes("captureCheckoutNewsletterSubscriber") || !restaurantesSrc.includes("restaurantes")) {
  fail("Restaurantes flow must call capture helper");
}
if (!restaurantesSrc.includes("ctx.newsletterOptIn")) {
  fail("Restaurantes must wire the existing newsletterOptIn checkbox");
}
ok("restaurantes checkout wired");

if (!rentasSrc.includes("captureCheckoutNewsletterSubscriber") || !rentasSrc.includes("CHECKOUT_NEWSLETTER_SOURCES.rentas")) {
  fail("Rentas privado flow must call capture helper with rentas source");
}
if (!rentasSrc.includes("newsletterOptIn")) fail("Rentas must have newsletter opt-in state");
ok("rentas privado checkout wired");

// Empleos: modal supports optional newsletter; paid quick + premium wire it; feria excluded
if (!modalSrc.includes("newsletter") || !modalSrc.includes("newsletterOptIn")) {
  fail("Empleos confirm modal must support optional newsletter opt-in");
}
if (!/onConfirm.*newsletterOptIn/s.test(modalSrc)) {
  fail("Empleos modal onConfirm must pass newsletterOptIn");
}
for (const [name, src] of [["quick", quickSrc], ["premium", premiumSrc]]) {
  if (!src.includes("captureCheckoutNewsletterSubscriber") || !src.includes("CHECKOUT_NEWSLETTER_SOURCES.empleos")) {
    fail(`Empleos ${name} must call capture helper with empleos source`);
  }
  if (!src.includes("newsletter={{")) fail(`Empleos ${name} must pass newsletter prop to modal`);
}
if (feriaSrc.includes("captureCheckoutNewsletterSubscriber") || feriaSrc.includes("newsletter={{")) {
  fail("Empleos FREE feria must NOT capture newsletter (excluded)");
}
ok("empleos paid quick + premium wired; free feria excluded");

// Autos privado wired; dealer/negocios excluded (capture only in privado+stripe branch)
if (!autosSrc.includes("captureCheckoutNewsletterSubscriber") || !autosSrc.includes("CHECKOUT_NEWSLETTER_SOURCES.autosPrivado")) {
  fail("Autos privado flow must call capture helper with autos_privado source");
}
if (autosSrc.includes("autos_negocio_checkout") || autosSrc.includes("CHECKOUT_NEWSLETTER_SOURCES.autosNegocio")) {
  fail("Autos dealer/negocio must NOT be wired");
}
ok("autos privado checkout wired; dealer excluded");

// Doc + package script
for (const s of [
  "restaurantes_checkout",
  "rentas_checkout",
  "empleos_checkout",
  "autos_privado_checkout",
  "free job fair",
  "dealer",
  "best-effort",
]) {
  if (!docSrc.toLowerCase().includes(s.toLowerCase())) fail(`Doc missing: ${s}`);
}
ok("handoff doc present");

if (!pkgSrc.includes("verify:checkout-newsletter-capture")) {
  fail("package.json missing verify:checkout-newsletter-capture script");
}
ok("package.json verifier script registered");

console.log("verify-checkout-newsletter-capture: PASS");
