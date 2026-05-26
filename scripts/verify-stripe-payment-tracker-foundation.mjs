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

console.log("\n🔍 Gate G1.6I-STACK — Global Stripe Payment Tracker Foundation\n");

// --- Migration ---
const migrationPath = "supabase/migrations/20260526120000_leonix_payment_records.sql";
const migSrc = readSafe(migrationPath);

assert("migration creates leonix_payment_records", /leonix_payment_records/.test(migSrc));
assert("migration includes package_entitlement_id", /package_entitlement_id/.test(migSrc));
assert("migration includes promo_code_id", /promo_code_id/.test(migSrc));
assert("migration includes promo_code field", /promo_code\s+text/.test(migSrc));
assert("migration includes sales_rep_id", /sales_rep_id/.test(migSrc));
assert("migration includes sales_rep_name", /sales_rep_name/.test(migSrc));
assert("migration includes stripe_checkout_session_id", /stripe_checkout_session_id/.test(migSrc));
assert("migration includes stripe_payment_intent_id", /stripe_payment_intent_id/.test(migSrc));
assert("migration includes payment_status", /payment_status/.test(migSrc));
assert("migration includes commission_eligible", /commission_eligible/.test(migSrc));
assert("migration includes commission_status", /commission_status/.test(migSrc));
assert("migration includes metadata jsonb", /metadata\s+jsonb/.test(migSrc));

// --- Pure helper ---
const helperPath = "app/lib/listingPlans/paymentTracking.ts";
const helperSrc = readSafe(helperPath);

assert("paymentTracking helper exists", existsSync(helperPath));
assert("helper exports normalizePaymentStatus", /export\s+function\s+normalizePaymentStatus/.test(helperSrc));
assert("helper exports isPaymentCleared", /export\s+function\s+isPaymentCleared/.test(helperSrc));
assert("helper exports resolvePaymentCommissionEligibility", /export\s+function\s+resolvePaymentCommissionEligibility/.test(helperSrc));
assert("helper exports buildPaymentTrackingMetadata", /export\s+function\s+buildPaymentTrackingMetadata/.test(helperSrc));
assert("helper exports summarizePaymentRecord", /export\s+function\s+summarizePaymentRecord/.test(helperSrc));
assert("helper exports formatPaymentStatusLabel", /export\s+function\s+formatPaymentStatusLabel/.test(helperSrc));
assert("helper does not import Stripe SDK", !/import.*stripe|require.*stripe|@stripe\/stripe/i.test(helperSrc));

// --- Admin page ---
const pagePath = "app/admin/(dashboard)/workspace/payment-tracker/page.tsx";
const pageSrc = readSafe(pagePath);

assert("payment tracker admin page exists", existsSync(pagePath));
assert("page says global payment tracker", /global payment tracker|seguimiento global/i.test(pageSrc));
assert("page says does not collect payments yet", /does not collect payments|no se cobran pagos/i.test(pageSrc));

// --- Admin data helper ---
const dataPath = "app/admin/_lib/paymentTrackerData.ts";
assert("paymentTrackerData.ts exists", existsSync(dataPath));

// --- Docs ---
const docPath = "docs/stripe-payment-tracker-model.md";
const docsSrc = readSafe(docPath);

assert("docs/stripe-payment-tracker-model.md exists", existsSync(docPath));
assert("docs mention Stripe Checkout is global", /Stripe Checkout is global|global.*Stripe/i.test(docsSrc));
assert("docs mention Checkout preferred over Payment Links", /preferred over Payment Links|Checkout.*preferred/i.test(docsSrc));
assert("docs mention webhook later", /webhook.*later|webhook.*create.*update.*records/i.test(docsSrc));
assert("docs mention commission only after payment clears", /commission.*eligible.*after.*payment.*clears|commission.*paid.*succeeded/i.test(docsSrc));
assert("docs mention no public ranking", /no.*public.*ranking|no changes.*public.*ranking/i.test(docsSrc));
assert("docs mention no Servicios ranking", /no.*Servicios.*ranking|Servicios.*sorting/i.test(docsSrc));

// --- Negative checks ---
const allSrc = [helperSrc, pageSrc, readSafe(dataPath)].join("\n");

assert("no public checkout endpoint was added",
  !existsSync("app/api/checkout") &&
  !existsSync("app/api/payments/checkout") &&
  !existsSync("app/(site)/payment-tracker"),
  "Must not have public checkout routes"
);

assert("no public redemption endpoint was added",
  !existsSync("app/api/redeem") &&
  !existsSync("app/api/promo/redeem"),
  "Must not have public redemption routes"
);

assert("no payout table was added",
  !/payout_ledger|commission_payouts|payroll_/i.test(allSrc) &&
  !/payout_ledger|commission_payouts|payroll_/i.test(migSrc),
  "Must not reference payout tables"
);

assert("no Stripe SDK import in gate files",
  !/import.*@stripe\/stripe|require.*stripe/i.test(allSrc),
  "Must not import Stripe SDK in gate files"
);

// --- Nav and dashboard ---
const navSrc = readSafe("app/admin/_components/AdminWorkspaceNav.tsx");
assert("nav link to payment-tracker exists", /payment-tracker/.test(navSrc));

const stringsSrc = readSafe("app/admin/_lib/adminStrings.ts");
assert("i18n strings for paymentTracker exist", /paymentTracker/.test(stringsSrc));

const dashSrc = readSafe("app/admin/(dashboard)/page.tsx");
assert("dashboard links to payment tracker", /payment-tracker/.test(dashSrc));

// --- Smoke test doc ---
const smokeSrc = readSafe("docs/admin-workspace-smoke-test.md");
assert("smoke test doc references G1.6I-STACK", /G1\.6I-STACK/.test(smokeSrc));

console.log(`\n✅ ${pass} passed · ❌ ${fail} failed\n`);
if (fail > 0) process.exit(1);
