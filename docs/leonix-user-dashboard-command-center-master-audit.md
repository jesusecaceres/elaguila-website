# Leonix User Dashboard — Owner Command Center Master Audit

**Gate:** USER-DASHBOARD-OS-MASTER-AUDIT-01  
**Date:** 2026-06-25  
**Scope:** User/seller dashboard only (`app/(site)/dashboard/**`, related shell/components, dashboard APIs). No UI changes in this gate.  
**Prior gates referenced:** DASH-TRUTH-UX-1, DASH-FINISH-1

---

## Executive summary

The Leonix Owner Command Center has a **solid foundation** after DASH-TRUTH-UX-1 and DASH-FINISH-1: honest product flags (`dashboardProductTruth.ts`), a unified Leonix visual layer (`dashboardLeonixTheme.ts`), and a clear home → Mis anuncios → drafts flow. **Mensajes** and **Guardados** are correctly hidden from normal navigation and show honest disabled pages when accessed directly.

**Strengths:** Real listing inventory, real draft rows, En Venta per-listing analytics (contact-click rollup), lifecycle actions (pause/archive/sold/refresh), category launcher pattern, burgundy/gold Leonix styling on primary surfaces.

**Gaps (launch-critical):** Global `/dashboard/analytics` still displays **unproven metrics** (Guardados, Mensajes event, profile views, applications) that were removed from home/Mis anuncios; **Restaurantes hub** still links to disabled Mensajes; category hubs (restaurantes, servicios, viajes, empleos) are **not in sidebar** but reachable by URL — inconsistent IA; **draft publish** is a blunt `status=active` update without category validation; **notifications** prefs are localStorage-only.

**Recommendation:** Treat dashboard as **P1 launch-ready for En Venta/Varios + drafts + home KPIs**; run P0 cleanup on global analytics truth and orphaned Mensajes CTAs before broad seller marketing.

---

## User dashboard route inventory

