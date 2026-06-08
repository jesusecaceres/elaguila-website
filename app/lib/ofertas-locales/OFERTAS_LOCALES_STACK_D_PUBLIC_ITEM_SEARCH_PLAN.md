# Stack D — Public Item Search MVP Plan

## 1. Current item/offer DB safety status

| Table | RLS | Public SELECT |
|-------|-----|---------------|
| `oferta_local_items` | Owner-only | **None** — deferred in Stack 11 migration |
| `ofertas_locales` | Owner-only | **None** — deferred in Stack 7 migration |

**Item defaults:** `review_status = pending`, `is_active = false`  
**Stack B:** Owner approve sets `review_status = approved` but keeps `is_active = false`  
**Activation:** Public search requires `is_active = true` — no items appear until explicitly activated (future activation gate). Empty results are honest and safe.

**Eligibility helper:** `canOfertaLocalItemBePubliclyEligible()` in `ofertasLocalesAiDbMapper.ts`

## 2. Public visibility rules

Public API returns a row only when ALL are true:

1. `item.review_status = approved`
2. `item.is_active = true`
3. `parent.status = approved`
4. Parent not `archived` / `rejected` / `expired`
5. Valid date window active (item dates if both set, else parent dates)
6. `item_name` present (owner-approved display name)
7. Never expose: `reviewer_note`, `internal_notes`, `owner_id`, raw `description`, pending/needs_review/rejected rows

## 3. Query/API strategy

**Server route:** `GET /api/ofertas-locales/public-search`  
Uses **admin Supabase** (service role) — safer than client Supabase because no public RLS exists yet.

Join `oferta_local_items` → `ofertas_locales` (inner). Hard filters in query; keyword/city/ZIP/category/sort applied in mapper layer.

## 4. Route strategy

| Route | Purpose |
|-------|---------|
| `/clasificados/ofertas-locales` | Public search + results shell |

No dynamic public detail route — client-side drawer on results page (Stack C pattern).

## 5. Filter strategy

Query params: `q`, `city`, `zip`, `category`, `marketType`, `offerType`, `sort`, `lang` (UI only)

Sort: `newest`, `price_low`, `expiring_soon`

## 6. Item card strategy

Reuse Stack C price formatting. Show: name, price, unit, business, city/ZIP, valid dates, category/tag, source page, **Ver oferta / View deal** CTA.

## 7. Item detail/flyer context strategy

Client drawer: item + parent offer public fields, phone/website/directions CTAs, membership/digital coupon when public-safe, source flyer/coupon link (HTTPS only), bounding box note (full context only — no fake highlight).

## 8. Empty state strategy

When no rows match filters (including zero activated items):  
ES: *No encontramos ofertas con esos filtros.*  
EN: *We didn't find deals with those filters.*

Note in plan: approved-but-inactive items remain hidden until activation workflow.

## 9. What will not be implemented

Shopping list, route builder, Maps optimization, payment, admin/dashboard, analytics, header/nav changes, migrations, `is_active` activation UI (deferred).

## 10. QA URLs

- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
