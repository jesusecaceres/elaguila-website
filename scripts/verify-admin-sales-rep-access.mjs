import { readFileSync, existsSync } from "fs";

let pass = 0;
let fail = 0;

function assert(label, ok, hint = "") {
  if (ok) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.error(`  ❌ ${label}${hint ? ` — ${hint}` : ""}`);
  }
}

function readSafe(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

console.log("\n=== ADMIN-ROLES-SALES ===\n");

const accessPath = "app/admin/_lib/adminAccessControl.ts";
const accessSrc = readSafe(accessPath);

assert("admin access control helper exists", existsSync(accessPath));
assert(
  "helper defines sales_rep role or maps existing role to sales_rep",
  /sales_rep/.test(accessSrc) && /normalizeAdminRole/.test(accessSrc),
);
assert(
  "helper defines owner/admin full-access behavior",
  /owner_admin/.test(accessSrc) && /canViewAllSalesRecords/.test(accessSrc),
);
assert("helper includes canViewAllSalesRecords or equivalent", /canViewAllSalesRecords/.test(accessSrc));
assert("helper includes canManageOwnPromoCodes or equivalent", /canManageOwnPromoCodes/.test(accessSrc));
assert(
  "helper includes canManageOwnPackageEntitlements or equivalent",
  /canManageOwnPackageEntitlements/.test(accessSrc),
);

const promoPage = readSafe("app/admin/(dashboard)/workspace/promo-codes/page.tsx");
const promoActions = readSafe("app/admin/(dashboard)/workspace/promo-codes/actions.ts");
assert(
  "promo code data/page/actions use access scope or documented guard",
  /filterPromoCodesForAccess|adminAccessControl/.test(promoPage) &&
    /resolveSalesRepFieldsForCreate|assertCanManagePromoCode/.test(promoActions),
);

const entPage = readSafe("app/admin/(dashboard)/workspace/package-entitlements/page.tsx");
const entActions = readSafe("app/admin/(dashboard)/workspace/package-entitlements/actions.ts");
assert(
  "package entitlement data/page/actions use access scope or documented guard",
  /filterEntitlementsForAccess|adminAccessControl/.test(entPage) &&
    /resolveSalesRepFieldsForCreate|assertCanManageEntitlement/.test(entActions),
);

const salesPage = readSafe("app/admin/(dashboard)/workspace/sales-tracker/page.tsx");
assert(
  "sales tracker scopes sales_rep to own records or documented guard",
  /getSalesRepScopeForAdmin|salesRepLocked/.test(salesPage),
);

const payPage = readSafe("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
assert(
  "payment tracker is owner/admin only or documented guard",
  /requirePaymentTrackerAccess/.test(payPage),
);

const workspaceLayout = readSafe("app/admin/(dashboard)/workspace/layout.tsx");
const sidebar = readSafe("app/admin/_components/AdminSidebar.tsx");
assert(
  "admin nav/sidebar is limited or page guards exist for sales_rep",
  /getAllowedWorkspaceNavHrefs|allowedHrefs/.test(workspaceLayout) &&
    (/allowedGlobalNavHrefs|salesRepLimited/.test(sidebar) || /access_denied/.test(workspaceLayout)),
);

assert(
  "sales rep ID/name auto-assignment exists or documented gap",
  /resolveSalesRepFieldsForCreate/.test(accessSrc) &&
    /Gap:|ADMIN_OPERATOR_EMAIL/.test(readSafe("docs/admin-sales-rep-access-model.md")),
);
assert(
  "owner/admin override remains possible",
  /resolveSalesRepFieldsForCreate/.test(accessSrc) && /formSalesRepId/.test(promoActions),
);

const modelDoc = readSafe("docs/admin-sales-rep-access-model.md");
const smokeDoc = readSafe("docs/admin-workspace-smoke-test.md");
assert("docs mention owner/admin full visibility", /owner.*admin|full visibility/i.test(modelDoc));
assert("docs mention sales rep limited access", /limited access|sales rep/i.test(modelDoc));
assert("docs mention sales rep can only see own records", /own records|solo sus/i.test(modelDoc));
assert(
  "docs mention payment tracker is owner/admin only by default",
  /payment tracker.*owner|owner-only/i.test(modelDoc),
);
assert("docs mention no Stripe Checkout/payment collection", /no Stripe|Stripe Checkout/i.test(modelDoc));
assert("docs mention no public redemption", /public redemption/i.test(modelDoc));
assert("docs mention no public ranking", /public ranking/i.test(modelDoc));
assert("smoke test updated", /ADMIN-ROLES-SALES|sales rep access/i.test(smokeDoc));

const pkg = readSafe("package.json");
assert("package.json script exists", /verify:admin-sales-rep-access/.test(pkg));

const siteApp = readSafe("app/(site)/clasificados/servicios/lib/serviciosVisibilityRanking.ts");
assert("no public route added", !/sales_rep_id/.test(readSafe("app/(site)/clasificados/servicios/page.tsx")));
assert("no Stripe SDK/import added in gate admin files", !/from ["']stripe["']/.test(promoActions + entActions));
assert("no payout/payroll added", !/payroll|payout_table/i.test(accessSrc + promoActions));
assert(
  "no public Servicios/Restaurantes ranking changed",
  !/ADMIN-ROLES-SALES/.test(siteApp),
);

console.log(`\n  Results: ${pass} passed, ${fail} failed\n`);
if (fail > 0) {
  console.error("FAIL: ADMIN-ROLES-SALES verification failed.\n");
  process.exit(1);
}
console.log("PASS: ADMIN-ROLES-SALES verification passed.\n");
