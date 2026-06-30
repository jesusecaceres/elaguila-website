import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/clasificados/JULY1_FREE_CLASIFICADOS_APPLICATION_PUBLIC_SHELL_AUDIT.md");
const sidebarPath = path.join(root, "app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar.tsx");
const jobsVideoPath = path.join(root, "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx");

function fail(message: string): never {
  console.error(`JULY1 FREE CLASIFICADOS AUDIT FAILED: ${message}`);
  process.exit(1);
}

function readRequired(filePath: string): string {
  if (!existsSync(filePath)) fail(`Missing required file: ${path.relative(root, filePath)}`);
  return readFileSync(filePath, "utf8");
}

const audit = readRequired(auditPath);
const sidebar = readRequired(sidebarPath);
const jobsVideo = readRequired(jobsVideoPath);

for (const category of ["Empleos", "Mascotas y Perdidos", "Clases", "Busco", "Comunidad/Eventos"]) {
  if (!audit.includes(category)) fail(`Audit file does not mention ${category}`);
}

if (!audit.includes("| Requirement | PASS/FIXED/BLOCKED | Evidence |")) {
  fail("Audit PASS/FIXED/BLOCKED table missing");
}

for (const label of ["Share", "Copy link", "Copy info", "Compartir", "Copiar enlace", "Copiar info"]) {
  if (!audit.includes(label) && !sidebar.includes(label)) fail(`Missing utility label: ${label}`);
}

if (/Guardar|Guardado|Save|Saved/.test(sidebar)) {
  fail("Scoped sidebar still renders Save/Guardar text");
}

if (!jobsVideo.includes("External video URL only") || jobsVideo.includes('type="file"')) {
  fail("Jobs video field is not external-URL-only");
}

if (!audit.includes("Community/Event Hub") || !audit.includes("Comunidad/Eventos")) {
  fail("Community/Event Hub decision missing from audit");
}

const changed = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

const forbiddenPatterns = [
  /^app\/\(site\)\/coming-soon/,
  /^app\/\(site\)\/coming-soon-live/,
  /^app\/\(site\)\/clasificados\/servicios/,
  /^app\/\(site\)\/clasificados\/restaurantes/,
  /^app\/\(site\)\/clasificados\/rentas/,
  /^app\/\(site\)\/clasificados\/autos/,
  /^app\/\(site\)\/clasificados\/bienes-raices/,
  /^app\/\(site\)\/clasificados\/en-venta/,
  /^app\/api\/stripe/,
  /^app\/api\/checkout/,
  /^app\/api\/mux\/direct-upload/,
];

for (const file of changed) {
  if (forbiddenPatterns.some((pattern) => pattern.test(file))) {
    fail(`Forbidden file modified: ${file}`);
  }
}

console.log("JULY1 FREE CLASIFICADOS AUDIT PASSED");
