import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const helperPath = "app/lib/listingPlans/packagePricingRules.ts";
const modelDocPath = "docs/pricing-promo-code-sales-model.md";
const entitlementDocPath = "docs/package-entitlement-model.md";
const policyPath = "docs/print-to-digital-visibility-policy.md";

assert(
  "packagePricingRules helper exists",
  fs.existsSync(path.join(root, helperPath)),
  `Expected ${helperPath}.`,
);

const helper = read(helperPath);
const modelDoc = fs.existsSync(path.join(root, modelDocPath)) ? read(modelDocPath) : "";
const entitlementDoc = read(entitlementDocPath);
const policy = read(policyPath);

const helperCodeOnly = helper
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "exports getPackageBasePriceCents",
  /export function getPackageBasePriceCents/.test(helper),
  "Must export getPackageBasePriceCents.",
);
assert(
  "exports getContractTermDiscount",
  /export function getContractTermDiscount/.test(helper),
  "Must export getContractTermDiscount.",
);
assert(
  "exports resolvePackagePricing",
  /export function resolvePackagePricing/.test(helper),
  "Must export resolvePackagePricing.",
);
assert(
  "exports resolvePromoCodeRule",
  /export function resolvePromoCodeRule/.test(helper),
  "Must export resolvePromoCodeRule.",
);
assert(
  "exports resolveSalesAttribution",
  /export function resolveSalesAttribution/.test(helper),
  "Must export resolveSalesAttribution.",
);
assert(
  "exports estimateCommission",
  /export function estimateCommission/.test(helper),
  "Must export estimateCommission.",
);
assert(
  "exports formatMoneyCents",
  /export function formatMoneyCents/.test(helper),
  "Must export formatMoneyCents.",
);

assert("premium base price 199900", /premium:\s*199[_ ]?900/.test(helper), "premium → 199900 cents.");
assert("full_page base price 119900", /full_page:\s*119[_ ]?900/.test(helper), "full_page → 119900 cents.");
assert("half_page base price 79900", /half_page:\s*79[_ ]?900/.test(helper), "half_page → 79900 cents.");
assert("quarter_page base price 49900", /quarter_page:\s*49[_ ]?900/.test(helper), "quarter_page → 49900 cents.");
assert("classified_print base price 39900", /classified_print:\s*39[_ ]?900/.test(helper), "classified_print → 39900 cents.");

assert("3_month 10% discount", /"3_month".*discountPercent:\s*10/s.test(helper) || /3_month.*10/.test(helper), "3_month → 10%.");
assert("6_month 15% discount", /"6_month".*discountPercent:\s*15/s.test(helper) || /6_month.*15/.test(helper), "6_month → 15%.");
assert("12_month 20% discount", /"12_month".*discountPercent:\s*20/s.test(helper) || /12_month.*20/.test(helper), "12_month → 20%.");
assert(
  "founding_partner 25% discount",
  /founding_partner.*discountPercent:\s*25/s.test(helper) || /founding_partner.*25/.test(helper),
  "founding_partner → 25%.",
);

assert("non-stackable promos", /nonStackable/.test(helper) && /non-stackable/i.test(helper + modelDoc), "Promos non-stackable.");
assert(
  "newsletter/SMS one-time concept",
  /newsletter/.test(helper) && /sms/.test(helper) && /oneTimeUse/.test(helper),
  "Newsletter/SMS rules in helper.",
);
assert(
  "docs mention newsletter/SMS later",
  /newsletter/i.test(modelDoc) && /sms/i.test(modelDoc),
  "Docs mention newsletter/SMS unique codes.",
);
assert(
  "sales rep attribution",
  /sales_rep/i.test(helper) && /sales rep/i.test(modelDoc + entitlementDoc),
  "Sales rep attribution represented.",
);
assert(
  "commission after payment clears",
  /payment clears|cleared payment|payment clears/i.test(modelDoc + helper),
  "Commission only after payment clears.",
);
assert(
  "Stripe Checkout future",
  /stripe checkout/i.test(modelDoc + policy + entitlementDoc),
  "Stripe Checkout documented as future.",
);
assert(
  "admin pricing calculator later",
  /pricing calculator|admin pricing/i.test(modelDoc),
  "Admin pricing calculator documented as later.",
);
assert(
  "no Stripe SDK",
  !/from ["']stripe|require\(["']stripe/.test(helperCodeOnly),
  "No Stripe SDK in pricing helper.",
);
assert(
  "no DB/fetch/API",
  !/\bfetch\s*\(/.test(helperCodeOnly) &&
    !/createClient|supabase|@supabase/.test(helperCodeOnly) &&
    !/prisma|drizzle/.test(helperCodeOnly),
  "No DB/fetch in pricing helper.",
);
assert(
  "no public redemption",
  !/public redemption|redeem.*checkout/i.test(helperCodeOnly),
  "No public redemption logic.",
);
assert(
  "no public sorting",
  !/sortOrder|publicSort|servicios.*rank/i.test(helperCodeOnly),
  "No Servicios ranking/sorting.",
);
assert(
  "no Admin UI wiring",
  !/admin\/|use client|from ["']react/.test(helperCodeOnly),
  "No Admin UI in pricing helper.",
);

assert(
  "pricing model doc exists",
  fs.existsSync(path.join(root, modelDocPath)),
  `Expected ${modelDocPath}.`,
);
assert(
  "docs mention non-stackable",
  /non-stackable|non stackable/i.test(modelDoc),
  "Docs explain non-stackable codes.",
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✓ ${c.name}` : `✗ ${c.name}: ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