| Route | Nav label | Page title | Purpose | Primary action | Data source | Status | Mobile | Risk | Priority | Next fix |
|-------|-----------|------------|---------|----------------|-------------|--------|--------|------|----------|----------|
| `/dashboard` | Resumen | Resumen de cuenta | Command center home | Gestionar / Publicar | `listings`, `listing_analytics` API, nav counts | **STRONG** | PARTIAL | LOW | HIGH | Live QA KPIs |
| `/dashboard/mis-anuncios` | Mis anuncios | Mis anuncios | Listing inventory hub | Publicar / Gestionar card | `listings` + category inventories | **STRONG** | PARTIAL | LOW | HIGH | Mobile card density |
| `/dashboard/mis-anuncios/[id]` | — | Listing workspace | Per-listing manage + analytics | Ver público / tabs | `listings`, `listing_analytics`, lifecycle client | **STRONG** (En Venta) / PARTIAL (others) | PARTIAL | MED | HIGH | Category-specific analytics proof |
| `/dashboard/mis-anuncios/[id]/editar` | — | Editar | Field edit | Guardar | `listings` update | **WORKING** | PARTIAL | MED | HIGH | — |
| `/dashboard/drafts` | Borradores | Borradores | Draft recovery | Abrir borrador / Publicar | `listings` `is_published=false` | **WORKING** | PARTIAL | MED | HIGH | Publish truth per category |
| `/dashboard/mensajes` | *(hidden)* | Mensajes | Disabled inbox | Ir a Mis anuncios | N/A (disabled) | **DISABLED** honest | STRONG | LOW | LOW | Keep hidden until product |
| `/dashboard/guardados` | *(hidden)* | Guardados | Disabled saves | Explorar clasificados | N/A (disabled) | **DISABLED** honest | STRONG | LOW | LOW | Enable when `saved_listings` productized |
| `/dashboard/analytics` | Analíticas | Analíticas | Global rollup | Ir a Mis anuncios | `/api/dashboard/analytics/summary` → `listing_analytics` | **PARTIAL** | PARTIAL | **HIGH** | MED | Hide unproven metrics |
| `/dashboard/analiticas` | — | (alias) | Redirect/re-export | — | — | **WORKING** | — | LOW | LOW | — |
| `/dashboard/perfil` | Perfil y cuenta | Perfil | Account edit | Guardar perfil | `profiles` | **WORKING** | PARTIAL | LOW | MED | — |
| `/dashboard/seguridad` | Seguridad | Seguridad | Password/session | Update credentials | Supabase Auth | **WORKING** | PARTIAL | MED | MED | Live QA auth flows |
| `/dashboard/notificaciones` | Notificaciones | Notificaciones | Alert prefs (local) | Toggle prefs | **localStorage only** | **PARTIAL** | PARTIAL | MED | LOW | Persist prefs table |
| `/dashboard/business-tools` | Herramientas de negocio | Herramientas | Concierge teaser | Completar perfil | `profiles` completeness | **PARTIAL** | STRONG | LOW | LOW | Honest “coming phases” copy OK |
| `/dashboard/vistos-recientes` | Vistos recientemente | Vistos recientemente | Buyer-side history on device | Ver anuncio | localStorage + `listings` | **WORKING** | STRONG | LOW | LOW | Clarify device-local scope |
| `/dashboard/restaurantes` | *(not in sidebar)* | Restaurantes | Category hub | Gestionar / Publicar | `listings` restaurantes | **WORKING** | PARTIAL | **HIGH** | MED | Remove Mensajes CTA |
| `/dashboard/servicios` | *(not in sidebar)* | Servicios | Category hub | Gestionar | servicios inventory | **PARTIAL** | PARTIAL | MED | MED | Analytics proof |
| `/dashboard/viajes` | *(not in sidebar)* | Viajes | Staged travel hub | Gestionar | viajes inventory | **PARTIAL** | PARTIAL | MED | MED | — |
| `/dashboard/empleos` | *(not in sidebar)* | Empleos | Jobs hub | Gestionar vacante | empleos rows | **WORKING** | PARTIAL | LOW | MED | — |
| `/dashboard/empleos/[listingId]` | — | Empleo detail | Single job manage | — | empleos | **WORKING** | UNKNOWN | LOW | MED | — |
| `/dashboard/ofertas-locales` | *(not in sidebar)* | Ofertas locales | Owner offers | — | ofertas tables | **PARTIAL** | UNKNOWN | MED | LOW | Out of main seller IA |
| `/dashboard/ofertas-locales/[id]` | — | Oferta detail | Edit offer | — | ofertas | **PARTIAL** | UNKNOWN | MED | LOW | — |
| `/dashboard/borradores` | — | (alias → drafts) | Redirect | — | — | **WORKING** | — | LOW | LOW | — |
| `/dashboard/messages` | — | (alias → mensajes) | Redirect | — | — | **WORKING** | — | LOW | LOW | — |
| `/dashboard/notifications` | — | (alias → notificaciones) | Redirect | — | — | **WORKING** | — | LOW | LOW | — |

**Counts:** 22 distinct user-facing routes (incl. aliases/hubs). **Strong:** 5 · **Working:** 10 · **Partial:** 8 · **Disabled honest:** 2 · **Confusing:** 1 (global analytics vs home truth) · **Broken/unknown:** 0 core routes.

---

## CEO/CFO/User/Client review

### CEO — Command center test (10 questions)

| # | Question | Answer today | Grade |
|---|----------|--------------|-------|
| 1 | What is live? | Home **Anuncios activos** + Mis anuncios inventory | ✅ |
| 2 | What is performing? | Home **Vistas**; En Venta detail analytics; global analytics (mixed) | ⚠️ |
| 3 | What needs action? | **Por expirar**, draft count, expiring badge on Mis anuncios nav | ✅ |
| 4 | Drafts to finish? | **Borradores** page + home metric | ✅ |
| 5 | Categories to manage? | Home + Mis anuncios category launchers | ✅ |
| 6 | Where to publish? | Sidebar **Publicar anuncio** + quick action | ✅ |
| 7 | Where to check analytics? | En Venta → listing workspace; global `/dashboard/analytics` | ⚠️ |
| 8 | Tools available now? | Profile, security, drafts, listings, business-tools teaser | ✅ |
| 9 | Tools intentionally disabled? | Mensajes, Guardados (flags + pages) | ✅ |
| 10 | What to click next? | Home quick actions clear | ✅ |

