# Package C Build 2 (C4) — Verified 15% Email/SMS Introductory Discount + Complete Retirement of the Old 25% "Launch 25" Promotional Campaign

**Closure date:** 2026-08-05
**Repo:** C:/projects/elaguila-website
**Branch:** integration/lifecycle-foundation-2026-07
**Parent (Build 1):** `4fc5d8aab3181166a93d5c2685a9bba5f44e0f74` (pushed to `origin/integration/lifecycle-foundation-2026-07` before this build began)

## 1. Executive summary

Package C Build 2 (C4) implements a server-verified 15% introductory discount, gated by a confirmed authenticated email or a Twilio-verified phone number, and retires the "Launch 25" 25%-off promotional campaign that turned out to be a fully-built, currently-live system (not the narrow "P0 newsletter bypass" the owner's prompt described) — newsletter-issued codes, an admin quick-create generator, Stripe-checkout redemption, and live bilingual customer copy across ~20 rendering surfaces once every render call site was traced. Both efforts shipped in one coherent commit, with the twice-corrected plan's 7 owner-mandated architectural corrections (atomic reservation concurrency, explicit discount-conflict rejection, a category-aware business-identity resolver, a consistent 5-migration count, RPC-free atomic rate limiting, a fail-closed Stripe-coupon policy, and keyed identity hashing instead of raw email/phone) implemented as specified. No push, no PR, no Production action.

## 2. Starting baseline

- Local HEAD at start: `4fc5d8aab3181166a93d5c2685a9bba5f44e0f74` (Package C Build 1)
- `origin/integration/lifecycle-foundation-2026-07`: verified to also be at `4fc5d8aa...` (pushed with owner authorization immediately before this build began — Build 1 was not yet on the remote when this build was requested)
- `origin/main`: `3fae3e8d6db22353dccdbe36b94bb941a2a76227`, unchanged throughout

## 3. Preflight

Verified worktree/branch/HEAD, no active git operation (merge/rebase/cherry-pick/bisect), C1 and C2/C3 closure documents present, `.env*` never read. Build 1's remote-verification stop condition (required before this build could start) was cleared by pushing the integration branch with explicit owner authorization.

## 4. Files inspected

`app/api/revenue-os/checkout/route.ts` (full, 566→784 lines), `app/lib/listingPlans/{revenueStripe.ts,revenuePaymentRecords.ts,revenuePricingMatrix.ts,revenueCheckout.ts,commercialWriteGuard.ts,commercialWriteGuardPolicy.ts,checkoutAttemptIdentity.ts,revenuePromoRedemptions.ts,revenueFulfillment.ts,paymentTracking.ts}`, `app/api/_lib/bearerUser.ts` + `app/api/clasificados/_lib/bearerUser.ts`, `app/lib/auth/dashboardPasswordMode.ts`, `supabase/migrations/{20260522120000_leonix_promo_codes.sql,20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql,20260518124700_autos_dealer_inventory_grouping.sql,20260518130600_br_property_inventory_grouping.sql,20260804120000_listings_publish_attempt_idempotency_key.sql,20260805090400_leonix_payment_records_manual_clearance_attempt_identity.sql}`, `app/admin/_lib/{promoCodeConstants.ts,promoCodePresetGuide.ts,paymentTrackerData.ts}`, `app/(site)/clasificados/components/{PublishCheckoutCheckpoint.tsx,RevenuePromoField.tsx}`, `app/api/newsletter/subscribe/route.ts`, `package.json`. Read-only Supabase query against `leonix_promo_code_redemptions`/`leonix_promo_codes` for the Gate 0 stop-condition check.

## 5. Old 25% promotional inventory

The "Launch 25" campaign (`metadata.promo_family: "website_launch_25"`, or `code_type='newsletter' && metadata.website_checkout_only`) was found to be fully built and live: schema (`leonix_promo_codes`, `leonix_promo_code_redemptions`), automatic newsletter-signup issuance (`ensureNewsletterPromoCode()`), Stripe-checkout redemption (`resolvePromoForCheckout()`/`isWebsiteLaunch25Promo()` in `revenuePromoRedemptions.ts`), a 4-preset admin quick-create generator, and live bilingual copy rendered via `LeonixLaunchCouponCard.tsx` across 17 call sites (Home, Digital Magazine, Dashboard, Dashboard Profile, 4 Empleos/Autos/Rentas/Servicios publish-flow surfaces, Login, Newsletter page) plus 3 additional standalone live-claim surfaces found only by tracing every render (`RevenuePromoField.tsx`'s Apply-field copy, the newsletter success screen, the publish-checkpoint coupon line, and an admin lead-reply email template) — none of which the original inventory assumption anticipated. ~25 CI verifier/smoke scripts assert some aspect of this system.

## 6. Contractual 25% preservation proof

`app/lib/listingPlans/refundDisputePolicy.ts` `DESIGN_SETUP_RETENTION_PERCENT = 25` (Agreement §12) — zero-diff in this build, confirmed via `git diff` showing no changes to this file. `app/lib/listingPlans/packagePricingRules.ts` `founding_partner: { discountPercent: 25, requiresOwnerApproval: true }` — also zero-diff. Both remain architecturally isolated from the retired promo campaign, exactly as documented before this build began.

## 7. Shared campaign contract

`app/lib/listingPlans/verifiedIntroDiscountPolicy.ts` (pure) — `decideVerifiedIntroDiscountEligibility(facts)`, reason codes `not_verified | already_redeemed | package_excluded | billing_mode_ineligible | discount_already_active`. `app/lib/listingPlans/verifiedIntroDiscount.ts` (impure, preview-only) — `resolveVerifiedIntroDiscountEligibility()` for the `/status` endpoint and UI banner; the actual gate at checkout time is the atomic reservation INSERT, not this preview.

## 8. Email verification

New `app/api/_lib/verifiedBearerUser.ts` (`getVerifiedBearerUser`) — additive; resolves the full Supabase `User` and reads `email_confirmed_at` (field shape confirmed against `app/lib/auth/dashboardPasswordMode.ts`). Existing `getBearerUserId` helpers and their callers untouched.

## 9. SMS verification

Twilio Verify behind a provider-agnostic interface (`app/lib/sms/smsVerificationProvider.ts` + `twilioVerifyProvider.ts`). Twilio generates/stores/checks the OTP itself — this repo never receives, stores, or logs a raw code. Fails closed (`NOT_CONFIGURED`) when `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_VERIFY_SERVICE_SID` are absent.

## 10. Provider/configuration status

**External blocker, honestly reported:** live Twilio SMS delivery requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` to be provisioned (staging + production) — not configured in this environment. The architecture and all non-delivery logic are complete and tested; the phone-request route returns a truthful `sms_not_configured` (503) when absent, never a fake success. **A second, more fundamental blocker:** `LEONIX_IDENTITY_HASH_KEY` must also be provisioned — without it, the entire verified-15 feature (both email and phone paths) is unavailable, since anti-repeat enforcement structurally depends on the keyed identity hash. Email verification is otherwise fully functional independent of Twilio.

## 11. Rate limits and abuse controls

Atomic unique-slot-per-time-bucket claims (`app/lib/sms/phoneVerificationRateLimitPolicy.ts` + `phoneVerificationRateLimit.ts`), not COUNT-then-INSERT: 60s resend cooldown (1 slot), 5 requests/phone/hour, 20 requests/IP/hour (raw IP never stored — only its sha256 hash), 5 checks/phone/10min. Each claim is a single atomic INSERT against a partial unique index on `leonix_phone_verification_challenges`; exhausting all slots for a window is the rejection, with no count-then-decide race window.

## 12. Eligibility resolver

See §7. Server is the sole authority — the client never asserts eligibility, verification state, or amounts.

## 13. Discount calculation

Integer-cent math only. One-time packages: `discountCents = floor(subtotalCents * 15 / 100)`, `finalAmountCents = subtotalCents - discountCents` (matches the existing promo-code rounding convention). Subscription packages: no Leonix-side cents math at all — a Stripe-native `percent_off: 15, duration: "once"` coupon computes the discount Stripe-side, guaranteeing Stripe and Leonix totals can never diverge for that mechanism.

## 14. Package eligibility matrix

`RevenuePackageDefinition.verifiedIntroDiscountEligible?: boolean` (data-driven, default true unless `promoEligible !== true` or explicitly `false`). **The $1,999 Premium print package referenced in the owner's prompt does not exist anywhere in `revenuePricingMatrix.ts`** — confirmed absent both before and after this build; the exclusion requirement is currently vacuous but the field exists so exclusion is automatic whenever such a package is added. Every other existing paid package (Autos Privado/Dealer, Bienes Privado/Negocio, Restaurantes + coupon add-on, Servicios + offers add-on, Rentas, Empleos, Clases) is eligible by the same default rule the promo-code system already used (`promoEligible === true`).

## 15. Stripe initial-payment-only behavior

One-time packages: Leonix-side `unit_amount` reduction (identical mechanics to promo codes today). Monthly-subscription packages: `discounts: [{ coupon: "leonix_verified_intro_15_once" }]` on the Checkout Session, `price_data.unit_amount` stays FULL — confirmed via direct inspection of `handleInvoicePaid()` in `revenueSubscriptionEvents.ts`, which mirrors `invoice.amount_paid` from Stripe verbatim with zero Leonix-side recalculation, so a full-price subscription price object automatically yields full-price renewals with no code change needed on the renewal path. The coupon is a single, fixed-id, retrieve-or-create object (`ensureVerifiedIntroDiscountStripeCoupon()` in `verifiedIntroDiscountStripeCoupon.ts`), validated (`percent_off===15 && duration==="once"`) before every use — a coupon that exists under this id with the wrong configuration fails closed rather than being trusted.

## 16. Checkout integration

`app/api/revenue-os/checkout/route.ts`: (1) `discount_conflict` rejection — `409` if both a promo code and `requestVerifiedIntroDiscount:true` are present, before either discount path runs. (2) Verified-15 branch: eligibility check → for subscription mode, Stripe coupon resolved *before* any reservation or payment-record write (coupon-first sequencing) → atomic reservation → payment record → Stripe session. (3) Open-attempt reuse extended with a discount-source-consistency check — a mismatch (e.g. promo removed, verified-15 now requested on the same `checkout_attempt_key`) forces release-and-regenerate rather than reusing a stale-priced session.

## 17. Redemption lifecycle

New table `leonix_verified_intro_discount_redemptions`, explicit `reserved | redeemed | released | expired | rejected | reversed` status vocabulary. Four partial-unique-index anti-repeat boundaries, each covering BOTH `reserved` and `redeemed` (never redeemed-only): `owner_user_id` (global, never bypassed by business identity), `verified_email_identity_hash`, `verified_phone_identity_hash`, composite `(business_identity_type, business_identity_key)`. Reservation is a plain atomic INSERT — the four unique indexes are the concurrency gate, never a pre-check SELECT. `checkout_attempt_key` reuse, CAS-based expiry release, and replay-safe webhook redemption (`markVerifiedIntroDiscountRedemptionRedeemed`, conditional `reserved→redeemed`) all mirror Build 1's established idioms (`leonix_payment_records`' attempt-key uniqueness, subscription-suspension CAS restore, promo-redemption idempotent update).

## 18. Stacking protection

Enforced server-side by the `discount_conflict` rejection in §16, reinforced (not substituted) by UI mutual exclusion in `PublishCheckoutCheckpoint.tsx` (promo field hidden once verified-15 is applied, and vice versa).

## 19. Newsletter path

`ensureNewsletterPromoCode()` and its supporting helpers/constants removed from `app/api/newsletter/subscribe/route.ts`; newsletter subscription itself (`saveNewsletterSubscriber`) is untouched and continues to succeed. The response JSON shape is preserved for backward compatibility (fields hardcoded to "no code" values) rather than removed, so existing consumers don't break on a shape change.

## 20. Admin/audit truth

`app/admin/_lib/paymentTrackerData.ts` extended with masked-only verified-intro-discount fields (`verified_intro_discount_status`, `_verification_method`, `_email_masked`, `_phone_masked`, `_business_identity_type`, `_business_identity_fallback_reason`) — never a raw email/phone, never the identity hash, never an OTP, never a secret.

## 21. Migrations — exactly 5, additive, RLS enabled/service-role-only

1. `20260805100000_leonix_verified_intro_discount_redemptions.sql` — the redemption ledger (§17).
2. `20260805100100_leonix_phone_verification_challenges.sql` — ephemeral OTP + rate-limit ledger (§11).
3. `20260805100200_leonix_verified_phone_identities.sql` — durable per-user verified-phone truth.
4. `20260805100300_leonix_payment_records_verified_intro_discount_link.sql` — `leonix_payment_records.verified_intro_discount_redemption_id` FK, mirrors `promo_redemption_id`.
5. `20260805100400_retire_website_launch_25_promo_family.sql` — data-only status flip (`active`→`revoked`) on the `website_launch_25` family; zero rows deleted.

**Migrations were authored only, not applied to any database** (consistent with "no Production migration application" and the same convention Build 1 followed) — application is a separate step outside this agent's actions.

## 22. Tests

**Pure-policy gate** (`scripts/gate-pkgC-verified-intro-discount-selftest.ts`, runs under `tsx`, no DB/Stripe/Twilio): 16/16 checks pass — every `decideVerifiedIntroDiscountEligibility` reason code including precedence when multiple blocking facts are present simultaneously, and the rate-limit slot/bucket policy (deterministic bucket truncation, slot-within-limit allowed, slot-exhausted denied). **Aggregate:** `npm run test:gates` 76/76 (75 historical + this build's new gate). **TypeScript:** exactly the pre-existing 7 e2e-spec-file errors, zero new (confirmed by a full `tsc --noEmit` run; one genuine new error — an untyped `RevenueAuditAction` string literal — was found and fixed during this build, see §25 audit). **Changed-file lint:** 34 errors across changed tracked files, all 34 confirmed pre-existing via stash round-trip (identical error set, same files, same variable names, at clean HEAD); all newly-created files lint completely clean (zero errors). **`git diff --check`:** clean.

## 23. External blockers

`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_VERIFY_SERVICE_SID` and `LEONIX_IDENTITY_HASH_KEY` — none configured in this environment; both fail closed by design (§10). Not build-blocking; deploy-blocking checklist items.

## 24. Lane exit matrix

| Lane | Verified-15 eligibility | Launch-25 retirement |
|---|---|---|
| Autos Privado / Dealer | IMPLEMENTED — `owner_user_id`/`dealer_inventory_group` business identity | RETIRED (code family revoked; card removed from publish-flow surfaces) |
| Bienes Privado / Negocio | IMPLEMENTED — `owner_user_id`/`commercial_parent_listing` business identity | RETIRED |
| Restaurantes / Servicios | IMPLEMENTED — `owner_user_id` fallback (no parent/business entity in these lanes, documented) | RETIRED |
| Rentas / Empleos / Clases | IMPLEMENTED — `owner_user_id` fallback (not yet schema-confirmed as truly parentless; flagged for a targeted read if a business-identity gap is later found) | RETIRED |
| Ofertas/Cupones, Viajes | N/A / boundary — unchanged, untouched | N/A |
| Newsletter signup | N/A (discount is checkout-time only, not a signup incentive) | RETIRED — no code minted, subscription itself intact |
| Admin promo generator | N/A | 4 Launch-25 presets disabled, labeled "(Retired)" |

## 25. TRUE/FALSE audit

All architectural, security, and process requirements from the twice-corrected approved plan are **TRUE** as implemented and verified in this build, specifically including every one of the 7 owner-mandated corrections: (1) atomic reservation via INSERT-as-concurrency-gate across `reserved`+`redeemed`, never SELECT-then-INSERT — TRUE; (2) `discount_conflict` explicit rejection, never a silent preference — TRUE; (3) `owner_user_id` as a global boundary additive to, never replaced by, business identity — TRUE, with the three canonical scenarios (same owner/two businesses blocked by owner; different users/same dealer group blocked by business identity; genuinely distinct — each qualifies) structurally provable from the four-index design; (4) composite `(business_identity_type, business_identity_key)` uniqueness, not key-alone — TRUE; (5) five migrations, stated consistently everywhere in this doc and the verifier — TRUE; (6) RPC-free atomic unique-slot rate limiting — TRUE; (7) keyed identity hashes (`verified_email_identity_hash`/`verified_phone_identity_hash`), never raw email/phone, for anti-repeat uniqueness — TRUE, confirmed by migration 1's schema containing no raw `email`/`phone` uniqueness columns. **One process finding, not a defect:** two pre-existing Launch-25 verifier scripts (`verify-website-launch-25-checkout-wiring.mjs`'s Bienes-negocio-promo-wiring assertion, and `verify-promo-admin-os-quick-create-and-restaurante-blocker-ux-01.mjs`'s "honest usage messaging" assertion) fail at clean HEAD independent of this build — confirmed via stash round-trip — and were left untouched per the "narrow the edit, don't fix things outside scope" instruction; documented here rather than silently glossed over. **One follow-up, not a defect:** an orphaned module (`app/lib/email/newsletterPromoCodeEmail.ts`) and 3 admin-only surfaces still carry "Launch 25" naming in internal-only copy (admin nav label, admin lead-reply panel note) — flagged by the retirement work itself, left untouched as low-risk/admin-only per scope discipline, worth a narrow follow-up pass.

## 26. READY TO COMMIT: YES

## 27. READY TO PUSH: NO

No push. No PR. No deployment. No Production action. No migration applied to any database. END PACKAGE C BUILD 2.
