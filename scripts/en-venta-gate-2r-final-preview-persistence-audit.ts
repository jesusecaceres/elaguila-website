/**
 * Gate 2R-FINAL — Varios preview persistence audit
 * Run: npm run enventa:gate2r-final-audit
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

const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const wizard = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const lifecycle = read("app/(site)/clasificados/lib/publishFlowLifecycleClient.ts");
const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
const basic = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/BasicInfoSection.tsx");
const validation = read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts");
const pkg = read("package.json");

add(
  "Pro preview CTA saves before navigation",
  proApp.includes("persistEnVentaPreviewHandoffAsync") && wizard.includes("onBeforePreview"),
  "LeonixEnVentaProApplication + EnVentaPublishWizard"
);
add(
  "Save is awaited before navigation",
  wizard.includes("await onBeforePreview") && proApp.includes("async (clickedPlan"),
  "EnVentaPublishWizard + LeonixEnVentaProApplication"
);
add(
  "Preview reads same draft helper/key",
  previewPage.includes("loadLatestEnVentaPreviewDraftAsync") &&
    draft.includes("EN_VENTA_PREVIEW_DRAFT_KEY_PRO"),
  "EnVentaPreviewPage + enVentaPreviewDraft.ts"
);
add(
  "Return-to-edit uses resume route",
  draft.includes("buildEnVentaEditResumeHref") &&
    draft.includes("resume=1") &&
    previewShell.includes("buildEnVentaEditResumeHref"),
  "enVentaPreviewDraft.ts + EnVentaPreviewShell.tsx"
);
add(
  "No draft clear on preview open",
  !previewPage.includes("clearEnVentaPublishTempState") &&
    lifecycle.includes("LEONIX_PREVIEW_NAV_SESSION_FLAG"),
  "EnVentaPreviewPage + publishFlowLifecycleClient.ts"
);
add(
  "No draft clear on return-to-edit",
  previewShell.includes("markPublishFlowReturningToEdit") &&
    !previewShell.includes("clearEnVentaPublishTempState"),
  "EnVentaPreviewShell.tsx"
);
add("Drag reorder exists", photos.includes("onDrop") && photos.includes("reorderImages"), "PhotosSection.tsx");
add(
  "Drag handle/copy exists",
  photos.includes("dragHandleAria") && photos.includes("Arrastra para ordenar"),
  "PhotosSection.tsx"
);
add(
  "Video saved draft copy exists",
  photos.includes("Enlace de video guardado en el borrador") &&
    photos.includes("Video guardado en el borrador. Se procesará al publicar."),
  "PhotosSection.tsx"
);
add(
  "Price label/helper exists",
  basic.includes("Precio del artículo (MXN)") && basic.includes("Si aceptas ofertas, usa Precio negociable"),
  "BasicInfoSection.tsx"
);
add(
  "Quantity not-price helper exists",
  basic.includes("No es el precio") && basic.includes("This is not the price"),
  "BasicInfoSection.tsx"
);
add(
  "Preview publish or back-to-confirm message",
  previewShell.includes("publishNeedsCheckboxes") &&
    previewShell.includes("enVentaDraftHasAllPublishCheckboxes"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Publish requires checkboxes",
  validation.includes("confirmListingAccurate") && validation.includes("confirmCommunityRules"),
  "enVentaPublishValidation.ts"
);
add("Gate 2R-FINAL npm script", pkg.includes("enventa:gate2r-final-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2R-FINAL — Varios preview persistence audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
