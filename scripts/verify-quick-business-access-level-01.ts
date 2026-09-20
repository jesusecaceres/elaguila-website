/**
 * Gate 14 · Verifier 1 — SIMPLE vs FULL business access level.
 *
 * Catches: Quick pointing at the Full base package, Simple gaining Business Hub or analytics,
 * Full losing an existing capability, a hardcoded client price, a duplicate Quick public
 * product, and a new database migration.
 *
 * Run: npx tsx scripts/verify-quick-business-access-level-01.ts
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  BUSINESS_ACCESS_FULL_ONLY_CAPABILITIES,
  BUSINESS_CATEGORY_PACKAGE_PAIR,
  businessAccessAllows,
  businessAccessLevelForPackageKey,
  businessPackageKeyForLevel,
  capabilitiesForBusinessAccessLevel,
  decideBusinessAccess,
  isBusinessAccessCategory,
  maxBusinessAccessLevel,
  type BusinessAccessCapability,
} from "../app/lib/listingPlans/businessAccessLevel";
import {
  getRevenuePackageDefinition,
  REVENUE_V1_PACKAGE_MATRIX,
} from "../app/lib/listingPlans/revenuePricingMatrix";
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

const QUICK_KEYS = [
  "servicios_quick_monthly",
  "restaurantes_quick_monthly",
  "autos_dealer_quick_monthly",
  "br_agent_quick_monthly",
] as const;

const FULL_KEYS = [
  "servicios_base_monthly",
  "restaurantes_base_monthly",
  "autos_dealer_monthly",
  "br_agent_monthly",
] as const;

const row = (over: Partial<EntitlementRowFacts>): EntitlementRowFacts => ({
  id: "row-1",
  packageKey: null,
  grantSource: "stripe_webhook",
  packageTier: "digital_only",
  status: "active",
  startsAt: null,
  endsAt: null,
  ...over,
});

const NOW = Date.parse("2026-06-01T00:00:00.000Z");

// 1. QUICK NEVER SELLS THE FULL PACKAGE -----------------------------------------------------
check("Quick Business registry names only the four Quick packages, never a Full base key", () => {
  const reg = read("app/lib/quickBusiness/quickBusinessRegistry.ts");
  const named = [...reg.matchAll(/packageKey: "([a-z0-9_]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(new Set(named), new Set(QUICK_KEYS), "registry postures must be the Quick keys");
  for (const fullKey of FULL_KEYS) {
    assert.ok(
      !new RegExp(`packageKey: "${fullKey}"`).test(reg),
      `registry must not sell the Full package ${fullKey}`,
    );
  }
});

check("every category with a Quick package pairs it to that category's Full package", () => {
  assert.deepEqual(Object.keys(BUSINESS_CATEGORY_PACKAGE_PAIR).sort(), [
    "autos",
    "bienes-raices",
    "restaurantes",
    "servicios",
  ]);
  for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.ok(QUICK_KEYS.includes(pair.simple as (typeof QUICK_KEYS)[number]), `${category} simple`);
    assert.ok(FULL_KEYS.includes(pair.full as (typeof FULL_KEYS)[number]), `${category} full`);
    assert.equal(businessPackageKeyForLevel(category, "simple"), pair.simple);
    assert.equal(businessPackageKeyForLevel(category, "full"), pair.full);
    assert.equal(businessPackageKeyForLevel(category, "none"), null);
    assert.ok(isBusinessAccessCategory(category));
  }
});

// 2. PACKAGE DEFINITIONS -------------------------------------------------------------------
check("each Quick package is a $99/mo subscription granting SIMPLE and no capabilities", () => {
  for (const key of QUICK_KEYS) {
    const def = getRevenuePackageDefinition(key);
    assert.ok(def, `${key} must exist in the pricing matrix`);
    assert.equal(def!.priceCents, 9900, `${key} price`);
    assert.equal(def!.billingMode, "monthly_subscription", `${key} billing`);
    assert.equal(def!.businessAccessLevel, "simple", `${key} access level`);
    assert.deepEqual(def!.capabilities ?? [], [], `${key} must declare no per-package capability`);
    assert.equal(def!.stripeEligible, true, `${key} must be purchasable`);
    assert.equal(businessAccessLevelForPackageKey(key), "simple");
  }
});

check("Full packages keep their price and their existing capabilities, and declare FULL", () => {
  for (const key of FULL_KEYS) {
    const def = getRevenuePackageDefinition(key);
    assert.ok(def, `${key} must exist`);
    assert.equal(def!.priceCents, 39900, `${key} must remain $399/mo`);
    assert.equal(def!.businessAccessLevel, "full", `${key} access level`);
    assert.equal(businessAccessLevelForPackageKey(key), "full");
  }
  // Owner-locked before this mission: coupons/offers is included in these two base packages.
  for (const key of ["servicios_base_monthly", "restaurantes_base_monthly"]) {
    assert.ok(
      (getRevenuePackageDefinition(key)?.capabilities ?? []).includes("coupons_offers"),
      `${key} must not lose coupons_offers`,
    );
  }
  // FULL access must not invent coupons_offers for categories whose package never declared it.
  for (const key of ["autos_dealer_monthly", "br_agent_monthly"]) {
    assert.ok(
      !(getRevenuePackageDefinition(key)?.capabilities ?? []).includes("coupons_offers"),
      `${key} must not gain a capability it never had`,
    );
  }
});

check("Simple never inherits the Full inventory allowance for dealer and agent", () => {
  const dealerFull = getRevenuePackageDefinition("autos_dealer_monthly")!;
  const dealerQuick = getRevenuePackageDefinition("autos_dealer_quick_monthly")!;
  assert.notEqual(dealerQuick.includedInventory, dealerFull.includedInventory);
  assert.equal(dealerQuick.addOnInventory, null, "Quick dealer has no inventory pack");
  const agentFull = getRevenuePackageDefinition("br_agent_monthly")!;
  const agentQuick = getRevenuePackageDefinition("br_agent_quick_monthly")!;
  assert.notEqual(agentQuick.includedInventory, agentFull.includedInventory);
  assert.equal(agentQuick.addOnInventory, null, "Quick agent has no inventory pack");
});

check("no non-business package accidentally declares a business access level", () => {
  const allowed = new Set<string>([...QUICK_KEYS, ...FULL_KEYS]);
  for (const def of REVENUE_V1_PACKAGE_MATRIX) {
    if (def.businessAccessLevel == null) continue;
    assert.ok(allowed.has(def.packageKey), `${def.packageKey} must not declare an access level`);
  }
});

// 3. CAPABILITY SEPARATION -----------------------------------------------------------------
check("SIMPLE is denied every FULL-only capability and FULL is granted every one", () => {
  const simple = capabilitiesForBusinessAccessLevel("simple");
  for (const cap of BUSINESS_ACCESS_FULL_ONLY_CAPABILITIES) {
    assert.ok(!simple.includes(cap), `SIMPLE must not include ${cap}`);
    assert.ok(!businessAccessAllows("simple", cap), `SIMPLE must be denied ${cap}`);
    assert.ok(businessAccessAllows("full", cap), `FULL must allow ${cap}`);
  }
  for (const cap of ["business_hub", "analytics"] as BusinessAccessCapability[]) {
    assert.ok(BUSINESS_ACCESS_FULL_ONLY_CAPABILITIES.includes(cap), `${cap} must be FULL-only`);
  }
  assert.deepEqual(capabilitiesForBusinessAccessLevel("none"), [], "no access grants nothing");
});

check("SIMPLE keeps the capabilities it is actually sold", () => {
  for (const cap of [
    "public_listing",
    "contact_ctas",
    "simple_management",
    "upgrade_to_full",
  ] as BusinessAccessCapability[]) {
    assert.ok(businessAccessAllows("simple", cap), `SIMPLE must allow ${cap}`);
    assert.ok(businessAccessAllows("full", cap), `FULL must also allow ${cap}`);
  }
});

// 4. RESOLVER BEHAVIOUR --------------------------------------------------------------------
check("the highest live grant wins, so access can never be silently downgraded", () => {
  assert.equal(maxBusinessAccessLevel("simple", "full"), "full");
  assert.equal(maxBusinessAccessLevel("full", "simple"), "full");
  assert.equal(maxBusinessAccessLevel("none", "simple"), "simple");

  const both = decideBusinessAccess({
    rows: [
      row({ id: "a", packageKey: "servicios_quick_monthly" }),
      row({ id: "b", packageKey: null, packageTier: "half_page", grantSource: "print_included" }),
    ],
    nowMs: NOW,
  });
  assert.equal(both.level, "full", "quick digital + half-page print resolves to FULL");
  assert.equal(both.grants.length, 2, "both grants stay visible for staff");
});

check("a quick-only customer is SIMPLE and a full-only customer is FULL", () => {
  assert.equal(
    decideBusinessAccess({ rows: [row({ packageKey: "servicios_quick_monthly" })], nowMs: NOW }).level,
    "simple",
  );
  assert.equal(
    decideBusinessAccess({ rows: [row({ packageKey: "servicios_base_monthly" })], nowMs: NOW }).level,
    "full",
  );
  assert.equal(decideBusinessAccess({ rows: [], nowMs: NOW }).level, "none");
});

check("an expired row grants nothing and a suspended subscription blocks access", () => {
  const expired = decideBusinessAccess({
    rows: [row({ packageKey: "servicios_base_monthly", endsAt: "2026-01-01T00:00:00.000Z" })],
    nowMs: NOW,
  });
  assert.equal(expired.level, "none", "a stale active row past its end date is not live");

  const suspended = decideBusinessAccess({
    rows: [row({ packageKey: "servicios_base_monthly" })],
    nowMs: NOW,
    subscriptionOverride: "suspended",
  });
  assert.equal(suspended.level, "none", "suspended blocks access outright");

  const grace = decideBusinessAccess({
    rows: [row({ packageKey: "servicios_base_monthly" })],
    nowMs: NOW,
    subscriptionOverride: "grace",
  });
  assert.equal(grace.level, "full", "grace keeps existing paid access usable");
});

// 5. NO PARALLEL PRODUCT, NO SCATTERED PRICE ------------------------------------------------
check("no new database migration was added for the access model", () => {
  const changed = execSync("git diff --name-only origin/main...HEAD", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  assert.deepEqual(
    changed.filter((f) => f.startsWith("supabase/migrations/")),
    [],
    "the access level is derived from existing columns and needs no migration",
  );
});

check("the $99 amount is written once, in the pricing matrix", () => {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      if (rel === "app/lib/listingPlans/revenuePricingMatrix.ts") continue;
      // Pre-existing and unrelated: the retired Comida Local Basic/Plus tier definitions, kept
      // only so historical tier labels still resolve (see the Gate D18 note in the matrix).
      if (rel === "app/lib/clasificados/comida-local/comidaLocalPackages.ts") continue;
      const src = read(rel);
      // 9900 also legitimately appears as the pre-existing br_inventory_pack price, which lives
      // in the matrix; anywhere else a literal 9900 next to a price word is a scattered price.
      if (/(priceCents|price_cents|unitAmount|unit_amount|amountCents)\s*[:=]\s*9900\b/.test(src)) {
        offenders.push(rel);
      }
    }
  };
  walk("app");
  assert.deepEqual(offenders, [], "no surface may hardcode the Quick price");
});

check("Quick Business adds no second public product surface", () => {
  const tracked = execSync("git ls-files 'app/(site)/publicar/negocio-rapido'", {
    cwd: ROOT,
    encoding: "utf8",
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const forbidden = tracked.filter((f) =>
    /(PublicDetail|PublicCard|PublicProfile|PublicListing|Marketplace)\w*\.tsx$/.test(f),
  );
  assert.deepEqual(forbidden, [], "Quick must reuse the canonical public output");
});

console.log(failures === 0 ? "\nOK — business access level proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
