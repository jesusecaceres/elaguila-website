/**
 * STAFF-ADMIN-01 static verification.
 * Run: npm run verify:staff-admin-sales-access
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
  console.error(`verify-staff-admin-sales-access: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const staffHome = read("app/admin/(dashboard)/team/page.tsx");
const preview = read("app/admin/(dashboard)/team/website-preview/page.tsx");
const access = read("app/admin/_lib/adminAccessControl.ts");
const staffAccess = read("app/admin/_lib/staffAdminAccess.ts");
const gateRoot = read("app/components/ComingSoonGateRoot.tsx");
const dashLayout = read("app/admin/(dashboard)/layout.tsx");
const promoActions = read("app/admin/(dashboard)/workspace/promo-codes/actions.ts");
const roster = read("app/admin/(dashboard)/team/roster/page.tsx");

if (!staffHome.includes("Staff workspace")) fail("staff home missing");
if (!preview.includes("Internal preview only")) fail("website preview missing warning");
if (!preview.includes("STAFF_PREVIEW_LINKS")) fail("preview must use STAFF_PREVIEW_LINKS");
ok("Staff home + website preview routes");

if (!access.includes("isSalesRepRole") || !staffAccess.includes("isStaffSalesAllowedAdminPath")) {
  fail("role guards missing");
}
if (!dashLayout.includes("isStaffSalesAllowedAdminPath")) fail("dashboard layout must guard sales rep paths");
ok("Staff role guards wired");

if (!gateRoot.includes("requireAdminCookie")) fail("ComingSoonGateRoot must bypass for admin cookie only");
if (gateRoot.includes("preview_token") || gateRoot.includes("PREVIEW_TOKEN")) {
  fail("hardcoded preview token in ComingSoonGateRoot");
}
ok("Public lock preserved with admin-cookie preview bypass");

if (!promoActions.includes("resolveSalesRepFieldsForCreate")) {
  fail("promo create must resolve sales rep attribution");
}
if (!promoActions.includes("sales_rep_id")) fail("promo insert must include sales_rep_id");
ok("Promo attribution on create");

const teamPromo = read("app/admin/(dashboard)/team/promo-codes/page.tsx");
if (!teamPromo.includes("StaffTeamNav")) fail("team promo page needs staff nav");
if (!read("app/admin/(dashboard)/team/clients/page.tsx").includes("filterPromoCodesForAccess")) {
  fail("clients page must filter promo codes for staff scope");
}
ok("Staff promo list + clients");

if (!roster.includes("requireAdminTeamAccess")) fail("roster must remain owner-guarded");
if (!read("app/admin/(dashboard)/team/customers/new/page.tsx").includes("createCustomerUserWithAuthAction")) {
  fail("customer creator must use Supabase provisioning action");
}
ok("User creator audited — runbook, not fake auth");

const forbidden = ["shared_password", "leonix_sales_password", "PREVIEW_BYPASS_TOKEN"];
for (const f of forbidden) {
  if (staffAccess.includes(f) || preview.includes(f)) fail(`forbidden secret pattern: ${f}`);
}
ok("No hardcoded shared password / preview token");

const stackFiles = [
  "app/admin/_lib/staffAdminAccess.ts",
  "app/admin/_components/StaffTeamNav.tsx",
  "app/components/ComingSoonGateRoot.tsx",
  "app/admin/(dashboard)/team/page.tsx",
  "app/admin/(dashboard)/team/website-preview/page.tsx",
  "app/admin/(dashboard)/team/promo-codes/page.tsx",
  "app/admin/(dashboard)/team/sales-tracker/page.tsx",
  "app/admin/(dashboard)/team/clients/page.tsx",
  "app/admin/(dashboard)/team/customers/new/page.tsx",
  "app/admin/(dashboard)/team/roster/page.tsx",
];
for (const f of stackFiles) {
  if (!fs.existsSync(path.join(root, f))) fail(`missing stack file: ${f}`);
}
ok("Stack files present");

console.log("\nverify-staff-admin-sales-access: PASS");
