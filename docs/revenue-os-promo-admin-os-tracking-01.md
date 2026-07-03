# REVENUE-OS-PROMO-ADMIN-OS-TRACKING-01

## 1. Executive Summary

This gate upgrades `/admin/workspace/promo-codes` from a raw promo-code creator into a **Leonix Promo Admin OS**. Admins can see what codes exist, what discount and scope each applies, who codes were assigned to, who actually used them (when payment data exists), leak-control flags, and quick revoke — without touching public Cupones CMS, checkout math, or webhook redemption logic.

## 2. Why Admin Promo OS Needed

The live admin page still read like a lifecycle-only form with stale copy (“No public redemption or Stripe Checkout”) even after Revenue OS checkout validation and webhook redemption were wired. Chuy needed one place to answer operational questions about promo codes, usage, payments, and leak control.

## 3. Current Problems Seen in the Screenshot

- Stale copy implying promos cannot be used in checkout.
- Discount workflow buried; Entitlement-first feel.
- No summary cards for active / used / expiring / attention codes.
- Rows lacked discount summary, package scope, assigned tracking fields, and usage ledger.
- No non-blocking mismatch flags for assigned/private codes.
- No safe links to payment tracker or published ads.

## 4. Promo Code vs Public Cupones/Ofertas

| System | Purpose |
|--------|---------|
| **Promo code (this page)** | Advertiser checkout discount and attribution for Leonix Revenue OS payment. |
| **Public Cupones CMS** | Customer-facing coupon content at `/admin/workspace/cupones`. |
| **Ofertas Locales CMS** | Customer-facing local offers. |

These are separate systems. Do not conflate them in admin or checkout.

## 5. Public Launch Code vs Assigned Private Code

**Public launch code** (e.g. `RESTO-LAUNCH-25-V2`):

- Not tied to one exact business.
- Validated by active status, dates, category/package scope, discount, max redemptions.
- Usage tracked after checkout + webhook.

**Assigned/private code** (e.g. `TACOS-LAUNCH-25`):

- Stores assigned customer/business/email/sales rep for tracking and attribution.
- Does **not** hard-block checkout if business name differs slightly.
- Admin flags mismatch when both assigned and actual usage data exist.

## 6. Validation Rules

- Server-owned via `POST /api/revenue-os/promo/validate` and checkout revalidation.
- Category and package scope enforced from `leonix_promo_codes` columns (`category_scope`, `package_scope`).
- Discount resolved from `percent_off` / `amount_off_cents` columns or legacy metadata — never inferred from code text.
- Client Apply is preview only; no redemption on Apply.

## 7. Tracking Rules

- Admin create stores: `promo_type`, `percent_off`, `amount_off_cents`, `category_scope`, `package_scope`, customer/business/email, sales rep, metadata.
- Usage ledger reads `leonix_promo_code_redemptions` joined to `leonix_payment_records`.
- `redemption_count` increments on webhook redeem (prior gate).
- Payment tracker filter: `/admin/workspace/payment-tracker?promo_code=` or `?q={paymentId}`.

## 8. Why Business Name Is Not A Hard Checkout Match

Business names are typed differently in checkout vs admin assignment. Hard-blocking would reject legitimate payments. Instead:

- Assigned fields are **tracking only**.
- After paid usage, admin compares assigned vs actual business/email and shows non-blocking mismatch badges.
- Revocation remains the primary leak-control action.

## 9. Usage Ledger Behavior

Each promo row shows a **Usage** block:

- If redemptions/payments exist: business, email, listing ID, Leonix Ad ID, payment record ID, truncated Stripe session, payment status, webhook redeemed yes/no, discount/final amount, safe CTAs.
- If none: **“No linked paid usage yet.”**
- Published ad CTA only when Restaurante listing is `published` with resolvable slug and payment is `paid` + redemption `redeemed`.
- No raw Stripe/Supabase JSON in UI.

### Data snapshot gaps (follow-up)

If redemption rows exist but payment metadata is incomplete, some fields may show `—`. Deeper promo snapshot projection on payment records is tracked as **REVENUE-OS-PROMO-USAGE-SNAPSHOT-WEBHOOK-01** if needed.

## 10. Leak-Control Behavior

Non-blocking admin flags:

- Missing discount value (discount type codes)
- Expiring soon (14 days)
- Max redemptions reached / nearly reached
- Assigned business differs from used business (both values required)
- Assigned email differs from checkout email (both values required)

Revoke action preserved on active codes.

## 11. Stale Copy Updated

Removed/ replaced:

- ~~“No public redemption or Stripe Checkout.”~~

