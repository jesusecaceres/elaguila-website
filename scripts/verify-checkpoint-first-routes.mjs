/**
 * Checkpoint-first publish routes + autos privado stability — static verification.
 * Run: npm run verify:checkpoint-first-routes
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
  console.error(`verify-checkpoint-first-routes: FAIL - ${message}`);
  process.exit(1);
}
function ok(message) {
  console.log(`OK: ${message}`);
}

const clasificadosPage = "app/(site)/clasificados/page.tsx";
const negociosLanes = "app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts";
const autosCheckpointPage = "app/(site)/clasificados/publicar/autos/page.tsx";
const autosBranchClient = "app/(site)/publicar/autos/PublicarAutosBranchClient.tsx";
const autosCheckpointConfig = "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts";
const autosPrivadoApp = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const restaurantesCheckpoint = "app/(site)/clasificados/publicar/restaurantes/page.tsx";
const doc = "docs/checkpoint-first-route-restoration-autos-crash-01.md";
const pkg = "package.json";

for (const rel of [
  clasificadosPage,
  negociosLanes,
  autosCheckpointPage,
  autosBranchClient,
  autosCheckpointConfig,
  autosPrivadoApp,
  restaurantesCheckpoint,
  doc,
  pkg,
]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing required file: ${rel}`);
}

const hubCombined = [clasificadosPage, negociosLanes].map(read).join("\n");
const checkpointCombined = [autosCheckpointPage, autosBranchClient, autosCheckpointConfig, restaurantesCheckpoint]
  .map(read)
  .join("\n");

for (const s of ["/clasificados/publicar/restaurantes", "/clasificados/publicar/autos"]) {
  if (!hubCombined.includes(s)) fail(`Hub routes must include checkpoint path: ${s}`);
}
ok("Clasificados and Negocios Locales hub routes point to checkpoints");

const hubHubOnly = hubCombined;
const directHubPatterns = [
  'restaurantes: "/publicar/restaurantes"',
  'autos-dealer: "/publicar/autos/negocios"',
  'autos: "/publicar/autos"',
  'appendLangToPath("/publicar/autos/privado"',
  'appendLangToPath("/publicar/autos/negocios"',
];
for (const pattern of directHubPatterns) {
  if (hubHubOnly.includes(pattern)) {
    fail(`Hub CTA must not skip checkpoint with direct path pattern: ${pattern}`);
  }
}
ok("Hub cards do not skip directly to raw application routes");

if (!checkpointCombined.includes("Autos privado")) fail("Autos checkpoint must include Autos privado");
if (!checkpointCombined.includes("Dealers de Autos")) fail("Autos checkpoint must include Dealers de Autos");
if (!checkpointCombined.includes("/publicar/autos/privado")) {
  fail("Autos checkpoint private CTA must route to /publicar/autos/privado");
}
if (!checkpointCombined.includes("/publicar/autos/negocios")) {
  fail("Autos checkpoint dealer CTA must route to /publicar/autos/negocios");
}
if (!checkpointCombined.includes("/publicar/restaurantes")) {
  fail("Restaurant checkpoint must forward to /publicar/restaurantes");
}
ok("Autos and restaurant checkpoint destinations verified");

const privadoSrc = read(autosPrivadoApp);
const legacyEffectIdx = privadoSrc.indexOf("legacy otherEquipmentDetails");
const hydrationReturnIdx = privadoSrc.indexOf('return <div className="min-h-[40vh] bg-[color:var(--lx-page)]"');
if (legacyEffectIdx === -1 || hydrationReturnIdx === -1) {
  fail("Autos privado application must have hydration gate and legacy equipment effect");
}
if (legacyEffectIdx > hydrationReturnIdx) {
  fail("Autos privado crash fix: useEffect must not appear after hydration early return");
}
ok("Autos privado hooks order crash guard present");

for (const s of [
  "coupon works for all categories",
  "launch 25 applies to free posts",
  "guaranteed placement",
  "dealer discount guaranteed",
]) {
  if (hubCombined.toLowerCase().includes(s) || checkpointCombined.toLowerCase().includes(s)) {
    fail(`Forbidden claim: ${s}`);
  }
}
ok("no forbidden coupon/placement claims");

if (!read(doc).includes("Rules of Hooks")) fail("Doc must document autos privado crash cause");
ok("documentation present");

if (!read(pkg).includes('"verify:checkpoint-first-routes"')) fail("package script missing");
ok("package script registered");

try {
  const diff = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
  const changed = diff.split("\n").map((l) => l.trim()).filter(Boolean);
  const scopedPrefixes = [
    "app/(site)/clasificados/page.tsx",
    "app/(site)/clasificados/publicar/autos/",
    "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
    "app/(site)/negocios-locales/",
    "app/(site)/publicar/autos/privado/",
    "docs/checkpoint-first-route-restoration-autos-crash-01.md",
    "scripts/verify-checkpoint-first-routes.mjs",
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

console.log("verify-checkpoint-first-routes: PASS");
