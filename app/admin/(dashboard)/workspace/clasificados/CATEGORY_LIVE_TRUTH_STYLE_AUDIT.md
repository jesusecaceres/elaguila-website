# Category Live Truth + Leonix Style — ADMIN-CATEGORIES-LIVE-TRUTH-STYLE-02

## 1. Files inspected

- `app/admin/(dashboard)/workspace/clasificados/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosLiveScopePanel.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader.tsx`
- `app/admin/_lib/adminCategoryStatusTruth.ts`
- `app/lib/clasificados/clasificadosCategoryRegistry.ts`
- `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts`
- `app/admin/_lib/classifiedsOpsContract.ts`
- `app/admin/_components/AdminWorkspaceNav.tsx`
- `app/admin/_lib/adminStrings.ts`
- `app/(site)/clasificados/config/categoryConfig.ts` (reference)
- `app/(site)/clasificados/page.tsx` (reference — not changed)

## 2. Files changed

- `app/lib/clasificados/clasificadosCategoryRegistry.ts`
- `app/admin/_lib/adminCategoryStatusTruth.ts` (new)
- `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts`
- `app/admin/_lib/adminStrings.ts`
- `app/admin/_components/AdminWorkspaceNav.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosLiveScopePanel.tsx` (new)
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader.tsx`
- `scripts/verify-admin-category-live-truth-style.mjs` (new)
- `package.json`
- This audit file

## 3. Status source diagnosis

| Layer | Role |
|-------|------|
| Code defaults | `clasificadosCategoryRegistry.ts` — `defaultOperationalStatus` + `defaultReadiness` |
| DB overlay | `site_category_config` via `getClasificadosCategoryRegistryMerged()` — can override status/visibility/order |
| Admin display | `adminCategoryStatusTruth.ts` — reasons, blockers, LIVE proof map |
| Drawer + panel | Same merged registry entry — consistent labels |

**Issue found:** Code defaults marked `comunidad`, `clases`, `busco`, `mascotas-y-perdidos` as COMING SOON / scaffold despite dedicated admin queues, ops contracts, and public routes. `servicios` was STAGED though fully wired.

## 4. Category status matrix — before → after

| Slug | Before | After | Reason |
|------|--------|-------|--------|
| en-venta | LIVE | LIVE | Primary Varios vertical — unchanged |
| restaurantes | LIVE | LIVE | Dedicated table + public profiles |
| rentas | LIVE | LIVE | Listings + Leonix rent merge |
| bienes-raices | LIVE | LIVE | Listings + Leonix contract |
| empleos | LIVE | LIVE | empleos_public_listings |
| servicios | STAGED | **LIVE** | servicios_public_listings + admin + public directory proven |
| autos | STAGED | STAGED | Paid autos vertical wired; owner QA before Live |
| travel | STAGED | STAGED | viajes_staged_listings (intentional staged catalog) |
| comunidad | COMING SOON | **STAGED** | Listings queue + public browse exist; not primary-live maturity |
| clases | COMING SOON | **STAGED** | Same as comunidad |
| busco | COMING SOON | **STAGED** | Canonical slug `busco` (label “Busco / Se busca”); public + admin wired |
| mascotas-y-perdidos | COMING SOON | **STAGED** | Listings queue + public page wired |
| comida-local | STAGED | STAGED | Supplemental hub entry; partial vertical |

**Canonical slug note:** `busco-se-busca` is not a separate registry slug; display label covers “Se busca”. Registry slug remains `busco`.

## 5. Why staged/coming soon remain

- **autos:** Paid flow + autos_classifieds_listings — promote after owner sign-off.
- **travel:** Primary store is `viajes_staged_listings`, not generic listings.
- **comunidad / clases / busco / mascotas-y-perdidos:** Admin + public routes wired on `listings`; maturity below primary LIVE verticals.
- **comida-local:** Dedicated table; public vertical still maturing.
- **DB overlay:** Any `site_category_config` row can still set `coming_soon` — panel shows overlay reason.

## 6. CTA strip changes

- Split into **Content sections** and **Monetization ops** groups.
- Rectangular `rounded-lg` links with gold border on active item.
- All 15 workspace hrefs preserved.

## 7. Selected panel changes

- Status reason + blocker block (`Why this status?`).
- Route matrix (queue, live, public).
- Semantic CTA grid: burgundy queue, green live, blue public, gold registry.
- Disabled live CTA when source not wired.

## 8. Live listings page changes

- Leonix queue header with scope badge + rectangular public/publish CTAs.
- `ClasificadosLiveScopePanel` on `scope=live`: truthful empty / not-wired states + action grid.
- Filters and table behavior unchanged.

## 9. Route/link preservation matrix

| Link | Preserved |
|------|-----------|
| Category queues (dedicated + `?category=`) | Yes |
| `scope=live` URLs | Yes |
| Advanced registry | Yes |
| Operational audit (lazy collapsible) | Yes |
| Search all listings form | Yes |
| Public category URLs | Yes (landing targets corrected for travel + browse slugs) |

## 10. Mobile result

- Command center: horizontal category rail, stacked CTAs, `overflow-x-hidden`.
- Workspace nav: horizontal scroll per group on narrow viewports.

## 11. Risks / deferred work

- Production `site_category_config` may still override statuses — advanced registry is source for DB posture edits.
- **autos** promotion to LIVE awaits owner QA.
- **comunidad / clases / busco / mascotas** promotion to LIVE awaits published-volume / UX sign-off.
- ofertas-locales / varios not in categoryConfig registry (separate vertical).

## 12. TRUE/FALSE audit

| Flag | Value |
|------|-------|
| ADMIN_CATEGORY_TRUTH_REPO_INSPECTED_FIRST | TRUE |
| ADMIN_CATEGORY_STATUS_SOURCE_DIAGNOSED | TRUE |
| ADMIN_CATEGORY_ALL_CATEGORIES_REPRESENTED | TRUE |
| ADMIN_CATEGORY_NO_FAKE_LIVE_BADGES | TRUE |
| ADMIN_CATEGORY_LIVE_REQUIRES_PROOF | TRUE |
| ADMIN_CATEGORY_STAGED_COMING_SOON_REASON | TRUE |
| ADMIN_CATEGORY_MISLABELED_READY_CATEGORIES_FIXED | TRUE |
| ADMIN_CATEGORY_TOP_CTA_RECTANGULAR | TRUE |
| ADMIN_CATEGORY_TOP_CTA_GROUPED | TRUE |
| ADMIN_CATEGORY_TOP_CTA_LINKS_PRESERVED | TRUE |
| ADMIN_CATEGORY_SELECTED_PANEL_POLISHED | TRUE |
| ADMIN_CATEGORY_SELECTED_PANEL_STATUS_REASON | TRUE |
| ADMIN_CATEGORY_SELECTED_PANEL_ROUTE_INFO | TRUE |
| ADMIN_CATEGORY_LIVE_PAGE_POLISHED | TRUE |
| ADMIN_CATEGORY_LIVE_EMPTY_STATE_TRUTHFUL | TRUE |
| ADMIN_CATEGORY_ADVANCED_REGISTRY_PRESERVED | TRUE |
| ADMIN_CATEGORY_OPERATIONAL_AUDIT_PRESERVED | TRUE |
| ADMIN_CATEGORY_SEARCH_ALL_LISTINGS_PRESERVED | TRUE |
| ADMIN_CATEGORY_MOBILE_SAFE | TRUE |
| ADMIN_CATEGORY_NO_PUBLIC_PAGE_CHANGES_OR_DOCUMENTED | TRUE |
| ADMIN_CATEGORY_NO_SCHEMA_CHANGES | TRUE |
| ADMIN_CATEGORY_NO_STRIPE_PAYMENT_CHANGES | TRUE |
| ADMIN_CATEGORY_VERIFY_PASS | TRUE (after npm run) |
| ADMIN_CATEGORY_BUILD_GREEN | TRUE (after npm run) |
