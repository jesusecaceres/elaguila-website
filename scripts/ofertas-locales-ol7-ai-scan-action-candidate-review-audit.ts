/**
 * Gate OL-7 — Ofertas Locales AI scan action + candidate review audit.
 * Run: npm run ofertas-locales:ol7-ai-scan-action-candidate-review-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7_AI_SCAN_ACTION_CANDIDATE_REVIEW_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7_AI_SCAN_ACTION_CANDIDATE_REVIEW_AUDIT.md";
const READINESS = "app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts";
const SCAN_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx";
const REVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const APP = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const SCAN_HANDLER = "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts";
const SCAN_ROUTE = "app/api/ofertas-locales/scan/route.ts";
const SCAN_PREP = "app/api/ofertas-locales/scan-prep/route.ts";
const PERSIST = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const AI_SESSION = "app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence.ts";
const PUBLIC_SEARCH = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
];

const PACKAGE_10_ALLOWED = new Set([
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx",
  "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts",
  "app/(site)/coupons/page.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
  "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesShoppingList.ts",
  "docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md",
  "docs/OFERTAS_PACKAGE_10_COMPLETE_PRODUCT_EXPERIENCE.md",
]);

const PACKAGE_12_ALLOWED = new Set([
  "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
  "app/(site)/dashboard/ofertas-locales/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx",
  "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts",
  "app/lib/ofertas-locales/ofertasLocalesDbSchema.ts",
  "app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts",
  "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
  "docs/OFERTAS_PACKAGE_12_OWNER_ADMIN_OPERATIONS.md",
  "docs/OFERTAS_PACKAGE_13_ENVIRONMENT_QA_MATRIX.md",
  "docs/OFERTAS_PACKAGE_13_HISTORICAL_AUDIT_GOVERNANCE.md",
  "docs/OFERTAS_PACKAGE_13_MIGRATION_EXECUTION_MATRIX.md",
  "docs/OFERTAS_PACKAGE_13_QA_CONTROL_CENTER.md",
  "docs/OFERTAS_PACKAGE_13_REAL_QA_DATA_CONTRACT.md",
  "docs/OFERTAS_PACKAGE_13_REAL_QA_RUNBOOK.md",
  "scripts/ofertas-package-11-local-certification-audit.mjs",
  "scripts/ofertas-package-13-audit-governance-audit.mjs",
  "scripts/ofertas-locales-ai-power-1-audit.ts",
  "scripts/ofertas-locales-ai-quality-1-audit.ts",
  "scripts/ofertas-locales-final-1b-en-venta-pipeline-audit.ts",
  "scripts/ofertas-locales-final-1c-full-pipeline-smoke-audit.ts",
  "scripts/ofertas-locales-final-1d-public-tab-activation-audit.ts",
  "scripts/ofertas-locales-final-1-pipeline-audit.ts",
  "scripts/ofertas-locales-final-4-public-detail-audit.ts",
  "scripts/ofertas-locales-gate-1-foundation-audit.ts",
  "scripts/ofertas-locales-mobile-public-search-ux-audit.ts",
  "scripts/ofertas-locales-ol3-step1-cta-cleanup-audit.ts",
  "scripts/ofertas-package-12-admin-review-audit.mjs",
  "scripts/ofertas-package-12-commercial-term-parity-audit.mjs",
  "scripts/ofertas-package-12-correction-resubmission-audit.mjs",
  "scripts/ofertas-package-12-mobile-es-en-accessibility-audit.mjs",
  "scripts/ofertas-package-12-operational-status-audit.mjs",
  "scripts/ofertas-package-12-operations-completion-audit.mjs",
  "scripts/ofertas-package-12-owner-operations-audit.mjs",
  "scripts/ofertas-package-12-recovery-operations-audit.mjs",
  "tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts",
]);

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  assert.ok(exists(PLAN), "OL-7 plan must exist");
  assert.ok(exists(AUDIT), "OL-7 audit doc must exist");
  assert.ok(exists(SCAN_PREP), "scan-prep route must exist");
  assert.ok(exists(SCAN_ROUTE), "scan route must exist");

  const readiness = read(READINESS);
  const scanPanel = read(SCAN_PANEL);
  const reviewPanel = read(REVIEW_PANEL);
  const app = read(APP);
  const copy = read(COPY);
  const scanHandler = read(SCAN_HANDLER);
  const persist = read(PERSIST);
  const aiSession = read(AI_SESSION);
  const publicSearch = read(PUBLIC_SEARCH);
  const pkg = read(PACKAGE);

  assert.match(readiness, /application\/pdf/, "PDF MIME in readiness");
  assert.match(readiness, /image\/jpeg/, "JPEG MIME in readiness");
  assert.match(readiness, /image\/png/, "PNG MIME in readiness");
  assert.match(readiness, /external_url/, "external URL excluded");
  assert.match(readiness, /assetHasUploadedWithUrl/, "uploaded URL required");
  assert.match(readiness, /Sube un PDF, JPG, PNG o WebP para activar el escaneo AI/, "ES upload helper");
  assert.match(readiness, /Upload a PDF, JPG, PNG, or WebP to activate AI scanning/, "EN upload helper");
  assert.doesNotMatch(readiness, /Paso 7|Step 7/, "no Step 7 scan blocker");

  assert.match(copy, /Analizar con IA|Escanear con AI/, "ES scan button in copy");
  assert.match(copy, /Analyze with AI|Scan with AI/, "EN scan button in copy");
  assert.match(scanPanel, /Escaneando archivo\.\.\./, "ES processing status");
  assert.match(scanPanel, /Scanning file\.\.\./, "EN processing status");
  assert.match(scanPanel, /No se pudo escanear|Could not scan/, "scan failure status labels");
  assert.match(scanPanel, /Revisión necesaria|Review needed/, "review needed status");
  assert.match(scanPanel, /submitOfertaLocalAiScan/, "calls real scan endpoint");
  assert.match(scanPanel, /ensureOfertaLocalRecordForAiScan/, "scan prep before scan");
  assert.match(scanPanel, /storagePath/, "passes storage metadata");

  assert.match(reviewPanel, /aiReviewSuggestionsFound/, "suggestions count key");
  assert.match(copy, /Sugerencias encontradas|Suggestions found/, "suggestions count copy");
  assert.match(reviewPanel, /itemName|priceText|category|dealType/, "editable product/deal fields");
  assert.match(reviewPanel, /handleApproveAndNext|handleStatusAction[\s\S]*approved/, "approve control");
  assert.match(reviewPanel, /handleConfirmReject|handleStatusAction[\s\S]*rejected|aiReviewReject/, "reject/remove control");
  assert.match(reviewPanel, /sourcePage/, "source page shown");
  assert.doesNotMatch(reviewPanel, /autoPublish|publishAutomatically/, "no auto publish");

  assert.match(scanHandler, /runOfertaLocalAiScanExtraction/, "real AI scan orchestrator");
  assert.match(scanHandler, /missing_storage_path|storagePath/, "requires uploaded storage");
  assert.match(scanHandler, /mapOfertaLocalSearchableItemDraftToDbInsert/, "real normalizer persistence");
  assert.doesNotMatch(scanHandler, /sampleCandidates|fakeItems|demoProducts/, "no fake candidates");

  assert.doesNotMatch(scanHandler, /scrape|externalUrlOnly/, "no URL scraping promise in handler");

  assert.match(app, /effectiveOfertaLocalId/, "scan record wired in app");
  assert.match(app, /OfertasLocalesAiScanPanel/, "scan panel on step 5");
  assert.match(app, /OfertasLocalesAiItemReviewPanel/, "review panel wired");

  assert.match(copy, /no prometemos recorte automático|Automatic coupon-sheet clipping is not promised/i, "no clipping promise");
  assert.doesNotMatch(copy, /extracción perfecta|perfect extraction/i, "no fake extraction copy");

  assert.match(publicSearch, /review_status !== "approved"/, "public safety filter intact");
  assert.match(publicSearch, /is_active/, "public active filter intact");

  assert.doesNotMatch(persist, /readAsDataURL/, "no base64 in draft persistence");
  assert.doesNotMatch(aiSession, /readAsDataURL|JSON\.stringify\([\s\S]*base64/, "no base64 in ai session storage");
  assert.match(aiSession, /ofertaLocalId|lastScanJobId/, "session stores ids only");

  assert.match(pkg, /ofertas-locales:ol7-ai-scan-action-candidate-review-audit/, "package script");

  for (const file of changedFiles()) {
    if (PACKAGE_10_ALLOWED.has(file) || PACKAGE_12_ALLOWED.has(file) || file.startsWith("scripts/ofertas-")) {
      continue;
    }
    if (file === "scripts/ofertas-stripe-readiness-audit.mjs") {
      continue;
    }
    if (file === "supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql") {
      continue;
    }
    if (file === "supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql") {
      continue;
    }
    if (file === "supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql") {
      continue;
    }
    if (
      file === "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx" ||
      file === "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts" ||
      file === "app/(site)/dashboard/ofertas-locales/[id]/page.tsx" ||
      file === "app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerRenewalActionCenter.tsx"
    ) {
      continue;
    }
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-7 — Ofertas Locales AI scan action + candidate review audit passed.");
}

run();
