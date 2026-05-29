/**
 * Gate 2Q — Varios preview/detail + draft persistence launch fix
 * Run: npm run enventa:gate2q-audit
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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2Q_VARIOS_PREVIEW_DETAIL_DRAFT_POLISH.md";
const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
const idb = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts");
const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
const autosave = read("app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts");
const leaveGuard = read("app/(site)/clasificados/en-venta/publish/useEnVentaPublishLeaveGuard.ts");
const wizard = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx");
const previewPage = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const previewShell = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx");
const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
const basic = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/BasicInfoSection.tsx");
const contactActions = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const videoEmbed = read("app/(site)/clasificados/en-venta/shared/utils/enVentaVideoEmbed.ts");
const buyerPanel = read("app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx");
const previewModel = read("app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts");
const submitBar = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
const pkg = read("package.json");

const sellerFacing = [
  proApp,
  wizard,
  previewPage,
  previewShell,
  photos,
  basic,
  read("app/(site)/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout.tsx"),
  submitBar,
].join("\n");

add("Audit markdown file exists", exists(auditPath), auditPath);
add(
  "Preview hydrates from saved draft",
  previewPage.includes("loadLatestEnVentaPreviewDraftAsync") && draft.includes("persistEnVentaPreviewHandoffAsync"),
  "EnVentaPreviewPage + enVentaPreviewDraft.ts"
);
add(
  "IndexedDB draft fallback exists",
  idb.includes("idbPutEnVentaPreviewDraft") && draft.includes("loadEnVentaPreviewDraftAsync"),
  "enVentaPreviewDraftIdb.ts"
);
add(
  "Preview save before navigation",
  proApp.includes("persistEnVentaPreviewHandoffAsync") && wizard.includes("await onBeforePreview"),
  "LeonixEnVentaProApplication + EnVentaPublishWizard"
);
add(
  "Back to edit uses resume route",
  previewShell.includes("buildEnVentaEditResumeHref") && draft.includes("resume=1"),
  "EnVentaPreviewShell + enVentaPreviewDraft.ts"
);
add(
  "Autosave hook + copy",
  autosave.includes("useEnVentaFormAutosave") &&
    autosave.includes("Borrador guardado automáticamente") &&
    proApp.includes("EN_VENTA_AUTOSAVE_COPY"),
  "useEnVentaFormAutosave.ts + LeonixEnVentaProApplication"
);
add(
  "En Venta leave guard preserves draft on pagehide",
  leaveGuard.includes("saveEnVentaPreviewDraft") && !proApp.includes("useLeonixPublishLeaveGuard"),
  "useEnVentaPublishLeaveGuard.ts"
);
add(
  "No scary no-save confirm in Varios pro app",
  !proApp.includes("confirmLeavePublishFlow") && proApp.includes("confirmLeaveEnVentaPublishFlow"),
  "LeonixEnVentaProApplication.tsx"
);
add(
  "Scary global leave copy not used in Varios pro app",
  !sellerFacing.includes("Se perderá lo que llevas") && !sellerFacing.includes("start over"),
  "seller-facing en-venta bundle"
);
add(
  "Drag reorder + handle copy",
  photos.includes("draggable") &&
    photos.includes("dragHandleAria") &&
    photos.includes("Arrastra las fotos para cambiar el orden"),
  "PhotosSection.tsx"
);
add(
  "Video saved confirmation copy",
  photos.includes("Video guardado para vista previa") &&
    photos.includes("Este video se mostrará en la vista previa y en el anuncio publicado"),
  "PhotosSection.tsx"
);
add(
  "YouTube Shorts embed support",
  videoEmbed.includes("shorts") &&
    videoEmbed.includes("extractYoutubeId") &&
    (previewPage.includes("EnVentaPreviewGallery") || previewPage.includes("EnVentaVideoPlayer")),
  "enVentaVideoEmbed.ts"
);
add(
  "WhatsApp conditional contact actions",
  contactActions.includes('pref === "whatsapp"') && contactActions.includes("waValid"),
  "enVentaContactActions.ts"
);
add(
  "Price $ prefix in form",
  /aria-hidden[\s\S]{0,80}\$\s*<\/span>/.test(basic) || basic.includes("font-bold text-[#111111]"),
  "BasicInfoSection.tsx"
);
add(
  "Negotiable keeps price visible",
  previewModel.includes("negotiableChip") && previewModel.includes("$${formatPriceInputDisplay"),
  "buildEnVentaPreviewModel.ts"
);
add(
  "Buyer contact panel exists",
  buyerPanel.includes("Ubicación") && previewPage.includes("EnVentaBuyerPanel"),
  "EnVentaBuyerPanel + EnVentaPreviewPage"
);
add(
  "Preview publish checkbox guidance",
  previewShell.includes("publishNeedsCheckboxes") && previewShell.includes("enVentaDraftHasAllPublishCheckboxes"),
  "EnVentaPreviewShell.tsx"
);
add(
  "Real publish flow preserved",
  submitBar.includes("publishEnVentaFromDraft") && submitBar.includes("Publicar anuncio"),
  "EnVentaPublishSubmitBar.tsx"
);

const bannedSellerPatterns = [
  "Vista previa del anuncio Pro",
  "Publicar anuncio Pro",
  "Plan Pro",
  "Video (Pro)",
  "$9.99",
  "Stripe",
  "Boost",
  "Impulsar",
];
for (const pat of bannedSellerPatterns) {
  add(`No seller-facing "${pat}"`, !sellerFacing.includes(pat), "seller-facing en-venta bundle");
}

add("Gate 2Q npm script", pkg.includes("enventa:gate2q-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2Q — Varios preview/detail + draft polish audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
