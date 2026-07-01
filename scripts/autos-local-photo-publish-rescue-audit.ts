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

const auditPath = "app/lib/clasificados/autos/AUTOS_LOCAL_PHOTO_PUBLISH_RESCUE_AUDIT.md";
assert(exists(auditPath), "local photo rescue audit file exists");

const audit = read(auditPath);
for (const term of [
  "POST /api/clasificados/autos/listings",
  "400",
  "local media",
  "autos_classifieds_listings",
  "SQL",
  "Servicios",
  "Rentas",
  "durable HTTPS",
  "local photos upload before POST",
  "local videos remain blocked",
  "no Mux",
  "server guard remains safety net",
  "Privado",
  "Negocios",
  "public detail",
  "results card",
  "dashboard thumbnail",
  "no blob/data",
  "no Stripe touched",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const uploadRoute = read("app/api/clasificados/autos/media/draft-photo-upload/route.ts");
const prepare = read("app/lib/clasificados/autos/autosDraftPhotoPublishPrepare.ts");
const confirm = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
const listingsRoute = read("app/api/clasificados/autos/listings/route.ts");
const contract = read("app/lib/clasificados/autos/autosPublishApiContract.ts");

assert(uploadRoute.includes("@vercel/blob"), "autos draft photo upload uses Vercel Blob");
assert(uploadRoute.includes("clasificados/autos/drafts"), "autos blob path prefix");
assert(prepare.includes("resolveAutosDraftPhotosForPublish"), "client photo prepare export");
assert(prepare.includes("/api/clasificados/autos/media/draft-photo-upload"), "client upload path");
assert(confirm.includes("uploading_photos"), "confirm uploading_photos phase");
assert(confirm.includes("resolveAutosDraftPhotosForPublish"), "confirm calls photo prepare");
assert(confirm.includes("Estamos preparando tus fotos"), "confirm ES uploading copy");
assert(listingsRoute.includes("detectAutosLocalVideoTransport"), "listings route local video guard");
assert(listingsRoute.includes("detectAutosHeavyTransport"), "listings route heavy media safety net");
assert(contract.includes("LOCAL_VIDEO_URL_REQUIRED"), "contract local video error code");

const fakeMetricPatterns = [
  /fake.*success/i,
  /fake.*paid/i,
  /fake.*analytics/i,
  /fake.*dashboard.*count/i,
];
for (const file of [prepare, confirm, uploadRoute]) {
  for (const pat of fakeMetricPatterns) {
    assert(!pat.test(file), `no fake metrics string in ${file.slice(0, 40)}`);
  }
}

const changedFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const protectedCategoryPrefixes = [
  "app/(site)/clasificados/en-venta/",
  "app/(site)/publicar/en-venta/",
  "app/api/clasificados/en-venta/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/publicar/rentas/",
  "app/api/clasificados/rentas/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/publicar/servicios/",
  "app/api/clasificados/servicios/",
  "app/(site)/clasificados/bienes-raices/",
  "app/api/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/api/clasificados/empleos/",
  "supabase/migrations/",
  "app/lib/stripe/",
  "app/api/stripe/",
];

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-local-photo-publish-rescue-audit.ts",
  "app/lib/clasificados/autos/autosPublishMediaTransport.ts",
  "app/lib/clasificados/autos/autosDraftPhotoPublishPrepare.ts",
  "app/lib/clasificados/autos/autosPublishApiContract.ts",
  "app/lib/clasificados/autos/autosListingPayloadPersistence.ts",
  "app/api/clasificados/autos/media/draft-photo-upload/route.ts",
  "app/api/clasificados/autos/listings/route.ts",
  "app/api/clasificados/autos/listings/[id]/route.ts",
  "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  "app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts",
  "app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts",
]);

const allowedPrefixes = [
  "app/api/clasificados/autos/",
  "app/lib/clasificados/autos/",
  "app/(site)/publicar/autos/",
];

const autosGateFiles = changedFiles.filter(
  (f) => allowedExact.has(f) || allowedPrefixes.some((p) => f.startsWith(p)),
);

for (const f of autosGateFiles) {
  if (protectedCategoryPrefixes.some((p) => f.startsWith(p))) {
    failures.push(`working category file modified by this gate: ${f}`);
  }
}

const pkg = read("package.json");
assert(pkg.includes('"autos:local-photo-publish-rescue-audit"'), "package.json registers local photo rescue audit");

const staged = git("git diff --cached --name-only").trim();
assert(!staged, "no staged files");

if (failures.length) {
  console.error("AUTOS LOCAL PHOTO PUBLISH RESCUE AUDIT FAILED:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("AUTOS LOCAL PHOTO PUBLISH RESCUE AUDIT PASSED");
