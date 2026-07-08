# Cupones V1 — Standalone Public Coupon Discovery Surface

## Project Intent

Create the first standalone public Cupones discovery surface for Leonix while safely reusing the existing Ofertas Locales public landing/results foundation.

Ofertas Locales remains the surface for weekly flyers, searchable products, flyer/product discovery, and shopping-list behavior. Cupones is split as a standalone surface for coupons, promotions, deals, restaurants, services, shops, events, and local businesses.

## Files Inspected

- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/results/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/api/ofertas-locales/public-offers/route.ts`
- `app/api/ofertas-locales/public-search/route.ts`
- `app/(site)/cupones/page.tsx`
- `app/(site)/cupones/CuponesPageClient.tsx`
- `app/(site)/clasificados/components/categoryStandardV2/index.ts`
- `app/(site)/clasificados/components/categoryStandardV2/LeonixCategorySearchCanvas.tsx`

## Files Changed

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/(site)/cupones/page.tsx`
- `app/(site)/cupones/resultados/page.tsx`
- `app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md`
- `scripts/verify-cupones-public-split.mjs`

## Why Cupones Is Split From Ofertas

Ofertas Locales and Cupones sell and discover different user intents. Ofertas Locales can include flyers, product-level searchable items, and shopping-list behavior. Cupones should be a coupon/promotion/deal discovery surface with no product cards, shopping list, coupon wallet, fake save, claim, or redeem tracking.

## What Was Reused

- Category Standard V2 shell, hero, search canvas, results shell, toolbar, active filters, partner section, shortcuts, CTA, and empty-state components.
- Existing Ofertas public client with a `surface` mode.
- Existing public offers API: `/api/ofertas-locales/public-offers`.
- Existing public offer card shape and detail route.

## What Was Not Touched

- No DB schema or migrations.
- No Supabase schema changes.
- No Stripe, checkout, webhooks, auth, admin, or dashboard files.
- No other public categories.
- No global navigation changes.
- No Ofertas preview V2.2 changes.
- No AI scan, extraction, product crop, publish flow rewrite, or shopping-list activation changes.

## Route List

- `/cupones?lang=es`
- `/cupones/resultados?lang=es`
- `/cupones?lang=en`
- `/cupones/resultados?lang=en`
- Preserved: `/clasificados/ofertas-locales?lang=es`
- Preserved: `/clasificados/ofertas-locales/results?lang=es`

## Data/API Truth

Cupones uses `/api/ofertas-locales/public-offers` only. The public offers helper supports one `offerType` filter, so Cupones fetches public offers and applies a client-side coupon-like offer-type allowlist. Cupones does not call `/api/ofertas-locales/public-search` and does not render item/product cards.

## Coupon Offer Type List

- `coupon`
- `promotion`
- `seasonal_special`
- `bundle`
- `featured_deal`

## No Fake Wallet/Save/Redeem

The Cupones surface does not add coupon wallet, saved coupon, claim, redeemed, scan-to-redeem, buy-now, order-online, or fake redemption counters.

## Next Gates

1. Coupon detail drawer/page
2. Coupon publish path polish
3. Dashboard My Coupons
4. Admin Coupons queue/live
5. Stripe coupon listing plan
6. Analytics events

## TRUE/FALSE Audit

1. `/cupones` route created: TRUE
2. `/cupones/resultados` route created: TRUE
3. Ofertas routes preserved: TRUE
4. Cupones uses coupon/promotion offer types only: TRUE
5. Cupones hides product item cards: TRUE
6. Cupones hides shopping list UI: TRUE
7. Cupones copy is ES/EN: TRUE
8. Coupon cards avoid fake claim/save/redeem: TRUE
9. Filters are coupon-safe: TRUE
10. No DB migration/schema change: TRUE
11. No Stripe/auth/admin/dashboard change: TRUE
12. No other categories touched: TRUE
13. Mobile/PWA considered: TRUE
14. Verifier passed: TRUE
15. Build passed: TRUE
16. READY TO COMMIT THIS BUILD ONLY: YES
17. READY TO PUSH THIS BUILD ONLY: NO
18. UNRELATED DIRTY FILES PRESENT: NO
