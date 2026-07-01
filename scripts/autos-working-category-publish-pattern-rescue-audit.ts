import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function exists(path: string): boolean {
  return existsSync(join(root, path));
}

function git(command: string): string {
  return execSync(command, { cwd: root, encoding: "utf8" });
}

const auditPath = "app/lib/clasificados/autos/AUTOS_WORKING_CATEGORY_PUBLISH_PATTERN_RESCUE_AUDIT.md";
assert(exists(auditPath), "rescue audit file exists");

const audit = read(auditPath);
for (const term of [
  "En Venta / Varios",
  "Servicios",
  "Rentas",
  "Empleos",
  "Bienes",
  "POST /api/clasificados/autos/listings",
  "autos_classifieds_listings",
  "AUTOS_A5_SHIP_01_TRUE_PREVIEW_LIVE_PUBLISH_PROOF_AUDIT",
  "AUTOS_A5_SHIP_01_POST_PUBLISH_SQL",
  "SQL REQUIRED",
  "RLS BLOCKER",
  "STORAGE BLOCKER",
  "QA bypass",
  "internal UUID",
  "Leonix ID",
  "Privado",
  "Negocios",
  "no Stripe wiring",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const listingsRoute = read("app/api/clasificados/autos/listings/route.ts");
const contract = read("app/lib/clasificados/autos/autosPublishApiContract.ts");
const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");

assert(listingsRoute.includes('export const runtime = "nodejs"'), "listings route uses nodejs runtime");
assert(listingsRoute.includes("detectAutosHeavyTransport"), "listings route detects heavy media");
assert(listingsRoute.includes("buildAutosListingApiSuccessPayload"), "listings route returns structured success");
assert(contract.includes("AUTOS_SUPABASE_INSERT_FAILED"), "contract defines Supabase insert error");
assert(confirm.includes("autosConfirmErrorMessage"), "confirm maps API error codes");
assert(confirm.includes("prepareAutosListingForApiTransport"), "confirm strips heavy media before API");

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const preExistingUnrelatedParallelWork = new Set([
  "scripts/autos-price-disclosure-audit.ts",
  "scripts/autos-final-pre-qa-smoke-proof-audit.ts",
  "scripts/autos-landing-results-cross-nav-audit.ts",
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
]);

const protectedCategoryPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/clases/",
  "app/(site)/clasificados/comunidad/",
  "app/(site)/clasificados/mascotas",
  "app/(site)/clasificados/busco/",
  "app/(site)/clasificados/viajes/",
  "supabase/migrations/",
  "app/lib/stripe/",
  "app/api/stripe/",
];

const lockedCtaFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-working-category-publish-pattern-rescue-audit.ts",
  "app/lib/clasificados/autos/autosPublishApiContract.ts",
  "app/lib/clasificados/autos/autosListingPayloadPersistence.ts",
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/api/clasificados/autos/listings/route.ts",
  "app/api/clasificados/autos/listings/[id]/route.ts",
  "app/api/clasificados/autos/checkout/route.ts",
  "app/api/clasificados/autos/publish-options/route.ts",
  "app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
]);

const allowedPrefixes = [
  "app/api/clasificados/autos/",
  "app/lib/clasificados/autos/",
  "app/(site)/publicar/autos/",
];

const gateChanged = changedFiles.filter((f) => !preExistingUnrelatedParallelWork.has(f));
for (const file of gateChanged) {
  const allowed = allowedExact.has(file) || allowedPrefixes.some((p) => file.startsWith(p));
  assert(allowed, `modified file outside Autos rescue scope: ${file}`);
  assert(!lockedCtaFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!protectedCategoryPrefixes.some((p) => file.startsWith(p)), `working category file modified: ${file}`);
  assert(!/migrations/i.test(file), `migration file modified: ${file}`);
}

const pkg = read("package.json");
assert(pkg.includes('"autos:working-category-publish-pattern-rescue-audit"'), "package.json registers rescue audit");

const diff = git("git diff -U0");
const addedLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("autos-working-category-publish-pattern-rescue-audit.ts"))
  .filter((line) => !line.includes("AUTOS_WORKING_CATEGORY_PUBLISH_PATTERN_RESCUE_AUDIT.md"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedLines.some((line) => line.includes(term)), `prohibited fake metric string: ${term}`);
}

const staged = git("git diff --cached --name-only").trim();
assert(!staged, "no staged files");

if (failures.length) {
  console.error("AUTOS WORKING CATEGORY PUBLISH PATTERN RESCUE audit failed:");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("AUTOS WORKING CATEGORY PUBLISH PATTERN RESCUE audit passed");
