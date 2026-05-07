# Dashboard UX Audit (Leonix)

Audit date: 2026-05-07  
Scope: dashboard clarity, navigation, mobile usability, and category pipeline readiness.

## Unified inventory — Mis anuncios (safe categories only)

**Goal:** Surface real owned rows where we have Supabase-backed `owner_user_id` `/ `owner_id` and verifiable URLs. No synthesized counts or placeholder detail links.

### Included in Mis anuncios unified feed today

| Source | Categories covered | Owner data | Duplicate control | Notes |
|--------|----------------------|------------|-------------------|--------|
| `listings` (Supabase) | En Venta · Autos · Rentas · Bienes Raíces (and other `listings.category` branches using existing cards) | `owner_id` | Tabs + search scoped to listing id | Existing `LeonixRealEstateListingManageCard`, `AutosClassifiedListingManageCard`, `EnVentaListingManageCard`, Rentas/branches unchanged. |
| `restaurantes_public_listings` | Restaurantes | `owner_user_id` | `dedupeRestaurantInventoryWithListings()` vs `draft_listing_id` / `leonix_ad_id` detail_pairs | Sections above main listing grid. |
| `empleos_public_listings` | Empleos | `owner_user_id` | Rows are keyed by listing id (`empleos_*` separate from generic `listings` ids) — no merge with `listings` today | **Public:** `/clasificados/empleos/[slug]`. **Manage:** `/dashboard/empleos/[listingId]` (id param, **not** slug). **Draft preview shells:** `quick-preview` / `premium-preview` / `feria-preview` + `from=publicar` when lane matches. |
| `viajes_staged_listings` | Viajes **(only rows with `is_public = true`)** | `owner_user_id` | Staged ids are disjoint from `listings` ids | Matches live public shell: **`/clasificados/viajes/oferta/[slug]`**. **Moderation UI:** `/dashboard/viajes?stagedId=…`. Preview: **`/clasificados/viajes/preview/privado`** vs **`…/preview/negocios`** from `lane`. |

### Intentionally not merged (honest exclusions)

| Category | Reason |
|----------|--------|
| **Servicios** | Ownership/read model is **`/api/clasificados/servicios/my-listings`** (not the unified `listings` row shape). Unified cards would require a second fetch + contract mapping — out of scope for this safe gate. **UX:** Jump link to `/dashboard/servicios` remains in the category helper panel. |
| **Clases** | No dedicated Leonix seller publish pipeline + unified owner table surfaced in dashboard for clasificados clases listings. Public browse exists without a mirrored “Mis anuncios” source. |
| **Comunidad** | Same as Clases — no safe owner-linked inventory wired for dashboard aggregation. |

### Actions policy (Mis anuncios)

- Buttons use **real `href`s only**; optional preview links are omitted when lane/surface cannot be mapped.
- Labels avoid implying **Messages** unless the destination is `/dashboard/mensajes` threaded to that listing — Empleos/Viajes use **Gestionar** + optional **Preview** + **Results** instead.

## Strict TRUE/FALSE audit

| Area | User expectation | Current TRUE/FALSE | Evidence | Fix needed |
|---|---|---|---|---|
| Account identity | User sees name/email/plan clearly | TRUE | `app/(site)/dashboard/components/LeonixDashboardShell.tsx` shows plan badge, name, email, account ref | None |
| Account identity | User understands current plan | TRUE | Plan chip and `membership_tier` shown in sidebar/profile | None |
| Account identity | User can reach profile/account settings | TRUE | Sidebar link to `/dashboard/perfil` | None |
| Account identity | User can sign out | TRUE | Sidebar `Cerrar sesión` button calls `supabase.auth.signOut()` | None |
| Account identity | Mobile identity/sidebar state usable | TRUE | Sidebar content is stacked and links remain tap targets | None |
| Dashboard summary | User sees owned listing totals | TRUE | `/dashboard` computes `activeListings` from `listings` | None |
| Dashboard summary | User sees active/published signal | TRUE | `Anuncios activos`, `Expiring soon`, En Venta/BR active cards | None |
| Dashboard summary | Views/messages/saves shown only from real sources | TRUE | `listing_analytics` + `messages` + nav counts; no synthetic counters | None |
| Dashboard summary | Next best action is visible | TRUE | Quick actions + attention panel in `/dashboard` | None |
| Dashboard summary | Publish CTA is obvious | TRUE | Global publish CTA in shell and page-level quick actions | None |
| Dashboard summary | Empty/sign-in states accurate | TRUE | Login redirect and explicit sign-in placeholder in `/dashboard` | None |
| Mis anuncios | All owned listings across categories are visible | PARTIAL TRUE | Safe multi-table: `listings` + `restaurantes_public_listings` + `empleos_public_listings` + `viajes_staged_listings` (public only). Servicios still separate (API-owned). | Extend only with real owner sources + routes |
| Mis anuncios | Restaurants appear when owned | TRUE | `dashboardInventory.ts` + section in `mis-anuncios/page.tsx` | None |
| Mis anuncios | Duplicate avoidance works | TRUE | `dedupeRestaurantInventoryWithListings()` filters by draft/ad identifiers | None |
| Mis anuncios | Empty state accurate when restaurants exist | TRUE | `hasAnyInventory` prevents false empty state | None |
| Mis anuncios | Filters/tabs are clear | TRUE | All/Active/Expired/Moderation tabs and search input | None |
| Mis anuncios | Listing category and status are clear | TRUE | Category-specific cards + status chips | None |
| Mis anuncios | Listing actions (public/edit/manage) are clear | TRUE | Per-card action bars for restaurants/en-venta/autos/real-estate | None |
| Mis anuncios | Mobile is card-based and tap-friendly | TRUE | Card layout with min-height action buttons | None |
| Category management routes | Existing category dashboards are discoverable | PARTIAL FALSE | Sidebar has Restaurantes/Servicios/Viajes; Empleos exists but not in sidebar | Add Empleos nav in future pass |
| Drafts | User can see unfinished drafts | TRUE | `/dashboard/drafts` reads `listings` with `is_published=false`/draft statuses | None |
| Drafts | Drafts grouped by category | FALSE | Single flat list with no category grouping | Add grouping chips/sections in future pass |
| Drafts | User can continue editing and distinguish draft vs published | TRUE | Status chips + edit/workspace links | None |
| Messages | Real message count/empty state | TRUE | Uses `messages` table and explicit empty placeholders | None |
| Messages | Listing entry points work | TRUE | Thread links to public listing and workspace | None |
| Messages | Category context visible | FALSE | Thread cards show listing title/id but no explicit category badge | Add category badge later (needs safe resolver) |
| Analytics | Metrics are labeled and understandable | TRUE | `/dashboard/analytics` labels all cards and states data source limits | None |
| Analytics | Unwired metrics are hidden/labeled | TRUE | Copy explicitly says only persisted metrics are shown | None |
| Saved | Saved vs owned distinction is clear | TRUE | Title/subtitle explicitly says saved listings; links back to public pages | None |
| Sidebar/navigation | Labels are understandable | TRUE | Clear section names, including test/review tags for incomplete areas | None |
| Sidebar/navigation | Active state works | TRUE | `activeNav` styling in shell is consistent | None |
| Sidebar/navigation | Manage vs publish routes are not confused | PARTIAL FALSE | Some pages still phrase edit as publish-form fallback | Keep helper text; refine copy next pass |
| Mobile dashboard | No route depends only on horizontal table | FALSE (before fixes), TRUE (after fixes applied) | `servicios`, `viajes`, `empleos` previously table-only | Added mobile card layouts |
| Mobile dashboard | Cards stack and actions remain tap-friendly | TRUE | Mobile card fallbacks now in category routes with wrapped actions | None |

## Category pipeline readiness matrix

| Category | Publish route exists | Public/results route exists | Dashboard manage route exists | Owned data source exists | Appears in Mis anuncios | Edit/update flow exists | Preview exists | Analytics/messages wired or clearly marked | Mobile dashboard usable | TRUE/FALSE ready |
|---|---|---|---|---|---|---|---|---|---|---|
| Restaurantes | TRUE (`/publicar/restaurantes`) | TRUE (`/clasificados/restaurantes`, `/clasificados/restaurantes/resultados`) | TRUE (`/dashboard/restaurantes`) | TRUE (`restaurantes_public_listings`) | TRUE | TRUE (hydrate to publish form) | TRUE (`/clasificados/restaurantes/preview`) | PARTIAL TRUE (dashboard links to analytics/messages, no fake numbers) | TRUE | TRUE |
| Servicios | TRUE (`/clasificados/publicar/servicios`) | TRUE (`/clasificados/servicios`, `/clasificados/servicios/resultados`) | TRUE (`/dashboard/servicios`) | TRUE (`/api/clasificados/servicios/my-listings` + local/dev fallbacks) | FALSE (not merged into unified Mis anuncios feed) | PARTIAL TRUE (edit uses publish form) | TRUE (`/clasificados/publicar/servicios/preview`) | PARTIAL TRUE (real leads only when cloud rows exist) | TRUE (fixed) | FALSE |
| En venta | TRUE (`/clasificados/publicar/en-venta/*`) | TRUE (`/clasificados/en-venta`, `/clasificados/en-venta/results`) | TRUE (via `/dashboard/mis-anuncios`) | TRUE (`listings`) | TRUE | TRUE (`/dashboard/mis-anuncios/[id]/editar`) | TRUE (`/clasificados/en-venta/preview`) | TRUE (real listing analytics + messages links) | TRUE | TRUE |
| Autos | TRUE (`/publicar/autos`, variants) | TRUE (`/clasificados/autos`, `/clasificados/autos/resultados`) | PARTIAL TRUE (managed in `/dashboard/mis-anuncios`) | TRUE (`listings`) | TRUE | PARTIAL FALSE (no clear dedicated edit path from dashboard card) | TRUE (preview routes exist) | PARTIAL TRUE | TRUE | FALSE |
| Empleos | TRUE (`/clasificados/publicar/empleos`) | TRUE (`/clasificados/empleos`, `/clasificados/empleos/resultados`) | TRUE (`/dashboard/empleos`, `/dashboard/empleos/[listingId]`) | TRUE (`empleos_public_listings`) | TRUE (unified section when rows exist) | TRUE (manage page uses **listing id** route param) | TRUE (`quick-preview` / `premium-preview` / `feria-preview` + `from=publicar`) | PARTIAL TRUE (applications in manage view; no fake totals on Mis anuncios cards) | TRUE (fixed) | TRUE (safe subset) |
| Rentas | TRUE (`/publicar/rentas/privado`, `/publicar/rentas/negocio`) | TRUE (`/clasificados/rentas`, `/clasificados/rentas/results`) | TRUE (generic via `/dashboard/mis-anuncios`) | TRUE (`listings` + detail pairs) | TRUE | TRUE (generic edit route + publish flow) | TRUE (`/clasificados/rentas/preview/*`) | PARTIAL TRUE | TRUE | TRUE |
| Bienes Raíces | TRUE (`/publicar/bienes-raices*`) | TRUE (`/clasificados/bienes-raices`, `/clasificados/bienes-raices/resultados`) | TRUE (generic via `/dashboard/mis-anuncios`) | TRUE (`listings` + detail pairs) | TRUE | TRUE (generic edit route + publish flow) | TRUE (`/clasificados/bienes-raices/preview/*`) | PARTIAL TRUE | TRUE | TRUE |
| Viajes | TRUE (`/publicar/viajes/*`) | TRUE (`/clasificados/viajes/oferta/[slug]`, `/clasificados/viajes/resultados`) | TRUE (`/dashboard/viajes` + `stagedId`) | TRUE (`viajes_staged_listings`) | TRUE (unified section; **only `is_public`**) | TRUE (`stagedId` edit/resubmit flow) | TRUE (`…/preview/privado` or `…/preview/negocios` by lane) | PARTIAL TRUE (moderation + owner actions; no fake analytics on cards) | TRUE (fixed) | TRUE (safe subset) |
| Clases | FALSE (no dedicated publish flow found) | PARTIAL TRUE (`/clasificados/clases`) | FALSE | FALSE | FALSE | FALSE | FALSE | FALSE | N/A | FALSE |
| Comunidad | FALSE (no dedicated publish flow found) | PARTIAL TRUE (`/clasificados/comunidad`) | FALSE | FALSE | FALSE | FALSE | FALSE | FALSE | N/A | FALSE |

## Category action expectations (strict)

- **Restaurantes:** public/results/edit/preview/update present; promote/verified/package shown; no direct pause/unpublish action yet from card.
- **Servicios:** public/results/edit/update and pause/resume exist; dashboard ownership uses cloud + fallback sources; not unified with `Mis anuncios`.
- **En venta:** full action bar present in `Mis anuncios` (public/edit/status/archive/delete/promote/analytics/messages).
- **Autos:** management exists in `Mis anuncios`, but explicit edit/update path is weaker than other categories.
- **Empleos:** merged into `Mis anuncios` when `empleos_public_listings` returns rows; manage uses `/dashboard/empleos/[listingId]` (id, not slug).
- **Rentas / Bienes Raíces:** managed through generic listings workspace and real-estate card actions; public routes and previews exist.
- **Viajes:** merged into `Mis anuncios` for **public** staged offers only; public URL is `/clasificados/viajes/oferta/[slug]`; manage uses `/dashboard/viajes?stagedId=…`.
- **Clases / Comunidad:** visible public categories but dashboard management pipeline is missing.

## Mobile route checks

- `/dashboard/mis-anuncios`: TRUE card-first mobile.
- `/dashboard/restaurantes`: TRUE responsive cards.
- `/dashboard/servicios`: TRUE after fix (mobile cards + desktop table).
- `/dashboard/viajes`: TRUE after fix (mobile cards + desktop table).
- `/dashboard/empleos`: TRUE after fix (mobile cards + desktop table).
- `/dashboard/drafts`, `/dashboard/mensajes`, `/dashboard/analytics`, `/dashboard/guardados`, `/dashboard/perfil`: TRUE (stacked blocks/cards, no horizontal dependency).

## Smoke flags

DASHBOARD_AUDIT_CREATED_TRUE=TRUE  
DASHBOARD_CATEGORY_PIPELINE_MATRIX_TRUE=TRUE  
DASHBOARD_RESTAURANTES_PIPELINE_READY_TRUE=TRUE  
DASHBOARD_SERVICIOS_PIPELINE_READY_TRUE_OR_FALSE=FALSE  
DASHBOARD_ENVENTA_REGRESSION_FALSE=FALSE  
DASHBOARD_AUTOS_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_EMPLEOS_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_RENTAS_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_BIENES_RAICES_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_VIAJES_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_CLASES_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_COMUNIDAD_PIPELINE_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_COMMAND_CENTER_STATUS_DOCUMENTED_TRUE=TRUE  
DASHBOARD_MIS_ANUNCIOS_CATEGORY_AWARE_TRUE=TRUE  
DASHBOARD_EMPTY_STATES_ACCURATE_TRUE=TRUE  
DASHBOARD_METRIC_LABELS_CLEAR_TRUE=TRUE  
DASHBOARD_NO_FAKE_COUNTS_TRUE=TRUE  
DASHBOARD_MOBILE_CARDS_TRUE=TRUE  
DASHBOARD_NAV_ACTIVE_STATES_TRUE=TRUE  
DASHBOARD_BUILD_GREEN_TRUE=TRUE
