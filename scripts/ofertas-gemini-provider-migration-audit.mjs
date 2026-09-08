/**
 * Package 4A — Ofertas Gemini provider constraint migration audit.
 * Run: node scripts/ofertas-gemini-provider-migration-audit.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const migrationName = "20260731214500_allow_gemini_multimodal_oferta_local_scan_jobs_provider.sql";
const migrationPath = path.join(migrationsDir, migrationName);
const reportPath = path.join(root, "docs", "OFERTAS_GEMINI_PROVIDER_MIGRATION_PACKAGE_4A.md");
const historicalProviderMigrationNames = [
  "20260606120000_create_oferta_local_ai_scan_items.sql",
  "20260616130000_ofertas_locales_ai_production_bootstrap.sql",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listSqlMigrations() {
  return fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();
}

function assertOrderedConcepts(content, checks) {
  let cursor = 0;

  for (const { pattern, message } of checks) {
    const match = pattern.exec(content.slice(cursor));
    assert.ok(match, message);
    cursor += match.index + match[0].length;
  }
}

assert.ok(fs.existsSync(migrationPath), "Package 4A migration exists");
assert.ok(fs.existsSync(reportPath), "Package 4A rollback/deployment note exists");
for (const name of historicalProviderMigrationNames) {
  assert.ok(fs.existsSync(path.join(migrationsDir, name)), `historical provider migration exists: ${name}`);
}

const migration = read(migrationPath);
const report = read(reportPath);
const migrations = listSqlMigrations();
const geminiMigrations = migrations.filter((name) =>
  read(path.join(migrationsDir, name)).includes("gemini_multimodal")
);
const historicalProviderMigrations = historicalProviderMigrationNames.map((name) => ({
  name,
  content: read(path.join(migrationsDir, name)),
}));

assert.deepEqual(geminiMigrations, [migrationName], "exactly one migration mentions gemini_multimodal");
assert.match(migration, /alter table public\.oferta_local_scan_jobs\s+drop constraint oferta_local_scan_jobs_provider_check;/i, "drops exact provider constraint");
assert.match(migration, /add constraint oferta_local_scan_jobs_provider_check\s+check \(provider in \(/i, "recreates exact provider constraint");

for (const value of [
  "google_document_ai",
  "leonix_manual",
  "future_provider",
  "gemini_multimodal",
]) {
  assert.match(migration, new RegExp(`'${value}'`), `provider value preserved/added: ${value}`);
}

for (const { name, content } of historicalProviderMigrations) {
  assert.match(
    content,
    /provider\s+text\s+not\s+null\s+default\s+'google_document_ai'\s+check\s*\(\s*provider\s+in\s*\([\s\S]*'google_document_ai'[\s\S]*'leonix_manual'[\s\S]*'future_provider'[\s\S]*\)/i,
    `historical provider contract is intact: ${name}`,
  );
  assert.doesNotMatch(content, /gemini_multimodal/i, `historical migration does not include Gemini provider: ${name}`);
}

assert.doesNotMatch(migration, /drop constraint if exists/i, "migration does not hide missing expected constraint");
assert.doesNotMatch(migration, /\bupdate\b/i, "migration does not update rows");
assert.doesNotMatch(migration, /\bdelete\b/i, "migration does not delete rows");
assert.doesNotMatch(migration, /\binsert\b/i, "migration does not insert rows");
assert.doesNotMatch(migration, /drop\s+table/i, "migration does not drop tables");
assert.doesNotMatch(migration, /row level security|create policy|drop policy|alter policy/i, "migration does not change RLS");
assert.doesNotMatch(migration, /create\s+index|drop\s+index/i, "migration does not change indexes");
assert.doesNotMatch(migration, /foreign key|references\s+/i, "migration does not change foreign keys");
assert.doesNotMatch(migration, /add column|drop column|alter column|rename column/i, "migration does not change columns");
assert.doesNotMatch(migration, /alter table public\.(?!oferta_local_scan_jobs\b)/i, "migration touches no unrelated table");
assert.match(migration, /\bbegin;\s*[\s\S]*\bcommit;/i, "migration is transaction-wrapped");

assert.match(report, /Rollback precondition[\s\S]*provider = 'gemini_multimodal'/i, "rollback guidance checks Gemini rows");
assert.match(report, /Rollback:[\s\S]*alter table public\.oferta_local_scan_jobs[\s\S]*add constraint oferta_local_scan_jobs_provider_check[\s\S]*'future_provider'/i, "rollback SQL exists");
assert.match(report, /pg_get_constraintdef\(c\.oid\)/, "constraint verification SQL exists");
assert.match(report, /select provider, count\(\*\)/i, "provider distribution verification SQL exists");
assert.match(report, /begin;[\s\S]*insert into public\.oferta_local_scan_jobs[\s\S]*rollback;/i, "transaction-safe test procedure exists");
assert.match(report, /does not apply the migration, connect to a database/i, "report states migration is not applied and no database connection is used");
assert.match(report, /Does not change RLS|Does not update rows|Does not change RLS, indexes, foreign keys, or table columns/i, "report documents locked scope");
assertOrderedConcepts(report, [
  {
    pattern: /Apply the provider-compatibility database migration[\s\S]*before any runtime writes `gemini_multimodal`/i,
    message: "deployment order applies migration before runtime",
  },
  {
    pattern: /Verify the constraint definition/i,
    message: "deployment order verifies constraint definition",
  },
  {
    pattern: /Verify provider distribution/i,
    message: "deployment order verifies provider distribution",
  },
  {
    pattern: /staging QA/i,
    message: "deployment order includes staging QA",
  },
  {
    pattern: /controlled production rollout/i,
    message: "deployment order includes controlled production rollout",
  },
  {
    pattern: /original constraint cannot be restored while any row uses `gemini_multimodal`/i,
    message: "deployment order preserves rollback safety",
  },
]);

console.log("Ofertas Gemini provider migration audit passed.");
