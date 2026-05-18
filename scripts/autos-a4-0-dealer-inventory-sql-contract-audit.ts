/**
 * A4.0 Autos Negocio dealer inventory SQL/data contract audit (no DB/network).
 * Run: npm run autos:a4-0-inventory-sql-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/lib/clasificados/autos/AUTOS_A4_0_DEALER_INVENTORY_SQL_CONTRACT_AUDIT.md";
const MIGRATION = "supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql";
const VERIFY_SQL = "scripts/autos-a4-0-dealer-inventory-verification.sql";
const TABLE = "public.autos_classifieds_listings";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function assertNoDestructiveSql(sql: string) {
  const blocked = [/drop\s+table/i, /drop\s+column/i, /truncate\b/i, /delete\s+from/i, /alter\s+column\s+\w+\s+type/i];
  for (const re of blocked) assert.equal(re.test(sql), false, `Migration contains destructive SQL: ${re}`);
}

function run() {
  assert.ok(exists(AUDIT), "A4.0 audit doc must exist");
  assert.ok(exists(MIGRATION), "A4.0 migration must exist");
  assert.ok(exists(VERIFY_SQL), "A4.0 verification SQL must exist");

  const audit = read(AUDIT);
  const migration = read(MIGRATION);
  const verification = read(VERIFY_SQL);
  const policy = read("app/lib/clasificados/autos/autosDealerInventoryPolicy.ts");
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");

  assert.ok(migration.includes(TABLE), "Migration must use real Autos table name");
  assert.ok(migration.includes("dealer_inventory_group_id"), "Migration must add dealer_inventory_group_id");
  assert.ok(migration.includes("dealer_inventory_parent_listing_id"), "Migration must add dealer_inventory_parent_listing_id");
  assert.ok(migration.includes("inventory_role"), "Migration must add inventory_role");
  assert.ok(migration.includes("inventory_vehicle") && migration.includes("'main'"), "Migration must constrain role values");
  assertNoDestructiveSql(migration);

  assert.ok(verification.includes(TABLE), "Verification SQL must use real Autos table name");
  assert.ok(verification.includes("active_negocio_vehicle_count"), "Verification SQL must expose active count");
  assert.ok(verification.includes("active_privado_rows_not_counted"), "Verification SQL must confirm Privado exclusion");

  assert.ok(policy.includes("STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10"), "Standard active vehicle limit must remain 10");
  assert.ok(policy.includes("resolveDealerInventoryGroupingKey"), "Policy must expose grouping-key fallback helper");
  assert.ok(policy.includes("countActiveDealerInventoryVehicles"), "Policy must expose inventory active count helper");
  assert.ok(!/\b(Starter|Pro|Premium)\b/.test(policy), "Autos dealer policy must not introduce tier names");
  assert.equal(/per[-\s]?car|per\s+vehicle\s+fee/i.test(policy), false, "Autos dealer policy must not add per-car fee logic");
  assert.ok(service.includes("resolveDealerInventoryGroupingKey(candidate)"), "Related inventory grouping must prefer new grouping helper");

  for (const required of [
    "Real Autos listings table identified",
    "SQL migration created if needed",
    "SQL supports group/parent/role",
    "One best verification SQL produced",
    "No fake nested inventory added",
  ]) {
    assert.ok(audit.includes(`| ${required} |`), `Audit doc must include TRUE/FALSE row: ${required}`);
  }
  assert.ok(audit.includes("A4.1 Dealer Inventory Add Flow"), "Audit doc must identify A4.1 as next gate");
  assert.ok(audit.includes("```sql") && audit.includes("active_negocio_vehicle_count"), "Audit doc must include verification SQL");

  console.log("autos-a4-0-dealer-inventory-sql-contract-audit: OK");
}

run();