New copy:

- Title: **Promo codes**
- Subtitle: Admin-only Revenue OS promo-code manager. Not the public Cupones CMS.
- Helper: Promo codes are validated by Revenue OS checkout. Redemption is finalized only after successful Stripe webhook payment.
- Important box explains promo vs Cupones/Ofertas, scoped validation, webhook truth, leak control.

## 12. Files Inspected

- `app/admin/(dashboard)/workspace/promo-codes/page.tsx`
- `app/admin/(dashboard)/workspace/promo-codes/actions.ts`
- `app/admin/_lib/promoCodeData.ts`
- `app/admin/_lib/promoCodeConstants.ts`
- `app/lib/listingPlans/revenuePromoRedemptions.ts`
- `app/lib/listingPlans/revenuePaymentRecords.ts`
- `app/lib/listingPlans/promoCodeLifecycle.ts`
- `app/api/revenue-os/promo/validate/**`
- `app/admin/(dashboard)/workspace/payment-tracker/**`
- Supabase migrations (read-only): `leonix_promo_codes`, `leonix_promo_code_redemptions`, `leonix_payment_records`

## 13. Files Changed

- `app/admin/_lib/promoCodeData.ts` — OS summary, attention flags, usage ledger fetch, discount helpers
- `app/admin/(dashboard)/workspace/promo-codes/page.tsx` — Admin OS UI, copy, cards, rows, usage ledger
- `docs/revenue-os-promo-admin-os-tracking-01.md` — this document
- `scripts/verify-revenue-os-promo-admin-os-tracking-01.mjs` — gate verifier
- `package.json` — verifier script entry

## 14. Data Sources Used

| Source | Fields |
|--------|--------|
| `leonix_promo_codes` | code, status, discount columns, scopes, assignment, redemption_count, dates |
| `leonix_promo_code_redemptions` | status, redeemed_at, discount_cents, listing_id, leonix_ad_id, payment_record_id, stripe_checkout_session_id |
| `leonix_payment_records` | payment_status, customer_email, business_name, amounts, promo_code |
| `restaurantes_public_listings` | slug + status for published ad URL |

## 15. Data Sources Missing

- Cross-category published ad URL resolver (only Restaurantes slug lookup implemented).
- Attention filter server-side does not preload usage ledger for mismatch (row-level flags work when viewing list).
- Usage ledger pending payment snapshot integration for richer promo metadata on older payments — **REVENUE-OS-PROMO-USAGE-SNAPSHOT-WEBHOOK-01**.

## 16. What This Gate Does Not Do

- Does not touch public Restaurante checkout UI (except read-model for ad links).
- Does not change Stripe checkout math or webhook redemption logic.
- Does not touch public Cupones / Ofertas Locales CMS.
- Does not hard-block checkout by business name.
- Does not invent fake usage, paid status, or published ad links.
- No destructive migrations, no `.env` changes, no live Stripe mode.

## 17. Manual QA Checklist

- [ ] Open `/admin/workspace/promo-codes`
- [ ] Confirm stale “No public redemption or Stripe Checkout” language is gone
- [ ] Confirm Discount is default/easy workflow (`defaultValue="discount"`)
- [ ] Confirm discount fields visible (type, percent, amount, package scope)
- [ ] Confirm package scope helper shows `restaurantes_base_monthly`
- [ ] Confirm assigned business/customer fields say tracking only
- [ ] Confirm summary cards show real counts
- [ ] Confirm `RESTO-LAUNCH-25` shows missing discount metadata if applicable
- [ ] Create `RESTO-LAUNCH-25-V2` with 25% and `restaurantes_base_monthly`
- [ ] Confirm recent code row shows 25% off
- [ ] Confirm row shows category/package scope
- [ ] Confirm usage area says “No linked paid usage yet” if no completed payment
- [ ] Complete Restaurante sandbox payment with promo if available
- [ ] Confirm usage appears after webhook only if data is stored
- [ ] Confirm View ad/payment CTAs appear only when safe
- [ ] Confirm Revoke still works
- [ ] Confirm no public Cupones CMS was changed

## 18. Next Recommended Gates

1. **REVENUE-OS-PROMO-USAGE-SNAPSHOT-WEBHOOK-01** — richer promo snapshot on payment records + cross-category ad URL resolver.
2. **REVENUE-OS-PROMO-ADMIN-FILTERS-USAGE-01** — attention filter with usage ledger preload for mismatch.
3. **REVENUE-OS-PROMO-ASSIGNED-CODE-REPORT-01** — export/report for sales rep attribution.
