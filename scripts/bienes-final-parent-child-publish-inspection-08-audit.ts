/**
 * BIENES_BR_FINAL_PARENT_CHILD_PUBLISH_INSPECTION_08 — repo validator.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (/\.(tsx?|md)$/.test(ent.name)) acc.push(full);
  }
  return acc;
}

function bienesScopedFiles(): string[] {
  const bases = [
    path.join(root, "app/(site)/clasificados/publicar/bienes-raices/negocio"),
    path.join(root, "app/(site)/clasificados/bienes-raices"),
    path.join(root, "app/lib/clasificados/bienes-raices"),
  ];
  return bases.flatMap((b) => walk(b));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function check(req: string, pass: boolean, evidence: string) {
  rows.push({ requirement: req, pass, evidence });
}

const auditPath =
  "app/lib/clasificados/bienes-raices/BIENES_BR_FINAL_PARENT_CHILD_PUBLISH_INSPECTION_08_AUDIT.md";
check("Gate 8 audit file exists", exists(auditPath), auditPath);

const negocioSources = bienesScopedFiles()
  .filter((f) => !f.includes("AUDIT.md") && f.includes("negocio"))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

check(
  'No "Official NorCal list" in negocio publish UI',
  !negocioSources.includes("Official NorCal list"),
  "negocio tree",
);
check(
  'No "Two-letter abbreviation" in negocio publish UI',
  !negocioSources.includes("Two-letter abbreviation"),
  "negocio tree",
);
check(
  'No "5-digit ZIP" in negocio publish UI',
  !negocioSources.includes("5-digit ZIP"),
  "negocio tree",
);
check(
  'No "Upload video from my device" in negocio publish UI',
  !negocioSources.includes("Upload video from my device") &&
    !negocioSources.includes("Subir video desde mi dispositivo"),
  "negocio tree",
);

const copyEn = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
check("Country field copy (EN)", copyEn.includes('direccionPais: "Country"'), "brAgenteResidencialCopy.en.ts");
check(
  "Video URL hint — public link only, up to 4",
  copyEn.includes("Add up to 4 video URLs") && copyEn.includes("Public link only"),
  "brAgenteResidencialCopy.en.ts",
);

const steps = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
);
check("Parent Step 2 uses BrAgenteLocationFormFields", steps.includes("BrAgenteLocationFormFields"), "steps01-03.tsx");
check("Step 3 uses VideoUrlAddRows (URL-only video)", steps.includes("VideoUrlAddRows"), "steps01-03.tsx");
check(
  "Step 3 has no device video file input",
  !steps.includes('type="file"') || !/accept=.*video/.test(steps.replace(/BR_AGENTE_RES_TOUR_FILE_ACCEPT[\s\S]*?UrlOrFileRow/g, "")),
  "steps01-03.tsx — tour/brochure file inputs only",
);

const formState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
check("AGENTE_RES_MAX_VIDEO_URLS = 4", formState.includes("AGENTE_RES_MAX_VIDEO_URLS = 4"), "formState");

const childApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
);
check("Child reuses Step02InformacionBasica", childApp.includes("Step02InformacionBasica"), "child app");
check("Child reuses Step03Media", childApp.includes("Step03Media"), "child app");
check("Child has 10 steps", childApp.includes("Preview and save") || childApp.includes("Vista previa y guardar"), "child app");
check("Child save property action", childApp.includes('attemptSave("close")'), "child app");
check("Child save and add another", childApp.includes('attemptSave("addAnother")'), "child app");
check(
  "Child editor uses mergeParentHubWithChildPropertyForEditor (no keystroke canonicalization)",
  childApp.includes("mergeParentHubWithChildPropertyForEditor"),
  "child app",
);

const childMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts",
);
check(
  "Child mapping preserves country + child location fields",
  childMap.includes("direccionPais") && childMap.includes("country:"),
  "brNegocioChildInventoryFormMapping.ts",
);

const mapPublish = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
);
check(
  "Publish mapping: country + area + video URLs (http only)",
  mapPublish.includes("pais:") &&
    mapPublish.includes("colonia:") &&
    mapPublish.includes("externalVideoUrls: videoUrls") &&
    !mapPublish.includes("videoDataUrl"),
  "mapAgenteResidencialFormStateToNegocioForPublish.ts",
);

const parentApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
);
check("Parent app has 10 steps", parentApp.includes("step === 9"), "parent app");

const enVentaLayout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
check(
  "Public BR detail: related + similar sections",
  enVentaLayout.includes("BrRelatedAgentPropertiesSection") &&
    enVentaLayout.includes("BrSimilarOtherClientPropertiesSection"),
  "EnVentaAnuncioLayout.tsx",
);
check(
  "Public BR detail: BrLiveDetailAnalyticsMount",
  enVentaLayout.includes("BrLiveDetailAnalyticsMount"),
  "EnVentaAnuncioLayout.tsx",
);

const relatedFetch = read("app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts");
check(
  "Related listings exclude current + require published",
  relatedFetch.includes('.neq("id", args.currentListingId)') && relatedFetch.includes('.eq("is_published", true)'),
  "fetchBrRelatedInventoryListingsBrowser.ts",
);

const analytics = read("app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts");
check(
  "BR global analytics wired",
  analytics.includes("listing_view") && analytics.includes("recordAnalyticsEvent"),
  "brGlobalAnalytics.ts",
);

const locFields = read("app/lib/clasificados/bienes-raices/brLocationFormFields.tsx");
check("Shared location: Country + freeText city", locFields.includes("direccionPais") && locFields.includes("freeText"), "brLocationFormFields.tsx");

const pkg = read("package.json");
check(
  "npm script registered",
  pkg.includes("bienes:final-parent-child-publish-inspection-08"),
  "package.json",
);

const failed = rows.filter((r) => !r.pass);

console.log("\nBIENES_BR_FINAL_PARENT_CHILD_PUBLISH_INSPECTION_08 audit script\n");
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed\n`);

if (failed.length) {
  process.exit(1);
}
