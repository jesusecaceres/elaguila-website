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

console.log("\n🔍 Gate G1.6H-STACK — Sales Rep Dashboard Foundation\n");

// 1. Sales tracker page exists
const pagePath = "app/admin/(dashboard)/workspace/sales-tracker/page.tsx";
const pageExists = existsSync(pagePath);
assert("sales tracker page exists", pageExists, pagePath);

const pageSrc = readSafe(pagePath);

// 2. Page mentions Sales Tracker or Seguimiento de Ventas
assert(
  "page mentions Sales Tracker or Seguimiento de Ventas",
  /Sales Tracker|Seguimiento de Ventas/i.test(pageSrc),
  "Title must be present"
);

// 3. Page mentions commission preview only
assert(
  "page mentions commission preview only",
  /commission.*preview|comisión.*preview|preview.*commission/i.test(pageSrc),
  "Commission preview language required"
);

// 4. Page mentions payment clears
assert(
  "page mentions payment clears",
  /payment clears|pago.*liquide|pago.*confirme/i.test(pageSrc),
  "Payment clears language required"
);

// 5. Page reads promo codes or uses promoCodeData helper
assert(
  "page reads promo codes or uses promoCodeData helper",
  /promoCodeData|fetchPromoCodesForTracker|salesTrackerData/i.test(pageSrc),
  "Must use promoCodeData or salesTrackerData"
);

// 6. Page reads package entitlements or uses packageEntitlementData helper
assert(
  "page reads entitlements or uses packageEntitlementData helper",
  /packageEntitlementData|fetchPackageEntitlementsForTracker|salesTrackerData/i.test(pageSrc),
  "Must use packageEntitlementData or salesTrackerData"
);

// 7. Page supports sales rep ID/name filter
assert(
  "page supports sales rep ID/name filter",
  /sales_rep_id|salesRepId|sales rep/i.test(pageSrc),
  "Must have sales rep filter"
);

// 8. Page shows active/expired/revoked counts
assert(
  "page shows active/expired/revoked counts",
  /active.*code|active.*entitlement|expired|revoked/i.test(pageSrc),
  "Status counts must be displayed"
);

// 9. Page shows estimated contract total if metadata exists
assert(
  "page shows estimated contract total if metadata exists",
  /estimatedContractTotal|estimated.*contract.*total|Total.*contrato|Est.*total/i.test(pageSrc),
  "Contract total required"
);

// Data helper exists
const helperPath = "app/admin/_lib/salesTrackerData.ts";
const helperExists = existsSync(helperPath);
assert("salesTrackerData.ts helper exists", helperExists, helperPath);

const helperSrc = readSafe(helperPath);

// Helper reads from promo codes
assert(
  "helper reads from promoCodeData",
  /fetchPromoCodesForTracker|promoCodeData/i.test(helperSrc),
  "Must import or use promoCodeData"
);

// Helper reads from entitlements
assert(
  "helper reads from packageEntitlementData",
  /fetchPackageEntitlementsForTracker|packageEntitlementData/i.test(helperSrc),
  "Must import or use packageEntitlementData"
);

// Helper groups by sales rep
assert(
  "helper groups by sales_rep_id",
  /sales_rep_id|salesRepId|repMap/i.test(helperSrc),
  "Must group by sales rep"
);

// Docs exist and have right content
const docPath = "docs/sales-rep-dashboard-model.md";
const docsSrc = readSafe(docPath);

assert("docs/sales-rep-dashboard-model.md exists", existsSync(docPath));

assert(
  "docs mention future limited sales rep dashboard",
  /future.*limited.*sales rep.*dashboard|sales rep.*self-service|limited.*sales rep/i.test(docsSrc),
  "Must describe future limited dashboard"
);

assert(
  "docs mention commission only after payment clears",
  /commission.*not payable.*until|payment.*cleared|payment clears/i.test(docsSrc),
  "Must state commission requires payment"
);

assert(
  "docs mention Stripe Checkout later",
  /Stripe Checkout.*later|Stripe.*later gate|G1\.6I/i.test(docsSrc),
  "Must mention Stripe later"
);

assert(
  "docs mention no public redemption",
  /no public.*redemption|public redemption/i.test(docsSrc),
  "Must state no public redemption"
);

assert(
  "docs mention no public ranking",
  /no public.*ranking|no public.*route|no.*public.*sales rep page/i.test(docsSrc),
  "Must state no public ranking/routes"
);

// No Stripe SDK/import
const allFiles = [pageSrc, helperSrc];
const allSrc = allFiles.join("\n");
assert(
  "no Stripe SDK or import",
  !/import.*stripe|require.*stripe|@stripe\/stripe/i.test(allSrc),
  "Must not import Stripe"
);

// No payout table
assert(
  "no payout table reference",
  !/payout_ledger|commission_payouts|payroll_/i.test(allSrc),
  "Must not reference payout tables"
);

// No public route
assert(
  "no public route",
  !existsSync("app/(site)/sales-tracker") &&
    !existsSync("app/(site)/sales") &&
    !existsSync("app/api/sales-tracker"),
  "Must not have public routes"
);

// No Servicios ranking
assert(
  "no Servicios ranking",
  !/resolveListingVisibilityRank|servicios.*sort|sortListings/i.test(allSrc),
  "Must not add ranking logic"
);

// Nav link exists
const navSrc = readSafe("app/admin/_components/AdminWorkspaceNav.tsx");
assert(
  "nav link to sales-tracker exists",
  /sales-tracker/.test(navSrc),
  "Workspace nav must link to sales-tracker"
);

// i18n strings exist
const stringsSrc = readSafe("app/admin/_lib/adminStrings.ts");
assert(
  "i18n strings for salesTracker exist",
  /salesTracker/.test(stringsSrc),
  "adminStrings must include salesTracker keys"
);

// Smoke test doc updated
const smokeSrc = readSafe("docs/admin-workspace-smoke-test.md");
assert(
  "smoke test doc references G1.6H-STACK",
  /G1\.6H-STACK/.test(smokeSrc),
  "admin-workspace-smoke-test.md must mention G1.6H"
);

console.log(`\n✅ ${pass} passed · ❌ ${fail} failed\n`);
if (fail > 0) process.exit(1);
