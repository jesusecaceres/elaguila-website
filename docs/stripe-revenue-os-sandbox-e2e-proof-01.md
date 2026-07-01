# STRIPE-REVENUE-OS-SANDBOX-E2E-PROOF-01

Gate: live production sandbox end-to-end proof for Leonix Revenue OS Stripe loop.  
Date: 2026-07-01  
Mode: **test/sandbox only** — no live Stripe mode, no real cards.

## 1. Executive Summary

This gate **proved the full sandbox Revenue OS loop in production** after Vercel had `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and a green redeploy, and Stripe Dashboard had the webhook endpoint configured.

**Primary paid proof:** `rentas` / `rentas_30d` — Checkout created → sandbox card payment completed → webhook fulfilled → payment paid → entitlements active → audit log written.

**Validation-only:** `empleos_job_post_paid` Checkout creation (pending record, no payment completion in this gate).

**Rejection proof:** `empleos_job_fair_free` and `comunidad_free` rejected at Checkout with no DB rows.

**Deferred in this gate:** promo E2E, expired session E2E, webhook event resend idempotency (documented honestly below).

## 2. Repo Baseline

At gate start:

```text
git status --short   → clean (no output)
git diff --name-only → clean
git diff --cached --name-only → clean
```

Gate files only: this doc, verifier script, smoke helper, `package.json` script entries.

## 3. Production/Vercel Env Readiness

| Check | Result |
|-------|--------|
| Production checkout route responds | `GET /api/revenue-os/checkout` → **405** (safe method rejection) |
| Production webhook route responds | `GET /api/revenue-os/webhook` → **405** (safe method rejection) |
| `POST /api/revenue-os/checkout` creates session | **PASS** — `ok: true`, `checkoutUrl`, `paymentRecordId`, `stripeCheckoutSessionId` |
| Owner-reported Vercel env | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` configured; production redeployed green |

No secrets printed or stored in repo.

## 4. Stripe Webhook Endpoint Readiness

| Item | Value |
|------|-------|
| Endpoint URL | `https://leonixmedia.com/api/revenue-os/webhook` |
| Events | `checkout.session.completed`, `checkout.session.expired` |
| Delivery proof | Inferred from successful fulfillment + `stripe_event_id` on payment record (see §7–8) |
| Safe event id (from DB metadata) | `evt_1ToXhFRxP2tafN4zHRJBZabt` |

Stripe Dashboard 2xx delivery was not screenshotted in this gate; fulfillment success confirms webhook returned success to Stripe.

## 5. Checkout Creation Proof

### Payload A — Rentas (primary)

```json
{
  "category": "rentas",
  "packageKey": "rentas_30d",
  "listingId": "stripe_e2e_test_rentas_002",
  "leonixAdId": "STRIPE-E2E-RENTAS-002",
  "returnPath": "/clasificados/rentas"
}
```

**Response:** `ok: true`, `amountCents: 2499`, `mode: payment`, `currency: usd`  
**IDs:** `paymentRecordId: c5969e37-62f5-4400-8dfa-561166bd1960`, `stripeCheckoutSessionId: cs_test_a1OxJHgt4z4440OcsA6njBGSqTLjRRAH0AxbxeTdsPxvzrcZOOMcvZsES2`

**Before payment:** `leonix_payment_records.payment_status = pending`, `package_entitlement_id = null`.

### Payload B — Empleos (validation-only)

```json
{
  "category": "empleos",
  "packageKey": "empleos_job_post_paid",
  "listingId": "stripe_e2e_test_empleos_001",
  "leonixAdId": "STRIPE-E2E-EMPLEOS-001",
  "returnPath": "/clasificados/empleos"
}
```

**Response:** `ok: true`, `amountCents: 2499`, `mode: payment`  
**IDs:** `paymentRecordId: 7f7f1559-d3d2-4ccb-b01c-0e8d76ada9e7` — remains **pending** (Checkout created; payment not completed in this gate).

## 6. Sandbox Payment Completion Proof

| Item | Value |
|------|-------|
| Checkout session | `cs_test_a1OxJHgt4z4440OcsA6njBGSqTLjRRAH0AxbxeTdsPxvzrcZOOMcvZsES2` |
| Test card | `4242 4242 4242 4242` (Stripe test mode) |
| Expiration | `12/34` |
| CVC | `123` |
| Real card used | **No** |
| Live mode | **No** |

Payment completed in Stripe Checkout sandbox UI. Browser redirected to success URL (Vercel SSO login on preview success host — see §17); **webhook fulfillment succeeded regardless**.

## 7. Webhook Delivery Proof

Payment record after fulfillment:

| Field | Value |
|-------|-------|
| `payment_status` | `paid` |
| `source` | `stripe_webhook` |
| `stripe_checkout_session_id` | `cs_test_a1OxJHgt4z4440OcsA6njBGSqTLjRRAH0AxbxeTdsPxvzrcZOOMcvZsES2` |
| `stripe_payment_intent_id` | `pi_3ToXhCRxP2tafN4z1aHxPF4N` |
| `paid_at` | `2026-07-01T23:37:38.875+00:00` |
| `metadata.stripe_event_id` | `evt_1ToXhFRxP2tafN4zHRJBZabt` |
| `metadata.stripe_event_type` | `checkout.session.completed` |

