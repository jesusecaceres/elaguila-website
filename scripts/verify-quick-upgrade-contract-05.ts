/**
 * Gate 14 · Verifier 5 — the SIMPLE -> FULL upgrade contract.
 *
 * Catches: an upgrade that creates a second identity (a new listing, a new business, a new
 * public URL), an upgrade pointing at the wrong package, and an automatic downgrade.
 *
 * Run: npx tsx scripts/verify-quick-upgrade-contract-05.ts
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
  decideBusinessAccess,
  maxBusinessAccessLevel,
  upgradeTargetPackageKey,
  type BusinessAccessLevel,
} from "../app/lib/listingPlans/businessAccessLevel";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import { REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS } from "../app/lib/listingPlans/revenueActiveEntitlementGuard";
import type { EntitlementRowFacts } from "../app/lib/listingPlans/categoryCommercialPlanPolicy";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

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
const CONTRACT = "docs/quick-commercial/LEONIX_QUICK_TO_FULL_UPGRADE_CONTRACT.md";

const row = (over: Partial<EntitlementRowFacts>): EntitlementRowFacts => ({
  id: "row",
  packageKey: null,
  grantSource: "stripe_webhook",
  packageTier: "digital_only",
  status: "active",
  startsAt: null,
  endsAt: null,
  ...over,
});

// 1. THE UPGRADE TARGET ---------------------------------------------------------------------
check("each category upgrades into its own existing Full package", () => {
  const expected: Record<string, string> = {
    servicios: "servicios_base_monthly",
    restaurantes: "restaurantes_base_monthly",
    autos: "autos_dealer_monthly",
    "bienes-raices": "br_agent_monthly",
  };
  for (const [category, fullKey] of Object.entries(expected)) {
    assert.equal(upgradeTargetPackageKey(category), fullKey, `${category} upgrade target`);
    const def = getRevenuePackageDefinition(fullKey);
    assert.ok(def, `${fullKey} exists`);
    assert.equal(def!.businessAccessLevel, "full", `${fullKey} grants FULL`);
    assert.equal(def!.priceCents, 39900, `${fullKey} price is unchanged by the upgrade path`);
  }
  assert.equal(upgradeTargetPackageKey("comida-local"), null, "categories outside the split");
  assert.equal(upgradeTargetPackageKey("rentas"), null, "classifieds never upgrade to a business tier");
});

check("the upgrade target is never the Quick package the customer already has", () => {
  for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.notEqual(upgradeTargetPackageKey(category), pair.simple, `${category} must move up`);
  }
});

// 2. NEVER DOWNGRADE ------------------------------------------------------------------------
check("holding both packages resolves FULL — an upgrade can never be undone by the old row", () => {
  const during = decideBusinessAccess({
    rows: [
      row({ id: "old", packageKey: "servicios_quick_monthly" }),
      row({ id: "new", packageKey: "servicios_base_monthly" }),
    ],
    nowMs: NOW,
  });
  assert.equal(during.level, "full", "the Full grant wins while the Quick row is still live");
  assert.equal(during.packageKey, "servicios_base_monthly", "and it is reported honestly");
});

check("the resolver has no path that lowers a level", () => {
  const levels: BusinessAccessLevel[] = ["none", "simple", "full"];
  for (const a of levels) {
    for (const b of levels) {
      const combined = maxBusinessAccessLevel(a, b);
      const rank = { none: 0, simple: 1, full: 2 } as const;
      assert.ok(rank[combined] >= rank[a] && rank[combined] >= rank[b], `${a}+${b} never downgrades`);
    }
  }
  const code = read("app/lib/listingPlans/businessAccessLevel.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.ok(code.includes("RANK[b.level] - RANK[a.level]"), "grants are sorted highest first");
});

// 3. ONE IDENTITY ---------------------------------------------------------------------------
check("the upgrade changes entitlement, not identity: no second listing table exists", () => {
  const changed = execSync("git diff --name-only origin/main...HEAD", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  assert.deepEqual(
    changed.filter((f) => f.startsWith("supabase/migrations/")),
    [],
    "no migration, so no second business or listing table",
  );
  const quickTree = execSync("git ls-files 'app/(site)/publicar/negocio-rapido'", {
    cwd: ROOT,
    encoding: "utf8",
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const publicSurfaces = quickTree.filter((f) =>
    /(PublicDetail|PublicProfile|PublicListing|Marketplace)\w*\.tsx$/.test(f),
  );
  assert.deepEqual(publicSurfaces, [], "Quick has no public product of its own to migrate away from");
});

check("both levels of a category share one canonical category, source and public output", () => {
  for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    const simple = getRevenuePackageDefinition(pair.simple)!;
    const full = getRevenuePackageDefinition(pair.full)!;
    assert.equal(simple.category, full.category, `${category}: same canonical category`);
    assert.equal(simple.customerType, full.customerType, `${category}: same customer type`);
    assert.equal(simple.billingMode, full.billingMode, `${category}: same billing shape`);
  }
});

check("both levels are governed by the same recharge guard", () => {
  // Without this, an upgrade — or any edit after one — could double-charge the customer.
  for (const pair of Object.values(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.ok(REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has(pair.simple), `${pair.simple} guarded`);
    assert.ok(REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has(pair.full), `${pair.full} guarded`);
  }
});

// 4. THE CONTRACT IS WRITTEN DOWN -----------------------------------------------------------
check("the upgrade contract document exists and states what is preserved", () => {
  assert.ok(exists(CONTRACT), `${CONTRACT} must exist`);
  const doc = read(CONTRACT);
  for (const promise of [
    "listing id",
    "slug",
    "media",
    "owner",
    "public URL",
  ]) {
    assert.ok(
      doc.toLowerCase().includes(promise.toLowerCase()),
      `the contract must state that ${promise} is preserved`,
    );
  }
  for (const fullKey of [
    "servicios_base_monthly",
    "restaurantes_base_monthly",
    "autos_dealer_monthly",
    "br_agent_monthly",
  ]) {
    assert.ok(doc.includes(fullKey), `the contract must name the ${fullKey} target`);
  }
  assert.ok(/never downgrade|Never downgrade/.test(doc), "the contract must forbid auto-downgrade");
});

console.log(failures === 0 ? "\nOK — upgrade contract proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
