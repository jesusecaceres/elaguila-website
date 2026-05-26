/**
 * Gate G2A.5 — Magazine Page Placement Metadata verification.
 */

import { readFileSync, existsSync } from "node:fs";

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.error(`  ❌ ${label}`); }
}

function read(p) {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function readNonComment(p) {
  return read(p).split("\n").filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  }).join("\n");
}

console.log("\n=== Gate G2A.5 — Magazine Placement Priority Model ===\n");

// 1. Helper exists
const helperPath = "app/lib/listingPlans/magazinePlacementPriority.ts";
assert(existsSync(helperPath), "magazinePlacementPriority helper exists");

const helper = read(helperPath);
assert(helper.includes("normalizePrintPlacementType"), "Helper exports normalizePrintPlacementType");
assert(helper.includes("resolveMagazinePlacementPriority"), "Helper exports resolveMagazinePlacementPriority");
assert(helper.includes("compareMagazinePlacementPriority"), "Helper exports compareMagazinePlacementPriority");

// 2. Helper is pure — no DB, no fetch, no React, no Stripe
const helperCode = readNonComment(helperPath);
assert(!helperCode.includes("supabase"), "Helper does not import supabase");
assert(!helperCode.includes("fetch("), "Helper does not call fetch()");
assert(!helperCode.includes("from \"react\"") && !helperCode.includes("from 'react'"), "Helper does not import React");
assert(!helperCode.toLowerCase().includes("stripe"), "Helper does not reference Stripe");

// 3. Helper does NOT include cover square logic
assert(!helper.includes("cover_square") && !helper.includes("square_number"), "Helper does not include cover square logic");

// 4. Priority values
assert(helper.includes("back_cover") && helper.includes(": 0") || helper.includes("= 1"), "Back cover priority is represented");
assert(helper.includes("inside_page") && helper.includes(": 100") || helper.includes("+ 100"), "Inside page offset 100");
assert(helper.includes("9999"), "Fallback priority 9999 exists");
assert(helper.includes("9000"), "Internal reserved priority 9000 exists");

// 5. Package entitlement page has magazine fields
const pagePath = "app/admin/(dashboard)/workspace/package-entitlements/page.tsx";
const page = read(pagePath);
assert(page.includes("magazine_issue"), "Page includes magazine issue field");
assert(page.includes("magazine_page_number"), "Page includes magazine page number field");
assert(page.includes("print_placement_type"), "Page includes print placement type field");
assert(page.includes("placement_notes"), "Page includes placement notes field");
assert(page.includes("reserved_internal"), "Page includes reserved/internal toggle");

// 6. Page does NOT include cover square number
assert(!page.includes("cover_square") && !page.includes("square_number"), "Page does NOT include cover square number");

// 7. Create action stores print_placement
const actionsPath = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const actions = read(actionsPath);
assert(actions.includes("print_placement"), "Create action stores metadata.print_placement");
assert(actions.includes("resolveMagazinePlacementPriority"), "Create action uses resolveMagazinePlacementPriority");

// 8. Constants file has print placement types
const constantsPath = "app/admin/_lib/packageEntitlementConstants.ts";
const constants = read(constantsPath);
assert(constants.includes("PACKAGE_ENTITLEMENT_PRINT_PLACEMENT_TYPES"), "Constants include PRINT_PLACEMENT_TYPES");

// 9. Tracker list shows magazine info
assert(page.includes("print_placement") && page.includes("Magazine:"), "Tracker list shows magazine placement info");

// 10. Docs
const entitlementDoc = read("docs/package-entitlement-model.md");
assert(entitlementDoc.includes("page number") || entitlementDoc.includes("page_number"), "Docs mention page number controls Destacados order");
assert(entitlementDoc.includes("back cover") || entitlementDoc.includes("back_cover"), "Docs mention back cover priority");
assert(entitlementDoc.toLowerCase().includes("cover square") && (entitlementDoc.toLowerCase().includes("not included") || entitlementDoc.toLowerCase().includes("deferred")), "Docs mention cover square logic deferred/not used");

const visibilityDoc = read("docs/print-to-digital-visibility-policy.md");
assert(visibilityDoc.includes("G2A.5"), "Visibility policy doc mentions G2A.5");
assert(visibilityDoc.toLowerCase().includes("special banner") && visibilityDoc.toLowerCase().includes("later"), "Docs mention special banners later");
assert(visibilityDoc.includes("No public Destacados module"), "Docs mention no public Destacados module yet");
assert(visibilityDoc.includes("No public sorting change"), "Docs mention no public sorting change yet");

const smokeDoc = read("docs/admin-workspace-smoke-test.md");
assert(smokeDoc.includes("G2A.5") && smokeDoc.includes("Magazine"), "Smoke test doc has G2A.5 section");

// 11. No forbidden additions
const actionsCode = readNonComment(actionsPath);
assert(!actionsCode.toLowerCase().includes("stripe") || actionsCode.includes("stripe_checkout_session_id: null"), "No new Stripe code added");
assert(!actionsCode.includes("public redemption"), "No public redemption added");
assert(!actionsCode.includes("commission_payout"), "No commission payout added");

// 12. No new Supabase migration for print_placement / magazine_placement
const migrationDir = "supabase/migrations";
if (existsSync(migrationDir)) {
  const { readdirSync } = await import("node:fs");
  const migrations = readdirSync(migrationDir);
  const g2a5Migrations = migrations.filter((f) => f.includes("magazine_placement") || f.includes("print_placement") || f.includes("placement_priority"));
  assert(g2a5Migrations.length === 0, "No Supabase migration added for G2A.5");
} else {
  assert(true, "No Supabase migration directory (OK)");
}

console.log(`\n  Results: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
