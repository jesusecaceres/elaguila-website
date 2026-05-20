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

const helperPath = "app/lib/listingPlans/packageEntitlements.ts";
const modelDocPath = "docs/package-entitlement-model.md";
const policyPath = "docs/print-to-digital-visibility-policy.md";
const readModelPath = "docs/category-listing-monetization-read-model.md";

assert(
  "packageEntitlements helper exists",
  fs.existsSync(path.join(root, helperPath)),
  `Expected ${helperPath}.`,
);

const helper = read(helperPath);
const modelDoc = read(modelDocPath);
const policy = read(policyPath);
const readModel = read(readModelPath);

const helperCodeOnly = helper
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "exports resolvePackageEntitlement",
  /export function resolvePackageEntitlement/.test(helper),
  "Must export resolvePackageEntitlement(input).",
);
assert(
  "exports getPackageEntitlementBenefits",
  /export function getPackageEntitlementBenefits/.test(helper),
  "Must export getPackageEntitlementBenefits(tier).",
);
assert(
  "exports isPackageEntitlementActive",
  /export function isPackageEntitlementActive/.test(helper),
  "Must export isPackageEntitlementActive(input).",
);
assert(
  "exports normalizePackageEntitlementTier",
  /export function normalizePackageEntitlementTier/.test(helper),
  "Must export normalizePackageEntitlementTier(value).",
);

for (const tier of [
  "premium",
  "full_page",
  "half_page",
  "quarter_page",
  "classified_print",
  "digital_only",
]) {
  assert(`tier represented: ${tier}`, helper.includes(`"${tier}"`), `Package tier ${tier} must be defined.`);
}

const halfPageBlock = /case "half_page":[\s\S]*?case "quarter_page"/;

assert(
  "premium includes destacados_module",
  /case "premium"[\s\S]*destacados_module:\s*true/.test(helper),
  "Premium must grant Destacados module benefit.",
);
assert(
  "premium does not force results priority",
  /case "premium":[\s\S]*?eligibleForResultsPriority:\s*false/.test(helper),
  "Premium must not grant results_priority by default.",
);
assert(
  "full_page includes results_priority",
  /case "full_page"[\s\S]*results_priority:\s*true/.test(helper),
  "Full-page must grant results priority.",
);
assert(
  "half_page includes classified_listing",
  /case "half_page"[\s\S]*classified_listing:\s*true/.test(helper),
  "Half-page must include classified listing access.",
);
assert(
  "half_page includes republish_access",
  /case "half_page"[\s\S]*republish_access:\s*true/.test(helper),
  "Half-page must include Republish access.",
);
assert(
  "half_page includes boost_access",
  /case "half_page"[\s\S]*boost_access:\s*true/.test(helper),
  "Half-page must include Boost access.",
);
assert(
  "half_page does not include full-page results priority",
  halfPageBlock.test(helper) && !/case "half_page"[\s\S]*results_priority:\s*true/.test(helper),
  "Half-page must not grant full-page results priority.",
);

for (const cat of ["servicios", "restaurantes", "autos", "bienes-raices", "rentas"]) {
  assert(`V1 category: ${cat}`, helper.includes(`"${cat}"`), `${cat} must appear in V1 scope.`);
}

assert(
  "En Venta marked separate",
  /en-venta/.test(helper) && /separate_model/.test(helper) && /Free\/Pro/i.test(helper),
  "En Venta must be separate_model with Free/Pro warning.",
);
assert(
  "Clases/Comunidad deferred",
  /clases/.test(helper) && /comunidad/.test(helper) && /deferred/.test(helper),
  "Clases and Comunidad must be deferred.",
);
assert(
  "Empleos/Viajes separate",
  /empleos/.test(helper) && /viajes/.test(helper) && /separate_model/.test(helper),
  "Empleos and Viajes must be separate from V1 entitlements.",
);

assert(
  "no membership_tier",
  !/profiles\.membership_tier|membership_tier|membershipTier/.test(helperCodeOnly),
  "Entitlement model must not use account membership.",
);
assert(
  "no business_lite/business_premium",
  !/business_lite|business_premium/.test(helperCodeOnly),
  "Entitlement model must not use business account tiers.",
);
const readTierBody = helper.match(/function readTierFromListing[\s\S]*?^}/m)?.[0] ?? "";
const normalizeTierBody = helper.match(/export function normalizePackageEntitlementTier[\s\S]*?^}/m)?.[0] ?? "";
assert(
  "no Stripe/payment as entitlement truth",
  !/stripe|payment_status/.test(readTierBody) &&
    !/stripe|payment_status/.test(normalizeTierBody) &&
    /must not be used as package entitlement truth/.test(helper),
  "Stripe/payment fields may be warned on the row but must not drive tier resolution.",
);

assert(
  "model doc explains promo code vs entitlement",
  /Promo code/i.test(modelDoc) && /Package entitlement/i.test(modelDoc),
  "package-entitlement-model.md must distinguish promo code vs entitlement.",
);
assert(
  "model doc documents Admin generator G1.6B",
  /package-entitlements|G1\.6B/i.test(modelDoc),
  "Docs must document Admin generator at /admin/workspace/package-entitlements.",
);
assert(
  "model doc says no schema in Gate G1.6A",
  /G1\.6A/i.test(modelDoc) && /no migration|Not included|no schema/i.test(modelDoc),
  "Docs must state Gate G1.6A has no DB/schema.",
);
assert(
  "policy links entitlement model",
  /package-entitlement-model|G1\.6A|package entitlement/i.test(policy),
  "Print-to-digital policy should reference entitlement model.",
);
assert(
  "read model links entitlement model",
  /package-entitlement-model|packageEntitlements|G1\.6A/i.test(readModel),
  "Read model doc should reference Gate G1.6A.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
