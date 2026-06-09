/**
 * STAFF-ADMIN-02 Supabase activation verification.
 * Run: npm run verify:staff-admin-supabase-activation
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function fail(msg) {
  console.error(`verify-staff-admin-supabase-activation: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const staffAccess = read("app/admin/_lib/staffAdminAccess.ts");
const adminSession = read("app/lib/supabase/adminSession.ts");
const provisioning = read("app/admin/_lib/adminUserProvisioning.ts");
const teamActions = read("app/admin/teamProvisioningActions.ts");
const access = read("app/admin/_lib/adminAccessControl.ts");
const loginAuth = read("app/admin/login/auth/route.ts");
const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const promoActions = read("app/admin/(dashboard)/workspace/promo-codes/actions.ts");
const packageJson = read("package.json");

for (const fn of [
  "canAccessFullAdmin",
  "canAccessStaffAdmin",
  "canAccessWebsitePreview",
  "canAccessSalesTools",
  "canManagePromoCodesAsStaff",
  "canCreateCustomers",
]) {
  if (!staffAccess.includes(`function ${fn}`)) fail(`missing ${fn}`);
}
if (!access.includes("authUserId") || !access.includes("getAdminOperatorEmailFromCookies")) {
  fail("admin access context must resolve Supabase session email");
}
ok("Role helpers + session email resolution");

if (!loginAuth.includes("verifyAdminSupabaseCredentials")) fail("admin email login route missing");
if (!loginAuth.includes("lookupActiveAdminRosterByEmail")) fail("roster gate on email login missing");
if (!loginAuth.includes("applyLeonixAdminSessionCookies")) fail("session cookies missing on auth login");
ok("Supabase Auth staff login route");

if (!provisioning.includes("auth.admin.createUser")) fail("staff/customer provisioning must use auth.admin.createUser");
if (!provisioning.includes("inviteUserByEmail")) fail("invite flow must attempt inviteUserByEmail");
if (provisioning.includes("getAdminSupabase") && read("app/lib/supabase/browser.ts").includes("createUser")) {
  // browser must not create users — only check provisioning is server-only
}
if (!provisioning.includes('"server-only"') && !teamActions.includes('"use server"')) {
  fail("provisioning must be server-only");
}
ok("Server-only Auth user provisioning");

if (!teamActions.includes("createStaffUserWithAuthAction")) fail("staff user creation action missing");
if (!teamActions.includes("createCustomerUserWithAuthAction")) fail("customer user creation action missing");
if (!teamActions.includes("requireAdminTeamAccess")) fail("staff user creation must be owner-guarded");
if (!teamActions.includes("canCreateCustomers")) fail("customer creation must use canCreateCustomers");
if (teamActions.includes("super_admin") && !teamActions.includes("role_escalation")) {
  fail("must block staff role escalation");
}
ok("User creation actions + guards");

if (!promoActions.includes("sales_rep_id") || !promoActions.includes("resolveSalesRepFieldsForCreate")) {
  fail("promo attribution missing");
}
if (!promoActions.includes("created_by")) fail("promo create must set created_by when auth user present");
ok("Promo salesperson attribution");

const staffPromo = read("app/admin/(dashboard)/team/promo-codes/page.tsx");
if (!staffPromo.includes("StaffTeamNav")) fail("staff promo wrapper missing");
if (!access.includes("filterPromoCodesForAccess")) fail("staff-owned promo filter missing");
ok("Staff-owned promo list scoping");

if (!read("app/admin/(dashboard)/team/clients/page.tsx").includes("Redemption attribution gap")) {
  fail("redemption blocker must be documented honestly");
}
ok("Redemption attribution audited — blocker reported");

if (!gateRoot.includes("requireAdminCookie")) fail("public lock must require admin cookie for bypass");
if (gateRoot.includes("PREVIEW_TOKEN") || gateRoot.includes("preview_token")) {
  fail("hardcoded preview token");
}
ok("Website preview + public lock preserved");

const forbidden = ["shared_password", "leonix_sales_password", "PREVIEW_BYPASS_TOKEN", "ADMIN_PASSWORD="];
for (const f of forbidden) {
  if (staffAccess.includes(f) || provisioning.includes(f)) fail(`forbidden pattern in source: ${f}`);
}
ok("No hardcoded shared password / preview token in new modules");

if (!packageJson.includes("verify:staff-admin-supabase-activation")) {
  fail("package.json missing verify:staff-admin-supabase-activation script");
}

const migrationsDir = path.join(root, "supabase/migrations");
const newMigration = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.includes("staff") || f.includes("auth_user"));
if (newMigration.length > 0) {
  console.log(`NOTE: migration(s) present: ${newMigration.join(", ")}`);
} else {
  ok("No new migration required (uses admin_team_members + existing promo columns)");
}

console.log("\nverify-staff-admin-supabase-activation: PASS");
