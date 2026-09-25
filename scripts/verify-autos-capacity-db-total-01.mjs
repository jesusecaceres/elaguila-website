// Executes the REAL migration SQL for autos_dealer_activate_listing in an in-process Postgres (PGlite).
// Nothing external is touched. Usage: node pgl-run.mjs <repoRoot>
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let PGlite;
try {
  const require = createRequire(path.join(process.env.PGLITE_DIR || root, "package.json"));
  ({ PGlite } = require("@electric-sql/pglite"));
} catch {
  console.log("SKIPPED: @electric-sql/pglite is not installed (npm i --no-save @electric-sql/pglite). No DB check was run.");
  process.exit(0);
}
const sql = readFileSync(path.join(root, "supabase/migrations/20260924190000_autos_dealer_base_capacity_authority.sql"), "utf8");

const db = new PGlite();
await db.exec(`
  create role service_role;
  create table public.autos_classifieds_listings (
    id uuid primary key default gen_random_uuid(), owner_user_id uuid, lane text, status text, inventory_role text,
    dealer_inventory_parent_listing_id uuid, dealer_inventory_group_id uuid, published_at timestamptz, updated_at timestamptz);
  create table public.leonix_subscription_records (listing_id text, listing_source text, status text, grace_ends_at timestamptz, created_at timestamptz default now());
  create table public.listing_package_entitlements (listing_id text, package_key text, status text, revoked_at timestamptz, starts_at timestamptz, ends_at timestamptz);
`);
await db.exec(sql); // the migration, verbatim

let failed = 0;
const ok = (cond, label) => {
  console.log(`${cond ? "OK  " : "FAIL"}: ${label}`);
  if (!cond) failed += 1;
};
const OWNER = "11111111-1111-4111-8111-111111111111";

async function newDealer(ents, { childrenActive = 0, parentStatus = "draft" } = {}) {
  const parent = (await db.query(`insert into autos_classifieds_listings (owner_user_id, lane, status, inventory_role) values ($1,'negocios',$2,'main') returning id`, [OWNER, parentStatus])).rows[0].id;
  await db.query(`update autos_classifieds_listings set dealer_inventory_group_id = id where id = $1`, [parent]);
  for (const e of ents) {
    await db.query(`insert into listing_package_entitlements (listing_id, package_key, status, revoked_at, starts_at, ends_at) values ($1,$2,$3,$4,$5,$6)`, [parent, e.key, e.status ?? "active", e.revoked ? new Date().toISOString() : null, null, e.endsAt ?? null]);
  }
  for (let i = 0; i < childrenActive; i += 1) await addChild(parent, "active");
  return parent;
}
async function addChild(parent, status = "draft") {
  return (await db.query(`insert into autos_classifieds_listings (owner_user_id, lane, status, inventory_role, dealer_inventory_parent_listing_id, dealer_inventory_group_id) values ($1,'negocios',$2,'inventory_vehicle',$3,$3) returning id`, [OWNER, status, parent])).rows[0].id;
}
const activate = async (id, from = "draft") => (await db.query(`select * from public.autos_dealer_activate_listing($1,$2,$3)`, [id, OWNER, from])).rows[0];
const totalActive = async (parent) => Number((await db.query(`select count(*)::int c from autos_classifieds_listings where status='active' and (id=$1 or dealer_inventory_parent_listing_id=$1)`, [parent])).rows[0].c);

const QUICK = { key: "autos_dealer_quick_monthly" };
const FULL = { key: "autos_dealer_monthly" };
const PACK = { key: "autos_dealer_inventory_pack_monthly" };

