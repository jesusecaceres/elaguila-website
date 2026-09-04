// Globalization Gate 6A-FINAL — structural verifier for the narrow Autos-only Leonix Ad-ID
// reconciliation migration. Pure source-file assertions only, no live DB dependency (mirrors
// scripts/verify-c7-capacity-rpc-sql-contract.mjs's pattern).
//
// Run: node scripts/verify-autos-leonix-ad-id-reconciliation.mjs

import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..");
const MIGRATION_PATH = "supabase/migrations/20260903090000_autos_leonix_ad_id_reconciliation.sql";
const src = readFileSync(join(REPO_ROOT, MIGRATION_PATH), "utf8");

let failures = 0;
function check(label, ok) {
  if (ok) {
    console.log(`PASS  ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
}

check(
  "touches autos_classifieds_listings only (no other table ALTERed)",
  !/alter table (public\.listings|public\.servicios_public_listings|public\.empleos_public_listings|public\.restaurantes_public_listings)/i.test(src),
);

check(
  "never CREATE OR REPLACEs any shared Ad-ID helper function",
  !/create or replace function public\.(bump_leonix_ad_counter|leonix_allocate_formatted|leonix_listings_prefix)\s*\(/i.test(src),
);

check(
  "never calls leonix_listings_prefix (uses a literal prefix instead)",
  !/leonix_listings_prefix\s*\(/i.test(src),
);

check(
  "adds leonix_ad_id as ADD COLUMN IF NOT EXISTS (additive)",
  /add column if not exists leonix_ad_id text/i.test(src),
);

check(
  "does not enforce NOT NULL on leonix_ad_id",
  !/alter column leonix_ad_id set not null/i.test(src),
);

check(
  "creates the expected partial unique index with the not-null/non-blank predicate",
  /create unique index if not exists autos_classifieds_listings_leonix_ad_id_uidx[\s\S]{0,200}where leonix_ad_id is not null and trim\(leonix_ad_id\) <> ''/i.test(src),
);

check(
  "trigger function only assigns when null or blank (never overwrites an existing id)",
  /if new\.leonix_ad_id is null or trim\(new\.leonix_ad_id\) = ''/i.test(src),
);

check(
  "calls the existing live helper with the literal 'autos' namespace and 'AUTO' prefix",
  /public\.leonix_allocate_formatted\(\s*'autos',\s*'AUTO',\s*extract\(year from now\(\)\)::int\s*\)/i.test(src),
);

check(
  "trigger fires BEFORE INSERT OR UPDATE",
  /before insert or update on public\.autos_classifieds_listings/i.test(src),
);

check(
  "trigger creation uses the safe DROP TRIGGER IF EXISTS then CREATE TRIGGER pattern",
  /drop trigger if exists autos_classifieds_listings_leonix_ad_id_biu on public\.autos_classifieds_listings;\s*create trigger autos_classifieds_listings_leonix_ad_id_biu/i.test(src),
);

check(
  "carries a truthful COMMENT ON COLUMN",
  /comment on column public\.autos_classifieds_listings\.leonix_ad_id is/i.test(src),
);

console.log(failures === 0 ? "\nverify-autos-leonix-ad-id-reconciliation: all checks passed." : `\nverify-autos-leonix-ad-id-reconciliation: ${failures} check(s) FAILED.`);
if (failures > 0) process.exitCode = 1;
