/**
 * BR-INV-A Bienes Raices property inventory Supabase backing audit (no DB/network).
 * Run: npm run br:inv-a-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_A_SUPABASE_BACKING_AUDIT.md";
const AUTOS_REF = "app/lib/clasificados/autos/AUTOS_A5_QA_08A1_OPEN_INVENTORY_CTA_DRAWER_AUDIT.md";
const MIGRATION = "supabase/migrations/20260518130600_br_property_inventory_grouping.sql";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "BR-INV-A audit doc must exist");
  assert.ok(exists(AUTOS_REF), "Autos inventory reference audit must exist");
  assert.ok(exists(MIGRATION), "BR inventory grouping migration must exist");

  const audit = read(AUDIT);
  const migration = read(MIGRATION);

  assert.ok(audit.includes("BR-INV-A"), "Gate title required");
  assert.ok(audit.includes("Autos inventory pattern"), "Autos pattern section required");
  assert.ok(audit.includes("BR Privado"), "BR Privado section required");
  assert.ok(audit.includes("BR Negocio"), "BR Negocio section required");
  assert.ok(audit.includes("Supabase"), "Supabase backing section required");
  assert.ok(audit.includes("public.listings"), "Real listings table required");
  assert.ok(audit.includes("leonix_ad_id"), "Leonix Ad ID required");
  assert.ok(audit.includes("br_inventory_group_id"), "Inventory group id required");
  assert.ok(audit.includes("BR-INV-B"), "Gate stack required");
  assert.ok(audit.includes("No feature code changed"), "No feature build claim required");
  assert.ok(audit.includes("No schema/migration changed"), "No schema change claim required");

  assert.ok(migration.includes("br_inventory_group_id"), "Migration must define group id");
  assert.ok(migration.includes("inventory_property"), "Migration must define inventory_property role");
  assert.equal(/listing_translations/i.test(audit), false, "Must not introduce listing_translations");
  assert.equal(/DO NOT BUILD/i.test(audit) || /Do-not-build-yet/i.test(audit), true, "Do-not-build list required");

  console.log("BR-INV-A audit doc OK");
  console.log("Autos inventory pattern referenced OK");
  console.log("BR Privado / Negocio / Supabase backing documented OK");
  console.log("No schema change / no feature build claimed OK");
}

run();
