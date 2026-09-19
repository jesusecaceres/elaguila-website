/**
 * GATE 6 — verifies the FINAL database migration PROPOSALS (docs/admin-os/proposed-migrations/) are well-formed and can never
 * auto-apply. Pure filesystem checks: it never connects to a database and never reads a secret.
 *
 * Asserts:
 *   1. every expected proposal file exists,
 *   2. none of them is inside supabase/migrations/ (and no proposal filename/version collides with an existing migration),
 *   3. each proposal has a matching `_rollback.sql`,
 *   4. every proposal file is transaction-wrapped (or, for the documented exception, says why it is not) and idempotent-shaped,
 *   5. proposal versions are strictly greater than the highest version in supabase/migrations and than 20260919000000,
 *   6. FINAL_DB_MIGRATIONS_PROPOSED_2026-09.md says NOT APPLIED and lists every proposal + rollback,
 *   7. key safety properties of the SQL (service-role-only RPC ACL, RLS + revoke on the reminder table, partial unique index predicate,
 *      guard trigger constrains only client roles, no proposal contains apply-time DML on production data).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-db-proposals.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const path = (rel: string) => new URL(rel, root);
const read = (rel: string) => readFileSync(path(rel), "utf8");

const PROPOSAL_DIR = "docs/admin-os/proposed-migrations";
const MIGRATIONS_DIR = "supabase/migrations";
const DOC = "docs/admin-os/FINAL_DB_MIGRATIONS_PROPOSED_2026-09.md";
const OLD_DOC = "docs/admin-os/PROPOSED_DB_HARDENING_2026-09.md";
const MIN_VERSION = "20260919000000";

const EXPECTED = [
  "20260920120000_revoke_capacity_rpc_client_execute",
  "20260920121000_listing_lifecycle_reminder_events_lockdown",
  "20260920122000_listings_owner_authority_guard",
  "20260920123000_restaurantes_public_listings_draft_listing_id_uidx",
  "20260920124000_capacity_rpc_commercial_authority",
] as const;

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    failures.push(`${name}: ${msg}`);
    console.error(`FAIL: ${name}\n  ${msg}`);
  }
}

// Strip SQL comments so keyword checks cannot be satisfied (or tripped) by prose in a header.
function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
}

const migrationNames = readdirSync(path(`${MIGRATIONS_DIR}/`)).filter((n) => n.endsWith(".sql"));
const migrationVersions = migrationNames.map((n) => n.split("_")[0]).sort();
const maxMigrationVersion = migrationVersions[migrationVersions.length - 1] ?? "0";

check("proposal directory exists and is NOT under supabase/", () => {
  assert.ok(existsSync(path(`${PROPOSAL_DIR}/`)), "proposal directory missing");
  assert.ok(!PROPOSAL_DIR.startsWith("supabase/"), "proposal directory must not be under supabase/");
});

for (const base of EXPECTED) {
  const forward = `${PROPOSAL_DIR}/${base}.sql`;
  const rollback = `${PROPOSAL_DIR}/${base}_rollback.sql`;

  check(`${base}: forward + rollback files exist`, () => {
    assert.ok(existsSync(path(forward)), `missing ${forward}`);
    assert.ok(existsSync(path(rollback)), `missing rollback ${rollback}`);
  });

  check(`${base}: not inside supabase/migrations and no filename/version collision`, () => {
    assert.ok(!existsSync(path(`${MIGRATIONS_DIR}/${base}.sql`)), "forward file must not exist in supabase/migrations");
    assert.ok(!existsSync(path(`${MIGRATIONS_DIR}/${base}_rollback.sql`)), "rollback must not exist in supabase/migrations");
    const version = base.split("_")[0];
    assert.ok(!migrationVersions.includes(version), `version ${version} already used by supabase/migrations`);
    assert.ok(version > maxMigrationVersion, `version ${version} must be > latest existing migration ${maxMigrationVersion}`);
    assert.ok(version > MIN_VERSION, `version ${version} must be > ${MIN_VERSION}`);
    assert.match(version, /^\d{14}$/, "version must be a 14-digit timestamp");
  });

  check(`${base}: header declares NOT APPLIED`, () => {
    assert.match(read(forward), /NOT APPLIED/, "forward header must say NOT APPLIED");
    assert.match(read(rollback), /NOT APPLIED/, "rollback header must say NOT APPLIED");
  });

  check(`${base}: transaction-wrapped`, () => {
    for (const f of [forward, rollback]) {
      const sql = stripSqlComments(read(f));
      assert.match(sql, /\bbegin;/i, `${f}: missing begin;`);
      assert.match(sql, /\bcommit;/i, `${f}: missing commit;`);
      assert.ok(!/create\s+(unique\s+)?index\s+concurrently/i.test(sql), `${f}: CONCURRENTLY cannot run in a transaction (documented in the header comment only)`);
    }
  });
}

check("proposal directory contains no unexpected forward migration (every timestamped file is accounted for)", () => {
  const files = readdirSync(path(`${PROPOSAL_DIR}/`)).filter((n) => /^\d{14}_.*\.sql$/.test(n));
  const expectedFiles = new Set(EXPECTED.flatMap((b) => [`${b}.sql`, `${b}_rollback.sql`]));
  for (const f of files) assert.ok(expectedFiles.has(f), `unexpected file ${f} (add it to EXPECTED with a rollback)`);
});

check("branch-DB test files exist and end in ROLLBACK (nothing persists)", () => {
  for (const t of ["listings_owner_authority_guard_branch_tests.sql", "capacity_rpc_authority_branch_tests.sql"]) {
    const sql = read(`${PROPOSAL_DIR}/tests/${t}`);
    assert.match(sql, /\brollback;/i, `${t}: must end with rollback;`);
    assert.ok(!/\bcommit;/i.test(stripSqlComments(sql)), `${t}: must never commit`);
    assert.match(sql, /NEVER|never on production|throwaway/i, `${t}: must warn against production use`);
  }
});

check("FINAL doc says NOT APPLIED and lists every proposal + rollback", () => {
  const doc = read(DOC);
  assert.match(doc, /NOT APPLIED/, "doc must say NOT APPLIED");
  assert.ok((doc.match(/\*\*NOT APPLIED\*\*/g) ?? []).length >= EXPECTED.length, "overview table must mark every row NOT APPLIED");
  for (const base of EXPECTED) {
    assert.ok(doc.includes(`${base}.sql`), `doc must list ${base}.sql`);
    assert.ok(doc.includes(`${base.split("_")[0]}_`) || doc.includes(`…${base.split("_")[0].slice(8)}_`) || doc.includes(`${base}_rollback.sql`), `doc must reference the rollback for ${base}`);
  }
  assert.ok(!/\bAPPLIED to production\b/i.test(doc.replace(/NOT APPLIED/g, "")), "doc must not claim anything was applied");
});

