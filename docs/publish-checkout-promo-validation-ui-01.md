# PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01

## 1. Executive Summary

Wires **Leonix admin-created promo codes** into the shared `PublishCheckoutCheckpoint` for **Restaurantes proof category only**. Promo codes validate server-side against `leonix_promo_codes`; discounts come from **server-owned columns/metadata** (`percent_off`, `amount_off_cents`, `promo_type`) — never inferred from code text like `RESTO-LAUNCH-25`. Redemption occurs **only after successful Stripe payment webhook**.

## 2. Admin Code Created

Test code `RESTO-LAUNCH-25` may exist without discount metadata. **Do not assume 25% from the name.**

To test checkout discount:
1. Open `/admin` → **Promo Code Generator**
2. Create **RESTO-LAUNCH-25-V2** (or recreate with new admin fields):
   - Type: **Discount**
   - Discount type: **Percent off**
   - Percent off: **25**
   - Category: **restaurantes**
   - Package scope (optional): `restaurantes_base_monthly`
   - Status: **Active**

## 3. Promo Code vs Public Cupones/Ofertas

| System | Purpose |
|--------|---------|
| **Leonix promo code** | Advertiser checkout discount to Leonix (this gate) |
| **Restaurante coupon module** | Category-owned add-on (separate gate) |
| **Cupones / Ofertas Locales** | Public customer-facing offers — **not** mixed here |

## 4. Discount Source Truth

Discount amount comes from server-owned sources only:

| Source | Fields |
|--------|--------|
| DB columns | `promo_type`, `percent_off`, `amount_off_cents` |
| Metadata fallback | `metadata.discount_type`, `metadata.discount_percent`, `metadata.discount_amount_cents` |

**No fake 25%** inferred from code text. Codes without configured discount values fail validation with a clear admin-facing message.

## 5. Validation Route

`POST /api/revenue-os/promo/validate`

- Read-only — **no redemption**, no payment record, no entitlement
- Validates against `leonix_promo_codes`
- Returns `discountCents`, `totalCents`, `discountLabel` from server calculation
- Invalid: *Este código promocional no es válido para este pago.*

Implementation: `app/lib/listingPlans/revenuePromoValidation.ts` + `app/api/revenue-os/promo/validate/route.ts`

## 6. Restaurante Checkout UI

- `promoEligible: true` in `RestaurantePreviewClient`
- `PublishCheckoutCheckpoint` shows **Código promocional** / **Promo code**
- **Aplicar / Apply** calls validation route
- **Quitar / Remove** clears applied code
- Discount line appears only after successful server validation
- Total updates from server `totalCents`
- Checkout proceeds without promo when field empty

## 7. Revenue OS Checkout Revalidation

`POST /api/revenue-os/checkout` re-validates promo via `resolvePromoForCheckout` before creating Stripe session. Client Apply result is not trusted alone.

## 8. Stripe Discount/Amount Contract

Stripe Checkout session `unit_amount` = validated `finalAmountCents` (discounted). Base package price from Revenue OS matrix; discount applied server-side before session creation.

## 9. Webhook Redemption Contract

On `checkout.session.completed` (paid):
- Payment marked paid (unchanged)
- Entitlement + Restaurante listing activation (unchanged)
- Pending promo redemption → **redeemed**
- `leonix_promo_codes.redemption_count` incremented **once** (idempotent)

On expired/canceled session:
- Promo redemption → **expired** (not redeemed)
- No redemption count increment

## 10. Expired/Canceled Session Rules

`markPromoRedemptionExpiredOrCancelled` runs on checkout session expired webhook. Abandoned checkout does not consume promo.

## 11. Admin Generator Result

Admin create form now includes for Type = Discount:
- Discount type (percent / amount)
- Percent off (1–100)
- Amount off ($)
- Revenue OS package scope (optional)

Stored in `promo_type`, `percent_off`, `amount_off_cents`, `category_scope`, `package_scope`, and metadata mirror.

## 12. Files Inspected

Admin promo manager, Revenue OS checkout/webhook/promo modules, shared checkpoint, Restaurante preview, Supabase migration references.

## 13. Files Changed

| File | Change |
|------|--------|
| `app/api/revenue-os/promo/validate/route.ts` | New read-only validation API |
| `app/lib/listingPlans/revenuePromoValidation.ts` | Publish checkout validation logic |
| `app/lib/listingPlans/revenuePromoRedemptions.ts` | Discount resolution, redemption count increment |
| `app/lib/listingPlans/revenuePaymentRecords.ts` | Promo snapshot in payment metadata |
| `app/api/revenue-os/checkout/route.ts` | Promo snapshot on payment create |
| `app/lib/listingPlans/revenueCategoryCheckoutClient.ts` | Browser validation client |
| `PublishCheckoutCheckpoint.tsx` | Promo UI + Remove |
| `RestaurantePreviewClient.tsx` | `promoEligible: true`, validation wiring |
| `app/admin/.../promo-codes/actions.ts` | Discount fields on create |
| `app/admin/.../promo-codes/page.tsx` | Discount form + list summary |
| `docs/publish-checkout-promo-validation-ui-01.md` | This document |
| `scripts/verify-publish-checkout-promo-validation-ui-01.mjs` | Verifier |

## 14. What This Gate Does Not Do

- Does not migrate Servicios, Bienes, Autos, or other categories
- Does not wire Restaurante coupon/Ofertas Locales add-on
- Does not infer discount from promo code name
- Does not redeem on Apply or checkout session creation
- No Supabase migrations added
- No Stripe live mode

## 15. Manual QA Checklist

- [ ] Admin: create RESTO-LAUNCH-25-V2 with 25% + restaurantes category
- [ ] Restaurante application → preview
- [ ] Promo field visible
- [ ] Invalid code → calm error message
- [ ] Valid code → discount line + updated total
- [ ] Confirmations still gate checkout
- [ ] Secure payment → Stripe sandbox amount matches discounted total
- [ ] Complete sandbox payment (test card only)
- [ ] Payment record paid + promo metadata
- [ ] Listing published after webhook
- [ ] Promo redemption count +1 once
- [ ] Abandoned checkout does not redeem

## 16. Next Gates

- Promo validation on additional categories (Servicios, Bienes negocio, etc.)
- STRIPE-REVENUE-OS-RESTAURANTES-COUPON-ADDON-01 (category add-on billing)
