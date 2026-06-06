# Ofertas Locales — AI Extraction & Clickable Items Architecture

## 1. Final AI stack

| Layer | Role |
|-------|------|
| **Google Document AI** | Primary scanner brain — OCR + Layout Parser first; Custom Extractor later |
| **Leonix AI Normalizer** | Maps raw scan JSON → item/deal candidate rows |
| **OpenAI / Gemini** | Optional future cleanup/categorization — not in Stack 10 |
| **Business verification** | Required before any item is public |

## 2. Extraction flow

1. Business uploads flyer/coupon/PDF/image (`OfertaLocalDraftAsset`)
2. Scan job created (`OfertaLocalScanJobRecordDraft` → future `oferta_local_scan_jobs`)
3. Google Document AI produces raw layout/OCR JSON → stored at `rawResultStoragePath`
4. Leonix normalizer produces candidates → `normalizedResultStoragePath`
5. Candidates become `OfertaLocalSearchableItemDraft` rows with `reviewStatus`
6. Business reviews in future dashboard — approve / reject / edit
7. Approved + active items become searchable
8. Public UI renders `OfertaLocalClickableItemCardView`

## 3. Clickable item card behavior

- Shopper finds item via future search or list
- Tap opens detail card with price, business, valid dates, source flyer crop
- Actions: view full flyer, call, directions, add to shopping list (later stack)
- Sponsored items show `sponsorshipLabel` when `isSponsored`

## 4. Shopping list behavior (V1)

- No login required — `sessionId` + local storage
- `OfertaLocalShoppingListDraft` holds items grouped by store (via `getOfertaLocalRouteStopKey`)
- Share/copy/send — future stack

## 5. Route V1

- Max **5** store stops (`OFERTAS_LOCALES_SHOPPING_ROUTE_MAX_STOPS`)
- `googleMapsUrl` built client-side — no paid Routes API in V1
- Later: closest-next sort, optional geocoding if approved

## 6. Future Supabase tables

| Table | Purpose |
|-------|---------|
| `oferta_local_scan_jobs` | Scan lifecycle, raw/normalized paths |
| `oferta_local_items` | Approved searchable items |
| `oferta_local_shopping_lists` | Session lists (optional server sync later) |
| `oferta_local_route_events` | High-intent route click analytics |

## 7. Safety rules

- **No AI auto-publication** — `canOfertaLocalItemGoPublic()` enforces rules
- Confidence visible to owner/admin only
- Low confidence → `needs_review`
- Parent offer must be `approved` and date-active
- `reviewStatus === approved` AND `isActive === true` required

## 8. Monetization

- **AI Product Search:** +$199/mo (bundled intent on wizard Step 1)
- **More Exposure / sponsored:** contact-only; `isSponsored` + `sponsorshipWeight` on items
- Route clicks → future high-intent analytics (`oferta_local_route_events`)

## QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
