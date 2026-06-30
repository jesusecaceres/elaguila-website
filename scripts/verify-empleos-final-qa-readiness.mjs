import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  audit: "app/lib/clasificados/EMPLEOS_FINAL_QA_READINESS_AUDIT.md",
  packageJson: "package.json",
  hub: "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
  quickForm: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  feriaForm: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
  quickPreview: "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx",
  feriaPreview: "app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx",
  laneDetail: "app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx",
  publishApi: "app/api/clasificados/empleos/listings/route.ts",
  dbServer: "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts",
  analytics: "app/(site)/clasificados/empleos/lib/recordEmpleosGlobalAnalytics.ts",
  ctaTracking: "app/(site)/clasificados/empleos/lib/empleosCtaTracking.ts",
  engagementRow: "app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx",
  videoField: "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx",
  quickDraft: "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  twoPathVerifier: "scripts/verify-empleos-two-path-reroute-preview.mjs",
  simplificationVerifier: "scripts/verify-empleos-simplification-qa-alignment.mjs",
  freeShellAudit: "scripts/july1-free-clasificados-application-public-shell-audit.ts",
};

function fail(message) {
  console.error(`EMPLEOS FINAL QA READINESS FAILED: ${message}`);
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
const quickPreview = read(files.quickPreview);
const feriaPreview = read(files.feriaPreview);
const laneDetail = read(files.laneDetail);
const publishApi = read(files.publishApi);
const dbServer = read(files.dbServer);
const analytics = read(files.analytics);
const engagementRow = read(files.engagementRow);
const videoField = read(files.videoField);
const quickDraft = read(files.quickDraft);

for (const fragment of [
  "READY FOR MANUAL QA:",
  "paid job ad",
  "$24.99",
  "Job Fair free",
  "Supabase/table readiness",
  "analytics truth",
  "internal UUID",
  "Leonix ID for display",
  "No Save/Guardar",
  "no Mux/direct upload",
  "no fake applicants/messages/resume tools",
  "Stripe not touched",
  "READY TO COMMIT THIS GATE:",
  "| Requirement | PASS/FIXED/BLOCKED | Evidence |",
]) {
  if (!audit.includes(fragment)) fail(`Audit missing required fragment: ${fragment}`);
}

if (!packageJson.includes('"verify:empleos-final-qa-readiness": "node scripts/verify-empleos-final-qa-readiness.mjs"')) {
  fail("package.json script missing");
}

for (const script of [
  '"verify:empleos-two-path-reroute-preview"',
  '"verify:empleos-simplification-qa-alignment"',
  '"july1:free-clasificados-shell-audit"',
]) {
  if (!packageJson.includes(script)) fail(`package.json missing dependency script: ${script}`);
}

for (const rel of [files.twoPathVerifier, files.simplificationVerifier, files.freeShellAudit]) {
  if (!existsSync(path.join(root, rel))) fail(`Missing verifier/audit dependency: ${rel}`);
}

for (const forbidden of ["Trabajo premium", "Trabajo rápido", "Quick job", "Premium job", "langToggle"]) {
  if (hub.includes(forbidden)) fail(`Checkpoint reintroduced old lane confusion: ${forbidden}`);
}

if (!hub.includes("Publicar feria de empleo") || !hub.includes("$24.99 por 30 días")) {
  fail("Checkpoint missing two-path paid/free launch cards");
}

if (quickDraft.includes("city: EMPLEOS_INTERNAL_FILTER_REGION")) {
  fail("Paid job draft still defaults city to internal NorCal filter region");
}

if (!quickForm.includes("$24.99 por 30 días") || quickForm.includes("saveDraftCta={copy.finalStep.saveDraftCta")) {
  fail("Paid job form missing pricing copy or still renders Save draft CTA");
}

if (!feriaForm.includes("Gratis") || !feriaForm.includes("saveDraftCta={null}")) {
  fail("Job fair form missing free copy or Save draft CTA guard");
}

if (quickPreview.includes("#2563EB") || feriaPreview.includes("#2563EB")) {
  fail("Preview no-draft fallback still uses generic blue link styling");
}

if (!laneDetail.includes('job.publicationLane !== "feria"') || !laneDetail.includes("EmpleosApplyForm")) {
  fail("Public lane detail missing feria-specific apply guard");
}

if (!publishApi.includes("upsertEmpleosListingFromEnvelope") || !dbServer.includes('from("empleos_public_listings")')) {
  fail("Publish path is not wired to empleos_public_listings");
}

if (!analytics.includes("source_id: sourceId") || !analytics.includes("empleos_public_listings")) {
  fail("Analytics pipeline missing internal UUID source_table wiring");
}

if (!analytics.includes("leonix_ad_id") || !analytics.includes("canonical_ad_id")) {
  fail("Analytics missing Leonix ID display mapping");
}

if (engagementRow.includes("LeonixSaveButton") || engagementRow.includes("recordSaveEvent")) {
  fail("Public Empleos detail reintroduced Save behavior");
}

if (!quickDraft.includes("videoUrls: string[]") || videoField.includes('type="file"')) {
  fail("Jobs videoUrls contract broken or file input reintroduced");
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

console.log("EMPLEOS FINAL QA READINESS PASSED");
