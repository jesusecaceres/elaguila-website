/**
 * LEONIX DB SECURITY GATE — WAVE 1 static verifier (2026-09-25). Reads files only; never connects to a database.
 *
 * Pins the Wave-1 package so it cannot drift before the PM-approved apply:
 *   1. supabase/migrations/20260925120000_revoke_capacity_rpc_client_execute.sql
 *   2. supabase/migrations/20260925120100_listing_lifecycle_reminder_events_lockdown.sql
 *   3. supabase/migrations/20260827180000_leonix_newsletter_unsubscribe.sql (existing)
 *   4. supabase/reviewed-seeds/category-status/20260925_servicios_site_category_config_live.sql (data, not a migration)
 * plus rollbacks under docs/db-gates/wave-1-2026-09-25/, and the app-side facts each step depends on.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-db-security-wave1-01.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
/** SQL with -- comments removed (keeps statements only). */
const code = (sql: string) => sql.replace(/--[^\n]*/g, "");
let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`OK: ${name}`);
}

const MIG = "supabase/migrations";
const M1 = `${MIG}/20260925120000_revoke_capacity_rpc_client_execute.sql`;
const M2 = `${MIG}/20260925120100_listing_lifecycle_reminder_events_lockdown.sql`;
const M3 = `${MIG}/20260827180000_leonix_newsletter_unsubscribe.sql`;
const SEED = "supabase/reviewed-seeds/category-status/20260925_servicios_site_category_config_live.sql";
const GATE = "docs/db-gates/wave-1-2026-09-25";

function structural(file: string, sql: string) {
  const c = code(sql).toLowerCase();
  const begins = (c.match(/^\s*begin;\s*$/gm) ?? []).length;
  const commits = (c.match(/^\s*commit;\s*$/gm) ?? []).length;
  assert.equal(begins, 1, `${file}: exactly one begin;`);
  assert.equal(commits, 1, `${file}: exactly one commit;`);
  assert.ok(c.indexOf("begin;") < c.lastIndexOf("commit;"), `${file}: begin before commit`);
  for (const tag of c.match(/\$[a-z_]*\$/g) ?? []) {
    assert.equal((c.split(tag).length - 1) % 2, 0, `${file}: dollar-quote ${tag} balanced`);
  }
  const doBlocks = (c.match(/^do \$[a-z_]+\$\s*$/gm) ?? []).length;
  const ends = (c.match(/^end\s*\n\$[a-z_]+\$;\s*$/gm) ?? []).length;
  assert.equal(doBlocks, ends, `${file}: every DO block is closed with END + tag;`);
  const parens = [...c].reduce((n, ch) => n + (ch === "(" ? 1 : ch === ")" ? -1 : 0), 0);
  assert.equal(parens, 0, `${file}: parentheses balanced`);
}

check("Wave-1 files exist in the canonical tree; rollbacks live OUTSIDE supabase/migrations", () => {
  for (const f of [M1, M2, M3, SEED, `${GATE}/README.md`]) assert.ok(existsSync(f), f);
  for (const r of [
    "rollback_20260925120000_revoke_capacity_rpc_client_execute.sql",
    "rollback_20260925120100_listing_lifecycle_reminder_events_lockdown.sql",
    "rollback_20260827180000_leonix_newsletter_unsubscribe.sql",
    "rollback_servicios_site_category_config_live.sql",
  ]) {
    assert.ok(existsSync(join(GATE, r)), r);
  }
  const migs = readdirSync(MIG);
  assert.ok(!migs.some((f) => /rollback/i.test(f)), "no rollback file inside supabase/migrations");
  assert.ok(!existsSync(join(MIG, SEED.split("/").pop()!)), "the reviewed seed is not a migration");
  const versions = migs.filter((f) => f.endsWith(".sql")).map((f) => f.split("_")[0]);
  for (const v of ["20260925120000", "20260925120100"]) {
    assert.equal(versions.filter((x) => x === v).length, 1, `migration version ${v} is unique`);
  }
  assert.ok(statSync(M1).size > 0 && statSync(M2).size > 0);
});

check("step 1: capacity RPC lockdown — exact revokes/grants, no body change, full post-assertions", () => {
  const sql = read(M1);
  structural(M1, sql);
  const c = code(sql).toLowerCase().replace(/\s+/g, " ");
  for (const fn of ["autos_dealer_activate_listing", "br_negocio_activate_listing"]) {
    assert.ok(c.includes(`revoke all on function public.${fn}(uuid, uuid, text) from public, anon, authenticated;`), `${fn} revoke`);
    assert.ok(c.includes(`grant execute on function public.${fn}(uuid, uuid, text) to service_role;`), `${fn} grant`);
    assert.ok(c.includes(`to_regprocedure('public.${fn}(uuid,uuid,text)') is null`), `${fn} existence guard`);
  }
  assert.ok(!/create (or replace )?function|drop function|alter function/.test(c), "function bodies untouched");
  assert.ok(!/\b(insert|update|delete)\b\s/.test(c.replace(/has_(function|table)_privilege\([^)]*\)/g, "")), "no DML");
  for (const role of ["anon", "authenticated", "public"]) {
    assert.ok(c.includes(`if has_function_privilege('${role}', r.oid, 'execute') then`), `asserts ${role} cannot execute`);
  }
  assert.ok(c.includes("if not has_function_privilege('service_role', r.oid, 'execute') then"), "asserts service_role can execute");
});

