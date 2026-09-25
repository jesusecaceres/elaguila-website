/**
 * LEONIX DB SECURITY GATE — WAVE 2 static verifier (2026-09-25). Reads files only; never connects to a database.
 * The behaviour itself was rehearsed on Staging (docs/db-gates/wave-2-2026-09-25/README.md: Autos fail=0, guard 100/100).
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-db-security-wave2-01.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const code = (sql: string) => sql.replace(/--[^\n]*/g, "");
const flat = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`OK: ${name}`);
}

const MIG = "supabase/migrations";
const AUTOS = `${MIG}/20260924190000_autos_dealer_base_capacity_authority.sql`;
const GUARD = `${MIG}/20260925130000_listings_owner_authority_guard.sql`;
const BR = `${MIG}/20260925130100_br_negocio_activate_listing_parent_counts.sql`;
const OBSOLETE = `${MIG}/20260903150000_fix_parent_inventory_capacity_counting.sql`;
const GATE = "docs/db-gates/wave-2-2026-09-25";

check("files exist; versions unique; rollbacks and rehearsal suites live outside supabase/migrations", () => {
  for (const f of [AUTOS, GUARD, BR, OBSOLETE, `${GATE}/README.md`,
    `${GATE}/rollback_20260924190000_autos_dealer_base_capacity_authority.sql`,
    `${GATE}/rollback_20260925130000_listings_owner_authority_guard.sql`,
    `${GATE}/listings_owner_authority_guard_rehearsal_tests.sql`,
    `${GATE}/autos_capacity_rehearsal_tests.sql`]) assert.ok(existsSync(f), f);
  const versions = readdirSync(MIG).filter((f) => f.endsWith(".sql")).map((f) => f.split("_")[0]);
  for (const v of ["20260925130000", "20260925130100"]) assert.equal(versions.filter((x) => x === v).length, 1, v);
  assert.ok(!readdirSync(MIG).some((f) => /rollback|rehearsal|_tests/i.test(f)));
});

check("Autos authority: TOTAL ladder 5/10/20 (child ceilings 4/9/19) and client EXECUTE revoked + asserted", () => {
  const c = flat(code(read(AUTOS)));
  assert.ok(c.includes("v_limit := case when v_base_only then 4 when v_boost_active then 19 else 9 end;"));
  assert.ok(c.includes("revoke all on function public.autos_dealer_activate_listing(uuid, uuid, text) from public, anon, authenticated;"));
  assert.ok(c.includes("grant execute on function public.autos_dealer_activate_listing(uuid, uuid, text) to service_role;"));
  for (const r of ["anon", "authenticated", "public"]) assert.ok(c.includes(`has_function_privilege('${r}', v_fn, 'execute')`), r);
  assert.ok(!c.includes("br_negocio_activate_listing"), "Bienes untouched by the Autos migration");
});

check("owner guard: client roles only, archive Stage 1, paid/free lanes, terminal states, staff flags, term", () => {
  const c = flat(code(read(GUARD)));
  assert.ok(c.includes("if current_user not in ('authenticated', 'anon') then return new;"), "server roles bypass");
  assert.ok(c.includes("c_owner_may_archive constant boolean := true;"), "Stage-1 archive");
  assert.ok(c.includes("c_free_cats constant text[] := array['en-venta', 'busco', 'comunidad', 'mascotas-y-perdidos', 'mascotas'];"));
  assert.ok(c.includes("if v_old not in ('draft', 'pending', 'active', 'paused', 'sold') then raise exception 'listing_owner_authority_violation:staff_held_or_terminal_state'"));
  assert.ok(c.includes("if v_lane = 'paid' and new.expires_at is distinct from old.expires_at then raise exception 'listing_owner_authority_violation:term_is_server_owned'"));
  assert.ok(c.includes("or new.republish_override_reason is not null then raise exception 'listing_owner_authority_violation:staff_only_column_on_insert'"));
  assert.ok(c.includes("elsif v_cat = 'clases' and v_old = 'draft' and old.expires_at is null and new.expires_at is null then"), "clases draft follows new cost type");
  assert.ok(c.includes("if v_new not in ('pending', 'draft') or new.is_published is true or new.expires_at is not null then"), "paid insert must be pending/draft");
  assert.ok(c.includes("v_ok := (v_lane = 'paid' and v_old = 'draft');"), "paid enters payment only from draft");
  assert.ok(c.includes("create trigger listings_owner_authority_guard before insert or update on public.listings for each row execute function public.listings_owner_authority_guard();"));
  assert.ok(c.includes("revoke all on function public.listings_owner_authority_guard() from public, anon, authenticated;"));
  assert.ok(!/security definer/.test(c), "the guard is not SECURITY DEFINER (current_user must be the caller)");
});

check("Bienes forward fix: parent counts (1 / 4 with pack) and service_role only", () => {
  const c = flat(code(read(BR)));
  assert.ok(c.includes("v_limit := case when v_pack_active then 4 else 1 end;"));
  assert.ok(c.includes("v_count := v_count + case when coalesce(v_parent_active, false) and v_parent.id <> p_listing_id then 1 else 0 end;"));
  assert.ok(c.includes("revoke all on function public.br_negocio_activate_listing(uuid, uuid, text) from public, anon, authenticated;"));
  assert.ok(c.includes("grant execute on function public.br_negocio_activate_listing(uuid, uuid, text) to service_role;"));
});

check("20260903150000 carries the OBSOLETE/SUPERSEDED marker and still exists (history preserved)", () => {
  const s = read(OBSOLETE);
  assert.ok(s.startsWith("-- ====="));
  assert.ok(s.includes("OBSOLETE / SUPERSEDED (2026-09-25)"));
  assert.ok(s.includes("20260925130100_br_negocio_activate_listing_parent_counts.sql"));
});

check("quick publishers' failure cleanup no longer writes status 'removed' (guard compatibility)", () => {
  for (const f of [
    "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
    "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    "app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts",
  ]) {
    const s = read(f);
    const i = s.indexOf("const markPublishFailedNonPublic = async () => {");
    assert.ok(i > 0, f);
    const body = s.slice(i, s.indexOf("};", i));
    assert.ok(body.includes("is_published: false"), `${f} keeps the row non-public`);
    assert.ok(!body.includes('status: "removed"'), `${f} no longer archives the row`);
  }
});

check("rollbacks restore the prior production state", () => {
  const a = flat(code(read(`${GATE}/rollback_20260924190000_autos_dealer_base_capacity_authority.sql`)));
  assert.ok(a.includes("v_limit := case when v_boost_active then 20 else 10 end;"));
  assert.ok(a.includes("from public, anon, authenticated;"), "rollback keeps the Wave-1 lockdown");
  const g = flat(code(read(`${GATE}/rollback_20260925130000_listings_owner_authority_guard.sql`)));
  assert.ok(g.includes("drop trigger if exists listings_owner_authority_guard on public.listings;"));
});

console.log(`verify-db-security-wave2-01: ${passed}/7 checks passed`);