**CEO verdict:** Feels like a real command center for **listing owners**; not yet unified across all categories.

### CFO — Value without fake upsells

- ✅ Home shows only real KPIs (no Mensajes/Guardados counts).
- ✅ En Venta card hides in-dashboard Pro upsell (`hidePlanUpsell` default).
- ⚠️ Global analytics still shows saves/messages/profile metrics — **fake/static risk** if events sparse.
- ⚠️ Business tools / Concierge cards are aspirational but labeled honestly.

### USER — 10-second comprehension

**Works well:** Spanish-first copy, serif hero, 4 KPI cards, 3 quick actions, category grid with Listo/Próximamente.

**Confusing:** Sidebar **Analíticas** promises breadth global page may not match; category hubs exist off-sidebar; duplicate paths (`/dashboard/borradores` vs `/drafts`).

### CLIENT — Trust

**Trust builders:** Honest disabled pages, analytics notice on Mis anuncios, degraded-state banners when `listing_analytics` unavailable.

**Trust risks:** Restaurantes **Mensajes** button → disabled page; global analytics showing Guardados/Mensajes after they were removed elsewhere.

**Recommended layout (already largely implemented):** Hero → KPI strip → Category management → Quick actions. Secondary: category hubs via Mis anuncios only until IA gate.

---

## Proposed user dashboard information architecture

### Target groups (future sidebar — USER-DASHBOARD-IA-02)

1. **Command:** Resumen · Mis anuncios · Borradores  
2. **Performance:** Analíticas *(scoped truth)* · *(future: category performance)*  
3. **Publishing:** Publicar anuncio *(CTA)* · category shortcuts on home/Mis anuncios  
4. **Listing management:** Category hubs *(deep links only until unified)*  
5. **Account:** Perfil · Seguridad · Notificaciones  
6. **Business tools:** Herramientas · Vistos recientemente · *(future: Guardados, Mensajes when ready)*

### Current vs proposed

| Item | Current | Proposed |
|------|---------|----------|
| Mensajes | Hidden (`DASHBOARD_INTERNAL_INBOX_READY=false`) | Keep hidden until inbox product |
| Guardados | Hidden (`DASHBOARD_SAVED_LISTINGS_READY=false`) | Keep hidden |
| Analíticas nav | Visible | Keep but gate page content to proven metrics |
| Category hubs in nav | Not listed (restaurantes/servicios/viajes/empleos) | Either add under “Mis categorías” submenu OR keep launcher-only |
| Activity section | Vistos recientemente under “Mi actividad” | OK; clarify buyer vs seller |

---

## Action truth map

