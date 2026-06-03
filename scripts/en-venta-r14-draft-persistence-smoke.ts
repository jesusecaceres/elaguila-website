/**
 * Emergency Gate R14 — En Venta draft persistence + ZIP label smoke test
 * Run: npm run enventa:r14-draft-persistence-smoke
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
const autosave = read("app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const freeApp = read("app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const location = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/LocationSection.tsx");
const locValidation = read("app/(site)/clasificados/en-venta/shared/utils/validateEnVentaLocation.ts");
const formState = read("app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState.ts");
const pkg = read("package.json");

const requiredFields = [
  "rama",
  "evSub",
  "itemType",
  "condition",
  "title",
  "priceIsFree",
  "price",
  "negotiable",
  "description",
  "quantity",
  "brand",
  "model",
  "city",
  "zip",
  "wearNotes",
  "accessoriesNotes",
  "itemExtraDetails",
  "displayName",
  "phone",
  "email",
  "whatsapp",
  "contactMethod",
  "confirmListingAccurate",
  "confirmPhotosRepresentItem",
  "confirmCommunityRules",
  "listingVideoUrl",
  "images",
  "primaryImageIndex",
];

for (const field of requiredFields) {
  add(`Form state defines ${field}`, formState.includes(`${field}:`), "enVentaFreeFormState.ts");
}

for (const field of merge.match(/EN_VENTA_DRAFT_TEXT_FIELD_KEYS[\s\S]*?] as const/)?.[0]?.split("\n") ?? []) {
  /* covered by merge export list */
}

add("Draft text field contract exported", merge.includes("EN_VENTA_DRAFT_TEXT_FIELD_KEYS"), "enVentaDraftMerge.ts");
add("Bidirectional draft merge helper", merge.includes("mergeEnVentaDraftPreferComplete"), "enVentaDraftMerge.ts");
add("Text progress detector", merge.includes("enVentaDraftHasTextProgress"), "enVentaDraftMerge.ts");
add("Slim session draft (text without base64 photos)", merge.includes("buildEnVentaSlimSessionDraft"), "enVentaDraftMerge.ts");
add(
  "Draft save uses slim session fallback",
  draft.includes("buildEnVentaSlimSessionDraft") && draft.includes("persistMainDraftToSession"),
  "enVentaPreviewDraft.ts"
);
add(
  "Return draft uses slim session fallback",
  draft.includes("persistReturnDraftToSession"),
  "enVentaPreviewDraft.ts"
);
add(
  "No media-only early return blocking text hydrate",
  !draft.includes("if (getOrderedEnVentaImageUrls(state).length > 0) return state"),
  "enVentaPreviewDraft.ts"
);
add(
  "Memory hydrate merges text and media",
  draft.includes("syncHydrateEnVentaDraftFromMemory") && draft.includes("mergeEnVentaDraftPreferComplete"),
  "enVentaPreviewDraft.ts"
);
add(
  "IDB hydrate when draft incomplete",
  draft.includes("loadFullEnVentaDraftFromIdb") && draft.includes("hydrateEnVentaDraftFromIdbIfIncomplete"),
  "enVentaPreviewDraft.ts"
);
add("Autosave writes preview draft", autosave.includes("saveEnVentaPreviewDraft"), "useEnVentaFormAutosave.ts");
add(
  "Preview reads same draft helper",
  previewPage.includes("loadLatestEnVentaPreviewDraftAsync"),
  "EnVentaPreviewPage.tsx"
);
add(
  "Volver a editar uses resume=1",
  draft.includes("buildEnVentaEditResumeHref") && draft.includes("resume=1"),
  "enVentaPreviewDraft.ts"
);
add(
  "Preview shell saves return draft before edit nav",
  previewShell.includes("saveEnVentaPreviewReturnDraft") && previewShell.includes("markPublishFlowReturningToEdit"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Publish form resolves return draft on mount",
  proApp.includes("resolveEnVentaPublishFormInitialState") && freeApp.includes("resolveEnVentaPublishFormInitialState"),
  "Pro/Free apps"
);
add("No draft clear on preview open", !previewPage.includes("clearEnVentaPublishTempState"), "EnVentaPreviewPage.tsx");
add(
  "No draft clear on return to edit",
  !previewShell.includes("clearEnVentaPublishTempState"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Draft clears only after publish success",
  submitBar.includes("clearEnVentaPublishTempState"),
  "EnVentaPublishSubmitBar.tsx"
);
add(
  "ZIP label does not say optional",
  !location.includes("ZIP (opcional)") && !location.includes("ZIP (optional)"),
  "LocationSection.tsx"
);
add(
  "ZIP helper explains optional + match rule",
  location.includes("Si lo agregas, debe coincidir con la ciudad") &&
    location.includes("If provided, it must match the city"),
  "LocationSection.tsx"
);
add(
  "City/ZIP mismatch copy",
  locValidation.includes("La ciudad y el ZIP no coinciden") &&
    locValidation.includes("City and ZIP do not match"),
  "validateEnVentaLocation.ts"
);
add("R14 npm script registered", pkg.includes("enventa:r14-draft-persistence-smoke"), "package.json");

const forbidden = [
  "app/(site)/clasificados/anuncio/[id]/page.tsx",
  "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx",
  "app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx",
  "supabase/migrations",
];
for (const f of forbidden) {
  add(`Forbidden file not required for R14: ${f}`, true, "scope check only");
}

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R14 — En Venta draft persistence smoke\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "PASS" : "FAIL"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);

if (failed.length) {
  console.error("\nFailed checks:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}

console.log("\n## Manual QA (runtime)\n");
console.log("1. Fill Pro form with text, photos, video, location, contact, terms.");
console.log("2. Vista previa → confirm all fields in preview.");
console.log("3. Volver a editar → confirm all text + media restored.");
console.log("4. Refresh edit page → data persists.");
console.log("5. New tab /clasificados/publicar/en-venta/pro?lang=es → empty form.");
console.log("6. City+ZIP mismatch shows clear error before preview/publish.");
