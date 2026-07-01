# STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01

Gate: central Stripe webhook fulfillment for Leonix Revenue OS (sandbox/test mode).

## 1. Executive Summary

This gate wires the **central Revenue OS webhook** at `/api/revenue-os/webhook`. After a verified Stripe Checkout Session completes, the webhook:

- Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
- Marks `leonix_payment_records` from **pending → paid**
- Finalizes `leonix_promo_code_redemptions` from **pending → redeemed** (only after paid proof)
- Activates `listing_package_entitlements` for the purchased package
- Creates `leonix_placement_entitlements` only when placement rules allow (paid_private / website_business — never partner_premium or print tiers from basic checkout)
- Writes `admin_audit_log` events

Checkout creates **pending** records only. **No entitlement activation without verified webhook.**

## 2. Repo Baseline

Run before changes:

```bash
git status --short
git diff --name-only
git diff --cached --name-only
```

Unrelated dirty work may exist (Empleos / En Venta). This gate touches only Revenue OS webhook files under `app/api/revenue-os/webhook/` and `app/lib/listingPlans/revenue*`.

## 3. Webhook Route Contract

| Field | Value |
|-------|-------|
| Method | `POST` only |
| Path | `/api/revenue-os/webhook` |
| Runtime | `nodejs` |
| Body | Raw text (`request.text()`) — **never pre-parse JSON** |
| Header | `Stripe-Signature` required |
| Response | `{ received: true, ok: true }` on success; safe JSON on validation failure |

Production URL after deploy:

`https://leonixmedia.com/api/revenue-os/webhook`

## 4. Signature Verification

- Uses `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`
- Returns `503` if `STRIPE_WEBHOOK_SECRET` missing
- Returns `400` if signature missing or invalid
- Never logs secrets

## 5. Supported Stripe Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Full fulfillment (payment + promo + entitlements) |
| `checkout.session.expired` | Mark pending payment/promo expired/cancelled; no entitlements |
| Other events | `{ received: true, ignored: true }` — safe 200 |

## 6. Metadata Requirements

Required Stripe Checkout Session metadata (set by Checkout gate):

- `leonix_category`
- `leonix_package_key`
- `leonix_billing_mode`
- `leonix_payment_record_id` (or `client_reference_id`)

Optional:

- `leonix_owner_user_id`, `leonix_listing_id`, `leonix_ad_id`
- `leonix_placement_tier`, `leonix_promo_code_id`, `leonix_promo_redemption_id`

Rejected:

- Missing required metadata
- Unknown package key / category mismatch
- Free packages (`billingMode: free`, `priceCents: 0`)
- `empleos_job_fair_free` — **never fulfilled via Stripe**

## 7. Payment Record Fulfillment

1. Load `leonix_payment_records` by `stripe_checkout_session_id` or `leonix_payment_record_id`
2. Verify category + package_key match metadata and Revenue OS matrix
3. Verify package is Stripe-eligible and amount > 0
4. Verify Stripe `payment_status === paid` (subscriptions: complete + subscription id)
5. Verify `session.amount_total` matches pending record when present
6. Update:
   - `payment_status` → `paid`
   - `source` → `stripe_webhook`
   - Stripe IDs (`payment_intent`, `customer`, `subscription`)
   - `paid_at`, `amount_paid_cents`
   - metadata merge with event id/type

**Idempotent:** if already `paid`/`succeeded`, skip payment update; still ensure entitlements exist.

## 8. Promo Redemption Fulfillment

- Only after payment record is paid
- Only matching `stripe_checkout_session_id` and `payment_record_id`
- `pending` → `redeemed` with `redeemed_at`
- Idempotent if already `redeemed`
- Expired sessions: `pending` → `expired` (no fake redemption)

## 9. Entitlement Activation

Creates or idempotently reuses `listing_package_entitlements`:

- `category`, `listing_id`, `package_key`, `billing_mode`
- `package_tier`: `digital_only` (Revenue OS paid SKU — not print tier)
- `starts_at`: now; `ends_at`: duration from matrix (30d one-time; +30d initial window for monthly)
- `status`: `active`
- Links: `payment_record_id`, `promo_code_id`, `promo_redemption_id`
- metadata: `source: stripe_webhook`, event id/type, session id

