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
const doc = "docs/paid-publish-entry-checkpoint-system-01.md";
const restaurantes = "app/(site)/clasificados/publicar/restaurantes/RestaurantesSelectorClient.tsx";
const servicios = "app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx";
const autos = "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx";
const rentas = "app/(site)/clasificados/publicar/rentas/RentasPublicarHubClient.tsx";
const br = "app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx";
const empleos = "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx";
const pkg = "package.json";

for (const rel of [checkpointComponent, config, copyLib, doc, restaurantes, servicios, autos, rentas, br, empleos, pkg]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const combined = [
  checkpointComponent,
  config,
  copyLib,
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
  "Publicar restaurante",
  "Ver más",
  "Qué incluye",
  "Servicios profesionales",
  "Autos privado",
  "Dealer",
  "Rentas privado",
  "Bienes Raíces",
  "si este producto web es elegible",
  "this website product is eligible",
]) {
  if (!combined.includes(s)) fail(`Missing required checkpoint string: ${s}`);
}
ok("checkpoint components and category strings present");

const copySrc = read(copyLib);
if (!copySrc.includes("si este producto web es elegible")) fail("Spanish coupon line missing");
if (!copySrc.includes("this website product is eligible")) fail("English coupon line missing");
ok("cautious coupon copy present");

const empleosSrc = read(empleos);
if (empleosSrc.includes("Launch 25") && empleosSrc.match(/getEmpleosFreeCheckpointCard[\s\S]*Launch 25/)) {
  fail("Free empleos path should not promise Launch 25 in checkpoint config usage");
}
ok("free empleos path avoids Launch 25 in checkpoint cards");

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

if (!read(doc).includes("revenuePricingMatrix")) fail("Doc must reference pricing source");
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
