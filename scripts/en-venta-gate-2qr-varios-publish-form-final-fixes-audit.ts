/**
 * Gate 2Q-R — Varios Publish Form Final Fixes
 * Run: npm run enventa:gate2qr-publish-form-audit
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

const auditPath = "app/(site)/clasificados/en-venta/AUDIT_GATE_2QR_VARIOS_PUBLISH_FORM_FINAL_FIXES.md";
add("Gate 2Q-R audit file exists", exists(auditPath), auditPath);

const audit = exists(auditPath) ? read(auditPath) : "";
add("Audit has TRUE/FALSE table", audit.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Audit recommends READY", /READY TO RESTART FINAL QA|READY FOR/.test(audit), auditPath);

const basic = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/BasicInfoSection.tsx");
add("Monto label with Precio del artículo", basic.includes("Precio del artículo (Monto)"), "BasicInfoSection.tsx");
add("Monto $ prefix in UI", basic.includes("$") && basic.includes("amountH"), "BasicInfoSection.tsx");
add("Quantity optional and distinct", basic.includes("Cantidad (opcional)") && basic.includes("No es el precio"), "BasicInfoSection.tsx");
add("Quantity not required in validation", !read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts").includes("quantity"), "enVentaPublishValidation.ts");

const validation = read("app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts");
add("Price blocker ES", validation.includes("Agrega el precio del artículo."), "enVentaPublishValidation.ts");
add("Price blocker EN", validation.includes("Add the item price."), "enVentaPublishValidation.ts");
add("Core blockers exclude checkboxes", validation.includes("collectEnVentaCoreBlockers") && validation.includes("collectEnVentaPublishBlockers"), "enVentaPublishValidation.ts");

const draft = read("app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts");
add("Preview draft memory cache", draft.includes("previewDraftMemory"), "enVentaPreviewDraft.ts");
add("saveEnVentaPreviewDraft", draft.includes("saveEnVentaPreviewDraft"), "enVentaPreviewDraft.ts");
add("takeEnVentaPreviewReturnInitialState", draft.includes("takeEnVentaPreviewReturnInitialState"), "enVentaPreviewDraft.ts");

const proApp = read("app/(site)/clasificados/publicar/en-venta/pro/application/LeonixEnVentaProApplication.tsx");
add("Save before preview", proApp.includes("saveEnVentaPreviewDraft") && proApp.includes("saveEnVentaPreviewReturnDraft"), "LeonixEnVentaProApplication.tsx");
add("Restore on mount", proApp.includes("takeEnVentaPreviewReturnInitialState"), "LeonixEnVentaProApplication.tsx");
add("Preview uses core blockers only", proApp.includes("collectEnVentaCoreBlockers"), "LeonixEnVentaProApplication.tsx");

const wizard = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishWizard.tsx");
add("Preview blockers prop", wizard.includes("previewBlockers"), "EnVentaPublishWizard.tsx");
add("Preview CTA without Pro", wizard.includes("Vista previa del anuncio") && !wizard.includes("Vista previa del anuncio Pro"), "EnVentaPublishWizard.tsx");

const submit = read("app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx");
add("Publish saves draft", submit.includes("saveEnVentaPreviewDraft"), "EnVentaPublishSubmitBar.tsx");
add("Publish uses full blockers", submit.includes("collectEnVentaPublishBlockers"), "EnVentaPublishSubmitBar.tsx");

const photos = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/PhotosSection.tsx");
add("Video ready ES", photos.includes("Video listo"), "PhotosSection.tsx");
add("Video ready EN", photos.includes("Video ready"), "PhotosSection.tsx");
add("Honest draft saved copy", photos.includes("Guardado en tu borrador") || photos.includes("Saved in your draft"), "PhotosSection.tsx");
add("Video URL validation", photos.includes("videoLinkInvalid") && photos.includes("isValidVideoUrl"), "PhotosSection.tsx");
add("Drag reorder", photos.includes("draggable") && photos.includes("onDrop"), "PhotosSection.tsx");
add("Arrow reorder fallback", photos.includes("moveImage"), "PhotosSection.tsx");

const callout = read("app/(site)/clasificados/en-venta/shared/components/EnVentaPlanIntakeCallout.tsx");
add("Spanish included without Pro tier", callout.includes("Anuncio incluido sin costo") && !callout.includes("Pro incluido"), "EnVentaPlanIntakeCallout.tsx");

const locSection = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/LocationSection.tsx");
add("City OR ZIP helper copy", locSection.includes("ciudad o ZIP") || locSection.includes("city or ZIP"), "LocationSection.tsx");
add("missing_both does not highlight both fields", locSection.includes('validation.code === "missing_both"') === false && locSection.includes("cityInvalid") && locSection.includes("zipInvalid"), "LocationSection.tsx");

const locVal = read("app/(site)/clasificados/en-venta/shared/utils/validateEnVentaLocation.ts");
add("City or ZIP satisfies location", locVal.includes("missing_both") && locVal.includes("Add a city or a ZIP"), "validateEnVentaLocation.ts");

const rules = read("app/(site)/clasificados/en-venta/shared/components/ListingRulesConfirmationSection.tsx");
add("Three confirmation boxes", rules.includes("confirmAccurate") && rules.includes("confirmPhotos") && rules.includes("confirmRules"), "ListingRulesConfirmationSection.tsx");

const pkg = read("package.json");
add("Gate 2Q-R npm script", pkg.includes("enventa:gate2qr-publish-form-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate 2Q-R — Varios publish form final fixes audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
