# CAT-TRUTH-01 — Remaining Category Truth Sweep (Pre–Admin Cleanup)

**Gate:** CAT-TRUTH-01  
**Date:** 2026-06-06  
**Mode:** Read-only repo audit + static verify script — **no UX/schema changes in this gate.**

**Purpose:** Category-by-category truth map before **Admin Dashboard Cleanup / Categories Command Center**.

Evidence sources: `classifiedsOpsContract.ts`, `clasificadosCategoryRegistry.ts`, `listingAnalyticsIdentity.ts`, `categoryListingMonetization.ts`, `clasificadosQueueSurfaceMeta.ts`, public routes under `app/(site)/clasificados`, admin queues under `app/admin/(dashboard)/workspace/clasificados`, owner dashboard queries.

---

## Legend

| Classification | Meaning |
|----------------|---------|
| **TRUE_REAL** | Live Supabase-backed publish → public browse/detail; admin queue reads real rows |
| **PARTIAL** | Substantial wiring; gaps in analytics, monetization, staging, or ops contract |
| **SCAFFOLD** | Routes/UI exist; registry marks coming_soon/scaffold; limited or no production traffic expected |
| **MISSING** | No public pipeline or no backing table wired |
| **UNKNOWN** | Repo cannot prove prod migration apply / env state |

---

## 1. En Venta / Varios

| Field | Truth |
|-------|-------|
| **Classification** | **TRUE_REAL** |
| **Source table** | `public.listings` (`category = en-venta`) |
| **Public results** | `/clasificados/en-venta/results` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/en-venta` → `ListingsCategoryOpsQueuePage` |
| **User dashboard** | `fetchOwnerListingsForDashboard` → `/dashboard/mis-anuncios` (filtered by category) |
| **Stable ID** | `listings.id` (UUID) |
| **Leonix Ad ID** | **TRUE** — prefix `SALE` (`classifiedsOpsContract`) |
| **Owner/seller** | `owner_id`; `seller_type` individual/business |
| **Status/lifecycle** | `status`, `is_published`; browse `active`; admin suspend/archive via `ClassifiedAdminRowActions` |
| **Live filter** | **TRUE** — `queryEnVentaBrowseListings`, results client filters |
| **Suspend/archive/restore** | **TRUE** — admin row actions (suspend/unsuspend/archive) |
| **Analytics** | **PARTIAL** — `enVentaGlobalAnalytics.ts`; `listings` in analytics allowlist; dashboard rollup partial |
| **CTA tracking** | **PARTIAL** — global pipeline; not all card CTAs wired |
| **Monetization** | **TRUE** — `CLASSIFIED_PRIVATE`; En Venta pro/gratis scoped in `categoryAdPlans` |
| **Dates/expiration/republish** | **TRUE** — `expires_at`, `republished_at`, `republish_count`, visibility window constants |

**Gaps:** Dual analytics vs owner dashboard display; boost/auto-refresh future fields.

---

## 2. Rentas

| Field | Truth |
|-------|-------|
| **Classification** | **TRUE_REAL** |
| **Source table** | `public.listings` (`category = rentas`) |
| **Public results** | `/clasificados/rentas/results` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/rentas` |
| **User dashboard** | `listings` owner fetch + `LeonixRealEstateListingManageCard` rentas lines |
| **Leonix Ad ID** | **TRUE** — prefix `RENT` |
| **Owner/seller** | `owner_id` |
| **Status/lifecycle** | Same as listings contract |
| **Live filter** | **TRUE** — `rentasBrowseContract`, capped browse |
| **Suspend/archive** | **TRUE** — shared listings admin actions |
| **Analytics** | **PARTIAL** — category in allowlist; no dedicated rentas wrapper like Comida L8A |
| **CTA tracking** | **PARTIAL** |
| **Monetization** | **TRUE** — `CLASSIFIED_PRIVATE`; paid private/business plans |
| **Republish** | **TRUE** — `classifiedsRepublishCapability` includes rentas |

**Gaps:** Inventory lane deferred (BR-INV policy); no rentas-specific analytics module.

---

## 3. Bienes Raíces

