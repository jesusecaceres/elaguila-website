# Stack B — Owner Review UI Plan

## 1. Current scan/job/item state

| Layer | Status |
|-------|--------|
| `oferta_local_scan_jobs` | Stack 11 migration — owner RLS, no public SELECT |
| `oferta_local_items` | Stack 11 — `review_status` default `pending`, `is_active` default `false` |
| `POST /api/ofertas-locales/scan` | Stack 12 — inserts inactive candidates |
| Scan UI | `OfertasLocalesAiScanPanel` — needs `ofertaLocalId` from submit success |
| Review UI | **Not built** — this stack |

## 2. Review UI data model

`OfertaLocalItemReviewViewModel` — camelCase for client; maps from `OfertaLocalItemDbRow`.

Fields: id, itemName, normalizedItemName, category, subcategory, priceText, priceAmount, unit, dealType, quantity, searchTags, reviewStatus, confidence, confidenceLabel, sourceAssetId, sourceAssetUrl, sourcePage, isActive, scanJobId, ofertaLocalId.

## 3. Review API route plan

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ofertas-locales/items` | GET | List owner items by `ofertaLocalId`, optional `scanJobId` |
| `/api/ofertas-locales/items/[itemId]` | PATCH | Owner edit + review status transition |

Auth: `getBearerUserId`. Ownership: filter `owner_id = auth.uid()`; verify parent `ofertas_locales.owner_id`.

## 4. Owner auth/ownership strategy

Bearer token → Supabase user id → service-role query with `owner_id` + parent offer check. No admin bypass in UI.

## 5. Edit/approve/reject behavior

| Action | review_status | is_active |
|--------|---------------|-----------|
| Save edits | unchanged unless in patch | **false** (forced) |
| Approve | `approved` | **false** |
| Needs review | `needs_review` | **false** |
| Reject | `rejected` | **false** |

Approval ≠ public activation. Public search is a later stack.

## 6. Safety rules

- Never set `is_active: true` in this stack
- No public SELECT / public pages
- Sanitize all string fields; validate review_status enum
- Approved items show “not public yet” copy

## 7. What will not be implemented

Public search, results, detail pages, shopping list, Maps route, payment, admin, analytics, migrations.

## 8. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