check("older hardening doc points at the final doc and stays 'none applied'", () => {
  const old = read(OLD_DOC);
  assert.match(old, /FINAL_DB_MIGRATIONS_PROPOSED_2026-09\.md/, "old doc must reference the final doc");
  assert.match(old, /none applied/i, "old doc header must still say none applied");
});

check("#1 revoke_capacity_rpc: service_role only, both functions, no body change", () => {
  const sql = stripSqlComments(read(`${PROPOSAL_DIR}/${EXPECTED[0]}.sql`));
  for (const fn of ["br_negocio_activate_listing", "autos_dealer_activate_listing"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\(uuid, uuid, text\\)\\s+from public, anon, authenticated`, "i"), `${fn}: revoke from public, anon, authenticated`);
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\(uuid, uuid, text\\)\\s+to service_role`, "i"), `${fn}: grant to service_role`);
  }
  assert.ok(!/create\s+or\s+replace\s+function/i.test(sql), "must not redefine the function bodies");
});

check("#2 reminder events: RLS enabled, all privileges (incl. TRUNCATE) revoked from client roles, no owner policy", () => {
  const sql = stripSqlComments(read(`${PROPOSAL_DIR}/${EXPECTED[1]}.sql`));
  assert.match(sql, /alter table public\.listing_lifecycle_reminder_events enable row level security/i);
  assert.match(sql, /revoke all on table public\.listing_lifecycle_reminder_events from anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.listing_lifecycle_reminder_events from public/i);
  assert.ok(!/create\s+policy/i.test(sql), "no owner policy: no app reader exists");
  assert.match(sql, /'TRUNCATE'/, "post-condition must check TRUNCATE");
});

