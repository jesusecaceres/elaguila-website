# Revenue OS Autos Dealer Inventory Entitlement Parity 01

## Objective

Complete the scoped Revenue OS paid path for Autos Dealer / Autos Negocio:

- New dealer base checkout uses `autos_dealer_monthly`.
- Over-base inventory checkout includes `autos_dealer_inventory_pack_monthly`.
- Existing dealer inventory upgrade uses add-on-only checkout.
- Stripe webhook activates the dealer parent and grants the inventory entitlement when purchased.

## Canonical Truth

- Base package: `autos_dealer_monthly`
- Base price: `39900` cents monthly
- Base included capacity: 10 active vehicles
- Inventory pack: `autos_dealer_inventory_pack_monthly`
- Inventory pack price: `12900` cents monthly
- Inventory pack capacity: +10 active vehicles, 20 total active vehicles

All prices and labels are resolved from `revenuePricingMatrix.ts`; UI helpers do not trust client totals.

## Implementation Notes

- The actual dealer preview is `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`.
- The preview now mounts the shared `PublishCheckoutCheckpoint`.
- Before Revenue OS checkout, the preview creates or reuses a durable dealer draft row in `autos_classifieds_listings`.
- `/api/revenue-os/checkout` marks new dealer base checkout rows as `pending_payment` after Stripe session creation.
- The verified Revenue OS webhook activates `lane = negocios` rows only through `tryActivateAutosListingAfterPayment`.
- If the base checkout included the inventory pack add-on, webhook fulfillment writes a real `listing_package_entitlements` row for `autos_dealer_inventory_pack_monthly`.
- Existing dashboard inventory upgrade remains add-on-only and uses `AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT`.
- Autos Privado remains on `autos_privado_30d`, has no add-ons, and is rejected by dealer inventory ownership gates.

## Verification

Run:

```bash
npm run verify:revenue-os-autos-dealer-inventory-entitlement-parity-01
npm run smoke:revenue-os-autos-dealer-inventory-entitlement-parity-01
npm run build
```

The smoke script is static because live Stripe/Supabase checkout execution requires configured secrets and live authenticated dealer data.
