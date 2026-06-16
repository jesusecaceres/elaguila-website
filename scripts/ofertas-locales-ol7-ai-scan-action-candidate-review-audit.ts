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
  assert.match(readiness, /Sube un PDF, JPG o PNG para activar el escaneo AI/, "ES upload helper");
  assert.match(readiness, /Upload a PDF, JPG, or PNG to activate AI scanning/, "EN upload helper");
  assert.doesNotMatch(readiness, /Paso 7|Step 7/, "no Step 7 scan blocker");

  assert.match(copy, /Escanear con AI/, "ES scan button in copy");
  assert.match(copy, /Scan with AI/, "EN scan button in copy");
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
  assert.match(reviewPanel, /handleStatusAction.*approved/, "approve control");
  assert.match(reviewPanel, /handleStatusAction.*rejected|aiReviewReject/, "reject/remove control");
  assert.match(reviewPanel, /sourcePage/, "source page shown");
  assert.doesNotMatch(reviewPanel, /autoPublish|publishAutomatically/, "no auto publish");

  assert.match(scanHandler, /processOfertaLocalAssetWithDocumentAi/, "real Document AI");
  assert.match(scanHandler, /missing_storage_path|storagePath/, "requires uploaded storage");
  assert.match(scanHandler, /normalizeDocumentAiResultToOfertaLocalItems/, "real normalizer");
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
    if (file === "supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql") {
      continue;
    }
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-7 — Ofertas Locales AI scan action + candidate review audit passed.");
}

run();
