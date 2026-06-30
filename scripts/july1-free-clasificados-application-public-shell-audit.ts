import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/clasificados/JULY1_FREE_CLASIFICADOS_APPLICATION_PUBLIC_SHELL_AUDIT.md");
const sidebarPath = path.join(root, "app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar.tsx");
const jobsQuickDraftPath = path.join(root, "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts");
const jobsVideoPath = path.join(root, "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx");
const jobsPublishPath = path.join(root, "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts");
const jobsQuickDetailPath = path.join(root, "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx");

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
const jobsQuickDraft = readRequired(jobsQuickDraftPath);
const jobsVideo = readRequired(jobsVideoPath);
const jobsPublish = readRequired(jobsPublishPath);
const jobsQuickDetail = readRequired(jobsQuickDetailPath);

for (const category of ["Empleos", "Mascotas y Perdidos", "Clases", "Busco", "Comunidad/Eventos"]) {
  if (!audit.includes(category)) fail(`Audit file does not mention ${category}`);
}

if (!audit.includes("| Requirement | PASS/FIXED/BLOCKED | Evidence |")) {
  fail("Audit PASS/FIXED/BLOCKED table missing");
}

if (!/READY TO COMMIT THIS GATE:\s*(YES|NO)/.test(audit)) {
  fail("READY TO COMMIT value missing from audit");
}

if (!audit.includes("## 22. True QA packet") || !audit.includes("True QA packet was created")) {
  fail("True QA packet missing from audit");
}

for (const requiredQaFragment of [
  "/publicar/empleos/quick",
  "/publicar/mascotas-y-perdidos/quick",
  "/publicar/clases/quick",
  "/publicar/busco/quick",
  "/publicar/comunidad/quick",
  "Expected result",
]) {
  if (!audit.includes(requiredQaFragment)) fail(`True QA packet missing: ${requiredQaFragment}`);
}

for (const label of ["Share", "Copy link", "Copy info", "Compartir", "Copiar enlace", "Copiar info"]) {
  if (!audit.includes(label) && !sidebar.includes(label)) fail(`Missing utility label: ${label}`);
}

if (/Guardar|Guardado|Save|Saved/.test(sidebar)) {
  fail("Scoped sidebar still renders Save/Guardar text");
}

for (const publicShell of [
  ["community sidebar", sidebar],
  ["jobs quick detail", jobsQuickDetail],
] as const) {
  if (/Guardar|Guardado|Save|Saved/.test(publicShell[1])) {
    fail(`${publicShell[0]} still renders Save/Guardar text`);
  }
}

if (!jobsQuickDraft.includes("videoUrls: string[]") || !jobsQuickDraft.includes("videoUrl: videoUrls[0]")) {
  fail("Jobs quick draft does not expose canonical videoUrls with legacy videoUrl mirroring");
}

if (!jobsPublish.includes("videoUrls: vids") || !jobsPublish.includes("slice(0, 4)")) {
  fail("Jobs publish snapshot does not persist up to 4 videoUrls");
}

if (!jobsVideo.includes("maxUrls = 4") || !jobsVideo.includes("duplicateUrl") || !jobsVideo.includes("videoUrls")) {
  fail("Jobs video field does not support up to 4 URLs with duplicate handling");
}

if (!jobsVideo.includes("External video URL only") || jobsVideo.includes('type="file"')) {
  fail("Jobs video field is not external-URL-only");
}

if (/Mux|direct-upload|direct upload|videoUpload|accept="video/.test(jobsVideo)) {
  fail("Jobs video field references Mux/direct/local video upload");
}

if (!audit.includes("Community/Event Hub") || !audit.includes("Community/Event Hub applied only to Comunidad/Eventos")) {
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
