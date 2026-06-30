import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  audit: "app/lib/clasificados/EMPLEOS_TWO_PATH_REROUTE_PREVIEW_AUDIT.md",
  packageJson: "package.json",
  hub: "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
  quickForm: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  feriaForm: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
  quickDraft: "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  feriaDraft: "app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts",
  videoField: "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx",
  publishEnvelope: "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts",
  resultCard: "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx",
  fairDetail: "app/(site)/clasificados/empleos/components/jobFair/EmpleoJobFairDetailPage.tsx",
  dashboard: "app/(site)/dashboard/empleos/page.tsx",
  admin: "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
  engagementRow: "app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx",
};

function fail(message) {
  console.error(`EMPLEOS TWO-PATH REROUTE PREVIEW FAILED: ${message}`);
  process.exit(1);
}

function read(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) fail(`Missing required file: ${rel}`);
  return readFileSync(abs, "utf8");
}

const audit = read(files.audit);
const packageJson = read(files.packageJson);
const hub = read(files.hub);
const quickForm = read(files.quickForm);
const feriaForm = read(files.feriaForm);
const quickDraft = read(files.quickDraft);
const feriaDraft = read(files.feriaDraft);
const videoField = read(files.videoField);
const publishEnvelope = read(files.publishEnvelope);
const resultCard = read(files.resultCard);
const fairDetail = read(files.fairDetail);
const dashboard = read(files.dashboard);
const admin = read(files.admin);
const engagementRow = read(files.engagementRow);

for (const fragment of [
  "paid job ad",
  "$24.99",
  "free job fair",
  "Stripe deferred",
  "job fair has no Stripe/payment requirement",
  "videoUrls protection",
  "No Save/Guardar",
  "READY TO COMMIT THIS GATE:",
  "| Requirement | PASS/FIXED/BLOCKED | Evidence |",
]) {
  if (!audit.includes(fragment)) fail(`Audit missing required fragment: ${fragment}`);
}

if (!packageJson.includes('"verify:empleos-two-path-reroute-preview": "node scripts/verify-empleos-two-path-reroute-preview.mjs"')) {
  fail("package.json script missing");
}

for (const required of [
  "Publicar empleo",
  "$24.99 por 30 días",
  "Post a job",
  "$24.99 for 30 days",
  "Publicar feria de empleo",
  "Gratis",
  "Post a job fair",
  "Free",
  "const feriaHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.feria, lang)",
  "const quickHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.quick, lang)",
  "href={quickHref}",
  "href={feriaHref}",
]) {
  if (!hub.includes(required)) fail(`Checkpoint missing required two-path fragment: ${required}`);
}

for (const forbidden of [
  "Trabajo rápido",
  "Trabajo premium",
  "Quick job",
  "Premium job",
  "const premiumHref",
  "langToggle",
  "English",
  "Español",
]) {
  if (hub.includes(forbidden)) fail(`Checkpoint still exposes forbidden chooser/language copy: ${forbidden}`);
}

if (!quickForm.includes("$24.99 por 30 días") || !quickForm.includes("$24.99 for 30 days")) {
  fail("Paid job ad form lost $24.99 / 30 days copy");
}

if (!quickForm.includes("videoUrls={state.videoUrls}") || !quickForm.includes("saveDraftCta={null}")) {
  fail("Paid job ad form lost videoUrls binding or no-Save CTA guard");
}

if (quickDraft.includes("city: EMPLEOS_INTERNAL_FILTER_REGION") || feriaDraft.includes("city: EMPLEOS_INTERNAL_FILTER_REGION")) {
  fail("A launch draft still defaults public city to the internal NorCal filter region");
}

for (const required of [
  "Publicar feria de empleo",
  "Post a job fair",
  "Gratis",
  "Free",
  "No Stripe or payment is required to post a job fair",
  "saveDraftCta={null}",
]) {
  if (!feriaForm.includes(required)) fail(`Job fair form missing free/job-fair fragment: ${required}`);
}

if (feriaForm.includes("EMPLEOS_STANDARD_CITY") || feriaForm.includes("INPUT_CITY_LOCKED")) {
  fail("Job fair form still locks city to the old standard region");
}

if (!resultCard.includes('job.publicationLane === "feria"') || !resultCard.includes("Free fair") || !resultCard.includes("View fair")) {
  fail("Results card does not distinguish free job fair rows");
}

if (!fairDetail.includes("freeBadge") || !fairDetail.includes("Gratis") || !fairDetail.includes("Free")) {
  fail("Job fair detail/preview does not surface a natural free badge");
}

if (!dashboard.includes('if (lane === "feria") return lang === "es" ? "Feria de empleo" : "Job fair"')) {
  fail("Owner dashboard does not label feria rows as Job fair");
}

if (!admin.includes('if (lane === "feria") return "Job fair"') || !admin.includes('if (lane === "quick") return "Local job ad"')) {
  fail("Admin queue does not display local job ad / job fair lane truth");
}

if (!quickDraft.includes("videoUrls: string[]") || !quickDraft.includes("videoUrl: videoUrls[0]")) {
  fail("Jobs quick draft videoUrls contract regressed");
}

if (!publishEnvelope.includes("videoUrls: vids") || !publishEnvelope.includes("slice(0, 4)")) {
  fail("Jobs publish envelope no longer protects up to 4 videoUrls");
}

if (videoField.includes('type="file"') || /Mux|direct-upload|direct upload|accept="video/.test(videoField)) {
  fail("Jobs video field reintroduced local/Mux/direct upload behavior");
}

if (engagementRow.includes("LeonixSaveButton") || engagementRow.includes("recordSaveEvent")) {
  fail("Public Empleos detail reintroduced Save behavior");
}

const changed = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

for (const file of changed) {
  if (/^supabase\/migrations\//.test(file) || /migrations\//.test(file)) {
    fail(`Migration file modified or added: ${file}`);
  }
  if (/stripe/i.test(file)) {
    fail(`Stripe-related file modified: ${file}`);
  }
  if (/app\/\(site\)\/clasificados\/(rentas|autos|servicios|restaurantes|bienes-raices|en-venta|mascotas-y-perdidos|clases|busco|comunidad)\//.test(file)) {
    fail(`Unrelated category file modified: ${file}`);
  }
}

const changedContents = changed
  .filter((file) => existsSync(path.join(root, file)))
  .filter((file) => !file.startsWith("scripts/verify-empleos-"))
  .filter((file) => !file.endsWith("_AUDIT.md"))
  .map((file) => readFileSync(path.join(root, file), "utf8"))
  .join("\n");

if (/checkout\.sessions|stripe\.checkout|payment_intent|Stripe checkout/i.test(changedContents)) {
  fail("Changed files appear to add Stripe/payment enforcement");
}

console.log("EMPLEOS TWO-PATH REROUTE PREVIEW PASSED");
