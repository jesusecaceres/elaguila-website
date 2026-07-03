# RESTAURANTES-PENDING-PAYMENT-STATUS-CONSTRAINT-FIX-01

## 1. Executive Summary

Production Restaurante checkout failed **before Stripe** because `POST /api/clasificados/restaurantes/publish` inserted a status value not allowed by `restaurantes_public_listings_status_check`. This gate adds `pending_payment` to the DB constraint, saves pre-checkout rows as **`pending_payment`** (hidden), and updates webhook fulfillment to activate **`pending_payment` → `published`** (legacy **`archived`** rows still supported).

## 2. Production Error

```json
{
  "ok": false,
  "error": "insert_failed",
  "detail": "new row for relation \"restaurantes_public_listings\" violates check constraint \"restaurantes_public_listings_status_check\""
}
```

## 3. Root Cause

- Original table constraint: `published`, `suspended` only (`20260408120000_restaurantes_public_listings.sql`).
- Later migration added `archived` (`20260508150000_restaurantes_status_archived.sql`) — **may not be applied on production**.
- Pre-checkout code used `status: archived` for `activation_mode: pending_payment`.
- If production never received the `archived` migration, inserts fail with the check constraint error.

## 4. Chosen Hidden Status

**`pending_payment`** — matches Autos/Comida Local patterns; clearly means unpaid pre-Stripe row.

| Phase | Status |
|-------|--------|
| Before Stripe (hidden) | `pending_payment` |
| After webhook (live) | `published` |
| Legacy hidden (still activatable) | `archived` |

## 5. DB Constraint Fix

Migration: `supabase/migrations/20260703120000_restaurantes_pending_payment_status.sql`

Allowed statuses:

- `pending_payment`
- `published`
- `suspended`
- `archived`

Public RLS unchanged: `using (status = 'published')`.

## 6. Publish Endpoint Fix

`app/api/clasificados/restaurantes/publish/route.ts`:

- When `activation_mode: pending_payment`, insert/update with `status: pending_payment`
- Returns `listingId`, `leonixAdId`, `pendingPayment: true`
- Does not mark paid or expose publicly
- Preserves full `listing_json` (coupon module data intact)

## 7. Webhook Activation Contract

`revenueRestaurantFulfillment.ts`:

- Activates from `pending_payment` or legacy `archived`
- Sets `status: published` only after successful Stripe webhook payment
- Idempotent if already `published`
- Does not activate `suspended`

## 8. Public Visibility Contract

`restaurantesPublicListingsServer.ts` and RLS policy:

- Public queries use `.eq("status", "published")` only
- `pending_payment` rows are **not** visible on results/detail pages

## 9. Coupon Module Impact

None on status logic. Listing draft/`listing_json` (including `couponUpgradeEnabled`) is saved unchanged before checkout. Coupon add-on checkout gate remains separate.

## 10. Files Inspected

- `app/api/clasificados/restaurantes/publish/route.ts`
- `app/lib/listingPlans/revenueRestaurantFulfillment.ts`
- `app/lib/listingPlans/revenueFulfillment.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts`
- `supabase/migrations/20260408120000_restaurantes_public_listings.sql`
- `supabase/migrations/20260508150000_restaurantes_status_archived.sql`

## 11. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260703120000_restaurantes_pending_payment_status.sql` | Constraint includes `pending_payment` |
| `app/api/clasificados/restaurantes/publish/route.ts` | Uses `pending_payment` for pre-checkout save |
| `app/lib/listingPlans/revenueRestaurantFulfillment.ts` | Activates from `pending_payment` + `archived` |
| Doc + verifier + package.json | |

## 12. What This Gate Does Not Do

- Does not skip pending save or publish before payment
- Does not touch Stripe webhook raw body/signature
- Does not change public Cupones/Ofertas CMS
- Does not touch results-shell styling files

## 13. Manual QA Checklist

- [ ] **Apply migration in Supabase** (see §14)
- [ ] Restaurante preview with coupon module selected
- [ ] Click Continuar al pago seguro
- [ ] `POST /api/clasificados/restaurantes/publish` returns 200 with `listingId` / `leonixAdId`
- [ ] Revenue OS checkout opens Stripe
- [ ] Sandbox payment completes
- [ ] Webhook publishes listing
- [ ] Coupons visible on published ad
- [ ] Unpaid row not visible on public results before payment

## 14. Supabase Migration Instructions

1. Open Supabase SQL editor for production project
2. Run contents of `supabase/migrations/20260703120000_restaurantes_pending_payment_status.sql`
3. Verify: `select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'restaurantes_public_listings_status_check';`
4. Expected: check includes `pending_payment`

**Without this migration, the app fix alone will still fail on DBs that only allow `published`/`suspended`.**

## 15. Next Recommended Gates

1. Confirm production applied `20260508150000` and `20260703120000` migrations
2. E2E sandbox: coupon add-on + promo + pending_payment + webhook publish
