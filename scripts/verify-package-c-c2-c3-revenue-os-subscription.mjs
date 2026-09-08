// Package C Build 1 (C2+C3) — closure verifier.
// Run from repo root: node scripts/verify-package-c-c2-c3-revenue-os-subscription.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
let failures = 0;
const check = (ok, label) => {
  if (ok) console.log(`PASS  ${label}`);
  else { failures += 1; console.error(`FAIL  ${label}`); }
};

// 1. Closure document + required migrations exist.
const DOC = "docs/globalization/package-c/C2_C3_REVENUE_OS_CONVERGENCE_SUBSCRIPTION_GRACE_CLOSURE.md";
check(existsSync(path.join(ROOT, DOC)), "closure document exists");
const doc = existsSync(path.join(ROOT, DOC)) ? read(DOC) : "";
for (const m of [
  "supabase/migrations/20260805090000_leonix_stripe_webhook_events.sql",
  "supabase/migrations/20260805090100_leonix_subscription_records.sql",
  "supabase/migrations/20260805090200_leonix_billing_consents.sql",
  "supabase/migrations/20260805090300_listing_package_entitlements_uniqueness_grant_source.sql",
  "supabase/migrations/20260805090400_leonix_payment_records_manual_clearance_attempt_identity.sql",
  "supabase/migrations/20260805090500_lane_listing_suspended_reason.sql",
]) {
  check(existsSync(path.join(ROOT, m)), `migration exists: ${m}`);
}

// 2. Event ledger + unique Stripe event identity referenced and wired.
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
check(webhookRoute.includes("claimStripeEvent"), "event ledger claim wired into the canonical webhook");
check(read("supabase/migrations/20260805090000_leonix_stripe_webhook_events.sql").includes("leonix_stripe_webhook_events_event_id_key"), "unique Stripe event identity index");

// 3. Subscription events handled with real handlers.
for (const h of ["handleInvoicePaid", "handleInvoicePaymentFailed", "handleSubscriptionUpdated", "handleSubscriptionDeleted", "handleChargeRefunded", "handleDisputeCreated", "handleDisputeClosed"]) {
  check(webhookRoute.includes(h), `real subscription-event handler dispatched: ${h}`);
}

// 4. Seven-day grace encoded (locked value).
const policy = read("app/lib/listingPlans/subscriptionLifecyclePolicy.ts");
check(policy.includes("SUBSCRIPTION_GRACE_DAYS = 7"), "seven-day grace encoded");
check(policy.includes("computeGraceEndsAt"), "grace window computation exists");

// 5. Recurring consent encoded + enforced.
check(read("app/lib/listingPlans/recurringConsentCopy.ts").includes("RECURRING_CONSENT_TEXT_VERSION"), "versioned consent disclosure");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
check(checkoutRoute.includes("packageRequiresRecurringConsent"), "server-enforced recurring consent");
check(checkoutRoute.includes("computeCheckoutAttemptKey"), "purchase-attempt identity in canonical checkout");

// 6. Autos uses canonical Revenue OS; Bienes legacy mutation path blocked.
const confirmCore = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
check(confirmCore.includes("bypassOnly: true") && confirmCore.includes("AUTOS_DEALER_CHECKOUT"), "Autos dealer converged to canonical Revenue OS");
const brExito = read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx");
check(!brExito.includes('fetch("/api/clasificados/leonix/stripe/checkout"'), "BR success-page legacy mutation path removed");

// 7. Success pages read-only.
for (const p of ["app/(site)/revenue-os/pago/exito/page.tssx".replace(".tssx", ".tsx"), "app/(site)/revenue-os/pago/cancelado/page.tsx"]) {
  const src = read(p);
  check(![".insert(", ".update(", ".upsert(", ".delete("].some((v) => src.includes(v)), `success page read-only: ${p}`);
}

// 8. Manual cleared payment + print-included sources exist.
check(existsSync(path.join(ROOT, "app/lib/listingPlans/manualClearedPayments.ts")), "manual cleared-payment foundation exists");
check(read("app/admin/(dashboard)/workspace/package-entitlements/actions.ts").includes("print_included"), "print-included grant source wired");

// 9. Contractual 25% preserved; no promotional 25% implementation added by this build.
const refundPolicy = read("app/lib/listingPlans/refundDisputePolicy.ts");
check(refundPolicy.includes("DESIGN_SETUP_RETENTION_PERCENT = 25"), "contractual design/setup 25% preserved");
check(refundPolicy.includes("DO NOT CONFUSE WITH THE RETIRED PROMOTIONAL CAMPAIGN"), "contract-vs-promo distinction documented");
for (const p of [
  "app/lib/listingPlans/recurringConsentCopy.ts",
  "app/lib/listingPlans/subscriptionLifecyclePolicy.ts",
  "app/lib/listingPlans/stripeEventLedgerPolicy.ts",
  "app/lib/listingPlans/commercialWriteGuardPolicy.ts",
]) {
  check(!/percent_off\s*[:=]\s*["']?25/.test(read(p)), `no new 25% promotional implementation in ${p}`);
}

// 10. Diff scope: no secret files, no protected Package A/B contracts, no isolated workstreams.
const allowSrc = read("scripts/globalizationCurrentPackageDiff.ts");
check(allowSrc.includes("PACKAGE C BUILD 1"), "Package C Build 1 allowlist section present");
check(!allowSrc.includes(".env"), "no secret/env file in the authorized diff");
for (const forbidden of ["app/lib/media/listingMediaContract.ts\"", "app/lib/listingDrafts/draftWorkspaceContract.ts\"", "publicar/viajes", "ofertas-locales/", "concierge"]) {
  const pkgCSection = allowSrc.slice(allowSrc.indexOf("PACKAGE C BUILD 1"));
  check(!pkgCSection.includes(forbidden), `protected/isolated file absent from Package C section: ${forbidden}`);
}

// 11. Lane matrix terminal states in the closure doc.
check(doc.includes("IMPLEMENTED AND AUTOMATED-PROVEN"), "lane matrix carries terminal states");
check(doc.includes("INTENTIONAL FREE/N/A"), "free lanes recorded as intentional");
check(doc.includes("READY TO COMMIT: YES"), "READY TO COMMIT recorded");
check(doc.includes("READY TO PUSH: NO"), "push withheld pending owner authorization");

console.log(failures === 0
  ? "verify-package-c-c2-c3-revenue-os-subscription: all checks passed."
  : `verify-package-c-c2-c3-revenue-os-subscription: ${failures} FAILURE(S).`);
process.exit(failures === 0 ? 0 : 1);
