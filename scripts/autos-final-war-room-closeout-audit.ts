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

const auditPath = "app/lib/clasificados/autos/AUTOS_PRIVADO_FINAL_SURGICAL_LAUNCH_AUDIT.md";
const audit = exists(auditPath) ? read(auditPath) : "";
assert(exists(auditPath), "final Privado audit file exists");
assert(audit.includes("| Requirement                                                   | TRUE/FALSE/UNKNOWN | Evidence |"), "TRUE/FALSE/UNKNOWN table exists");

for (const term of [
  "Privado",
  "Negocios",
  "Listing Contact Card",
  "URL-only",
  "Stripe",
  "dashboard",
  "admin",
  "analytics",
  "Like",
  "Share",
  "READY TO COMMIT AND PUSH",
]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}

const statusFiles = git("git status --short")
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/").replace(/^(?:A|M|D|R|C|U|\?\?)\s+/, ""))
  .filter(Boolean);

const allowedExact = new Set([
  "package.json",
  auditPath,
  "scripts/autos-application-war-room-audit.ts",
  "scripts/autos-final-war-room-closeout-audit.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx",
]);

const allowedPrefixes = [
  "app/(site)/publicar/autos/",
  "app/(site)/clasificados/autos/",
  "app/lib/clasificados/autos/",
  "app/api/clasificados/autos/",
  "app/api/admin/autos/",
  "e2e/autos/",
];

const lockedCtaFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

const protectedPrefixes = [
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
  "app/(site)/magazine/",
  "app/(site)/noticias/",
  "supabase/",
];

for (const file of statusFiles) {
  const allowed = allowedExact.has(file) || allowedPrefixes.some((prefix) => file.startsWith(prefix));
  assert(allowed, `modified file outside Autos final gate scope: ${file}`);
  assert(!lockedCtaFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!protectedPrefixes.some((prefix) => file.startsWith(prefix)), `protected file modified: ${file}`);
  assert(!/migrations/i.test(file), `migration file modified: ${file}`);
}

const privadoContactPath = "app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx";
const privadoFormPath = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";
const confirmPath = "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx";
const dashboardPath = "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx";
const adminAutosPath = "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx";
const verifyInternalPath = "app/api/clasificados/autos/checkout/verify-internal/route.ts";

const privadoContact = read(privadoContactPath);
const privadoForm = read(privadoFormPath);
const confirm = read(confirmPath);
const dashboard = read(dashboardPath);
const adminAutos = read(adminAutosPath);
const verifyInternal = read(verifyInternalPath);

assert(privadoContact.includes("buildPrivadoSiteMessageHref"), "Privado renders Leonix message CTA");
assert(!/SiFacebook|SiInstagram|SiTiktok|SiYoutube|dealerSocials|socialRows/.test(privadoContact), "Privado contact card does not render dealer/social hub");
assert(!privadoForm.includes("dealerSocials"), "Privado application does not collect seller social links");
assert(confirm.includes("persistWarnings") && confirm.includes("Photo / file notice"), "publish confirm surfaces persistence warnings");
assert(dashboard.includes("Anuncios Autos") && dashboard.includes("hasNegociosRows"), "Autos dashboard empty/state is lane-aware");
assert(adminAutos.includes("qRaw ? 500 : queueLimit"), "Autos admin search widens when q is present");
assert(!adminAutos.includes("staffEditBoardHref={`/dashboard/mis-anuncios/${encodeURIComponent(r.id)}`"), "Autos admin does not pass unsafe paid-Autos dashboard manage href");
assert(verifyInternal.includes("isAutosNegociosQaPublishAllowlisted"), "Negocios QA allowlist success verification supported");

const diff = git("git diff -U0");
const addedLines = diff
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("AUTOS_PRIVADO_FINAL_SURGICAL_LAUNCH_AUDIT.md"))
  .filter((line) => !line.includes("autos-final-war-room-closeout-audit.ts"));

for (const term of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  assert(!addedLines.some((line) => line.includes(term)), `fake metric string added: ${term}`);
}

for (const phrase of ["uploaded to Mux", "hosted by Leonix", "processed by Leonix"]) {
  assert(!addedLines.some((line) => line.toLowerCase().includes(phrase.toLowerCase())), `forbidden video promise added: ${phrase}`);
}

if (failures.length) {
  console.error("AUTOS FINAL WAR ROOM CLOSEOUT audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS FINAL WAR ROOM CLOSEOUT audit passed");