| Action | Where | Works | Destructive | Confirm | Proof shown | API / client | Blocker | Recommendation |
|--------|-------|-------|-------------|---------|-------------|--------------|---------|----------------|
| Publicar anuncio | Sidebar, home, Mis anuncios | **TRUE** | No | No | N/A | `/clasificados/publicar` | — | Keep |
| Gestionar anuncios publicados | Home quick action | **TRUE** | No | No | N/A | `/dashboard/mis-anuncios` | — | Keep |
| Continuar borradores | Home quick action | **TRUE** | No | No | N/A | `/dashboard/drafts` | — | Keep |
| Abrir borrador | Drafts | **TRUE** | No | No | N/A | `/dashboard/mis-anuncios/[id]` | — | Keep |
| Seguir editando | Drafts | **TRUE** | No | No | N/A | `.../editar` | — | Keep |
| Publicar draft | Drafts | **PARTIAL** | No | No | No toast | `listings.update` status active | May not run category publish validators | Category-aware publish gate |
| Archivar draft | Drafts | **TRUE** | Yes | **Yes** (`confirm`) | Row removed | `OWNER_LISTING_SOFT_ARCHIVE_PATCH` | — | Keep — **destructive actions** require confirm |
| Copiar ID | Drafts | **TRUE** | No | No | Clipboard | — | — | Keep |
| Ver público | Listing workspace, cards | **TRUE** | No | No | Opens public URL | public routes | — | Keep |
| Ver detalles | En Venta card | **TRUE** | No | No | N/A | public `/clasificados/anuncio/[id]` | — | Keep |
| Ir a editar / Editar | Workspace, cards | **TRUE** | No | No | N/A | `.../editar` | — | Keep |
| Vista previa | Category cards (restaurant etc.) | **PARTIAL** | No | No | Preview routes | category-specific | Not all categories | Keep where real |
| Ver resultados públicos | Some cards | **TRUE** | No | No | N/A | results pages | — | Keep |
| Analíticas (En Venta) | Card → `mis-anuncios/[id]` | **TRUE** | No | No | Real counts tab | `listing_analytics` rollup | Live QA | Keep |
| Analíticas (global) | Sidebar | **PARTIAL** | No | No | Shows all metric types | `/api/dashboard/analytics/summary` | Unproven labels | Hide unproven |
| Refrescar anuncio | En Venta card/workspace | **TRUE** | No | No | Visibility VM | `listings` republish cols | Pro + eligibility | Keep |
| Republicar | En Venta inactive | **TRUE** | No | **Yes** modal | New listing flow | publish republish | — | Keep |
| Pausar | En Venta/BR cards | **TRUE** | Yes | No | Status chip | `ownerListingsLifecycleClient` | — | Add confirm optional |
| Reactivar | Paused listings | **TRUE** | No | No | Status chip | lifecycle client | — | Keep |
| Archivar | Cards, drafts | **TRUE** | Yes | Drafts: confirm | Row gone | soft archive patch | — | Keep |
| Marcar vendido | En Venta | **TRUE** | Yes | **Yes** modal | Status sold | `listings.status` | — | Keep |
| Cerrar sesión | Sidebar | **TRUE** | No | No | Redirect login | `supabase.auth.signOut` | — | Keep |
| Profile edit | `/dashboard/perfil` | **TRUE** | No | No | Saved banner | `profiles` upsert | — | Keep |
| Notification settings | `/dashboard/notificaciones` | **PARTIAL** | No | No | Local only | localStorage | No DB | Future migration |
| Security settings | `/dashboard/seguridad` | **TRUE** | No | No | Auth feedback | Supabase Auth | Live QA | Keep |
| Disabled Mensajes | Direct URL | **TRUE** (honest) | No | No | Copy + CTA | — | Product not ready | Keep |
| Disabled Guardados | Direct URL | **TRUE** (honest) | No | No | Copy + CTA | — | Product not ready | Keep |
| Category Gestionar/Publicar | Home/Mis anuncios launchers | **TRUE** | No | No | Routes exist | mixed | Clases/Comunidad no actions | Keep Listo only |
| Restaurantes → Mensajes | `/dashboard/restaurantes` card | **FALSE** (misleading) | No | No | Lands on disabled page | `/dashboard/mensajes` | Truth gate miss | **Remove CTA** |

---

## Analytics truth audit

| Surface | Data source | Event writing | Real/proven | Labels shown | Fake/static risk | Usefulness | Live QA | Keep/hide |
|---------|-------------|---------------|-------------|--------------|------------------|------------|---------|-----------|
| Home **Vistas totales** | `fetchDashboardAnalyticsSummary` → `listing_analytics` | Untouched (read) | **PROVEN** (read path) | Vistas | Low if table exists | High | **Yes** | Keep |
| Home activos / expiring / drafts | `listings`, nav counts | N/A | **PROVEN** | Counts | Low | High | Yes | Keep |
| Mis anuncios aggregate | `listingAnalyticsAggregate` per row | Read | **PARTIAL** | Activos, Vistas, Compartidos | Medium | Medium | Yes | Keep; hide if degraded |
| En Venta seller detail | Per-listing rollup + API | Read | **PROVEN** (EV gates) | Vistas, likes, contact clicks | Low for EV | High | **Yes** | Keep |
| En Venta card inline | Same rollup | Read | **PROVEN** views/shares | Views, shares | Low | High | Yes | Keep |
| Restaurantes hub stats | Mixed | Read | **UNKNOWN** | Published, promoted, verified | Medium | Medium | Yes | Audit per metric |
| Servicios hub | Engagement copy | Read | **UNKNOWN** | saves/shares wording | Medium | Low | Yes | Align labels |
| Autos card | `listing_analytics` | Read | **PARTIAL** | Views, shares only (post-truth) | Medium | Medium | Yes | Keep minimal |
| BR/rentas cards | Rollup | Read | **PARTIAL** | Views only on card | Medium | Medium | Yes | — |
| **Global `/dashboard/analytics`** | `/api/dashboard/analytics/summary` | Read | **PARTIAL** | Saves, Mensajes, profile, apps, etc. | **HIGH** — shows zeros as real | Medium | **Yes** | **Hide unproven metrics** |
| Category analytics buttons | Various `analyticsHref` | Read | **UNKNOWN** | “Analíticas” | Medium | Varies | Yes | Route to proven surface only |

