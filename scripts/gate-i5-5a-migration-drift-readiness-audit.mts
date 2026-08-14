/**
 * Gate I.5.5A — read-only production migration drift readiness audit.
 * Service role, SELECT + schema-metadata reads only. NO INSERT/UPDATE/DELETE/UPSERT/ALTER/CREATE/
 * DROP/migration execution of any kind. Prints counts/booleans/schema metadata only, never PII.
 *
 * Env loading matches `scripts/empleos-supabase-read-smoke.mts` (proven safe pattern in repo).
 *
 * Run: npx tsx scripts/gate-i5-5a-migration-drift-readiness-audit.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v !== "") process.env[k] = v;
    }
  }
}

async function checkColumn(sb: any, table: string, column: string): Promise<{ exists: boolean; message?: string }> {
  const { error } = await sb.from(table).select(`id,${column}`).limit(1);
  if (!error) return { exists: true };
  const msg = String(error.message ?? "");
  if (/column .* does not exist/i.test(msg) || /could not find/i.test(msg)) {
    return { exists: false, message: msg };
  }
  return { exists: false, message: `INCONCLUSIVE: ${msg}` };
}

const WRITE_KEYWORDS = /\b(insert|update|delete|upsert|alter|create|drop|truncate|grant|revoke|execute|call|do\s*\$|vacuum|reindex)\b/i;

/** Read-only guard: refuses to send anything that isn't an unambiguous SELECT against catalog views. */
async function readOnlySql(sb: any, label: string, sql: string): Promise<void> {
  const trimmed = sql.trim();
  if (!/^select\b/i.test(trimmed)) {
    console.log(`${label}: SKIPPED — refused, does not start with SELECT`);
    return;
  }
  if (WRITE_KEYWORDS.test(trimmed)) {
    console.log(`${label}: SKIPPED — refused, contains a write/DDL keyword`);
    return;
  }
  console.log(`${label} — SQL: ${trimmed}`);
  const { data, error } = await sb.rpc("exec_sql", { sql_query: trimmed });
  if (error) {
    console.log(`${label}: RPC unavailable or errored (${error.message}) — falling back to REST-only evidence for this item`);
    return;
  }
  console.log(`${label}: ${JSON.stringify(data)}`);
}

async function checkTableExists(sb: any, table: string): Promise<boolean> {
  const { error } = await sb.from(table).select("id").limit(1);
  if (!error) return true;
  const msg = String(error.message ?? "");
  if (/could not find the table|does not exist|schema cache/i.test(msg)) return false;
  // Any other error (RLS, etc.) means the table IS reachable/known — treat as existing.
  return true;
}

