# Ofertas Public Results Card Templates V1 Audit

## 1. Task classification

**SCOPED GATED BUILD** — Leonix-branded public results card templates for Ofertas Locales (flyer/store, product/item, coupon/promo), no fake data, no Stripe.

## 2. Files inspected

- `OfertasLocalesPublicSearchClient.tsx`
- `OfertasLocalesPublicOfferCard.tsx`
- `OfertasLocalesPublicItemCard.tsx`
- `OfertasLocalesPublicItemDetailDrawer.tsx`
- `OfertasLocalesPublicOfferDetailDrawer.tsx`
- `OfertasLocalesShoppingListPanel.tsx`
- `ofertasLocalesPublicSearchCopy.ts`
- `[id]/page.tsx` + `OfertasLocalesPublicDetailView.tsx`
- `ofertasLocalesTypes.ts`
- `ofertasLocalesPublicOfferHelpers.ts`
- `ofertasLocalesPublicSearchHelpers.ts`
- `ofertasLocalesPublicDetailHelpers.ts`
- `OFERTAS_ADMIN_APPROVAL_PUBLIC_VISIBILITY_V1_AUDIT.md`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`

## 3. Files changed

- `OfertasLocalesPublicOfferCard.tsx` — flyer/store + coupon/promo Leonix card template
- `OfertasLocalesPublicItemCard.tsx` — product/item Leonix card template
- `OfertasLocalesPublicSearchClient.tsx` — results grid rhythm + honest empty states
- `ofertasLocalesPublicSearchCopy.ts` — CTA labels, offer type labels, approved empty copy, helpers
- `OfertasLocalesPublicOfferDetailDrawer.tsx` — coupon preview image alignment (Cupones)
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts` — card template checks
- `OFERTAS_PUBLIC_RESULTS_CARD_TEMPLATES_V1_AUDIT.md` — this audit

## 4. Current card architecture

| Layer | Behavior |
|-------|----------|
| Results client | Fetches `public-offers` + `public-search`; renders offers/items grids; mode intro preserved |
| Offer card | Receives `OfertaLocalPublicOfferCard` (id, business, title, offerType, location, dates, primaryAssetHref, etc.) |
| Item card | Receives `OfertaLocalPublicSearchItem` (name, price, sourceAssetHref, business, location, etc.) |
| Item drawer | Uses same item fields + add/remove/list handlers |
| Shopping list | `createShoppingListItemFromPublicItem` from public item fields |
| Public detail | `/clasificados/ofertas-locales/[id]` via `ofertaLocalPublicDetailPath` |
| Cupones | `surface="cupones"` — offer cards use `onSelect` drawer; product cart hidden |

## 5. Flyer/store card design contract

- Cream/ivory gradient surface, gold border, charcoal text, burgundy CTA
- Medium-large flyer preview: `aspect-[3/4]`, mobile max `min(48vh,360px)`, desktop max `280px`
- `object-contain` inside padded cream frame
- Business initial avatar fallback (no fake logo)
- Offer type badge from real `offerType`
- CTA: Ver volante / Ver ofertas via `ofertaLocalPublicOfferCardCta`
- Links to public detail hub

## 6. Product/item card design contract

- Square image area max ~220px, `object-contain`
- Honest empty: "Imagen no disponible" / "Image unavailable"
- Serif product name, burgundy price badge
- Store name + location + source page when present
- CTAs: Ver detalle + Agregar a lista (burgundy primary)
- Added/remove/list behavior preserved

## 7. Coupon/promo card design contract

- Same offer card component; `isOfertaLocalCouponOfferType` or Cupones surface → coupon layout
- Shorter preview area when image present; badge/offer focused body
- Cupones: button + `onSelect` → detail drawer (unchanged flow)
- No product shopping list on Cupones

## 8. Flyer size rule

| Viewport | Rule |
|----------|------|
| Desktop | 3-column grid; flyer preview max-height 280px, aspect 3:4 |
| Mobile | 1 column; flyer preview max-height min(48vh, 360px) |
| Image fit | `object-contain` in cream frame |
| Missing image | Dashed placeholder — "Volante no disponible" (no fake flyer art) |

## 9. Public detail route findings

- Offer cards link to `/clasificados/ofertas-locales/[id]?lang=…`
- Detail page fetches approved offer; `OfertasLocalesPublicDetailView` already Leonix-branded
- No full hub rebuild in this gate — recommend **Store/Flyer Public Hub Polish V1** for deeper hub work

## 10. Cupones separation findings

- `!isCupones` gates floating shopping list cart — preserved
- Cupones offer cards use drawer via `onSelect` — preserved
- Product add-to-list not rendered on Cupones surface — preserved
- Drawer now shows coupon/flyer preview image when `primaryAssetHref` exists

## 11. Empty/no-data behavior

Honest approved-data messaging (ES/EN):

- No filters: pipeline empty title/body about Leonix approval
- With filters: approved empty title/body + clear-filters hint
- Mode-specific empty copy preserved in result mode helper
- No fake cards, counts, or sample businesses

## 12. Intentionally not touched

- Ofertas landing page shell and discovery sections
- Landing header/search canvas
- Admin approval / public activation pipeline
- Publish flow, Stripe, DB/schema/RLS, auth
- Other categories, global nav
- Full Store/Flyer hub rebuild
- Full Cupones landing redesign
- Product drawer major redesign (only offer drawer tiny image polish)

## 13. TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Landing page untouched | TRUE |
| Results shell preserved | TRUE |
| Mode intro preserved | TRUE |
| Flyer/store card template built | TRUE |
| Flyer preview medium-large, not tiny | TRUE |
| Flyer preview controlled, not giant | TRUE |
| Product/item card template built | TRUE |
| Add-to-list preserved | TRUE |
| Product drawer preserved | TRUE |
| Coupon/promo card behavior preserved | TRUE |
| Cupones product cart hidden | TRUE |
| Public detail route confirmed | TRUE |
| No fake flyers created | TRUE |
| No fake products created | TRUE |
| No fake partner/sponsor data created | TRUE |
| No fake counts created | TRUE |
| No Stripe/payment touched | TRUE |
| No DB/schema/RLS touched | TRUE |
| No admin/dashboard/auth touched | TRUE |
| No other categories touched | TRUE |
| Mobile-safe by code review | TRUE |
| Audit script passed | (Gate 11) |
| Build passed | (Gate 11) |
