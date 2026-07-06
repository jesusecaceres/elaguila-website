# Gate 1.5 — Ofertas Locales Mobile/PWA Interaction Polish

**Task classification:** SCOPED LAUNCH POLISH BUILD  
**Date:** 2026-07-06

## Mobile/PWA intent

Make the Gate 1 Offer Hub preview feel app-like on mobile/PWA: section jump chips, sticky quick actions, collapsible Business Hub groups, horizontal future-tools rail, and client-only product category filtering — without backend changes or fake features.

## Files inspected

- `OfertasLocalesPreviewCard.tsx`
- `OfertasLocalesPreviewHeroVisual.tsx`
- `OfertasLocalesPreviewProductGrid.tsx`
- `ofertasLocalesPreviewCopy.ts`
- `OfertasFutureShoppingListCard.tsx`
- `OfertasFutureRoutePlannerCard.tsx`
- `OfertasFutureCouponWalletCard.tsx`
- `OFERTAS_PRODUCT_BLUEPRINT_V1_AUDIT.md`

## Files changed

- `OfertasLocalesPreviewCard.tsx`
- `OfertasLocalesPreviewHeroVisual.tsx`
- `OfertasLocalesPreviewProductGrid.tsx`
- `ofertasLocalesPreviewCopy.ts`
- `OfertasFutureShoppingListCard.tsx` (styling consistency)
- `OfertasFutureRoutePlannerCard.tsx`
- `OfertasFutureCouponWalletCard.tsx`
- `OFERTAS_MOBILE_PWA_INTERACTION_AUDIT.md`
- `scripts/verify-ofertas-mobile-pwa-interaction.mjs`
- `package.json` (verifier script only)

## Section chips behavior

- Horizontal scroll rail after page header
- Anchor links: `#oferta`, `#volante`, `#productos`, `#contacto`, `#ubicacion`, `#redes`, `#proximamente`
- Chips hidden when target section has no data (products, contact, location, social)
- `scroll-mt-24` on target sections
- ES/EN copy centralized

## Sticky action bar behavior

- Fixed bottom bar, `lg:hidden` (mobile only)
- Data-gated: Ver volante, Directions, Call, WhatsApp
- Share always available (native share or clipboard)
- Min 44px tap targets; page `pb-28` prevents content overlap

## Business Hub mobile behavior

- `<details>` collapsible groups on mobile
- Desktop: expanded grid layout (summary hidden)
- First available group defaults open: Contact → Location → Social
- Real data only; email copy/mailto preserved

## Future tools rail behavior

- Mobile: horizontal swipe rail (`overflow-x-auto`, min-width cards)
- Desktop: 3-column grid
- All cards disabled with Próximamente / Coming soon
- FUTURE WIRING comments preserved

## Product category filter behavior

- Derives categories from approved items' `item.category` only
- Client-only `useState` filter in preview grid
- Todos / All chip restores full list
- Showing count updates on filter
- No URL/backend/persistence changes

## Translation status

- All new labels in `ofertasLocalesPreviewCopy.ts`
- `?lang=es` and `?lang=en` via existing lang prop
- Real text for language globe compatibility

## Intentionally not touched

Step 5/6/7, AI scan, crop engine, Stripe, admin, dashboard, public results, Supabase, auth, analytics backends, global header/footer, other categories

## Risks / deferred work

- Item detail drawer (Gate 2)
- Persistent filter state / URL hash sync
- iOS safe-area env padding (optional follow-up)

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Work classified as SCOPED LAUNCH POLISH BUILD | TRUE | Audit header |
| Only Ofertas preview/mobile files changed | TRUE | git diff scope |
| No unrelated categories touched | TRUE | Verifier |
| No Step 5 touched | TRUE | Verifier |
| No Step 7 touched | TRUE | Verifier |
| No AI scan engine touched | TRUE | Verifier |
| No crop engine touched | TRUE | Verifier |
| No Stripe/payment touched | TRUE | Verifier |
| No admin/dashboard touched | TRUE | Verifier |
| No public results page touched | TRUE | Verifier |
| Mobile section chips added | TRUE | PreviewSectionNav |
| Section chips use real anchors | TRUE | #oferta etc. |
| Section chips use ES/EN copy | TRUE | copy file |
| Mobile sticky action bar added | TRUE | MobileStickyActionBar |
| Sticky action buttons are data-gated | TRUE | href guards |
| Sticky bar appears mobile-only | TRUE | lg:hidden |
| Sticky bar does not cover bottom content | TRUE | pb-28 |
| Business Hub mobile sections are collapsible | TRUE | HubCollapsibleGroup |
| Business Hub desktop remains premium | TRUE | lg:grid layout |
| Contact/social/review links remain real-only | TRUE | unchanged guards |
| Email copy/open behavior preserved | TRUE | copyEmail + mailto |
| Future modules remain disabled | TRUE | disabled buttons |
| Future modules have mobile rail | TRUE | overflow-x-auto rail |
| FUTURE WIRING comments remain | TRUE | future card files |
| Product category chips use real categories | TRUE | item.category derive |
| Product filtering is client-only preview-only | TRUE | useState in grid |
| Approved-only products behavior preserved | TRUE | items prop unchanged |
| sourceCropUrl real-only preserved | TRUE | ProductCard |
| No fake ratings/stars/counts added | TRUE | no rating UI |
| No fake route/distance/open status added | TRUE | no map/distance |
| No fake save/list/coupon wallet behavior | TRUE | disabled future cards |
| ?lang=es works | TRUE | copy keys |
| ?lang=en works | TRUE | copy keys |
| Language globe compatibility preserved | TRUE | real text |
| New labels use centralized copy | TRUE | copy file |
| Mobile no-horizontal-overflow considered | TRUE | scroll rails |
| PWA/mobile tap targets are safe | TRUE | min-h-11 / min-w-44 |
| Verifier passed | TRUE | npm run verify |
| npm run build passed | TRUE | npm run build |
| git diff --name-only reviewed | TRUE | Final report |
| git status --short reviewed | TRUE | Final report |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate-scoped only |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| GLOBAL WORKING TREE CLEAN: YES/NO | NO | Unrelated magazine dirty files |
| UNRELATED DIRTY FILES PRESENT: YES/NO | YES | Pre-existing |
