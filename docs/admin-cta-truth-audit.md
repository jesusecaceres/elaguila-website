# Leonix admin — CTA / action truth audit

Classification: **TRUE** (works end-to-end), **PARTIAL** (real data but limited), **HONESTLY_DISABLED** (UI disabled or explicit non-action), **HONEST_LINK** (navigates to real tool with clear copy).

Last updated: 2026-04-10 (code pass).

---

## Global

| CTA / surface | Route / file | Expected behavior | Status | Depends on |
|---------------|--------------|-------------------|--------|------------|
| Sidebar nav | `AdminSidebar.tsx` | Navigate to admin routes | TRUE | — |
| Cookie admin gate | `(dashboard)/layout.tsx` | Block without `leonix_admin` | TRUE | Cookie |
| Admin flash toasts | `AdminQueryFlash.tsx` | Show real redirect outcomes | TRUE | Query params |

---

## Dashboard (`/admin`)

| CTA | File | Status | Notes |
|-----|------|--------|-------|
| Website sections / site settings / ops chips | `page.tsx` | TRUE | Links only |
| Tienda stat cards | `page.tsx`, `AdminStatCard.tsx` | PARTIAL | Real counts when `tienda_orders` exists |
| Full Tienda inbox / categories / revista | `page.tsx` | TRUE | Links |
| Data honesty footer | `page.tsx` | HONEST_LINK | Explains proxies |

---

## Users (`/admin/usuarios`, `/admin/usuarios/[id]`)

| Action | Status | Backend |
|--------|--------|---------|
| Search / list | TRUE | `profiles` |
| Habilitar / Deshabilitar | TRUE | `setUserDisabledAction` → `profiles.is_disabled` |
| Guardar cuenta (tipo/membresía) | TRUE | `updateClientAccountAction` (same page) |
| Customer ops / Tienda / reportes links | TRUE | Routes + query |
| **Auth: password / magic link** | **HONEST_LINK** | **Supabase Dashboard Auth users** (deep link from env) |
| Réplica “como usuario” | HONESTLY_DISABLED | Not offered (security) |

---

## Ops (`/admin/ops`)

| Action | Status | Notes |
|--------|--------|-------|
| Unified search | TRUE | profiles, listings, tienda_orders, listing_reports |
| Section anchors / shortcuts | TRUE | In-page + routes |
| Support context card | TRUE | When single profile match |

---

## Support (`/admin/support`)

| Action | Status | Notes |
|--------|--------|-------|
| Forms → ops / users | TRUE | GET forms |
| Escalation tags | HONESTLY_DISABLED | Visual only, labeled |
| Account “stubs” | **Removed** | Replaced with copy + Users + Supabase Auth link |
| Internal notes textarea | HONESTLY_DISABLED | Not persisted |

---

## Team (`/admin/team`)

| Action | Status | Backend |
|--------|--------|---------|
| Roster table | PARTIAL | Placeholder data in code until `admin_team_members` |
| Deactivate / Edit row | HONESTLY_DISABLED | Title explains need for persisted members + RLS |
| **Registrar intención de invitación** | **TRUE** (when migrated) | **`admin_team_invites`** + **`admin_audit_log`** via `createTeamInviteIntentAction` |
| Supabase Auth docs link | HONEST_LINK | External |

**Does not:** create Supabase Auth users or send email by itself.

---

## Activity log (`/admin/activity-log`)

| Action | Status | Notes |
|--------|--------|-------|
| Table | **TRUE** when `admin_audit_log` exists and rows present | `fetchAdminAuditLogRecent` |
| Empty table | PARTIAL | Honest empty state |
| Seed rows | HONESTLY_DISABLED | When migration missing or error |

**Writers:** `setUserDisabledAction`, `createTeamInviteIntentAction`, `updateTiendaOrderStatusAction` (best-effort append).

---

## Settings (`/admin/settings`)

| Action | Status | Notes |
|--------|--------|-------|
| Theme / save | HONESTLY_DISABLED | Stub badges + helper text |

---

## Payments (`/admin/payments`)

| Action | Status | Notes |
|--------|--------|-------|
| Metrics | HONESTLY_DISABLED | Placeholder `—` |
| Search | HONESTLY_DISABLED | Badge “Búsqueda desactivada”, no billing tables |
| Processor dashboard | HONESTLY_DISABLED | Renamed, not fake button |

---

## Quick actions rail (`AdminQuickActionsRail.tsx`)

| Action | Status | Notes |
|--------|--------|-------|
| User search / Clasificados queue | TRUE | GET forms |
| Reset password / replica | HONESTLY_DISABLED | Explicit titles + Support link |
| Team link | TRUE | Team page |

---

## Workspace / content (summary)

| Area | Save actions | Status |
|------|--------------|--------|
| Site settings, home marketing, sections JSON, global site, contacto, nosotros, noticias/iglesias/cupones, Tienda storefront/catalog | Server actions | TRUE (when tables/columns exist) |
| Revista / magazine issues | `magazineIssuesActions`, upload API | TRUE with `BLOB_READ_WRITE_TOKEN` for uploads |
| Categories ops | `saveSiteCategoryConfigRowAction` | TRUE | `site_category_config` |
| Clasificados queue | Filters, reports, delete listing | TRUE (see `detail_pairs` migration note on workspace) |
| Servicios admin sim | PARTIAL | localStorage sim — labeled dashed CTA on clasificados workspace |

---

## Legacy / misc

| Route | Status |
|-------|--------|
| `/admin/draw` | **HONEST_LINK** — was misleading site nav; now placeholder with links to Dashboard / workspace |
| `/admin/website-content` | TRUE | Redirect to `/admin/site-settings` |
| `/admin/magazine` | TRUE | Redirect to revista workspace |

---

## Supabase: migrations added (this pass)

- `20260410120000_admin_audit_log_and_team_invites.sql` — `admin_audit_log`, `admin_team_invites`

## Still needed for “full” control (not implemented here)

- `admin_team_members` — real roster + row actions
- `listings.detail_pairs` — **apply** `20250316200000` / `20260407140000` in production if missing
- Billing / payments tables and processor webhooks
- Support ticket table
- Optional: `auth.admin.inviteUserByEmail` wired to team flow with product decision
- Public category posture from DB — product merge into public nav

---

## Password / invite / add-user summary

| Flow | In this codebase |
|------|------------------|
| Add end-user account | **Not** from admin — use Supabase Auth or sign-up flows |
| Team “invite” | **Intent row** in `admin_team_invites` + audit; **no** Auth email automation |
| Password reset | **Supabase Dashboard** (link built from `NEXT_PUBLIC_SUPABASE_URL`) |
| Enable/disable user | **TRUE** — `profiles.is_disabled` |