check("step 1 safety: every app caller of the capacity RPCs uses the service-role client", () => {
  const callers: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name)) {
        const s = readFileSync(p, "utf8");
        if (/\.rpc\(\s*["'](autos_dealer_activate_listing|br_negocio_activate_listing)["']/.test(s)) callers.push(p);
      }
    }
  };
  walk("app");
  assert.ok(callers.length >= 2, `found callers: ${callers.join(", ")}`);
  for (const p of callers) {
    const s = readFileSync(p, "utf8");
    assert.ok(s.includes("getAdminSupabase"), `${p} uses getAdminSupabase`);
    assert.ok(!/createBrowserClient|createClientComponentClient|supabaseBrowser/.test(s), `${p} has no browser client`);
    assert.ok(
      /import\s+["']server-only["']/.test(s) || p.replace(/\\/g, "/").includes("app/admin/_lib/"),
      `${p} is server-only`,
    );
  }
});

check("step 2: reminder-events lockdown — RLS on, client roles revoked, service_role kept, no other table", () => {
  const sql = read(M2);
  structural(M2, sql);
  const c = code(sql).toLowerCase().replace(/\s+/g, " ");
  assert.ok(c.includes("alter table public.listing_lifecycle_reminder_events enable row level security;"));
  assert.ok(c.includes("revoke all on table public.listing_lifecycle_reminder_events from public;"));
  assert.ok(c.includes("revoke all on table public.listing_lifecycle_reminder_events from anon, authenticated;"));
  assert.ok(c.includes("grant select, insert, update, delete on table public.listing_lifecycle_reminder_events to service_role;"));
  assert.ok(c.includes("to_regclass('public.listing_lifecycle_reminder_events') is null"), "existence guard");
  const tables = new Set((c.match(/public\.[a-z_]+/g) ?? []).map((t) => t));
  assert.deepEqual([...tables], ["public.listing_lifecycle_reminder_events"], "touches only that table");
  assert.ok(!/create policy|drop table|truncate /.test(c));
  assert.ok(c.includes("if not (select relrowsecurity from pg_class where oid = t) then"), "asserts RLS on");
  assert.ok(c.includes("has_table_privilege('anon', t, p) or has_table_privilege('authenticated', t, p)"), "asserts no client privilege");
  assert.ok(c.includes("if not has_table_privilege('service_role', t, p) then"), "asserts service_role DML");
});

check("step 3: newsletter migration adds exactly what the unsubscribe code reads/writes (additive, idempotent)", () => {
  const c = code(read(M3)).toLowerCase();
  for (const col of ["unsubscribe_token text", "unsubscribe_token_expires_at timestamptz", "unsubscribed_at timestamptz"]) {
    assert.ok(c.includes(`add column if not exists ${col}`), col);
  }
  assert.ok(c.includes("create index if not exists leonix_newsletter_subscribers_unsubscribe_token_idx"));
  assert.ok(!/drop |alter column|update |delete /.test(c), "additive only");
  const srv = read("app/lib/newsletter/newsletterUnsubscribeServer.ts");
  assert.ok(srv.includes('.select("id, status, unsubscribe_token, unsubscribe_token_expires_at")'));
  assert.ok(srv.includes('.eq("unsubscribe_token", token)'));
  assert.ok(srv.includes('unsubscribed_at: nowIso'), "route writes unsubscribed_at (missing on Leonix Media)");
  assert.ok(srv.includes('status: "unsubscribed"'), "'unsubscribed' already allowed by the live status CHECK");
});

check("step 4: Servicios reviewed seed — one guarded UPDATE, assertion block, not a migration", () => {
  const sql = read(SEED);
  structural(SEED, sql);
  assert.ok(sql.includes("REVIEWED SEED — NOT A MIGRATION"));
  const c = code(sql).toLowerCase().replace(/\s+/g, " ");
  assert.equal((c.match(/\bupdate public\./g) ?? []).length, 1, "exactly one UPDATE");
  assert.ok(
    c.includes("update public.site_category_config set operational_status = 'live', updated_at = now() where slug = 'servicios' and operational_status = 'staged';"),
  );
  assert.ok(!/\binsert into\b|\bdelete from\b|\bcreate\b|\bdrop\b|\balter\b|\btruncate\b/.test(c), "no INSERT/DELETE/DDL");
  assert.ok(c.includes("raise exception 'servicios operational_status is %, expected live'"));
});

check("rollbacks reverse exactly what each step changed", () => {
  const r1 = code(read(`${GATE}/rollback_20260925120000_revoke_capacity_rpc_client_execute.sql`)).toLowerCase();
  assert.ok(r1.includes("grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to anon, authenticated;"));
  assert.ok(/grant execute on function public\.br_negocio_activate_listing\(uuid, uuid, text\)\s+to anon, authenticated;/.test(r1));
  const r2 = code(read(`${GATE}/rollback_20260925120100_listing_lifecycle_reminder_events_lockdown.sql`)).toLowerCase();
  assert.ok(r2.includes("disable row level security") && r2.includes("to anon, authenticated, service_role"));
  const r3 = code(read(`${GATE}/rollback_20260827180000_leonix_newsletter_unsubscribe.sql`)).toLowerCase();
  assert.ok(r3.includes("drop column if exists unsubscribed_at") && !r3.includes("drop column if exists unsubscribe_token"));
  const r4 = code(read(`${GATE}/rollback_servicios_site_category_config_live.sql`)).toLowerCase();
  assert.ok(r4.includes("set operational_status = 'staged'") && r4.includes("where slug = 'servicios'"));
});

check("Wave 1 excludes the deferred migrations (untouched in this package)", () => {
  const readme = read(`${GATE}/README.md`);
  for (const f of ["20260924190000", "20260903150000"]) assert.ok(readme.includes(f), `${f} documented as not in Wave 1`);
  assert.ok(existsSync(`${MIG}/20260903150000_fix_parent_inventory_capacity_counting.sql`), "flagged file left in place (PM decides)");
});

console.log(`verify-db-security-wave1-01: ${passed}/8 checks passed`);
