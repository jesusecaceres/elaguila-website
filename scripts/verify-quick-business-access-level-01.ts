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
  businessPackageKeyForPlan,
  businessPlanFromParam,
  withQuickPlanParam,
} from "../app/lib/listingPlans/businessQuickPlanSignal";
import {
  AUTOS_DEALER_BASE_INCLUDED_VEHICLES,
  AUTOS_DEALER_QUICK_INCLUDED_VEHICLES,
  BR_QUICK_INCLUDED_PROPERTIES,
} from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  getRevenuePackageDefinition,
  REVENUE_V1_PACKAGE_MATRIX,
} from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  computeRevenueCheckoutSubtotalCents,
  validateRevenueCheckoutAddOns,
} from "../app/lib/listingPlans/revenueCheckout";
import {
  decideCategoryListingPlan,
  type EntitlementRowFacts,
} from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import { getLaneMediaRecords, type LaneMediaRecord } from "../app/lib/media/listingMediaConfigs";
import type { CanonicalCategoryKey } from "../app/lib/listingIdentity/types";
import { QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { QUICK_BUSINESS_DEFINITIONS } from "../app/lib/quickBusiness/quickBusinessRegistry";
import type { QuickBusinessCategoryKey } from "../app/lib/quickBusiness/quickBusinessTypes";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
/** Executable code only: a rule stated in a comment must not satisfy a search for its violation. */
// LF-normalised so the source-shape regexes below also hold on a CRLF (Windows autocrlf) checkout.
const codeOf = (p: string): string =>
  read(p).replace(/\r\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

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
check("each Quick package is a $249/mo subscription granting SIMPLE and no capabilities", () => {
  for (const key of QUICK_KEYS) {
    const def = getRevenuePackageDefinition(key);
    assert.ok(def, `${key} must exist in the pricing matrix`);
    assert.equal(def!.priceCents, 24900, `${key} price`);
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

check("Comida Local keeps its own $129 product and stays out of the split", () => {
  // Gate 7 deferral. Repository truth locks ONE Comida Local product and contains no owner
  // decision for a cheaper Simple tier; `/publicar/comida-local/rapido` is a shorter intake
  // form onto that same SKU, not a second commercial tier. Pulling it into the split would be a
  // new commercial decision, so this asserts the deferral rather than implementing one.
  const def = getRevenuePackageDefinition("comida_local_base_monthly");
  assert.ok(def, "the Comida Local package must still exist");
  assert.equal(def!.priceCents, 12900, "Comida Local stays $129/mo");
  assert.equal(def!.businessAccessLevel, undefined, "Comida Local declares no access level");
  assert.ok(!isBusinessAccessCategory("comida-local"), "Comida Local is not a split category");
  assert.equal(businessAccessLevelForPackageKey("comida_local_base_monthly"), "none");
  assert.deepEqual(
    REVENUE_V1_PACKAGE_MATRIX.filter((p) => p.category === "comida-local").map((p) => p.packageKey),
    ["comida_local_base_monthly"],
    "no second Comida Local SKU may be invented by this mission",
  );
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
  // The ONE authorized migration (owner lock 2026-09-24) REPLACES the Autos dealer capacity function so the
  // database authority agrees with BASE = 5 / PRO = 10 / pack = 20. It creates no table or column, so it adds no
  // parallel product, no second listing table and no new access-model storage.
  assert.deepEqual(
    changed.filter((f) => f.startsWith("supabase/migrations/") && !f.endsWith("20260924190000_autos_dealer_base_capacity_authority.sql")),
    [],
    "the access level is derived from existing columns and needs no migration",
  );
});

check("the $249 amount is written once, in the pricing matrix", () => {
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
      // 24900 is the Quick Business price; anywhere else a literal 24900 next to a price word is a scattered price.
      if (/(priceCents|price_cents|unitAmount|unit_amount|amountCents)\s*[:=]\s*24900\b/.test(src)) {
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

// 6. STAFF TRUTH ----------------------------------------------------------------------------
check("the entitlement tracker shows staff every commercial fact about a row", () => {
  const page = read("app/admin/(dashboard)/workspace/package-entitlements/page.tsx");
  const required: Record<string, RegExp> = {
    business: /formatEntitlementListingHeadline\(row\)/,
    category: /\{row\.category\}/,
    "commercial package SKU": /SKU: \{row\.package_key\}/,
    "business access level": /describeBusinessAccessRow\(/,
    "print package tier": /\{row\.package_tier\}/,
    "start and end": /fmt\(row\.starts_at\)[\s\S]{0,40}fmt\(row\.ends_at\)/,
    status: /\{effective\}/,
    customer: /Customer: \{row\.customer_name/,
    "sales attribution": /Sales rep: \{salesRep\}/,
  };
  for (const [fact, re] of Object.entries(required)) {
    assert.ok(re.test(page), `staff must be able to read the ${fact} of an entitlement row`);
  }
});

/**
 * Reading a fact off one row and being able to FIND the rows are different capabilities. The tier
 * filter cannot separate Quick from Full — a Quick row and a Full row are both `digital_only` —
 * so the package key has to be searchable or "show me every Quick customer" is unanswerable.
 */
check("staff can search the tracker for the commercial product itself", () => {
  // `packageEntitlementData.ts` is `server-only`, so this is asserted against its source rather
  // than by calling the matcher. The shape being pinned is the whole mechanism: one haystack of
  // row fields, joined and lowercased, matched by substring.
  const data = codeOf("app/admin/_lib/packageEntitlementData.ts");
  const haystack = data.match(/const hay = \[([\s\S]*?)\]\s*\n\s*\.filter\(Boolean\)/);
  assert.ok(haystack, "the tracker search must still build one haystack of row fields");
  assert.ok(
    /row\.package_key,/.test(haystack![1]!),
    "the package key must be searchable — the tier filter cannot separate Quick from Full",
  );
  // The pre-existing searchable fields must still be there. This is an addition, not a swap.
  for (const field of ["row.entitlement_code", "row.business_name", "row.customer_name", "row.listing_id"]) {
    assert.ok(haystack![1]!.includes(field), `${field} must remain searchable`);
  }
  assert.ok(
    /\.join\(" "\)\s*\n?\s*\.toLowerCase\(\);[\s\S]{0,80}hay\.includes\(needle\)/.test(data),
    "matching must stay a case-insensitive substring search over that haystack",
  );
  // And the page must tell staff the SKU is the field that separates them.
  const page = read("app/admin/(dashboard)/workspace/package-entitlements/page.tsx");
  assert.ok(/package SKU/.test(page), "the search help must name the SKU as searchable");
  assert.ok(
    /Quick from Full/.test(page),
    "the search help must say the SKU is what separates Quick from Full",
  );
});

check("the access badge is derived, never a stored account-wide tier", () => {
  const page = read("app/admin/(dashboard)/workspace/package-entitlements/page.tsx");
  // Admin must not relabel these rows with the old account-level Free/Pro vocabulary, which
  // describes a user, not a purchased package, and would misreport a Quick or print bundle.
  for (const misleading of ["accountTier", "account_tier", "Free/Pro", "isPro"]) {
    assert.ok(!page.includes(misleading), `the tracker must not read ${misleading}`);
  }
  const src = read("app/lib/listingPlans/businessAccessLevel.ts");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const symbol of ["supabase", "process.env", '.from("']) {
    assert.ok(!code.includes(symbol), `the badge resolver must stay pure (${symbol})`);
  }
});

// 7. SIMPLE MEDIA CONTRACT --------------------------------------------------------------------
// Quick Business: real photos only, no video; the photo cap is CATEGORY-AWARE (owner 2026-09-24, one table in quickBusinessMediaSemantics.ts).
// This supersedes the previous doctrine that Quick restated the canonical lane cap. The Full lane
// retains its own unchanged limits. Drift in either direction is caught here and in
// verify-quick-business-core-01.ts (which checks the registry source literal).
check("the Simple media contract enforces the category-aware cap, no video", () => {
  for (const key of QUICK_KEYS.filter((k) => k.endsWith("quick_monthly"))) {
    // Map package key back to category key — the registry is keyed by category.
    const categoryKey = (
      key === "servicios_quick_monthly" ? "servicios"
      : key === "restaurantes_quick_monthly" ? "restaurantes"
      : key === "autos_dealer_quick_monthly" ? "autos-dealer"
      : "bienes-negocio"
    ) as QuickBusinessCategoryKey;
    const contract = QUICK_BUSINESS_DEFINITIONS[categoryKey].media;
    assert.equal(contract.minImages, 1, `${categoryKey}: every Quick ad needs one real photo`);
    assert.equal(contract.maxImages, QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[categoryKey], `${categoryKey}: Quick Business max images come from the one cap table`);
    assert.equal(contract.videoOptional, false, `${categoryKey}: Quick Business includes no video (Bible §11.1)`);
    // The cap must be stated to the customer in both languages.
    assert.ok(
      contract.note.es.includes(String(contract.maxImages)) && contract.note.en.includes(String(contract.maxImages)),
      `${categoryKey}: the media note must state the photo cap in both languages`,
    );
  }
});

check("Simple never buys a larger inventory allowance than Full", () => {
  for (const category of Object.keys(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[category];
    const simple = getRevenuePackageDefinition(pair.simple);
    const full = getRevenuePackageDefinition(pair.full);
    assert.ok(simple && full, `${category}: both levels must exist`);
    // Inventory is the real "smaller product" lever and it is a package entitlement, unlike media
    // count. Simple must never carry an inventory add-on, which is what would silently hand a
    // Quick dealer the Full allowance.
    assert.ok(!simple.addOnInventory, `${category}: Simple must not carry an inventory add-on`);
  }
});

check("checkout refuses to sell a Simple customer any Full add-on", () => {
  // The declaration above says Simple carries no add-on inventory; this proves the checkout
  // agrees. The allowlist is keyed to the FULL base package key, so a Quick base key matches no
  // entry and every add-on is refused. Adding a Quick key to CHECKOUT_ADDON_ALLOWLIST would hand
  // a $99 dealer the Full inventory pack, which is exactly the accidental upgrade this locks out.
  const addOnKeys = REVENUE_V1_PACKAGE_MATRIX
    .filter((p) => /inventory_pack|offers_addon/.test(p.packageKey))
    .map((p) => p.packageKey);
  assert.ok(addOnKeys.length > 0, "the matrix must still define add-on packages to test against");

  for (const category of Object.keys(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    const simpleKey = BUSINESS_CATEGORY_PACKAGE_PAIR[category].simple;
    const simple = getRevenuePackageDefinition(simpleKey);
    assert.ok(simple, `${simpleKey} must exist`);
    for (const addOn of addOnKeys) {
      const result = validateRevenueCheckoutAddOns({
        category: simple.category,
        basePackageKey: simpleKey,
        addOns: [{ key: addOn }],
      });
      assert.equal(
        result.ok,
        false,
        `${simpleKey} must not be sellable with ${addOn}: Simple would inherit a Full allowance`,
      );
    }
  }
});

check("the price a Simple customer is charged comes from the server matrix", () => {
  // The checkout subtotal is computed from the package definition, never from a request field.
  for (const category of Object.keys(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    const simpleKey = BUSINESS_CATEGORY_PACKAGE_PAIR[category].simple;
    const simple = getRevenuePackageDefinition(simpleKey)!;
    assert.equal(
      computeRevenueCheckoutSubtotalCents(simple, []),
      24900,
      `${simpleKey} must check out at the matrix price`,
    );
  }
  // No request-shaped amount field is read anywhere in checkout resolution.
  const checkout = codeOf("app/lib/listingPlans/revenueCheckout.ts");
  assert.ok(
    !/\binput\.(amountCents|priceCents|unitAmount)\b/.test(checkout),
    "checkout must never read a caller-supplied amount",
  );
});

// 8. CLOSURE ARTIFACT ------------------------------------------------------------------------
check("the final proof matrix covers every required feature with no repair outstanding", () => {
  const doc = read("docs/quick-commercial/LEONIX_QUICK_SIMPLE_VS_FULL_FINAL_PROOF_MATRIX.md");
  const required = [
    "PUBLIC LISTING", "CONTACT CTA CALL", "CONTACT CTA SMS", "CONTACT CTA WHATSAPP",
    "CONTACT CTA EMAIL", "WEBSITE", "DIRECTIONS", "IMAGE ALLOWANCE", "VIDEO", "EDIT", "PAUSE",
    "REACTIVATE", "END/CANCEL", "RENEW", "HELP", "UPGRADE", "BUSINESS HUB", "ANALYTICS", "LEADS",
    "BUSINESS TOOLS", "BUSINESS CONCIERGE", "COUPONS/OFFERS", "INVENTORY", "ADVANCED MEDIA",
    "REPUBLISH", "BOOST", "AUTO REFRESH", "PRINT BADGE", "PRINT PRIORITY", "DESTACADOS",
  ];
  const rows = doc.split(/\r?\n/).filter((l) => l.startsWith("| ") && l.includes(" | "));
  for (const feature of required) {
    assert.ok(
      rows.some((r) => r.startsWith(`| ${feature} |`)),
      `the proof matrix must carry a row for ${feature}`,
    );
  }
  // Only the legend and the §4 narrative may name the failure statuses; no row may carry one.
  for (const row of rows) {
    const status = row.split("|").at(-2)?.trim() ?? "";
    assert.ok(
      !/^REPAIR_REQUIRED\b/.test(status) && !/^BLOCKED\b/.test(status),
      `no feature may close as ${status}: ${row.slice(0, 60)}`,
    );
  }
  // §1 records what each level IS. The closeout records that the product OPERATES: a customer can
  // buy, publish and upgrade; staff can find them; and nothing outside the split moved. A matrix
  // that lost one of these would read as complete while leaving an operational area unproven.
  for (const heading of [
    "Publish pipeline",
    "Simple media",
    "Simple → Full upgrade",
    "Admin / staff commercial truth",
    "Quick Classifieds and the remaining families",
    "Security / authority",
  ]) {
    assert.ok(doc.includes(`### 7.`) && doc.includes(heading), `the closeout must cover ${heading}`);
  }
  assert.ok(
    /REPAIR_REQUIRED = 0/.test(doc) && /BLOCKED\s+= 0/.test(doc),
    "the matrix must still close with no repair and no blocker outstanding",
  );
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// The purchase circuit. Declaring a $99 package proves nothing if no flow sells it: before this
// was closed, Quick intake handed off to the shared preview, the preview checked out the FULL
// key, and a Quick payment would have been skipped by the webhook as "wrong package", leaving a
// paying customer unpublished. These checks pin each link.
// ───────────────────────────────────────────────────────────────────────────────────────────────

const QUICK_ADAPTERS: Record<QuickBusinessCategoryKey, string> = {
  servicios: "app/(site)/publicar/negocio-rapido/_adapters/serviciosQuickBusinessAdapter.ts",
  restaurantes: "app/(site)/publicar/negocio-rapido/_adapters/restaurantesQuickBusinessAdapter.ts",
  "autos-dealer": "app/(site)/publicar/negocio-rapido/_adapters/autosDealerQuickBusinessAdapter.ts",
  "bienes-negocio": "app/(site)/publicar/negocio-rapido/_adapters/bienesNegocioQuickBusinessAdapter.ts",
};

/** The one checkout-building file per category that must choose between the two base packages. */
const QUICK_CHECKOUT_SITES: Record<QuickBusinessCategoryKey, { file: string; quickConst: string; fullConst: string }> = {
  servicios: {
    file: "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
    quickConst: "SERVICIOS_QUICK_CHECKOUT",
    fullConst: "SERVICIOS_BASE_CHECKOUT",
  },
  restaurantes: {
    file: "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
    quickConst: "RESTAURANTES_QUICK_CHECKOUT",
    fullConst: "RESTAURANTES_BASE_CHECKOUT",
  },
  "autos-dealer": {
    file: "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    quickConst: "AUTOS_DEALER_QUICK_CHECKOUT",
    fullConst: "AUTOS_DEALER_CHECKOUT",
  },
  "bienes-negocio": {
    file: "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    quickConst: "BIENES_RAICES_NEGOCIO_QUICK_CHECKOUT",
    fullConst: "BIENES_RAICES_NEGOCIO_CHECKOUT",
  },
};

check("every Quick intake hands off carrying the Quick plan marker", () => {
  for (const [key, file] of Object.entries(QUICK_ADAPTERS) as [QuickBusinessCategoryKey, string][]) {
    const src = codeOf(file);
    assert.ok(
      src.includes("withQuickPlanParam("),
      `${key}: the handoff must stamp the Quick plan marker, or the preview sells the Full package`,
    );
    const handoffAt = src.indexOf("handoff:");
    const markerAt = src.indexOf("withQuickPlanParam(");
    assert.ok(handoffAt > -1 && markerAt > -1, `${key}: both the handoff and the marker must be present`);
  }
});

check("every business preview reads the marker and sells the matching package", () => {
  for (const [key, site] of Object.entries(QUICK_CHECKOUT_SITES) as [QuickBusinessCategoryKey, (typeof QUICK_CHECKOUT_SITES)[QuickBusinessCategoryKey]][]) {
    const src = codeOf(site.file);
    // The plan is read from the preview's own URL either directly or through the shared
    // `useIsQuickBusinessPlan` hook (URL marker + the staff custody plan), which reads it the same way.
    assert.ok(
      src.includes("businessPlanFromSearchParams(") || src.includes("useIsQuickBusinessPlan("),
      `${key}: the preview must read the plan from its own URL`,
    );
    assert.ok(src.includes(site.quickConst), `${key}: the preview must be able to select ${site.quickConst}`);
    assert.ok(src.includes(site.fullConst), `${key}: the preview must still select ${site.fullConst} by default`);
    // The Quick constant may only be reached through a plan decision, never unconditionally.
    // Two decisions are accepted: the plain ternary on the URL marker, and
    // `selectBusinessBaseCheckout`, which is the same decision plus the server's override for a
    // listing that already exists. Nothing else may name the Quick constant at a call site.
    const byMarker = new RegExp(`quickPlan[\\s\\S]{0,80}${site.quickConst}`).test(src);
    const byResolver = new RegExp(
      `selectBusinessBaseCheckout\\(\\{[\\s\\S]{0,120}quick:\\s*${site.quickConst}`,
    ).test(src);
    assert.ok(
      byMarker || byResolver,
      `${key}: ${site.quickConst} must be chosen by the plan decision, not hardcoded`,
    );
  }
});

/**
 * The marker is a property of the HANDOFF URL, so it is only evidence for a listing that does not
 * exist yet. A Quick customer who abandons Stripe comes back from the dashboard through
 * `?listingId=…` with no marker at all — and a preview that still trusts the marker there would
 * offer that customer the FULL package for the listing they already started, billing $399 for a
 * $99 purchase. Any preview that can run a base checkout against an existing row must therefore
 * ask the server which package that row should be sold.
 */
check("a preview that can check out an existing listing asks the server which package to sell", () => {
  const listingBoundCheckout: QuickBusinessCategoryKey[] = ["servicios", "restaurantes", "autos-dealer"];
  for (const key of listingBoundCheckout) {
    const src = codeOf(QUICK_CHECKOUT_SITES[key].file);
    assert.ok(
      src.includes("useBusinessBasePlanOffer("),
      `${key}: a listing-bound checkout must read the server's base-plan offer, not the URL marker`,
    );
    assert.ok(
      /selectBusinessBaseCheckout\(\{[\s\S]{0,400}serverSellPackageKey:/.test(src),
      `${key}: the server's answer must be the input that overrides the marker`,
    );
  }
  // Bienes is the exception BY CONSTRUCTION, not by omission: its checkpoint is suppressed
  // outright for a listing-bound preview, so no existing row can be re-priced there at all.
  const bienes = codeOf(QUICK_CHECKOUT_SITES["bienes-negocio"].file);
  assert.ok(
    /listingBoundPreview\)\s*return null;/.test(bienes),
    "bienes-negocio: the listing-bound preview must keep suppressing its checkout entirely",
  );
});

/** The server side of that answer: owner-verified, ledger-derived, and never client-supplied. */
check("the base-plan offer is resolved from owner-verified server state", () => {
  const offer = codeOf("app/lib/listingPlans/businessBasePlanOffer.ts");
  assert.ok(
    offer.includes("isBusinessListingOwnedBy("),
    "the resolver must verify the caller owns the listing before answering",
  );
  assert.ok(
    /const owned = await isBusinessListingOwnedBy[\s\S]{0,160}if \(!owned\) return NOTHING_TO_SELL/.test(offer),
    "an unverified owner must get no offer at all, not a defaulted one",
  );
  assert.ok(
    offer.includes("resolveBusinessAccess("),
    "the held level must come from the shared entitlement resolver, never a local re-derivation",
  );
  assert.ok(
    offer.includes("upgradeTargetPackageKey(category)"),
    "the upgrade target must be read from the single category/package pairing",
  );
  // No price is ever decided here, and no literal package key is ever written.
  assert.ok(!/priceCents|39900|9900/.test(offer), "the resolver must not carry a price");
  for (const pair of Object.values(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.ok(!offer.includes(`"${pair.simple}"`), `${pair.simple} must not be hardcoded in the resolver`);
    assert.ok(!offer.includes(`"${pair.full}"`), `${pair.full} must not be hardcoded in the resolver`);
  }

  const route = codeOf("app/api/revenue-os/business-base-plan/route.ts");
  assert.ok(route.includes("getBearerUserId(request)"), "the offer route must authenticate the caller");
  assert.ok(
    /if \(!ownerUserId\)[\s\S]{0,120}401/.test(route),
    "an unauthenticated caller must be refused, not answered",
  );
  assert.ok(
    !/POST|PATCH|PUT|DELETE|update\(|insert\(|upsert\(/.test(route),
    "the offer route must be read-only",
  );
  assert.ok(
    route.includes("getRevenuePackageDefinition(offer.sellPackageKey)?.priceCents"),
    "the displayed price must come from the same server matrix the checkout charges from",
  );
});

check("anything other than the exact Quick token checks out as Full", () => {
  for (const raw of [null, undefined, "", "full", "quick!", "QUICKX", "simple", "99"]) {
    assert.equal(
      businessPlanFromParam(raw),
      "full",
      `"${String(raw)}" must not be read as a Quick purchase`,
    );
  }
  // Only the exact token, case-insensitively and trimmed, buys Quick.
  for (const raw of ["quick", "QUICK", " Quick "]) {
    assert.equal(businessPlanFromParam(raw), "quick", `"${raw}" must select the Quick package`);
  }
  for (const category of Object.keys(BUSINESS_CATEGORY_PACKAGE_PAIR)) {
    assert.equal(businessPackageKeyForPlan(category, "quick"), BUSINESS_CATEGORY_PACKAGE_PAIR[category].simple);
    assert.equal(businessPackageKeyForPlan(category, "full"), BUSINESS_CATEGORY_PACKAGE_PAIR[category].full);
  }
  // The marker never replaces an existing query value the canonical preview depends on.
  const href = withQuickPlanParam("/clasificados/publicar/servicios/preview?lang=en");
  assert.ok(href.includes("lang=en") && href.includes("plan=quick"), `marker must preserve existing query: ${href}`);
});

check("a paid Quick purchase publishes through the same webhook as Full", () => {
  const activators: Array<[string, string]> = [
    ["app/lib/listingPlans/revenueServiciosFulfillment.ts", "servicios"],
    ["app/lib/listingPlans/revenueRestaurantFulfillment.ts", "restaurantes"],
    ["app/lib/listingPlans/revenueAutosDealerFulfillment.ts", "autos"],
    ["app/lib/listingPlans/revenueBienesNegocioFulfillment.ts", "bienes-raices"],
  ];
  for (const [file, category] of activators) {
    const src = codeOf(file);
    assert.ok(
      src.includes(`isBusinessBasePackageKey("${category}"`),
      `${file}: activation must accept EITHER base key, or a paid Quick listing never publishes`,
    );
    // An exact compare against the Full key next to the skip is exactly the defect being fixed.
    assert.ok(
      !/packageKey !== [A-Z_]*BASE[A-Z_]*_PACKAGE_KEY|packageKey !== AUTOS_DEALER_MONTHLY_PACKAGE_KEY/.test(src),
      `${file}: no exact Full-key compare may gate activation`,
    );
  }
  const router = codeOf("app/lib/listingPlans/revenueFulfillment.ts");
  for (const category of ["servicios", "restaurantes", "bienes-raices"]) {
    assert.ok(
      router.includes(`isBusinessBasePackageKey("${category}"`),
      `the webhook router must route a Quick ${category} payment to its activator`,
    );
  }
});

check("a live Quick row is a real plan, and Full wins when a customer holds both", () => {
  const row = (packageKey: string, id: string): EntitlementRowFacts => ({
    id,
    packageKey,
    grantSource: "stripe_webhook",
    packageTier: "digital_only",
    status: "active",
    startsAt: null,
    endsAt: null,
  });
  const nowMs = Date.now();

  for (const category of ["servicios", "restaurantes"]) {
    const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[category];

    const quickOnly = decideCategoryListingPlan({ category, rows: [row(pair.simple, "q")], nowMs });
    assert.equal(quickOnly.status, "active", `${category}: a paid Quick row must not resolve to "none"`);
    assert.equal(quickOnly.packageKey, pair.simple, `${category}: the plan must name the Quick package honestly`);
    assert.deepEqual(
      quickOnly.capabilities,
      [],
      `${category}: Quick must confer no Full capability — it must never inherit the Full package's`,
    );

    const fullOnly = decideCategoryListingPlan({ category, rows: [row(pair.full, "f")], nowMs });
    assert.equal(fullOnly.packageKey, pair.full, `${category}: Full must be unchanged`);
    assert.ok(fullOnly.capabilities.includes("coupons_offers"), `${category}: Full must keep coupons_offers`);

    // The upgrade window: the Full subscription is paid before the Quick one is cancelled.
    const both = decideCategoryListingPlan({ category, rows: [row(pair.simple, "q"), row(pair.full, "f")], nowMs });
    assert.equal(both.packageKey, pair.full, `${category}: holding both must resolve to Full, never to Quick`);
    assert.ok(both.capabilities.includes("coupons_offers"), `${category}: an upgrade must not read as a downgrade`);
  }
});

check("the Quick inventory allowance stated at checkout matches the package sold", () => {
  // The checkout line item tells the customer how many vehicles/properties they get. That number
  // must come from the package actually being sold, not from the Full allowance next to it.
  const cases: Array<[string, number]> = [
    ["autos_dealer_quick_monthly", AUTOS_DEALER_QUICK_INCLUDED_VEHICLES],
    ["br_agent_quick_monthly", BR_QUICK_INCLUDED_PROPERTIES],
  ];
  for (const [key, stated] of cases) {
    const def = getRevenuePackageDefinition(key);
    assert.ok(def, `${key} must exist`);
    const declared = Number((def.includedInventory ?? "").match(/\d+/)?.[0] ?? NaN);
    assert.equal(declared, stated, `${key}: checkout states ${stated} but the package includes "${def.includedInventory}"`);
    assert.ok(stated < AUTOS_DEALER_BASE_INCLUDED_VEHICLES, `${key}: Simple must stay smaller than Full`);
  }
  // Quick never offers the inventory pack at all, in either inventory category.
  const autos = codeOf("app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts");
  assert.ok(
    /quickPlan\s*\n?\s*\?\s*\[\]/.test(autos),
    "the Quick dealer checkout must offer no inventory add-on row at all",
  );
  const bienes = codeOf(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  );
  assert.ok(
    /!quickPlan && bundleCreatedCount > 0/.test(bienes),
    "the Quick agent checkout must never attach the property inventory pack",
  );
  assert.ok(
    /quickPlan \? 0 :/.test(bienes),
    "the Quick agent checkout must never carry child inventory into the payload",
  );
});

check("the Quick photo is a real photo of the thing being sold", () => {
  // The Media Lock above proves one photo is REQUIRED. This proves the required photo is the
  // customer's own upload landing on the canonical vehicle/property, with nothing synthesised.
  const autos = codeOf(QUICK_ADAPTERS["autos-dealer"]);
  // Videos are filtered out first (Quick has no video), so only the customer's photo entries map 1:1.
  assert.ok(
    /mediaImages:\s*MediaImageEntry\[\]\s*=\s*(?:galleryMediaOnly\()?media\)?\.map\(/.test(autos),
    "dealer photos map 1:1 from the customer's upload",
  );
  assert.ok(autos.includes("mediaImages,") && autos.includes("heroImages:"), "the photo must land on the vehicle itself");
  assert.ok(/additionalInventoryVehicles:\s*\[\]/.test(autos), "Quick publishes the first real vehicle only");

  const bienes = codeOf(QUICK_ADAPTERS["bienes-negocio"]);
  assert.ok(/fotosDataUrls:\s*(?:galleryMediaOnly\()?media\)?\.map\(/.test(bienes), "property photos map 1:1 from the customer's upload");

  for (const [key, file] of Object.entries(QUICK_ADAPTERS) as [QuickBusinessCategoryKey, string][]) {
    const src = codeOf(file);
    // Image sources only — `placeholder:` on a text field is intake copy, not a photo.
    assert.ok(
      !/(unsplash\.com|picsum\.photos|placehold\.co|via\.placeholder|data:image\/svg)/i.test(src),
      `${key}: no generated or stock image may stand in for the customer's required photo`,
    );
    assert.ok(
      !/(dataUrl|url|src):\s*["'`]\s*\//.test(src),
      `${key}: no built-in asset path may be written into media`,
    );
  }
});

// ───────────────────────────────────────────────────────────────────────────────────────────────
// 9. AUTHORITY. Every question the Simple/Full split introduced is a question about who decides:
// which package is sold, which level is held, whose listing it is. If any of those can be
// asserted by the caller, the cheaper package becomes a way to buy the expensive product.
// ───────────────────────────────────────────────────────────────────────────────────────────────

/** Every module added or rewired by the Simple-vs-Full split. */
const ACCESS_MODEL_FILES = [
  "app/lib/listingPlans/businessAccessLevel.ts",
  "app/lib/listingPlans/businessBasePlanOfferPolicy.ts",
  "app/lib/listingPlans/businessBasePlanOffer.ts",
  "app/lib/listingPlans/businessBasePlanOfferClient.ts",
  "app/lib/listingPlans/businessQuickPlanSignal.ts",
  "app/lib/listingPlans/fullOnlyFeatureGate.ts",
  "app/api/revenue-os/business-base-plan/route.ts",
  "app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts",
  "app/(site)/dashboard/components/BusinessSimpleToFullUpgradePanel.tsx",
] as const;

check("nothing in the access model writes a row, mints an actor or reads a secret", () => {
  for (const file of ACCESS_MODEL_FILES) {
    const src = codeOf(file);
    assert.ok(
      !/\.insert\(|\.upsert\(|\.update\(|\.delete\(/.test(src),
      `${file}: the access model resolves entitlement, it must never write one`,
    );
    assert.ok(
      !/method:\s*["'`](POST|PUT|PATCH|DELETE)/.test(src),
      `${file}: no mutating request may originate here`,
    );
    assert.ok(
      !/process\.env|service_role|SERVICE_ROLE/.test(src),
      `${file}: no secret or service-role key may be referenced`,
    );
    assert.ok(
      !/is_admin|isAdmin|impersonat|actingAs|asCustomer/.test(src),
      `${file}: no staff-as-customer or synthetic actor may appear`,
    );
  }
});

check("the base-plan route answers only the authenticated owner, and only by reading", () => {
  const src = codeOf("app/api/revenue-os/business-base-plan/route.ts");
  assert.ok(/export async function GET\(/.test(src), "it must be a read endpoint");
  for (const verb of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.ok(!src.includes(`export async function ${verb}(`), `it must expose no ${verb} handler`);
  }
  assert.ok(
    /getBearerUserId\(request\)[\s\S]{0,200}status:\s*401/.test(src),
    "an unauthenticated caller must be refused, not answered",
  );
  assert.ok(
    /resolveBusinessBasePlanOffer\(\{[\s\S]{0,140}ownerUserId\s*\}/.test(src),
    "the offer must be scoped to the bearer-resolved owner",
  );
  assert.ok(
    !/ownerUserId\s*=\s*(params|searchParams|body)/.test(src),
    "the owner must never come from the query string",
  );
  // The price it returns is for rendering; it must be the same matrix the checkout charges from.
  assert.ok(
    /getRevenuePackageDefinition\(offer\.sellPackageKey\)\?\.priceCents/.test(src),
    "any price returned must be read from the server matrix, never accepted or computed",
  );
});

check("the offer resolver fails closed: no ownership proof, no offer", () => {
  const src = codeOf("app/lib/listingPlans/businessBasePlanOffer.ts");
  assert.ok(
    /const owned = await isBusinessListingOwnedBy\([\s\S]{0,140}if \(!owned\) return NOTHING_TO_SELL/.test(src),
    "ownership must be verified before any offer is produced, and failure must offer nothing",
  );
  // Every read is wrapped so an unreadable table yields "no offer", never an unguarded offer.
  const catches = src.match(/catch\s*\{[\s\S]*?\n  \}/g) ?? [];
  assert.ok(catches.length >= 3, "each Supabase read must have its own catch");
  for (const block of catches) {
    assert.ok(
      /return (false|null);/.test(block),
      `an unreadable state must resolve to "no offer", not fall through: ${block.replace(/\s+/g, " ")}`,
    );
  }
  assert.ok(
    /select\(`id, \$\{source\.ownerColumn\}`\)[\s\S]{0,200}owner\.trim\(\) === ownerUserId/.test(src),
    "ownership must be an exact match against the listing's own owner column",
  );
  // The decision itself is pure, so it cannot smuggle a read or a write in behind the rule.
  const policy = codeOf("app/lib/listingPlans/businessBasePlanOfferPolicy.ts");
  for (const symbol of ["supabase", "fetch(", "process.env", '.from("']) {
    assert.ok(!policy.includes(symbol), `the offer decision must stay pure (${symbol})`);
  }
});

check("the browser sends identity, package and price to no one", () => {
  const hook = codeOf("app/lib/listingPlans/businessBasePlanOfferClient.ts");
  assert.ok(/Authorization: `Bearer \$\{token\}`/.test(hook), "the hook must present the user's own token");
  assert.ok(!/method:\s*["'`]/.test(hook), "the hook must issue a plain GET");
  for (const forbidden of ["ownerUserId", "accessLevel=", "priceCents="]) {
    assert.ok(!hook.includes(forbidden), `the hook must not send ${forbidden}`);
  }

  // The upgrade starter chooses nothing: not the package, not the price, not the entitlement.
  // Read the argument it actually hands the checkout, so an import path cannot read as a field.
  const starter = codeOf("app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts");
  const sent = starter.match(/startRevenueCategoryCheckout\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";
  assert.ok(sent.length > 0, "the upgrade starter's checkout call must be found");
  for (const forbidden of ["ownerUserId", "accessLevel", "priceCents", "amountCents", "entitlement"]) {
    assert.ok(!sent.includes(forbidden), `the upgrade starter must not send ${forbidden}`);
  }
  assert.ok(
    /packageKey,\n/.test(sent) && /const packageKey = upgradeTargetPackageKey\(category\);/.test(starter),
    "the package it sends must be the one the category pairing resolved, not a caller's choice",
  );

  // And the one checkout body builder every business flow uses carries no such field either.
  const payload = codeOf("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
  const body = payload.match(/export function buildRevenueCategoryCheckoutBody\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(body.length > 0, "the checkout body builder must be found");
  for (const forbidden of [
    "priceCents",
    "amountCents",
    "unitAmount",
    "ownerUserId",
    "accessLevel",
    "businessAccessLevel",
    "entitlement",
  ]) {
    assert.ok(!body.includes(forbidden), `the checkout body must not carry ${forbidden}`);
  }
});

check("only the eight base packages can grant business access — no add-on, no classified", () => {
  const granting = REVENUE_V1_PACKAGE_MATRIX.filter((p) => p.businessAccessLevel);
  const expected: string[] = [...QUICK_KEYS, ...FULL_KEYS].slice().sort();
  assert.deepEqual(
    granting.map((p) => p.packageKey).sort(),
    expected,
    "exactly the four Simple and four Full packages may declare an access level",
  );
  // Stated the other way round, against the resolver rather than the data: any other package —
  // an add-on, an inventory pack, a placement, a classified listing — resolves to `none`.
  for (const def of REVENUE_V1_PACKAGE_MATRIX) {
    if (expected.includes(def.packageKey)) continue;
    assert.equal(
      businessAccessLevelForPackageKey(def.packageKey),
      "none",
      `${def.packageKey} must confer no business access`,
    );
  }
  for (const junk of ["", "   ", "not_a_package", "SERVICIOS_QUICK_MONTHLY; drop"]) {
    assert.equal(businessAccessLevelForPackageKey(junk), "none", `"${junk}" must confer nothing`);
  }
});

check("a print row grants print access only — it cannot carry a capability across", () => {
  // Package C stamps the category's Full package key onto print-tier grants for bookkeeping. If
  // the resolver took the max of tier and key, a $499 quarter-page advertiser would silently hold
  // the $399 Full digital product. The tier must win, and the stamped key must not leak through.
  const quarterWithFullStamp = decideBusinessAccess({
    rows: [row({ packageKey: "servicios_base_monthly", packageTier: "quarter_page" })],
    nowMs: NOW,
  });
  assert.equal(quarterWithFullStamp.level, "simple", "quarter page includes SIMPLE, stamp or no stamp");
  assert.equal(quarterWithFullStamp.packageKey, null, "the bookkeeping stamp must not be reported as a purchase");

  // And the capability dimension stays disjoint: FULL never invents a per-package capability.
  const fullCaps = capabilitiesForBusinessAccessLevel("full") as string[];
  assert.ok(!fullCaps.includes("coupons_offers"), "coupons_offers stays a per-package grant, not an access level");
});

check("Full-only features are refused on the server, and the refusal is narrow", () => {
  const gate = codeOf("app/lib/listingPlans/fullOnlyFeatureGate.ts");
  assert.ok(gate.includes('import "server-only"'), "the gate must be unusable from the browser");
  assert.ok(
    /if \(level !== "simple"\) return \{ \.\.\.open, level \};/.test(gate),
    "only a resolved SIMPLE may be denied — an unreadable state must never strip existing access",
  );
  assert.ok(
    /catch \{[\s\S]{0,140}return open;/.test(gate),
    "a failed entitlement read must not deny a customer who already had the feature",
  );
  assert.ok(
    !/req|request|body|searchParams/.test(gate),
    "the gate must derive the level from the listing, never from the request",
  );
  // A Simple customer hitting the Full-only route directly is refused by that route, not by CSS.
  const analytics = codeOf("app/api/dashboard/analytics/listing/route.ts");
  assert.ok(
    /resolveFullOnlyFeatureGate\(\{[\s\S]{0,260}capability: "analytics"/.test(analytics),
    "the private analytics route must call the gate",
  );
  assert.ok(
    /\.denied[\s\S]{0,200}fullOnlyFeatureDeniedBody\(/.test(analytics),
    "and must answer with the shared refusal body when denied",
  );
});

console.log(failures === 0 ? "\nOK — business access level proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
