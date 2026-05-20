/**
 * BR13B Bienes Raices Negocio property inventory add-flow audit (no DB/network).
 * Run: npm run br:13b-property-inventory-add-flow-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR13B_PROPERTY_INVENTORY_ADD_FLOW_AUDIT.md";
const QA_SQL = "scripts/br13b-property-inventory-qa.sql";
const POLICY = "app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts";
const COPY = "app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts";
const ADD_FLOW = "app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function assertNoDestructiveSql(sql: string) {
  const blocked = [/drop\s+table/i, /drop\s+column/i, /truncate\b/i, /delete\s+from/i, /alter\s+column\s+\w+\s+type/i];
  for (const re of blocked) assert.equal(re.test(sql), false, `Destructive SQL: ${re}`);
}

function run() {
  assert.ok(exists(AUDIT), "BR13B audit doc must exist");
  assert.ok(exists(QA_SQL), "BR13B QA SQL must exist");

  const audit = read(AUDIT);
  const policy = read(POLICY);
  const copy = read(COPY);
  const addFlow = read(ADD_FLOW);
  const qa = read(QA_SQL);

  assert.ok(policy.includes("BASE_BR_NEGOCIO_MONTHLY_PRICE = 399"), "Base $399 constant required");
  assert.ok(policy.includes("BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES = 3"), "Base 3 properties required");
  assert.ok(policy.includes("BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE = 99.99"), "Upgrade $99.99 required");
  assert.ok(policy.includes("BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE = 498.99"), "Total $498.99 required");
  assert.ok(policy.includes("BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5"), "5 extra properties required");
  assert.ok(policy.includes("BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8"), "8 total max required");
  assert.ok(policy.includes("inventory_property"), "inventory_property role required");
  assert.ok(policy.includes("br_inventory_group_id"), "br_inventory_group_id required");
  assert.ok(policy.includes("br_inventory_parent_listing_id"), "br_inventory_parent_listing_id required");
  assert.ok(copy.includes("Unlock Property Inventory"), "Upgrade copy EN required");
  assert.ok(copy.includes("Activar inventario de propiedades"), "Upgrade copy ES required");
  assert.ok(addFlow.includes('inventoryMode")?.trim().toLowerCase()'), "inventoryMode=add parsing required");
  assert.ok(addFlow.includes("parentListingId"), "parentListingId required");
  assert.ok(addFlow.includes("inventoryGroupId"), "inventoryGroupId required");
  assert.ok(addFlow.includes("returnToListingId"), "returnToListingId required");

  assert.equal(/\b(Starter|Pro|Premium)\b/i.test(policy + copy + addFlow), false, "No pricing tiers");
  assert.equal(/per[-\s]?property\s+fee|per[-\s]?listing\s+fee/i.test(policy + copy), false, "No per-property fee");
  assert.equal(/nested\s+properties\s+inside\s+one\s+ad/i.test(policy + copy), false, "No fake nested inventory");

  assert.ok(qa.includes("inventory_role = 'inventory_property'"), "QA SQL must verify inventory child");
  assert.ok(qa.includes("active_negocio_property_count"), "QA SQL must verify active count");
  assert.ok(qa.includes("privado_rows_not_counted"), "QA SQL must note Privado exclusion");
  assertNoDestructiveSql(qa);

  for (const required of [
    "one upgrade package only",
    "base includes 3 active properties",
    "BR13B audit doc created/updated",
    "one best QA SQL produced",
  ]) {
    assert.ok(audit.includes(`| ${required} |`), `Audit row missing: ${required}`);
  }

  console.log("br13b-property-inventory-add-flow-audit: OK");
}

run();