**Hard rule applied:** En Venta contact metrics are **real data** when `listing_analytics` events exist. Global **Mensajes (event)** ≠ internal inbox. **Guardados** on global page contradicts hidden Guardados product. Only call analytics **real data** when the Supabase read path and event source are known and the route works.

**Supabase proof:** Reads from `listings`, `listing_analytics`, `profiles`, `messages` (disabled product only), `saved_listings` (not exposed). No schema changes in this audit. **seller analytics** rollup proven for En Venta via `listing_analytics` reads.

---

## Product truth audit

| Feature | Status | In normal nav | Direct route | Copy | Risk | Recommendation |
|---------|--------|---------------|--------------|------|------|----------------|
| Internal Mensajes | **DISABLED** | No | Honest disabled page | Good | Low | Keep flag false — **Mensajes disabled** in nav |
| Guardados/Saves | **DISABLED** | No | Honest disabled page | Good | Low | Keep flag false — **Guardados disabled** in nav |
| Borradores | **READY** | Yes | Works | Good | Med (publish partial) | Polish publish truth |
| Mis Anuncios | **READY** | Yes | Works | Good | Low | Mobile pass |
| Category management | **READY** (partial categories) | Via home/Mis anuncios | Hubs by URL | Good | Med | IA cleanup |
| En Venta/Varios analytics | **READY** | Via cards | Workspace | Good | Low | Live QA |
| Global analytics | **PARTIAL** | Yes | Works | Overclaims | **High** | Analytics proof gate |
| Account profile | **READY** | Yes | Works | Good | Low | — |
| Security | **READY** | Yes | Works | Good | Med | Live QA |
| Notifications | **PARTIAL** | Yes | localStorage prefs | Honest subtitle | Med | DB later |
| Business tools | **PARTIAL** | Yes | Teaser cards | Honest “fases siguientes” | Low | OK |
| Vistos recientemente | **READY** | Yes (activity) | Device-local + DB | Good | Low | — |
| Refresh/republish | **READY** (En Venta Pro) | Card/workspace | Real eligibility | Good | Low | — |
| Pro upgrades | **PARTIAL** | Publish flows only | Not on dashboard cards | Good post-FINISH | Low | No dashboard upsell |
| Stripe/payment | **UNKNOWN** in dashboard | No | — | — | — | Out of scope |
| Seller moderation visibility | **PARTIAL** | Moderation tab Mis anuncios | — | Notes when present | Low | — |
| Contact/leads analytics | **READY** (En Venta) | Detail analytics | Event rollup | Good | Low | Extend proof category-by-category |

---

## Design system audit

**Leonix brand system reference:** `dashboardLeonixTheme.ts` (`LX_DASH`), `enVentaSellerDetailTheme.ts`, `LeonixDashboardShell`. Apply cream/ivory, burgundy CTAs, gold accents consistently.

### Consistent (post DASH-FINISH-1)

- Cream/ivory panels, warm white cards
- Burgundy primary CTAs (sidebar Publicar, En Venta Ver detalles, draft publish)
- Gold/bronze accents, borders, chips
- Serif page titles on home, Mis anuncios, drafts, disabled pages
- Green **Listo** badges (deep green trust)
- Shared: `DashboardMetricLinkCard`, `DashboardCategoryLauncherCard`, `DashboardQuickActionCard`, `DashboardStatsCard`

### Inconsistent (needs style pass)

