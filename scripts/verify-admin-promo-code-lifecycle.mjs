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

const migrationFiles = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((f) => f.includes("leonix_promo_codes") && f.endsWith(".sql"));

const migrationFile = migrationFiles[0];
assert("promo migration exists", Boolean(migrationFile), "Expected leonix_promo_codes migration.");
const migration = migrationFile ? read(`supabase/migrations/${migrationFile}`) : "";

for (const col of [
  "leonix_promo_codes",
  "code",
  "code_type",
  "status",
  "non_stackable",
  "one_time_use",
  "starts_at",
  "ends_at",
  "max_redemptions",
  "redemption_count",
  "package_entitlement_id",
  "sales_rep_id",
  "sales_rep_name",
  "customer_email",
  "customer_phone",
  "metadata",
]) {
  assert(`migration includes ${col}`, migration.includes(col), `Missing ${col} in migration.`);
}

const adminPage = "app/admin/(dashboard)/workspace/promo-codes/page.tsx";
const adminActions = "app/admin/(dashboard)/workspace/promo-codes/actions.ts";
const preview = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeLifecyclePreview.tsx";
const lifecycle = "app/lib/listingPlans/promoCodeLifecycle.ts";
const promoData = "app/admin/_lib/promoCodeData.ts";
const entitlementActions = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const docsLifecycle = "docs/promo-code-lifecycle-model.md";
const docsPricing = "docs/pricing-promo-code-sales-model.md";
const docsEntitlement = "docs/package-entitlement-model.md";

assert("admin promo page exists", exists(adminPage), adminPage);
assert("admin promo actions exist", exists(adminActions), adminActions);
assert("lifecycle helper exists", exists(lifecycle), lifecycle);
assert("promo data lib exists", exists(promoData), promoData);

const pageSrc = read(adminPage);
const actionsSrc = read(adminActions);
const previewSrc = exists(preview) ? read(preview) : "";
const lifecycleSrc = read(lifecycle);
const entitlementActionsSrc = read(entitlementActions);
const docsLifecycleSrc = read(docsLifecycle);
const docsPricingSrc = read(docsPricing);
const docsEntitlementSrc = read(docsEntitlement);

assert(
  "page says not public Cupones CMS",
  /not the public Cupones CMS|no es el CMS público de cupones|no es el CMS de cupones/i.test(pageSrc),
  "Helper must distinguish from Cupones CMS.",
);
assert("page has create form", /createPromoCodeAction/.test(pageSrc) && /name="code"/.test(pageSrc), "Create form.");
assert("page has list", /Recent codes|recent/i.test(pageSrc) && /rows\.map/.test(pageSrc), "List UI.");
assert("page has revoke", /revokePromoCodeAction/.test(pageSrc), "Revoke action.");
assert(
  "page has search/filter",
  /method="get"/.test(pageSrc) && /name="q"/.test(pageSrc) && /name="code_type"/.test(pageSrc) && /name="status"/.test(pageSrc),
  "Search/filter controls.",
);
assert(
  "page uses lifecycle or packagePricingRules",
  /promoCodeLifecycle|buildPromoCodeRulePreview|packagePricingRules|resolvePromoCodeRule/.test(
    pageSrc + previewSrc + lifecycleSrc,
  ),
  "Must use lifecycle or pricing rules.",
);
assert("preview component exists", exists(preview), preview);
assert(
  "preview shows rule flags",
  /nonStackable|non-stackable|Can discount|Can create package entitlement|Subscriber identity/i.test(previewSrc + pageSrc),
  "Promo behavior preview.",
);

assert(
  "package entitlement integration",
  /upsertPromoCodeFromPackageEntitlement/.test(entitlementActionsSrc),
  "Entitlement create should link promo row.",
);

assert(
  "docs promo vs entitlement",
  /promo code vs package entitlement|Promo code vs package entitlement/i.test(docsLifecycleSrc + docsEntitlementSrc),
  "Docs distinguish concepts.",
);
assert(
  "docs public redemption later",
  /public redemption.*later|redemption.*later|G1\.6G/i.test(docsLifecycleSrc + docsPricingSrc),
  "Docs mention public redemption later.",
);
assert(
  "docs Stripe later",
  /Stripe Checkout.*later|Stripe.*later/i.test(docsLifecycleSrc + docsPricingSrc),
  "Docs mention Stripe later.",
);
assert(
  "docs commission later",
  /commission payout.*later|payout.*later/i.test(docsLifecycleSrc + docsPricingSrc),
  "Docs mention commission later.",
);

const appDirs = ["app/(site)", "app/api"];
let publicRedemption = false;
for (const dir of appDirs) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/redeem.*promo|promo.*redeem|public.*redemption/i.test(ent.name)) publicRedemption = true;
    }
  };
  walk(full);
}
assert("no public redemption route file", !publicRedemption, "No public redemption endpoint files.");

const gateCodeOnly = [
  adminPage,
  adminActions,
  preview,
  lifecycle,
  promoData,
  entitlementActions,
  "app/admin/_lib/promoCodeConstants.ts",
  "app/admin/(dashboard)/page.tsx",
  "app/admin/_components/AdminWorkspaceNav.tsx",
]
  .filter((f) => exists(f))
  .map((f) => read(f))
  .join("\n");

assert("no Stripe SDK in gate files", !/from ['"]stripe['"]|@stripe\//i.test(gateCodeOnly), "No Stripe import.");
assert(
  "no commission payout table migration",
  !fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => /commission_payout/i.test(f)),
  "No commission payout table.",
);
assert(
  "no Servicios ranking in gate",
  !/resolveListingVisibilityRank/.test(gateCodeOnly),
  "No Servicios ranking wiring.",
);

const pkg = read("package.json");
assert(
  "package.json script",
  /verify:admin-promo-code-lifecycle/.test(pkg),
  "Missing verify:admin-promo-code-lifecycle script.",
);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify-admin-promo-code-lifecycle FAILED:\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`verify-admin-promo-code-lifecycle OK (${checks.length} checks)`);
