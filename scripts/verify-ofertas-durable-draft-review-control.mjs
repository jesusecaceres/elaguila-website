import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "app/lib/ofertas-locales/OFERTAS_DURABLE_DRAFT_REVIEW_CONTROL_AUDIT.md");
const draftPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts");
const scanPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts");
const copyPath = path.join(root, "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const appPath = path.join(root, "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const panelPath = path.join(root, "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const locationPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesLocationHelpers.ts");
const adminMutationPath = path.join(root, "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const adminRoutePath = path.join(root, "app/api/ofertas-locales/admin/[id]/review/route.ts");
const adminListPath = path.join(root, "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function requireText(label, haystack, needle) {
  if (haystack.includes(needle)) pass(label);
  else fail(`${label} missing "${needle}"`);
}

if (!existsSync(auditPath)) fail("audit file exists");
else pass("audit file exists");

const draft = readFileSync(draftPath, "utf8");
requireText("draft localStorage primary", draft, "getLocalDraftStorage");
requireText("draft session fallback", draft, "getSessionDraftStorage");
requireText("draft session migrate", draft, "migrateSessionDraftToLocal");
if (draft.includes("clearLegacyLocalStorageDraft")) {
  fail("draft still clears legacy localStorage on load");
} else {
  pass("draft does not clear durable localStorage on load");
}

const scan = readFileSync(scanPath, "utf8");
requireText("scan localStorage primary", scan, "getLocalStorage");
requireText("scan session fallback", scan, "getSessionStorage");
requireText("scan session migrate", scan, "migrateSessionScanToLocal");

const copy = readFileSync(copyPath, "utf8");
requireText("english continue page", copy, 'aiReviewContinueToPage: "Continue to Page {page}"');
requireText("spanish continue page", copy, 'aiReviewContinueToPage: "Continuar a Página {page}"');
requireText("english scan summary", copy, 'step7ScanSummaryTitle: "AI analysis summary"');
requireText("spanish scan summary", copy, 'step7ScanSummaryTitle: "Resumen del análisis con IA"');
requireText("english rescan warning", copy, "Scanning again may replace or change previous suggestions.");
requireText("spanish rescan warning", copy, "Volver a escanear puede reemplazar o cambiar sugerencias anteriores.");

const app = readFileSync(appPath, "utf8");
requireText("step7 summary block", app, "step7ScanSummaryTitle");
requireText("step7 rescan details", app, "step7RescanSectionTitle");
requireText("norcal datalist", app, "oferta-local-norcal-city-suggestions");

const panel = readFileSync(panelPath, "utf8");
requireText("editor page complete card", panel, "aiReviewContinueToPage");

const location = readFileSync(locationPath, "utf8");
requireText("norcal suggestions list", location, "OFERTA_LOCAL_NORCAL_CITY_SUGGESTIONS");

const adminMutation = readFileSync(adminMutationPath, "utf8");
requireText("admin approval checks unresolved items", adminMutation, "assertNoUnresolvedItemsBeforeApproval");
requireText("admin approval blocks pending items", adminMutation, '.in("review_status", ["pending", "needs_review"])');
requireText("admin rejection requires reason", adminMutation, "rejection_reason_required");
requireText("admin rejection keeps children private", adminMutation, 'action === "reject" || action === "archive"');
requireText("admin approval activates approved children only", adminMutation, '.eq("review_status", "approved")');

const adminRoute = readFileSync(adminRoutePath, "utf8");
requireText("admin validation failures return 422", adminRoute, "rejection_reason_required");
requireText("admin unresolved validation returns 422", adminRoute, "unresolved_review_items");

const adminList = readFileSync(adminListPath, "utf8");
requireText("admin rejection reason copy", adminList, "Nota interna (requerida para rechazo)");

const requiredPackageFiles = [
  "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts",
  "app/lib/ofertas-locales/ofertasLocalesLocationHelpers.ts",
  "app/lib/ofertas-locales/OFERTAS_DURABLE_DRAFT_REVIEW_CONTROL_AUDIT.md",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
  "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx",
  "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts",
  "app/api/ofertas-locales/admin/[id]/review/route.ts",
  "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts",
  "scripts/ofertas-locales-package-3-public-owner-admin-audit.mjs",
  "scripts/verify-ofertas-durable-draft-review-control.mjs",
  "package.json",
];

const missingRequiredPackageFiles = requiredPackageFiles.filter((file) => !existsSync(path.join(root, file)));
if (missingRequiredPackageFiles.length) fail(`required package files missing: ${missingRequiredPackageFiles.join(", ")}`);
else pass(`required package files present: ${requiredPackageFiles.length}`);

const applicationSource = readFileSync(appPath, "utf8");
if (/stripe|checkout|payment/i.test(applicationSource)) fail("durable draft client introduced commercial side effects");
else pass("durable draft client remains commercial-side-effect free");
