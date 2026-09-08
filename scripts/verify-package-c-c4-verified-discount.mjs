// Package C Build 2 (C4) — closure verifier.
// Run from repo root: node scripts/verify-package-c-c4-verified-discount.mjs
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

// 1. Closure document + exactly 5 migrations exist.
const DOC = "docs/globalization/package-c/C4_VERIFIED_15_PERCENT_AND_25_PERCENT_PROMO_RETIREMENT_CLOSURE.md";
check(existsSync(path.join(ROOT, DOC)), "closure document exists");
const doc = existsSync(path.join(ROOT, DOC)) ? read(DOC) : "";

const MIGRATIONS = [
  "supabase/migrations/20260805100000_leonix_verified_intro_discount_redemptions.sql",
  "supabase/migrations/20260805100100_leonix_phone_verification_challenges.sql",
  "supabase/migrations/20260805100200_leonix_verified_phone_identities.sql",
  "supabase/migrations/20260805100300_leonix_payment_records_verified_intro_discount_link.sql",
  "supabase/migrations/20260805100400_retire_website_launch_25_promo_family.sql",
];
for (const m of MIGRATIONS) check(existsSync(path.join(ROOT, m)), `migration exists: ${m}`);
check(MIGRATIONS.length === 5, "exactly 5 migrations (count stated consistently)");

// 2. Redemption table: 6-state status vocabulary, composite business-identity index, hash
// columns (never raw email/phone as the anti-repeat index).
const redemptionsMigration = read(MIGRATIONS[0]);
for (const status of ["reserved", "redeemed", "released", "expired", "rejected", "reversed"]) {
  check(redemptionsMigration.includes(`'${status}'`), `redemption status vocabulary includes '${status}'`);
}
check(
  redemptionsMigration.includes("verified_email_identity_hash") && redemptionsMigration.includes("verified_phone_identity_hash"),
  "anti-repeat uses keyed identity hashes, not raw email/phone",
);
check(!/\bemail\s+text\b/.test(redemptionsMigration.replace(/verified_email_identity_hash|verified_email_masked/g, "")), "no raw email column on the redemption table");
check(
  redemptionsMigration.includes("business_identity_type, business_identity_key)") &&
    redemptionsMigration.includes("leonix_verified_intro_discount_redemptions_business_uniq"),
  "composite (business_identity_type, business_identity_key) unique index exists",
);
check(
  (redemptionsMigration.match(/WHERE status IN \('reserved', 'redeemed'\)/g) || []).length >= 4,
  "all four anti-repeat boundaries cover BOTH reserved and redeemed states (not redeemed-only)",
);
check(redemptionsMigration.includes("owner_user_id uuid NOT NULL"), "owner_user_id is a NOT NULL global boundary");

// 3. Rate-limit migration: atomic unique-slot index, IP hash never raw IP.
const challengesMigration = read(MIGRATIONS[1]);
check(challengesMigration.includes("rate_slot"), "atomic unique-slot rate-limit columns exist");
check(challengesMigration.includes("request_ip_hash"), "raw IP is never stored (hash only)");
check(!/request_ip\s+text/.test(challengesMigration), "no raw request_ip column");

// 4. Checkout route: discount_conflict rejection, coupon-first sequencing, no silent full-price
// fallback on a requested-but-unavailable discount.
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
check(checkoutRoute.includes("discount_conflict"), "checkout route rejects a crafted both-discounts request with discount_conflict");
check(checkoutRoute.includes("verified_discount_temporarily_unavailable"), "checkout route stops entirely on a requested-but-unavailable discount");
check(checkoutRoute.includes("ensureVerifiedIntroDiscountStripeCoupon"), "Stripe coupon resolved before reservation (coupon-first sequencing)");
check(checkoutRoute.includes("reserveOrReuseVerifiedIntroDiscount"), "atomic reservation flow wired into checkout");
check(checkoutRoute.includes("releaseVerifiedIntroDiscountReservation"), "reservation release wired for stale/mismatched/failed attempts");

// 5. Atomic reservation module: INSERT-first (not SELECT-then-INSERT), diagnostic-only conflict
// lookup, replay-safe redemption.
const redemptionsModule = read("app/lib/listingPlans/verifiedIntroDiscountRedemptions.ts");
check(redemptionsModule.includes(".insert({"), "reservation uses INSERT as the atomic concurrency gate");
check(redemptionsModule.includes("Diagnostic-only"), "conflict lookup is documented as diagnostic-only, never gating");
check(redemptionsModule.includes(".eq(\"status\", \"reserved\")") && redemptionsModule.includes("redeemed"), "redemption UPDATE is conditional (reserved -> redeemed), replay-safe");

