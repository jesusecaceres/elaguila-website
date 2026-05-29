/**
 * Gate 2R — Emergency Varios Publish/Preview Data-Loss Fix
 * Run: npm run enventa:gate2r-preview-draft-audit
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const idb = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const wizard = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
const basic = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/BasicInfoSection.tsx");
const validation = read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts");
const submit = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");

add("Preview draft save function", draft.includes("saveEnVentaPreviewDraft"), "enVentaPreviewDraft.ts");
add("Preview draft read function", draft.includes("loadEnVentaPreviewDraftAsync"), "enVentaPreviewDraft.ts");
add("Return-to-edit restore function", draft.includes("takeEnVentaPreviewReturnInitialState"), "enVentaPreviewDraft.ts");
add("IndexedDB fallback exists", exists("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts"), "enVentaPreviewDraftIdb.ts");
add(
  "Same storage keys documented",
  draft.includes("EN_VENTA_PREVIEW_DRAFT_KEY_PRO") && draft.includes("EN_VENTA_PREVIEW_RETURN_DRAFT"),
  "enVentaPreviewDraft.ts"
);
add(
  "IDB mirrors plan keys",
  idb.includes('draftKey(plan)') && idb.includes('returnKey(plan)'),
  "enVentaPreviewDraftIdb.ts"
);
add(
  "Pro preview CTA saves before navigation",
  proApp.includes("saveEnVentaPreviewDraft") && wizard.includes("onBeforePreview"),
  "LeonixEnVentaProApplication.tsx + EnVentaPublishWizard.tsx"
);
add(
  "Preview loads draft async with IDB",
  previewPage.includes("loadLatestEnVentaPreviewDraftAsync"),
  "EnVentaPreviewPage.tsx"
);
add(
  "Preview empty state only when no draft",
  previewPage.includes("Sin borrador") && previewPage.includes("!hasDraft"),
  "EnVentaPreviewPage.tsx"
);
add(
  "Return to edit uses client router + re-save",
  previewShell.includes("router.push") && previewShell.includes("saveEnVentaPreviewReturnDraft"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Pro form IDB hydrate on empty restore",
  proApp.includes("restoreEnVentaFormFromIdbIfEmpty"),
  "LeonixEnVentaProApplication.tsx"
);
add("Drag reorder code", photos.includes("onDrop") && photos.includes("reorderImages"), "PhotosSection.tsx");
add(
  "Drag handle aria",
  photos.includes("dragHandleAria") && photos.includes("Asa para reordenar foto"),
  "PhotosSection.tsx"
);
add(
  "Price label Precio del artículo (MXN)",
  basic.includes("Precio del artículo (MXN)") && basic.includes("Item price (MXN)"),
  "BasicInfoSection.tsx"
);
add(
  "Quantity helper not price",
  basic.includes("No es el precio") && basic.includes("This is not the price"),
  "BasicInfoSection.tsx"
);
add("Video ready copy", photos.includes("Video listo") && photos.includes("Video ready"), "PhotosSection.tsx");
add(
  "Publish requires checkboxes",
  validation.includes("collectEnVentaPublishBlockers") && submit.includes("collectEnVentaPublishBlockers"),
  "enVentaPublishValidation.ts"
);
add(
  "Preview save error shown",
  wizard.includes("saveFailed") && wizard.includes("setSaveError"),
  "EnVentaPublishWizard.tsx"
);

const pkg = read("package.json");
add("Gate 2R npm script", pkg.includes("enventa:gate2r-preview-draft-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2R — Emergency preview draft audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
