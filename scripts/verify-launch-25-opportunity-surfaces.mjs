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

// Reusable Launch 25 card is the single source of truth and is reused on surfaces.
if (!cardSrc.includes("LeonixLaunchCouponCard")) fail("Launch 25 card component missing");
for (const [name, src] of [["login", loginSrc], ["dashboard", dashboardSrc], ["profile", perfilSrc]]) {
  if (!src.includes("LeonixLaunchCouponCard")) fail(`${name} surface must render LeonixLaunchCouponCard`);
}
ok("reusable Launch 25 card reused on signup/dashboard/profile");

// Source-tracked CTAs per surface.
if (!loginSrc.includes("signup_launch_25")) fail("Signup CTA must use source=signup_launch_25");
if (!dashboardSrc.includes("dashboard_launch_25")) fail("Dashboard CTA must use source=dashboard_launch_25");
if (!perfilSrc.includes("profile_onboarding_launch_25")) {
  fail("Profile onboarding CTA must use source=profile_onboarding_launch_25");
}
ok("signup/dashboard/profile CTA source tracking present");

// Signup card gated on signup mode; profile card gated on onboarding.
if (!/mode === "signup"/.test(loginSrc)) fail("Signup card should render in signup mode");
if (!/onboarding/.test(perfilSrc)) fail("Profile card should render during onboarding");
ok("signup/onboarding gating present");

// Newsletter remains the claim page and reads source cleanly.
if (!clientSrc.includes('searchParams?.get("source")')) {
  fail("Newsletter client must read source from query params");
}
if (!clientSrc.includes("LeonixLaunchCouponCard")) fail("Newsletter page must still show the Launch 25 card");
ok("newsletter page preserved as claim page + reads source");

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
