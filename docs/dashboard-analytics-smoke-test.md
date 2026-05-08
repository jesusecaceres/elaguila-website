# Dashboard analytics — internal audit & smoke test

This document maps **displayed metrics → `listing_analytics.event_type` → tracking entry points**, notes **DB columns**, and lists a **manual smoke checklist** for QA.

## Schema & RLS

- **Table:** `public.listing_analytics`
- **Migrations:** `20250311000000_listing_analytics.sql`, `20250429000000_extend_listing_analytics_events.sql`, `20260507180000_listing_analytics_schema_complete.sql`, `20260507200000_listing_analytics_category_index.sql`
- **Columns (app inserts):** `listing_id`, `event_type`, `user_id`, `event_source`, `owner_user_id`, `anonymous_session_id`, `metadata`, `category`, `created_at`
- **RLS:** Open `INSERT` + open `SELECT` (same compatibility model as legacy Leonix tracking from the browser). Tighter owner-only reads would require a service-role or RPC path; not changed here to avoid breaking client rollups.

## Central event allowlist

- **Module:** `app/lib/listingAnalyticsEventTypes.ts` — `LISTING_ANALYTICS_EVENT_TYPES`, `isListingAnalyticsEventType()`
- **Tracking:** `app/lib/clasificadosAnalytics.ts` (`ClasificadosEventType`), `app/lib/listingAnalytics.ts` (`trackEvent` validates allowlist before insert)
- **Aggregation:** `app/(site)/dashboard/lib/listingAnalyticsAggregate.ts`, `app/(site)/dashboard/lib/dashboardAnalyticsSummary.ts`

## Owner scope

- **Listing keys:** `collectOwnerListingKeysForAnalytics()` in `app/lib/ownerEngagementListingKeys.ts` — collects `listings.id`, `listings.leonix_ad_id`, and category table ids/slugs/ad ids for the logged-in owner only.
- **Rollups:** `fetchOwnerAnalyticsTotals`, `fetchOwnerListingViewLeaders`, `/dashboard` summary, and per-listing rollups filter events with `.in("listing_id", keys)` so **other users’ events are never counted**.

---

## `/dashboard?lang=es` — summary cards

| Card (ES) | Metric | Source | `event_type` / table | Tracked? | Notes |
|-----------|--------|--------|----------------------|----------|-------|
| Anuncios activos | Active / published inventory | `countOwnerActiveListingsAcrossSources()` | `listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `restaurantes_public_listings` | Yes | Per-source status filters (`active` / `published` / `lifecycle_status`). Servicios falls back to all rows if `listing_status` filter errors. |
| Vistas totales | Total views | `fetchOwnerAnalyticsTotals().totals.listingViews` | `listing_analytics` | Yes | `listing_view` only. |
| Mensajes totales | Contact signals | `totals.messages + totals.leads` | `listing_analytics` | Yes | **`message_sent` + `lead_created`** (not inbox unread). Card links to `/dashboard/analytics`. |
| Guardados | Net saves | `fetchOwnerAnalyticsTotals().totals.saves` | `listing_analytics` | Yes | `listing_save` − `listing_unsave`, floored at 0. |
| Por expirar (7 días) | Soon expiring | `fetchDashboardNavCounts().expiringSoon` | `listings.boost_expires`, `listings.expires_at` | Partial | **Listings table only** today. Footnote on dashboard explains other categories may be missing until the same fields exist. |

**Helper copy** (under cards): real interactions + zero-until-engagement explanation (see `app/(site)/dashboard/page.tsx`).

**Degraded state:** If `listing_analytics` cannot be read, `fetchOwnerAnalyticsTotals` returns zeros + `listingAnalyticsUnavailable`; home shows a **single** sky notice (`t.analyticsDegraded`).

---

## `/dashboard/analytics?lang=es`

| Card | `event_type` (and logic) | Aggregation |
|------|--------------------------|---------------|
| Anuncios | `countOwnerInventoryListings` | Row count across inventory tables (not event-based). |
| Vistas (eventos) | `listing_view` | Count |
| Vistas únicas | `listing_view` with distinct `user_id` | Estimate (logged-in viewers only). |
| Guardados | `listing_save` / `listing_unsave` | Net ≥ 0 |
| Compartidos | `listing_share` | Count |
| Mensajes (evento) | `message_sent` | Count |
| Vistas de perfil | `profile_view` | Count |
| Aperturas de ficha | `listing_open` | Count |
| Me gusta | `listing_like` / `listing_unlike` | Net ≥ 0 |
| Clics en CTA | `cta_click`, `phone_click`, `whatsapp_click`, `website_click`, `directions_click` | Count |
| Contactos / leads | `lead_created` | Count |
| Solicitudes | `apply_started`, `apply_submitted` | Count |
| Última interacción | any row `created_at` | Max timestamp |

**Tracking entry points (examples):**

| Event | Typical emitter |
|-------|-----------------|
| `listing_view` | Category `*Analytics*.ts`, `anuncio/[id]/page.tsx` (`trackEvent`) |
| `listing_open` | `anuncio/[id]`, En Venta / Rentas `trackEvent` |
| Like/save/share | `LeonixLikeButton`, `LeonixSaveButton`, `LeonixShareButton`, category analytics |
| CTA clicks | `trackCtaClick` / `trackClasificadosEvent` from cards & detail |
| `message_sent` | `anuncio/[id]` message flow, `enVentaAnalytics` |
| `lead_created` | `trackLeadCreated` in category analytics |
| `profile_view` | Where profile surfaces fire tracking |
| Apply events | Empleos `trackApplicationEvent` |

**Empty / setup UI:** See `app/(site)/dashboard/analytics/page.tsx` — one setup notice, no duplicate raw PostgREST errors.

---

## `/dashboard/mis-anuncios/[id]?tab=analytics`

- **Rollup:** `rollupListingAnalyticsEvents()` over **`listing.id` + `leonix_ad_id`** so events stored under either key merge honestly.
- **Metrics shown:** views, unique views, messages, leads, saves, shares, likes, CTA clicks, listing opens, profile clicks, applications, last interaction timestamp.
- **Not “coming soon”** for metrics backed by `listing_analytics` above.

---

## Manual smoke checklist

1. Open a **public** listing in a **private/incognito** window (or second browser).
2. Confirm **`listing_view`** increments on `/dashboard/analytics` and `/dashboard` “Vistas totales” for that owner.
3. Click **Like** (Leonix) → **`listing_like`** increases; unlike → net likes correct.
4. **Save** → **`listing_save`** / unsave → net **Guardados** correct.
5. **Share** → **`listing_share`** increases.
6. Click **phone / WhatsApp / web / directions** where present → **CTA** bucket increases.
7. Send **contact / message** where implemented → **`message_sent`** and/or **`lead_created`** per flow.
8. Return to owner session: open **`/dashboard?lang=es`** — numbers match expectations (or honest zeros + footnotes).
9. Open **`/dashboard/analytics?lang=es`** — no raw Supabase schema errors; at most one setup notice if table missing.
10. Open **`/dashboard/mis-anuncios/{id}?tab=analytics&lang=es`** — per-listing metrics match rollups; no fake totals.
11. If **`listing_analytics`** is missing in Supabase, apply migrations and reload schema cache; repeat steps 2–10.

## Known gaps (honest)

- **Unique viewers:** underestimated when viewers are anonymous (no `user_id`); distinct logged-in users only.
- **Por expirar:** only `listings` boost/expiry windows unless extended per category table.
- **Legacy `trackEvent`:** minimal payload (no `owner_user_id` / `category`); prefer `clasificadosAnalytics` on new surfaces.
