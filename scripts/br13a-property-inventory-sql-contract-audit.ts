/**
 * BR13A Bienes Raices Negocio property inventory SQL/data contract audit (no DB/network).
 * Run: npm run br:13a-property-inventory-sql-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR13A_PROPERTY_INVENTORY_SQL_CONTRACT_AUDIT.md";
const MIGRATION = "supabase/migrations/20260518130600_br_property_inventory_grouping.sql";
const VERIFY_SQL = "scripts/br13a-property-inventory-verification.sql";
const TABLE = "public.listings";

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
  assert.ok(exists(AUDIT), "BR13A audit doc must exist");
  assert.ok(exists(MIGRATION), "BR13A migration must exist");
  assert.ok(exists(VERIFY_SQL), "BR13A verification SQL must exist");

  const audit = read(AUDIT);
  const migration = read(MIGRATION);
  const verification = read(VERIFY_SQL);
  const policy = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts");
  const publishCore = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");

  assert.ok(migration.includes(TABLE), "Migration must use real BR table name");
  assert.ok(migration.includes("br_inventory_group_id"), "Migration must add br_inventory_group_id");
  assert.ok(migration.includes("br_inventory_parent_listing_id"), "Migration must add br_inventory_parent_listing_id");
  assert.ok(migration.includes("inventory_role"), "Migration must add inventory_role");
  assert.ok(migration.includes("inventory_property") && migration.includes("'main'"), "Migration must constrain role values");
  assertNoDestructiveSql(migration);

  assert.ok(verification.includes(TABLE), "Verification SQL must use real BR table name");
  assert.ok(verification.includes("active_negocio_property_count"), "Verification SQL must expose active count");
  assert.ok(verification.includes("seller_type = 'business'"), "Verification SQL must confirm Negocio-only count shape");
  assert.ok(verification.includes("recommended_active_property_limit"), "Verification SQL must show the 5-property recommendation");

  assert.ok(policy.includes("BR_NEGOCIO_RECOMMENDED_ACTIVE_PROPERTY_LIMIT = 5"), "Policy must document 5 active properties");
  assert.ok(policy.includes("resolveBrInventoryGroupingKey"), "Policy must expose grouping-key fallback helper");
  assert.ok(policy.includes("countActiveBrInventoryListings"), "Policy must expose active count helper");
  assert.ok(policy.includes("isBrNegocioListing"), "Policy must exclude Privado through BR Negocio checks");
  assert.ok(publishCore.includes("brInventoryGroupId"), "Publish core must accept BR inventory metadata");
  assert.equal(/\b(Starter|Pro|Premium)\b/i.test(policy + publishCore), false, "BR13A must not add pricing tiers");
  assert.equal(/per[-\s]?property\s+fee|per[-\s]?listing\s+fee/i.test(policy + publishCore), false, "BR13A must not add per-property fee logic");
  assert.equal(/nested\s+properties\s+inside\s+one\s+ad/i.test(policy + publishCore), false, "BR13A must not implement fake nested inventory");

  for (const required of [
    "Real BR listings table identified",
    "public.listings vs dedicated table confirmed",
    "SQL migration created if needed",
    "SQL supports group/parent/role",
    "One best verification SQL produced",
    "No fake nested inventory added",
  ]) {
    assert.ok(audit.includes(`| ${required} |`), `Audit doc must include TRUE/FALSE row: ${required}`);
  }
  assert.ok(audit.includes("BR13B Property Inventory Add Flow"), "Audit doc must identify BR13B as next gate");
  assert.ok(audit.includes("```sql") && audit.includes("active_negocio_property_count"), "Audit doc must include verification SQL");

  for (const unrelated of ["autos/", "rentas/", "servicios/", "restaurantes/", "tienda/"]) {
    assert.equal(audit.toLowerCase().includes(unrelated), false, `Audit doc should not reference unrelated category path: ${unrelated}`);
  }

  console.log("br13a-property-inventory-sql-contract-audit: OK");
}

run();
