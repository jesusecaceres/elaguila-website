// Package C Build 4 (C7) — Gate 3 structural/textual SQL-contract verifier.
// No DB connection — parses the authored-but-never-applied migration file's text and asserts the
// required financial-authority shape by pattern match. Live execution/concurrency certification
// is explicitly deferred to a separate, later, controlled pre-Production migration-certification
// gate — this script proves the SQL contract only.
// Run: node scripts/verify-c7-capacity-rpc-sql-contract.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION = "supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql";

let failures = 0;
const check = (ok, label) => {
  if (ok) console.log(`PASS  ${label}`);
  else { failures += 1; console.error(`FAIL  ${label}`); }
};

check(existsSync(path.join(ROOT, MIGRATION)), "migration file exists");
const sql = readFileSync(path.join(ROOT, MIGRATION), "utf8");

function fnBody(name) {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  if (start === -1) return null;
  const end = sql.indexOf(`revoke all on function public.${name}(`, start);
  return sql.slice(start, end === -1 ? sql.length : end);
}

const autos = fnBody("autos_dealer_activate_listing");
const br = fnBody("br_negocio_activate_listing");

check(Boolean(autos), "autos_dealer_activate_listing function exists");
check(Boolean(br), "br_negocio_activate_listing function exists");

for (const [name, body] of [["autos_dealer_activate_listing", autos], ["br_negocio_activate_listing", br]]) {
  if (!body) continue;

  // 1. No caller-supplied limit parameter.
  const sigMatch = body.match(/create or replace function public\.\w+\(([^)]*)\)/s);
  const signature = sigMatch ? sigMatch[1] : "";
  check(!/p_limit/i.test(signature), `${name}: signature has no p_limit parameter`);
  check(!/\blimit\s+\w+\s+int\b/i.test(signature), `${name}: signature has no other limit-like int parameter`);

  // 2. SECURITY DEFINER hardening.
  check(/security\s+definer/i.test(body), `${name}: SECURITY DEFINER present`);
  check(/set\s+search_path\s*=\s*public/i.test(body), `${name}: explicit safe search_path set`);
  check(new RegExp(`revoke all on function public\\.${name}`, "i").test(sql), `${name}: revoke all from public present`);
  check(new RegExp(`grant execute on function public\\.${name}\\([^)]*\\) to service_role`, "i").test(sql), `${name}: grant execute to service_role only`);
  check(!/grant execute[^;]*to public/i.test(sql.slice(sql.indexOf(`function public.${name}`))), `${name}: never grants execute to public`);

  // 3. Schema-qualified references to sensitive tables.
  check(/public\.listing_package_entitlements/.test(body), `${name}: schema-qualified listing_package_entitlements`);
  check(/public\.leonix_subscription_records/.test(body), `${name}: schema-qualified leonix_subscription_records`);

  // 4. Entitlement subquery scoped to the exact parent's own listing_id, never a group key.
  check(/e\.listing_id\s*=\s*v_parent\.id/.test(body), `${name}: entitlement lookup scoped to e.listing_id = v_parent.id (exact parent, never group-wide/owner-wide)`);

  // 4b. C9 live certification (2026-08-11) caught a genuine runtime defect here: listing_id on
  // both leonix_subscription_records and listing_package_entitlements is `text`, while v_parent.id
  // is `uuid` — PL/pgSQL does not type-check embedded SQL until execution, so `CREATE OR REPLACE
  // FUNCTION` accepted the raw `text = uuid` comparison silently and every non-idempotent
  // activation call failed live with `42883 operator does not exist: text = uuid`. Every one of
  // the 4 occurrences (2 lookups x 2 RPCs) must carry the ::text cast; this check fails closed if
  // any one of them ever regresses back to a bare, uncast comparison.
  // Negative lookbehind excludes br_inventory_parent_listing_id (a genuinely uuid-typed column,
  // correctly left uncast) — without it the fragment "listing_id" inside that longer identifier
  // false-positives as an uncast match.
  const uncastListingIdComparison = /(?<![a-z_])listing_id\s*=\s*v_parent\.id(?!::text)/g;
  const uncastMatches = body.match(uncastListingIdComparison) ?? [];
  check(uncastMatches.length === 0, `${name}: no uncast text=uuid listing_id comparison remains (found ${uncastMatches.length})`);
  const castMatches = body.match(/listing_id\s*=\s*v_parent\.id::text/g) ?? [];
  check(castMatches.length === 2, `${name}: both listing_id comparisons (subscription + entitlement lookup) carry the ::text cast (found ${castMatches.length}, expected 2)`);

  // 5. Lifecycle: queries leonix_subscription_records filtered by the parent's own id, denies grace/suspended/canceled.
  check(/where\s+listing_id\s*=\s*v_parent\.id::text/i.test(body), `${name}: subscription lookup filtered by the parent's own id (cast)`);
  check(/'grace_blocks_new_capacity'/.test(body), `${name}: denies on grace`);
  check(/'subscription_suspended'/.test(body), `${name}: denies on suspended`);
  check(/'subscription_canceled'/.test(body), `${name}: denies on canceled`);
  // Lifecycle check must precede the capacity count query in source order.
  const lifecycleIdx = body.indexOf("grace_blocks_new_capacity");
  const countIdx = body.search(/select count\(\*\) into v_count/);
  check(lifecycleIdx !== -1 && countIdx !== -1 && lifecycleIdx < countIdx, `${name}: lifecycle denial precedes the capacity count query`);

  // 6. Advisory lock present, with a distinct namespace constant per category.
  check(/pg_advisory_xact_lock\(\d+,/.test(body), `${name}: pg_advisory_xact_lock call present`);

  // 7. Idempotent already-active branch precedes p_from_status check and the lock.
  const idempotentIdx = body.search(/status\s*=\s*'active'[\s\S]{0,80}?then/i);
  const statusMismatchIdx = body.indexOf("status_mismatch");
  const lockIdx = body.indexOf("pg_advisory_xact_lock");
  check(
    idempotentIdx !== -1 && statusMismatchIdx !== -1 && lockIdx !== -1 && idempotentIdx < statusMismatchIdx && idempotentIdx < lockIdx,
    `${name}: idempotent already-active branch precedes both the status_mismatch check and the advisory lock`,
  );

  // 8. No caller-supplied parent/group authority — parent/group always derived from DB rows.
  check(!/p_parent_id|p_group_id|p_parent_listing_id|p_group_key/i.test(signature), `${name}: no caller-supplied parent/group parameter in signature`);
}