## 10. Placement Entitlement Rules

Placement is created in `leonix_placement_entitlements` **only when safe**:

| Tier | From Stripe checkout? |
|------|----------------------|
| `paid_private` | Yes (empleos job post, clases, rentas private one-time) |
| `website_business` | Yes (monthly business packages) |
| `affiliate` | Yes if matrix assigns |
| `partner_premium` | **No** — admin/print contract only |
| `print_*` tiers | **No** — print contract only |
| `free` | **No** |

Source: `stripe_paid`. Linked via `stripe_payment_record_id`.

Rentas (`rentas_30d`): placement eligible → `paid_private` inferred for one-time private seller.

## 11. Admin Audit Log Events

Written to `admin_audit_log` (non-blocking on failure):

| Action | When |
|--------|------|
| `revenue_payment_completed` | Payment marked paid |
| `revenue_payment_expired` | Session expired, payment canceled |
| `revenue_promo_redeemed` | Promo redemption finalized |
| `revenue_entitlement_activated` | Package entitlement created |
| `revenue_webhook_ignored` | Non-Revenue OS session |
| `revenue_webhook_validation_failed` | Metadata/amount/paid validation failed |

## 12. Idempotency Rules

- Payment: skip update if already paid; match by `payment_record_id` + status
- Promo: skip if already redeemed
- Package entitlement: reuse if `payment_record_id` already has active row
- Placement: reuse if `stripe_payment_record_id` already has active row
- Duplicate webhook deliveries return `200` with `idempotent: true`

## 13. Expired/Cancelled Session Handling

`checkout.session.expired`:

- Pending payment → `canceled` + `canceled_at`
- Pending promo → `expired`
- **No entitlement activation**
- Audit: `revenue_payment_expired`
- Does not cancel already-paid records

## 14. Security Notes

- Server-only; no client exposure of secrets
- Never trust client POST body for fulfillment — only verified Stripe events + DB records
- Never mark paid if validation fails
- Never activate free packages through Stripe
- Never fulfill `empleos_job_fair_free`
- Raw body required for signature verification

## 15. Vercel Environment Variables Needed

| Variable | Environments |
|----------|--------------|
| `STRIPE_SECRET_KEY` | Production, Preview (already set) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production, Preview (already set) |
| `STRIPE_WEBHOOK_SECRET` | Production, Preview — **add after Stripe endpoint created** |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |

## 16. Stripe Dashboard Webhook Setup Steps

1. Deploy this gate to production (webhook route must exist).
2. In Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
3. Endpoint URL: `https://leonixmedia.com/api/revenue-os/webhook`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Create endpoint and copy the **Signing secret** (`whsec_…`).
6. In Vercel → Project → Settings → Environment Variables:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: paste signing secret
   - Environments: **Production** and **Preview** (if using same endpoint strategy)
7. **Redeploy production** after adding the secret.
8. Do **not** paste the webhook secret in chat, repo, or docs.

## 17. Manual Sandbox QA Plan

1. Complete sandbox Checkout via `/api/revenue-os/checkout` for `empleos_job_post_paid` or `rentas_30d`.
2. Confirm pending `leonix_payment_records` row exists.
3. Trigger webhook (Stripe CLI `stripe trigger checkout.session.completed` or pay in test mode).
4. Verify payment record → `paid`, promo → `redeemed` (if used), entitlement → `active`.
5. Replay same event — must be idempotent (no duplicate entitlements).
6. Expire a pending session — payment `canceled`, no entitlement.

## 18. What This Gate Does Not Do

- Live Stripe mode launch
- Public/dashboard/admin UI
- Category publish-flow redesign
- Comp/zero-amount promo fulfillment (deferred gate)
- Listing publish/visibility side effects (next gates)
- Success/cancel landing pages (`/revenue-os/pago/exito`)

## 19. Next Gate: Admin/User Revenue Proof

- Admin payment tracker live proof UI
- Owner dashboard paid badges from entitlements
- Success/cancel pages with session lookup (display only — not fulfillment)

## 20. Final Recommendation

Deploy webhook route, configure Stripe endpoint + `STRIPE_WEBHOOK_SECRET`, redeploy, then run sandbox Checkout → webhook → entitlement proof before enabling any live payment UX.
