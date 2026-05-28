/**
 * Gate 2Q — Varios Publish Flow Reality Fix
 * Run: npm run enventa:gate2q-publish-flow-audit
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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2Q_VARIOS_PUBLISH_FLOW_REALITY_FIX.md";
add("Gate 2Q audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit recommends READY or NOT READY", /READY TO RESTART FINAL QA|NOT READY/.test(audit), auditPath);

const publishPaths = [
  "app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx",
  "app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx",
  "app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx",
  "app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx",
  "app/(site)/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout.tsx",
  "app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts",
  "app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx",
  "app/(site)/clasificados/en-venta/preview/EnVentaPreviewShell.tsx",
];

const forbiddenPublicPro = [
  /Vista previa del anuncio Pro/i,
  /Publicar anuncio Pro/i,
  /Preview Pro listing/i,
  /Publish Pro listing/i,
  /Video \(Pro\)/i,
  /Plan Pro:/i,
  /Varios Pro incluido/i,
  /For Sale Pro included/i,
];

let noPublicPro = true;
for (const rel of publishPaths) {
  const t = read(rel);
  if (forbiddenPublicPro.some((re) => re.test(t))) {
    noPublicPro = false;
    add(`No forbidden Pro copy in ${rel}`, false, rel);
  }
}
add("Public Varios publish paths avoid forbidden Pro labels", noPublicPro, "grep publish flow TSX");

const wizard = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx");
add("Preview CTA label", wizard.includes("Vista previa del anuncio") && wizard.includes("Listing preview"), "EnVentaPublishWizard.tsx");
add("Preview uses client router.push", wizard.includes("router.push"), "EnVentaPublishWizard.tsx");
add("Preview checks draft before nav", wizard.includes("hasEnVentaPreviewDraft"), "EnVentaPublishWizard.tsx");

const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
add("In-memory preview draft cache", draft.includes("previewDraftMemory"), "enVentaPreviewDraft.ts");
add("saveEnVentaPreviewDraft exists", draft.includes("saveEnVentaPreviewDraft"), "enVentaPreviewDraft.ts");
add("saveEnVentaPreviewReturnDraft exists", draft.includes("saveEnVentaPreviewReturnDraft"), "enVentaPreviewDraft.ts");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Pro app saves before preview", proApp.includes("saveEnVentaPreviewDraft") && proApp.includes("saveEnVentaPreviewReturnDraft"), "LeonixEnVentaProApplication.tsx");
add("Pro app restores return draft on init", proApp.includes("takeEnVentaPreviewReturnInitialState"), "LeonixEnVentaProApplication.tsx");

const submit = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
add("Publish label without Pro", submit.includes('"Publicar anuncio"') && submit.includes('"Publish listing"'), "EnVentaPublishSubmitBar.tsx");
add("Publish saves draft first", submit.includes("saveEnVentaPreviewDraft"), "EnVentaPublishSubmitBar.tsx");

const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
add("Drag reorder", photos.includes("draggable") && photos.includes("onDrop"), "PhotosSection.tsx");
add("Reorder copy ES", photos.includes("Ordenar fotos") && photos.includes("Arrastra las fotos"), "PhotosSection.tsx");
add("Mobile reorder fallback", photos.includes("moveImage"), "PhotosSection.tsx");
add("Video optional copy", photos.includes("Video opcional") && photos.includes("Optional video"), "PhotosSection.tsx");
add("Video accepted copy", photos.includes("Video agregado") && photos.includes("Tu video se guardó"), "PhotosSection.tsx");

const callout = read("app/(site)/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout.tsx");
add("Included listing callout", callout.includes("Anuncio de Varios incluido sin costo"), "EnVentaPlanIntakeCallout.tsx");

const previewModel = read("app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts");
add("Price with currency in preview", previewModel.includes('`$${formatPriceInputDisplay'), "buildEnVentaPreviewModel.ts");
add("Gratis in preview", previewModel.includes('priceLine = t.free'), "buildEnVentaPreviewModel.ts");
add("Negotiable in preview", previewModel.includes("negotiableChip"), "buildEnVentaPreviewModel.ts");

const rules = read("app/(site)/clasificados/en-venta/shared/components/ListingRulesConfirmationSection.tsx");
add("Confirmation boxes remain", rules.includes("confirmAccurate") && rules.includes("confirmPhotos"), "ListingRulesConfirmationSection.tsx");

const proRoute = read("app/(site)/clasificados/publicar/en-venta/pro/page.tsx");
add("Internal /pro route preserved", proRoute.includes("LeonixEnVentaProApplication"), "pro/page.tsx");

const pkg = read("package.json");
add("Gate 2Q npm script", pkg.includes("enventa:gate2q-publish-flow-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2Q — Varios publish flow reality fix audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
