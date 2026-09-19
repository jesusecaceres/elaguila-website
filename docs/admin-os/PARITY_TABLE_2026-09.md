# Gate 9 — Public results / detail / Admin Live parity (2026-09-19)

Branch `integration/category-circuit-closeout-2026-09` (worktree `elaguila-website-admin-live-qa`). Source-proven; the production RLS section
(§5) and the row counts in §3 come from **read-only** queries against production `xuieateniufcrsfdomwl` (no writes).
Executable proof: `node node_modules/tsx/dist/cli.mjs scripts/verify-final-parity-moderation.ts` (all checks pass; it also prints the two
"known gap" lists that are proposals, not failures).

Definitions. **PUBLIC_RESULTS** = the reader behind the category landing/results/API. **PUBLIC_DETAIL** = the reader behind the detail URL.
**ADMIN_LIVE** = `app/admin/_lib/adminLivePredicates.ts` (+ `adminAutosLivePredicate.ts`, `adminOfertasLivePredicate.ts`) and the category
page query for the `live` scope. **MATCH=TRUE** means: ADMIN_LIVE = PUBLIC_RESULTS (same publicly eligible universe — no extra non-public row,
no hidden public row) **and** PUBLIC_DETAIL never shows a row that PUBLIC_RESULTS hides, except the documented direct-URL `sold` state
(En Venta, Bienes Raíces) which is a deliberate product decision recorded in the 2026-09 closeout / `listings` RLS design. Every "was FALSE,
now TRUE" row lists the exact change in §2.

## 1. The table

