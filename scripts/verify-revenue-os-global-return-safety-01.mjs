/**
 * REVENUE-OS-GLOBAL-RETURN-SAFETY-01 verification.
 * Run: npm run verify:revenue-os-global-return-safety-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-revenue-os-global-return-safety-01: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const doc = read("docs/revenue-os-global-return-safety-01.md");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const returnPath = read("app/lib/listingPlans/revenueOsReturnPath.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const route = read("app/api/revenue-os/checkout/route.ts");
const exito = read("app/(site)/revenue-os/pago/exito/page.tsx");
const cancelado = read("app/(site)/revenue-os/pago/cancelado/page.tsx");
const resultView = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");
const launchLock = read("app/lib/launchLock/publicLaunchLock.ts");
const middleware = read("middleware.ts");
const previewBypass = read("scripts/verify-production-preview-bypass.mjs");
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Problem",
  "Global return contract",
  "Category return defaults",
  "Dashboard add-on return behavior",
  "Success page lookup-only rule",
  "Cancel page rule",
  "Preview bypass",
  "Manual QA",
  "What was not touched",
]) {
  if (!doc.includes(section)) fail(`Doc missing section: ${section}`);
}
ok("documentation sections present");

if (!checkout.includes("/revenue-os/pago/exito")) fail("Success URL must use /revenue-os/pago/exito");
if (!checkout.includes("return_to")) fail("Success URL must include return_to");
if (!checkout.includes("/revenue-os/pago/cancelado")) fail("Cancel URL must use /revenue-os/pago/cancelado");
if (!checkout.includes("sanitizeRevenueOsReturnPath")) fail("Checkout must sanitize return paths");
ok("checkout success/cancel URL contract");

if (!returnPath.includes("sanitizeRevenueOsReturnPath")) fail("Return path helper must sanitize paths");
if (!returnPath.includes("https?:\\/\\/")) fail("Return path helper must reject external URLs");
if (!payload.includes("returnPath")) fail("Category checkout payload must support returnPath");
ok("return path helper and payload");

if (!exito.includes("lookupRevenuePaymentProof")) fail("Success page must lookup payment proof");
if (!exito.includes("resolveRevenueOsSuccessReturnPath")) fail("Success page must sanitize return_to");
if (!resultView.includes("Pago recibido") || !resultView.includes("Payment received")) {
  fail("Success view must use honest payment-received copy");
}
if (!resultView.includes("Volver a mi panel") || !resultView.includes("Back to my dashboard")) {
  fail("Success view must offer dashboard CTA");
}
if (!resultView.includes("Ver categoría") || !resultView.includes("View category")) {
  fail("Success view must offer category CTA");
}
ok("success page lookup-only + honest UX");

if (!cancelado.includes("Pago cancelado") || !cancelado.includes("Payment canceled")) {
  fail("Cancel page must show honest cancelled state");
}
if (!cancelado.includes("resolveRevenueOsSuccessReturnPath")) fail("Cancel page must honor sanitized return_to");
ok("cancel page safe return context");

if (!launchLock.includes('"/revenue-os"')) fail("Launch lock must allow /revenue-os payment result paths");
if (!launchLock.includes('"/dashboard"')) fail("Launch lock must allow /dashboard owner return paths");
if (!middleware.includes("hasPreviewBypassCookie")) fail("Middleware must still support preview bypass");
ok("Coming Soon lock allows payment/dashboard returns");

if (!pkg.includes("verify:revenue-os-global-return-safety-01")) {
  fail("package.json must include verify:revenue-os-global-return-safety-01 script");
}
if (!previewBypass) fail("Preview bypass verifier must still exist");
ok("package script + preview bypass verifier present");

if (!route.includes("sanitizeRevenueOsReturnPath")) fail("Checkout route must sanitize returnPath server-side");
ok("checkout route sanitizes returnPath");

console.log("verify-revenue-os-global-return-safety-01: PASS");
