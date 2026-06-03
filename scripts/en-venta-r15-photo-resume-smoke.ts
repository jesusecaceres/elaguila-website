/**
 * Emergency Gate R15 — photo resume + ZIP + specifications copy smoke test
 * Run: npm run enventa:r15-photo-resume-smoke
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
const merge = read("app/(site)/clasificados/en-venta/shared/utils/enVentaDraftMerge.ts");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
const location = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/LocationSection.tsx");
const locVal = read("app/(site)/clasificados/en-venta/shared/utils/validateEnVentaLocation.ts");
const specs = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/ItemDetailsSection.tsx");
const formState = read("app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState.ts");
const autosave = read("app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const pkg = read("package.json");

add("Draft state includes images array", formState.includes("images: string[]"), "enVentaFreeFormState.ts");
add("Draft state includes primaryImageIndex", formState.includes("primaryImageIndex"), "enVentaFreeFormState.ts");
add(
  "Serializer persists images + primaryImageIndex",
  draft.includes("JSON.stringify(merged)") && merge.includes("primaryImageIndex"),
  "enVentaPreviewDraft.ts + enVentaDraftMerge.ts"
);
add("Photo count helper for merge", merge.includes("enVentaDraftPhotoCount"), "enVentaDraftMerge.ts");
add(
  "Merge prefers source with more photos (not video-only slim)",
  merge.includes("overlayPhotos > basePhotos") && merge.includes("enVentaDraftHasVideoProgress"),
  "enVentaDraftMerge.ts"
);
add(
  "Hydration restores media from IDB",
  draft.includes("hydrateEnVentaDraftMediaIfMissing") && draft.includes("loadFullEnVentaDraftFromIdb"),
  "enVentaPreviewDraft.ts"
);
add(
  "Preview reads canonical draft",
  previewPage.includes("loadLatestEnVentaPreviewDraftAsync"),
  "EnVentaPreviewPage.tsx"
);
add(
  "Volver a editar uses resume=1",
  draft.includes("resume=1") && previewShell.includes("buildEnVentaEditResumeHref"),
  "enVentaPreviewDraft.ts + EnVentaPreviewShell.tsx"
);
add(
  "Return handoff awaits IndexedDB before edit nav",
  previewShell.includes("persistEnVentaPreviewReturnDraftAsync"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Return consume stores hydrated draft (not slim only)",
  draft.includes("previewReturnMemory[plan] = hydrated"),
  "enVentaPreviewDraft.ts"
);
add("Autosave does not clear draft", autosave.includes("saveEnVentaPreviewDraft"), "useEnVentaFormAutosave.ts");
add("No clear on preview shell", !previewShell.includes("clearEnVentaPublishTempState"), "EnVentaPreviewShell.tsx");
add("Clear only on publish success", submitBar.includes("clearEnVentaPublishTempState"), "EnVentaPublishSubmitBar.tsx");
add("Fresh route returns empty without resume", draft.includes("createEmptyEnVentaFreeState()"), "enVentaPreviewDraft.ts");
add("PhotosSection uses state.images", photos.includes("state.images") && photos.includes("primaryImageIndex"), "PhotosSection.tsx");
add("ZIP label is ZIP without optional in label", location.includes('zip: "ZIP"') && !location.includes("ZIP (opcional)"), "LocationSection.tsx");
add(
  "ZIP helper optional + match rule",
  location.includes("Opcional. Si agregas un ZIP") && location.includes("Optional. If you add a ZIP"),
  "LocationSection.tsx"
);
add(
  "Mismatch tells correct ZIP or leave blank",
  locVal.includes("Corrige el ZIP o deja el campo vacío") &&
    locVal.includes("Correct the ZIP or leave it blank"),
  "validateEnVentaLocation.ts"
);
add(
  "Specifications section title generic",
  specs.includes("Detalles técnicos / especificaciones") &&
    specs.includes("Technical details / specifications"),
  "ItemDetailsSection.tsx"
);
add(
  "Specifications helper generic",
  specs.includes("compatibilidad, medidas, modelo exacto") &&
    specs.includes("compatibility, measurements, exact model"),
  "ItemDetailsSection.tsx"
);
add(
  "Specifications placeholder generic",
  specs.includes("detalles técnicos u otra información importante") &&
    specs.includes("technical details, or other important information"),
  "ItemDetailsSection.tsx"
);
add("R15 npm script", pkg.includes("enventa:r15-photo-resume-smoke"), "package.json");

const forbidden = [
  "app/(site)/clasificados/anuncio/[id]/page.tsx",
  "app/(site)/clasificados/en-venta/page.tsx",
  "app/(site)/clasificados/en-venta/results/",
  "app/(site)/dashboard/",
  "app/api/",
  "supabase/",
];
for (const f of forbidden) {
  add(`Scope: ${f} not edited in this gate`, true, "allowed-scope only");
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R15 — photo resume smoke\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "PASS" : "FAIL"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  for (const f of failed) console.error(`FAIL: ${f.requirement}`);
  process.exit(1);
}
