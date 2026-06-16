/**
 * ADMIN-ANALYTICS-MONETIZATION-TABLE-AUDIT-01 verification.
 * Run: npm run verify:admin-analytics-monetization-table-audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const doc = "docs/admin-analytics-monetization-table-audit.md";
const pkg = "package.json";

assert("audit doc exists", exists(doc), doc);

const docSrc = read(doc);
const pkgSrc = read(pkg);

const requiredSections = [
  "Listing table coverage matrix",
  "Analytics truth matrix",
  "Monetization readiness matrix",
  "Supabase migration/table proof",
  "Admin preparedness verdict",
  "Blockers / needs live Supabase proof",
];

for (const section of requiredSections) {
  assert(`section: ${section}`, docSrc.includes(section), doc);
}

const requiredTables = [
  "public.listings",
  "restaurantes_public_listings",
  "servicios_public_listings",
  "empleos_public_listings",
  "autos_classifieds_listings",
  "viajes_staged_listings",
  "listing_analytics",
  "servicios_analytics_events",
  "autos_classifieds_analytics_events",
  "saved_listings",
  "user_liked_listings",
];

for (const table of requiredTables) {
  assert(`table audited: ${table}`, docSrc.includes(table), doc);
}

const requiredCategories = [
  "en-venta",
  "rentas",
  "bienes-raices",
  "clases",
  "comunidad",
  "restaurantes",
  "servicios",
  "empleos",
  "autos",
  "viajes",
];

for (const cat of requiredCategories) {
  assert(`category in matrix: ${cat}`, docSrc.includes(cat), doc);
}

assert("live supabase unknowns marked", docSrc.includes("NEEDS_LIVE_SUPABASE_PROOF"), doc);
assert("analytics strict true rule documented", docSrc.includes("Strict TRUE rule"), doc);
assert("overall verdict present", docSrc.includes("Overall verdict"), doc);
assert("no fake analytics claim", docSrc.includes("PARTIAL") || docSrc.includes("FALSE"), doc);
assert("stripe deferred noted", docSrc.toLowerCase().includes("stripe") && docSrc.toLowerCase().includes("deferred"), doc);
assert("membership_tier leakage addressed", docSrc.includes("membership_tier"), doc);
assert("verifier script registered", pkgSrc.includes("verify:admin-analytics-monetization-table-audit"), pkg);
assert("verifier file exists", exists("scripts/verify-admin-analytics-monetization-table-audit.mjs"));

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-analytics-monetization-table-audit FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-analytics-monetization-table-audit PASS (${checks.length} checks)`);
