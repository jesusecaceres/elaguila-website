# Ofertas Preview / Public Offer Hub Polish — Premium Flyer + Coupon Page Foundation

**Task classification:** SCOPED LAUNCH POLISH BUILD  
**Date:** 2026-07-02

## Files inspected

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewAssetCards.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`

## Files changed

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx` (new)
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/OFERTAS_PREVIEW_OFFER_HUB_POLISH_AUDIT.md`
- `scripts/verify-ofertas-preview-offer-hub-polish.mjs`
- `package.json` (verifier script only)

## Current preview issue

Preview used `max-w-lg` (~512px) with a vertical stack resembling an admin receipt. Flyer/coupon was buried in asset cards. Products ran in a narrow 2-column grid. Business/contact info lacked premium hierarchy.

## New layout structure

| Zone | Desktop | Mobile |
|------|---------|--------|
| Container | `max-w-[1240px]` centered | full width padded |
| Hero row | 4-col visual + 5-col offer hub + 3-col actions | stacked |
| Products | 1–4 column responsive grid below hero | 1–2 columns |
| Owner controls | separated burgundy panel at bottom | stacked buttons |

## Live features rendered

- Hero flyer/coupon image or PDF card with open links
- Business name, title, category, market, dates, description
- Published on Leonix trust cue
- Phone, WhatsApp, website, email, directions (when data exists)
- Share via Web Share API or clipboard copy
- Social/review/business link pills (valid URLs only)
- Approved AI product grid with real crop images only
- Membership/digital coupon when lane + URL exist
- Submit/back/edit owner controls with AI review gating

## Placeholder modules

| Component | State | Future wiring |
|-----------|-------|---------------|
| `OfertasFutureShoppingListCard` | Disabled, coming soon | Saved shopping list table / dashboard |
| `OfertasFutureRoutePlannerCard` | Disabled, coming soon | Route planner / maps multi-stop |
| `OfertasFutureCouponWalletCard` | Disabled, coming soon | Coupon wallet / saved offers table |

## Future wiring map

- **Mi lista / My list** → `saved_shopping_list` or dashboard saved offers (FINAL-7)
- **Ruta inteligente / Smart route** → maps route planner integration
- **Cupones guardados / Saved coupons** → coupon wallet persistence table

## Product grid behavior

- Responsive `grid-cols-1 sm:2 lg:3 xl:4`
- Shows crop image only when `sourceCropUrl` is valid
- Clean "Sin imagen / No image" state without fake thumbnails
- No fake savings percentages or original prices

## Contact/social/review behavior

- Full social set via existing helpers
- Google/Yelp as direct link pills only — no star ratings
- Email mailto + copy when valid
- Empty fields hidden

## Mobile behavior

- Single-column stack: notice → title → hero → offer hub → action cards → products → owner controls
- 44px min tap targets on CTAs
- No horizontal overflow

## Deferred items

- Public results/detail page parity (locked routes)
- Live shopping list / route / coupon wallet
- Map thumbnail preview
- Open/closed hours badge (no real hours data)
- Google/Yelp rating widgets
- Featured placement active badge

## TRUE/FALSE/PARTIAL audit table

| Check | Result |
|-------|--------|
| Preview no longer uses skinny max-w-lg layout | TRUE |
| Desktop layout has flyer/coupon hero | TRUE |
| Desktop layout has business/offer hub | TRUE |
| Desktop layout has right-side action cards | TRUE |
| Mobile layout stacks cleanly | TRUE |
| Approved products render in responsive grid | TRUE |
| Product cards show real crop image only if available | TRUE |
| Product cards avoid fake image | TRUE |
| Business name renders | TRUE |
| Offer title renders | TRUE |
| Valid dates render | TRUE |
| Location renders if present | TRUE |
| Phone CTA renders only if present | TRUE |
| WhatsApp CTA renders only if present | TRUE |
| Website CTA renders only if present | TRUE |
| Email CTA renders only if present | TRUE |
| Directions CTA renders only if location exists | TRUE |
| Social links render only if present | TRUE |
| Google/Yelp ratings are not faked | TRUE |
| Trust cue says Published on Leonix / Publicado en Leonix | TRUE |
| No fake verified badge added | TRUE |
| No fake save/list live action added | TRUE |
| Shopping list placeholder is disabled/documented | TRUE |
| Route planner placeholder is disabled/documented | TRUE |
| Coupon wallet placeholder is disabled/documented | TRUE |
| Owner preview controls preserved | TRUE |
| Submit gating preserved | TRUE |
| Step 5 untouched | TRUE |
| Step 7 untouched | TRUE |
| Scan/crop engine untouched | TRUE |
| Stripe untouched | TRUE |
| Analytics untouched | TRUE |
| Admin/dashboard untouched | TRUE |
| Other categories untouched | TRUE |
| No Supabase migration added | TRUE |
