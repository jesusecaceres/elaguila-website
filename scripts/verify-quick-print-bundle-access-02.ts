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
  describeBusinessAccessRow,
} from "../app/lib/listingPlans/businessAccessLevel";
import { printBundleCopy } from "../app/lib/listingPlans/businessAccessCopy";
import {
  getPackageEntitlementBenefits,
  normalizePackageEntitlementTier,
} from "../app/lib/listingPlans/packageEntitlements";
import { getPackageBasePriceCents } from "../app/lib/listingPlans/packagePricingRules";
import { isHalfPagePlusTier } from "../app/lib/business/diyConcierge/logic";
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

check("a stamped Full package_key never upgrades a quarter-page row to FULL", () => {
  // Package C Build 3 stamps the category BASE (Full) package key onto print-tier admin grants
  // in restaurantes/servicios so the pre-existing capability resolver can find the catalog entry
  // by exact key. That stamp is bookkeeping, not a $399 purchase. If business access took the max
  // of tier and key, every quarter-page advertiser in those two categories would silently receive
  // FULL — the exact break this lock exists to prevent.
  for (const baseKey of ["servicios_base_monthly", "restaurantes_base_monthly"]) {
    const stamped = printRow("quarter_page", { packageKey: baseKey });
    const decided = decideBusinessAccess({ rows: [stamped], nowMs: NOW });
    assert.equal(decided.level, "simple", `${baseKey} stamp must not upgrade quarter page`);
    assert.equal(decided.source, "print_package");
    assert.equal(decided.grants.length, 1, "one row is one purchase, so one grant");
    const badge = describeBusinessAccessRow({ packageKey: baseKey, packageTier: "quarter_page" });
    assert.equal(badge?.label, "PRINT QUARTER + SIMPLE", "staff must see the honest bundle");
    assert.equal(badge?.printTier, "quarter_page", "and the tier the badge is naming");
  }
});

check("a stamped package_key still cannot downgrade a half-page row", () => {
  // Precedence must be tier-first, not merely "print wins when lower".
  const stamped = printRow("half_page", { packageKey: "servicios_quick_monthly" });
  const decided = decideBusinessAccess({ rows: [stamped], nowMs: NOW });
  assert.equal(decided.level, "full");
  assert.equal(
    describeBusinessAccessRow({ packageKey: "servicios_quick_monthly", packageTier: "half_page" })?.label,
    "PRINT HALF + FULL",
  );
});

check("staff badges name the six commercial shapes distinctly", () => {
  // The six products a staff member has to be able to tell apart on a tracker row. A badge that
  // read only "PRINT + FULL" for half page, full page and premium alike would leave staff
  // correlating two fields to answer "what did this customer actually buy?".
  const labels = [
    describeBusinessAccessRow({ packageKey: "servicios_quick_monthly", packageTier: "digital_only" })?.label,
    describeBusinessAccessRow({ packageKey: "servicios_base_monthly", packageTier: "digital_only" })?.label,
    describeBusinessAccessRow({ packageKey: null, packageTier: "quarter_page" })?.label,
    describeBusinessAccessRow({ packageKey: null, packageTier: "half_page" })?.label,
    describeBusinessAccessRow({ packageKey: null, packageTier: "full_page" })?.label,
    describeBusinessAccessRow({ packageKey: null, packageTier: "premium" })?.label,
  ];
  assert.deepEqual(labels, [
    "QUICK / SIMPLE",
    "FULL",
    "PRINT QUARTER + SIMPLE",
    "PRINT HALF + FULL",
    "PRINT FULL PAGE + FULL",
    "PRINT PREMIUM + FULL",
  ]);
  assert.equal(new Set(labels).size, labels.length, "no two commercial shapes may share a label");
  assert.equal(
    describeBusinessAccessRow({ packageKey: null, packageTier: "classified_print" }),
    null,
    "a classified print row is not a business tier",
  );
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

// 5. THE BRIDGE AGREES WITH THE PRE-EXISTING DIY CONCIERGE GATE -----------------------------
// The DIY Concierge pilot resolves its own access straight from listing_package_entitlements
// package_tier, and it predates this mission: quarter_page gets a preview, half_page and above get
// personalized access. That is the same split as the owner print lock. Asserting the two agree
// means a future edit to either one fails here instead of leaving the repository with two
// contradictory definitions of what a quarter page buys.
check("the print bridge and the DIY Concierge tier gate split the ladder at the same place", () => {
  for (const tier of ["quarter_page", "half_page", "full_page", "premium"] as const) {
    assert.equal(
      businessAccessLevelForPrintTier(tier) === "full",
      isHalfPagePlusTier(tier),
      `${tier}: businessAccessLevelForPrintTier and isHalfPagePlusTier must agree`,
    );
  }
  assert.equal(isHalfPagePlusTier(null), false, "no tier is never half-page-plus");
});

check("the DIY Concierge keeps its shipped split: quarter previews, half and above personalized", () => {
  // The bridge agreeing with isHalfPagePlusTier is only meaningful while the Concierge still
  // ACTS on that split. This pins the two outcomes the pilot ships today, so a change that made
  // quarter_page personalized would fail here rather than quietly hand a $499 print customer the
  // personalized product the owner priced at half page.
  const src = read("app/lib/business/diyConcierge/entitlement.ts").replace(/\/\*[\s\S]*?\*\//g, "");
  const quarterBranch = src.slice(src.indexOf('if (resolved.tier === "quarter_page")'));
  assert.ok(quarterBranch.startsWith('if (resolved.tier === "quarter_page")'), "the quarter branch must exist");
  const quarterReturn = quarterBranch.slice(0, quarterBranch.indexOf("}"));
  assert.ok(quarterReturn.includes('state: "quarter_preview"'), "quarter_page must resolve to the preview state");
  assert.ok(
    /personalizedAccess:\s*false/.test(quarterReturn),
    "quarter_page must never carry personalized access",
  );
  const fallThrough = quarterBranch.slice(quarterBranch.indexOf("return {", quarterReturn.length));
  assert.ok(
    fallThrough.includes('state: "personalized_access_active"') && /personalizedAccess:\s*true/.test(fallThrough),
    "half_page and above must resolve to personalized access",
  );
});

console.log(failures === 0 ? "\nOK — print bundle bridge proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
