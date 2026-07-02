/**
 * ADMIN-DASHBOARD-PROMO-CODE-GENERATOR-TOP-CTA-01 verification.
 * Run: npm run verify:admin-dashboard-promo-code-generator-top-cta-01
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(message) {
  console.error(`verify-admin-dashboard-promo-code-generator-top-cta-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const dashboard = "app/admin/_components/AdminCommandCenterDashboard.tsx";
const routes = "app/admin/_lib/adminDashboardRoutes.ts";
const promoPage = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const doc = "docs/admin-dashboard-promo-code-generator-top-cta-01.md";
const pkg = "package.json";

const PROMO_ROUTE = "/admin/workspace/promo-codes";

if (!exists(dashboard)) fail(`${dashboard} is missing`);
if (!exists(promoPage)) fail(`${promoPage} is missing`);
if (!exists(doc)) fail(`${doc} is missing`);

const dashSrc = read(dashboard);
const routesSrc = read(routes);
const promoSrc = read(promoPage);
const docSrc = read(doc);
const pkgSrc = read(pkg);

if (!dashSrc.includes("Promo Code Generator")) {
  fail("AdminCommandCenterDashboard missing Promo Code Generator label");
}
ok("dashboard contains Promo Code Generator label");

const linksToPromoRoute =
  dashSrc.includes(PROMO_ROUTE) ||
  (dashSrc.includes("ADMIN_DASHBOARD_ROUTES.promoCodes") && routesSrc.includes(`promoCodes: "${PROMO_ROUTE}"`));

if (!linksToPromoRoute) {
  fail(`dashboard must link to ${PROMO_ROUTE} or ADMIN_DASHBOARD_ROUTES.promoCodes`);
}
ok("dashboard links to promo codes route");

if (!dashSrc.includes('data-testid="admin-promo-code-generator-top-cta"')) {
  fail("top CTA strip test id missing");
}
ok("top CTA strip placement marker present");

if (!dashSrc.includes("Create and track Leonix checkout promo codes")) {
  fail("helper text missing from top CTA");
}
ok("helper text present");

if (!dashSrc.includes("AdminMonetizationLinksCard") || !dashSrc.includes('promoHref="/admin/workspace/promo-codes"')) {
  fail("existing Revenue Pulse monetization promo link must remain");
}
ok("existing lower monetization promo link preserved");

if (!promoSrc.includes("Create promo code") || !promoSrc.includes("createPromoCodeAction")) {
  fail("promo codes page missing create form");
}
ok("promo codes create form confirmed");

if (!routesSrc.includes(`promoCodes: "${PROMO_ROUTE}"`)) {
  fail("ADMIN_DASHBOARD_ROUTES.promoCodes missing");
}
ok("canonical promoCodes route defined");

const docMustMention = ["Stripe", "webhook", "Revenue OS", "does not touch"];
for (const text of docMustMention) {
  if (!docSrc.includes(text)) fail(`doc missing required mention: ${text}`);
}
ok("doc documents out-of-scope systems");

if (!pkgSrc.includes("verify:admin-dashboard-promo-code-generator-top-cta-01")) {
  fail("package.json missing verifier script");
}
ok("package.json verifier script registered");

const forbiddenPaths = [
  ".env",
  ".env.local",
  "app/api/revenue-os/webhook",
  "supabase/migrations",
];

for (const rel of forbiddenPaths) {
  const full = path.join(root, rel);
  if (exists(full) && fs.statSync(full).isFile() && dashSrc.includes(rel)) {
    fail(`unexpected reference to forbidden path: ${rel}`);
  }
}

const unrelatedCategoryMarkers = [
  "app/(site)/clasificados/restaurantes",
  "app/(site)/clasificados/bienes-raices",
  "app/(site)/clasificados/servicios",
  "app/api/stripe",
];

for (const marker of unrelatedCategoryMarkers) {
  if (dashSrc.includes(marker)) {
    fail(`dashboard unexpectedly references unrelated category path: ${marker}`);
  }
}
ok("no unrelated category or Stripe paths in dashboard change");

console.log("verify-admin-dashboard-promo-code-generator-top-cta-01: PASS");
