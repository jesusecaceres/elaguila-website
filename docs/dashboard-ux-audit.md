# Dashboard UX Audit (Leonix)

Audit date: 2026-05-07  
Scope: dashboard clarity, navigation, mobile usability, and category pipeline readiness.

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
| Mis anuncios | All owned listings across categories are visible | FALSE | Pulls `listings` + restaurants inventory, but not empleos/servicios/viajes staged rows | Keep as known multi-table gap; avoid fake merge |
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
| Servicios | TRUE (`/clasificados/publicar/servicios`) | TRUE (`/clasificados/servicios`, `/clasificados/servicios/resultados`) | TRUE (`/dashboard/servicios`) | TRUE (`/api/clasificados/servicios/my-listings` + local/dev fallbacks) | FALSE | PARTIAL TRUE (edit uses publish form) | TRUE (`/clasificados/publicar/servicios/preview`) | PARTIAL TRUE (real leads only when cloud rows exist) | TRUE (fixed) | FALSE |
| En venta | TRUE (`/clasificados/publicar/en-venta/*`) | TRUE (`/clasificados/en-venta`, `/clasificados/en-venta/results`) | TRUE (via `/dashboard/mis-anuncios`) | TRUE (`listings`) | TRUE | TRUE (`/dashboard/mis-anuncios/[id]/editar`) | TRUE (`/clasificados/en-venta/preview`) | TRUE (real listing analytics + messages links) | TRUE | TRUE |
| Autos | TRUE (`/publicar/autos`, variants) | TRUE (`/clasificados/autos`, `/clasificados/autos/resultados`) | PARTIAL TRUE (managed in `/dashboard/mis-anuncios`) | TRUE (`listings`) | TRUE | PARTIAL FALSE (no clear dedicated edit path from dashboard card) | TRUE (preview routes exist) | PARTIAL TRUE | TRUE | FALSE |
| Empleos | TRUE (`/clasificados/publicar/empleos`) | TRUE (`/clasificados/empleos`, `/clasificados/empleos/resultados`) | TRUE (`/dashboard/empleos`) | TRUE (`empleos_public_listings`) | FALSE | TRUE (lane-specific edit links) | TRUE (quick/premium/feria preview routes) | PARTIAL TRUE (apps/messages in manage view, no fake totals) | TRUE (fixed) | FALSE |
| Rentas | TRUE (`/publicar/rentas/privado`, `/publicar/rentas/negocio`) | TRUE (`/clasificados/rentas`, `/clasificados/rentas/results`) | TRUE (generic via `/dashboard/mis-anuncios`) | TRUE (`listings` + detail pairs) | TRUE | TRUE (generic edit route + publish flow) | TRUE (`/clasificados/rentas/preview/*`) | PARTIAL TRUE | TRUE | TRUE |
| Bienes Raíces | TRUE (`/publicar/bienes-raices*`) | TRUE (`/clasificados/bienes-raices`, `/clasificados/bienes-raices/resultados`) | TRUE (generic via `/dashboard/mis-anuncios`) | TRUE (`listings` + detail pairs) | TRUE | TRUE (generic edit route + publish flow) | TRUE (`/clasificados/bienes-raices/preview/*`) | PARTIAL TRUE | TRUE | TRUE |
| Viajes | TRUE (`/publicar/viajes/*`) | TRUE (`/clasificados/viajes/resultados`, detail pages) | TRUE (`/dashboard/viajes`) | TRUE (`viajes_staged_listings`) | FALSE | TRUE (`stagedId` edit/resubmit flow) | TRUE (`/clasificados/viajes/preview/*`) | PARTIAL TRUE (moderation + owner actions, not unified analytics) | TRUE (fixed) | FALSE |
| Clases | FALSE (no dedicated publish flow found) | PARTIAL TRUE (`/clasificados/clases`) | FALSE | FALSE | FALSE | FALSE | FALSE | FALSE | N/A | FALSE |
| Comunidad | FALSE (no dedicated publish flow found) | PARTIAL TRUE (`/clasificados/comunidad`) | FALSE | FALSE | FALSE | FALSE | FALSE | FALSE | N/A | FALSE |

## Category action expectations (strict)

- **Restaurantes:** public/results/edit/preview/update present; promote/verified/package shown; no direct pause/unpublish action yet from card.
- **Servicios:** public/results/edit/update and pause/resume exist; dashboard ownership uses cloud + fallback sources; not unified with `Mis anuncios`.
- **En venta:** full action bar present in `Mis anuncios` (public/edit/status/archive/delete/promote/analytics/messages).
- **Autos:** management exists in `Mis anuncios`, but explicit edit/update path is weaker than other categories.
- **Empleos:** manage route and application actions exist; not merged into `Mis anuncios`.
- **Rentas / Bienes Raíces:** managed through generic listings workspace and real-estate card actions; public routes and previews exist.
- **Viajes:** staged moderation lifecycle with preview/edit/resubmit/unpublish; not merged into `Mis anuncios`.
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
DASHBOARD_MIS_ANUNCIOS_CATEGORY_AWARE_TRUE=TRUE  
DASHBOARD_EMPTY_STATES_ACCURATE_TRUE=TRUE  
DASHBOARD_METRIC_LABELS_CLEAR_TRUE=TRUE  
DASHBOARD_NO_FAKE_COUNTS_TRUE=TRUE  
DASHBOARD_MOBILE_CARDS_TRUE=TRUE  
DASHBOARD_NAV_ACTIVE_STATES_TRUE=TRUE  
DASHBOARD_BUILD_GREEN_TRUE=TRUE
