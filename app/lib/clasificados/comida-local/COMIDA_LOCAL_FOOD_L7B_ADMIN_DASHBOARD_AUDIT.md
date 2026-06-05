# Gate FOOD-L7B — Comida Local Admin Dashboard Integration

## Gate type

BUILD-REQUIRED

## 1. Gate title

Gate FOOD-L7B — Comida Local Admin Dashboard Integration

## 2. Preflight status

Clean worktree at gate start (`git status --short` empty).

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5B | Table `comida_local_public_listings`; status `draft|published|paused|suspended|pending_payment`; Leonix `COMIDA-YYYY-######`; `payment_status` includes `not_required_for_l5b` |
| FOOD-L6 | Public detail `/clasificados/comida-local/{slug}`; published-only public reads |
| FOOD-L7A | Owner dashboard via RLS + `owner_user_id`; no analytics; no fake counters |

## 4. Files inspected (read-only)

- `app/admin/(dashboard)/layout.tsx` — `requireAdminCookie`
- `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts`
- `app/admin/_lib/classifiedsOpsContract.ts`
- `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts`
- `app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts`
- `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts`
- `app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts`
- FOOD-L5B / L6 / L7A audit documents

## 5. Files changed

- `app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts`
- `app/lib/clasificados/comida-local/mapComidaLocalAdminListing.ts`
- `app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx`
- `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts`
- `app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts`
- `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts`
- `app/admin/_lib/classifiedsOpsContract.ts`
- `COMIDA_LOCAL_FOOD_L7B_ADMIN_DASHBOARD_AUDIT.md`
- `scripts/comida-local-food-l7b-admin-dashboard-audit.ts`
- `package.json` — audit script only

## 6. Existing admin pattern findings

- **Route:** `/admin/workspace/clasificados/{category}` under `(dashboard)` layout with `requireAdminCookie`.
- **Pattern:** Server page + `getAdminSupabase()` full-table reads; queue/live scope nav; search form; HTML table rows.
- **Status updates:** Servicios uses `"use server"` actions in `app/admin/.../actions.ts` with `requireAdminCookie` + `getAdminSupabase()` — no `app/api` route.
- **Insertion:** Dedicated `comida-local` queue page; ops contract + queue href + surface meta entries.
- **Inspect:** `?id=` filter + in-page `listing_json` `<details>` panel (admin-only).
- **Generic vs specific:** Category-specific dedicated queue (like Restaurantes/Servicios).

## 7. Admin query result

`listAdminComidaLocalListings(sb, filters)` — reads `comida_local_public_listings` only via admin client; filters `q`, `slug`, `id`, `leonix_ad_id`, `owner_user_id`, `scope=live`.  
`getAdminComidaLocalListingById` for single-row inspect.  
`updateAdminComidaLocalListingStatus` — DB-allowed status values only.

## 8. Admin mapper result

`mapComidaLocalRowToAdminVm` / `mapComidaLocalRowsToAdminVms` — real Leonix ID, status/package/payment labels, public path, contact/social summaries, `listingJsonSummary`, safe main photo URL.

## 9. Admin component result

`ComidaLocalAdminListings` — section title, helper copy, responsive table, thumbnail, Ver ficha + Inspeccionar links, optional status form, empty state, inspect panel with `listing_json`.

## 10. Admin integration result

`app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx` — queue header, scope nav, search form, fetches admin rows, renders `ComidaLocalAdminListings` with status action when Supabase admin configured.

## 11. Status moderation result

**Implemented** via `updateComidaLocalPublicListingStatusAction` (server action) mirroring Servicios pattern. Allowed values: `draft`, `published`, `paused`, `suspended`, `pending_payment`. Revalidates public index and admin queue. No analytics events (deferred / not in scope).

## 12. Security/admin auth result

- Admin layout enforces `requireAdminCookie`.
- Server action re-checks admin cookie before mutation.
- Queries accept `SupabaseClient` from `getAdminSupabase()` only at call site in admin page/actions.
- No public route imports admin query helpers.
- No user dashboard or publish API changes.

## 13. Empty state result

Spanish: "No hay publicaciones de Comida Local todavía." with helper subtitle.

## 14. UX/UI result

