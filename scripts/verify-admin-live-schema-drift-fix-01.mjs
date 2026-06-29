/**
 * ADMIN-LIVE-SCHEMA-DRIFT-FIX-01 verification.
 * Run: npm run verify:admin-live-schema-drift-fix-01
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationDir = path.join(root, "supabase", "migrations");
const migrationNamePattern = /admin_live_schema_drift_fix_01\.sql$/;

function fail(message) {
  console.error(`verify-admin-live-schema-drift-fix-01: FAIL - ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

const migrationFiles = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter((name) => migrationNamePattern.test(name))
  : [];

if (migrationFiles.length !== 1) {
  fail(`expected exactly one admin_live_schema_drift_fix_01 migration, found ${migrationFiles.length}`);
}

const migrationRel = path.join("supabase", "migrations", migrationFiles[0]).replaceAll("\\", "/");
const migration = fs.readFileSync(path.join(root, migrationRel), "utf8");
const compact = migration.toLowerCase().replace(/\s+/g, " ");
const uncommented = migration
  .replace(/--.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .toLowerCase()
  .replace(/\s+/g, " ");

function includesSql(fragment) {
  return compact.includes(fragment.toLowerCase().replace(/\s+/g, " "));
}

function assertSql(fragment, message) {
  if (!includesSql(fragment)) fail(message);
}

assertSql(
  "create table if not exists public.listing_moderation_reviews",
  "migration must create listing_moderation_reviews if missing",
);
assertSql(
  "alter table public.listings add column if not exists admin_promoted",
  "migration must ensure listings.admin_promoted",
);
assertSql(
  "alter table public.listings add column if not exists leonix_verified",
  "migration must ensure listings.leonix_verified",
);
assertSql(
  "alter table public.servicios_public_listings add column if not exists promoted",
  "migration must ensure servicios_public_listings.promoted",
);
assertSql(
  "alter table public.empleos_public_listings add column if not exists admin_promoted",
  "migration must ensure empleos_public_listings.admin_promoted",
);
assertSql(
  "alter table public.empleos_public_listings add column if not exists leonix_verified",
  "migration must ensure empleos_public_listings.leonix_verified",
);
assertSql(
  "alter table public.viajes_staged_listings add column if not exists admin_promoted",
  "migration must ensure viajes_staged_listings.admin_promoted",
);
assertSql(
  "alter table public.viajes_staged_listings add column if not exists leonix_verified",
  "migration must ensure viajes_staged_listings.leonix_verified",
);

const requiredReviewColumns = [
  "listing_id",
  "listing_source",
  "category_slug",
  "leonix_ad_id",
  "decision",
  "risk_level",
  "recommended_action",
  "reason",
  "reason_categories",
  "policy_flags",
  "keyword_flags",
  "raw_result",
  "model",
  "reviewed_by",
  "created_at",
  "updated_at",
  "source_table",
  "reason_category",
  "reason_text",
  "category_rules",
  "scanner_result",
  "prompt_version",
  "policy_version",
  "error_message",
];

for (const column of requiredReviewColumns) {
  if (!compact.includes(column.toLowerCase())) {
    fail(`migration missing listing_moderation_reviews column/reference: ${column}`);
  }
}

if (/\bdrop\s+table\b/.test(uncommented)) fail("migration must not contain DROP TABLE");
if (/\bdrop\s+column\b/.test(uncommented)) fail("migration must not contain DROP COLUMN");
if (/\brename\s+column\b/.test(uncommented)) fail("migration must not contain RENAME COLUMN");
if (/\brename\s+to\b/.test(uncommented)) fail("migration must not contain table rename");

if (!includesSql("alter table public.listing_moderation_reviews enable row level security")) {
  fail("migration must ensure RLS remains enabled for listing_moderation_reviews");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (
  packageJson.scripts?.["verify:admin-live-schema-drift-fix-01"] !==
  "node scripts/verify-admin-live-schema-drift-fix-01.mjs"
) {
  fail("package script verify:admin-live-schema-drift-fix-01 missing");
}

ok(`verified migration: ${migrationRel}`);
console.log("verify-admin-live-schema-drift-fix-01: PASS");