| CATEGORY | PUBLIC_RESULTS_PREDICATE | PUBLIC_DETAIL_PREDICATE | ADMIN_LIVE_PREDICATE | MATCH |
|---|---|---|---|---|
| Servicios | `serviciosPublicListingsServer.ts:listServiciosPublicListingsFromDb` — `listing_status ILIKE 'published'` + JS `=== 'published'` (entry: `listServiciosPublicListingsRaw` / `…ForDiscovery`) | `serviciosPublicListingsServer.ts:getServiciosPublicListingBySlugForDiscovery` → `…BySlugFromDb(slug_page)` then `clasificados/servicios/[slug]/page.tsx` renders the profile **only** for `published`; `pending_review` / `rejected` / `suspended` / `paused_unpublished` render a no-content placeholder (paused **fixed** here); `layout.tsx:generateMetadata` noindex for all four | `adminLivePredicates.ts:isServiciosRowPubliclyLive` (`listing_status = published`); scope query `serviciosPublicListingsServer.ts:listServiciosPublicListingsAdminQueueFromDb` `.eq('listing_status','published')` | **TRUE** (was FALSE: paused profile rendered fully) |
| Restaurantes | `restaurantesPublicListingsServer.ts:tryListRestaurantesPublicListingsFromDb` `.eq('status','published')` (entry `restaurantesResultsInventoryServer.ts:loadRestaurantesResultsInventoryForPage`) | `restaurantesPublicListingsServer.ts:getRestaurantePublicListingBySlugFromDb` `.eq('status','published')` (`restaurantes/[slug]/page.tsx` → `notFound()`) | `isRestauranteRowPubliclyLive` (`status = published`); `listRestaurantesPublicListingsAdminFromDb` scope `live` `.eq('status','published')` | **TRUE** |
| Comida Local | `comidaLocalPublicQueries.ts:listPublishedComidaLocalListings` `.eq('status', PUBLISHED_STATUS)` | `comidaLocalPublicQueries.ts:getPublishedComidaLocalListingBySlug` `.eq('status', PUBLISHED_STATUS)` | `isComidaLocalRowPubliclyLive`; `comidaLocalAdminQueries.ts:listAdminComidaLocalListingsDetailed` scope `live` `.eq('status','published')` | **TRUE** |
| Empleos (quick / premium / feria) | `empleosPublicListingsDbServer.ts:fetchEmpleosPublishedJobRecords` `.eq('lifecycle_status','published')`; sample catalog omitted in production (`empleosPublicCatalogPolicy.ts:empleosOmitMarketingSeedCatalog`) | `empleosPublicListingsDbServer.ts:fetchEmpleosPublishedListingRowBySlug` (`published`) + `empleos/[slug]/page.tsx` `notFound()` when omit-seed | `isEmpleosRowPubliclyLive`; `fetchAllEmpleosListingsForAdmin` scope `live` `.eq('lifecycle_status','published')` | **TRUE** |
| Autos Dealer | `autosClassifiedsListingService.ts:listActiveAutosClassifiedsRows` (`status='active'`) + `filterAutosRowsByActiveParent` (child needs active same-owner `negocios` main) — served by `api/clasificados/autos/public/listings` | `autosClassifiedsListingService.ts:getActiveLiveAutosBundle` (`status==='active'` + `isAutosChildParentGateSatisfied` for `inventory_vehicle`); Dealer rows carry no term | `adminAutosLivePredicate.ts:isAutosRowPubliclyLive` (row rule + `isAutosChildParentGateSatisfied`); list `autosClassifiedsListingService.ts:listAllAutosClassifiedsRowsForAdmin` (live) | **TRUE** |
| Autos Privado | same reader: `status='active'` and `lane='privado'` row dropped when `expires_at <= now` (30-day term, Gate 20) | `getActiveLiveAutosBundle`: same `expires_at` check for `lane==='privado'` | `isAutosRowLiveRowLevel` (`lane==='privado'` && expired → false) | **TRUE** |
| Rentas | `rentas/lib/fetchRentasPublicListingsForBrowse.ts:fetchRentasPublicListingsForBrowse` → `mapListingRowToRentasPublicListing().browseActive` = `resolveListingLifecycle(rentas_30d, expiration REQUIRED)` **and** machine status not `rentado`/`bajo_contrato`; status `active` (RLS design) and `is_published !== false` | canonical `rentas/lib/fetchRentasListingForPublicDetail.ts:fetchRentasListingForPublicDetail` (`status active`, `is_published !== false`, `browseActive`); generic `clasificados/anuncio/[id]/page.tsx` now ALSO gated by `listingPublicDetailEligibility.ts:isListingRowPublicDetailEligible` → `rentasPublicRowVisibility.ts:isRentasRowPubliclyVisible` (**new**) | `adminLivePredicates.ts:isRentasRowPubliclyLive` (identical rule; verified equal over a 315-row matrix); SQL plan `genericLiveSqlPlan('rentas')` | **TRUE** (was FALSE on the generic `/anuncio/[id]` route) |
| Bienes Raíces Negocio (+ inventory children) | `bienes-raices/lib/fetchBrPublishedListingsBrowser.ts:fetchBrPublishedListingsForBrowse` — `is_published = true` + `status='active'` (SQL), `isListingRowActiveAndPublishedForBrowse` (incl. `expires_at`), `filterBrRowsByActiveParent` (`isBrChildParentGateSatisfied`) | `anuncio/[id]/page.tsx` (BR `/bienes-raices/anuncio/[id]` redirects here): `is_published===true`, `status IN (active,sold)`, generic `expires_at`, `isBrChildParentGateSatisfied` (parent: active, published, same owner, `main`, `bienes-raices`/`business`) — `sold` = direct-URL by design | `isBrRowPubliclyLive(row, now, parentsById)` (composes the same three shared predicates); `genericLiveSqlPlan('bienes-raices')` + parent map | **TRUE** (detail ⊇ results only for `sold`) |
| Bienes Raíces Privado / FSBO (45 d) | as above + `isBrFsboRowWithinTerm` (`bienesFsboLifecycle.ts`) | as above + `isBrFsboRowWithinTerm(row)` (page) | `isBrRowPubliclyLive` (same `isBrFsboRowWithinTerm`) | **TRUE** |
| Clases (free / paid 30 d) | `community/shared/communityListingsBrowseClient.ts:fetchPublishedCommunityCategoryListings('clases')` — `is_published = true`, `status IN (active,sold)`, `isListingRowWithinEnforcedTerm` | `anuncio/[id]/page.tsx`: `status IN (active,sold)`, `is_published===true` (**tightened** from `!== false`), `isListingRowWithinEnforcedTerm` | `isGenericListingPubliclyLive('clases')` (`is_published===true`, `active\|sold`, `isListingRowWithinEnforcedTerm`) | **TRUE** |
| Comunidad | `communityListingsBrowseClient.ts:fetchPublishedCommunityCategoryListings('comunidad')` — `is_published = true`, `status IN (active,sold)` | `anuncio/[id]/page.tsx` (`is_published===true` now, `active\|sold`) | `isGenericListingPubliclyLive('comunidad')` | **TRUE** |
| Mascotas y Perdidos | `mascotas-y-perdidos/shared/loadMascotasPerdidosListings.ts:fetchPublishedMascotasPerdidosListings` — `is_published = true`, `status IN (active,sold)` | `anuncio/[id]/page.tsx` (same as Comunidad) | `isGenericListingPubliclyLive('mascotas-y-perdidos')` | **TRUE** |
| Busco | `busco/shared/loadBuscoListings.ts:fetchPublishedBuscoListings` — `is_published = true`, `status IN (active,sold)` | `anuncio/[id]/page.tsx` (same) | `isGenericListingPubliclyLive('busco')` | **TRUE** |
| En Venta | `lib/enVentaListingPublicSelect.ts:queryEnVentaBrowseListings` (`status='active'`) + `enVentaListingVisibility.ts:isEnVentaListingPubliclyVisible` (`isListingRowActiveAndPublishedForBrowse`: `is_published !== false`, `active`); `sold` **not** in results | `anuncio/[id]/page.tsx`: `status IN (active,sold)`, `is_published !== false` — `sold` viewable by direct URL (owner decision, closeout) | `isGenericListingPubliclyLive('en-venta')` (default branch: canonical rule **+ `expires_at` cut-off**) | **FALSE (latent)** — Admin Live hides an active En Venta row with a past `expires_at`, public shows it. No writer ever sets `expires_at` for En Venta and prod has 0 such rows; Admin-side diff in §4 |
| Ofertas Locales | `api/ofertas-locales/public-offers/route.ts:GET` — SQL `approved`, `published_at` set, `expires_at > now`, asset gate (**added to SQL**) then `ofertasLocalesPublicOfferHelpers.ts:isOfertaLocalPublicOfferRowEligible` (status approved, `published_at <= now < expires_at`, coupon lanes inside `valid_from..valid_until`, non-empty `public_source_asset_id`, `asset_lifecycle_status === current`, business name + title). Item search `api/ofertas-locales/public-search` + `ofertasLocalesPublicSearchHelpers.ts:isOfertaLocalPublicSearchRowEligible` (**now also requires** the parent's asset gate + coupon window) | `ofertasLocalesPublicDetailHelpers.ts:fetchPublicOfertaLocalDetailById` (SQL approved/published/`expires_at>now`) → `mapOfertaLocalPublicDetailRowToDetail` → `isOfertaLocalPublicOfferRowEligible` (`null` = 404) | `adminOfertasLivePredicate.ts:isOfertaPubliclyLive` (= `isOfertaLocalPublicOfferRowEligible`); SQL superset `applyOfertasLiveSqlSuperset` | **TRUE** (item search was FALSE — search result could 404) |
| Viajes | `viajesStagedListingsDbServer.ts:fetchApprovedViajesStagedRows` (`lifecycle_status='approved'` AND `is_public = true`); demo catalog only outside production (`viajesPublicInventory.ts:viajesAllowCuratedDemoCatalog`) | `viajesStagedListingsDbServer.ts:fetchViajesStagedRowBySlugPublic` (same two filters) via `resolveViajesOfferDetailFromStagedServer.ts` | `isViajesRowPubliclyLive`; `fetchViajesStagedAdminQueue` scope live `.eq('lifecycle_status','approved').eq('is_public',true)` | **TRUE** |

Parent–child gates: Autos Dealer children and BR inventory children are gated identically in results, detail and Admin Live (the Admin list
resolves the parent map before the row limit — `adminLivePredicates.ts:collectBrParentIdsForLive`, `collectAutosChildParentIds`). Sold: only En
Venta / BR keep a direct-URL `sold` page; Rentas, Autos, dedicated tables have no public `sold` state. Terms: Rentas 30 d, Clases paid 30 d, FSBO
45 d, Autos Privado 30 d, Ofertas 30 d are enforced on read by the same shared predicate in all three surfaces (Restaurantes / Servicios / Comida /
Autos Dealer / BR Negocio are subscription lanes: no term, visibility follows payment suspension writes).

## 2. What was changed (public side only; nothing in `app/admin/**` was edited)

| # | File | Change | Why |
|---|---|---|---|
| 1 | `app/(site)/clasificados/rentas/lib/rentasPublicRowVisibility.ts` (new) | pure `isRentasRowPubliclyVisible(row, now)` = status `active` + Rentas 30-day lifecycle (expiry required) + not `rentado`/`bajo_contrato` | one statement of the Rentas rule the generic route can reuse |
| 2 | `app/(site)/clasificados/lib/listingPublicDetailEligibility.ts` (new) | pure `isListingRowPublicDetailEligible(row, now)`: Rentas = results rule; BR/Clases/Comunidad/Mascotas/Busco need `is_published === true`; BR generic `expires_at`; En Venta keeps `sold` direct-URL | the generic `/anuncio/[id]` gate was `is_published !== false` + `active\|sold` for every lane |
| 3 | `app/(site)/clasificados/anuncio/[id]/page.tsx` | calls #2 right after the status check (FSBO term / enforced term / BR parent gate untouched) | a null-`expires_at`, sold or rentado Rentas row and a null-`is_published` BR/Clases/Comunidad/Mascotas/Busco row opened by direct URL though results + Admin Live hide it. (59 of the 61 active Rentas rows in prod have null `expires_at` — hidden in results, but were reachable here.) |
| 4 | `…/anuncio/[id]/page.tsx` copy (ES/EN `guardBody`) | removed the promise that "the system may auto-hide listings if it detects spam"; now says Leonix reviews reports and may remove listings, nothing is hidden automatically | no such automatic path exists (Gate 10) |
| 5 | `app/(site)/clasificados/servicios/[slug]/page.tsx` | `paused_unpublished` now renders the same no-content placeholder as rejected/suspended | a paused / payment-lapsed profile (hidden from results and Admin Live) rendered its full content, phone and media by URL |
| 6 | `…/servicios/[slug]/layout.tsx`, `app/(site)/servicios/perfil/[slug]/page.tsx` | paused ⇒ noindex + generic `<head>`; legacy `/servicios/perfil` metadata: only `published` gets business title/description | paused / pending_review profile names were indexable |
| 7 | `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts:isOfertaLocalPublicSearchRowEligible` | parent must have a non-empty `public_source_asset_id`, `asset_lifecycle_status === current`, and (coupon lanes) be inside `valid_from..valid_until` | item search returned items of offers whose list card + detail page were hidden (result → 404). Now search ⊆ list (proved over a cross product) |
| 8 | `app/api/ofertas-locales/public-offers/route.ts` | asset gate added to the SQL (JS predicate remains the exact rule) | rows failing the asset gate could consume the `MAX_OFFERS = 200` window and push real public offers out |

## 3. Findings that are data / product / DB, not code changes

* **Rentas legacy rows.** Production `public.listings` (read-only count): Rentas active = 61, of which **59 have `expires_at IS NULL`** (28
  `business`, 31 `personal`). Public Rentas results and the canonical detail hide them (lifecycle requires a future `expires_at`); Admin Live
  agrees. Only 2 Rentas are publicly visible. Owner decision needed: backfill a term / grandfather them / expect renewals. (Not changed.)
* Other lanes have no term on the 30 active rows (BR 11, Clases 10, Busco 1, Comunidad 1, Mascotas 1, En Venta 1) — none affected.
* Sitemap (`app/sitemap.ts`) already reuses the category readers (`listPublishedBrListingsForSitemap`, Restaurantes, Comida, Servicios), so it
  inherits these predicates.
* Residual, documented, not changed: `app/lib/seo/fetchListingHeadMetadata.ts` (the `<head>` of `/clasificados/anuncio/[id]`) still only
  applies `is_published !== false` + `status active` (no Rentas term / `is_published === true`); for a row the body now 404s the title/description
  can still appear in `<head>` (the row is public in the DB anyway, see §5).

## 4. Proposed Admin-side diffs (NOT applied — lead applies)

**4.1 En Venta has no term** (`app/admin/_lib/adminLivePredicates.ts`)

```diff
   switch (cat) {
@@ export function genericLiveSqlPlan
     case "en-venta":
       // Public En Venta: active + is_published !== false (sold is direct-URL only, NOT live in results).
-      return { category, statuses: ["active"], publishedMode: "not_false", expiresMode: "null_or_future", exact: true };
+      // En Venta has no term: no writer sets expires_at and the public reader does not select it.
+      return { category, statuses: ["active"], publishedMode: "not_false", expiresMode: "none", exact: true };
@@ export function isGenericListingPubliclyLive  (default branch)
     default:
       // en-venta and any other `listings` category: the shared canonical browse rule.
       return (
         isListingRowActiveAndPublishedForBrowse({
           status: row.status as string | null | undefined,
           is_published: row.is_published as boolean | null | undefined,
           expires_at: null,
-        }) && notExpiredAt(row.expires_at, nowMs)
+        }) && (cat === "en-venta" || notExpiredAt(row.expires_at, nowMs))
       );
```
The pre-existing `verify-closeout2-admin-live.ts` en-venta assertions all remain true after this diff (they never use a past `expires_at`).

**4.2 (optional dedupe, identical behaviour)** `isRentasRowPubliclyLive` can become
`return isRentasRowPubliclyVisible(row, nowMs)` (import from `@/app/(site)/clasificados/rentas/lib/rentasPublicRowVisibility`); the verifier already
asserts the two agree on 315 rows.

**4.3** No other Admin predicate mismatch was found. Minor, no diff proposed: Admin `.eq('listing_status','published')` is case-sensitive while
the Servicios public results reader normalises (`ILIKE` + lowercase); RLS on that table is exact `= 'published'`, so a differently-cased row is not
reachable by anon reads either.

## 5. Production RLS observations (read-only `pg_policies`, 2026-09-19) — **new, report to owner**

`public.listings` policies in production: `Owner insert own listings`, `Owner read own listings`, `Owner update own listings`,
`Public read active listings` (`status = 'active'`), and **`listings_select_public` — role `public`, `USING (true)`**. The last one lets any
anon-key client select **every** row of `listings` (pending, paused, flagged, removed, draft, unpublished, sold), including `contact_phone` /
`contact_email` / `owner_id`. Today: 26 non-public rows exist (BR 2 paused/pending; Comunidad 3 removed; En Venta 16 draft/flagged/removed/sold;
Rentas 5 pending/removed). It also means every public reader's JS predicate above is the **only** gate — Rentas browse literally relies on
"RLS enforces visibility" (`rentasListingPublicSelect.ts` comment) which is not true in production.

The dedicated tables are correct: `servicios_public_listings` (`listing_status='published'`), `restaurantes_public_listings` /
`comida_local_public_listings` (`status='published'`), `empleos_public_listings` (`lifecycle_status='published'`), `viajes_staged_listings`
(`approved` AND `is_public`), `autos_classifieds_listings` (`status='active'`); `ofertas_locales` and `oferta_local_items` have no public
select policy (public reads go through service-role API routes).

Proposal (owner applies; **not** applied, not in `supabase/migrations/`):

```sql
-- 1. remove the wide-open policy and the redundant one
drop policy if exists "listings_select_public" on public.listings;
drop policy if exists "Public read active listings" on public.listings;
-- 2. one public catalog policy = the widest thing any public reader legitimately needs (JS keeps the exact per-lane rule)
create policy "listings_public_read_live" on public.listings
  for select to anon, authenticated
  using (lower(coalesce(status,'')) in ('active','sold') and is_published is distinct from false);
```
Before applying: run the public pages on staging (Rentas results/detail, BR results/detail incl. parent lookup, En Venta, Clases/Comunidad/
Busco/Mascotas browse, `/anuncio/[id]`); owner dashboards keep working through `Owner read own listings`.
