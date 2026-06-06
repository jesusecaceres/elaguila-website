/**
 * Gate FOOD-L9B — Comida Local production table visibility + results recovery static audit.
 * Run: npm run comida-local:food-l9b-production-table-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const FOOD_L5B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md";
const FOOD_L9B = "app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md";
const MIGRATION_DIR = "supabase/migrations";
const EXPECTED_MIGRATION = "20260604120000_comida_local_public_listings.sql";
const TABLE = "comida_local_public_listings";

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
  "app/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/lib/clasificados/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/api/clasificados/comida-local/",
  "supabase/migrations/",
  "scripts/comida-local-food-l9b",
  "package.json",
];

const RAW_ERROR_MARKERS = [
  "schema cache",
  "Could not find the table",
  "PGRST205",
  "does not exist",
] as const;

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
  assert.ok(exists(FOOD_L5B), `${FOOD_L5B} must exist (FOOD-L5B)`);
  assert.ok(exists(FOOD_L9B), `${FOOD_L9B} must exist (FOOD-L9B)`);

  const migrationPath = findMigrationWithTable();
  assert.ok(migrationPath, `Migration must create table ${TABLE}`);
  assert.ok(
    migrationPath!.includes(EXPECTED_MIGRATION),
    `Expected migration ${EXPECTED_MIGRATION}, found ${migrationPath}`
  );

  const migration = read(migrationPath!);
  assert.ok(/create\s+table\s+if\s+not\s+exists\s+public\.comida_local_public_listings/i.test(migration));
  assert.ok(/enable row level security/i.test(migration));
  assert.ok(/comida_local_public_listings_select_public/i.test(migration));
  assert.ok(migration.includes("status = 'published'"));

  const publicQueries = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");
  assert.ok(publicQueries.includes(`"${TABLE}"`));
  assert.ok(publicQueries.includes("classifyComidaLocalInventoryError"));
  assert.ok(publicQueries.includes("inventory_table_missing"));
  assert.ok(!/bannerNote:\s*fetched\.error/.test(publicQueries));

  const inventoryErrors = read(
    "app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts"
  );
  assert.ok(inventoryErrors.includes("Resultados temporalmente no disponibles."));
  assert.ok(inventoryErrors.includes("Aún no hay publicaciones de Comida Local."));
  assert.ok(inventoryErrors.includes("isComidaLocalTableMissingError"));

  const publish = read("app/api/clasificados/comida-local/publish/route.ts");
  assert.ok(publish.includes(`"${TABLE}"`));

  const dashboardPath = "app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts";
  if (exists(dashboardPath)) {
    assert.ok(read(dashboardPath).includes(`"${TABLE}"`));
  }

  const adminPath = "app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts";
  if (exists(adminPath)) {
    assert.ok(read(adminPath).includes(`"${TABLE}"`));
  }

  const resultsPage = read("app/(site)/clasificados/comida-local/page.tsx");
  assert.ok(resultsPage.includes("listPublishedComidaLocalListings"));
  assert.ok(resultsPage.includes("inventory_table_missing") || resultsPage.includes("inventoryBlocked"));
  assert.ok(!/\[\s*\{[^}]*businessName:\s*["']/.test(resultsPage), "No inline demo listing array");
  for (const marker of RAW_ERROR_MARKERS) {
    assert.ok(!resultsPage.includes(marker), `Results page must not expose raw error: ${marker}`);
  }

  const audit = read(FOOD_L9B);
  assert.ok(audit.includes("FOOD-L9B"));
  assert.ok(audit.includes("schema cache") || audit.includes("comida_local_public_listings"));
  assert.ok(audit.includes("20260604120000_comida_local_public_listings.sql"));
  assert.ok(audit.includes("| Requirement | TRUE/FALSE | Evidence |"));

  const pkg = read("package.json");
  assert.ok(pkg.includes('"comida-local:food-l9b-production-table-audit"'));

  for (const p of changedFiles()) {
    if (!isGateScopedChange(p)) continue;
    if (FORBIDDEN_PREFIXES.some((f) => p.startsWith(f))) {
      assert.fail(`Forbidden path changed: ${p}`);
    }
  }

  console.log("FOOD-L9B production table audit passed.");
}

run();
