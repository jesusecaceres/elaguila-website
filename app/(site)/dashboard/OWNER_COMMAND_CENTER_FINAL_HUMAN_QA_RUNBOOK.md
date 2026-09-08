# Owner Command Center — Final authenticated human QA runbook

**Audience:** Coach / signed-in owner tester.
**Environment:** Vercel Preview only (never Production).
**Auth:** real owner session required. Unauthenticated 307/login is **not** a visual PASS.
**Grammar under test:** `LeonixDashboardShell` → `OwnerProductPageFrame` (collections) → `OwnerEntityWorkspace` (entities). Specialized modules stay children, not separate dashboards.

Breakpoint strategy (do **not** screenshot every lane at every width):

| Width | Mandatory coverage |
| --- | --- |
| **390px** | Home, Mis Anuncios (category wrap + mobile action sheet), one generic manage, one specialized collection |
| **768px** | Shared workspace + one specialized module (Empleos applications **or** Autos/BR inventory **or** Ofertas AI) |
| **1440px** | Desktop home, Mis Anuncios, one collection workbench |

Every critical product lane below must be touched **at least once** while authenticated.

Mark each checkpoint **PASS** / **FAIL**. Stop the lane on FAIL; do not invent missing capabilities.

---

## A. Login / dashboard home — 390 + 1440

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| A1 | `/dashboard` | Sign in as owner | Leonix shell, grouped nav, no horizontal overflow, ES/EN labels switch with `?lang=` | ☐ |
| A2 | `/dashboard` | Scan home widgets | Attention / performance / managed-entities preview / recent activity are real or honestly empty — no fake counts | ☐ |
| A3 | Shell nav | Open Mis Anuncios, Mensajes, Analíticas, Perfil | Routes resolve; no second competing dashboard chrome | ☐ |

## B. Mis Anuncios — 390 + 1440

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| B1 | `/dashboard/mis-anuncios` | Category selector | Pills wrap on desktop; mobile uses dropdown (no swipe-rail) | ☐ |
| B2 | Same | Status tabs (all / active / expired / moderation) | Filter still works; no horizontal-scroll tabs | ☐ |
| B3 | A listing card | Primary doorway | Label is **Administrar anuncio** / **Manage listing**; opens the real manage surface | ☐ |
| B4 | 390px card | Overflow / more actions | `DashboardMobileActionSheet` opens, Escape closes, hidden at `md+` | ☐ |

## C. Generic manage — 768 or 1440 (once)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| C1 | `/dashboard/mis-anuncios/[id]` (En Venta / Clases / Comunidad / Busco / Mascotas / Rentas privado / BR privado as available) | Open a real generic listing | Shared `OwnerEntityWorkspace`; no old seller-detail theme | ☐ |
| C2 | Same | Edit / public / preview (only if shown) | Edit and public hit real routes; preview **only** if the listing actually has preview | ☐ |
| C3 | Same | Pause / resume / archive / sold (only if shown) | Uses existing generic patch path; no invented buttons | ☐ |

## D. Servicios — 390 or 1440 (once)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| D1 | `/dashboard/servicios` | Open collection | Shared shell + page frame + per-listing workspace | ☐ |
| D2 | A listing | Editar anuncio | Existing edit href chain (`serviciosListingEditHref`) | ☐ |
| D3 | Same | Leads / pause / resume / preview | Leads stay listing-scoped (not global Mensajes). Preview only when cloud+published. Lifecycle hits `/api/clasificados/servicios/manage` | ☐ |

## E. Restaurantes — 768 or 1440 (once)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| E1 | `/dashboard/restaurantes` | Open collection | Shared workspace; create CTA once at frame, not per row | ☐ |
| E2 | A listing | Edit + public/results | Real destinations; no per-listing Vista previa | ☐ |
| E3 | Same | Coupon / offer control if entitled | Premium/specialized module, not a second primary doorway | ☐ |

## F. Empleos — 768 (once; cover Quick vs Premium vs Feria truth)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| F1 | `/dashboard/empleos` | Collection | Shared grammar; no dedicated table island / gold publish island | ☐ |
| F2 | Quick or Premium `[listingId]` | Applications | Render in workspace activity; existing application APIs; **Feria omits internal applications** | ☐ |
| F3 | A paused vacancy | Reactivate | Real PATCH to published — not a fake close-vacancy control | ☐ |

## G. Autos — 768 or 1440 (Privado + Dealer parent + child)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| G1 | Mis Anuncios → Autos Privado manage | Open | Workspace; edit / preview / public / analytics if shown are real | ☐ |
| G2 | Autos Dealer parent | Inventory specialized module | Gold inventory child of workspace; existing dealer inventory hrefs | ☐ |
| G3 | A dealer vehicle | Child edit | Stays in parent inventory (`editVehicleId`); child public/preview/analytics use **child** id | ☐ |

## H. Bienes raíces — 1440 (once)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| H1 | BR Negocio parent | Inventory gold CTA | Existing `bienesInventoryEditHref`; shared workspace | ☐ |
| H2 | A property child | Open child draft | Same `[id]` workspace; `openChildDraftId`; no standalone child dashboard | ☐ |
| H3 | Parent lifecycle | Pause / archive / sold / resume | Must go through `callBrLifecycleMutation` — never generic patch | ☐ |

## I. Comida Local — 390 or 768 (once)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| I1 | Comida Local owner listings | Open | `OwnerEntityWorkspace`; edit is primary; public is secondary | ☐ |
| I2 | Same | Pause / resume | Existing `/api/clasificados/comida-local/lifecycle`; no fabricated preview/results | ☐ |

## J. Viajes — 768 (Negocios + Privado)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| J1 | `/dashboard/viajes` | Open both lanes | Shared workspace; lane badge/payload differs; no pause/archive flattening | ☐ |
| J2 | A `changes_requested` row | Resubmit | Caution note + resubmit; still `POST /api/clasificados/viajes/staged-owner` | ☐ |
| J3 | An approved public offer | Unpublish | Terminal/danger unpublish; staged vocabulary preserved | ☐ |

## K. Ofertas — 768 (collection + detail + AI)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| K1 | `/dashboard/ofertas-locales` | Collection | Flyer vs coupon as lane badge on one campaign entity | ☐ |
| K2 | `/dashboard/ofertas-locales/[id]` | Detail | Workspace (no Layer B); campaign next action is real | ☐ |
| K3 | Same | Renewal module | Existing renewal specialized module still present | ☐ |
| K4 | Same | AI Scan / Review | Hosted in `specialized.children`; success **only** when `result.ok` / real scan result | ☐ |

## L. Global — 390 or 1440 (once each)

| # | URL / surface | Click / do | Expected | PASS / FAIL |
| --- | --- | --- | --- | --- |
| L1 | `/dashboard/analytics` | Open | Shared shell; no fabricated per-listing metrics | ☐ |
| L2 | `/dashboard/messages` | Open | Global inbox; not a fake listing-scoped Mensajes CTA | ☐ |
| L3 | `/dashboard/notificaciones` | Open | Shared shell; bilingual | ☐ |
| L4 | `/dashboard/perfil` | Open | Shared shell | ☐ |
| L5 | `/dashboard/seguridad` | Open | Shared shell | ☐ |

---

## Sign-off

Preview URL: _________________________________

Tester: _________________________________  Date: _________________________________

All critical lanes touched authenticated: ☐ YES
Production was not used: ☐ YES
Ready to discuss Production: **NO** until Coach reviews this sheet.
