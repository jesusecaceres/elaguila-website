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
import { decideBusinessBasePlanOffer } from "../app/lib/listingPlans/businessBasePlanOfferPolicy";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import { REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS } from "../app/lib/listingPlans/revenueActiveEntitlementGuard";
import type { EntitlementRowFacts } from "../app/lib/listingPlans/categoryCommercialPlanPolicy";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));
/** Source with comments removed — prose about what a module does not do must not read as code. */
const codeOf = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

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
  // The ONE authorized migration (owner lock 2026-09-24) REPLACES the Autos dealer capacity function so the
  // database authority agrees with BASE = 5 / PRO = 10 / pack = 20. It creates no table or column, so it adds no
  // parallel product, no second listing table and no new access-model storage.
  assert.deepEqual(
    changed.filter(
      (f) =>
        f.startsWith("supabase/migrations/") &&
        !f.endsWith("20260924190000_autos_dealer_base_capacity_authority.sql") &&
        // Launch security Wave 1 (2026-09-25): ACL/RLS hardening only — revoke client EXECUTE on the capacity RPCs and
        // lock down listing_lifecycle_reminder_events. No table, column or access-model storage is created.
        !f.endsWith("20260925120000_revoke_capacity_rpc_client_execute.sql") &&
        !f.endsWith("20260925120100_listing_lifecycle_reminder_events_lockdown.sql") &&
        // Launch security Wave 2 (2026-09-25): a row trigger on public.listings, the Bienes capacity function restored to
        // parent-counting, and an OBSOLETE header on 20260903150000. No table, column or access-model storage is created.
        !f.endsWith("20260925130000_listings_owner_authority_guard.sql") &&
        !f.endsWith("20260925130100_br_negocio_activate_listing_parent_counts.sql") &&
        !f.endsWith("20260903150000_fix_parent_inventory_capacity_counting.sql"),
    ),
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

// 3B. THE DECISION THAT SELLS THE UPGRADE ---------------------------------------------------
check("an existing listing's next base package is decided from held entitlement, not a URL", () => {
  for (const [category, pair] of Object.entries(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    // Holds SIMPLE -> offer this category's own Full package. The whole upgrade path.
    const upgrade = decideBusinessBasePlanOffer({
      category,
      accessLevel: "simple",
      heldPackageKey: pair.simple,
      resumePackageKey: null,
    });
    assert.equal(upgrade.mode, "upgrade", `${category}: a SIMPLE listing has an upgrade to sell`);
    assert.equal(upgrade.sellPackageKey, pair.full, `${category}: and it is the existing Full package`);
    assert.equal(upgrade.heldPackageKey, pair.simple, `${category}: the held package is reported honestly`);

    // Already FULL -> nothing to sell. An upgrade must never be offered twice or re-charged.
    const settled = decideBusinessBasePlanOffer({
      category,
      accessLevel: "full",
      heldPackageKey: pair.full,
      resumePackageKey: null,
    });
    assert.equal(settled.mode, "settled", `${category}: a FULL listing is settled`);
    assert.equal(settled.sellPackageKey, null, `${category}: and is offered nothing further`);

    // No grant, but a Quick checkout was started and abandoned -> re-offer THAT package, so the
    // $99 customer who came back is never billed the Full price for the listing they began.
    const resumed = decideBusinessBasePlanOffer({
      category,
      accessLevel: "none",
      heldPackageKey: null,
      resumePackageKey: pair.simple,
    });
    assert.equal(resumed.mode, "resume", `${category}: an unresolved Quick checkout resumes`);
    assert.equal(resumed.sellPackageKey, pair.simple, `${category}: at the Quick package, not Full`);

    // Nothing held and nothing in flight -> the caller keeps its own default.
    const fresh = decideBusinessBasePlanOffer({
      category,
      accessLevel: "none",
      heldPackageKey: null,
      resumePackageKey: null,
    });
    assert.equal(fresh.mode, "new", `${category}: a fresh application is untouched`);
    assert.equal(fresh.sellPackageKey, null, `${category}: and is sold nothing by this decision`);

    // A foreign or garbage package key in the ledger may never become an offer.
    for (const junk of ["", "not_a_package", "comida_local_monthly", pair.full.toUpperCase() + "X"]) {
      const bogus = decideBusinessBasePlanOffer({
        category,
        accessLevel: "none",
        heldPackageKey: null,
        resumePackageKey: junk,
      });
      assert.equal(bogus.sellPackageKey, null, `${category}: "${junk}" must not be resumable`);
    }
  }
  // Outside the split there is never anything to sell, at any level.
  for (const category of ["comida-local", "rentas", "", "ofertas-locales"]) {
    const offer = decideBusinessBasePlanOffer({
      category,
      accessLevel: "simple",
      heldPackageKey: "servicios_quick_monthly",
      resumePackageKey: "servicios_quick_monthly",
    });
    assert.equal(offer.sellPackageKey, null, `${category}: no business base package to sell`);
  }
});

check("the upgrade never runs the first-purchase machinery against a live listing", () => {
  const offer = codeOf("app/lib/listingPlans/businessBasePlanOffer.ts");
  // The relaxation is allowed for exactly one shape: the category's FULL target, bought for a
  // listing the ENTITLEMENT TABLE says is already live on SIMPLE. Not a flag, not a request field.
  assert.ok(
    /packageKey !== upgradeTargetPackageKey\(category\)\) return false/.test(offer),
    "only the category's own Full target may be treated as an upgrade",
  );
  assert.ok(
    /resolveBusinessAccess\([\s\S]{0,200}access\.level === "simple"/.test(offer),
    "and only when the server resolves the listing as already holding SIMPLE",
  );

  const route = codeOf("app/api/revenue-os/checkout/route.ts");
  assert.ok(
    /const businessUpgradeInPlace =[\s\S]{0,400}isBusinessBaseUpgradeInPlace\(\{/.test(route),
    "the checkout route must derive the upgrade server-side",
  );
  assert.ok(
    !/businessUpgradeInPlace\s*=\s*(body|payload|json|request)/.test(route),
    "the upgrade flag must never be read off the request",
  );
  // The two first-purchase steps that would take a paying customer's live ad offline.
  assert.ok(
    /!businessUpgradeInPlace && !isAutosListingPayableStatus\(/.test(route),
    "a first-purchase status pre-flight must not refuse an upgrade",
  );
  assert.ok(
    /packageDef\.category === "autos" &&\s*\n\s*!businessUpgradeInPlace &&/.test(route),
    "an upgrade must not flip a live listing back to pending_payment",
  );
});

check("the owner-facing upgrade buys the existing Full package and writes nothing", () => {
  const starter = codeOf("app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts");
  assert.ok(
    starter.includes("upgradeTargetPackageKey(category)"),
    "the package must be read from the category pairing, never chosen by the caller",
  );
  for (const pair of Object.values(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.ok(!starter.includes(pair.full), `${pair.full} must not be hardcoded in the upgrade starter`);
    assert.ok(!starter.includes(pair.simple), `${pair.simple} must not be hardcoded in the upgrade starter`);
  }
  // Identity survives because nothing on this path can touch the listing row.
  for (const forbidden of ["PATCH", "publish", "insert(", "update(", "status:", "slug"]) {
    assert.ok(
      !starter.includes(forbidden),
      `the upgrade must not ${forbidden} anything — it buys a package for an existing listing`,
    );
  }
  assert.ok(
    starter.includes("startRevenueCategoryCheckout("),
    "it must reuse the one existing Revenue OS checkout, not a parallel one",
  );
  assert.ok(
    starter.includes("confirmRecurringConsentInteractively("),
    "a subscription purchase must still collect recurring consent",
  );
});

check("all four categories have a real owner-facing upgrade entry point", () => {
  // Not a doc claim and not a "coming soon" stub: a live surface per category that calls the one
  // upgrade starter, gated by the package key the SERVER resolved for that row.
  const mounts: Array<[string, string]> = [
    ["servicios", "app/(site)/dashboard/servicios/page.tsx"],
    ["restaurantes", "app/(site)/dashboard/restaurantes/page.tsx"],
    ["autos", "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx"],
    ["bienes-raices", "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx"],
  ];
  for (const [category, file] of mounts) {
    assert.ok(exists(file), `${category}: ${file} must exist`);
    const src = read(file);
    assert.ok(
      src.includes("businessUpgradeOfferedForHeldPackageKey(") ||
        src.includes("BusinessSimpleToFullUpgradePanel"),
      `${category}: the CTA must be gated by the shared held-package rule`,
    );
    assert.ok(
      src.includes("redirectBusinessSimpleToFullUpgradeCheckout(") ||
        src.includes("BusinessSimpleToFullUpgradePanel"),
      `${category}: the CTA must call the one shared upgrade starter`,
    );
    assert.ok(
      src.includes("revenuePackageKey") || src.includes("heldPackageKey="),
      `${category}: eligibility must come from the server-resolved package key`,
    );
    assert.ok(
      !/coming soon|próximamente|proximamente/i.test(src),
      `${category}: no placeholder may stand in for a purchasable Full checkout`,
    );
  }

  // The shared panel decides eligibility itself; no prop can force the offer on.
  const panel = read("app/(site)/dashboard/components/BusinessSimpleToFullUpgradePanel.tsx");
  assert.ok(
    /if \(!upgradeToFullPackageKey[\s\S]{0,60}return null;/.test(panel),
    "the panel must render nothing when the row has no upgrade",
  );
  assert.ok(
    panel.includes("businessUpgradeOfferedForHeldPackageKey("),
    "the panel must use the same shared rule as every other surface",
  );
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

// 5. STAFF (ADMIN) UPGRADE ENTRY ---------------------------------------------------------------
check("admin Upgrade-to-Full entry exists, uses the pair map, and never inserts a listing", () => {
  const staff = codeOf("app/lib/sales/staffBusinessProduct.ts");
  assert.ok(staff.includes("staffUpgradeToFullHref"), "the staff upgrade href helper must exist");
  assert.ok(staff.includes("upgradeTargetPackageKey("), "the helper must resolve the key through upgradeTargetPackageKey");

  const entitlements = codeOf("app/admin/(dashboard)/workspace/package-entitlements/page.tsx");
  const strip = codeOf("app/admin/(dashboard)/businesses/[businessId]/PreparedListingsStrip.tsx");
  for (const [name, src] of [
    ["package-entitlements page", entitlements],
    ["PreparedListingsStrip", strip],
  ] as const) {
    assert.ok(src.includes("staffUpgradeToFullHref"), `${name} must link through staffUpgradeToFullHref`);
    assert.ok(src.includes("Upgrade to Full"), `${name} must show the Upgrade to Full action`);
    for (const pair of Object.values(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
      assert.ok(!src.includes(`"${pair.full}"`), `${name} must not hardcode ${pair.full}`);
    }
  }

  const manual = codeOf("app/lib/listingPlans/manualClearedPayments.ts");
  assert.ok(manual.includes("isBusinessBaseUpgradeInPlace("), "manual upgrade must require the listing to be Simple today");
  assert.ok(manual.includes("upgradeTargetPackageKey"), "manual upgrade must classify via the pair map");
  assert.ok(manual.includes("upgrade_requires_simple_listing"), "a non-Simple listing must be refused with a clear code");
  assert.ok(manual.includes("convergeQuickToFullAfterPayment"), "clearing an upgrade must run the existing convergence");
  // The only insert on this path is the payment record — an upgrade never creates a listing.
  const inserts = [...manual.matchAll(/\.from\("([a-z_]+)"\)\s*\.insert\(/g)].map((m) => m[1]);
  assert.deepEqual(inserts, ["leonix_payment_records"], "manual payments insert payment records only, never a listing");
});

console.log(failures === 0 ? "\nOK — upgrade contract proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
