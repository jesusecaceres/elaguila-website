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

const entitlementMigrations = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((f) => f.includes("listing_package_entitlements") && f.endsWith(".sql"));

const migrationGlob = entitlementMigrations.find((f) => f.includes("20260521120000")) ?? entitlementMigrations[0];
const optionalListingMigration = entitlementMigrations.find((f) =>
  /optional_listing_id|listing_id.*drop not null/i.test(f),
);

assert("base migration file exists", Boolean(migrationGlob), "Expected listing_package_entitlements base migration.");

const migration = migrationGlob ? read(`supabase/migrations/${migrationGlob}`) : "";
const optionalMigration = optionalListingMigration
  ? read(`supabase/migrations/${optionalListingMigration}`)
  : "";

for (const col of [
  "listing_package_entitlements",
  "package_tier",
  "category",
  "listing_source",
  "listing_id",
  "starts_at",
  "ends_at",
  "entitlement_code",
  "revoked_at",
  "benefits",
]) {
  assert(`migration includes ${col}`, migration.includes(col), `Column/table ${col} missing in migration.`);
}

assert("migration includes status", /status/.test(migration), "status column missing.");

assert(
  "FIX1 migration drops listing_id NOT NULL",
  /alter\s+column\s+listing_id\s+drop\s+not\s+null/i.test(optionalMigration),
  "Expected 20260521130000_listing_package_entitlements_optional_listing_id.sql.",
);

const adminPage = "app/admin/(dashboard)/workspace/package-entitlements/page.tsx";
const adminActions = "app/admin/(dashboard)/workspace/package-entitlements/actions.ts";
const dashboardPage = "app/admin/(dashboard)/page.tsx";
const nav = "app/admin/_components/AdminWorkspaceNav.tsx";

assert("admin page exists", exists(adminPage), adminPage);
assert("admin actions exist", exists(adminActions), adminActions);

const pageSrc = exists(adminPage) ? read(adminPage) : "";
const actionsSrc = exists(adminActions) ? read(adminActions) : "";
const dashSrc = exists(dashboardPage) ? read(dashboardPage) : "";
const navSrc = exists(nav) ? read(nav) : "";

assert(
  "admin page explains not coupon CMS",
  /cupones|coupon CMS|no es el CMS/i.test(pageSrc),
  "Page must clarify this is not public coupon CMS.",
);
assert("admin page has package tier field", /package_tier|PACKAGE_ENTITLEMENT_TIERS/.test(pageSrc), "Missing tier selector.");
assert("admin page has start/end dates", /starts_at/.test(pageSrc) && /ends_at/.test(pageSrc), "Missing contract dates.");
assert(
  "admin page has category/listing fields",
  /listing_source/.test(pageSrc) && /listing_id/.test(pageSrc) && /category/.test(pageSrc),
  "Missing listing attachment fields.",
);
assert(
  "admin page labels Listing ID optional",
  /Listing ID.*opcional|optional/i.test(pageSrc) && /attach after ad is created|antes de que exista/i.test(pageSrc),
  "Listing ID must be labeled optional with pre-ad helper text.",
);
assert(
  "admin page does not require Listing ID on create",
  /Listing ID \(opcional\)[\s\S]{0,600}?name="listing_id"/.test(pageSrc) &&
    !/Listing ID \(opcional\)[\s\S]{0,400}name="listing_id"[^>]*\brequired\b/i.test(pageSrc),
  "Create form listing_id must be optional; attach form may require ID.",
);
assert(
  "UI displays Pending or Unassigned listing",
  /Pending listing|Unassigned listing|formatEntitlementListingIdLine|formatEntitlementListingHeadline/.test(pageSrc),
  "Recent list must show pending/unassigned copy for null listing_id.",
);
assert("admin page create form", /createPackageEntitlementAction/.test(pageSrc), "Create form must call server action.");
assert("admin page revoke", /revokePackageEntitlementAction/.test(pageSrc), "Revoke action required.");
assert(
  "actions use packageEntitlements helper",
  /getPackageEntitlementBenefits|normalizePackageEntitlementTier/.test(actionsSrc),
  "Server action must snapshot benefits from helper.",
);
assert(
  "actions insert listing_package_entitlements",
  /\.from\("listing_package_entitlements"\)/.test(actionsSrc),
  "Must write to entitlement table.",
);
assert(
  "auto-generate entitlement code",
  /generateEntitlementCode|LX-ENT/.test(actionsSrc),
  "Must generate code when blank.",
);
assert(
  "server action accepts blank listing_id",
  /listingIdRaw[\s\S]*?listingId\s*=\s*listingIdRaw\s*\|\|\s*null/.test(actionsSrc) &&
    !/missing_listing[^_]|!\s*listingSource\s*\|\|\s*!listingId/.test(actionsSrc),
  "Blank listing_id should map to null on create; attach may require listingId.",
);
assert(
  "dashboard handles unassigned listing display",
  /formatEntitlementListingHeadline/.test(dashSrc),
  "Dashboard recent entitlements must use headline helper for null listing_id.",
);

