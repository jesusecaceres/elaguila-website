/**
 * Gate R10 — publish description constraint alignment smoke (static).
 * Run: npm run varios:r10-publish-description-constraint-audit
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/lib/clasificados/en-venta/VARIOS_R10_PUBLISH_DESCRIPTION_CONSTRAINT_AUDIT.md";
const audit = read(auditPath);
const publish = read("app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts");
const validation = read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts");
const descLib = read("app/lib/clasificados/en-venta/enVentaPublishDescription.ts");
const stack = read("app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts");
const previewStack = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const pkg = read("package.json");

add("Audit file exists", fs.existsSync(path.join(root, auditPath)), auditPath);
add('Audit contains "Constraint finding"', audit.includes("Constraint finding"), auditPath);
add('Audit contains "Preview description source"', audit.includes("Preview description source"), auditPath);
add('Audit contains "Publish description source before fix"', audit.includes("Publish description source before fix"), auditPath);
add('Audit contains "Root cause"', audit.includes("Root cause"), auditPath);
add('Audit contains "Fix applied"', audit.includes("Fix applied"), auditPath);

add(
  "Friendly ES copy",
  descLib.includes("Agrega una descripción más completa antes de publicar."),
  "enVentaPublishDescription.ts",
);
add(
  "Friendly EN copy",
  descLib.includes("Add a more complete description before publishing."),
  "enVentaPublishDescription.ts",
);

add(
  "Publish uses resolveEnVentaPublishDescriptionForDb",
  publish.includes("resolveEnVentaPublishDescriptionForDb") && publish.includes("descriptionForDb"),
  "enVentaPublishFromDraft.ts",
);
add(
  "Publish does not use buildDescriptionBody",
  !publish.includes("buildDescriptionBody"),
  "enVentaPublishFromDraft.ts",
);
add(
  "Validation blocks short description",
  validation.includes("collectEnVentaPublishDescriptionBlockers"),
  "enVentaPublishValidation.ts",
);
add(
  "Wear/accessories/specs in detail_pairs not description concat",
  publish.includes("stackCopy.conditionUse") && publish.includes("stackCopy.technical"),
  "enVentaPublishFromDraft.ts",
);

add(
  "No supabase migration files edited",
  !publish.includes("supabase/migrations"),
  "publish path only",
);

const previewModel = read("app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts");
const stackTypes = read("app/(site)/clasificados/en-venta/shared/types/enVentaContentStack.types.ts");

add(
  "Required label Vista previa del anuncio",
  previewModel.includes("Vista previa del anuncio"),
  "buildEnVentaPreviewModel.ts",
);
add(
  "Required label Publicar anuncio",
  read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx").includes("Publicar anuncio"),
  "EnVentaPublishSubmitBar.tsx",
);
add(
  "Required success copy",
  read("app/(site)/clasificados/en-venta/publish/enVentaPublishSuccessCopy.ts").includes("Tu anuncio fue publicado con éxito"),
  "enVentaPublishSuccessCopy.ts",
);
add(
  "Required Ver mi anuncio",
  read("app/(site)/clasificados/en-venta/publish/enVentaPublishSuccessCopy.ts").includes("Ver mi anuncio"),
  "enVentaPublishSuccessCopy.ts",
);
add(
  "Required Varios label",
  read("app/(site)/clasificados/en-venta/shared/constants/enVentaPublicLabels.ts").includes("Varios"),
  "enVentaPublicLabels.ts",
);
add(
  "Required Descripción",
  stackTypes.includes('description: "Descripción"'),
  "enVentaContentStack.types.ts",
);

add(
  "R10 publish description audit npm script",
  pkg.includes("varios:r10-publish-description-constraint-audit"),
  "package.json",
);

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R10 — publish description constraint audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "PASS" : "FAIL"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length > 0) process.exit(1);