async function main() {
  loadEnvFiles();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.error("BLOCKED_BY_ENV missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(2);
  }
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log("GATE_I5_5A_MIGRATION_DRIFT_READINESS_AUDIT (read-only)");

  // ---- Gate 12D-2 structured payload columns ----
  console.log("\n-- listing_json / profile_json / contact_json (20260518112000) --");
  for (const col of ["listing_json", "profile_json", "contact_json"]) {
    const r = await checkColumn(sb, "listings", col);
    console.log(`listings.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }

  // ---- Republish capability columns (20260509120000) — check EVERY column this migration adds,
  // not just republish_sort_at, to detect partial application ----
  console.log("\n-- republish capability columns (20260509120000) --");
  for (const col of [
    "published_at",
    "republished_at",
    "republish_count",
    "last_republished_by",
    "last_republished_source",
    "republish_override",
    "republish_sort_at",
  ]) {
    const r = await checkColumn(sb, "listings", col);
    console.log(`listings.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }
  // Full column set on the other 5 tables this same migration touches — to determine whether the
  // migration reached each table's block at all, or aborted before ever starting them.
  console.log("\n-- full republish column set on other tables this same migration touches --");
  for (const table of [
    "restaurantes_public_listings",
    "servicios_public_listings",
    "empleos_public_listings",
    "autos_classifieds_listings",
    "viajes_staged_listings",
  ]) {
    for (const col of ["republished_at", "republish_count", "last_republished_by", "last_republished_source", "republish_override", "republish_sort_at"]) {
      const r = await checkColumn(sb, table, col);
      console.log(`${table}.${col} exists=${r.exists}${r.exists ? "" : " (missing)"}`);
    }
  }

  // ---- Admin drift-fix columns (20260628180000) ----
  console.log("\n-- admin drift-fix columns (20260628180000) --");
  for (const col of ["admin_promoted", "leonix_verified"]) {
    const r = await checkColumn(sb, "listings", col);
    console.log(`listings.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }
  const modReviewsExists = await checkTableExists(sb, "listing_moderation_reviews");
  console.log(`table listing_moderation_reviews exists=${modReviewsExists}`);
  for (const [table, col] of [
    ["empleos_public_listings", "admin_promoted"],
    ["empleos_public_listings", "leonix_verified"],
    ["viajes_staged_listings", "admin_promoted"],
    ["viajes_staged_listings", "leonix_verified"],
    ["servicios_public_listings", "promoted"],
  ] as const) {
    const r = await checkColumn(sb, table, col);
    console.log(`${table}.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }

  // ---- Existing-field overlap candidates (possible functional duplicates) ----
  console.log("\n-- possible pre-existing overlap fields (name/purpose conflict check) --");
  for (const col of ["listing_tier", "boosted", "boost_expires", "is_free"]) {
    const r = await checkColumn(sb, "listings", col);
    console.log(`listings.${col} exists=${r.exists}${r.message ? ` (${r.message})` : ""}`);
  }

  // ---- Approximate row count (aggregate only, no PII) ----
  console.log("\n-- approximate row count --");
  const { count, error: countErr } = await sb.from("listings").select("id", { count: "exact", head: true });
  console.log(`listings row count=${countErr ? "ERROR:" + countErr.message : count}`);

  const { count: nullPublishedCount, error: nullPubErr } = await sb
    .from("listings")
    .select("id", { count: "exact", head: true })
    .is("published_at", null);
  console.log(
    `listings rows with published_at IS NULL=${nullPubErr ? "ERROR:" + nullPubErr.message : nullPublishedCount} (relevant to the republish migration's backfill UPDATE)`,
  );

  // ---- Catalog metadata via the repo's existing exec_sql RPC — read-only SELECTs only, guarded
  // client-side against any write/DDL keyword before ever being sent. ----
  console.log("\n-- catalog metadata (via exec_sql RPC, SELECT-only, guarded) --");
  await readOnlySql(
    sb,
    "listings indexes",
    "select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'listings' order by indexname",
  );
  await readOnlySql(
    sb,
    "listings check/unique/pk constraints",
    "select conname, contype, pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.listings'::regclass order by conname",
  );
  await readOnlySql(
    sb,
    "listings triggers",
    "select tgname, tgenabled from pg_trigger where tgrelid = 'public.listings'::regclass and not tgisinternal",
    );
  await readOnlySql(
    sb,
    "listings RLS policies",
    "select policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'listings' order by policyname",
  );
  await readOnlySql(
    sb,
    "listings RLS enabled",
    "select relrowsecurity, relforcerowsecurity from pg_class where oid = 'public.listings'::regclass",
  );
  await readOnlySql(
    sb,
    "listing_moderation_reviews existence (catalog-level, not REST-level)",
    "select count(*) as table_exists from pg_tables where schemaname = 'public' and tablename = 'listing_moderation_reviews'",
  );
  await readOnlySql(
    sb,
    "supabase migration history for the three target files",
    "select version, name from supabase_migrations.schema_migrations where name like '%gate12d_listing_structured_payload%' or name like '%classifieds_republish_capability%' or name like '%admin_live_schema_drift_fix%' order by version",
  );

  console.log("\nGATE_I5_5A_AUDIT_COMPLETE — no writes performed");
}

main().catch((e) => {
  console.error("BLOCKED_BY_RUNTIME", String((e as Error)?.message ?? e));
  process.exit(3);
});