| Field | Truth |
|-------|-------|
| **Classification** | **TRUE_REAL** (inventory **PARTIAL**) |
| **Source table** | `public.listings` (`category = bienes-raices`) |
| **Public results** | `/clasificados/bienes-raices/resultados` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/bienes-raices` |
| **User dashboard** | Owner listings + `BrPropertyInventoryDashboardSection` |
| **Leonix Ad ID** | **TRUE** — prefix `BR` |
| **Owner/seller** | `owner_id`; Negocio `seller_type = business` |
| **Inventory columns** | `br_inventory_group_id`, `br_inventory_parent_listing_id`, `inventory_role` |
| **Status/lifecycle** | listings + sold/active RLS |
| **Live filter** | **TRUE** — `brResultsUrlState`, facets |
| **Suspend/archive** | **TRUE** |
| **Analytics** | **PARTIAL** — documented only for inventory events (BR-INV-A §16) |
| **Monetization** | **PARTIAL** — paid private/business; upgrade slots placeholder |
| **Republish** | **TRUE** — admin republish capability |

**Gaps:** BR-INV-E batch publish; prod migration apply **UNKNOWN**; in-app pre-publish inventory C/D done, publish mapping pending.

---

## 4. Clases

| Field | Truth |
|-------|-------|
| **Classification** | **SCAFFOLD** |
| **Source table** | `public.listings` (`category = clases`) |
| **Public results** | `/clasificados/clases/results` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/clases` |
| **User dashboard** | Generic `mis-anuncios` when rows exist |
| **Leonix Ad ID** | **TRUE** — prefix `CLASS` (when assigned on publish) |
| **Registry posture** | `coming_soon` / `scaffold` (`clasificadosCategoryRegistry`) |
| **Live filter** | **PARTIAL** — standard landing + `CategoryRecentListings` |
| **Analytics** | **MISSING** — category key only; no CTA wrapper |
| **Monetization** | **SCAFFOLD** — `NOT_CLIENT_READY`; `CLASSIFIED_SCAFFOLD` |

---

## 5. Comunidad / Eventos