Matches admin cream/gold table language; horizontal scroll on narrow viewports; burgundy Comida Local badge; no global admin restyle.

## 15. What is intentionally not implemented

- Stripe / payment checkout or payment mutation
- Analytics display or moderation analytics events
- Global search / categoryConfig / registry changes
- User dashboard edits
- Publish API changes
- DB migrations
- Staff edit board beyond link to `/publicar/comida-local`
- Republish / promote / verify chrome (Restaurantes-specific)
- Fake listings, seed data, counters, views

## 16. Desktop result

Full-width table with all moderation columns; search form inline; inspect panel below table.

## 17. Mobile/responsive result

`overflow-x-auto` table wrapper; stacked search form fields (`flex-col` → `sm:flex-row`).

## 18. Risks/deferred work

- Hub card visibility depends on `clasificadosCategoryRegistry` containing `comida-local` (ops contract ready; registry not edited in this gate).
- No email/notification on status change.
- Payment status is display-only until FOOD-L5D Stripe gate.
- RLS does not grant admin SELECT; relies on service-role admin client (same as other dedicated queues).

## 19. Manual QA checklist

- [ ] Sign in as Leonix admin; open `/admin/workspace/clasificados/comida-local`
- [ ] Queue shows rows from `comida_local_public_listings` (or empty state)
- [ ] Leonix ID, status, package, payment columns match DB
- [ ] `scope=live` shows only `published` rows
- [ ] Search by Leonix ID / slug / UUID works
- [ ] Ver ficha opens `/clasificados/comida-local/{slug}`
- [ ] Inspeccionar shows `listing_json` for a row
- [ ] Status dropdown saves via server action (admin cookie required)
- [ ] Non-admin cannot access page (redirect/deny)
- [ ] No analytics metrics on page

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| -------------------------------------------------------------------------- | ---------- | -------- |
| FOOD-L5B audit was read and followed | TRUE | Prior gate table + L5B status/payment fields used |
| FOOD-L6 audit was read and followed | TRUE | Public path `/clasificados/comida-local/{slug}` |
| FOOD-L7A audit was read and followed | TRUE | No user dashboard edits; real row fields only |
| Comida Local remains separate from Restaurantes Premium | TRUE | Dedicated table, route, ops contract |
| Existing admin patterns were inspected read-only | TRUE | Restaurantes/Servicios pages + actions |
| Admin Comida Local query exists | TRUE | `comidaLocalAdminQueries.ts` |
| Admin query reads comida_local_public_listings only | TRUE | `.from("comida_local_public_listings")` |
| Admin query is protected by existing admin route/auth pattern | TRUE | `(dashboard)/layout` + server action cookie check |
| Admin mapper uses real row data only | TRUE | `mapComidaLocalAdminListing.ts` |
| Admin card/table/section shows Comida Local listings | TRUE | `ComidaLocalAdminListings.tsx` + admin page |
| Admin shows real Leonix ID when available | TRUE | `leonixAdId` column |
| Admin shows real status/package/payment fields | TRUE | status + package/payment columns |
| Admin links to public detail route | TRUE | `Ver ficha` → `/clasificados/comida-local/` |
| Admin empty state exists | TRUE | Empty copy in component |
| Status moderation is implemented only if existing safe pattern supports it | TRUE | Server action in `comida-local/actions.ts` |
| No fake analytics/counters/views were added | TRUE | No metric labels in component |
| No analytics display was added | TRUE | No analytics imports |
| No Stripe/payment files were edited | TRUE | Firewall + audit script |
| No user dashboard files were edited | TRUE | Firewall + audit script |
| No app/api files were edited | TRUE | Server actions only |
| No database migrations were created | TRUE | No migration files changed |
| No search/results/categoryConfig files were edited | TRUE | Firewall |
| No Restaurante files were edited | TRUE | Firewall |
| No Rentas files were edited | TRUE | Firewall |
| No Bienes Raíces files were edited | TRUE | Firewall |
| No Servicios files were edited | TRUE | Firewall |
| No En Venta/Varios files were edited | TRUE | Firewall |
| Responsive admin layout remains usable | TRUE | `overflow-x-auto` table |
| Audit script passed | TRUE | `npm run comida-local:food-l7b-admin-dashboard-audit` |
| npm run build passed | TRUE | `npm run build` |
