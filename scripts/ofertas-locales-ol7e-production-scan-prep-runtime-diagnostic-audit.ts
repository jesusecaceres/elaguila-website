/**
 * Gate OL-7E — Ofertas Locales production scan-prep runtime diagnostic audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7E_PRODUCTION_SCAN_PREP_RUNTIME_DIAGNOSTIC_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL7E_PRODUCTION_SCAN_PREP_RUNTIME_DIAGNOSTIC_AUDIT.md";
const DIAGNOSTICS = "app/api/ofertas-locales/ai-runtime-diagnostics/route.ts";
const SCAN_PREP = "app/api/ofertas-locales/scan-prep/route.ts";
const SCHEMA = "app/lib/ofertas-locales/ofertasLocalesSupabaseSchema.ts";
const ROW_ADAPTER = "app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts";
const SCAN_HANDLER = "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts";
const PERSIST_CLIENT = "app/lib/ofertas-locales/ofertasLocalesAiScanPersistClient.ts";
const SCAN_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx";
const PUBLIC = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PACKAGE = "package.json";

const FORBIDDEN = [
  /^app\/lib\/clasificados\/comida-local\//,
  /^app\/\(site\)\/publicar\/comida-local\//,
  /^app\/\(site\)\/clasificados\/comida-local\//,
  /stripe/i,
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /^supabase\/migrations\/.*ol7e/i,
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
  assert.ok(exists(PLAN), "OL-7E plan must exist");
  assert.ok(exists(AUDIT), "OL-7E audit must exist");
  assert.ok(exists(DIAGNOSTICS), "ai-runtime-diagnostics route must exist");

  const diagnostics = read(DIAGNOSTICS);
  const scanPrep = read(SCAN_PREP);
  const schema = read(SCHEMA);
  const rowAdapter = read(ROW_ADAPTER);
  const scanHandler = read(SCAN_HANDLER);
  const persistClient = read(PERSIST_CLIENT);
  const scanPanel = read(SCAN_PANEL);
  const pub = read(PUBLIC);
  const pkg = read(PACKAGE);

  assert.match(pkg, /ofertas-locales:ol7e-production-scan-prep-runtime-diagnostic-audit/, "package script");

  assert.match(diagnostics, /requireAdminCookie/, "diagnostics protected by admin cookie");
  assert.match(diagnostics, /probeOfertasLocalesAiTables/, "diagnostics probes tables");
  assert.match(diagnostics, /parseSupabaseProjectRefFromUrl/, "diagnostics reports project ref");
  assert.match(diagnostics, /hasServiceRoleKey: Boolean/, "service role presence boolean only");
  assert.doesNotMatch(
    diagnostics,
    /SUPABASE_SERVICE_ROLE_KEY[^)]*\)\s*[,}]/,
    "no service role key value echoed in JSON"
  );
  assert.match(diagnostics, /hasAnonKey: Boolean/, "anon key presence boolean only");
  assert.doesNotMatch(
    diagnostics,
    /NEXT_PUBLIC_SUPABASE_ANON_KEY[^)]*\)\s*[,}]/,
    "no anon key value echoed in JSON"
  );

  assert.match(schema, /ofertas_locales[\s\S]*oferta_local_scan_jobs[\s\S]*oferta_local_items/, "all 3 required tables");
  assert.match(schema, /42703/, "column error excluded from table-missing classifier");
  assert.match(schema, /probeOfertasLocalesAiTables/, "shared table probe helper");

  assert.match(scanPrep, /probeOfertasLocalesAiTables/, "scan-prep probes all tables");
  assert.match(scanPrep, /scan_prep_insert_failed/, "insert failure code");
  assert.match(scanPrep, /scan_prep_update_failed/, "update failure code");
  assert.match(scanPrep, /buildOfertasLocalesScanPrepInsertRow/, "production row adapter for insert");
  assert.match(scanPrep, /OFERTAS_LOCALES_SCAN_PREP_RETURN_COLUMNS/, "safe return columns");
  assert.doesNotMatch(scanPrep, /\.select\("id, status, submitted_at"\)/, "no hardcoded submitted_at select");

  assert.match(rowAdapter, /draft_snapshot/, "overflow to draft_snapshot");
  assert.match(rowAdapter, /OFERTAS_LOCALES_KNOWN_DB_COLUMNS/, "known column filter");

  assert.match(scanHandler, /processOfertaLocalAssetWithDocumentAi/, "real Document AI path");
  assert.match(scanHandler, /External URLs cannot be scanned/, "external URLs blocked");
  assert.match(scanHandler, /review_status: "needs_review"/, "candidates need review");
  assert.match(scanHandler, /is_active: false/, "candidates inactive");
  assert.doesNotMatch(scanHandler, /sampleCandidates|fakeItems|banana/i, "no fake candidates");

  assert.match(persistClient, /code/, "persist client surfaces error code");

  assert.match(scanPanel, /Preparando escaneo|Preparing scan/, "prep phase label");
  assert.match(scanPanel, /setScanMessage\(null\)/, "clears message on retry");
  assert.match(scanPanel, /setServerConfigurationMissing\(false\)/, "clears stale config flag on retry");
  assert.match(scanPanel, /submitOfertaLocalAiScan/, "proceeds to real scan after prep");

  assert.match(pub, /review_status !== "approved"/, "public approved filter");
  assert.match(pub, /is_active/, "public active filter");

  const changed = changedFiles();
  const newMigration = changed.filter((f) => /^supabase\/migrations\//.test(f));
  assert.equal(newMigration.length, 0, "no new Supabase migration in OL-7E");

  for (const file of changed) {
    if (FORBIDDEN.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
  }

  console.log("Gate OL-7E — Ofertas Locales production scan-prep runtime diagnostic audit passed.");
}

run();
