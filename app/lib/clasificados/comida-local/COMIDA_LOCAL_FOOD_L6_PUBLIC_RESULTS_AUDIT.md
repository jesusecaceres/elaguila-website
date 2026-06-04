# Gate FOOD-L6 — Comida Local Public Results + Card + Detail Route + Local Filters

## 1. Gate title

Gate FOOD-L6 — Comida Local Public Results + Card + Detail Route + Local Filters

## 2. Preflight status

- Unrelated dirty work in repo (ofertas-locales, magazine) — **not touched**.
- FOOD-L6 scope: `app/lib/clasificados/comida-local/**`, `app/(site)/clasificados/comida-local/**` only (+ audit script, package.json).

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5B | Table `comida_local_public_listings`; public `status = published`; Leonix ID real when present |
| FOOD-L5C | Image JSONB with HTTPS `url`; safe render only |
| FOOD-L4 | `ComidaLocalDetailShell` + preview VM shape |
| FOOD-L5A | Local filters on Comida Local page only; no global search |

## 4. Files inspected (read-only)

- `serviciosPublicListingsServer.ts`, `restaurantesResultsInventoryServer.ts`
- `ComidaLocalDetailShell`, preview client, publish mapper
- FOOD-L1–L5C audits

## 5. Files changed

- `comidaLocalPublicTypes.ts`, `comidaLocalPublicQueries.ts`, `mapComidaLocalPublicListing.ts`
- `ComidaLocalListingCard.tsx`, `ComidaLocalResultsFilters.tsx`
- `page.tsx`, `[slug]/page.tsx`
- `ComidaLocalDetailShell.tsx` (optional Leonix ID footer)
- `COMIDA_LOCAL_FOOD_L6_PUBLIC_RESULTS_AUDIT.md`, audit script, `package.json`

## 6–11. Results summary

| Area | Result |
|------|--------|
| **Public query** | `listPublishedComidaLocalListings` / `getPublishedComidaLocalListingBySlug` via admin Supabase read; `status = published` only |
| **Mappers** | Row → card VM; row → detail VM via draft snapshot + `mapComidaLocalDraftToPreviewVm` |
| **Card** | Photo/placeholder, chips, Ver ficha, Llamar/WhatsApp when data exists |
| **Filters** | URL params `q`, `city`, `foodType`, `service`, `priceLevel` |
| **Results page** | `/clasificados/comida-local` with count + empty state |
| **Detail** | `/clasificados/comida-local/[slug]` + `notFound()`; no preview badge |

## 12–14. Image / empty / UX

- Images: `resolveComidaLocalImageUrl` / normalize from JSONB; no blob/data.
- Empty: real count zero → CTA to publicar; DB offline → banner.
- UX: cream/burgundy/gold; compact cards; mobile stack grid.

## 15. Not implemented

Analytics, Stripe, dashboard, admin, global search/nav, seed data, publish API edits, migrations.

## 16–17. Desktop / Mobile

- Desktop: 3-col grid, filters in top card.
- Mobile: 1-col cards, full-width CTAs, no horizontal overflow.

## 18. Risks / deferred

- In-memory filter after fetch (cap 300 rows); Postgres-side search later if volume grows.
- Requires server Supabase env for live data.

## 19. Manual QA checklist

1. Visit `/clasificados/comida-local` with published rows in DB.
2. Apply filters via URL; clear filters.
3. Open card → detail slug URL.
4. Confirm Leonix ID on detail when row has `leonix_ad_id`.
5. Empty DB → empty state, no demo cards.
6. Broken image URL → placeholder, no broken `<img>`.

## Requirement audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------ | ---------- | -------- |
| FOOD-L5B audit was read and followed | TRUE | `status = published` filter |
| FOOD-L5C audit was read and followed | TRUE | Image normalize in mapper |
| Comida Local remains separate from Restaurantes Premium | TRUE | Own routes/queries |
| Public results route exists | TRUE | `page.tsx` |
| Public detail route exists | TRUE | `[slug]/page.tsx` |
| Results query reads comida_local_public_listings only | TRUE | `comidaLocalPublicQueries.ts` |
| Results query returns only published rows | TRUE | `.eq("status", "published")` |
| Results query does not use localStorage | TRUE | server-only queries |
| Results query does not use hardcoded demo listings | TRUE | DB fetch only |
| Card mapper uses only real row data | TRUE | `mapComidaLocalRowToCardVm` |
| Detail mapper uses only real row data | TRUE | `mapComidaLocalRowToDetailVm` |
| Public card component exists | TRUE | `ComidaLocalListingCard.tsx` |
| Public card shows real image or clean placeholder | TRUE | card component |
| Public card does not show fake metrics | TRUE | no counters in card |
| Public card excludes restaurant-only CTAs | TRUE | audit grep |
| Local results filters exist | TRUE | `ComidaLocalResultsFilters.tsx` |
| Filters use URL query params | TRUE | `useSearchParams` + router |
| Filters do not modify global search/categoryConfig/nav | TRUE | no forbidden paths |
| Public detail renders real published data | TRUE | slug page |
| Public detail does not show preview badge | TRUE | no preview header |
| Public detail does not show unpublished preview note | TRUE | grep |
| Public detail may show real Leonix ID | TRUE | `leonixAdId` prop |
| Optional sections hide when empty | TRUE | `ComidaLocalDetailShell` sections |
| Unsafe image URLs are not rendered | TRUE | `resolveComidaLocalImageUrl` |
| No fake listings/data/counters/reviews | TRUE | no seeds |
| No analytics tracking | TRUE | no analytics imports |
| No Stripe/payment files edited | TRUE | git scope |
| No dashboard/admin files edited | TRUE | git scope |
| No Restaurante/Rentas/BR/Servicios/En Venta edited | TRUE | git scope |
| No database migrations created | TRUE | no migration changes |
| No app/api files edited | TRUE | git scope |
| Mobile layout remains clean | TRUE | responsive grid |
| Audit script passed | TRUE | npm script OK |
| npm run build passed | TRUE | Phase 13 |
