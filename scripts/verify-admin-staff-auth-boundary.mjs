/**
 * Admin staff auth boundary verification.
 * Run: npm run verify:admin-staff-auth-boundary
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
  console.error(`verify-admin-staff-auth-boundary: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const seed = read("scripts/seed-owner-admin-auth.mjs");
const boundary = read("app/admin/_lib/adminAuthBoundary.ts");
const session = read("app/lib/supabase/adminSession.ts");
const layout = read("app/admin/(dashboard)/layout.tsx");
const loginAuth = read("app/admin/login/auth/route.ts");
const provisioning = read("app/admin/_lib/adminUserProvisioning.ts");
const teamActions = read("app/admin/teamProvisioningActions.ts");
const usersNew = read("app/admin/(dashboard)/team/users/new/page.tsx");
const browser = read("app/lib/supabase/browser.ts");
const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const packageJson = read("package.json");

if (!fs.existsSync(path.join(root, "scripts/seed-owner-admin-auth.mjs"))) {
  fail("seed script missing");
}
if (!seed.includes("OWNER_ADMIN_EMAIL")) fail("seed must read OWNER_ADMIN_EMAIL from env");
if (!seed.includes("OWNER_ADMIN_TEMP_PASSWORD")) fail("seed must read OWNER_ADMIN_TEMP_PASSWORD from env");
if (!seed.includes("SUPABASE_SERVICE_ROLE_KEY")) fail("seed must require service role key");
if (seed.includes("console.log") && /console\.log\([^)]*tempPassword/i.test(seed)) {
  fail("seed must not log password");
}
if (/^[^*\n]*OWNER_ADMIN_TEMP_PASSWORD\s*=\s*["'][^"']+["']/m.test(seed.replace(/^\/\*[\s\S]*?\*\//, "").replace(/\/\/.*$/gm, ""))) {
  fail("seed must not hardcode password");
}
ok("Emergency owner seed script");

if (!boundary.includes("resolveAdminDashboardAccessDenial")) fail("dashboard access denial helper missing");
if (!layout.includes("resolveAdminDashboardAccessDenial")) fail("dashboard layout must enforce roster boundary");
if (!loginAuth.includes("lookupActiveAdminRosterByEmail")) fail("admin login must require roster");
ok("Roster required for Supabase email admin login");

if (!session.includes("leonix_admin_bootstrap")) fail("bootstrap cookie separation missing");
if (!loginAuth.includes("bootstrap: false")) fail("email login must clear bootstrap session");
ok("Bootstrap vs Supabase session separation");

if (!provisioning.includes('"server-only"')) fail("provisioning must be server-only");
if (browser.includes("SERVICE_ROLE") || browser.includes("service_role")) {
  fail("service role must not appear in browser client");
}
if (provisioning.includes("console.log") && provisioning.match(/password/i)) {
  fail("provisioning must not log passwords");
}
ok("Service role server-only, no password logs");

if (!usersNew.includes("Create staff login")) fail("staff creator UI missing");
if (!teamActions.includes("requireSuperAdminStaffCreator")) fail("staff creator must be super-admin-only");
if (!provisioning.includes("auth.admin.createUser")) fail("staff creator must use auth.admin.createUser");
if (!provisioning.includes("admin_team_members")) fail("staff creator must upsert roster");
if (!provisioning.includes("temporaryPassword")) fail("temporary password flow missing");
if (!provisioning.includes("inviteUserByEmail")) fail("invite flow missing");
ok("Staff creator with Auth + roster + password/invite");

if (!gateRoot.includes("requireAdminCookie")) fail("website preview must require admin cookie");
ok("Website preview protected");

if (packageJson.includes("@leonixmedia.com") || usersNew.includes("@leonixmedia.com")) {
  fail("owner email must not be hardcoded in client/source");
}
ok("No email domain auto-admin / no hardcoded owner email");

if (!packageJson.includes("seed:owner-admin-auth")) fail("package.json missing seed script");
if (!packageJson.includes("verify:admin-staff-auth-boundary")) fail("package.json missing verify script");

console.log("\nverify-admin-staff-auth-boundary: PASS");
