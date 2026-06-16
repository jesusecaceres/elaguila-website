# CATEGORIES_COMMAND_CENTER_AUDIT — ADMIN-CATEGORIES-COMMAND-CENTER-01

## 1. Files inspected

- `app/admin/(dashboard)/workspace/clasificados/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryHub.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryOpsAudit.tsx`
- `app/admin/_lib/adminClasificadosCategoryOpsAudit.ts`
- `app/admin/_lib/adminCategoriesHubEntries.ts`
- `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts`
- `app/(site)/clasificados/config/categoryConfig.ts`

## 2. Performance diagnosis

**Suspected cause:** `ClasificadosCategoryOpsAudit` ran synchronously on the overview page and executed dozens of sequential Supabase probes (per-category counts, Leonix ID checks, fetch probes) before HTML could stream. Combined with a 14+ card grid rendering full schema/plan metadata, first paint felt like a giant dump.

**Heavy sections:**
- Operational audit (`fetchClasificadosCategoryOpsAuditRows`) — primary blocker
- Full category card grid (all categories expanded at once)
- Utility cards (home content, BR hints) above the fold
- Moderation reference (En Venta fields) at bottom but still on overview

## 3. Cause of slow/long load

Server-side audit loop × N categories × multiple queries each, rendered inline on `/admin/workspace/clasificados` overview (no filters).

## 4. Files changed

- `app/admin/(dashboard)/workspace/clasificados/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryCommandCenter.tsx` (new)
- `app/admin/(dashboard)/workspace/clasificados/ClasificadosCategoryHub.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryPanelShared.tsx` (new)
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryOpsAuditLazy.tsx` (new)
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryOpsAuditTable.tsx` (new)
- `app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosCategoryUtilitiesCollapsible.tsx` (new)
- `app/api/admin/clasificados/category-ops-audit/route.ts` (new)
- `scripts/verify-admin-categories-command-center.mjs` (new)
- `package.json`

## 5. New page architecture

1. **Header** — existing `AdminPageHeader` + scope nav
2. **Category command center** — drawer selector + selected category Leonix panel (primary viewport)
3. **Utilities** — collapsible (Featured on /home, BR/Rentas preview notes)
4. **Search all listings** — cross-category utility card
5. **Operational audit** — collapsed `<details>`; loads via API only when opened
6. **Moderation reference** — collapsible inside En Venta section card
7. **Queue view** — unchanged when `?category=` or filters active

## 6. Category inventory

| Category | Represented | Queue | Live | Status source |
|----------|-------------|-------|------|---------------|
| en-venta | yes | `/admin/workspace/clasificados/en-venta` | `?scope=live` | registry |
| rentas | yes | `/admin/workspace/clasificados/rentas` | `?scope=live` | registry |
| bienes-raices | yes | `/admin/workspace/clasificados/bienes-raices` | `?scope=live` | registry |
| clases | yes | `/admin/workspace/clasificados/clases` | `?scope=live` | registry |
| comunidad | yes | `/admin/workspace/clasificados/comunidad` | `?scope=live` | registry |
| busco | yes | `/admin/workspace/clasificados/busco` | `?scope=live` | registry |
| mascotas-y-perdidos | yes | dedicated route | `?scope=live` | registry |
| restaurantes | yes | `/admin/workspace/clasificados/restaurantes` | `?scope=live` | registry |
| servicios | yes | `/admin/workspace/clasificados/servicios` | `?scope=live` | registry |
| empleos | yes | `/admin/workspace/clasificados/empleos` | `?scope=live` | registry |
| autos | yes | `/admin/workspace/clasificados/autos` | `?scope=live` | registry |
| travel (Viajes) | yes | `/admin/workspace/clasificados/travel` | `?scope=live` | registry |
| comida-local | yes | `/admin/workspace/clasificados/comida-local` | `?scope=live` | supplemental hub |

## 7. Desktop layout result

Left drawer list (scrollable) + right selected category command panel with burgundy queue, green live, blue public, gold registry CTAs.

## 8. Mobile layout result

Horizontal category rail (scroll, no page overflow) + full-width selected panel; drawer hidden on small screens.

## 9. Secondary sections moved/collapsed

- Operational audit → lazy collapsible (API on open)
- Featured on /home + BR notes → utilities `<details>`
- Moderation reference → nested `<details>`
- Global search → below command center (still on overview)

## 10. CTA/link preservation matrix

| CTA | Preserved |
|-----|-----------|
| View queue | yes — `adminCategoryWorkspaceQueueHref` / ops paths |
| Live listings | yes — `adminCategoryWorkspaceLiveListingsHref` |
| Public category | yes — `entry.landingTarget` |
| Advanced registry | yes — panel + utilities |
| Fields & notes / ops space | yes — ops contract links |
| Search all listings | yes — global search form |
| Home content | yes — utilities collapsible |
| Autos/Servicios quick links | yes — queue filter mode |

## 11. Risks / deferred work

- Audit still runs full probe suite when opened (intentional; no longer blocks overview TTFB)
- `/admin/categories` uses `ClasificadosCategoryHub` wrapper → same command center UI
- Row counts in audit unchanged; not shown in selector (no fake counts added)

## 12. TRUE/FALSE table

| Flag | Value |
|------|-------|
| ADMIN_CATEGORIES_REPO_INSPECTED_FIRST | true |
| ADMIN_CATEGORIES_PERFORMANCE_DIAGNOSIS | true |
| ADMIN_CATEGORIES_ALL_CATEGORIES_REPRESENTED | true |
| ADMIN_CATEGORIES_DRAWER_OR_SELECTOR | true |
| ADMIN_CATEGORIES_SELECTED_PANEL | true |
| ADMIN_CATEGORIES_QUEUE_LINKS_PRESERVED | true |
| ADMIN_CATEGORIES_LIVE_LINKS_PRESERVED | true |
| ADMIN_CATEGORIES_OPERATIONAL_AUDIT_PRESERVED | true |
| ADMIN_CATEGORIES_OPERATIONAL_AUDIT_SECONDARY | true |
| ADMIN_CATEGORIES_SEARCH_ALL_LISTINGS_PRESERVED | true |
| ADMIN_CATEGORIES_ADVANCED_REGISTRY_PRESERVED | true |
| ADMIN_CATEGORIES_HOME_CONTENT_PRESERVED | true |
| ADMIN_CATEGORIES_MODERATION_REFERENCE_PRESERVED | true |
| ADMIN_CATEGORIES_LEONIX_STYLE | true |
| ADMIN_CATEGORIES_MOBILE_SAFE | true |
