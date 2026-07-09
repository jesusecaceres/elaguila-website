/**
 * Admin Promo Code Clarity — static verification.
 * No live Supabase/Stripe/login required.
 * Run: npm run verify:admin-promo-code-clarity
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
  console.error(`verify-admin-promo-code-clarity: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const page = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const recentPanel = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeRecentCodesPanel.tsx";
const helpers = "app/admin/_lib/promoCodeDisplayHelpers.ts";
const doc = "docs/admin-promo-code-clarity-01.md";
const salesOps = "docs/newsletter-sales-contact-ops.md";
const promoReadiness = "docs/newsletter-promo-code-readiness.md";
const launchAudit = "docs/launch-25-opportunity-audit-01.md";
const pkg = "package.json";

for (const rel of [page, recentPanel, helpers, doc, salesOps, promoReadiness, launchAudit, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const pageSrc = read(page);
const recentSrc = read(recentPanel);
const helpersSrc = read(helpers);
const docSrc = read(doc);
const salesOpsSrc = read(salesOps);
const promoReadinessSrc = read(promoReadiness);
const launchAuditSrc = read(launchAudit);
const pkgSrc = read(pkg);

const touched = `${pageSrc}\n${recentSrc}\n${helpersSrc}`.toLowerCase();

for (const s of [
  "code_type=newsletter",
  "/admin/leads/newsletter",
  "delivery_status",
  "Follow-up",
  "Manual outreach only",
  "does not send bulk newsletters",
  "formatPromoDeliveryStatus",
  "buildPromoFollowUpGuidance",
]) {
  if (!pageSrc.includes(s) && !recentSrc.includes(s) && !helpersSrc.includes(s)) fail(`Missing required clarity string: ${s}`);
}
ok("promo-code page + helpers contain newsletter clarity strings");

for (const s of ["Sent", "Failed", "Pending", "Email not configured", "Unknown / not sent"]) {
  if (!helpersSrc.includes(s)) fail(`Delivery status label missing: ${s}`);
}
for (const s of ["Active", "Redeemed", "Expired", "Revoked"]) {
  if (!helpersSrc.includes(s)) fail(`Code status label missing: ${s}`);
}
ok("status language present");

if (!docSrc.includes("Admin Promo Code Clarity")) fail("Doc title missing");
if (!docSrc.includes("code_type=newsletter")) fail("Doc missing target URL");
if (!docSrc.includes("Manual outreach only")) fail("Doc missing manual follow-up rule");
if (!docSrc.includes("PENDING")) fail("Doc must keep money-path QA pending");
ok("admin promo clarity doc present");

for (const [name, src, needle] of [
  ["sales ops cross-link", salesOpsSrc, "admin-promo-code-clarity-01.md"],
  ["promo readiness cross-link", promoReadinessSrc, "admin-promo-code-clarity-01.md"],
  ["launch audit cross-link", launchAuditSrc, "admin-promo-code-clarity-01.md"],
]) {
  if (!src.includes(needle)) fail(`${name} missing: ${needle}`);
}
ok("related docs cross-link admin promo clarity doc");

if (!pkgSrc.includes('"verify:admin-promo-code-clarity"')) {
  fail("package.json missing verify:admin-promo-code-clarity script");
}
ok("package script present");

const forbidden = [
  "bulk sender is ready",
  "guaranteed placement",
  "print discount included",
  "dealer discount included",
];
for (const phrase of forbidden) {
  if (touched.includes(phrase)) fail(`Forbidden phrase introduced: ${phrase}`);
}
ok("forbidden claims not introduced");

console.log("verify-admin-promo-code-clarity: PASS");
