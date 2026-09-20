/**
 * Gate 14 · Verifier 2 — print-to-digital business-access bridge.
 *
 * Catches: quarter page accidentally granting FULL, half/full/premium page failing to grant
 * FULL, a changed print price, and the two dimensions being conflated (a print bundle silently
 * altering print ranking, or a print tier being treated as a digital package).
 *
 * Run: npx tsx scripts/verify-quick-print-bundle-access-02.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  businessAccessAllows,
  businessAccessLevelForPrintTier,
  decideBusinessAccess,
} from "../app/lib/listingPlans/businessAccessLevel";
import { printBundleCopy } from "../app/lib/listingPlans/businessAccessCopy";
import {
  getPackageEntitlementBenefits,
  normalizePackageEntitlementTier,
} from "../app/lib/listingPlans/packageEntitlements";
import { getPackageBasePriceCents } from "../app/lib/listingPlans/packagePricingRules";
import type { EntitlementRowFacts } from "../app/lib/listingPlans/categoryCommercialPlanPolicy";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

let failures = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL  ${name}\n      ${err instanceof Error ? err.message : String(err)}`);
  }
}

const NOW = Date.parse("2026-06-01T00:00:00.000Z");

const printRow = (tier: string, over: Partial<EntitlementRowFacts> = {}): EntitlementRowFacts => ({
  id: `print-${tier}`,
  packageKey: null,
  grantSource: "print_included",
  packageTier: tier,
  status: "active",
  startsAt: null,
  endsAt: null,
  ...over,
});

// 1. THE OWNER'S COMMERCIAL LOCK -----------------------------------------------------------
check("quarter page includes SIMPLE and never FULL", () => {
  assert.equal(businessAccessLevelForPrintTier("quarter_page"), "simple");
  const decided = decideBusinessAccess({ rows: [printRow("quarter_page")], nowMs: NOW });
  assert.equal(decided.level, "simple");
  assert.equal(decided.source, "print_package");
  assert.equal(decided.printTier, "quarter_page");
  for (const cap of ["business_hub", "analytics", "leads", "business_tools"] as const) {
    assert.ok(!businessAccessAllows("simple", cap), `quarter page must not grant ${cap}`);
  }
});

check("half page, full page and premium each include FULL", () => {
  for (const tier of ["half_page", "full_page", "premium"] as const) {
    assert.equal(businessAccessLevelForPrintTier(tier), "full", `${tier} must bridge to FULL`);
    const decided = decideBusinessAccess({ rows: [printRow(tier)], nowMs: NOW });
    assert.equal(decided.level, "full", `${tier} resolves FULL`);
    assert.equal(decided.printTier, tier);
  }
});

check("non-business print tiers bridge to nothing", () => {
  for (const tier of ["classified_print", "digital_only", "none", "unknown", "", null]) {
    assert.equal(
      businessAccessLevelForPrintTier(tier),
      "none",
      `${String(tier)} must not grant business access`,
    );
  }
});

check("an expired print entitlement grants no business access", () => {
  const decided = decideBusinessAccess({
    rows: [printRow("premium", { endsAt: "2026-01-01T00:00:00.000Z" })],
    nowMs: NOW,
  });
  assert.equal(decided.level, "none");
});

// 2. PRINT PRICES ARE UNTOUCHED -------------------------------------------------------------
check("print package prices are unchanged", () => {
  const expected: Record<string, number> = {
    quarter_page: 49_900,
    half_page: 79_900,
    full_page: 119_900,
    premium: 199_900,
  };
  for (const [tier, cents] of Object.entries(expected)) {
    assert.equal(getPackageBasePriceCents(tier), cents, `${tier} price must not change`);
  }
  const rules = read("app/lib/listingPlans/packagePricingRules.ts");
  for (const literal of ["199_900", "119_900", "79_900", "49_900"]) {
    assert.ok(rules.includes(literal), `${literal} must remain in the pricing ladder`);
  }
});

// 3. THE TWO DIMENSIONS STAY ORTHOGONAL -----------------------------------------------------
check("print visibility benefits are untouched by the digital bridge", () => {
  // Business access is additive. Each tier keeps exactly the print benefits it had.
  const premium = getPackageEntitlementBenefits("premium");
  assert.equal(premium.eligibleForDestacadosModule, true, "premium keeps destacados");
  const fullPage = getPackageEntitlementBenefits("full_page");
  assert.equal(fullPage.eligibleForResultsPriority, true, "full page keeps results priority");
  const half = getPackageEntitlementBenefits("half_page");
  assert.equal(half.benefits.boost_access, true, "half page keeps boost");
  const quarter = getPackageEntitlementBenefits("quarter_page");
  assert.equal(quarter.benefits.print_advertiser_badge, true, "quarter page keeps its print badge");
  assert.equal(quarter.benefits.republish_access, true, "quarter page keeps republish");
  assert.equal(quarter.benefits.boost_access, false, "quarter page still has no boost");
});

check("the bridge never reads or rewrites the print visibility model", () => {
  const src = read("app/lib/listingPlans/businessAccessLevel.ts");
  // Strip comments: the module's own documentation names the ranking concepts it is careful NOT
  // to touch, so only executable code can answer this question honestly.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const symbol of [
    "getPackageEntitlementBenefits",
    "visibilityBucket",
    "destacados",
    "results_priority",
    "eligibleForResultsPriority",
  ]) {
    assert.ok(!code.includes(symbol), `the access resolver must not touch print ranking (${symbol})`);
  }
  assert.ok(
    code.includes("normalizePackageEntitlementTier"),
    "the bridge must reuse the canonical tier normalizer rather than re-parsing tiers",
  );
});

check("print tier and digital package are separate grants on the same decision", () => {
  const both = decideBusinessAccess({
    rows: [
      printRow("quarter_page"),
      {
        id: "digital",
        packageKey: "servicios_base_monthly",
        grantSource: "stripe_webhook",
        packageTier: "digital_only",
        status: "active",
        startsAt: null,
        endsAt: null,
      },
    ],
    nowMs: NOW,
  });
  // A quarter-page advertiser who also pays for the Full digital package is FULL, not SIMPLE.
  assert.equal(both.level, "full");
  assert.equal(both.source, "digital_package");
  const kinds = both.grants.map((g) => g.kind).sort();
  assert.deepEqual(kinds, ["digital_package", "print_package"]);
});

// 4. COPY MATCHES THE LOCK ------------------------------------------------------------------
check("bundle copy promises exactly what the bridge grants, in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    const quarter = printBundleCopy("quarter_page", lang);
    assert.ok(quarter, "quarter page has bundle copy");
    const full = printBundleCopy("half_page", lang);
    assert.ok(full, "half page has bundle copy");
    assert.notEqual(quarter, full, "quarter must not promise the Full bundle");
    assert.equal(printBundleCopy("full_page", lang), full);
    assert.equal(printBundleCopy("premium", lang), full);
    assert.equal(printBundleCopy("classified_print", lang), null, "no bundle promise off-ladder");
  }
  const copy = read("app/lib/listingPlans/businessAccessCopy.ts");
  assert.ok(!/\$\s?\d|\d{3,}\s*cents|priceCents/.test(copy), "copy must never contain a price");
});

check("tier normalization accepts the variants staff actually type", () => {
  assert.equal(normalizePackageEntitlementTier("Quarter Page"), "quarter_page");
  assert.equal(businessAccessLevelForPrintTier("Quarter Page"), "simple");
  assert.equal(businessAccessLevelForPrintTier("half"), "full");
});

console.log(failures === 0 ? "\nOK — print bundle bridge proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
