# REVENUE-OS-PROMO-REDEMPTION-BUSINESS-ATTRIBUTION-01

Scoped Revenue OS / Admin OS build — enrich promo redemption with business/listing/payment
attribution after successful paid webhook, and surface it on Admin promo code cards.

## Objective

When a promo code is applied and payment succeeds, Admin must show who used it, which
listing/ad it belongs to, category/package/add-ons, original/discount/final amounts, and
payment/Stripe references — not just “used.”

## Task classification

SCOPED GATED BUILD. No checkout UI, Stripe raw-body, or schema migration changes.

## Files changed

- `app/lib/listingPlans/revenuePromoRedemptions.ts` — attribution type, listing fetch (Restaurante + Servicios), build + store on redeem
- `app/lib/listingPlans/revenuePaymentRecords.ts` — extended payment select for attribution
- `app/lib/listingPlans/revenueFulfillment.ts` — webhook calls enriched redeem helper
- `app/admin/_lib/promoCodeData.ts` — usage ledger reads attribution; usage search
- `app/admin/_lib/promoCodeDisplayHelpers.ts` — compact usage formatters
- `app/admin/_lib/promoCodeRecentCardMapper.ts` — maps enriched usage fields
- `app/admin/(dashboard)/workspace/promo-codes/PromoCodeRecentCodesPanel.tsx` — usage display rows

## Attribution shape

Stored on `leonix_promo_code_redemptions.metadata.business_attribution` after webhook redeem:

- promoCode, category, packageKey, addOnKeys
- listingId, leonixAdId, publicUrl
- paymentRecordId, stripeCheckoutSessionId, stripePaymentIntentId
- customerEmail, ownerUserId, businessName, businessPhone, businessEmail, address fields
- subtotalCents, discountCents, finalAmountCents, currency, paidAt, redeemedAt

Missing fields are omitted or shown as “Not captured” in Admin — never faked.

## Restaurante + Servicios support

Listing context fetched from `restaurantes_public_listings` / `servicios_public_listings`
(profile_json / listing_json). Public ad URLs derived when published.

## Search

`fetchPromoCodesForTracker` q-filter also searches enriched usage fields (business name,
email, phone, Leonix Ad ID, payment/session IDs).

## READY TO COMMIT

See final audit in task response.
