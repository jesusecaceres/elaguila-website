// Package C Build 2 (C4) — pure-policy behavioral selftest. Imports ONLY from *Policy.ts pure
// modules (no "server-only" imports) so it runs under tsx without a Supabase/Stripe/Twilio
// runtime. Run: npx tsx scripts/gate-pkgC-verified-intro-discount-selftest.ts
import {
  decideVerifiedIntroDiscountEligibility,
  type VerifiedIntroDiscountVerificationFacts,
} from "../app/lib/listingPlans/verifiedIntroDiscountPolicy";
import {
  truncateToBucket,
  decideRateLimitOutcome,
  REQUEST_COOLDOWN,
  REQUEST_HOURLY_PHONE,
  REQUEST_HOURLY_IP,
  CHECK_TEN_MIN,
} from "../app/lib/sms/phoneVerificationRateLimitPolicy";

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const baseFacts: VerifiedIntroDiscountVerificationFacts = {
  emailVerified: true,
  phoneVerified: false,
  hasPriorRedemption: false,
  packageEligible: true,
  billingMode: "one_time",
  activeDiscountSource: null,
};

// 1. Eligible, one-time -> unit_amount_reduction.
{
  const d = decideVerifiedIntroDiscountEligibility(baseFacts);
  check(d.eligible === true && d.eligible && d.mechanism === "unit_amount_reduction", "eligible one_time -> unit_amount_reduction");
}

// 2. Eligible, monthly_subscription -> stripe_once_coupon.
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, billingMode: "monthly_subscription" });
  check(d.eligible === true && d.eligible && d.mechanism === "stripe_once_coupon", "eligible monthly_subscription -> stripe_once_coupon");
}

// 3. Not verified (neither email nor phone).
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, emailVerified: false, phoneVerified: false });
  check(!d.eligible && !d.eligible ? d.reasonCode === "not_verified" : false, "no verification -> not_verified");
}

// 4. Phone-only verification is sufficient.
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, emailVerified: false, phoneVerified: true });
  check(d.eligible === true, "phone-only verification is sufficient");
}

// 5. Prior redemption blocks regardless of verification.
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, hasPriorRedemption: true });
  check(!d.eligible && !d.eligible ? d.reasonCode === "already_redeemed" : false, "prior redemption -> already_redeemed");
}

// 6. Package excluded (e.g. future Premium print) blocks even when verified.
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, packageEligible: false });
  check(!d.eligible && !d.eligible ? d.reasonCode === "package_excluded" : false, "package excluded -> package_excluded");
}

// 7. Free/affiliate billing mode is never eligible.
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, billingMode: "free" });
  check(!d.eligible && !d.eligible ? d.reasonCode === "billing_mode_ineligible" : false, "free billing mode -> billing_mode_ineligible");
}

// 8. Active promo-code discount source blocks stacking (defensive; checkout route rejects the
// crafted-both-fields request before this is ever reached).
{
  const d = decideVerifiedIntroDiscountEligibility({ ...baseFacts, activeDiscountSource: "promo_code" });
  check(!d.eligible && !d.eligible ? d.reasonCode === "discount_already_active" : false, "active promo code -> discount_already_active (no stacking)");
}

// 9. Precedence: promo-code-active reason wins even when other facts would otherwise block too.
{
  const d = decideVerifiedIntroDiscountEligibility({
    ...baseFacts,
    activeDiscountSource: "promo_code",
    hasPriorRedemption: true,
    packageEligible: false,
  });
  check(!d.eligible && !d.eligible ? d.reasonCode === "discount_already_active" : false, "discount-conflict reason takes precedence");
}

// ── Rate-limit policy (decision 14 — atomic unique-slot, not COUNT-then-INSERT) ──────────────

// 10. Bucket truncation is deterministic and stable within a window (bucket 16 spans
// [960000, 1020000) for a 60s bucket size; 970000 and 1010000 fall inside it, 1030000 is the
// next bucket).
{
  const a = truncateToBucket(970_000, 60_000);
  const b = truncateToBucket(1_010_000, 60_000);
  const c = truncateToBucket(1_030_000, 60_000);
  check(a === b && b !== c, "truncateToBucket groups timestamps within the same fixed window");
}

// 11. A claimed slot within maxSlots is allowed.
check(decideRateLimitOutcome(1, REQUEST_COOLDOWN).allowed === true, "slot 1 within cooldown maxSlots(1) is allowed");
check(decideRateLimitOutcome(5, REQUEST_HOURLY_PHONE).allowed === true, "slot 5 within phone-hourly maxSlots(5) is allowed");
check(decideRateLimitOutcome(20, REQUEST_HOURLY_IP).allowed === true, "slot 20 within ip-hourly maxSlots(20) is allowed");
check(decideRateLimitOutcome(5, CHECK_TEN_MIN).allowed === true, "slot 5 within check-ten-min maxSlots(5) is allowed");

// 12. No claimed slot (all real 23505s exhausted) is denied — this IS the rate-limit rejection,
// with no separate count-then-decide step.
check(decideRateLimitOutcome(null, REQUEST_HOURLY_PHONE).allowed === false, "no claimed slot -> denied (rate limited)");

// 13. A slot number beyond maxSlots is denied (defensive bound check).
check(decideRateLimitOutcome(6, REQUEST_HOURLY_PHONE).allowed === false, "slot beyond maxSlots is denied");

console.log(
  failures === 0
    ? "gate-pkgC-verified-intro-discount-selftest: all checks passed."
    : `gate-pkgC-verified-intro-discount-selftest: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