| Page | Issue |
|------|-------|
| `/dashboard/analytics` | Pre-FINISH styling; gold gradient CTAs; not using `LX_DASH` |
| `/dashboard/restaurantes` | Legacy card styles; Mensajes action |
| `/dashboard/servicios` | Mixed engagement labels (Guardados in copy) |
| `/dashboard/perfil`, `/dashboard/seguridad` | Generic dashboard vars, not full Leonix pass |
| `/dashboard/notificaciones` | Generic styling |
| Category listing cards (generic rentas/clases) | Older border tokens vs En Venta card |

### Shared components recommended

- Extend `LX_DASH` to analytics, profile, security, category hubs
- Single `DashboardDisabledFeaturePage` for Mensajes/Guardados
- `DashboardLifecycleActionBar` for pause/archive/sold (visual consistency)

---

## Mobile user dashboard audit

| Page | Phone | Tablet | Overflow risk | Tables | Cards | Tappable CTAs | Fix priority |
|------|-------|--------|---------------|--------|-------|---------------|--------------|
| `/dashboard` | Good | Good | Low | No | Yes | Yes | Polish KPI hint text wrap |
| `/dashboard/mis-anuncios` | Partial | Good | Low | No | Yes | Yes | En Venta card action wrap; filter chips |
| `/dashboard/mis-anuncios/[id]` | Partial | Good | Low | No | Yes | Yes | Preview hidden <2xl — OK |
| `/dashboard/drafts` | Good | Good | Low | No | Yes | Yes | Button stack on narrow |
| Disabled pages | Strong | Strong | Low | No | Yes | Yes | — |
| `/dashboard/analytics` | Partial | Good | **Med** (4-col metrics) | No | Yes | Yes | Reduce columns mobile |
| Category hubs | Partial | Partial | Med | Some rows | Mixed | Yes | Card conversion |
| Sidebar | Good | Good | Low | N/A | N/A | Yes | Full-width shell OK |

**Horizontal overflow risks:** Global analytics metric grid (4 cols on xl); wide En Venta action rows — monitor on 320px.

---

## Missing tools/features

### A. Must exist before public launch (P0)

- Remove/hide **fake analytics metrics** on global analytics page
- Remove **Mensajes** CTA from Restaurantes hub (and any other stragglers)
- **Live QA** En Venta analytics + public CTAs + dashboard counts alignment
- Draft **publish** category validation or honest “open publish flow” instead of raw activate

### B. Needed soon for seller trust (P1)

- Unified **sidebar IA** (USER-DASHBOARD-IA-02)
- **Mobile-first** listing card actions (USER-DASHBOARD-MOBILE-03)
- Global analytics **metric allowlist** by category
- **Action proof** toasts (archived, published, refreshed)
- Notifications prefs persistence (Supabase)

### C. Monetization/product growth (P2)

- Real **Guardados** hub when `saved_listings` productized
- Real **Mensajes** inbox when `messages` product complete
- **Package entitlement** view for seller (read-only)
- **Promo code redemption** surface (when payment stack ready)
- Category-level **paid visibility** truth (no fake boost buttons)

### D. Future advanced / patentable (P3)

- Lead/contact inbox unified with analytics
- Ad health / visibility score
- Renewal/expiration reminder center
- AI listing improvement tips (read-only suggestions)
- Export analytics CSV
- QR/campaign tracking dashboard
- Support tickets for sellers
- Buyer contact log

---

## Prioritized roadmap

### P0 — Launch-critical

| Gate | Reason | Targets | Impact | Risk | Size |
|------|--------|---------|--------|------|------|
| USER-DASHBOARD-ANALYTICS-PROOF-02 | Global analytics overclaims | `analytics/page.tsx`, API display mapping | Trust | High | Medium |
| USER-DASHBOARD-TRUTH-STRAGGLERS-01 | Mensajes CTA on restaurantes | `restaurantes/page.tsx` | Trust | Med | Small |

### P1 — Seller operator quality

