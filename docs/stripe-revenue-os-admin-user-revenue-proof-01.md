# STRIPE-REVENUE-OS-ADMIN-USER-REVENUE-PROOF-01

Gate: admin/user revenue visibility after verified Stripe webhook fulfillment.  
Date: 2026-07-01  
Mode: **lookup/display only** — no payment activation, no webhook rewrite.

## 1. Executive Summary

After sandbox E2E proved Checkout → webhook → paid → entitlement, this gate adds the **proof/visibility layer**:

- Production success/cancel pages at `/revenue-os/pago/exito` and `/revenue-os/pago/cancelado`
- Server-only payment/entitlement **lookup** (never mutates state)
- Dashboard **ad plan** badges from webhook-backed `listing_package_entitlements` (`package_key`)
- Admin **payment tracker** shows real Revenue OS records with entitlement/promo status

**Stripe foundation unchanged:** checkout route, webhook route, fulfillment helpers.

## 2. Repo Baseline

Gate start may include unrelated dirty work (e.g. Bienes Raíces negocio). This gate touches only Revenue OS proof files, dashboard badge wiring, and admin payment tracker.

## 3. Routes Added/Verified

| Route | Purpose |
|-------|---------|
| `/revenue-os/pago/exito` | Post-Checkout success — lookup-only |
| `/revenue-os/pago/cancelado` | Checkout canceled — honest, no fake activation |

Query params (from Checkout gate):

- Success: `session_id`, `category`, `package_key`, `lang`, `return_to`
- Cancel: `category`, `package_key`, `listing_id`, `lang`, optional `session_id`

**Production domain:** set `NEXT_PUBLIC_SITE_URL=https://leonixmedia.com` in Vercel so Stripe success URLs land on the real domain (not preview SSO).

## 4. Success Page Contract

- Server-rendered via `lookupRevenuePaymentProof()`
- Reads `session_id` / optional `payment_record_id`
- **Does NOT** mark paid, activate entitlement, or call Stripe mutation APIs
- Honest states:
  1. **Confirmed** — payment paid + entitlement active
  2. **Processing** — pending payment or entitlement activating
  3. **Missing** — no payment record
  4. **Canceled/expired** — no fake success
- Shows category, ad plan label, Leonix Ad ID, amount, next actions (dashboard, support)
- Copy states webhook is source of truth

## 5. Cancel Page Contract

- Explains payment not completed
- Does not imply listing activated unless lookup finds paid webhook record
- Links: dashboard, support
- Leonix-branded calm UX

## 6. Payment Lookup Helper Contract

Files:

- `app/lib/listingPlans/revenuePaymentLookup.ts` — server-only read
- `app/lib/listingPlans/revenueDisplay.ts` — safe labels/formatting

Lookup by:

- `stripe_checkout_session_id`
- `payment_record_id`

Returns safe public fields only — no secrets, no raw webhook secrets.

## 7. Dashboard Paid Badge Contract

- Uses existing `/api/dashboard/listing-package-entitlements` + Revenue OS `package_key` entitlements
- Badge label examples:
  - EN: `Paid private · Active until Jul 31, 2026`
  - ES: `Privado pagado · Activo hasta 31 jul 2026`
- **Listing/ad plan** — never mixed with account plan (`profiles.membership_tier`)
- No fake paid badge when no entitlement

## 8. Admin Payment Tracker Contract

`/admin/workspace/payment-tracker` shows:

- Payment status, category, **package_key** label
- Listing id + Leonix Ad ID
- Masked Stripe session/intent refs
- Entitlement status (active/missing)
- Promo redemption status when linked
- Source `stripe_webhook` for paid Revenue OS rows

Helper copy: paid status only via verified webhook; listing/ad revenue ≠ account plan.

## 9. Entitlement Visibility Contract

Entitlement state read from `listing_package_entitlements` linked by `payment_record_id` or `package_entitlement_id`. Active = `status: active` and `ends_at` in future.

## 10. Promo Status / Deferred Proof

Admin tracker displays promo redemption **status** when `promo_redemption_id` is linked.

**PROMO E2E NOT RUN** in this gate — no new promo checkout proof. Display-only when data exists.

## 11. Security Rules

- No `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` on client
- Success page never trusts query alone — DB lookup required
- Admin masks Stripe IDs (`cs_test_abc…` → shortened)
- No secrets in docs/scripts

## 12. Account Plan vs Listing/Ad Plan Rule

| Layer | Source | UI |
|-------|--------|-----|
| Account plan | User profile / membership | Separate from listing cards |
| Listing/ad plan | Category + `package_key` + entitlement | Dashboard “Plan del anuncio” / “Ad plan” |

Paid-only categories must not show fake Free from account tier.

## 13. Manual QA Checklist

- [ ] Complete sandbox Checkout (`rentas_30d` or `empleos_job_post_paid`)
- [ ] Success page shows **confirmed** only after webhook marks payment paid
- [ ] Refresh success page while pending shows **processing** (not fake paid)
- [ ] Cancel page does not claim activation for unpaid session
- [ ] Dashboard listing shows Revenue OS ad plan badge when entitlement active
- [ ] Admin payment tracker lists payment with `stripe_webhook` source
- [ ] Admin shows entitlement status `active` for fulfilled row
- [ ] No secrets visible in admin UI
- [ ] Free package checkout rejection unchanged (`empleos_job_fair_free`, `comunidad_free`)
- [ ] `NEXT_PUBLIC_SITE_URL` points to production domain for Stripe redirects

## 14. What This Gate Does Not Do

- Live Stripe mode
- Checkout/webhook foundation rewrite
- Promo E2E checkout proof
- Expired session E2E
- Webhook resend idempotency test
- Public category redesign
- Fake analytics or revenue totals

## 15. Next Gate Recommendation

**Category publish-flow Stripe wiring** — connect category publish confirm screens to central `/api/revenue-os/checkout` with return paths, while keeping webhook as sole activator.

## 16. Final Recommendation

Deploy success/cancel pages, set `NEXT_PUBLIC_SITE_URL=https://leonixmedia.com`, re-run sandbox payment, confirm success page + dashboard badge + admin tracker align with Supabase proof rows.
