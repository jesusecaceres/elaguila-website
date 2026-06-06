# Ofertas Locales — Vision Pipeline (Future Stacks)

Architecture reference for shopper-facing search, items, lists, and routes. **Not implemented in Stack 9B.**

## 1. AI extraction pipeline

1. Business uploads flyer/coupon asset (existing `flyer_assets` / `coupon_assets` metadata).
2. Scan job created (`OfertaLocalScanJobDraft` → future `oferta_local_scan_jobs` table).
3. Google Document AI or selected extractor parses pages → candidate `OfertaLocalSearchableItemDraft` rows.
4. Business reviews items in dashboard (approve / edit / reject).
5. Approved items published to `oferta_local_items` and become searchable.

**Gate:** `wantsAiSearchableSpecials` intent collected in application; extraction not active until payment + ops stack.

## 2. Clickable item cards (public results)

- Search/filter returns item cards (product name, price text, business, valid dates).
- Tap item → detail card with business name, price, valid dates, **Call**, **Directions**, link to full flyer/coupon asset.
- Item detail does not replace business listing; it deep-links to parent offer.

## 3. Shopping list V1

- Shopper adds items from item cards to a local/session shopping list.
- List groups items by business/store.
- No login required for V1.
- Share / copy / send list (clipboard or native share) in a later polish stack.

## 4. Google Maps route V1

- From shopping list, shopper selects up to **5 store stops**.
- App builds a **Google Maps directions URL** (no Maps API key required).
- Opens in Google Maps app/browser.
- V1: fixed stop order as added; V2: optional start location + simple closest-next sort.

Example URL pattern: `https://www.google.com/maps/dir/?api=1&destination=...&waypoints=...`

## 5. Future Supabase tables

| Table | Purpose |
|-------|---------|
| `oferta_local_items` | Approved searchable items linked to offer + source asset/page |
| `oferta_local_scan_jobs` | AI scan lifecycle and errors |
| `oferta_local_shopping_lists` | Optional persisted lists (V2); V1 may use localStorage only |
| `oferta_local_route_events` | Analytics for route generation (deferred — no tracking in 9B) |

## Related existing types

- `OfertaLocalSearchableItemDraft`, `OfertaLocalScanJobDraft` in `ofertasLocalesTypes.ts`
- Asset metadata: `storagePath`, `url`, `mimeType`, `fileName`, `pageNumber`, `status`
