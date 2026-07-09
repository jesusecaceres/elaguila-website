# Revenue OS — Rentas Paid Publish Lockdown 01

Gate: `RENTAS-REVENUE-OS-PAID-PUBLISH-LOCKDOWN-01`

## Executive Summary

Rentas (privado and negocio) is locked to the Leonix Revenue OS paid-publish pipeline. No unpaid listing can become public. There are no upgrades, inventory add-ons, or bulk rental slots — each rental property requires its own paid `rentas_30d` listing.

## Business Rules

| Rule | Value |
|------|-------|
| Package key | `rentas_30d` |
| Price | $24.99 / 30 days (2499 cents) |
| Billing | One-time |
| Upgrades | **None** |
| Inventory add-on | **None** |
| More rentals | New ad (new listing + new payment) |
| Pipelines | `privado`, `negocio` — both paid |

## Pipeline (Both Lanes)

```
Entry checkpoint (publicar/rentas hub)
  → application form (privado | negocio)
  → preview (viewable before payment)
  → PublishCheckoutCheckpoint (final)
  → hidden pending save (status=pending, is_published=false)
  → POST /api/revenue-os/checkout
  → Stripe
  → webhook → activatePaidRentasListingFromRevenueOs
  → public listing + dashboard truth
```

## Entry Checkpoint

- Cards: `getRentasPrivadoCheckpointCard`, `getRentasNegocioCheckpointCard` in `categoryPublishCheckpoints.ts`
- Copy states: one rental / 30 days, no inventory add-on, more rentals = new ad
- Ver más modal with included / not-included bullets

## Final Checkout Checkpoint

- Shared `PublishCheckoutCheckpoint` on both preview clients
- Config: `rentasPreviewCheckpointConfig` + `RENTAS_CHECKPOINT_CONFIRMATIONS` (4 required checkboxes)
- Promo Apply via `validateRevenuePromoForCheckout`
- Newsletter opt-in via `captureCheckoutNewsletterSubscriber`
- Leonix rules modal (`RENTAS_PREVIEW_RULES_MODAL`)

## Hidden Pending Save

- `publishLeonixListingFromRentasPrivadoDraft` / `publishLeonixListingFromRentasNegocioDraft` with `activationMode: "pending_payment"`
- Core: `leonixPublishRealEstateListingCore.ts` sets `status: "pending"`, `is_published: false`
- Payment metadata: `listing_json.rentas_publish.payment_status: "pending"` via `mergeRentasListingPaymentMeta`

## Revenue OS Checkout

- Payload: `RENTAS_CATEGORY_CHECKOUT` — `{ category: "rentas", packageKey: "rentas_30d" }`
- Client: `startRevenueCategoryCheckout` — no `addOns`
- Server revalidates price and promo in `/api/revenue-os/checkout`

## Webhook Activation

- `revenueRentasFulfillment.ts` — `activatePaidRentasListingFromRevenueOs`
- Wired in `revenueFulfillment.ts` via `tryActivateRentasListingAfterEntitlement`
- Idempotent: skips already-published; only activates from `pending` + `is_published=false`
- **Stripe webhook raw body/signature logic unchanged**

## Public Render

- `fetchRentasListingForPublicDetail.ts` requires `status === active` and `is_published !== false`
- Browse inventory skips `is_published === false`

## Dashboard Edit

- `LeonixRealEstateListingManageCard` routes edit to `/publicar/rentas/privado|negocio?edit=1`
- Edit of published listing does not trigger base recharge (no checkout on dashboard edit path)
- New listings still require full paid pipeline

## Truth Before Patch (Gap Record)

| Gap | Before | After |
|-----|--------|-------|
| Negocio unpaid publish | `RentasNegocioPreviewClient` published live + `?published=1` | Blocked — pending + Revenue OS |
| Privado shared checkpoint | Custom promo/newsletter UI | `PublishCheckoutCheckpoint` |
| Webhook activation | Missing for Rentas | `activatePaidRentasListingFromRevenueOs` |

## SQL / Status Lifecycle

- Hidden unpaid: `listings.status = 'pending'`, `is_published = false`, `category = 'rentas'`
- Paid active: `status = 'active'`, `is_published = true` (webhook only)
- No migration required — uses existing `listings` status pattern shared with Bienes pending flow

## Files Touched (Rentas Lockdown)

### New
- `app/lib/clasificados/rentas/rentasListingPaymentMetadata.ts`
- `app/lib/listingPlans/revenueRentasFulfillment.ts`
- `app/(site)/clasificados/rentas/preview/shared/rentasPreviewPaidCheckout.ts`
- `docs/revenue-os-rentas-paid-publish-lockdown-01.md`
- `scripts/verify-revenue-os-rentas-paid-publish-lockdown-01.mjs`
- `scripts/smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs`

### Modified (Rentas + shared Revenue OS only)
- `app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx`
- `app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx`
- `app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts`
- `app/lib/listingPlans/publishCheckoutCheckpoint.ts`
- `app/lib/listingPlans/revenueFulfillment.ts`

## Verification

```bash
npm run verify:revenue-os-rentas-paid-publish-lockdown-01
npm run smoke:revenue-os-rentas-paid-publish-lockdown-01
npm run build
```

## Manual QA Checklist

- [ ] Privado: entry checkpoint → form → preview → checkpoint → Stripe → listing public after webhook
- [ ] Negocio: same flow; no direct publish without payment
- [ ] Pending listing not visible on public detail or browse
- [ ] Dashboard shows pending listing; edit hydrates form
- [ ] Published listing edit does not charge base again
- [ ] Promo Apply adjusts total before checkout
- [ ] Newsletter opt-in captured (non-blocking)

## READY TO COMMIT Standard

All verifier + smoke + build gates pass. No unpaid publish path remains for Rentas negocio or privado.
