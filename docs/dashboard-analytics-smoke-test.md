# Dashboard analytics — internal audit & smoke test

**See also:** [`docs/dashboard-admin-smoke-test.md`](./dashboard-admin-smoke-test.md) — Playwright **read-only** dashboard / admin / public clasificados smoke (`npm run smoke:all`), env vars, and high-level product audit matrix.

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

| Card (ES) | Metric | Source | `event_type` / table | Tracked? | Notes | Recommended fix |
|-----------|--------|--------|----------------------|----------|-------|-----------------|
| Anuncios activos | Active / published inventory | `countOwnerActiveListingsAcrossSources()` | `listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `restaurantes_public_listings` | Yes | Per-source status filters (`active` / `published` / `lifecycle_status`). Servicios falls back to all rows if `listing_status` filter errors. | Keep aligned with publish tables when new lanes ship. |
| Vistas totales | Total views | `fetchOwnerAnalyticsTotals().totals.listingViews` | `listing_analytics` | Yes | `listing_view` only. | Apply migrations; ensure public pages call `trackListingView` / `trackEvent`. |
| Mensajes totales | Contact signals | `totals.messages + totals.leads` | `listing_analytics` | Yes | **`message_sent` + `lead_created`** (not inbox unread). Card links to `/dashboard/analytics`. | Wire `trackLeadCreated` on any contact surface still missing it. |
| Guardados | Net saves | `fetchOwnerAnalyticsTotals().totals.saves` | `listing_analytics` | Yes | `listing_save` − `listing_unsave`, floored at 0. | Ensure Leonix save buttons pass `owner_user_id` where possible. |
| Por expirar (7 días) | Soon expiring | `fetchDashboardNavCounts().expiringSoon` | `listings.republished_at` (post-republish visibility window end), `listings.expires_at` | Partial | **Listings table only** today. Uses `republished_at` + En Venta visibility window (Admin **Republish** contract), not `boost_expires`. UI shows **“Aún no registrado” / “Not tracked yet”** when the count is `null` (could not compute). | Add parallel expiry / republish fields for other verticals when product defines them. |

**Helper copy** (under cards): real interactions + zero-until-engagement explanation (see `app/(site)/dashboard/page.tsx`).

**Degraded state:** If `listing_analytics` cannot be read, `fetchOwnerAnalyticsTotals` returns zeros + `listingAnalyticsUnavailable`; home shows a **single** sky notice (`t.analyticsDegraded`).

---

## `/dashboard/analytics?lang=es`

| Card | `event_type` (and logic) | Aggregation | Recommended fix |
|------|--------------------------|-------------|-----------------|
| Anuncios | — | `countOwnerInventoryListings` | Keep inventory helper in sync with new publish tables. |
| Vistas (eventos) | `listing_view` | Count | Same as home — migrations + page view hooks. |
| Vistas únicas | `listing_view` + distinct `user_id` | Estimate (logged-in only) | Optional: session-based dedupe in metadata for anon viewers (larger change). |
| Guardados | `listing_save` / `listing_unsave` | Net ≥ 0 | — |
| Compartidos | `listing_share` | Count | — |
| Mensajes (evento) | `message_sent` | Count | — |
| Vistas de perfil | `profile_view` | Count | Emit from profile surfaces that lack tracking today. |
| Aperturas de ficha | `listing_open` | Count | Ensure modal/detail open paths call `trackEvent` / category analytics. |
| Me gusta | `listing_like` / `listing_unlike` | Net ≥ 0 | — |
| Clics en CTA | `cta_click`, `phone_click`, `whatsapp_click`, `website_click`, `directions_click` | Count | — |
| Contactos / leads | `lead_created` | Count | — |
| Solicitudes | `apply_started`, `apply_submitted` | Count | Empleos apply flows only today. |
| Última interacción | any row `created_at` | Max timestamp | — |

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

## Manual smoke checklist (17 steps)

1. Open a **public** listing in another browser or **incognito** session (not the owner account).
2. Confirm **`listing_view`** increases for the owner on **`/dashboard/analytics?lang=es`** and **“Vistas totales”** on **`/dashboard?lang=es`**.
3. Click **Like** on the listing (Leonix control).
4. Confirm **likes** increase on **`/dashboard/analytics`** (and per-listing tab if applicable).
5. **Save** the listing.
6. Confirm **Guardados** (net saves) increase on **`/dashboard`** and **`/dashboard/analytics`**.
7. **Share** the listing (share control).
8. Confirm **Compartidos** increases on **`/dashboard/analytics`**.
9. Tap **phone / WhatsApp / website / directions** CTAs if the listing exposes them.
10. Confirm **CTA clicks** increase on **`/dashboard/analytics`**.
11. Submit a **contact / message** (or lead form) where the product supports it.
12. Confirm **Mensajes (evento)** and/or **Contactos / leads** increase (and home **Mensajes totales** = `message_sent` + `lead_created`).
13. Open **`/dashboard?lang=es`** — summary cards show **real numbers** or **honest zeros** / **“Aún no registrado”** for expiring when unknown; read footnotes.
14. Open **`/dashboard/analytics?lang=es`** — **no raw Supabase** errors; at most **one** setup notice if the table is missing; empty state if all zeros with inventory.
15. Open **`/dashboard/mis-anuncios/{listingId}?tab=analytics&lang=es`** — metrics match the same event vocabulary (including **`leonix_ad_id`** rollup).
16. Confirm **no duplicate** raw schema-cache error strings in the UI.
17. With **no events** yet, confirm **zeros** plus **honest empty/setup** copy (no fake non-zero metrics).

**If `listing_analytics` is missing:** apply **`20260507180000_listing_analytics_schema_complete.sql`** (and follow-up index migration), reload PostgREST schema cache, then repeat steps 1–17.

---

## Production: make `listing_analytics` live (Supabase)

### 1) Repo migrations (must exist)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260507180000_listing_analytics_schema_complete.sql` | Idempotent full table shape, CHECK on `event_type`, indexes, RLS insert/select |
| `supabase/migrations/20260507200000_listing_analytics_category_index.sql` | Index on `category` |

