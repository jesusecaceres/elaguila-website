# Stack 10 — Ofertas Locales AI Item Architecture Plan

## 1. Existing foundation found

| Area | Status |
|------|--------|
| `OfertaLocalSearchableItemDraft` | Minimal V2 draft (name, price, tags, reviewStatus, sourceAssetId) |
| `OfertaLocalScanJobDraft` | Minimal (status, sourceAssetId, timestamps, error) |
| `OfertaLocalScanJobStatus` | idle, pending, processing, needs_review, approved, failed, cancelled |
| `wantsAiSearchableSpecials` | On `OfertaLocalDraft` + publish metadata |
| Asset metadata | `storagePath`, `url`, `mimeType`, `fileName`, `pageNumber`, `status` |
| `OFERTAS_LOCALES_VISION_PIPELINE.md` | Stack 9B high-level pipeline |
| Parent offer publish | `OfertaLocalPublishStatus` — approved required for future public items |

## 2. Tool decision: Google Document AI

**Primary scanner brain:** Google Document AI  
- Phase 1: Enterprise Document OCR + Layout Parser  
- Phase 2: Custom Extractor after real flyer/coupon sample corpus  

No SDK or credentials in Stack 10.

## 3. Leonix AI Normalizer role

Post-scan layer that maps raw Document AI output → `OfertaLocalSearchableItemDraft` candidates.  
May use OpenAI or Gemini later for cleanup/categorization — **not implemented in Stack 10**.

## 4. Business verification workflow

1. Scan produces candidates with `reviewStatus: pending` or `needs_review`  
2. Business reviews in future dashboard  
3. Only `reviewStatus === approved` + `isActive === true` items eligible for public  
4. Parent offer must be `approved` and within valid dates  

## 5. Future scan job lifecycle

`idle` → `pending` → `processing` → `needs_review` → `reviewed` → `approved` | `failed` | `cancelled`

## 6. Future item/deal record shape

Extended `OfertaLocalSearchableItemDraft` + `OfertaLocalScanJobRecordDraft` (Stack 10 types).

## 7. Future clickable item card shape

`OfertaLocalClickableItemCardView` — title, price, business, CTAs, flyer links.

## 8. Future public search requirements

- Index `normalizedItemName`, `searchTags`, business city/ZIP  
- Only approved + active items  
- Parent offer approved/live  
- Valid date window active  

## 9. Future shopping list requirements

`OfertaLocalShoppingListDraft` — session-based, no login V1, group by store.

## 10. Future Google Maps route V1 (max 5 stops)

`OfertaLocalShoppingRouteDraft` — URL-based directions, no Maps API key in V1.

## 11. Future Supabase tables

- `oferta_local_scan_jobs`
- `oferta_local_items`
- `oferta_local_shopping_lists`
- `oferta_local_route_events`

## 12. Future APIs needed (not Stack 10)

- `POST /api/ofertas-locales/scan` — enqueue scan job  
- `GET/PATCH /api/ofertas-locales/items` — review workflow  
- Public search API (later stack)  
- Shopping list — client-only V1  

## 13. Cost/usage guardrails (high level)

- Scan only when `wantsAiSearchableSpecials` + paid entitlement (future)  
- Page limits per asset; rate limits per owner  
- Re-scan requires explicit user action  
- Store raw/normalized JSON in object storage, not inline in Postgres rows  

## 14. What will not be implemented in Stack 10

- Document AI / OpenAI / Gemini API calls  
- DB migrations, public search, shopping list UI, Maps route UI  
- Admin dashboard, analytics, payment  

## 15. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
