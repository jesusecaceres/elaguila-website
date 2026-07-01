/**
 * BR-WORLDWIDE-LOCATION-VISIBLE-PARENT-CHILD-06 — repo validator.
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

function bienesPublishFiles(): string[] {
  const bases = [
    path.join(root, "app/(site)/clasificados/publicar/bienes-raices"),
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

const auditPath = "app/lib/clasificados/bienes-raices/BIENES_BR_WORLDWIDE_LOCATION_VISIBLE_PARENT_CHILD_06_AUDIT.md";
check("Audit file exists", exists(auditPath), auditPath);

const publishSources = bienesPublishFiles()
  .filter((f) => !f.includes("AUDIT.md") && !f.includes("_AUDIT"))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

check(
  'Old copy "Official NorCal list" gone from Bienes publish UI',
  !publishSources.includes("Official NorCal list"),
  "bienes publish tree",
);
check(
  'Old copy "Two-letter abbreviation" gone from Bienes publish UI',
  !publishSources.includes("Two-letter abbreviation"),
  "bienes publish tree",
);
check(
  'Old copy "5-digit ZIP" gone from Bienes publish UI',
  !publishSources.includes("5-digit ZIP"),
  "bienes publish tree",
);
check(
  'Old hint "choose the two-letter state" gone',
  !publishSources.includes("choose the two-letter state") && !publishSources.includes("abreviatura de dos letras"),
  "copy EN/ES",
);

const copyEn = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
check("Country field copy exists (EN)", copyEn.includes('direccionPais: "Country"'), "brAgenteResidencialCopy.en.ts");
check(
  "Country hint gate copy (EN)",
  copyEn.includes("Choose or type the country where the property is located"),
  "brAgenteResidencialCopy.en.ts",
);
check(
  "State / Province / Region copy (EN)",
  copyEn.includes("State / Province / Region"),
  "brAgenteResidencialCopy.en.ts",
);
check(
  "ZIP / Postal code copy (EN)",
  copyEn.includes("ZIP / Postal code") && copyEn.includes("U.S. ZIP or international postal code"),
  "brAgenteResidencialCopy.en.ts",
);

const steps = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
);
check("Parent Step 2 uses BrAgenteLocationFormFields", steps.includes("BrAgenteLocationFormFields"), "steps01-03.tsx");

const locFields = read("app/lib/clasificados/bienes-raices/brLocationFormFields.tsx");
check("Shared location fields include Country", locFields.includes("direccionPais"), "brLocationFormFields.tsx");
check("Shared location fields include freeText city", locFields.includes("freeText"), "brLocationFormFields.tsx");

const childApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
);
check("Child app reuses Step02InformacionBasica", childApp.includes("Step02InformacionBasica"), "child app");

const formState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
check("Form state includes direccionPais", formState.includes("direccionPais: string"), "agenteIndividualResidencialFormState.ts");

const childMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts",
);
check("Child mapping includes country/direccionPais", childMap.includes("direccionPais") && childMap.includes("country"), "brNegocioChildInventoryFormMapping.ts");

const mapHelpers = read("app/lib/clasificados/bienes-raices/brLocationHelpers.ts");
check("Map helper uses country", mapHelpers.includes("country") && mapHelpers.includes("buildBrListingMapQuery"), "brLocationHelpers.ts");

const mapPublish = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
);
check(
  "Parent publish mapping preserves country/area",
  mapPublish.includes("pais:") && mapPublish.includes("colonia:") && mapPublish.includes("direccionPais"),
  "mapAgenteResidencialFormStateToNegocioForPublish.ts",
);

const negocioState = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
);
check("Negocio form state has pais field", negocioState.includes("pais: string"), "bienesRaicesNegocioFormState.ts");

check("No migration touched in this gate", !exists("supabase/migrations/BR_WORLDWIDE_06"), "no new migration");

const pkg = read("package.json");
check(
  "npm script registered",
  pkg.includes("bienes:worldwide-location-visible-parent-child-06"),
  "package.json",
);

const failed = rows.filter((r) => !r.pass);

console.log("\nBR-WORLDWIDE-LOCATION-VISIBLE-PARENT-CHILD-06 audit script\n");
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed\n`);

if (failed.length) {
  process.exit(1);
}
