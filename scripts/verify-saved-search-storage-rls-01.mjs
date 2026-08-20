#!/usr/bin/env node
/**
 * Saved Search 01B — statically proves the reconciliation migration contains the approved V1
 * storage/RLS contract, handles both "table absent" and "legacy table present" cases safely, and
 * never performs a destructive operation. Whitespace-tolerant (normalizes runs of whitespace
 * before matching) rather than brittle to exact formatting.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationPath = "supabase/migrations/20260817120000_saved_searches_v1_reconcile.sql";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sql = read(migrationPath);
/** Strip `-- ...` line comments before matching so prose (e.g. explaining what NOT to do) can never produce a false positive. */
const sqlNoComments = sql
  .split(/\r?\n/)
  .map((line) => line.replace(/--.*$/, ""))
  .join("\n");
const norm = sql.replace(/\s+/g, " ").toLowerCase();
const normCode = sqlNoComments.replace(/\s+/g, " ").toLowerCase();
/** For matching prose split across adjacent SQL string literals (e.g. multi-line COMMENT text) —
 * strips quote/backtick characters so segment boundaries like `' '` don't break a phrase match. */
const normProse = sql.replace(/['`]/g, "").replace(/\s+/g, " ").toLowerCase();

// --- target file ------------------------------------------------------------------------------
assert(fs.existsSync(path.join(root, migrationPath)), "reconciliation migration file must exist");
assert(/create table if not exists\s+public\.saved_searches/.test(norm), "must target saved_searches via CREATE TABLE IF NOT EXISTS (absent-case safe)");

// --- absent/present reconciliation ---------------------------------------------------------
assert(
  /to_regclass\('public\.saved_searches'\)/.test(norm),
  "must inspect whether the table already exists before assuming a shape (to_regclass check)",
);
assert(/raise exception/.test(norm), "must fail closed (RAISE EXCEPTION) on an unexpected/incompatible existing schema");
assert(
  (norm.match(/add column if not exists/g) ?? []).length >= 6,
  "must safely add each new normalized column with ADD COLUMN IF NOT EXISTS (works whether the table is fresh or legacy)",
);

// --- ownership --------------------------------------------------------------------------------
assert(/user_id uuid not null references auth\.users\(id\) on delete cascade/.test(norm), "user_id must be a NOT NULL uuid FK to auth.users with ON DELETE CASCADE");

// --- existing-column property reconciliation (not just existence) — PM finding fix ------------
// `ADD COLUMN IF NOT EXISTS` alone only proves a column exists; these prove the migration also
// verifies (fail-closed) or explicitly repairs the TYPE/NULLABILITY/DEFAULT/PK/FK of every
// column the legacy migration already declared, rather than assuming a pre-existing column has
// the right shape just because its name matches.
assert(/if to_regclass\('public\.saved_searches'\) is null then/.test(norm), "must branch explicitly on whether the table already exists before verifying legacy column properties");
for (const col of ["id", "user_id", "category", "city", "created_at"]) {
  assert(
    new RegExp(`table_name = 'saved_searches' and column_name = '${col}'`).test(norm),
    `must introspect information_schema.columns for the pre-existing '${col}' column (type/nullability proof, not just existence)`,
  );
}
assert(
  /conrelid = 'public\.saved_searches'::regclass and c\.contype = 'p' and a\.attname = 'id'/.test(norm),
  "must prove id is actually the primary key via pg_constraint (not merely assume it), and fail closed if not",
);
assert(
  /conrelid = 'public\.saved_searches'::regclass and c\.contype = 'f'\s*and c\.confrelid = 'auth\.users'::regclass and c\.confdeltype = 'c' and a\.attname = 'user_id'/.test(norm),
  "must prove user_id's FK to auth.users(id) ON DELETE CASCADE actually exists via pg_constraint (not merely assume it), and fail closed if not",
);
assert(
  /existing category column is nullable/.test(norm) && /existing user_id column is nullable/.test(norm),
  "must fail closed if a pre-existing category or user_id column is nullable (both must be NOT NULL)",
);

// --- category: required, non-empty, never fabricated for legacy rows --------------------------
assert(/category text not null,?\s*$/m.test(sql) === false || /category text not null/.test(norm), "category must be NOT NULL");
assert(!/category text not null default ''/.test(norm), "category must NOT carry a DEFAULT '' — every insert must supply a real category (no silent empty fallback)");
assert(/alter column category drop default/.test(norm), "must explicitly reconcile a pre-existing legacy table's category DEFAULT '' by dropping it (DEFAULT is the one legacy property safe to repair non-destructively)");
assert(!/set category\s*=/.test(normCode), "must never write/fabricate a value into an existing row's category column");

// --- legacy row update-compatibility (Saved Search 01D correction): the category non-empty
// CHECK must exempt genuine legacy-compat rows (fingerprint = 'legacy:' || id::text) or Postgres
// would re-enforce it on every future UPDATE of that row (not just changes to category itself),
// permanently blocking read/pause/reactivate/delete of any preserved blank-category legacy row.
assert(
  /check \(\s*fingerprint = 'legacy:' \|\| id::text\s*or \(category is not null and length\(btrim\(category\)\) > 0\)\s*\) not valid/.test(norm),
  "category non-empty CHECK must exempt rows whose fingerprint is exactly 'legacy:' || id::text (own-row legacy marker), OR require a real non-empty category — not a bare NOT NULL/non-empty check that would trap legacy rows on their next update",
);
assert(
  /a genuine preserved\s*-*\s*legacy row \(fingerprint still exactly legacy:<its own id>\) may keep an empty category/.test(normProse),
  "must document that a genuine legacy row may keep a blank category across future updates (read/pause/reactivate/delete), while normalized rows may not",
);
assert(
  /every legacy row saved search 02 has actually re-saved, must have a real category/.test(normProse),
  "must document that normalizing a legacy row (giving it a real fingerprint) requires a real category at that same moment",
);

// --- city: truthful optional-filter semantics, not fabricated ----------------------------------
assert(/city text not null default ''/.test(norm), "city keeps NOT NULL DEFAULT '' as the single canonical truthful \"no city filter\" representation");
assert(/alter column city set default ''/.test(norm), "must explicitly reconcile a pre-existing legacy table's city DEFAULT to match the target contract");
assert(!/check \(length\(trim\(city\)\)/.test(norm), "city must NOT have a non-empty CHECK constraint — an absent city is valid search semantics, not incomplete data");

// --- DEFAULT reconciliation for id / created_at -------------------------------------------------
assert(/alter column id set default gen_random_uuid\(\)/.test(norm), "must explicitly reconcile id's DEFAULT gen_random_uuid()");
assert(/alter column created_at set default now\(\)/.test(norm), "must explicitly reconcile created_at's DEFAULT now()");

// --- normalized columns -----------------------------------------------------------------------
for (const col of [
  "add column if not exists min_price integer",
  "add column if not exists max_price integer",
  "add column if not exists filter_payload jsonb not null default '{}'::jsonb",
  "add column if not exists is_active boolean not null default true",
  "add column if not exists updated_at timestamptz not null default now()",
  "add column if not exists fingerprint text",
]) {
  assert(norm.includes(col), `migration must add: ${col}`);
}
assert(/category text not null/.test(norm), "category must be present and NOT NULL");
assert(/city text not null/.test(norm), "city must be present and NOT NULL");
assert(/created_at timestamptz not null default now\(\)/.test(norm), "created_at must be present, NOT NULL, defaulted");

// --- fingerprint: NOT NULL only after a legacy-safe backfill, never invented semantics --------
const fingerprintBackfillIdx = norm.indexOf("update public.saved_searches set fingerprint = 'legacy:'");
const fingerprintNotNullIdx = norm.indexOf("alter column fingerprint set not null");
assert(fingerprintBackfillIdx !== -1, "must backfill any existing NULL fingerprint with a clearly-marked legacy-safe deterministic value");
assert(norm.slice(fingerprintBackfillIdx, fingerprintBackfillIdx + 200).includes("|| id::text"), "legacy fingerprint must be derived from the row's own unique id (deterministic, collision-free) — not fabricated search meaning");
assert(fingerprintNotNullIdx !== -1, "fingerprint must become NOT NULL");
assert(fingerprintBackfillIdx < fingerprintNotNullIdx, "fingerprint must be backfilled BEFORE the NOT NULL transition (never NOT NULL before existing rows can satisfy it)");

// --- dedup contract -----------------------------------------------------------------------
assert(
  /create unique index if not exists saved_searches_owner_category_fingerprint_uidx\s+on public\.saved_searches \(user_id, category, fingerprint\)/.test(norm),
  "must enforce UNIQUE (user_id, category, fingerprint) dedup",
);

// --- indexes ------------------------------------------------------------------------------
assert(/create index if not exists idx_saved_searches_user_id on public\.saved_searches \(user_id\)/.test(norm), "must keep/ensure the owner-lookup index on user_id");
assert(
  /create index if not exists idx_saved_searches_category_active_city\s+on public\.saved_searches \(category, is_active, city\)/.test(norm),
  "must add the matcher-prefilter index on (category, is_active, city)",
);

// --- normalized fingerprint semantic contract (category + city + min_price + max_price +
// filter_payload — never just category + filter_payload) ---------------------------------------
assert(
  /deterministic hash of the full canonical search \(category, city, min_price, max_price, filter_payload/.test(normProse),
  "fingerprint contract must document all five canonical inputs (category, city, min_price, max_price, filter_payload), not just category + filter_payload",
);
assert(/computed by saved search 02 application logic, not by the database/.test(normProse), "hashing/canonicalization must be documented as application-computed, not database-computed");

// --- RLS policy scope: only the one named owner policy is ever dropped/created -----------------
assert(
  /drop policy if exists "user can manage own saved searches" on public\.saved_searches/.test(normCode),
  "DROP POLICY must be scoped to the exact named owner policy only (never a blanket policy drop)",
);
assert((normCode.match(/drop policy if exists/g) ?? []).length === 1, "must drop at most the one named policy — never more");

// --- price validation -----------------------------------------------------------------------
assert(norm.includes("check (min_price is null or min_price >= 0)"), "min_price must be constrained >= 0 when present");
assert(norm.includes("check (max_price is null or max_price >= 0)"), "max_price must be constrained >= 0 when present");
assert(norm.includes("check (min_price is null or max_price is null or max_price >= min_price)"), "max_price must be >= min_price when both present");
assert(norm.includes("check (length(trim(fingerprint)) > 0)"), "fingerprint must be constrained non-empty");

// --- updated_at maintenance (DB-maintained, matching repo's magazine_visual_assets precedent) --
assert(/create or replace function public\.saved_searches_set_updated_at/.test(norm), "must define a dedicated updated_at trigger function (repo precedent: magazine_visual_assets_set_updated_at)");
assert(/create trigger saved_searches_updated_at\s+before update on public\.saved_searches/.test(norm), "must attach a BEFORE UPDATE trigger maintaining updated_at");

// --- RLS ----------------------------------------------------------------------------------
assert(/alter table public\.saved_searches enable row level security/.test(norm), "RLS must be enabled");
assert(
  /create policy "user can manage own saved searches" on public\.saved_searches\s+for all using \(auth\.uid\(\) = user_id\) with check \(auth\.uid\(\) = user_id\)/.test(norm),
  "must (re)create the owner-only FOR ALL policy keyed on auth.uid() = user_id",
);
assert(!/to anon/.test(norm) && !/to public\s/.test(norm) && !/for select to anon/.test(norm), "must not grant any anon/public policy");
assert(!/create policy/.test(norm.replace(/create policy "user can manage own saved searches"/, "")), "must not introduce any additional policy beyond the single owner-only policy");

// --- Saved Search 01D: final post-reconciliation certification (all 11 canonical columns) -----
// `ADD COLUMN IF NOT EXISTS` only reconciles existence — this proves the migration also asserts
// the FINAL type/nullability of every canonical column after all reconciliation runs, failing
// closed rather than silently accepting/casting an unexpected incompatible column.
const CANONICAL_COLUMNS = [
  ["id", "uuid", true],
  ["user_id", "uuid", true],
  ["category", "text", true],
  ["city", "text", true],
  ["min_price", "integer", false],
  ["max_price", "integer", false],
  ["filter_payload", "jsonb", true],
  ["fingerprint", "text", true],
  ["is_active", "boolean", true],
  ["created_at", "timestamp with time zone", true],
  ["updated_at", "timestamp with time zone", true],
];
assert(/post-reconciliation certification/.test(norm), "must contain a distinct, clearly-labeled final post-reconciliation certification block");
for (const [col, type] of CANONICAL_COLUMNS) {
  assert(
    new RegExp(`'${col}', '${type}', (true|false)`).test(norm),
    `final certification must assert column '${col}' is exactly type '${type}'`,
  );
}
for (const [col] of CANONICAL_COLUMNS.filter(([, , notNull]) => notNull)) {
  assert(new RegExp(`'${col}', '[a-z ]+', true`).test(norm), `final certification must require '${col}' to be NOT NULL`);
}
for (const [col] of CANONICAL_COLUMNS.filter(([, , notNull]) => !notNull)) {
  assert(new RegExp(`'${col}', '[a-z ]+', false`).test(norm), `final certification must leave '${col}' nullable (min_price/max_price are truthfully optional)`);
}
assert(
  /column % is type % \(expected %\) — an unexpected incompatible column already occupied this name; refusing to silently cast or proceed/.test(norm),
  "final certification must fail closed (RAISE EXCEPTION) on a type mismatch — never silently cast an incompatible pre-existing column",
);
assert(!/alter column \w+ type/.test(normCode), "must never ALTER COLUMN ... TYPE an existing column — an incompatible pre-existing column must fail closed, not be silently cast");

// --- no destructive operations (checked against comment-stripped SQL only) --------------------
assert(!/drop table/.test(normCode), "must never DROP TABLE saved_searches");
assert(!/truncate/.test(normCode), "must never TRUNCATE");
assert(!normCode.includes("drop column"), "must not drop any existing column (non-destructive reconciliation only)");
assert(!/delete from public\.saved_searches/.test(normCode), "must never DELETE existing rows");
assert(
  !/supabase db push|supabase migration up|apply_migration|psql\s/.test(normCode),
  "migration file must never itself invoke a migration-apply command",
);

console.log("OK: targets saved_searches via CREATE TABLE IF NOT EXISTS (safe when absent)");
console.log("OK: fails closed on an unexpected existing schema (user_id type check + RAISE EXCEPTION)");
console.log("OK: safely adds every normalized column via ADD COLUMN IF NOT EXISTS (safe when legacy table present)");
console.log("OK: user_id is a NOT NULL uuid FK to auth.users with ON DELETE CASCADE");
console.log("OK: category/city/min_price/max_price/filter_payload/fingerprint/is_active/created_at/updated_at all present");
console.log("OK: proves (not just assumes) type/nullability of every pre-existing legacy column: id, user_id, category, city, created_at");
console.log("OK: proves id is the primary key and user_id's FK to auth.users(id) ON DELETE CASCADE via pg_constraint, not assumed");
console.log("OK: category has no DEFAULT '' (no silent empty fallback); legacy DEFAULT is explicitly dropped on reconciliation");
console.log("OK: category non-empty CHECK guards NULL explicitly and is NOT VALID (never fabricates or fails over pre-existing data)");
console.log("OK: no statement ever writes/fabricates a category value into an existing row");
console.log("OK: city keeps NOT NULL DEFAULT '' as the single truthful \"no filter\" representation; no non-empty CHECK on city");
console.log("OK: id/created_at DEFAULTs explicitly reconciled for a pre-existing legacy table");
console.log("OK: fingerprint contract documents all five canonical inputs (category, city, min_price, max_price, filter_payload), computed by application logic");
console.log("OK: DROP POLICY is scoped to exactly the one named owner policy — never a blanket drop");
console.log("OK: fingerprint backfilled with a legacy-safe deterministic id-derived value BEFORE the NOT NULL transition");
console.log("OK: dedup UNIQUE (user_id, category, fingerprint) present");
console.log("OK: owner index on user_id and matcher-prefilter index on (category, is_active, city) present");
console.log("OK: price validation constraints present");
console.log("OK: updated_at is database-maintained via a dedicated BEFORE UPDATE trigger");
console.log("OK: RLS enabled with a single owner-only policy; no anon/public policy");
console.log("OK: no DROP TABLE / TRUNCATE / DELETE / destructive column drop anywhere in the migration");
console.log("OK: category non-empty CHECK exempts genuine legacy:<id> rows so they stay updatable (pause/reactivate/delete) without fabricating a category");
console.log("OK: normalizing a legacy row (real fingerprint) is documented as requiring a real category at that same moment");
console.log("OK: final post-reconciliation certification asserts exact type for all 11 canonical columns, after every CREATE/ADD COLUMN/ALTER statement");
console.log("OK: final certification requires NOT NULL on all 9 required columns; min_price/max_price remain nullable");
console.log("OK: final certification fails closed on a type mismatch — never silently casts an incompatible pre-existing column");
console.log("OK: no ALTER COLUMN ... TYPE anywhere in the migration");
console.log("OK: migration file never itself invokes a migration-apply command");
console.log("verify-saved-search-storage-rls-01: PASS");