Webhook must have returned **2xx** for Stripe to mark delivery succeeded and for this row to update.

## 8. Payment Record Proof

- Pending → paid transition confirmed for `c5969e37-62f5-4400-8dfa-561166bd1960`
- Category/package: `rentas` / `rentas_30d`
- Amount: `2499` cents
- No fake paid status — tied to verified Stripe session + payment intent

## 9. Promo Redemption Proof

**PROMO E2E NOT RUN** in this gate.

No promo code was applied to the primary Rentas Checkout. Promo fulfillment deferred to **Admin/User Revenue Proof** gate.

## 10. Entitlement Activation Proof

### `listing_package_entitlements`

| Field | Value |
|-------|-------|
| `id` | `afcc90f7-ab0e-40da-84e0-7b0034a87eea` |
| `category` | `rentas` |
| `package_key` | `rentas_30d` |
| `package_tier` | `digital_only` |
| `status` | `active` |
| `starts_at` | `2026-07-01T23:37:39.529+00:00` |
| `ends_at` | `2026-07-31T23:37:39.529+00:00` (30-day window) |
| `payment_record_id` | `c5969e37-62f5-4400-8dfa-561166bd1960` |
| `metadata.source` | `stripe_webhook` |

Exactly **1** entitlement row linked to this payment record (idempotency baseline).

## 11. Placement Entitlement Safety Proof

| Field | Value |
|-------|-------|
| `id` | `93e555bc-ec04-466c-9b3a-fa523b3ca98e` |
| `placement_tier` | `paid_private` (**safe** — not partner_premium or print) |
| `placement_source` | `stripe_paid` |
| `status` | `active` |
| `surfaces` | `clasificados`, `category_landing`, `category_results` |

No `partner_premium` or `print_*` tier created from normal Checkout.

## 12. Admin Audit Log Proof

| `action` | `target_id` | `event_id` |
|----------|-------------|------------|
| `revenue_payment_completed` | `c5969e37-62f5-4400-8dfa-561166bd1960` | `evt_1ToXhFRxP2tafN4zHRJBZabt` |
| `revenue_entitlement_activated` | `afcc90f7-ab0e-40da-84e0-7b0034a87eea` | `evt_1ToXhFRxP2tafN4zHRJBZabt` |

No `revenue_promo_redeemed` (promo not run). No secrets in audit `meta`.

## 13. Free Package Rejection Proof

### Empleos job fair

```json
{ "category": "empleos", "packageKey": "empleos_job_fair_free", "listingId": "stripe_e2e_test_job_fair_001" }
```

**Response:** `ok: false`, `code: package_not_stripe_eligible`  
**DB:** **0** `leonix_payment_records` for `stripe_e2e_test_job_fair_001`

### Comunidad free

```json
{ "category": "comunidad", "packageKey": "comunidad_free", "listingId": "stripe_e2e_test_comunidad_001" }
```

**Response:** `ok: false`, `code: package_not_stripe_eligible`  
**DB:** **0** payment records for that listing id

## 14. Empleos Two-Pipeline Proof

| Pipeline | Package key | Checkout | Webhook fulfill |
|----------|-------------|----------|-----------------|
| Publicar empleo (paid) | `empleos_job_post_paid` | **Created** — pending record `7f7f1559-…` | Not run (session unpaid) |
| Publicar feria (free) | `empleos_job_fair_free` | **Rejected** | N/A |

## 15. Expired Session Proof

**EXPIRED SESSION E2E NOT RUN** — waiting 24h or Stripe CLI expire not practical in this gate.

Code + prior verifier confirm `checkout.session.expired` handler exists in webhook route.

## 16. Idempotency Proof

**IDEMPOTENCY RESEND NOT RUN** — Stripe Dashboard event resend not performed in this gate.

Baseline: exactly **1** package entitlement for payment record `c5969e37-62f5-4400-8dfa-561166bd1960`. Webhook fulfillment code supports idempotent replay (prior gate).

## 17. Blockers

| Item | Severity | Notes |
|------|----------|-------|
| Success URL redirect | Low | After payment, browser hit Vercel SSO login on preview success host — success **page** not built / deployment protection on preview URL. **Webhook fulfillment unaffected.** |
| Promo E2E | Deferred | Next gate |
| Expired session E2E | Deferred | Optional manual Stripe Dashboard test |
| Webhook resend idempotency | Deferred | Optional Stripe Dashboard resend |

**No blocker prevents proving the full paid sandbox loop.**

## 18. Manual QA Notes

Re-run smoke helper:

```bash
npm run smoke:stripe-revenue-os-sandbox-e2e-01
```

For full paid loop: complete Checkout in browser with test card `4242…`, then verify Supabase rows match §7–12.

## 19. Next Gate: Admin/User Revenue Proof

- Owner/dashboard paid badges from entitlements
- Admin payment tracker live proof UI
- `/revenue-os/pago/exito` success page (display-only lookup)
- Optional promo E2E with safe test promo
- Fix success URL to production host (avoid preview SSO redirect)

## 20. Final Recommendation

**Sandbox Revenue OS is production-proven for paid Checkout → webhook → entitlement activation.** Safe to proceed to Admin/User Revenue Proof gate. Configure success/cancel pages on `leonixmedia.com` and resolve preview URL redirect for better post-checkout UX.
