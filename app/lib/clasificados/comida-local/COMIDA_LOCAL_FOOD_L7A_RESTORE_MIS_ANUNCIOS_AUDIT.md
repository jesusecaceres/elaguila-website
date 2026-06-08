# Gate FOOD-L7A-RESTORE — Restore Comida Local in Mis Anuncios

## Gate type

BUILD-REQUIRED HOTFIX

## 1. Gate title

Gate FOOD-L7A-RESTORE — Restore Comida Local in Mis Anuncios

## 2. Preflight status

- `git status --short` at gate start: **clean** for Comida Local paths.
- No unrelated dirty files touched by this hotfix.

## 3. Files inspected

- `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts`
- `app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts`
- `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts` (read-only — `comida_local_public_listings` source)
- `COMIDA_LOCAL_FOOD_L7A_USER_DASHBOARD_AUDIT.md`
- `COMIDA_LOCAL_FOOD_L9A_FULL_PIPELINE_QA_AUDIT.md` (regression note)

## 4. Files changed

- `app/(site)/dashboard/mis-anuncios/page.tsx` — restore fetch + render + filter chip + category card
- `COMIDA_LOCAL_FOOD_L7A_RESTORE_MIS_ANUNCIOS_AUDIT.md` (new)
- `scripts/comida-local-food-l7a-restore-mis-anuncios-audit.ts` (new)
- `package.json` — restore audit script line only

No changes to query helper, mapper, component, API, admin, migrations, or public Comida Local pages.

## 5. Existing L7A assets found

| Asset | Path | Role |
|-------|------|------|
| Owner query | `fetchOwnerComidaLocalListings` / `listUserComidaLocalListings` | `.eq("owner_user_id", owner)` on `comida_local_public_listings` |
| Mapper | `mapComidaLocalRowToDashboardVm` | Status, package, payment, Leonix ID, public path |
| Inventory builder | `buildComidaLocalDashboardInventoryItems` | Optional shared inventory shape (not required for restore) |
| UI component | `ComidaLocalDashboardListings` | Cards + empty state + Ver ficha |

## 6. Missing wiring found

**Regression (FOOD-L9A):** `mis-anuncios/page.tsx` did not import or call `fetchOwnerComidaLocalListings`, did not render `ComidaLocalDashboardListings`, and lacked `comida-local` in category filter/chip types.

## 7. Mis Anuncios integration result

**RESTORED** — On auth load, page fetches owner Comida Local rows in parallel with other inventory sources, maps to dashboard VMs, stores in `comidaLocalDashboardItems`, renders `ComidaLocalDashboardListings` when `cat=all|comida-local`.

## 8. Owner-scoped query result

`fetchOwnerComidaLocalListings(supabase, u.id)` where `u.id` comes from `supabase.auth.getUser()` — never from client body/query params.

## 9. Dashboard component render result

`ComidaLocalDashboardListings` shows real fields: business name, status, package, payment, Leonix ID, city/food type, main photo, **Ver ficha** → `/clasificados/comida-local/[slug]`, form link → `/publicar/comida-local`.

## 10. Category/filter chip result

- Added `"comida-local"` to `MisAnunciosCategoryFilter` and `MIS_ANUNCIOS_CATEGORY_FILTERS`.
- `categoryCounts["comida-local"]` drives filter chip when owner has listings.
- Category management card: manage → `?cat=comida-local`, publish → `/publicar/comida-local`.
- Filter chip label: “Comida Local” / “Local Food”.

## 11. Empty state result

When `cat=comida-local` and zero rows, `ComidaLocalDashboardListings` renders with `showEmpty` — Spanish/English copy + CTA to publish.

## 12. Security/ownership result

- RLS + `.eq("owner_user_id", owner)` on dedicated table.
- No client-trusted `owner_user_id`.
- No cross-owner listing exposure.
- No analytics metrics on Comida Local cards.

## 13. UX/UI result

Reuses existing L7A burgundy/cream cards inside Mis Anuncios shell; section placed before Servicios block; mobile-friendly stack unchanged.

## 14. What was intentionally not implemented

- Dedicated `/dashboard/comida-local` manage hub
- Edit/pause/archive actions for Comida Local rows
- Stripe checkout from dashboard
- Analytics counters on Comida Local cards
- Admin moderation from user dashboard
- Global nav / categoryConfig changes

## 15. Desktop result

Comida Local section and filter chip align with other category sections on wide layout.

## 16. Mobile result

Dashboard cards stack vertically; filter chips wrap; no new overflow introduced.

## 17. Risks / deferred work

- Listings with `owner_user_id = null` (anonymous publish) will not appear for any user until owner is linked.
- L7A original audit script still validates same wiring; this restore gate adds dedicated hotfix audit.

## 18. Manual QA checklist

- [ ] Log in as user with Comida Local listing (`owner_user_id` = user id)
- [ ] Open `/dashboard/mis-anuncios` — Comida Local section visible
- [ ] Filter chip “Comida Local” appears when count > 0
- [ ] Click **Ver ficha** — opens `/clasificados/comida-local/[slug]`
- [ ] Open `?cat=comida-local` with no listings — empty state + publish CTA
- [ ] Confirm no other user’s listings visible
- [ ] Confirm no fake view/click counters on Comida Local cards

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Repo state was inspected before edits | TRUE | Clean preflight |
| Existing Comida Local dashboard helper was found | TRUE | `comidaLocalDashboardQueries.ts` |
| Existing Comida Local dashboard mapper was found | TRUE | `mapComidaLocalDashboardListing.ts` |
| Existing Comida Local dashboard component was found | TRUE | `ComidaLocalDashboardListings.tsx` |
| Mis Anuncios page was inspected | TRUE | `mis-anuncios/page.tsx` |
| Mis Anuncios now fetches owner-scoped Comida Local listings | TRUE | `fetchOwnerComidaLocalListings(supabase, u.id)` |
| Mis Anuncios now renders Comida Local listings | TRUE | `ComidaLocalDashboardListings` |
| Comida Local public detail links use `/clasificados/comida-local/[slug]` | TRUE | `mapComidaLocalRowToDashboardVm` `publicPath` |
| Dashboard shows real status/package/payment/Leonix ID fields only | TRUE | Component meta grid |
| Empty state exists for no Comida Local listings | TRUE | `showEmpty` prop |
| Query is owner-scoped | TRUE | `.eq("owner_user_id", owner)` |
| Client-provided owner_user_id is not trusted | TRUE | `u.id` from auth only |
| No fake listings were added | TRUE | DB fetch only |
| No fake analytics/counters/metrics were added | TRUE | No metrics in component |
| No Stripe/payment files were edited | TRUE | Diff scope |
| No app/api files were edited | TRUE | Diff scope |
| No admin files were edited | TRUE | Diff scope |
| No database/migration files were edited | TRUE | Diff scope |
| No public Comida Local card/results/detail redesign was done | TRUE | Diff scope |
| No Restaurante files were edited | TRUE | Diff scope |
| No unrelated category files were edited | TRUE | Only mis-anuncios + comida-local audit |
| Audit script passed | TRUE | `npm run comida-local:food-l7a-restore-mis-anuncios-audit` |
| npm run build passed | TRUE | gate validation |
