# Gate 1 — Ofertas Locales Preview/Public Offer Hub Polish

**Task classification:** SCOPED LAUNCH POLISH BUILD  
**Date:** 2026-07-06

## Product intent summary

Ofertas Locales preview (Surface 3 — Store Offer Hub) must feel like a premium Leonix public offer page: flyer proves the source, business hub drives contact/visit, approved products get shoppers in, and future list/route/coupon tools show direction without faking live behavior.

## Files inspected

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`

## Files changed

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx`
- `app/lib/ofertas-locales/OFERTAS_PRODUCT_BLUEPRINT_V1_AUDIT.md`
- `scripts/verify-ofertas-product-blueprint-v1.mjs`
- `package.json` (verifier script only)

## Visual/layout changes

- Wide premium canvas: `max-w-7xl` (~1280px), cream `#FFFCF7` background
- Compact owner preview notice (small pill, not dominant banner)
- Hero: 5-col flyer + 4-col offer hub + 3-col desktop live actions
- Dedicated Business Hub section with restaurant-style contact card sections
- Branded social icon buttons via existing `react-icons`
- Future modules row after product grid (mobile-correct order)
- Owner controls separated at bottom

## Business Hub changes

- Sections: Contactar negocio, Nuestra ubicación, Síguenos, Opiniones, Más información
- Phone, WhatsApp, website, email (copy + mailto) — data-driven only
- Directions when address exists
- Social/review/business links with platform brand colors and icons
- No fake ratings, stars, or review counts

## Flyer/PDF visual changes

- Large image frame when real image asset exists
- Premium PDF panel (abstract flyer layout + filename) — not a fake screenshot
- Removed cartoon emoji anchor
- Ver volante / Abrir archivo CTAs preserved

## Product grid changes

- Responsive 1 / 2 / 3 / 4 columns
- Real `sourceCropUrl` only; tasteful no-image gradient state
- Regular price shown only when `regularPriceText` exists
- All UI strings centralized in copy file

## Future modules status

| Module | State | FUTURE WIRING |
|--------|-------|---------------|
| Mi lista | Disabled, Próximamente | Saved shopping list table / dashboard |
| Ruta inteligente | Disabled, Próximamente | Route planner / maps multi-stop |
| Cupones guardados | Disabled, Próximamente | Coupon wallet / saved offers table |

## Translation status

- All new labels in `ofertasLocalesPreviewCopy.ts`
- `?lang=es` and `?lang=en` via existing `useOfertasLocalesAppLang`
- Real text only (globe-compatible; language globe translation layer preserved)

## Mobile/PWA status

- Stack order: notice → header → flyer → offer + CTAs → business hub → products → future → owner
- Min 44px tap targets on CTAs and social buttons
- No horizontal overflow; labels wrap

## Intentionally not touched

- Step 5 upload/scan/review, Step 6 form, Step 7 checkout
- AI scan engine, Gemini, crop generator
- Stripe, admin, dashboard, public results
- Supabase schema, auth, analytics backend
- Shopping list / route / coupon wallet backends
- Global header/footer, other categories

## Risks / deferred work

- Item detail drawer (Surface 2) — Gate 2
- Public results card (Surface 1) — future gate
- Live shopping list / route / coupon wallet
- Map thumbnail preview
- Open/closed hours badge

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Work classified as SCOPED LAUNCH POLISH BUILD | TRUE | This audit header |
| Only Ofertas preview/public hub files changed | TRUE | git diff scoped to preview + audit + verifier |
| No unrelated categories touched | TRUE | Verifier checks git diff |
| No AI scan engine touched | TRUE | No scan files in diff |
| No crop engine touched | TRUE | No crop files in diff |
| No Stripe/payment touched | TRUE | Verifier checks |
| No admin/dashboard touched | TRUE | Verifier checks |
| Page uses wide premium desktop canvas | TRUE | `max-w-7xl` in PreviewCard |
| Page no longer feels like narrow internal receipt | TRUE | 3-column hero + business hub |
| Flyer/PDF visual is large and premium | TRUE | HeroVisual image + PdfFlyerPanel |
| No fake flyer screenshot created | TRUE | Abstract PDF panel only |
| Business/offer info uses real application data | TRUE | draft fields only |
| Business Hub follows contact-card standard | TRUE | PreviewBusinessHub sections |
| Contact CTAs are data-driven | TRUE | href guards on all CTAs |
| Empty CTAs are hidden | TRUE | Conditional render |
| Social icons/links are real and branded where available | TRUE | react-icons + brand colors |
| Google/Yelp links show only if real URLs exist | TRUE | getOfertaLocalSocialLinksByCategory |
| No fake ratings/stars/counts added | TRUE | No rating UI |
| No fake route/distance/open status added | TRUE | No map/distance UI |
| Future modules are disabled and labeled Próximamente/Coming soon | TRUE | Future card components |
| Future wiring comments remain | TRUE | FUTURE WIRING in each card |
| Product/deal grid uses crop only if sourceCropUrl exists | TRUE | ProductGrid cropUrl check |
| Product/deal grid has clean no-image state | TRUE | Gradient no-image block |
| Product/deal cards are readable desktop/tablet/mobile | TRUE | Responsive grid + typography |
| Owner controls are separated from shopper CTAs | TRUE | Bottom owner section |
| Mobile/PWA stack is implemented | TRUE | DOM order + min-h-11 |
| No horizontal overflow on mobile | TRUE | max-w-full, wrap labels |
| Tap targets are mobile-safe | TRUE | min-h-11 buttons |
| ?lang=es works | TRUE | copy keys + lang prop |
| ?lang=en works | TRUE | copy keys + lang prop |
| Global language globe compatibility preserved | TRUE | Real text, no baked images |
| New labels use existing copy/translation pattern | TRUE | ofertasLocalesPreviewCopy.ts |
| No hardcoded Spanish-only UI introduced | TRUE | lang ternary pattern |
| No hardcoded English-only UI introduced | TRUE | lang ternary pattern |
| Leonix brand palette applied intentionally | TRUE | cream/burgundy/gold |
| Audit file created/updated | TRUE | This file |
| Verifier script created/updated | TRUE | verify-ofertas-product-blueprint-v1.mjs |
| Verifier passed | TRUE | npm run verify:ofertas-product-blueprint-v1 |
| npm run build passed | TRUE | npm run build |
| git diff --name-only reviewed | TRUE | Final gate report |
| git status --short reviewed | TRUE | Final gate report |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate-scoped files only |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| GLOBAL WORKING TREE CLEAN: YES/NO | NO | Unrelated clasificados dirty files |
| UNRELATED DIRTY FILES PRESENT: YES/NO | YES | Pre-existing parallel work |
