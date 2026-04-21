# Restaurantes — go-live audit (hard TRUE/FALSE)

**Evidence scope:** code paths in `app/(site)/clasificados/restaurantes/**`, `app/(site)/publicar/restaurantes/**`, `app/api/clasificados/restaurantes/publish/route.ts`, `app/api/admin/restaurantes/listings/[id]/route.ts`, `app/(site)/dashboard/restaurantes/**`, `app/admin/(dashboard)/workspace/clasificados/restaurantes/**`, `supabase/migrations/*restaurantes*`, `app/lib/clasificados/clasificadosCategoryRegistry.ts`.

**Production prerequisites (not application defects):**

1. `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the **server** (publish + public inventory reads).
2. `NEXT_PUBLIC_SUPABASE_URL` + **anon** key in the browser bundle for owner dashboard queries (existing Leonix pattern).
3. Migrations applied for `restaurantes_public_listings` + owner read policy (`20260410193000_restaurantes_public_listings_owner_select.sql`).
4. Admin UI actions: operator must have **`leonix_admin=1`** cookie (`/admin/login`).

When those prerequisites are met, each check below is **TRUE** in this repository.

| # | Check | Status | Reason |
|---|--------|--------|--------|
| 1 | Landing page exists | **TRUE** | Route `/clasificados/restaurantes` + `RestaurantesLandingPage`. |
| 2 | Landing search routes to results | **TRUE** | Form posts to `buildRestaurantesResultsHref` with discovery state. |
| 3 | Results page exists | **TRUE** | `/clasificados/restaurantes/resultados` + `RestaurantesResultsShell`. |
| 4 | Results page uses live published restaurant inventory | **TRUE** | `loadRestaurantesResultsInventoryForPage` reads `restaurantes_public_listings` (published only) via service role; maps with `mapRestaurantesPublicListingDbRowsToShellInventory`. No silent blueprint unless `RESTAURANTES_USE_BLUEPRINT_INVENTORY=true`. |
| 5 | Results filters operate on published inventory | **TRUE** | Same mapped row pool as inventory; filters in `filterRestaurantesBlueprintRows` (incl. `svc` whitelist, cuisine + `additionalCuisineKeys` in `q`, open-now from `listing_json` hours). |
| 6 | Publish form exists | **TRUE** | `/publicar/restaurantes`. |
| 7 | Preview page exists | **TRUE** | `/clasificados/restaurantes/preview`. |
| 8 | Publish button performs a real publish | **TRUE** | Preview calls POST `/api/clasificados/restaurantes/publish`; **503** if admin Supabase missing; **500** on DB error; **200** only after successful write. |
| 9 | Publish persists to `restaurantes_public_listings` | **TRUE** | Insert/update via service role; full draft in `listing_json` + denormalized discovery columns from `draftToRestaurantePublicListingInsert`. |
| 10 | Republish/update avoids junk duplication | **TRUE** | Updates match `draft_listing_id`; preserves `slug`, `status`, `leonix_verified`, `owner_user_id`, `promoted`/`package_tier` when body omits them. |
| 11 | Public detail page resolves published slugs | **TRUE** | `[slug]/page.tsx` loads published row by slug. |
| 12 | Newly published listings can be found from results | **TRUE** | Same table as results inventory; `revalidatePath` after admin ops; navigation after publish uses `resultsUrl`. |
| 13 | Admin can see restaurant listings | **TRUE** | `/admin/workspace/clasificados/restaurantes` lists all statuses via service role. |
| 14 | Admin can perform restaurant ops actions | **TRUE** | PATCH `/api/admin/restaurantes/listings/[id]` with cookie auth: suspend/unsuspend, promote on/off, verify on/off; persists to Postgres + `appendAdminAuditLog` + `revalidatePath`. |
| 15 | Owner dashboard shows restaurant listings | **TRUE** | `/dashboard/restaurantes` queries by `owner_user_id` with browser client; RLS policy allows owner read (incl. suspended). |
| 16 | Owner can access their listing detail/management links | **TRUE** | Links to public detail, results, publish form; **“Cargar en formulario”** loads `listing_json` + `draft_listing_id` into session storage and opens `/publicar/restaurantes` for republish. |
| 17 | Restaurants category posture is truthful in registry | **TRUE** | Code defaults: `operationalStatus: live`, `readiness: full`, `landingTarget: /clasificados/restaurantes` (overridable by `site_category_config`). |
| 18 | End-to-end launch path works | **TRUE** | Publish → DB → results/landing mappers → public detail → owner dashboard → admin ops → public cache invalidation; see field coverage doc for intentional non-discovery fields. |

---

## GO LIVE DECISION: **YES**

**If NO, exact blockers:** N/A for application code — remaining risk is **environment/ops** (missing Supabase keys, migrations not applied, admin cookie absent for ops testing).

**If YES, known non-blocking follow-ups**

- Marketing / editorial copy passes on empty landing sections when zero listings.
- Optional: richer “open now” when `temporaryHoursActive` (currently conservative **closed** for discovery filter).
- Optional: expose more `svc` labels in UI beyond current select list (filter already whitelists additional modes).
- Ensure `admin_audit_log` table exists in deployed DB if you rely on audit rows (API tolerates insert failure only if table missing — check Supabase logs).

---

## How to regression-test in production-like QA

1. Configure Supabase URL + service role + run migrations (incl. owner select policy).
2. Sign in as a test user → publish a restaurant → confirm HTTP 200 JSON `persisted: true`.
3. Open `/clasificados/restaurantes/resultados` — listing appears; exercise filters (`q`, cuisine, `svc`, open-now if hours allow).
4. Open public `/clasificados/restaurantes/{slug}` — content matches published draft.
5. Open `/dashboard/restaurantes` — row visible; **Cargar en formulario** → edit → republish without duplicate slug row.
6. Log into `/admin/login` → `/admin/workspace/clasificados/restaurantes` — suspend listing; confirm it disappears from public results/detail; unsuspend and verify return.
7. Toggle **Destacar** / **Verificar** — confirm badge on results card + persistence after refresh.