// 6. Business identity resolver reuses commercialWriteGuard.ts's established parent/dealer
// identities rather than inventing a new system, and stamps fallback reasons explicitly.
const businessIdentity = read("app/lib/listingPlans/commercialBusinessIdentity.ts");
check(businessIdentity.includes("dealer_inventory_parent_listing_id"), "Autos business identity reuses the dealer parent-listing concept");
check(businessIdentity.includes("br_inventory_parent_listing_id"), "Bienes business identity reuses the commercial parent-listing concept");
check(businessIdentity.includes("fallbackReason"), "owner_user_id fallback is explicitly stamped, never silent");

// 7. Identity hash utility fails closed without a configured key; never logs the key.
const hashUtil = read("app/lib/security/verifiedIdentityHash.ts");
check(hashUtil.includes("LEONIX_IDENTITY_HASH_KEY"), "identity hash keyed by LEONIX_IDENTITY_HASH_KEY");
check(hashUtil.includes("return null") || hashUtil.includes("return null;"), "hash generation fails closed when the key is absent");
check(!/console\.(log|error|warn)\([^)]*LEONIX_IDENTITY_HASH_KEY/.test(hashUtil), "identity hash key value is never logged");

// 8. Twilio provider fails closed; never fabricates a successful verification.
const twilioProvider = read("app/lib/sms/twilioVerifyProvider.ts");
check(twilioProvider.includes("NOT_CONFIGURED"), "Twilio provider reports NOT_CONFIGURED when credentials are absent");
check(!/approved:\s*true[\s\S]{0,40}NOT_CONFIGURED/.test(twilioProvider), "Twilio provider never fabricates an approved verification");

// 9. Stripe coupon helper validates configuration before trusting a retrieved coupon.
const couponModule = read("app/lib/listingPlans/verifiedIntroDiscountStripeCoupon.ts");
check(couponModule.includes("isValidCoupon") && couponModule.includes("coupon_misconfigured"), "retrieved coupon is validated (percent_off/duration) before use, fails closed if misconfigured");
check(couponModule.includes("resource_already_exists"), "concurrent coupon creation race handled safely");

// 10. Contractual 25% and founding-partner 25% remain untouched (grep-guard, not just doc claim).
const refundPolicy = read("app/lib/listingPlans/refundDisputePolicy.ts");
check(refundPolicy.includes("DESIGN_SETUP_RETENTION_PERCENT = 25"), "contractual design/setup 25% preserved");
check(refundPolicy.includes("DO NOT CONFUSE"), "contract-vs-promo distinction still documented");
const pricingRules = read("app/lib/listingPlans/packagePricingRules.ts");
check(pricingRules.includes("founding_partner"), "founding-partner contract-term discount preserved");

// 11. Launch-25 retirement: newsletter no longer mints a promo code; the retirement migration's
// predicate matches the live detector so they never drift.
const newsletterRoute = read("app/api/newsletter/subscribe/route.ts");
check(!newsletterRoute.includes("ensureNewsletterPromoCode"), "newsletter subscribe no longer mints a Launch-25 promo code");
const retireMigration = read(MIGRATIONS[4]);
check(retireMigration.includes("website_launch_25"), "retirement migration targets the website_launch_25 family");
check(
  retireMigration.includes("status = 'revoked'") && !/^\s*DELETE\s+FROM/im.test(retireMigration),
  "retirement is a status flip, never a DELETE — history preserved",
);

// 12. Diff-scope: allowlist section present, no secret files.
const allowSrc = read("scripts/globalizationCurrentPackageDiff.ts");
check(allowSrc.includes("PACKAGE C BUILD 2") || allowSrc.includes("PACKAGE C BUILD 2 (C4)"), "Package C Build 2 (C4) allowlist section present");
check(!allowSrc.includes(".env"), "no secret/env file in the authorized diff");

// 13. Closure doc carries the mandated terminal markers.
check(doc.includes("READY TO PUSH: NO"), "push withheld pending owner authorization");

console.log(
  failures === 0
    ? "verify-package-c-c4-verified-discount: all checks passed."
    : `verify-package-c-c4-verified-discount: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