// 9. Distinct advisory-lock namespaces per category (never collide).
const autosLock = autos?.match(/pg_advisory_xact_lock\((\d+),/)?.[1];
const brLock = br?.match(/pg_advisory_xact_lock\((\d+),/)?.[1];
check(Boolean(autosLock) && Boolean(brLock) && autosLock !== brLock, `advisory lock namespaces are distinct per category (autos=${autosLock}, bienes=${brLock})`);

// 10. Canonical package keys and locked base/boost limits.
check(/'autos_dealer_inventory_pack_monthly'/.test(sql), "canonical Autos boost package_key present");
check(/'br_inventory_pack_monthly'/.test(sql), "canonical Bienes pack package_key present");
check(/then\s+20\s+else\s+10\s+end/i.test(sql), "Autos limit is 10 base / 20 boosted (locked)");
check(/then\s+4\s+else\s+1\s+end/i.test(sql), "Bienes limit is 1 base / 4 packed (locked)");

// 11. Effective entitlement predicate matches the exact server-runtime semantics (not approximated).
check(/revoked_at is null/.test(sql) && /starts_at is null or e\.starts_at/.test(sql) && /ends_at\s+is null or e\.ends_at/.test(sql), "entitlement predicate includes revoked_at/starts_at/ends_at window checks");

// 12. No live application to any database — this migration is authored only.
check(!/supabase\s+db\s+push/i.test(sql), "migration file contains no self-apply instruction");

console.log(
  failures === 0
    ? "verify-c7-capacity-rpc-sql-contract: all checks passed."
    : `verify-c7-capacity-rpc-sql-contract: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
