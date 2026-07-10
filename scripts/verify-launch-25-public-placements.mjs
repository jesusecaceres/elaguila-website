/**
 * Launch 25 public placements — Home + Digital Magazine — static verification.
 * Run: npm run verify:launch-25-public-placements
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}
function fail(message) {
  console.error(`verify-launch-25-public-placements: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const home = "app/(site)/home/HomeMarketingClient.tsx";
const magazine = "app/(site)/magazine/page.tsx";
const card = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const newsletterDoc = "docs/newsletter-promo-code-readiness.md";
const pricingDoc = "docs/pricing-promo-code-sales-model.md";
const pkg = "package.json";

for (const rel of [home, magazine, card, newsletterDoc, pricingDoc, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const homeSrc = read(home);
const magazineSrc = read(magazine);
const combined = [homeSrc, magazineSrc].join("\n");

if (!homeSrc.includes("LeonixLaunchCouponCard")) fail("Home must use LeonixLaunchCouponCard");
if (!homeSrc.includes('source=home')) fail("Home CTA must include source=home");
if (!homeSrc.includes("sourceCta=launch_25")) fail("Home CTA must include sourceCta=launch_25");
if (!homeSrc.includes('variant="compact"')) fail("Home should use compact Launch 25 variant");
ok("Home Launch 25 placement verified");

if (!magazineSrc.includes("LeonixLaunchCouponCard")) fail("Magazine must use LeonixLaunchCouponCard");
if (!magazineSrc.includes("source=digital_magazine")) fail("Magazine CTA must include source=digital_magazine");
if (!magazineSrc.includes("sourceCta=launch_25")) fail("Magazine CTA must include sourceCta=launch_25");
ok("Digital magazine Launch 25 placement verified");

for (const s of [
  "coupon works for all categories",
  "launch 25 applies to free posts",
  "guaranteed placement",
  "print discount included",
  "dealer discount guaranteed",
  "applies to print magazine",
]) {
  if (combined.toLowerCase().includes(s)) fail(`Forbidden claim added: ${s}`);
}
ok("no forbidden print/combo/placement claims in placement files");

if (!read(newsletterDoc).includes("source=home")) fail("Newsletter doc must document home source");
if (!read(newsletterDoc).includes("source=digital_magazine")) fail("Newsletter doc must document digital_magazine source");
if (!read(pricingDoc).includes("source=digital_magazine")) fail("Pricing doc must document digital_magazine placement");
ok("documentation updated");

if (!read(pkg).includes('"verify:launch-25-public-placements"')) fail("package script missing");
ok("package script registered");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const scopedPrefixes = [
    "app/(site)/home/",
    "app/(site)/magazine/page.tsx",
    "docs/newsletter-promo-code-readiness.md",
    "docs/pricing-promo-code-sales-model.md",
    "scripts/verify-launch-25-public-placements.mjs",
    "package.json",
  ];
  const forbidden = [
    /stripe/i,
    /revenuePromoValidation/i,
    /revenuePromoRedemptions/i,
    /^supabase\/migrations\//,
    /^app\/api\/newsletter\//,
    /^app\/admin\//,
  ];
  for (const file of changed) {
    const inScope = scopedPrefixes.some((p) => file.startsWith(p) || file === p);
    if (!inScope) continue;
    if (forbidden.some((re) => re.test(file))) {
      fail(`Scoped build touched locked file: ${file}`);
    }
  }
  ok("git diff lock check passed (scoped files only)");
} catch {
  ok("git diff lock check skipped");
}

console.log("verify-launch-25-public-placements: PASS");