| Gate | Reason | Targets | Impact | Risk | Size |
|------|--------|---------|--------|------|------|
| USER-DASHBOARD-IA-02 | Sidebar/route organization | `LeonixDashboardShell.tsx` | Clarity | Med | Medium |
| USER-DASHBOARD-MOBILE-03 | Mobile-first cleanup | mis-anuncios, cards | UX | Med | Medium |
| USER-DASHBOARD-DRAFTS-ACTIONS-04 | Draft publish truth + proof | `drafts/page.tsx` | Trust | Med | Small |
| USER-DASHBOARD-STYLE-PASS-02 | LX_DASH on remaining pages | analytics, profile, hubs | Brand | Low | Medium |

### P2 — Monetization growth

| Gate | Reason | Targets | Impact | Risk | Size |
|------|--------|---------|--------|------|------|
| USER-DASHBOARD-SELLER-TOOLS-05 | Future tools map without fake UI | flags + stubs | Revenue prep | Med | Large |
| USER-DASHBOARD-ENTITLEMENTS-01 | Read-only package view | new page/API read | CFO | Med | Medium |

### P3 — Advanced

| Gate | Reason | Targets | Impact | Risk | Size |
|------|--------|---------|--------|------|------|
| USER-DASHBOARD-INBOX-01 | Real Mensajes when ready | mensajes page + API | Engagement | High | Large |
| USER-DASHBOARD-INSIGHTS-AI-01 | Listing tips | read-only | Differentiation | Med | Large |

---

## Recommended next 5 gates

1. **USER-DASHBOARD-IA-02** — Sidebar + route organization (group Command / Performance / Account; hide or submenu category hubs).  
2. **USER-DASHBOARD-ANALYTICS-PROOF-02** — Verify/hide all analytics routes; align global page with home truth.  
3. **USER-DASHBOARD-MOBILE-03** — Mobile-first cleanup (cards, action bars, overflow).  
4. **USER-DASHBOARD-DRAFTS-ACTIONS-04** — Drafts publish truth, confirmations, action proof.  
5. **USER-DASHBOARD-SELLER-TOOLS-05** — Future tools map (entitlements, inbox, guardados) without fake UI.

---

## Risks / deferred work

- **Do not** re-enable Mensajes/Guardados in nav until `dashboardProductTruth` flags flip with live QA.
- **Do not** show Guardados/Mensajes/favorites on global analytics until product + events proven.
- Category hubs (restaurantes, servicios, viajes, empleos) remain **reachable by URL** but not in sidebar — document for support.
- `messages` table exists but inbox UX incomplete — disabled state is correct.
- Notifications not persisted — sellers may think prefs are account-wide.
- Draft publish may activate rows that still need category publish wizard — **launch risk**.

---

## TRUE/FALSE audit

| Flag | Value |
|------|-------|
| USER_DASHBOARD_REPO_INSPECTED_FIRST | **true** |
| USER_DASHBOARD_ROUTE_INVENTORY | **true** |
| USER_DASHBOARD_CEO_CFO_USER_CLIENT_REVIEW | **true** |
| USER_DASHBOARD_INFORMATION_ARCHITECTURE | **true** |
| USER_DASHBOARD_ACTION_TRUTH_MAP | **true** |
| USER_DASHBOARD_ANALYTICS_TRUTH_AUDIT | **true** |
| USER_DASHBOARD_PRODUCT_TRUTH_AUDIT | **true** |
| USER_DASHBOARD_DESIGN_SYSTEM_AUDIT | **true** |
| USER_DASHBOARD_MOBILE_AUDIT | **true** |
| USER_DASHBOARD_MISSING_TOOLS | **true** |
| USER_DASHBOARD_PRIORITIZED_ROADMAP | **true** |
| USER_DASHBOARD_NEXT_5_GATES | **true** |
| USER_DASHBOARD_NO_PUBLIC_PAGE_CHANGES | **true** |
| USER_DASHBOARD_NO_SCHEMA_CHANGES | **true** |
| USER_DASHBOARD_NO_STRIPE_PAYMENT_CHANGES | **true** |
| USER_DASHBOARD_NO_BUSINESS_LOGIC_CHANGES | **true** |
| USER_DASHBOARD_VERIFY_PASS | *(run verifier)* |
| USER_DASHBOARD_BUILD_GREEN | *(run build)* |

---

*End of audit — USER-DASHBOARD-OS-MASTER-AUDIT-01*
