# Stripe Payment Tracker Model

**Gate G1.6I-STACK — global payment tracker foundation; no payment collection in this gate**

This document defines the **global Stripe payment tracker** for Leonix monetization.

**Code:** `app/lib/listingPlans/paymentTracking.ts` (pure helper), `app/admin/_lib/paymentTrackerData.ts` (admin data helper)

**Admin UI:** `/admin/workspace/payment-tracker`

**Migration:** `supabase/migrations/20260526120000_leonix_payment_records.sql`

**Table:** `public.leonix_payment_records`

**Related:** [`pricing-promo-code-sales-model.md`](./pricing-promo-code-sales-model.md), [`promo-code-lifecycle-model.md`](./promo-code-lifecycle-model.md), [`package-entitlement-model.md`](./package-entitlement-model.md), [`sales-rep-dashboard-model.md`](./sales-rep-dashboard-model.md), [`entitlement-redemption-attachment-model.md`](./entitlement-redemption-attachment-model.md)

---

## 1. Stripe Checkout is global

The payment tracker is designed to support **all monetized categories**, not just one. Supported categories:

- servicios
- restaurantes
- autos
- bienes-raices
- rentas
- en-venta (separate model)
- empleos / viajes (deferred)
- clases / comunidad (not client-ready)

**Stripe Checkout is preferred over Payment Links** because Checkout supports controlled metadata and webhook-based entitlement/payment tracking.

---

## 2. Payment tracker links

Each payment record in `leonix_payment_records` links to:

- `package_entitlement_id` — FK to `listing_package_entitlements`
- `promo_code_id` — FK to `leonix_promo_codes`
- `promo_code` — text for quick display
- `sales_rep_id` / `sales_rep_name` — sales attribution
- `category` / `listing_source` / `listing_id` — listing context
- `package_tier` / `contract_term` — package context
- `stripe_checkout_session_id` / `stripe_payment_intent_id` — Stripe linkage

---

## 3. Webhook will create/update records later

In this gate, payment records are empty or manually created. In a later gate:

1. Stripe Checkout session creates a `leonix_payment_records` row with `source = 'stripe_checkout'`
2. Stripe webhook (`checkout.session.completed`) updates `payment_status` to `paid` or `succeeded`
3. Webhook updates `amount_paid_cents`, `paid_at`, and Stripe fields
4. Commission eligibility is recalculated after payment clears

Future checkout metadata keys:
- `package_entitlement_id`
- `promo_code_id`
- `promo_code`
- `category`
- `listing_source`
- `listing_id`
- `package_tier`
- `contract_term`
- `sales_rep_id`
- `sales_rep_name`

---

## 4. Commission becomes eligible only after payment clears

Commission eligibility rules (from `paymentTracking.ts`):

- Payment must be in `paid` or `succeeded` status
- `sales_rep_id` must exist
- Payment must NOT be refunded, disputed, or canceled
- If payment is `pending`, `unpaid`, or `failed` → commission is NOT eligible

No commission payout logic exists in this gate. Commission amounts are **informational estimates only**.

---

## 5. Payment status model

| Status | Meaning |
|--------|---------|
| pending | Created, not yet charged |
| unpaid | Invoice unpaid |
| paid | Payment confirmed |
| succeeded | Stripe: payment succeeded |
| failed | Charge failed |
| canceled | Checkout or subscription canceled |
| refunded | Full or partial refund |
| disputed | Chargeback or dispute |
| requires_action | 3D Secure or additional verification |
| unknown | Unmapped state |

Cleared statuses: `paid`, `succeeded`

---

## 6. Explicitly later gates

| Capability | Gate |
|------------|------|
| Stripe Checkout session creation | G2+ |
| Stripe webhook integration | G2+ |
| Commission payout ledger | After payment integration |
| Payroll processing | Not in Leonix scope |
| Public redemption | After checkout integration |
| Public ranking / Servicios sorting | Category visibility gates |
| Sales rep self-service dashboard | After role system |

---

## 7. No payment collection in this gate

The admin payment tracker page at `/admin/workspace/payment-tracker` is read-only. It:

- Does NOT collect payments
- Does NOT create Stripe Checkout sessions
- Does NOT process refunds
- Does NOT activate public checkout buttons
- Shows empty state until migration is applied and records exist

---

## 8. No public ranking in this gate

Payment tracker is admin-only. No changes to:

- Public Servicios ranking — **applied in Gate G2-SERVICIOS** via `serviciosVisibilityRanking.ts`; Stripe/payment is NOT required for ranking to work; ranking uses entitlement fields only
- Public search results sorting (Stripe activation remains later)
- Homepage Destacados
- Category landing Destacados
- Results-page Destacados

---

## 9. Verification

```bash
npm run verify:stripe-payment-tracker-foundation
```

Manual QA:
- https://www.leonixmedia.com/admin/workspace/payment-tracker
- https://www.leonixmedia.com/admin/workspace/sales-tracker
- https://www.leonixmedia.com/admin/workspace/promo-codes
- https://www.leonixmedia.com/admin/workspace/package-entitlements
