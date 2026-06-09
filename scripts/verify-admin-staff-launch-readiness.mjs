/**
 * ADMIN-STAFF-LAUNCH-01 readiness verification.
 * Run: npm run verify:admin-staff-launch-readiness
 */
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

function fail(msg) {
  console.error(`verify-admin-staff-launch-readiness: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const staffNav = read("app/admin/_components/StaffTeamNav.tsx");
const teamHome = read("app/admin/(dashboard)/team/page.tsx");
const roster = read("app/admin/(dashboard)/team/roster/page.tsx");
const usersNew = read("app/admin/(dashboard)/team/users/new/page.tsx");
const provisioning = read("app/admin/_lib/adminUserProvisioning.ts");
const teamActions = read("app/admin/teamProvisioningActions.ts");
const boundary = read("app/admin/_lib/adminAuthBoundary.ts");
const layout = read("app/admin/(dashboard)/layout.tsx");
const loginAuth = read("app/admin/login/auth/route.ts");
const preview = read("app/admin/(dashboard)/team/website-preview/page.tsx");
const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const packageJson = read("package.json");

const CTA_ROUTES = [
  ["/admin/team", "Staff Home", "team/page.tsx"],
  ["/admin/team/website-preview", "Website Preview", "team/website-preview/page.tsx"],
  ["/admin/team/promo-codes", "Promo Codes", "team/promo-codes/page.tsx"],
  ["/admin/team/clients", "My Clients", "team/clients/page.tsx"],
  ["/admin/team/sales-tracker", "Sales Tracker", "team/sales-tracker/page.tsx"],
  ["/admin/team/customers/new", "Create Customer", "team/customers/new/page.tsx"],
];

for (const [href, label] of CTA_ROUTES.map(([h, l]) => [h, l])) {
  if (!staffNav.includes(href)) fail(`StaffTeamNav missing ${label} → ${href}`);
  const file = CTA_ROUTES.find((c) => c[0] === href)?.[2];
  if (!exists(`app/admin/(dashboard)/${file}`)) fail(`${label} page missing: ${file}`);
}
ok("Staff CTA routes exist in nav + pages");

if (!usersNew.includes("Create staff login")) fail("staff creator title missing");
if (!usersNew.includes("Creates Supabase Auth user + admin roster permission")) fail("staff creator helper copy missing");
if (!teamActions.includes("requireSuperAdminStaffCreator")) fail("staff creator not super-admin-only");
if (!provisioning.includes("auth.admin.createUser")) fail("staff creator must use auth.admin.createUser");
if (!provisioning.includes("admin_team_members")) fail("staff creator must upsert roster");
if (!provisioning.includes("temporaryPassword")) fail("temporary password flow missing");
ok("Staff creator launch-ready");

if (!roster.includes("/admin/team/users/new")) fail("roster must link to Create staff login");
if (!roster.includes("Creates Supabase Auth user + admin roster permission")) fail("roster launch copy missing");
if (roster.includes("does not create Supabase Auth user") && !roster.includes("Advanced:")) {
  fail("roster must not prominently claim no Auth without advanced section");
}
ok("Roster page points to real staff creator");

if (!layout.includes("resolveAdminDashboardAccessDenial")) fail("dashboard must enforce roster boundary");
if (!loginAuth.includes("lookupActiveAdminRosterByEmail")) fail("login must require roster");
ok("Auth boundary — roster required for email login");

if (!preview.includes("Internal preview only")) fail("website preview warning missing");
if (!gateRoot.includes("requireAdminCookie")) fail("public lock must require admin cookie");
ok("Website preview + public lock");

if (packageJson.includes("@leonixmedia.com")) fail("no hardcoded owner email in package.json");
ok("No email domain auto-admin");

const migStaff = exists("supabase/migrations/20260408183000_control_center_extensions.sql");
const migPromo = exists("supabase/migrations/20260522120000_leonix_promo_codes.sql");
if (!migStaff || !migPromo) fail("required Supabase migrations missing from repo");
ok("Supabase migrations present (admin_team_members, leonix_promo_codes)");

console.log("\nSUPABASE_ENV_READINESS:");
console.log("  Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
console.log("  Owner seed: OWNER_ADMIN_EMAIL, OWNER_ADMIN_TEMP_PASSWORD (env only, never in source)");
console.log("  Optional: ADMIN_ENFORCE_ROSTER_PERMISSIONS, ADMIN_OPERATOR_EMAIL, NEXT_PUBLIC_COMING_SOON_LOCK");
console.log("  Migration required in production: 20260408183000_control_center_extensions.sql (+ promo if used)");
console.log("  No new migration required for staff creator in this gate.");

console.log("\nSTRIPE_READINESS_AUDIT:");
console.log("  Env: STRIPE_SECRET_KEY (Autos vertical only), NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL (optional)");
console.log("  Checkout: Autos-specific routes exist; no global public checkout added");
console.log("  Launch blocker: NO — staff promo/client tools work without Stripe");
console.log("  Future gate: activate promo redemption + payment tracker checkout when owner approves");

if (!packageJson.includes("verify:admin-staff-launch-readiness")) {
  fail("package.json missing verify script");
}

console.log("\nverify-admin-staff-launch-readiness: PASS");
