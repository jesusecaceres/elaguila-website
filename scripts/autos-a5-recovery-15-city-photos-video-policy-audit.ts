/**
 * A5.RECOVERY-15 — Autos City/ZIP + Photo Reorder + External Video URL Policy audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_RECOVERY_15_CITY_PHOTOS_VIDEO_POLICY_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Dirty files reviewed before editing",
  "Autos-only scope respected",
  "Lane impact classified before edits",
  "City/ZIP implementation inspected Autos-wide",
  "Photo/media implementation inspected Autos-wide",
  "Video implementation inspected Autos-wide",
  "Negocios main accepts any city",
  "Negocios child accepts any city",
  "Privado accepts any city",
  "City helpers do not imply NorCal-only restriction",
  "No real city placeholder/helper remains",
  "ZIP persists in Negocios main",
  "ZIP persists in Negocios child",
  "ZIP persists in Privado",
  "City/ZIP map to preview/payload/search",
  "Photo reorder root cause documented",
  "Photo reorder updates canonical parent state",
  "Photo reorder uses immutable update",
  "Cover tracking remains stable",
  "Negocios main photo reorder persists",
  "Negocios child photo reorder persists",
  "Privado photo reorder persists",
  "Preview/result/publish preserve ordered photos",
  "Autos direct video file upload removed/hidden",
  "Autos archive/local video upload path removed/hidden",
  "Autos uses videoUrls array",
  "Autos allows up to 4 external video URLs",
  "Add video button validates and clears input",
  "Duplicate video URL blocked",
  "Invalid video URL blocked",
  "Negocios main videoUrls persist",
  "Negocios child videoUrls persist",
  "Privado videoUrls persist",
  "Mux/direct upload not triggered from Autos publish forms",
  "Decimal Mux duration not sent from Autos external URL flow",
  "Photos upload/grid otherwise untouched",
  "No dealer-only features added to Privado",
  "No unrelated categories touched",
  "No global Stripe/payment touched",
  "No schema/migration touched",
  "npm run build passed",
];

const CITY_COPY = [
  "Escribe la ciudad del vehículo. Si aparece una sugerencia, puedes seleccionarla",
  "Enter the vehicle city. You can select a suggestion if available",
  "Usa el código postal del vehículo para mejorar ubicación, búsqueda y filtros.",
  "Use the vehicle ZIP code to improve location, search, and filters.",
];

const VIDEO_COPY = [
  "Video opcional",
  "Puedes agregar hasta 4 enlaces de video",
  "Añadir video",
  "Límite de 4 videos alcanzado.",
  "Este video ya fue agregado.",
  "Pega un enlace válido que empiece con https://",
  "Optional video",
  "Add video",
  "4 video limit reached.",
];

const FORBIDDEN_AUTOS_PUBLISH_VIDEO = [
  "Elegir archivo de video",
  "Agrega un video corto o pega un enlace",
  "Máximo 1 video",
  "Archivo local",
  "Subir video desde archivo",
  "videoFileTab",
  "chooseVideo",
  "videoInputRef",
];

const FORBIDDEN_REAL_CITY = ["New York", "San Jose", "Los Angeles"];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/bienes-raices/",
];

const AUTOS_PUBLISH_PATHS = [
  "app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx",
  "app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx",
  "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
  "app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TABLE A — City \/ ZIP/i, "TABLE A required");
  assert.match(auditText, /TABLE B — Photo Reorder/i, "TABLE B required");
  assert.match(auditText, /TABLE C — External Video URLs/i, "TABLE C required");
  assert.match(auditText, /## TRUE\/FALSE table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    for (const table of ["TABLE A", "TABLE B", "TABLE C"]) {
      const start = auditText.indexOf(table);
      assert.ok(start >= 0, `${table} missing`);
      const section = auditText.slice(start, auditText.indexOf("## TRUE/FALSE table"));
      assert.ok(!section.includes("| FALSE |"), `No FALSE in ${table} when GREEN`);
    }
    const gateSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!gateSection.includes("| FALSE |"), "No FALSE gate rows when GREEN");
    for (const row of GATE_ROWS) {
      assert.match(
        auditText,
        new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*TRUE\\s*\\|`),
        `Audit row must be TRUE when GREEN: ${row}`,
      );
    }
  }

  const locationCopy = read("app/lib/clasificados/autos/autosVehicleLocationCopy.ts");
  const videoCopy = read("app/lib/clasificados/autos/autosExternalVideoUrlsCopy.ts");
  const videoField = read("app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx");
  const mediaManager = read("app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx");
  const vehicleSteps = read("app/(site)/publicar/autos/negocios/components/AutosNegociosVehicleApplicationSteps.tsx");
  const privado = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const heroImages = read("app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages.ts");
  const draftDefaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  const idbRefs = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts");
  const additional = read("app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts");
  const muxPrepare = read("app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts");
  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  const payloadPersist = read("app/lib/clasificados/autos/autosListingPayloadPersistence.ts");
  const mapPublic = read("app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts");

  for (const phrase of CITY_COPY) {
    assert.ok(locationCopy.includes(phrase), `City/ZIP copy missing: ${phrase}`);
  }
  for (const phrase of VIDEO_COPY) {
    const pool = `${videoCopy}\n${videoField}`;
    assert.ok(pool.includes(phrase), `Video copy missing: ${phrase}`);
  }

  assert.ok(vehicleSteps.includes("freeText"), "Negocios vehicle steps must allow freeText city");
  assert.ok(privado.includes("freeText"), "Privado must allow freeText city");
  assert.ok(!vehicleSteps.includes("cityNorCal"), "Negocios steps must not render cityNorCal helper");
  assert.ok(!privado.includes("cityNorCal"), "Privado must not render cityNorCal helper");

  const publishPool = AUTOS_PUBLISH_PATHS.map(read).join("\n");
  for (const bad of FORBIDDEN_AUTOS_PUBLISH_VIDEO) {
    assert.ok(!publishPool.includes(bad), `Forbidden autos publish video string: ${bad}`);
  }
  for (const city of FORBIDDEN_REAL_CITY) {
    assert.ok(!publishPool.includes(city), `Real city placeholder/helper must not appear: ${city}`);
  }

  assert.ok(mediaManager.includes("normalizeMediaImagesOrder"), "Media manager uses normalizeMediaImagesOrder");
  assert.ok(mediaManager.includes("heroImages: cleaned.map"), "commitImages syncs heroImages order");
  assert.ok(mediaManager.includes("AutosExternalVideoUrlsField"), "External video URL manager wired");
  assert.ok(!mediaManager.includes("uploadAutosDraftVideoFileToMux"), "No Mux upload in media manager");
  assert.ok(heroImages.includes("export function normalizeMediaImagesOrder"), "Shared media order normalizer");
  assert.ok(draftDefaults.includes("normalizeMediaImagesOrder"), "Draft normalize reindexes media");
  assert.ok(idbRefs.includes("normalizeMediaImagesOrder"), "IDB rehydrate preserves media order");
  assert.ok(additional.includes("videoUrls"), "Child inventory supports videoUrls");
  assert.ok(listingType.includes("videoUrls?: string[]"), "Listing type has videoUrls");
  assert.ok(!muxPrepare.includes("uploadAutosDraftVideoFileToMux"), "Mux upload removed from publish prepare");
  assert.ok(payloadPersist.includes("videoUrls"), "Payload persistence stores videoUrls");
  assert.ok(mapPublic.includes("L.city"), "Search blurb includes city");

  assert.ok(!privado.includes("additionalInventoryVehicles"), "Privado must not contain dealer inventory strings");

  const changed = changedFiles();
  for (const f of changed) {
    const norm = f.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Out-of-scope file changed: ${norm}`);
    }
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes("autos:a5-recovery-15-city-photos-video-policy-audit"),
    "package.json must register recovery-15 audit script",
  );

  console.log("autos:a5-recovery-15-city-photos-video-policy-audit OK");
}

run();