| Field | Truth |
|-------|-------|
| **Classification** | **SCAFFOLD** |
| **Source table** | `public.listings` (`category = comunidad`) |
| **Public results** | `/clasificados/comunidad/resultados` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/comunidad` |
| **Leonix Ad ID** | **TRUE** — prefix `COM` |
| **Registry** | `coming_soon` / `scaffold` |
| **Analytics / monetization** | Same scaffold gaps as Clases |

---

## 6. Busco / Se busca

| Field | Truth |
|-------|-------|
| **Classification** | **PARTIAL** |
| **Source table** | `public.listings` (`category = busco`) |
| **Public results** | `/clasificados/busco/resultados`, `/clasificados/busco/results` |
| **Public detail** | `BuscoPublishedDetailPage` / anuncio patterns |
| **Admin queue** | `/admin/workspace/clasificados/busco` |
| **Ops contract gap** | **MISSING** from `CLASSIFIEDS_OPS_CONTRACTS` (admin works via queue meta only) |
| **Publish** | `/publicar/busco/quick` + standard publish |
| **Browse** | **TRUE** — `fetchPublishedBuscoListings` (client Supabase, `is_published`, `active/sold`) |
| **Leonix Ad ID** | **PARTIAL** — uses shared `listings.leonix_ad_id` when present |
| **Registry** | `coming_soon` / `scaffold` |
| **Analytics** | **MISSING** |
| **Monetization** | **SCAFFOLD** — `NOT_CLIENT_READY` |

---

## 7. Mascotas / Perdidos

| Field | Truth |
|-------|-------|
| **Classification** | **SCAFFOLD** |
| **Source table** | `public.listings` (`category = mascotas-y-perdidos`) |
| **Public results** | `/clasificados/mascotas-y-perdidos/resultados` |
| **Public detail** | `/clasificados/anuncio/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/mascotas-y-perdidos` |
| **Leonix Ad ID** | **TRUE** — prefix `PET` |
| **Registry** | `coming_soon` / `scaffold`; free/simple notices copy |
| **Analytics / monetization** | **MISSING** / **SCAFFOLD** |

---

## 8. Restaurantes

| Field | Truth |
|-------|-------|
| **Classification** | **TRUE_REAL** |
| **Source table** | `restaurantes_public_listings` |
| **Public results** | `/clasificados/restaurantes/resultados` |
| **Public detail** | `/clasificados/restaurantes/[slug]` |
| **Admin queue** | `/admin/workspace/clasificados/restaurantes` (dedicated table UI) |
| **User dashboard** | Restaurant owner flows / publish hydration (per registry notes) |
| **Leonix Ad ID** | **TRUE** — prefix `REST` |
| **Owner** | `owner_user_id` |
| **Status** | `status` on dedicated table |
| **Analytics** | **TRUE** — `recordRestaurantesGlobalAnalytics`, profile view + CTA tracking |
| **CTA tracking** | **TRUE** |
| **Monetization** | **PARTIAL** — `RESTAURANT_PROFILE`; package tiers |
| **Suspend/archive** | **TRUE** — `ClassifiedAdminRowActions` on dedicated admin page |

---

## 9. Servicios

| Field | Truth |
|-------|-------|
| **Classification** | **PARTIAL** |
| **Source table** | `servicios_public_listings` |
| **Public results** | `/clasificados/servicios/resultados` |
| **Public detail** | `/clasificados/servicios/[slug]` |
| **Admin queue** | `/admin/workspace/clasificados/servicios` |
| **Leonix Ad ID** | **TRUE** — prefix `SERV` |
| **Owner** | `owner_user_id` |
| **Registry** | `staged` / `partial` |
| **Analytics** | **TRUE** — `recordServiciosGlobalAnalytics` |
| **Monetization** | **PARTIAL** — `SERVICE_BUSINESS_PROFILE`; Translate Ad pilot adjacent |
| **Suspend/archive** | **TRUE** |

---

## 10. Autos

| Field | Truth |
|-------|-------|
| **Classification** | **PARTIAL** (high maturity) |
| **Source table** | `autos_classifieds_listings` (dedicated) |
| **Public results** | `/clasificados/autos/resultados` |
| **Public detail** | `/clasificados/autos/vehiculo/[id]` |
| **Admin queue** | `/admin/workspace/clasificados/autos` |
| **User dashboard** | `/dashboard/mis-anuncios` + dealer inventory section |
| **Leonix Ad ID** | **TRUE** — per-row trigger |
| **Owner** | `owner_user_id` |
| **Inventory** | `dealer_inventory_group_id`, `inventory_role` — **TRUE_REAL** (A5 QA-08C proof) |
| **Status** | `status` (`active`, `removed`, etc.) |
| **Analytics** | **PARTIAL** — `recordAutosGlobalAnalytics`; inventory events documented |
| **Monetization** | **PARTIAL** — Negocios Stripe + QA bypass; `AUTOS_CLASSIFIED` |
| **Suspend/archive** | **TRUE** |

---

## 11. Empleos

| Field | Truth |
|-------|-------|
| **Classification** | **TRUE_REAL** |
| **Source table** | `empleos_public_listings` |
| **Public results** | `/clasificados/empleos/resultados` |
| **Public detail** | `/clasificados/empleos/[slug]` |
| **Admin queue** | `/admin/workspace/clasificados/empleos` |
| **User dashboard** | `/dashboard/empleos` dedicated |
| **Leonix Ad ID** | **TRUE** — prefix `JOB` |
| **Owner** | `owner_user_id` |
| **Lifecycle** | `lifecycle_status` |
| **Analytics** | **TRUE** — `recordEmpleosGlobalAnalytics`, apply/profile/engagement |
| **CTA tracking** | **TRUE** |
| **Monetization** | **PARTIAL** — `NOT_V1_MONETIZATION`; premium/feria product surfaces |
| **Suspend/archive** | **TRUE** |

---

## 12. Viajes / Travel

| Field | Truth |
|-------|-------|
| **Classification** | **PARTIAL** |
| **Source table** | `viajes_staged_listings` |
| **Public results** | `/clasificados/viajes/resultados` |
| **Public detail** | `/clasificados/viajes/oferta/[slug]` |
| **Admin queue** | `/admin/workspace/clasificados/travel` + legacy `/admin/clasificados/viajes/*` |
| **Leonix Ad ID** | **TRUE** — prefix `TRAV` |
| **Registry slug** | `travel` in registry; routes use `viajes` |
| **Analytics** | **PARTIAL** — table in allowlist; limited category wrapper |
| **Monetization** | **PARTIAL** — `NOT_V1_MONETIZATION`; `TRAVEL_STAGED` |
| **Suspend/archive** | **TRUE** on staged admin queue |

---

## 13. Ofertas Locales (status only)

| Field | Truth |
|-------|-------|
| **Classification** | **SCAFFOLD** (publish-only) |
| **Source table** | `ofertas_locales` (dedicated; owner-only RLS, no public SELECT) |
| **Public results/detail** | **MISSING** — planned routes in constants only |
| **Admin queue** | **MISSING** — not in `CLASSIFIEDS_OPS_CONTRACTS` |
| **Publish** | `/publicar/ofertas-locales` → `pending_review` API |
| **Leonix Ad ID** | **UNKNOWN** on table — not same as listings pipeline |
| **Analytics** | **MISSING** |
| **Do not implement pipeline in CAT-TRUTH-01** | **TRUE** |

---

## 14. Other active surfaces

| Surface | Classification | Notes |
|---------|----------------|-------|
| **Comida Local** | **PARTIAL** | `comida_local_public_listings`; admin queue; L8A analytics **TRUE**; not in main `categoryConfig` registry keys |
| **Iglesias** | **MISSING** (classifieds) | CMS `site_section` payload; `/iglesias`; admin `/admin/workspace/iglesias` — not listing pipeline |
| **Negocios Locales** | **MISSING** (classifieds) | Marketing hub linking to Servicios/Restaurantes/Autos/BR |
| **Recursos Comunitarios** | **MISSING** (classifieds) | Static/marketing page |
| **Productos Promocionales** | **MISSING** (classifieds) | Print catalog UI; no listing table |

---

## Admin cleanup readiness summary

### Admin-ready (real queues + row actions)

- En Venta, Rentas, Bienes Raíces, Restaurantes, Servicios, Autos, Empleos, Travel/Viajes, Comida Local
- Listings-table scaffolds with real queues: Clases, Comunidad, Busco, Mascotas (ops truth = `listings`, low traffic expected)

### Scaffold-only (do not mark client-ready in admin command center)

- Clases, Comunidad, Mascotas-y-perdidos, Busco (registry + `NOT_CLIENT_READY`)
- Ofertas Locales (publish-only, no public/admin listing queue)

### Missing Leonix / owner trace (admin must stay defensive)

- Ofertas Locales (separate table contract)
- Iglesias / Negocios Locales / Recursos / Productos (non-listing)

### Missing analytics (admin analytics column should not imply live)

- Clases, Comunidad, Busco, Mascotas, Rentas (no dedicated wrapper), Bienes Raíces inventory events, Ofertas Locales

### Contract gaps for admin command center

- **Busco** missing from `CLASSIFIEDS_OPS_CONTRACTS` (queue works via `clasificadosQueueSurfaceMeta`)
- **Comida Local** in ops contract but outside `getClasificadosCategoryRegistry()` keys
- **Ofertas Locales** not in ops contract

### Fake/placeholder risks (must not surface as metrics)

- Registry `views` column on legacy listings rows — not seller analytics truth
- Ofertas preview/draft — no public analytics
- Scaffold categories — empty recent listings acceptable; do not fake counts

---

## Recommended next stack

**ADMIN_DASHBOARD_CLEANUP: TRUE**

**Reason:** Category truth is documented; live/staged/scaffold boundaries are explicit in code (`clasificadosCategoryRegistry`, `categoryListingMonetization`, `classifiedsOpsContract`). Admin cleanup can unify queue headers, ops contract completeness, and monetization chips without touching public UX.

**Target first:**

1. `/admin/workspace/clasificados` hub + `CLASSIFIEDS_OPS_CONTRACTS` (add busco; document comida-local / ofertas posture)
2. `ListingsCategoryOpsQueuePage` + `AdminListingsTable` for shared `listings` categories
3. Dedicated-table queues: Restaurantes, Servicios, Empleos, Autos, Travel, Comida Local
4. `ClassifiedAdminRowActions` suspend/archive parity audit per ops kind
5. `resolveCategoryListingMonetization` admin visibility (Gate F) — keep scaffold categories labeled **not client-ready**

---

## Verification

```bash
npm run cat-truth:remaining-category-sweep
npm run build
```

---

## TRUE/FALSE gate table

| Requirement | TRUE/FALSE |
|-------------|------------|
| All 14 category areas documented | TRUE |
| Source tables identified from code | TRUE |
| Scaffold categories not marked client-ready | TRUE |
| Ofertas Locales status-only (no pipeline build) | TRUE |
| No schema/migration changes in this gate | TRUE |
| No public/admin UI changes in this gate | TRUE |
| Admin cleanup recommendation provided | TRUE |
| Static audit script passes | TRUE |
| Build passes | TRUE |

**Final recommendation: GREEN** — Category truth sweep complete; proceed to Admin Dashboard Cleanup with scaffold categories guarded.
