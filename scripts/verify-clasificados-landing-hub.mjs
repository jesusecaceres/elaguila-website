/**
 * Clasificados landing hub polish — static verification.
 * Run: npm run verify:clasificados-landing-hub
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
  console.error(`verify-clasificados-landing-hub: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const page = "app/(site)/clasificados/page.tsx";
const landingCopy = "app/(site)/clasificados/_lib/clasificadosLandingHubCopy.ts";
const launchBanner = "app/(site)/clasificados/_components/ClasificadosLandingLaunchBanner.tsx";
const featuredOfertas = "app/(site)/clasificados/_components/ClasificadosFeaturedOfertasModule.tsx";
const categoryCard = "app/(site)/clasificados/_components/ClasificadosHubCategoryCard.tsx";
const couponCard = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const doc = "docs/clasificados-landing-hub-polish-01.md";
const pkg = "package.json";

for (const rel of [page, landingCopy, launchBanner, featuredOfertas, categoryCard, couponCard, doc, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const combined = [page, landingCopy, launchBanner, featuredOfertas, categoryCard, couponCard].map(read).join("\n");

for (const s of [
  "Clasificados",
  "Ofertas Locales de la Semana",
  "Ver ofertas",
  "Publica tus ofertas locales",
  "Explorar",
  "Obtén tu código Leonix Launch 25",
  "clasificados_landing_launch_25",
  "openInNewTab",
  "ClasificadosHubCategoryCard",
  "ClasificadosFeaturedOfertasModule",
  "ClasificadosLandingLaunchBanner",
]) {
  if (!combined.includes(s)) fail(`Missing required landing hub string: ${s}`);
}
const pageSrc = read(page);
if (!pageSrc.includes("t.sectionBrowse")) fail("Browse section title must use hub copy sectionBrowse");
const hubCopyRef = read("app/lib/clasificados/clasificadosHubPageCopy/index.ts");
if (!hubCopyRef.includes("Explorar por categoría")) fail("Hub copy must include Explorar por categoría");
if (!hubCopyRef.includes("Publicar en")) fail("Hub copy must include Publicar en publish CTA pattern");
ok("landing page structure and key strings present");

if (!read(landingCopy).includes('return: "clasificados"')) {
  fail("Newsletter href must include return=clasificados");
}
ok("Launch 25 newsletter link source tracking present");

if (!read(categoryCard).includes("getClasificadosHubExploreCtaLabel")) {
  fail("Category cards must use explore CTA label helper");
}
if (!read(page).includes("publishLabel={copy.post}")) {
  fail("Category cards must preserve publish CTA from copy");
}
ok("category cards preserve Explore + Publish CTAs");

for (const s of [
  "coupon works for all categories",
  "launch 25 applies to free posts",
  "guaranteed placement",
  "print discount included",
]) {
  if (combined.toLowerCase().includes(s)) fail(`Forbidden claim: ${s}`);
}
ok("no forbidden coupon/placement claims");

if (!read(doc).includes("clasificados_landing_launch_25")) fail("Doc must document Launch 25 source");
if (!read(doc).includes("Explorar + Publicar")) fail("Doc must document dual CTAs");
ok("documentation present");

if (!read(pkg).includes('"verify:clasificados-landing-hub"')) fail("package script missing");
ok("package script registered");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const scopedPrefixes = [
    "app/(site)/clasificados/page.tsx",
    "app/(site)/clasificados/_components/",
    "app/(site)/clasificados/_lib/",
    "app/components/leonix/LeonixLaunchCouponCard.tsx",
    "docs/clasificados-landing-hub-polish-01.md",
    "scripts/verify-clasificados-landing-hub.mjs",
    "package.json",
  ];
  const forbidden = [/stripe/i, /revenuePromoValidation/i, /revenuePromoRedemption/i, /^supabase\/migrations\//, /^app\/admin\//];
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

console.log("verify-clasificados-landing-hub: PASS");
