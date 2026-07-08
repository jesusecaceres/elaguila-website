# SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01

Scoped gated build — Servicios now uses the same global Revenue OS final checkout
standard proven by Restaurantes.

## Objective

Make Servicios (both professional/white-collar and blue-collar/trades lanes) publish
through the global Revenue OS final checkout checkpoint: base $399/mo + optional
offers/coupons add-on +$99/mo, promo Apply, newsletter opt-in, Leonix rules modal,
category-specific confirmations, hidden pending save before Stripe, and webhook-driven
paid activation. No fake paid status; no paid add-on unlocked for free later.

## Task classification

SCOPED GATED BUILD — one category lane (Servicios) touching a real checkout flow.

## Both Servicios lanes covered

Servicios uses a single shared application + preview + publish path. The
professional/white-collar vs blue-collar/trades split is a template-routing decision
(`isServiciosProfessionalTemplate`). The final checkout checkpoint is wired once in the
shared preview (`ClasificadosServiciosPreviewClient.tsx`); the lane is resolved and sent
as checkout metadata (`pipeline: professional | trades`), so both lanes are covered.

## Package/pricing truth

- Base package key: `servicios_base_monthly` — $399/mo (`priceCents: 39900`).
- Offers/coupons add-on key: `servicios_offers_addon` — +$99/mo (`priceCents: 9900`).
- Base only → UI + Stripe total $399/mo. Base + add-on → $498/mo before promo.
- Add-on is bundled as `addOns: [{ key: "servicios_offers_addon", quantity: 1 }]`.
- Server add-on allowlist (`revenueCheckout.ts`) now permits `servicios_base_monthly →
  servicios_offers_addon` so Stripe charges the add-on (never free when selected).

## Files changed

- `app/lib/listingPlans/publishCheckoutCheckpoint.ts` — Servicios resolver branch,
  `SERVICIOS_CHECKPOINT_CONFIRMATIONS`, add-on metadata + payload, base/add-on keys.
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts` — `SERVICIOS_BASE_CHECKOUT`.
- `app/lib/listingPlans/revenueCheckout.ts` — Servicios add-on allowlist entry.
- `app/lib/listingPlans/revenueServiciosFulfillment.ts` — NEW webhook activation
  (`pending_payment` → `published`).
- `app/lib/listingPlans/revenueFulfillment.ts` — wired Servicios activation into both
  fulfillment paths (idempotent + fresh). Restaurante activation preserved.
- `app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx` — optional Leonix
  rules modal (opt-in; Restaurante unaffected).
- `app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx`
  — final checkout checkpoint after preview (application flow only).
- `app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts`
  — NEW pending-save helper.
- `app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts` +
  `buildServiciosPublishPayload.ts` — thread `activationMode: "pending_payment"`.
- `app/api/clasificados/servicios/publish/route.ts` — pending-payment save returns
  real `listingId`/`leonixAdId`; status `pending_payment` stays hidden.
- `app/(site)/clasificados/servicios/lib/serviciosListingLifecycle.ts` — added
  `pending_payment` status (canonical domain already supports it).
- `app/lib/newsletter/checkoutNewsletterCapture.ts` — `servicios_checkout` source.
- `package.json` — verifier + smoke scripts.

## Pending save / Revenue OS handoff

Final CTA → `saveServiciosPendingBeforeCheckout` posts the publish payload with
`activationMode: "pending_payment"`. The route persists the row as `listing_status =
pending_payment` (hidden — public discovery only returns `published`; slug page statuses
exclude `pending_payment`) and returns `listingId` + `leonixAdId`. The client then calls
`POST /api/revenue-os/checkout` with category `servicios`, base `servicios_base_monthly`,
`listingId`, `leonixAdId`, locale, `promoCode` (when applied), and `addOns` (when the
offers module is selected). No DB migration was required: `servicios_public_listings.
listing_status` is unconstrained `text`.

## Webhook / paid activation truth

`revenueServiciosFulfillment.activatePaidServiciosListingFromRevenueOs` flips the paid
listing from `pending_payment` (or `paused_unpublished`) to `published` only on verified
payment, wired through `revenueFulfillment.ts`. Stripe raw body/signature verification is
untouched. Entitlements are written by the existing generic fulfillment; the offers/
coupons the user paid for are already in `profile_json` from the pending save.

## Dashboard add-on protection (Gate 7)

The existing Servicios dashboard add-on-only edit route
(`serviciosDashboardOffersAddonCheckout.ts`, gate P0C) is unchanged and still charges
the $99/mo add-on only (never the base) for existing paid listings — no free unlock.

## Autos / other categories

Autos, Bienes, Restaurantes runtime were not modified (Restaurante used read-only as the
reference; the only shared-file edits — checkpoint resolver, checkout allowlist,
fulfillment orchestration, shared checkpoint UI — are additive and preserve Restaurante/
Bienes/Autos behavior). Ofertas, Clases, Rentas, En Venta, Admin untouched.

## Commands

- `npm run verify:servicios-global-checkout-standard-parity-01`
- `npm run smoke:servicios-global-checkout-standard-parity-01`
- `npm run build`

## Manual QA URLs

- https://leonixmedia.com/clasificados/publicar/servicios/preview?lang=es
- https://leonixmedia.com/clasificados/servicios?lang=es

## READY TO COMMIT

READY TO COMMIT: YES
