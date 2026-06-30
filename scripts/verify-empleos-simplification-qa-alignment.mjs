import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  audit: "app/lib/clasificados/EMPLEOS_SIMPLIFICATION_QA_ALIGNMENT_AUDIT.md",
  packageJson: "package.json",
  publicarHub: "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
  landingClient: "app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx",
  landingHero: "app/(site)/clasificados/empleos/components/landing/HeroAndSearch.tsx",
  landingEmployer: "app/(site)/clasificados/empleos/components/landing/LatestJobsAndEmployer.tsx",
  refineBand: "app/(site)/clasificados/empleos/components/landing/RefineSearchBand.tsx",
  legacyDetail: "app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx",
  resultsView: "app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx",
  resultCard: "app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx",
  engagementRow: "app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx",
  quickForm: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  quickDraft: "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  videoField: "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx",
  publishEnvelope: "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts",
};

function fail(message) {
  console.error(`EMPLEOS SIMPLIFICATION QA ALIGNMENT FAILED: ${message}`);
  process.exit(1);
}

function read(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) fail(`Missing required file: ${rel}`);
  return readFileSync(abs, "utf8");
}

const audit = read(files.audit);
const packageJson = read(files.packageJson);
const publicarHub = read(files.publicarHub);
const landingClient = read(files.landingClient);
const landingHero = read(files.landingHero);
const landingEmployer = read(files.landingEmployer);
const refineBand = read(files.refineBand);
const legacyDetail = read(files.legacyDetail);
const resultsView = read(files.resultsView);
const resultCard = read(files.resultCard);
const engagementRow = read(files.engagementRow);
const quickForm = read(files.quickForm);
const quickDraft = read(files.quickDraft);
const videoField = read(files.videoField);
const publishEnvelope = read(files.publishEnvelope);

for (const fragment of [
  "Product decision summary",
  "Current Empleos lane map",
  "$24.99",
  "30 days",
  "No Save/Guardar",
  "No fake applicants/messages/resume tools",
  "videoUrls",
  "READY TO COMMIT THIS GATE:",
  "| Requirement | PASS/FIXED/BLOCKED | Evidence |",
]) {
  if (!audit.includes(fragment)) fail(`Audit missing required fragment: ${fragment}`);
}

if (!packageJson.includes('"verify:empleos-simplification-qa-alignment": "node scripts/verify-empleos-simplification-qa-alignment.mjs"')) {
  fail("package.json script missing");
}

if (!publicarHub.includes("$24.99 por 30 días") || !publicarHub.includes("$24.99 for 30 days")) {
  fail("Public Empleos entry does not show bilingual $24.99 / 30 days copy");
}

for (const forbidden of ["Trabajo premium", "Feria de empleo", "Quick job", "Premium job", "Job fair"]) {
  if (publicarHub.includes(forbidden)) fail(`Public Empleos entry still exposes lane chooser copy: ${forbidden}`);
}

if (landingClient.includes("JobFairLandingBanner")) {
  fail("Empleos landing still promotes the public job-fair banner");
}

if (!landingEmployer.includes("Post a job — $24.99") || !landingEmployer.includes("Publicar empleo — $24.99")) {
  fail("Empleos landing employer CTA is not aligned to one $24.99 job ad");
}

for (const forbiddenResultsCopy of ["Publish lane", "Flujo de publicación", "Job fair", "Feria", "Premium business", "Negocio premium", "Quick apply", "Aplicación rápida"]) {
  if (
    resultsView.includes(forbiddenResultsCopy) ||
    resultCard.includes(forbiddenResultsCopy) ||
    landingHero.includes(forbiddenResultsCopy) ||
    refineBand.includes(forbiddenResultsCopy) ||
    legacyDetail.includes(forbiddenResultsCopy)
  ) {
    fail(`Public Empleos results still expose old launch confusion: ${forbiddenResultsCopy}`);
  }
}

if (engagementRow.includes("LeonixSaveButton") || engagementRow.includes("recordSaveEvent")) {
  fail("Public Empleos engagement row still renders Save behavior");
}

if (!quickForm.includes("$24.99 por 30 días") || !quickForm.includes("Post a job")) {
  fail("Quick launch form does not show simplified pricing/product copy");
}

if (quickForm.includes("Screener questions") || quickForm.includes("Preguntas filtro") || quickForm.includes("internal apply form")) {
  fail("Quick launch form still exposes applicant/screener platform language");
}

if (quickForm.includes("saveDraftCta={copy.finalStep.saveDraftCta")) {
  fail("Quick launch form still renders Save draft CTA");
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
}

const changedContents = changed
  .filter((file) => existsSync(path.join(root, file)))
  .map((file) => readFileSync(path.join(root, file), "utf8"))
  .join("\n");

if (/checkout\.sessions|stripe\.checkout|payment_intent|Stripe checkout/i.test(changedContents)) {
  fail("Changed files appear to add Stripe/payment enforcement");
}

console.log("EMPLEOS SIMPLIFICATION QA ALIGNMENT PASSED");
