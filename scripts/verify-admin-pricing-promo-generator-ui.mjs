import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const adminPage = "app/admin/(dashboard)/workspace/package-entitlements/page.tsx";
const adminActions = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const preview = "app/admin/(dashboard)/workspace/package-entitlements/PackageEntitlementSalesPreview.tsx";
const metadataBuilder = "app/admin/_lib/buildEntitlementPricingMetadata.ts";
const constants = "app/admin/_lib/packageEntitlementConstants.ts";
const dataLib = "app/admin/_lib/packageEntitlementData.ts";
const pricingDoc = "docs/pricing-promo-code-sales-model.md";
const entitlementDoc = "docs/package-entitlement-model.md";
const smokeDoc = "docs/admin-workspace-smoke-test.md";
const packageJson = read("package.json");

assert("admin page exists", exists(adminPage), adminPage);
assert("preview component exists", exists(preview), preview);
assert("metadata builder exists", exists(metadataBuilder), metadataBuilder);

const pageSrc = read(adminPage);
const actionsSrc = read(adminActions);
const previewSrc = read(preview);
const builderSrc = read(metadataBuilder);
const constantsSrc = read(constants);
const dataSrc = read(dataLib);
const pricingDocSrc = read(pricingDoc);
const entitlementDocSrc = read(entitlementDoc);
const smokeDocSrc = read(smokeDoc);

const gateSrc = [pageSrc, actionsSrc, previewSrc, builderSrc].join("\n");
const gateCodeOnly = gateSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

assert(
  "page uses packagePricingRules via builder",
  /packagePricingRules|buildEntitlementPricingMetadata/.test(pageSrc + previewSrc + builderSrc),
  "Must use pricing model helpers.",
);
assert(
  "contract term field",
  /name="contract_term"/.test(pageSrc) && /PACKAGE_ENTITLEMENT_CONTRACT_TERMS/.test(pageSrc + constantsSrc),
  "Contract term selector required.",
);
assert(
  "promo code type field",
  /name="promo_code_type"/.test(pageSrc) && /PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES/.test(pageSrc + constantsSrc),
  "Promo/code type selector required.",
);
assert("pricing preview labels", /Base monthly|Final monthly|Estimated contract total/i.test(previewSrc), "Pricing preview UI.");
assert(
  "promo behavior preview labels",
  /Non-stackable|One-time use|Owner approval|Can create entitlement/i.test(previewSrc),
  "Promo preview UI.",
);
assert(
  "sales attribution preview labels",
  /Sales rep ID|Sales rep name|Commission rule key/i.test(previewSrc),
  "Sales attribution preview UI.",
);
assert(
  "commission preview labels",
  /Future commission preview|payment clears|Commission eligible/i.test(previewSrc),
  "Commission preview UI.",
);
assert(
  "create stores pricing metadata",
  /pricing:\s*pricingSnapshot\.pricing|pricingSnapshot\.pricing/.test(actionsSrc),
  "pricing snapshot in metadata.",
);
assert(
  "create stores promo_rule metadata",
  /promo_rule:\s*pricingSnapshot\.promo_rule|promo_rule/.test(actionsSrc),
  "promo_rule in metadata.",
);
assert(
  "create stores sales_attribution metadata",
  /sales_attribution:\s*pricingSnapshot\.sales_attribution|sales_attribution/.test(actionsSrc),
  "sales_attribution in metadata.",
);
assert(
  "create stores commission_preview metadata",
  /commission_preview:\s*pricingSnapshot\.commission_preview|commission_preview/.test(actionsSrc),
  "commission_preview in metadata.",
);
assert(
  "recent list shows pricing metadata",
  /formatEntitlementPricingPromoLine|entitlementPricingBadges|formatEntitlementCommissionPreviewLine/.test(
    pageSrc + dataSrc,
  ),
  "Tracker displays pricing/promo summary.",
);
assert(
  "existing create action remains",
  /createPackageEntitlementAction/.test(pageSrc) && /revokePackageEntitlementAction/.test(pageSrc),
  "Create/revoke still wired.",
);
assert(
  "extend and attach remain",
  /extendPackageEntitlementAction/.test(pageSrc) && /attachListingToPackageEntitlementAction/.test(pageSrc),
  "Extend/attach still wired.",
);
assert(
  "listing id optional",
  /listing_id.*opcional|Optional — attach/i.test(pageSrc),
  "Listing ID remains optional.",
);
assert(
  "docs mention admin pricing preview",
  /G1\.6E|pricing preview|vista previa.*precio/i.test(pricingDocSrc + entitlementDocSrc + smokeDocSrc),
  "Docs updated for G1.6E.",
);
assert(
  "docs mention non-stackable",
  /non-stackable/i.test(pricingDocSrc + entitlementDocSrc),
  "Non-stackable documented.",
);
assert(
  "docs mention stripe future",
  /stripe checkout/i.test(pricingDocSrc + smokeDocSrc),
  "Stripe future documented.",
);
assert(
  "docs mention commission after payment clears",
  /payment clears|cleared payment/i.test(pricingDocSrc + smokeDocSrc),
  "Commission timing documented.",
);
assert(
  "verify script registered",
  /verify:admin-pricing-promo-generator-ui/.test(packageJson),
  "package.json script missing.",
);
assert("no Stripe SDK", !/from ["']stripe|require\(["']stripe/.test(gateCodeOnly), "No Stripe in gate files.");
assert(
  "no pricing migration",
  !fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => /pricing_table|commission_payout/i.test(f)),
  "No new pricing/commission tables.",
);
assert("no public redemption", !/public redemption|customer checkout/i.test(gateCodeOnly), "No public redemption.");
assert("no public sorting", !/sortOrder|servicios.*rank|publicSort/i.test(gateCodeOnly), "No public sorting.");
assert("no sales rep dashboard", !/sales-rep-dashboard|sales_rep_dashboard/i.test(gateCodeOnly), "No rep dashboard.");

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `OK: ${c.name}` : `FAIL: ${c.name} — ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
