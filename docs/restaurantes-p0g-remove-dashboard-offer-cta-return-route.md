# RESTAURANTES-P0G — Remove Dashboard Offer CTA + Fix Post-Payment Return

## Executive summary

Removes the confusing outside dashboard **Destacar ofertas +$99/mes** CTA for inactive listings. Owners activate offers only from **Editar restaurante → Section G**. After successful $99 add-on payment, Revenue OS success shows **Editar ofertas ahora** linking directly to coupon edit mode.

## What Chuy proved in QA

- Dashboard add-on payment works ($99 only)
- After payment, dashboard shows **Editar ofertas**
- Coupon text and images save and render publicly
- Remaining confusion: two parallel paths (outside CTA vs inside form)

## Dashboard CTA removal

**Inactive listings:** No outside paid CTA. Footer helper:
- ES: Para agregar ofertas destacadas, entra a Editar restaurante y abre la sección Ofertas y cupones.
- EN: To add featured offers, open Edit restaurant and go to Featured offers and coupons.

**Active listings:** **Editar ofertas** shortcut preserved (opens Section G via `mode=coupon-edit`).

## Inside form activation path

Unchanged from P0F:
- `mode=listing-edit` from dashboard
- Section G explains offers when inactive
- **Destacar ofertas +$99/mes** → add-on-only Stripe
- No fake `couponUpgradeEnabled`, no $399 base

## Post-payment return

For `restaurantes_offers_addon` with `listingId`:
- Primary CTA: **Editar ofertas ahora** / **Edit offers now**
- Route: `/publicar/restaurantes?source=dashboard&mode=coupon-edit&focus=coupon-upgrade&listingId=…&returnPanel=restaurantes&lang=…`
- Fallback without `listingId`: **Volver a mi panel**

## Coupon image persistence

No changes to upload, blob, publish, or public render pipeline.

## Manual QA checklist

- [ ] Inactive listing card has no **Destacar ofertas** button
- [ ] Inactive card shows helper pointing to Editar restaurante / Section G
- [ ] **Editar restaurante** still opens listing-edit form
- [ ] Section G inactive path still shows **Destacar ofertas +$99/mes**
- [ ] After $99 payment, success shows **Editar ofertas ahora**
- [ ] Success CTA opens Section G coupon editor
- [ ] Active listing still has **Editar ofertas** shortcut
- [ ] Coupon images still save and render publicly

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Inactive outside CTA removed | TRUE |
| Inactive helper points to Editar restaurante | TRUE |
| Active Editar ofertas preserved | TRUE |
| Post-payment success CTA routes to coupon-edit | TRUE |
| Coupon image persistence preserved | TRUE |
