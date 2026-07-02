# STRIPE-REVENUE-OS-BIENES-RAICES-NEGOCIO-WIRING-01

Gate: hotfix — wire Bienes Raíces negocio payment CTA to central Revenue OS Checkout.  
Date: 2026-06-30  
Mode: **sandbox / test Stripe only** — no live mode, no client activation.

## 1. Executive Summary

The negocio preview **Continue to payment** CTA was blocked by legacy env-price checks (`STRIPE_PRICE_BIENES_NEGOCIO`) and called `/api/clasificados/leonix/stripe/checkout`. This hotfix routes paid negocio publish through **`POST /api/revenue-os/checkout`** using canonical package key **`br_agent_monthly`** ($399/mo agent/business subscription per Revenue OS matrix).

## 2. Old Broken Path

| Item | Detail |
|------|--------|
| UI | `AgenteIndividualResidencialPreviewClient.tsx` |
| Pre-gate | `brPublishBlockedMissingStripe("negocio")` → blocked when `STRIPE_PRICE_BIENES_NEGOCIO` missing |
| Error shown | "Stripe payment is not configured yet. Set STRIPE_SECRET_KEY and STRIPE_PRICE_BIENES_NEGOCIO in production." |
| Checkout client | `startBrNegocioCheckout` → `/api/clasificados/leonix/stripe/checkout` |

## 3. New Revenue OS Path

1. User clicks **Continue to secure payment** / **Continuar al pago seguro**.
2. Listing saved with `activationMode: "pending_payment"`.
3. `startRevenueCategoryCheckout` → `POST /api/revenue-os/checkout`.
4. Redirect to Stripe `checkoutUrl`.
5. Webhook-only activation; no client paid state.

## 4. Canonical Package Key Used

From `app/lib/listingPlans/revenuePricingMatrix.ts`:

- **category:** `bienes-raices`
- **packageKey:** `br_agent_monthly`
- **label:** Bienes Raíces agent monthly
- **price:** $399.00 / month (subscription)

Note: Expected name `bienes_raices_negocio_monthly` does not exist in matrix; **`br_agent_monthly`** is the canonical negocio/agent business key.

## 5. Files Inspected

Revenue OS docs, checkout route, `revenuePricingMatrix.ts`, `revenueCategoryCheckoutClient.ts`, `brPublishPaymentPolicy.ts`, `brPublishCheckoutClient.ts`, negocio preview/publish flow.

## 6. Files Changed

| File | Change |
|------|--------|
| `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` | Added `BIENES_RAICES_NEGOCIO_CHECKOUT` |
| `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx` | Revenue OS wiring |

## 7. Payload Contract

```json
{
  "category": "bienes-raices",
  "packageKey": "br_agent_monthly",
  "listingId": "<uuid from pending listing insert>",
  "leonixAdId": "<optional from listings.leonix_ad_id>",
  "returnPath": "/clasificados/bienes-raices",
  "locale": "es|en"
}
```

## 8. Success/Cancel Route Contract

Central checkout generates (unchanged):

- Success: `/revenue-os/pago/exito?session_id=…&category=bienes-raices&package_key=br_agent_monthly&…`
- Cancel: `/revenue-os/pago/cancelado?category=bienes-raices&package_key=br_agent_monthly&listing_id=…`

Success page is lookup-only. Old `/clasificados/bienes-raices/pago/exito` is not used as payment truth for this path.

## 9. What This Gate Does Not Do

- Does not wire Bienes Raíces privado / FSBO (`br_fsbo_45d`)
- Does not modify checkout/webhook routes
- Does not touch Rentas, Empleos, Autos, Servicios, etc.
- Does not use `STRIPE_PRICE_BIENES_NEGOCIO`
- No fake paid status, entitlement, or placement
- No `.env` or migration changes

## 10. Manual QA Checklist

- [ ] Open negocio publish flow → preview (e.g. `/clasificados/bienes-raices/preview/negocio?lang=en`)
- [ ] Click **Continue to secure payment**
- [ ] Confirm old `STRIPE_PRICE_BIENES_NEGOCIO` error is gone
- [ ] Confirm Stripe sandbox Checkout opens (test card only if owner chooses)
- [ ] Confirm success page is `/revenue-os/pago/exito` (lookup-only)
- [ ] Confirm cancel is `/revenue-os/pago/cancelado`
- [ ] Confirm **Back to Edit** still works
- [ ] Confirm no paid badge until webhook entitlement exists
- [ ] Inventory-add flow still skips payment

## 11. Final Recommendation

Hotfix is scoped to negocio preview payment CTA only. Ready for owner sandbox QA on Bienes Raíces negocio before wiring FSBO privado in a follow-up gate.
