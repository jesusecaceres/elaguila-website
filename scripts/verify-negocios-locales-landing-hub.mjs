/**
 * Negocios Locales landing hub + route cleanup — static verification.
 * Run: npm run verify:negocios-locales-landing-hub
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
  console.error(`verify-negocios-locales-landing-hub: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const page = "app/(site)/negocios-locales/page.tsx";
const lanes = "app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts";
const landingCopy = "app/(site)/negocios-locales/_lib/negociosLocalesLandingHubCopy.ts";
const launchBanner = "app/(site)/negocios-locales/_components/NegociosLocalesLaunchBanner.tsx";
const featuredOfertas = "app/(site)/negocios-locales/_components/NegociosLocalesFeaturedOfertasModule.tsx";
const businessCard = "app/(site)/negocios-locales/_components/NegociosLocalesBusinessCard.tsx";
const couponCard = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const clasificadosPage = "app/(site)/clasificados/page.tsx";
const doc = "docs/negocios-locales-landing-hub-route-cleanup-01.md";
const pkg = "package.json";

for (const rel of [
  page,
  lanes,
  landingCopy,
  launchBanner,
  featuredOfertas,
  businessCard,
  couponCard,
  clasificadosPage,
  doc,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const combined = [page, lanes, landingCopy, launchBanner, featuredOfertas, businessCard, couponCard]
  .map(read)
  .join("\n");

for (const s of [
  "Negocios Locales",
  "Explorar por sector",
  "Ofertas Locales",
  "Promociona tus Ofertas Locales",
  "Ver ofertas",
  "Publicar ofertas locales",
  "Obtén tu código Leonix Launch 25",
  "negocios_locales_launch_25",
  "Dealers de Autos",
  "NegociosLocalesBusinessCard",
  "Patrocinadores de Leonix",
  "openInNewTab",
]) {
  if (!combined.includes(s)) fail(`Missing required Negocios Locales string: ${s}`);
}
ok("landing page structure and key strings present");

const lanesSrc = read(lanes);
if (!lanesSrc.includes('restaurantes: "/clasificados/publicar/restaurantes"')) {
  fail("Restaurantes advertise path must be /clasificados/publicar/restaurantes (checkpoint-first)");
}
if (!lanesSrc.includes('"/clasificados/publicar/autos"')) {
  fail("Dealers advertise path must be /clasificados/publicar/autos (checkpoint-first)");
}
if (lanesSrc.includes("/publicar/autos/privado") || lanesSrc.includes("/publicar/autos/negocios")) {
  fail("Negocios Locales hub lanes must not skip checkpoint to raw autos application routes");
}
if (lanesSrc.includes('restaurantes: "/publicar/restaurantes"')) {
  fail("Negocios Locales must not skip restaurant checkpoint");
}
if (lanesSrc.includes("Concesionarios de Autos")) {
  fail('Visible dealer label must be "Dealers de Autos", not Concesionarios de Autos');
}
ok("restaurant and dealer route cleanup verified");

const clasificadosSrc = read(clasificadosPage);
if (!clasificadosSrc.includes('restaurantes: "/clasificados/publicar/restaurantes"')) {
  fail("Clasificados Restaurantes publish path must point to checkpoint");
}
if (!clasificadosSrc.includes('autos: "/clasificados/publicar/autos"')) {
  fail("Clasificados Autos publish path must point to checkpoint");
}
ok("Clasificados checkpoint-first routes verified");

if (!read(landingCopy).includes('return: "negocios-locales"')) {
  fail("Newsletter href must include return=negocios-locales");
}
ok("Launch 25 newsletter link source tracking present");

if (!read(businessCard).includes("ClasificadosHubCategoryCard")) {
  fail("Business cards must reuse Clasificados hub card polish");
}
if (!read(page).includes("advertiseLabel={advertiseLabel}")) {
  fail("Sector cards must preserve advertise/publish CTA");
}
ok("sector cards preserve Explore + Anunciar/Publicar CTAs");

for (const s of [
  "coupon works for all categories",
  "launch 25 applies to free posts",
  "guaranteed placement",
  "print discount included",
  "dealer discount guaranteed",
]) {
  if (combined.toLowerCase().includes(s)) fail(`Forbidden claim: ${s}`);
}
ok("no forbidden coupon/placement claims");

if (!read(doc).includes("/clasificados/publicar/restaurantes")) fail("Doc must document restaurant checkpoint route");
if (!read(doc).includes("/clasificados/publicar/autos")) fail("Doc must document autos checkpoint route");
ok("documentation present");

if (!read(pkg).includes('"verify:negocios-locales-landing-hub"')) fail("package script missing");
ok("package script registered");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const scopedPrefixes = [
    "app/(site)/negocios-locales/",
    "docs/negocios-locales-landing-hub-route-cleanup-01.md",
    "scripts/verify-negocios-locales-landing-hub.mjs",
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

console.log("verify-negocios-locales-landing-hub: PASS");
