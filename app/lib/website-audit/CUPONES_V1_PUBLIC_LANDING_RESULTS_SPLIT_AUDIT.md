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

---

# Cupones V1.1 — Coupon Detail Drawer + Card CTA Behavior

## Project Intent

Finish the next public Cupones journey gate: on the Cupones surface, coupon cards open an in-page coupon detail drawer instead of navigating to the Ofertas offer detail route. Ofertas offer cards keep their existing Link behavior. The drawer is coupon-first, coupon-safe, and only shows real CTAs.

## Files Inspected

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `scripts/verify-cupones-public-split.mjs`

## Files Changed

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md`
- `scripts/verify-cupones-public-split.mjs`

## PM Diagnosis

Cupones V1 already created `/cupones`, `/cupones/resultados`, coupon-only offer filtering, coupon-safe copy, no product cards, and no shopping list UI. The remaining gap was that coupon cards rendered as a `Link` into the Ofertas detail route (`ofertaLocalPublicDetailPath`). This gate makes the coupon card open a coupon detail drawer on the Cupones surface only.

## Existing V1 Foundation Preserved

- `/cupones` and `/cupones/resultados` routes.
- Coupon-only offer-type allowlist (`coupon`, `promotion`, `seasonal_special`, `bundle`, `featured_deal`).
- Product items hidden on Cupones.
- Shopping list button/panel/product item drawer hidden on Cupones.

## Card Behavior Changed Only For Cupones

- `OfertasLocalesPublicOfferCard` now accepts `onSelect?: (offer) => void`.
- When `surface === "cupones"` **and** `onSelect` exists, the card renders as an accessible `<button type="button">` (focus ring, `text-left`, full-card clickable, `aria-label`) that opens the drawer.
- Otherwise the card preserves the existing `Link` to `ofertaLocalPublicDetailPath(offer.id, lang)`.

## Ofertas Card Link Behavior Preserved

Ofertas offer cards receive no `onSelect` (`isCupones ? setSelectedCouponOffer : undefined`) and continue to navigate to the existing Ofertas offer detail route.

## selectedCouponOffer State Added

`OfertasLocalesPublicSearchClient` adds `selectedCouponOffer: OfertaLocalPublicOfferCard | null`. The coupon drawer renders only when `isCupones && selectedCouponOffer`. The Ofertas item drawer (`!isCupones && selectedItem`) and shopping list panel remain untouched.

## Drawer Is Coupon-Safe

`OfertasLocalesPublicOfferDetailDrawer` is now surface-aware (`surface?: "ofertas" | "cupones"`, default `"ofertas"`) and uses `ofertasLocalesPublicSearchCopy(lang, surface)`. Cupones mode shows: coupon details heading, coupon title, business name, category, location, address, valid dates, offer-type badge, honest "no extra details yet" note, and coupon-safe source label ("Ver cupón original" / "View original coupon").

## CTAs Are Real Only

- Call — only if `phoneHref`.
- Website — only if `websiteHref`.
- Directions — only if `directionsHref`.
- Share coupon (Cupones only) — `navigator.share` with clipboard fallback; on copy shows "Enlace copiado." / "Link copied." No analytics tracking.
- Original source link — only if `primaryAssetHref`.
- WhatsApp is intentionally not shown: `whatsappHref` does not exist on the `OfertaLocalPublicOfferCard` model, so it is not invented.

## No Fake Claim/Redeem/Save/Wallet

No coupon wallet, saved coupon, claim, redeemed, scan-to-redeem, buy-now, order-online, or fake counters were added.

## No DB/Stripe/Admin/Dashboard Touched

No DB schema/migrations, Stripe, auth, admin, or dashboard files were touched. No other categories touched.

## Mobile/PWA Considerations

- Mobile: bottom-sheet drawer (`items-end`, `rounded-t-2xl`), `max-h-[92vh]` with internal scroll, no horizontal overflow.
- Desktop: centered modal (`sm:items-center`, `sm:rounded-2xl`).
- Close via close button, Escape key, and overlay click. Body scroll is locked while open.

## Next Gates

1. Coupon publish path polish
2. Coupon detail route `/cupones/[id]`
3. My Coupons dashboard
4. Coupons admin queue/live listings
5. Stripe coupon listing/boost entitlements
6. Real analytics events

## TRUE/FALSE Audit (V1.1)

1. Cupones cards open drawer: TRUE
2. Cupones cards do not navigate to Ofertas detail route: TRUE
3. Ofertas cards still link to Ofertas detail route: TRUE
4. Coupon drawer shows title/business/location/dates: TRUE
5. Coupon drawer shows only real CTAs: TRUE
6. No fake save/claim/redeem/wallet: TRUE
7. ES/EN copy present: TRUE
8. Mobile drawer/bottom sheet considered: TRUE
9. Product items remain hidden on Cupones: TRUE
10. Shopping list remains hidden on Cupones: TRUE
11. No DB/schema changes: TRUE
12. No Stripe/auth/admin/dashboard changes: TRUE
13. No unrelated categories touched: TRUE
14. Verifier passed: TRUE
15. Build passed: TRUE
16. READY TO COMMIT THIS BUILD ONLY: YES
17. READY TO PUSH THIS BUILD ONLY: NO
18. UNRELATED DIRTY FILES PRESENT: NO
