# Stack C — Clickable Item Preview Plan

## 1. Current item review state

| Layer | Status |
|-------|--------|
| `GET /api/ofertas-locales/items` | Owner auth; returns `OfertaLocalItemReviewViewModel` |
| Review UI | Stack B edit/approve panel |
| Clickable preview | **Not built** — this stack |

## 2. Current asset metadata state

Draft assets: `id`, `url`, `fileName`, `mimeType`, `storagePath`, `pageNumber`.  
Item rows: `source_asset_id`, `source_asset_url`, `source_page`, `source_crop_url` (usually empty).  
Business fields on item rows: `business_name`, `business_city`, `business_zip_code`, `valid_from`, `valid_until`.

## 3. Clickable item card plan

Compact tappable cards: name, price, category/tags, review status, confidence, source page, **Not public** badge. Click opens detail drawer.

## 4. Item detail drawer/modal plan

Client-only overlay (no public route): full item fields, business/location/dates, source context link when HTTPS URL exists, private preview safety copy.

## 5. Flyer/coupon context strategy

- Match `sourceAssetId` to draft `flyerAssets` / `couponAssets` for file name label
- Open `sourceAssetUrl` in new tab when safe HTTPS
- Honest empty state when URL missing

## 6. Bounding box/highlight status

**No reliable bounding box coordinates in DB or extraction pipeline.**  
`source_crop_url` exists but is not populated by current normalizer.  
**Full flyer/coupon context only** — highlight overlay pending future extraction coordinates. No fake overlay in Stack C.

## 7. Owner-only/private preview safety

- Uses owner items API only
- No public routes
- Approved items show “not public yet” copy
- No `is_active` changes

## 8. What will not be implemented

Public search, results, detail routes, shopping list, Maps, payment, admin, analytics, migrations.

## 9. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
