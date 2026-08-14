/**
 * Launch 25 Opportunity Surfaces — static verification.
 * Gate: LAUNCH-25-OPPORTUNITY-AUDIT-01
 *
 * No live Supabase/login/Stripe/browser. Static assertions only.
 * Run: npm run verify:launch-25-opportunity-surfaces
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
  console.error(`verify-launch-25-opportunity-surfaces: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const card = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const login = "app/(site)/login/page.tsx";
const dashboard = "app/(site)/dashboard/page.tsx";
const perfil = "app/(site)/dashboard/perfil/page.tsx";
const newsletterPage = "app/(site)/newsletter/page.tsx";
const newsletterClient = "app/(site)/newsletter/NewsletterPageClient.tsx";
const doc = "docs/launch-25-opportunity-audit-01.md";
const pkg = "package.json";

for (const rel of [card, login, dashboard, perfil, newsletterPage, newsletterClient, doc, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const cardSrc = read(card);
const loginSrc = read(login);
const dashboardSrc = read(dashboard);
const perfilSrc = read(perfil);
const clientSrc = read(newsletterClient);
const docSrc = read(doc);
const pkgSrc = read(pkg);

// Package C Build 2 (C4) — Launch 25 is retired. The component file itself stays in the repo
// (dead-code removal was out of scope) but no live surface renders it anymore, and the
// per-surface CTA-source/gating checks below are moot once the card is gone — this gate now
// asserts absence on every previously-required surface instead of presence.
void cardSrc;
for (const [name, src] of [
  ["login", loginSrc],
  ["dashboard", dashboardSrc],
  ["profile", perfilSrc],
  ["newsletter", clientSrc],
]) {
  if (src.includes("LeonixLaunchCouponCard")) fail(`${name} surface must no longer render LeonixLaunchCouponCard (Launch 25 retired)`);
}
ok("retired Launch 25 card no longer rendered on signup/dashboard/profile/newsletter");

// Newsletter remains the claim page and still reads source cleanly (unrelated to retirement).
if (!clientSrc.includes('searchParams?.get("source")')) {
  fail("Newsletter client must read source from query params");
}
ok("newsletter page still reads source from query params");

// Doc lists the CTA source values.
for (const s of ["signup_launch_25", "dashboard_launch_25", "profile_onboarding_launch_25", "PENDING"]) {
  if (!docSrc.includes(s)) fail(`Doc missing: ${s}`);
}
ok("opportunity audit doc present with source values + pending money-path QA");

// No fake eligibility / forbidden claims introduced in touched surfaces.
const FORBIDDEN = ["guaranteed placement", "print discount", "bulk newsletter sender", "dealer discount"];
for (const [name, src] of [
  ["login", loginSrc],
  ["dashboard", dashboardSrc],
  ["profile", perfilSrc],
  ["doc", docSrc],
]) {
  for (const bad of FORBIDDEN) {
    if (src.toLowerCase().includes(bad.toLowerCase())) {
      fail(`Forbidden claim "${bad}" found in ${name}`);
    }
  }
}
ok("no forbidden eligibility claims in touched surfaces");

if (!pkgSrc.includes("verify:launch-25-opportunity-surfaces")) {
  fail("package.json missing verify:launch-25-opportunity-surfaces script");
}
ok("package.json verifier script registered");

console.log("verify-launch-25-opportunity-surfaces: PASS");
