# Gate FOOD-L7A — Comida Local User Dashboard Integration

## Gate type

BUILD-REQUIRED

## 1. Gate title

Gate FOOD-L7A — Comida Local User Dashboard Integration

## 2. Preflight status

Clean unrelated worktree at gate start.

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5B | `comida_local_public_listings`, `owner_user_id`, `leonix_ad_id`, status/package/payment fields |
| FOOD-L6 | Public detail `/clasificados/comida-local/{slug}` |
| FOOD-L5C | `main_photo` JSONB with HTTPS `url` |

## 4. Files inspected (read-only)

- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `fetchOwnerRestaurantListings` / `buildRestaurantInventoryItems` pattern
- FOOD-L5B/L6 audits

## 5. Files changed

- `comidaLocalDashboardQueries.ts`
- `mapComidaLocalDashboardListing.ts`
- `ComidaLocalDashboardListings.tsx`
- `COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md`
- `scripts/comida-local-food-l7a-user-dashboard-audit.ts`
- `app/(site)/dashboard/lib/dashboardInventory.ts` — `source: comida_local_public_listings`
- `app/(site)/dashboard/mis-anuncios/page.tsx` — fetch + section + category chip
- `package.json` — audit script

## 6. Existing dashboard pattern findings

- **Route:** `/dashboard/mis-anuncios` (authenticated client Supabase).
- **Pattern:** Per-category `fetchOwner*` on dedicated table + `build*InventoryItems` → section UI.
- **Insertion:** Comida Local section after Servicios; category management card + filter chip `comida-local`.
- **Auth:** `u.id` from `supabase.auth.getUser()` passed to query — not from URL/body.
- **RLS:** Owner `SELECT` on `comida_local_public_listings` when `owner_user_id = auth.uid()`.
- **Edit/manage:** Deferred — link to `/publicar/comida-local` form only (no dedicated manage hub).

## 7. User-scoped query result

`listUserComidaLocalListings(sb, ownerUserId)` / `fetchOwnerComidaLocalListings` — `.eq("owner_user_id", owner)`, order `published_at` desc.

## 8. Dashboard mapper result

`mapComidaLocalRowToDashboardVm` + `buildComidaLocalDashboardInventoryItems` — real status/package/payment labels, Leonix ID, public path, safe main photo URL.

## 9. Dashboard component result

`ComidaLocalDashboardListings` — burgundy/cream cards, thumbnail, meta grid, Ver ficha + formulario links, empty state + CTA.

## 10. Dashboard integration result

`mis-anuncios/page.tsx` loads Comida rows on auth, shows section when `cat=all|comida-local`, empty when `cat=comida-local` only.

## 11. Security/ownership result

- Owner ID from session only.
- No client `owner_user_id` param.
- Public links are published slug routes only.

## 12. Empty state result

Spanish copy + link `/publicar/comida-local` when filter `comida-local` and zero rows.

## 13. UX/UI result

Leonix cream/burgundy; compact cards; mobile stack layout.

## 14. Not implemented

Admin, analytics display, Stripe, edit-from-dashboard, republish, entitlement overlay, dedicated `/dashboard/comida-local` hub.

## 15–16. Desktop / Mobile

Responsive flex cards; meta grid 2 columns on sm+.

## 17. Risks / deferred

- Listings with `owner_user_id` null (anonymous publish) won't appear until user republishes signed-in.
- No server-side dashboard API — relies on Supabase RLS + browser client.

## 18. Manual QA checklist

1. Sign in → `/dashboard/mis-anuncios`
2. Publish Comida Local listing with same user
3. Confirm section shows title, Leonix ID, status, package, payment, Ver ficha
4. Ver ficha opens public slug page
5. Filter `?cat=comida-local`
6. New user → empty state + CTA
7. Audit + build pass

## Requirement audit table

| Requirement | TRUE/FALSE | Evidence |
| --------------------------------------------------------- | ---------- | -------- |
| FOOD-L5B audit was read and followed | TRUE | owner table + fields |
| FOOD-L6 audit was read and followed | TRUE | publicPath in mapper |
| Comida Local remains separate from Restaurantes Premium | TRUE | own query/table |
| Existing user dashboard patterns were inspected read-only | TRUE | mis-anuncios + dashboardInventory |
| User-scoped Comida Local dashboard query exists | TRUE | `comidaLocalDashboardQueries.ts` |
| Query reads comida_local_public_listings only | TRUE | `.from("comida_local_public_listings")` |
| Query filters by authenticated owner_user_id | TRUE | `.eq("owner_user_id", owner)` |
| Query does not trust owner_user_id from client | TRUE | `u.id` from auth in page |
| Dashboard mapper uses real row data only | TRUE | `mapComidaLocalDashboardListing.ts` |
| Dashboard card/section shows Comida Local listings | TRUE | `ComidaLocalDashboardListings` |
| Dashboard shows real Leonix ID when available | TRUE | meta block |
| Dashboard shows real status/package/payment fields | TRUE | badges + payment meta |
| Dashboard links to public detail route | TRUE | Ver ficha → `/clasificados/comida-local/{slug}` |
| Empty state exists | TRUE | component empty branch |
| No fake analytics/counters/views were added | TRUE | no metrics UI |
| No analytics display was added | TRUE | `analyticsHref: null` |
| No Stripe/payment files were edited | TRUE | git scope |
| No Admin files were edited | TRUE | git scope |
| No app/api files were edited | TRUE | git scope |
| No database migrations were created | TRUE | no migrations |
| No search/results/categoryConfig files were edited | TRUE | git scope |
| No Restaurante files were edited | TRUE | git scope |
| No Rentas/BR/Servicios/En Venta files were edited | TRUE | git scope |
| Mobile layout remains clean | TRUE | responsive classes |
| Audit script passed | TRUE | npm script |
| npm run build passed | TRUE | Phase 11 |
