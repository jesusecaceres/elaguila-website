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

const helperPath = "app/lib/listingPlans/categoryListingMonetization.ts";
const docsPath = "docs/category-listing-monetization-read-model.md";

assert(
  "categoryListingMonetization helper exists",
  fs.existsSync(path.join(root, helperPath)),
  "Expected read-only helper at app/lib/listingPlans/categoryListingMonetization.ts.",
);

const helper = read(helperPath);
const docs = read(docsPath);

const helperCodeOnly = helper
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "helper exports resolver",
  /export function resolveCategoryListingMonetization/.test(helper),
  "Helper must export resolveCategoryListingMonetization(input).",
);

assert(
  "helper exports summary type",
  /export type CategoryListingMonetizationSummary/.test(helper),
  "Helper must export the read-model summary type.",
);

assert(
  "helper does not use profile membership as listing truth",
  !/profiles\.membership_tier|membership_tier|membershipTier/.test(helperCodeOnly),
  "Helper must not import, read, or normalize profile membership fields.",
);

assert(
  "helper does not use business account tiers as category monetization",
  !/business_lite|business_premium/.test(helperCodeOnly),
  "Helper must not map account business tiers into category/listing monetization.",
);

assert(
  "legacy boost expiration is warning-only",
  /boost_expires/.test(helper) &&
    !/boost_expires[\s\S]{0,240}tool\("available"/.test(helper) &&
    !/boost_expires[\s\S]{0,240}status:\s*"available"/.test(helper),
  "Legacy boost_expires may be detected, but must not activate Boost / Impulsado.",
);

for (const category of [
  "servicios",
  "restaurantes",
  "autos",
  "bienes-raices",
  "rentas",
  "en-venta",
  "clases",
  "comunidad",
  "viajes",
  "empleos",
]) {
  assert(
    `category represented: ${category}`,
    helper.includes(`"${category}"`),
    `Missing category ${category} in the helper category set or resolver.`,
  );
}

for (const toolKey of [
  "republish",
  "moveToTop",
  "featured",
  "verified",
  "boost",
  "autoRefresh",
  "analytics",
  "leads",
  "concierge",
  "expirationRenewal",
]) {
  assert(
    `tool represented: ${toolKey}`,
    new RegExp(`\\b${toolKey}\\b`).test(helper),
    `Missing read-only tool key ${toolKey}.`,
  );
}

assert(
  "tool statuses are read-only",
  /"available"/.test(helper) &&
    /"locked"/.test(helper) &&
    /"unsupported"/.test(helper) &&
    /"unknown"/.test(helper) &&
    /"future"/.test(helper) &&
    !/fetch\(|\.from\(|\.insert\(|\.update\(|\.delete\(|stripe/i.test(helperCodeOnly),
  "Helper must only compute read-only states and must not call APIs, Supabase writes, or Stripe.",
);

assert(
  "docs state account metadata is not listing monetization truth",
  /account metadata is not listing monetization/i.test(docs) &&
    /profiles\.membership_tier/.test(docs) &&
    /profiles\.account_type/.test(docs),
  "Docs must explain account/profile metadata is not listing monetization truth.",
);

assert(
  "docs state missing Supabase fields are gaps",
  /Do not assume missing Supabase fields or tables exist/i.test(docs) &&
    /report it as a read-model warning or implementation gap first/i.test(docs),
  "Docs must require missing Supabase columns/tables to be treated as gaps, not assumptions.",
);

assert(
  "docs keep Stripe and promo codes out of Gate E",
  /Stripe, public pricing, promo codes, paid placement checkout, and notifications are intentionally out of scope/i.test(docs),
  "Docs must state Stripe/pricing/promo/notifications are out of scope for this gate.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
