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

const migrationGlob = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .find((f) => f.includes("listing_package_entitlements") && f.endsWith(".sql"));

assert("migration file exists", Boolean(migrationGlob), "Expected supabase migration for listing_package_entitlements.");

const migration = migrationGlob ? read(`supabase/migrations/${migrationGlob}`) : "";

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

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