assert(
  "dashboard links package entitlements",
  /package-entitlements/.test(dashSrc),
  "Admin dashboard must link to /admin/workspace/package-entitlements.",
);
assert(
  "dashboard removed tienda stat dominance",
  !/dashboard\.tiendaNewTitle/.test(dashSrc) && !/recentTiendaTitle/.test(dashSrc),
  "Tienda homepage cards should be replaced.",
);
assert(
  "dashboard shows entitlement metrics",
  /entitlementsHub|entSnap|recentEntitlements/.test(dashSrc),
  "Dashboard should surface entitlement cards.",
);

assert(
  "workspace nav link",
  /package-entitlements/.test(navSrc),
  "AdminWorkspaceNav should include package entitlements link.",
);

const appTree = read("package.json");
assert(
  "verify script registered",
  /verify:admin-package-entitlement-generator/.test(appTree),
  "Add verify:admin-package-entitlement-generator to package.json.",
);

const forbidden = [];
function scanDir(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${ent.name}`;
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      scanDir(rel, acc);
    } else if (/\.(tsx?|mjs)$/.test(ent.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

const gateFiles = [
  adminPage,
  adminActions,
  dashboardPage,
  nav,
  "app/admin/_lib/packageEntitlementData.ts",
  "app/admin/_lib/packageEntitlementConstants.ts",
  migrationGlob ? `supabase/migrations/${migrationGlob}` : "",
  optionalListingMigration ? `supabase/migrations/${optionalListingMigration}` : "",
].filter(Boolean);

for (const rel of scanDir("app/(site)")) {
  if (rel.includes("servicios") && /compareVisibilityRank|resolveListingVisibilityRank/.test(read(rel))) {
    forbidden.push(`public ranking change: ${rel}`);
  }
}

assert("no public servicios ranking wiring in site", forbidden.length === 0, forbidden.join("; ") || "none");

const stripeInGate = gateFiles.some((f) =>
  /from\s+["']stripe["']|@stripe\/|createCheckoutSession|stripe\.checkout\.sessions/.test(read(f)),
);
assert("no Stripe SDK/checkout in gate files", !stripeInGate, "Gate must not add Stripe checkout integration.");

const redemptionApi = exists("app/api")
  ? fs
      .readdirSync(path.join(root, "app/api"), { recursive: true })
      .filter((f) => String(f).includes("redeem") && String(f).includes("entitlement"))
  : [];
assert("no customer redemption endpoint", redemptionApi.length === 0, String(redemptionApi));

const modelDoc = exists("docs/package-entitlement-model.md") ? read("docs/package-entitlement-model.md") : "";
assert(
  "docs mention admin generator URL",
  /package-entitlements|G1\.6B/i.test(modelDoc),
  "Update package-entitlement-model.md for G1.6B.",
);
assert(
  "docs mention pre-ad entitlement flow",
  /listing_id.*optional|before.*(ad|listing)|Pending listing|attach/i.test(modelDoc),
  "Docs must explain pre-ad code flow and later attach.",
);

assert(
  "search/filter UI exists",
  /Buscar y filtrar|fetchPackageEntitlementsForTracker|method="get"/i.test(pageSrc),
  "Tracker search/filter section required.",
);
assert(
  "search supports code business customer category tier status",
  /name="q"/.test(pageSrc) &&
    /name="category"/.test(pageSrc) &&
    /name="tier"/.test(pageSrc) &&
    /name="status"/.test(pageSrc) &&
    /matchesEntitlementSearch|entitlement_code/i.test(read("app/admin/_lib/packageEntitlementData.ts")),
  "Search must cover key dimensions.",
);
assert(
  "sales rep id field exists",
  /name="sales_rep_id"/.test(pageSrc) && /metadata\.sales_rep_id|sales_rep_id:/.test(actionsSrc),
  "Sales rep ID in form and metadata.",
);
assert(
  "sales rep name field exists",
  /name="sales_rep_name"/.test(pageSrc) && /sales_rep_name/.test(actionsSrc),
  "Sales rep name in form and metadata.",
);
assert(
  "creator metadata or fallback",
  /creator_name|creator_role|creatorSnapshot/.test(actionsSrc) && /formatCreatorAttribution|Admin/.test(pageSrc),
  "Creator snapshot in actions and display.",
);
assert(
  "extend action exists",
  /extendPackageEntitlementAction/.test(actionsSrc) && /extendPackageEntitlementAction/.test(pageSrc),
  "Extend expiration server action and UI.",
);
assert(
  "attach listing action exists",
  /attachListingToPackageEntitlementAction/.test(actionsSrc) && /attachListingToPackageEntitlementAction/.test(pageSrc),
  "Attach listing ID action required.",
);
assert(
  "revoke remains soft delete",
  /status:\s*"revoked"/.test(actionsSrc) && !/\.delete\(/.test(actionsSrc),
  "Revoke sets status only.",
);
assert(
  "docs explain sales tracker direction",
  /tracker|search|sales rep|G1\.6C/i.test(modelDoc),
  "Docs must describe owner tracker.",
);
assert(
  "docs mention future sales rep dashboard",
  /sales rep dashboard|future.*sales/i.test(modelDoc),
  "Docs mention future sales rep dashboard.",
);
assert(
  "docs mention future commission after payment",
  /commission|payment clears|after payment/i.test(modelDoc),
  "Docs mention future commission tracking.",
);

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