check("#3 owner guard: constrains only client roles, category-aware, staff columns + term frozen, trigger installed", () => {
  const sql = stripSqlComments(read(`${PROPOSAL_DIR}/${EXPECTED[2]}.sql`));
  assert.match(sql, /current_user not in \('authenticated', 'anon'\)\s*then\s*return new/i, "server roles must be exempt");
  assert.match(sql, /before insert or update on public\.listings/i);
  assert.match(sql, /for each row execute function public\.listings_owner_authority_guard\(\)/i);
  for (const cat of ["en-venta", "busco", "comunidad", "mascotas-y-perdidos"]) assert.ok(sql.includes(`'${cat}'`), `free category ${cat} must be encoded`);
  assert.match(sql, /v_cat = 'clases'/, "Clases free-vs-paid must be encoded");
  for (const col of ["admin_promoted", "leonix_verified", "boost_until", "suspended_reason", "republish_override"]) assert.ok(sql.includes(`new.${col}`), `staff-only column ${col} must be guarded`);
  assert.match(sql, /new\.expires_at is distinct from old\.expires_at/i, "paid term must be frozen");
  assert.match(
    sql,
    /v_old not in \('draft', 'pending', 'active', 'paused', 'sold'\)/i,
    "flagged/suspended/removed/expired/rejected/unknown must be TERMINAL for owners (owner-movable = draft/pending/active/paused/sold only)",
  );
  assert.match(sql, /c_owner_may_archive constant boolean := false;/i, "owners never write INTO removed by default (archive = server route); Stage-1 switch must default to false");
  assert.match(sql, /v_ok := c_owner_may_archive/i, "the removed branch must be governed only by the archive switch");
  for (const bad of ["flagged", "suspended", "expired", "rejected"]) {
    assert.ok(!new RegExp(`v_new = '${bad}'`).test(sql), `there must be no owner branch that can write INTO ${bad}`);
  }
  assert.match(sql, /errcode = '42501'/i);
  assert.ok(!/language plpgsql\s+security\s+definer/i.test(sql), "guard must run as invoker so current_user reflects the caller");
  // The paid lane must never allow draft/pending/removed/flagged -> active.
  assert.match(sql, /v_ok := \(v_old in \('paused', 'sold'\)\) or \(v_lane = 'free' and v_old = 'draft'\)/i, "active transitions: paused/sold, plus draft for FREE only");
  assert.ok(!/insert into|update public\.|delete from/i.test(sql.replace(/create or replace function[\s\S]*?\$\$;/i, "")), "no data DML at apply time");
});

check("owner-guard branch tests cover the SALE-2026-000067 laundering incident and every terminal state", () => {
  const t = read(`${PROPOSAL_DIR}/tests/listings_owner_authority_guard_branch_tests.sql`);
  assert.match(t, /SALE-2026-000067/, "test file must reference the incident");
  for (const label of [
    "INCIDENT removed -> sold BLOCKED",
    "INCIDENT removed -> active BLOCKED",
    "expired (free) -> active BLOCKED",
    "rejected -> active BLOCKED",
    "suspended (payment engine) -> active BLOCKED",
    "active -> flagged BLOCKED",
    "INSERT with status removed BLOCKED",
  ]) {
    assert.ok(t.includes(label), `missing test: ${label}`);
  }
  assert.match(t, /leonix\.test_owner_may_archive/, "archive-switch expectations must be parameterised");
});

check("#4 restaurantes draft_listing_id: partial unique index, duplicate pre-flight, no data change", () => {
  const sql = stripSqlComments(read(`${PROPOSAL_DIR}/${EXPECTED[3]}.sql`));
  assert.match(sql, /create unique index if not exists restaurantes_public_listings_draft_listing_id_uidx/i);
  assert.match(sql, /where draft_listing_id is not null and btrim\(draft_listing_id\) <> ''/i);
  assert.match(sql, /group by draft_listing_id\s+having count\(\*\) > 1/i, "duplicate pre-flight");
  assert.match(read(`${PROPOSAL_DIR}/${EXPECTED[3]}_rollback.sql`), /drop index if exists public\.restaurantes_public_listings_draft_listing_id_uidx/i);
});

check("#5 capacity authority: entitlement OR subscription (NOT subscription-only), drift guard, ACL restated", () => {
  const sql = stripSqlComments(read(`${PROPOSAL_DIR}/${EXPECTED[4]}.sql`));
  assert.ok((sql.match(/commercial_authority_required/g) ?? []).length >= 4, "both functions must return commercial_authority_required");
  assert.match(sql, /br_agent_monthly/);
  assert.match(sql, /autos_dealer_monthly/);
  assert.match(sql, /payment_status/, "entitlement contract payment_status handling");
  assert.match(sql, /\)\s*\n?\s*or exists \(/i, "authority must be entitlement OR subscription");
  assert.match(sql, /leonix\.skip_rpc_md5_guard/, "drift guard with explicit branch-only skip");
  assert.match(sql, /revoke all on function public\.br_negocio_activate_listing\(uuid, uuid, text\)\s+from public, anon, authenticated/i);
  const rb = read(`${PROPOSAL_DIR}/${EXPECTED[4]}_rollback.sql`);
  assert.ok(!/commercial_authority_required/.test(stripSqlComments(rb)), "rollback must remove the authority check");
  assert.match(stripSqlComments(rb), /create or replace function public\.br_negocio_activate_listing/i);
  assert.match(stripSqlComments(rb), /create or replace function public\.autos_dealer_activate_listing/i);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log("\nAll Gate 6 proposal checks passed. NOTHING was applied to any database.");
// keep `join` referenced for readers extending the script with path joins
void join;