async function ladder(name, ents, totalLimit) {
  const parent = await newDealer(ents);
  const p = await activate(parent);
  ok(p.activated === true && p.active_count === 1 && p.effective_limit === totalLimit, `${name}: parent only = 1/${totalLimit} (got ${p.active_count}/${p.effective_limit})`);
  let last;
  for (let n = 1; n <= totalLimit - 1; n += 1) {
    const child = await addChild(parent);
    last = await activate(child);
    if (!(last.activated === true && last.active_count === n + 1 && last.effective_limit === totalLimit)) {
      ok(false, `${name}: child #${n} should activate as ${n + 1}/${totalLimit}, got ${JSON.stringify(last)}`);
      return parent;
    }
  }
  ok(last.active_count === totalLimit && last.effective_limit === totalLimit, `${name}: parent + ${totalLimit - 1} children = ${totalLimit}/${totalLimit} (all activated)`);
  ok((await totalActive(parent)) === totalLimit, `${name}: ${totalLimit} rows are actually active in the table`);
  const over = await addChild(parent);
  const refused = await activate(over);
  ok(refused.activated === false && refused.blocked_reason === "capacity_reached" && refused.active_count === totalLimit && refused.effective_limit === totalLimit, `${name}: child #${totalLimit} (vehicle ${totalLimit + 1}) REFUSED capacity_reached ${refused.active_count}/${refused.effective_limit}`);
  ok((await db.query(`select status from autos_classifieds_listings where id=$1`, [over])).rows[0].status === "draft", `${name}: the refused child stays draft (nothing written)`);
  ok((await totalActive(parent)) === totalLimit, `${name}: total active is still ${totalLimit}`);
  return parent;
}

console.log("--- the three tiers (TOTAL vehicles, parent included) ---");
const baseParent = await ladder("BASE", [QUICK], 5);
await ladder("PRO", [FULL], 10);
await ladder("PRO + pack", [FULL, PACK], 20);

console.log("--- derivation edge cases ---");
{
  const parent = await newDealer([QUICK, PACK]);
  await activate(parent);
  const r = await activate(await addChild(parent));
  ok(r.effective_limit === 5, `a stray inventory pack never lifts BASE (limit ${r.effective_limit})`);
}
{
  const parent = await newDealer([QUICK, FULL]);
  const r = await activate(parent);
  ok(r.effective_limit === 10, `live Quick + live PRO resolves PRO (limit ${r.effective_limit}) — an upgrade never reads as a downgrade`);
}
{
  const parent = await newDealer([]);
  const r = await activate(parent);
  ok(r.effective_limit === 10, `no entitlement evidence is NEVER treated as BASE (limit ${r.effective_limit})`);
}
{
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const parent = await newDealer([{ ...QUICK, endsAt: past }]);
  const r = await activate(parent);
  ok(r.effective_limit === 10, `an EXPIRED Quick row is not BASE (limit ${r.effective_limit})`);
}
{
  const parent = await newDealer([{ ...QUICK, revoked: true }]);
  const r = await activate(parent);
  ok(r.effective_limit === 10, `a REVOKED Quick row is not BASE (limit ${r.effective_limit})`);
}
{
  const parent = await newDealer([{ ...QUICK, status: "scheduled" }]);
  const r = await activate(parent);
  ok(r.effective_limit === 5, `a scheduled (paid, starts later) Quick row IS BASE (limit ${r.effective_limit})`);
}

console.log("--- parent / idempotency ---");
{
  const parent = await newDealer([QUICK], { childrenActive: 6 }); // e.g. after a PRO -> BASE downgrade
  const r = await activate(parent);
  ok(r.activated === false && r.blocked_reason === "capacity_reached", `BASE parent with 6 active children (7 total) cannot be activated (${r.blocked_reason})`);
}
{
  const parent = await newDealer([QUICK], { childrenActive: 4 });
  const r = await activate(parent);
  ok(r.activated === true && r.active_count === 5 && r.effective_limit === 5, `BASE parent activates alongside 4 active children = 5/5 (${r.active_count}/${r.effective_limit})`);
}
{
  const again = await activate(baseParent, "draft");
  ok(again.activated === true && again.idempotent === true, "an already-active target is idempotent (no second transition)");
}
{
  const fn = await db.query(`select pg_get_function_arguments(p.oid) args from pg_proc p where proname='autos_dealer_activate_listing'`);
  ok(fn.rows.length === 1 && !/limit|max|plan|quick/i.test(fn.rows[0].args), `the RPC signature accepts no caller-supplied limit/plan (${fn.rows[0].args})`);
}

await db.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall DB capacity checks passed");
process.exit(failed ? 1 : 0);