### 2) Confirm they ran on **production**

- **Supabase Dashboard** → your **production** project → **Database** → **Migrations** (or **SQL** history): look for timestamps `20260507180000` / `20260507200000`, **or**
- **CLI** (with project linked): `supabase migration list` / `supabase db remote commit` per your team workflow.

### 3) If not applied — apply using your normal workflow

Typical options (pick what your team already uses):

1. **Supabase CLI linked to prod:** `supabase db push` (or your CI job that runs migrations on deploy).
2. **Dashboard SQL editor:** run the **contents** of the two migration files **in order** (idempotent `IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS` makes this safe).

### 4) Reload PostgREST schema cache

After DDL, PostgREST may still show `schema cache` until refreshed. Try **in order**:

1. **SQL Editor** (often allowed on hosted Supabase):  
   `NOTIFY pgrst, 'reload schema';`
2. If errors persist: **Project Settings** → restart / pause-resume API (wording varies by dashboard version), or wait 1–2 minutes for propagation.

### 5) Automated verify (from a machine with **production** URL + anon key in `.env.local`)

```bash
npm run verify:analytics:table
```

Expect: `LISTING_ANALYTICS_OK`. If it prints `LISTING_ANALYTICS_FAIL` with schema-cache text, migrations or reload step is still missing.

### 6) Manual UI verify

- `/dashboard?lang=en` and `?lang=es` — **blue “analytics not available”** banner should **disappear** once reads succeed (zeros are fine with no events).
- `/dashboard/analytics?lang=en` and `?lang=es` — **no raw Supabase errors**; setup notice only when the table/read still fails; otherwise **zeros + normal empty/helper** copy when there are no events.

## Known gaps (honest)

- **Unique viewers:** underestimated when viewers are anonymous (no `user_id`); distinct logged-in users only.
- **Por expirar:** only `listings` republish visibility window (`republished_at` + contract window) and `expires_at` unless extended per category table.
- **Legacy `trackEvent`:** minimal payload (no `owner_user_id` / `category`); prefer `clasificadosAnalytics` on new surfaces.

### Saved listings backfill (optional ops)

Runtime reads/writes use **`saved_listings`** only. Rows that exist only in **`user_saved_listings`** will not appear in Guardados until copied.

**Audit (read-only):**

