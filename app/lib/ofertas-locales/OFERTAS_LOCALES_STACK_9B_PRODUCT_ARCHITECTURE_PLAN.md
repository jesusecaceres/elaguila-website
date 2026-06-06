# Stack 9B — Ofertas Locales Product Architecture Plan

## 1. Current Step 1 issue

Step 1 renders six `OFERTAS_LOCALES_OFFER_TYPE_OPTIONS` cards (weekly flyer, coupon, promotion, seasonal, bundle, featured deal). Only two are base sellable products; the rest confuse businesses and imply separate paid tiers.

## 2. Final product model

| # | Product | Price (application display) |
|---|---------|----------------------------|
| 1 | Weekly Flyer / Volante semanal | $399/mo |
| 2 | Coupon / Promotion / Cupón o promoción | $199/mo |
| 3 | AI Product Search Add-On | +$199/mo (upgrade) |
| 4 | Want More Exposure | Contact Leonix |
| 5 | Leonix Partner | Invite-only / contact |

## 3. Old offer type → new UI mapping

| Internal `offerType` | Step 1 product | Step 3 subtype |
|---------------------|----------------|----------------|
| `weekly_flyer` | Weekly Flyer | — |
| `coupon` | Coupon / Promotion | General (default) |
| `promotion` | Coupon / Promotion | General promotion |
| `seasonal_special` | Coupon / Promotion | Seasonal special |
| `bundle` | Coupon / Promotion | Bundle/combo |
| `featured_deal` | Coupon / Promotion | Limited-time deal (not active featured placement) |

Internal types preserved for drafts and publish mapper.

## 4. AI Product Search explanation

Paid upgrade card: extract searchable items from flyer/coupon; business reviews and approves before items go live. Not active in this stack.

## 5. More Exposure / Destacado positioning

Contact-oriented card on Step 1 and Review — not an offer type. `wantsFeaturedPlacement` remains optional intent in Step 6 Extras.

## 6. Leonix Partner invite-only positioning

Contact-only copy on Step 1; no public partner discount pricing in application UI.

## 7–10. Future pipelines (documented in `OFERTAS_LOCALES_VISION_PIPELINE.md`)

- AI extraction → scan → review → approved items live
- Clickable item cards → flyer + business + CTA
- Shopping list V1 (no login)
- Google Maps route V1 (max 5 stops, URL-based)

## 11. Future Supabase tables

- `oferta_local_items`
- `oferta_local_scan_jobs`
- `oferta_local_shopping_lists`
- `oferta_local_route_events`

## 12. What will not be touched

Public results, detail pages, admin, payment, migrations, upload API, header/nav, unrelated categories.

## 13. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
