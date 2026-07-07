# Leonix Promo Code Lifecycle Model

**Gate G1.6F-STACK — admin lifecycle + Supabase table; no public redemption**

This document defines how **promo codes** are tracked separately from **package entitlements** and from the public **Cupones CMS**.

**Code:** `app/lib/listingPlans/promoCodeLifecycle.ts`, `app/lib/listingPlans/packagePricingRules.ts`, `app/admin/_lib/promoCodeData.ts`

**Admin UI:** `/admin/workspace/promo-codes`

**Table:** `public.leonix_promo_codes` (migration `20260522120000_leonix_promo_codes.sql`)

**Related:** [`package-entitlement-model.md`](./package-entitlement-model.md), [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md), [`entitlement-redemption-attachment-model.md`](./entitlement-redemption-attachment-model.md) (G1.6G — attach-to-listing + user dashboard read model), [`sales-rep-dashboard-model.md`](./sales-rep-dashboard-model.md) (G1.6H — sales rep tracker + owner dashboard), [`stripe-payment-tracker-model.md`](./stripe-payment-tracker-model.md) (G1.6I — global payment tracker), [`admin-sales-rep-access-model.md`](./admin-sales-rep-access-model.md) (ADMIN-ROLES-SALES — sales rep scoped promo admin)

**Sales rep access (ADMIN-ROLES-SALES):** Roster role `sales_rep` + `ADMIN_OPERATOR_EMAIL` scopes the promo codes UI and mutations to own `sales_rep_id`. Owner/admin retains full list and manual rep override. No public redemption or Stripe Checkout in this gate.

---

## 1. Promo code vs package entitlement

| Concept | Role |
|---------|------|
| **Promo code** | Discount, payment attribution, sales rep tracking, newsletter/SMS signup handles. May link to an entitlement row but does not alone grant visibility. |
| **Package entitlement** | Duration-based visibility/access contract for a category/listing/package tier. |
| **Cupones CMS** | Public marketing coupon content at `/cupones` — separate from Leonix monetization codes. |

A single string (e.g. `LX-ENT-…`) may appear as both entitlement handle and promo row when created from the package generator; the models remain distinct.

---

## 2. Admin-only lifecycle (G1.6F)

- Staff create, search, filter, and **revoke** promo rows in Admin.
- **No hard delete** — revoke sets `status = revoked`, `revoked_at`.
- **No public redemption endpoint** in this gate.
- **No Stripe Checkout** or payment collection.
- **No commission payout table** — commission remains preview-only in metadata.

---

## 3. Status values

| Status | Meaning |
|--------|---------|
| `draft` | Not yet redeem-ready |
| `active` | Operational within date window |
| `expired` | Past `ends_at` (effective status may derive from dates) |
| `revoked` | Admin cancelled |
| `redeemed` | Redemption limit reached or manually marked (future public redemption updates count) |

`resolveEffectivePromoCodeStatus()` in `promoCodeLifecycle.ts` derives display status from stored status, dates, and `redemption_count` / `max_redemptions`.

---

## 4. Code types

Aligned with `LeonixPromoCodeType` in `packagePricingRules.ts`:

- `entitlement`, `discount`, `newsletter`, `sms`, `sales_rep`, `contract`, `founding_partner`, `owner_override`, `unknown`

`resolvePromoCodeRule()` drives Admin preview: non-stackable, one-time use, owner approval, subscriber identity, payment discount, entitlement creation capabilities.

---

## 5. Non-stackable codes

- `non_stackable` defaults to `true` on all rows.
- Only one active discount rule should win at checkout (future Stripe gate).

---

## 6. Newsletter / SMS

- Types `newsletter` and `sms`: per-subscriber unique codes with identity (email/phone).
- Admin create requires `customer_email` (newsletter) or `customer_phone` (sms).
- **Public newsletter signup is active:** `POST /api/newsletter/subscribe` creates/reuses one active `newsletter` code per email and emails it via Resend.
- **Promo family `website_launch_25`:** public Launch 25 offer for eligible **website checkout only** — not print, not magazine combos, not manual contracts. Metadata: `promo_family`, `capture_channel`, `eligible_channel: stripe_website_checkout`, `website_checkout_only`, `print_combo_excluded`.
- Marketing surfaces: `/newsletter`, signup login, dashboard home, profile onboarding (`LeonixLaunchCouponCard`).
- SMS sending remains inactive (admin metadata readiness only).
- See [`newsletter-promo-code-readiness.md`](./newsletter-promo-code-readiness.md).

---

## 7. Sales rep attribution

- `sales_rep_id`, `sales_rep_name` on `leonix_promo_codes`.
- Commission **estimates** stay in entitlement/promo metadata via G1.6D helpers — payout ledger is later.

---

## 8. Customer identity

- `customer_email`, `customer_phone`, `customer_name`, `business_name` support pre-redemption tracking and future subscriber-linked codes.

---

## 9. Package entitlement linkage

When a package entitlement is created with `entitlement_code`, `upsertPromoCodeFromPackageEntitlement()` best-effort inserts/updates a `leonix_promo_codes` row:

- `code` = entitlement code
- `package_entitlement_id` = entitlement UUID
- `metadata.source` = `package_entitlement_generator`

If the promo table is missing, entitlement creation **still succeeds**; `metadata.promo_code_link_gap` records the gap.

---

## 10. Explicitly later gates

| Capability | Gate |
|------------|------|
| Public customer redemption | G1.6G+ |
| Stripe Checkout / Payment Links | G1.6H+ |
| Sales rep dashboard UI | G1.6H+ |
| Commission payout ledger | After payment clears |
| Servicios public ranking from entitlements | Separate visibility gates |
| Public sorting / Destacados on category pages | Not G1.6F |

---

## 11. Verification

```bash
npm run verify:admin-promo-code-lifecycle
```

Manual QA:

- https://www.leonixmedia.com/admin/workspace/promo-codes
- https://www.leonixmedia.com/admin/workspace/package-entitlements
- https://www.leonixmedia.com/admin/workspace/cupones (unchanged CMS)