```sql
SELECT COUNT(*) AS legacy_rows_not_in_canonical
FROM user_saved_listings u
WHERE NOT EXISTS (
  SELECT 1 FROM saved_listings s
  WHERE s.user_id = u.user_id AND s.listing_id = u.listing_id
);
```

**Backfill (run only after confirming schema/policies; prefer a maintenance window):**

```sql
INSERT INTO saved_listings (user_id, listing_id, created_at)
SELECT u.user_id, u.listing_id, u.created_at
FROM user_saved_listings u
WHERE NOT EXISTS (
  SELECT 1 FROM saved_listings s
  WHERE s.user_id = u.user_id AND s.listing_id = u.listing_id
)
ON CONFLICT (user_id, listing_id) DO NOTHING;
```

Future **save-count** style analytics should aggregate from **`saved_listings`**, not `user_saved_listings`.

## User dashboard — Admin Republish contract (audit)

### Gate 2 — Owner vs Admin lifecycle (owner `listings` rows)

- Owner **Pausar anuncio** / **Pause ad**: `status = paused`, `is_published = false` (temporary hide; Leonix Ad ID unchanged).
- Owner **Archivar anuncio** / **Archive ad**: soft archive aligned with Admin staff archive on `listings` — `status = removed`, `is_published = false` — **no** owner `DELETE` on listing rows from Mis anuncios / detail / editar / borradores.
- Owner **Restaurar** (from pause): `status = active`, `is_published = true` — **not** the same as **Republicar** / **Move to top** (those use `republishActionLabel` + republish columns when eligible).
- **Admin row actions** (`ClassifiedAdminRowActions`): **Restaurar** on a non-live row triggers **`unsuspend`** only; **Republicar** / **Move to top** is the separate republish button from `republishActionLabel`. **Destacar** = promote; **Verificar Leonix** = verify; **Suspender** / **Archivar** remain distinct.
- **Promote/Featured** and **Verify Leonix** stay separate from republish; analytics stay **degraded/honest** until `listing_analytics` exists; **Clases / Comunidad** stay not client-ready.

- **Republish capability:** Eligibility and primary CTA labels mirror `app/admin/_lib/classifiedsRepublishCapability.ts` via `app/(site)/dashboard/lib/dashboardRepublishUi.ts` — **Move to top** when the row is public/live, **Republish** when eligible but not live; **no runtime `boost_expires`**.
- **En Venta Pro:** Cooldown / visibility window still uses `detail_pairs` (`Leonix:visibility_last_renewed_at`) + `republished_at`; unpublished/suspended Pro rows also get `is_published` / `status` on republish (aligned with Admin `listings` PATCH).
- **Rentas / Bienes raíces (`listings`):** Same republish fields + live vs not-live behavior as Admin generic listings republish when columns exist.
- **Leonix Ad ID:** Shown on cards and detail when the column/value exists — **never generated or mutated** from the dashboard; owner `listings` select includes `leonix_ad_id` when the DB exposes it.
- **Promoted / Featured** (`Leonix:promoted` in `detail_pairs`) and **Verify Leonix** remain **separate** product signals from republish / move to top.
- **`listing_analytics`:** When the table is absent or unreadable, dashboard surfaces show **one** friendly degraded notice and **honest zeros** (no fabricated totals, no raw PostgREST errors in UI). Code paths stay compatible for when the table ships.
- **`saved_listings` (canonical):** Runtime saves and **Guardados** read/write **`saved_listings` only**; resolver lives in `app/lib/savedListingsDashboardResolve.ts`. The public save button (`LeonixSaveButton`), listing detail save sync, En Venta layout, and Servicios admin save-count aggregation use the same table so dashboard and public agree.
- **`user_saved_listings` (legacy):** Historical table only in migrations/docs — **not** used by `app/` runtime. If production still has user saves only in `user_saved_listings`, run a one-time audit/backfill in Supabase before expecting old rows in Guardados (see **Saved listings backfill** below).
- **Clases / Comunidad:** Not client-ready — overview cards stay **Coming soon / Próximamente** with no owner inventory wiring; **no** republish CTAs for those categories.
- **Inventory sources:** `public.listings` (en-venta, rentas, bienes-raices), `servicios` owner API + `servicios_public_listings`, `autos_classifieds_listings`, `empleos_public_listings`, `restaurantes_public_listings`, `viajes_staged_listings`.
