import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  audit: "app/lib/clasificados/EMPLEOS_GLOBAL_LOCATION_READINESS_AUDIT.md",
  packageJson: "package.json",
  quickForm: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  feriaForm: "app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx",
  quickDraft: "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts",
  feriaDraft: "app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts",
  snapshots: "app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts",
  envelope: "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts",
  hydrate: "app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts",
  search: "app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts",
  hero: "app/(site)/clasificados/empleos/components/landing/HeroAndSearch.tsx",
  results: "app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx",
  dashboard: "app/(site)/dashboard/empleos/page.tsx",
  admin: "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx",
  videoField: "app/(site)/publicar/empleos/shared/media/EmpleosVideoDraftField.tsx",
  engagementRow: "app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx",
  publicarHub: "app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx",
};

function fail(message) {
  console.error(`EMPLEOS GLOBAL LOCATION READINESS FAILED: ${message}`);
  process.exit(1);
}

function read(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) fail(`Missing required file: ${rel}`);
  return readFileSync(abs, "utf8");
}

const audit = read(files.audit);
const packageJson = read(files.packageJson);
const quickForm = read(files.quickForm);
const feriaForm = read(files.feriaForm);
const quickDraft = read(files.quickDraft);
const feriaDraft = read(files.feriaDraft);
const snapshots = read(files.snapshots);
const envelope = read(files.envelope);
const hydrate = read(files.hydrate);
const search = read(files.search);
const hero = read(files.hero);
const results = read(files.results);
const dashboard = read(files.dashboard);
const admin = read(files.admin);
const videoField = read(files.videoField);
const engagementRow = read(files.engagementRow);
const publicarHub = read(files.publicarHub);

for (const fragment of [
  "City is open input",
  "State/province/region is open/global",
  "Postal code supports global values",
  "Country field exists or was implemented",
  "Address line 2 exists where address exists",
  "Landing/results search/filter result",
  "Dashboard/admin result",
  "No Stripe touched",
  "READY FOR MANUAL QA:",
  "READY TO COMMIT THIS GATE:",
]) {
  if (!audit.includes(fragment)) fail(`Audit missing required fragment: ${fragment}`);
}

if (!packageJson.includes('"verify:empleos-global-location-readiness": "node scripts/verify-empleos-global-location-readiness.mjs"')) {
  fail("package.json script missing");
}

for (const [label, content] of [
  ["paid job form", quickForm],
  ["job fair form", feriaForm],
  ["quick draft", quickDraft],
  ["feria draft", feriaDraft],
  ["publish snapshots", snapshots],
  ["publish envelope", envelope],
  ["edit hydration", hydrate],
]) {
  for (const token of ["addressLine2", "stateRegion", "postalCode", "country"]) {
    if (!content.includes(token)) fail(`${label} missing ${token}`);
  }
}

if (quickDraft.includes("city: EMPLEOS_INTERNAL_FILTER_REGION") || feriaDraft.includes("city: EMPLEOS_INTERNAL_FILTER_REGION")) {
  fail("A launch draft still defaults city to NorCal");
}

if (quickForm.includes("NorCal") || feriaForm.includes("NorCal")) {
  fail("Form copy or values still force NorCal");
}

if (!quickForm.includes("Estado / provincia / región") || !quickForm.includes("State / province / region")) {
  fail("Paid job form missing global state/region labels");
}
if (!feriaForm.includes("Estado / provincia / región") || !feriaForm.includes("State / province / region")) {
  fail("Job fair form missing global state/region labels");
}

if (!search.includes("normalizePostalCode") || search.includes("normalizeZip5") || search.includes("zip5")) {
  fail("Results search still uses ZIP-only normalization");
}
if (!search.includes("j.country") || !search.includes("stateRegion") || !search.includes("employerAddressLine2")) {
  fail("Results search missing global location fields");
}
if (hero.includes("sampleUsStateSelectOptions") || hero.includes("normalizeZip5") || hero.includes('inputMode="numeric"')) {
  fail("Landing search still uses US-only state/ZIP UI");
}
if (results.includes("normalizeZip5") || results.includes("5 digits") || results.includes("all of California")) {
  fail("Results filters still use old ZIP/California copy");
}

if (!dashboard.includes("locationLine") || !dashboard.includes("listing_snapshot")) {
  fail("Owner dashboard missing clean location output");
}
if (!admin.includes("location_line")) {
  fail("Admin output missing clean location output");
}

if (!quickDraft.includes("videoUrls: string[]") || !envelope.includes("videoUrls: vids")) {
  fail("Jobs videoUrls contract regressed");
}
if (videoField.includes('type="file"') || /Mux|direct-upload|direct upload|accept="video/.test(videoField)) {
  fail("Jobs video field reintroduced local/Mux/direct upload behavior");
}
if (engagementRow.includes("LeonixSaveButton") || engagementRow.includes("recordSaveEvent")) {
  fail("Public Empleos reintroduced Save/Guardar behavior");
}
for (const forbidden of ["Trabajo premium", "Trabajo rápido", "Quick job", "Premium job", "const premiumHref"]) {
  if (publicarHub.includes(forbidden)) fail(`Public publish hub reintroduced lane confusion: ${forbidden}`);
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

console.log("EMPLEOS GLOBAL LOCATION READINESS PASSED");
