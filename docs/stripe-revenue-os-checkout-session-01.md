# Stripe Revenue OS Checkout Session 01

Gate: `STRIPE-REVENUE-OS-CHECKOUT-SESSION-01`  
Date: 2026-07-01  
Scope: sandbox Stripe Checkout Session creation + pending payment/promo records. No webhooks, no entitlement activation, no live payment confirmation.

## 1. Executive Summary

This gate wires the **central Leonix Revenue OS Checkout** path at `POST /api/revenue-os/checkout`. Paid packages derive price from `revenuePricingMatrix.ts` only — client-supplied amounts are never trusted. The route creates a **pending** `leonix_payment_records` row, optional **pending** `leonix_promo_code_redemptions` row, then a Stripe Checkout Session (test/sandbox key via `STRIPE_SECRET_KEY`).

**This gate does not:** activate listings, create placement entitlements, mark payments paid, or process webhooks.

## 2. Repo Baseline

Clean git tree at gate start unless unrelated work appears later. Gate files only under allowed paths.

## 3. Env Readiness

| Variable | Role | Client exposure |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server Stripe SDK | NEVER |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Future client Stripe.js | Public only |
| `NEXT_PUBLIC_SUPABASE_URL` | DB | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Pending record writes | Server only |

Route returns `503 stripe_not_configured` if `STRIPE_SECRET_KEY` missing.  
Route returns `503 supabase_not_configured` if service role missing.

**Vercel:** Production and Preview have publishable + secret keys per owner report.

## 4. API Route Contract

**POST** `/api/revenue-os/checkout`

**Success (200):**
```json
{
  "ok": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "paymentRecordId": "uuid",
  "stripeCheckoutSessionId": "cs_test_...",
  "amountCents": 2499,
  "currency": "usd",
  "mode": "payment"
}
```

**Error:** `{ "ok": false, "code": "...", "message": "..." }`

## 5. Checkout Request Contract

| Field | Required | Notes |
|---|---|---|
| `category` | Yes | Must match matrix category |
| `packageKey` | Yes | Canonical Revenue OS key |
| `listingId` or `listingDraftId` | One required | Listing reference |
| `leonixAdId` | No | Optional ad id |
| `ownerUserId` | No | Falls back to Bearer token |
| `customerEmail` | No | Passed to Stripe if set |
| `promoCode` | No | Server-validated |
| `locale` | No | `es` \| `en` for return URLs |
| `returnPath` | No | Appended to success URL |

**Never accepted as trusted:** `amountCents`, `price`, `stripeMode`, `currency`.

## 6. Package Eligibility Rules

Derived from `REVENUE_V1_PACKAGE_MATRIX` + `stripeEligible` flag.

**Supported paid examples:**
- `autos_privado_30d`
- `autos_dealer_monthly`
- `br_agent_monthly`
- `rentas_30d` (canonical Rentas paid key)
- `empleos_job_post_paid`
- `servicios_base_monthly`
- `restaurantes_base_monthly`

**Rejected:**
- All `billingMode: free` packages
- `stripeEligible: false`
- Unknown keys / category mismatch

## 7. Empleos Two-Pipeline Protection

| Pipeline | Key | Checkout |
|---|---|---|
| Publicar empleo | `empleos_job_post_paid` | Allowed ($24.99) |
| Publicar feria | `empleos_job_fair_free` | **Rejected** (`422`) |

## 8. Rentas Paid Package Handling

Canonical matrix key: **`rentas_30d`** — $24.99, one_time, 30 days, Stripe + promo eligible.  
Do not invent `rentas_30d_paid` as a second key; Revenue OS matrix is source of truth.

## 9. Promo Code Handling

1. Load `leonix_promo_codes` by code (server)
2. Validate via `promoCodeRules.validatePromoEligibility`
3. Compute discount (`percent_off`, `amount_off`, comp types)
4. If final amount = 0 → `422 CHECKOUT_NOT_REQUIRED_COMP_REQUIRES_NEXT_GATE`
5. Else create pending redemption + attach to payment record
6. **Not marked redeemed** until webhook gate

## 10. Pending Payment Record Flow

1. Insert `leonix_payment_records` with `payment_status: pending`, `source: stripe_checkout`
2. Create Stripe session
3. Update row with `stripe_checkout_session_id`
4. **Idempotency:** each Checkout attempt creates a new pending row (auditable retries)

## 11. Stripe Metadata Contract

Uses `buildStripeCheckoutMetadataPayload()` — keys include `leonix_category`, `leonix_package_key`, `leonix_payment_record_id`, `leonix_listing_id`, promo ids when present.  
Also set on `payment_intent_data.metadata` (payment mode) or `subscription_data.metadata` (subscription mode).

## 12. Success/Cancel URL Contract

- Success: `/revenue-os/pago/exito?session_id={CHECKOUT_SESSION_ID}&category=...&package_key=...`
- Cancel: `/revenue-os/pago/cancelado?category=...&package_key=...&listing_id=...`

Landing pages may be added in a later UX gate; URLs are valid return targets for Stripe.

## 13. Security Notes

- `STRIPE_SECRET_KEY` never in client bundle, docs, or logs
- Amount derived from matrix only
- `allow_promotion_codes: false` (Leonix promo DB, not Stripe-native promos in V1)
- Service role required for DB writes
- RLS on revenue tables — server path only

## 14. What This Gate Does Not Activate

- No webhook handler
- No `payment_status: paid`
- No `leonix_placement_entitlements` creation
- No listing publish/activation
- No package entitlement activation
- No promo `redeemed` status

## 15. Manual Sandbox QA Plan

1. POST empleos_job_post_paid → expect `checkoutUrl` + pending payment row
2. POST empleos_job_fair_free → expect 422 rejection
3. POST comunidad_free → expect rejection
4. POST rentas_30d → expect checkout if env configured
5. Verify Supabase pending row has `stripe_checkout_session_id` after success
6. Complete payment in Stripe test mode → **no auto-activation until webhook gate**

## 16. Next Gate: Webhook Fulfillment

**`STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01`** — `checkout.session.completed` → mark paid, finalize redemption, activate entitlements, audit log.

## 17. Final Recommendation

Deploy with sandbox keys, run manual POST smoke tests on Preview, then implement webhook gate before any live charges or public publish activation tied to payment.
