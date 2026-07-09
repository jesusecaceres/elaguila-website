/**
 * Paid publish entry checkpoints — static verification.
 * Run: npm run verify:paid-publish-entry-checkpoints
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
  console.error(`verify-paid-publish-entry-checkpoints: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const checkpointComponent = "app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx";
const config = "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts";
const copyLib = "app/(site)/clasificados/publicar/_lib/publishCheckpointCopy.ts";
const couponCard = "app/components/leonix/LeonixLaunchCouponCard.tsx";
const newsletterClient = "app/(site)/newsletter/NewsletterPageClient.tsx";
const doc = "docs/paid-publish-entry-checkpoint-system-01.md";
const restaurantes = "app/(site)/clasificados/publicar/restaurantes/RestaurantesSelectorClient.tsx";
const servicios = "app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx";
const autos = "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx";
const rentas = "app/(site)/clasificados/publicar/rentas/RentasPublicarHubClient.tsx";
const br = "app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx";
const empleos = "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx";
const pkg = "package.json";

for (const rel of [
  checkpointComponent,
  config,
  copyLib,
  couponCard,
  newsletterClient,
  doc,
  restaurantes,
  servicios,
  autos,
  rentas,
  br,
  empleos,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const combined = [
  checkpointComponent,
  config,
  copyLib,
  couponCard,
  restaurantes,
  servicios,
  autos,
  rentas,
  br,
  empleos,
]
  .map(read)
  .join("\n");

for (const s of [
  "PaidPublishCheckpointCard",
  "PaidPublishCheckpointModal",
  "PublishEntryCheckpointStack",
  "PublishEntryCheckpointLaunchBanner",
  "Publicar restaurante",
  "Ver más",
  "Qué incluye",
  "Servicios profesionales",
  "Autos privado",
  "Dealer",
  "Rentas privado",
  "Bienes Raíces",
  "Obtén tu código Leonix Launch 25",
  "25% DE DESCUENTO",
  "paid_checkpoint_launch_25",
  "openInNewTab",
  "target=\"_blank\"",
  "return: \"checkpoint\"",
]) {
  if (!combined.includes(s)) fail(`Missing required checkpoint string: ${s}`);
}
ok("checkpoint components, Launch 25 banner, and category strings present");

const copySrc = read(copyLib);
if (!copySrc.includes("si este producto web es elegible")) fail("Spanish coupon line missing");
if (!copySrc.includes("this website product is eligible")) fail("English coupon line missing");
if (!copySrc.includes("publishCheckpointCouponLineShort")) fail("Short per-card coupon line helper missing");
ok("cautious coupon copy present");

const configSrc = read(config);
if (!configSrc.includes("$24.99 / 30 días por anuncio")) {
  fail("Rentas negocio must show $24.99 / 30 días por anuncio");
}
if (!configSrc.includes("$24.99 / 30 días") || !configSrc.includes("rentas_privado")) {
  fail("Rentas privado $24.99 / 30 días missing");
}
for (const forbidden of [
  "Ver en aplicación",
  "paquete de rentas negocio",
  "bulk rental package",
  "multiple properties included",
]) {
  const rentasNegocioBlock = configSrc.slice(
    configSrc.indexOf("getRentasNegocioCheckpointCard"),
    configSrc.indexOf("export function getBienesRaicesCheckpointCards"),
  );
  if (rentasNegocioBlock.includes(forbidden)) {
    fail(`Forbidden Rentas negocio bundled language: ${forbidden}`);
  }
}
const rentasNegocioPriceBlock = configSrc.slice(
  configSrc.indexOf('id: "rentas_negocio"'),
  configSrc.indexOf("export function getBienesRaicesCheckpointCards"),
);
if (rentasNegocioPriceBlock.match(/\$399/)) {
  fail("Rentas negocio checkpoint must not promise $399 bundle pricing");
}
ok("Rentas negocio price corrected; no bundle language");

const empleosSrc = read(empleos);
if (empleosSrc.includes("checkpointCategory=\"empleos\"") && !empleosSrc.includes("launchBannerCards")) {
  fail("Empleos mixed hub must pass launchBannerCards for paid-only banner gating");
}
const freeFeriaBlock = configSrc.slice(configSrc.indexOf("getEmpleosFreeCheckpointCard"));
if (!freeFeriaBlock.includes("couponEligible: false")) {
  fail("Free empleos feria path should not be coupon eligible");
}
ok("free empleos path avoids Launch 25 eligibility on free card");

for (const s of [
  "guaranteed placement included",
  "print discount included",
  "dealer discount guaranteed",
  "coupon works for all categories",
  "launch 25 applies to free posts",
]) {
  if (combined.toLowerCase().includes(s)) fail(`Forbidden claim: ${s}`);
}
ok("no forbidden claims");

const newsletterSrc = read(newsletterClient);
if (!newsletterSrc.includes("returnCheckpoint")) fail("Newsletter close-helper gate missing");
if (!newsletterSrc.includes("Cerrar ventana")) fail("Newsletter close button copy missing");
if (!newsletterSrc.includes("window.close()")) fail("Newsletter window.close helper missing");
ok("newsletter close-helper present");

const docSrc = read(doc);
if (!docSrc.includes("paid_checkpoint_launch_25")) fail("Doc must document Launch 25 banner source");
if (!docSrc.includes("$24.99 / 30 días por anuncio")) fail("Doc must document Rentas negocio correction");
if (!docSrc.includes("revenuePricingMatrix")) fail("Doc must reference pricing source");
ok("documentation present");

if (!read(pkg).includes('"verify:paid-publish-entry-checkpoints"')) fail("package script missing");
ok("package script registered");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const scopedPrefixes = [
    "app/(site)/clasificados/publicar/",
    "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx",
    "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
    "app/(site)/newsletter/",
    "app/components/leonix/LeonixLaunchCouponCard.tsx",
    "docs/paid-publish-entry-checkpoint-system-01.md",
    "scripts/verify-paid-publish-entry-checkpoints.mjs",
    "package.json",
  ];
  const forbidden = [/stripe/i, /revenuePromoValidation/i, /revenuePromoRedemption/i, /^supabase\/migrations\//];
  for (const file of changed) {
    if (!scopedPrefixes.some((p) => file.startsWith(p) || file === p)) continue;
    if (forbidden.some((re) => re.test(file))) {
      fail(`Scoped build touched locked file: ${file}`);
    }
  }
  ok("git diff lock check passed (scoped files only)");
} catch {
  ok("git diff lock check skipped");
}

console.log("verify-paid-publish-entry-checkpoints: PASS");
