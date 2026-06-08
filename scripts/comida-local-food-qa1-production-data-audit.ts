/**
 * Gate FOOD-QA1 — Comida Local production data availability + live QA lock static audit.
 * Run: npm run comida-local:food-qa1-production-data-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_QA1 = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_QA1_PRODUCTION_DATA_AUDIT.md";
const FOOD_L9B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md";
const MIGRATION_DIR = "supabase/migrations";
const EXPECTED_MIGRATION = "20260604120000_comida_local_public_listings.sql";
const TABLE = "comida_local_public_listings";

const FAKE_LISTING_MARKERS = [
  "fakeListing",
  "demoListing",
  "placeholderListing",
  "MOCK_COMIDA",
  "seedComidaLocal",
] as const;

const ANALYTICS_MARKERS = ["views", "clicks", "impressions", "llamadas", "visitas"] as const;

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "app/(site)/publicar/rentas/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/clasificados/autos/",
  "app/(site)/dashboard/",
  "app/admin/",
  "app/api/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/supabase/server.ts",
  "scripts/comida-local-food-qa1",
  "package.json",
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
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isGateScopedChange(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function findMigrationWithTable(): string | null {
  const dir = path.join(ROOT, MIGRATION_DIR);
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".sql")) continue;
    const content = fs.readFileSync(path.join(dir, name), "utf8");
    const hasCreate =
      /create\s+table\s+(if\s+not\s+exists\s+)?(?:public\.)?comida_local_public_listings/i.test(
        content
      );
    if (hasCreate) return `${MIGRATION_DIR}/${name}`;
  }
  return null;
}

function run() {
  assert.ok(exists(FOOD_QA1), `${FOOD_QA1} must exist`);
  assert.ok(exists(FOOD_L9B), `${FOOD_L9B} must exist (prior production table gate)`);

  const resultsPage = "app/(site)/clasificados/comida-local/page.tsx";
  assert.ok(exists(resultsPage), "Comida Local results page must exist");

  const migrationPath = findMigrationWithTable();
  assert.ok(migrationPath, `Migration must create table ${TABLE}`);
  assert.ok(migrationPath!.includes(EXPECTED_MIGRATION), `Expected ${EXPECTED_MIGRATION}`);

  const queries = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert.ok(queries.includes(`"${TABLE}"`));
  assert.ok(
    queries.includes("getServerSupabaseAnon") || queries.includes("isSupabasePublicReadConfigured"),
    "Public queries must use anon+RLS read path"
  );
  assert.ok(queries.includes("classifyComidaLocalInventoryError"));
  assert.ok(queries.includes('source: "published"') || queries.includes("source: 'published'"));

  const inventoryErrors = read(
    "app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts"
  );
  assert.ok(inventoryErrors.includes("Resultados temporalmente no disponibles."));
  assert.ok(inventoryErrors.includes("Aún no hay publicaciones de Comida Local."));

  const page = read(resultsPage);
  assert.ok(page.includes("listPublishedComidaLocalListings"));
  assert.ok(page.includes("COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES"));
  assert.ok(page.includes("COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES"));
  assert.ok(page.includes("inventoryBlocked") || page.includes("inventory_table_missing"));
  assert.ok(page.includes("ComidaLocalListingCard"));

  for (const marker of FAKE_LISTING_MARKERS) {
    assert.ok(!page.includes(marker), `No fake listing fallback: ${marker}`);
    assert.ok(!queries.includes(marker), `No fake listing in queries: ${marker}`);
  }

  for (const metric of ANALYTICS_MARKERS) {
    const metricRe = new RegExp(`\\b${metric}\\b`, "i");
    assert.ok(!metricRe.test(page), `Results page must not add analytics metric: ${metric}`);
  }

  const server = read("app/lib/supabase/server.ts");
  assert.ok(server.includes("getServerSupabaseAnon"));
  assert.ok(server.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

  const slugPage = read("app/(site)/clasificados/comida-local/[slug]/page.tsx");
  assert.ok(slugPage.includes("getPublishedComidaLocalListingBySlug"));
  assert.ok(slugPage.includes("notFound"));

  const audit = read(FOOD_QA1);
  assert.ok(audit.includes("FOOD-QA1"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-qa1-production-data-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
    if (p.includes("stripe") || p.includes("Stripe")) {
      assert.fail(`Stripe path changed: ${p}`);
    }
    if (p.startsWith("supabase/migrations/") || p.startsWith("database/migrations/")) {
      assert.fail(`Migration file changed: ${p}`);
    }
  }

  console.log("FOOD-QA1 production data audit passed.");
}

run();
