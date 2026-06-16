/**
 * Gate OL-7B — Ofertas Locales production AI schema + candidate extraction audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7B_PRODUCTION_AI_SCHEMA_CANDIDATES_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7B_PRODUCTION_AI_SCHEMA_CANDIDATES_AUDIT.md";
const MIGRATION = "supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql";
const SCHEMA = "app/lib/ofertas-locales/ofertasLocalesSupabaseSchema.ts";
const SCAN_HANDLER = "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts";
const SCAN_PREP = "app/api/ofertas-locales/scan-prep/route.ts";
const NORMALIZER = "app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts";
const DOC_AI = "app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts";
const REVIEW = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const PUBLIC = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/lib\/clasificados\/comida-local\//,
  /^app\/\(site\)\/publicar\/comida-local\//,
  /^app\/\(site\)\/clasificados\/comida-local\//,
  /stripe/i,
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
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
  assert.ok(exists(PLAN), "OL-7B plan must exist");
  assert.ok(exists(AUDIT), "OL-7B audit must exist");
  assert.ok(exists(MIGRATION), "production bootstrap migration must exist");

  const migration = read(MIGRATION);
  const schema = read(SCHEMA);
  const scanHandler = read(SCAN_HANDLER);
  const scanPrep = read(SCAN_PREP);
  const normalizer = read(NORMALIZER);
  const docAi = read(DOC_AI);
  const review = read(REVIEW);
  const copy = read(COPY);
  const pub = read(PUBLIC);
  const pkg = read(PACKAGE);

  assert.match(migration, /create table if not exists public\.ofertas_locales/, "ofertas_locales table");
  assert.match(migration, /oferta_local_scan_jobs/, "scan jobs table");
  assert.match(migration, /oferta_local_items/, "items/candidates table");
  assert.match(migration, /review_status text not null default 'needs_review'/, "needs_review default");
  assert.match(migration, /is_active boolean not null default false/, "inactive default");
  assert.match(migration, /source_bbox jsonb/, "bbox column");
  assert.match(migration, /candidate_type/, "candidate type column");

  assert.match(schema, /20260616130000_ofertas_locales_ai_production_bootstrap/, "migration documented");
  assert.match(schema, /schema cache/i, "schema cache error detection");

  assert.match(scanHandler, /ofertasLocalesAiSchemaMissingDetail|ai_scan_schema_not_applied/, "scan schema error");
  assert.match(scanHandler, /processOfertaLocalAssetWithDocumentAi/, "real Document AI");
  assert.match(scanHandler, /source_storage_path|storagePath/, "storage metadata");
  assert.match(scanHandler, /review_status: "needs_review"/, "candidates need review");
  assert.match(scanHandler, /is_active: false/, "candidates not public");
  assert.doesNotMatch(scanHandler, /sampleCandidates|fakeItems|banana/i, "no fake scan candidates");

  assert.match(scanPrep, /schema_not_applied|ofertasLocalesAiSchemaMissingDetail/, "scan-prep schema error");

  assert.match(normalizer, /normalizeDocumentAiResultToOfertaLocalItems/, "normalizer exists");
  assert.match(normalizer, /sourceBbox|sourceContext|regularPriceText/, "extraction fields");
  assert.match(normalizer, /No se encontraron sugerencias claras/, "honest zero-candidate message");
  assert.doesNotMatch(normalizer, /banana|sampleItems|\[\s*\{\s*itemName:/i, "no hardcoded samples");

  assert.match(docAi, /pageLines/, "page line extraction");
  assert.match(docAi, /boundingBox/, "bbox from layout");

  assert.match(review, /aiReviewSuggestionsFound|Mantener|Keep/, "review UI");
  assert.match(review, /handleStatusAction.*approved/, "keep control");
  assert.match(review, /handleStatusAction.*rejected|aiReviewReject/, "remove control");
  assert.match(review, /aiReviewSave|Guardar revisión|Save review/, "save review control");
  assert.match(review, /sourceContext|sourceBbox/, "source context in UI");

  assert.match(copy, /Recorte automático no disponible|Automatic clipping is not available/, "no clipping promise");

  assert.match(pub, /review_status !== "approved"/, "public approved filter");
  assert.match(pub, /is_active/, "public active filter");

  assert.match(pkg, /ofertas-locales:ol7b-production-ai-schema-candidates-audit/, "package script");

  for (const file of changedFiles()) {
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-7B — Ofertas Locales production AI schema + candidate extraction audit passed.");
}

run();
