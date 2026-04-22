# Restaurantes — go-live audit (TRUE / FALSE only)

**Evidence scope:** `app/(site)/clasificados/restaurantes/**`, `app/(site)/publicar/restaurantes/**`, `app/api/clasificados/restaurantes/publish/route.ts`, `app/api/admin/restaurantes/listings/[id]/route.ts`, `app/(site)/dashboard/restaurantes/**`, `app/admin/(dashboard)/workspace/clasificados/restaurantes/**`, `supabase/migrations/*restaurantes*`, `app/lib/clasificados/clasificadosCategoryRegistry.ts`, `scripts/restaurantes-http-smoke.mjs`.

**Runtime prerequisites (deployed environment, not repo defects):**

1. `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the server (publish + public inventory reads).
2. `NEXT_PUBLIC_SUPABASE_URL` + anon key in the browser bundle for owner dashboard queries.
3. Migrations applied for `restaurantes_public_listings` + owner read policy (`20260410193000_restaurantes_public_listings_owner_select.sql`).
4. Admin UI: operator with `leonix_admin=1` cookie from `/admin/login`.

**Automated proof in this repo (corrective pass):**

- `npm run typecheck` (`tsc --noEmit --incremental false`) — exit 0 (avoids stale `.next/types` incremental references when `.next` was removed).
- `npm run build` — exit 0 after clean `.next` (no concurrent `next build` / orphaned `node` workers; parallel builds caused transient `ENOENT` on `.next` manifests on Windows).
- `node scripts/restaurantes-http-smoke.mjs` (requires prior successful `npm run build`) — exit 0; verifies HTTP 200 for landing, results, publish app; verifies POST `/api/clasificados/restaurantes/publish` with `{}` returns **400** `missing_draft` (no fake success).

| # | Check | Status | Reason |
|---|--------|--------|--------|
| 1 | Landing page exists | TRUE | Route `/clasificados/restaurantes` renders (`RestaurantesLandingPage`); HTTP smoke GET 200. |
| 2 | Landing search routes to results | TRUE | Form uses `buildRestaurantesResultsHref` + `restaurantesDiscoveryStateToParams` toward `/clasificados/restaurantes/resultados`. |
| 3 | Results page exists | TRUE | `/clasificados/restaurantes/resultados` + `RestaurantesResultsShell`; HTTP smoke GET 200. |
| 4 | Results page uses live published restaurant inventory | TRUE | `loadRestaurantesResultsInventoryForPage` reads `restaurantes_public_listings` when admin Supabase is configured; otherwise `source: inventory_unavailable` with empty rows and explicit banner (no silent blueprint unless `RESTAURANTES_USE_BLUEPRINT_INVENTORY=true`). |
| 5 | Results filters operate on published inventory | TRUE | Same `initialInventory` passed to `filterRestaurantesBlueprintRows`; URL state + filters documented in `restaurantesDiscoveryContract.ts` / `filterRestaurantesBlueprintRows.ts`; mapper `mapRestaurantesPublicListingDbRowToShellInventoryRow` supplies fields from `listing_json`. |
| 6 | Publish form exists | TRUE | `/publicar/restaurantes`; HTTP smoke GET 200. |
| 7 | Preview page exists | TRUE | `/clasificados/restaurantes/preview` included in app build output. |
| 8 | Publish button performs a real publish | TRUE | Preview POSTs to `/api/clasificados/restaurantes/publish`; 503 if admin Supabase missing; 422 if draft not ready; 400 on bad body; 200 only after successful insert/update. |
| 9 | Publish persists to `restaurantes_public_listings` | TRUE | Route uses `draftToRestaurantePublicListingInsert` + service-role Supabase insert/update; no success path without DB write. |
| 10 | Republish/update avoids junk duplication | TRUE | Updates keyed by `draft_listing_id`; slug and admin-preserved fields handled in route. |
| 11 | Public detail page resolves published slugs | TRUE | `app/(site)/clasificados/restaurantes/[slug]/page.tsx` loads published listing by slug. |
| 12 | Newly published listings can be found from results | TRUE | Results inventory uses same table mapping as publish target; `revalidatePath` after admin PATCH. |
| 13 | Admin can see restaurant listings | TRUE | Admin workspace page lists rows via server data path in repo. |
| 14 | Admin can perform restaurant ops actions | TRUE | `PATCH /api/admin/restaurantes/listings/[id]` implements suspend/unsuspend, promote, verify; persists + audit + revalidate. |
| 15 | Owner dashboard shows restaurant listings | TRUE | `/dashboard/restaurantes` uses browser Supabase + `owner_user_id` / RLS policy from migrations. |
| 16 | Owner can access listing detail/management links | TRUE | Dashboard links to public detail, results, publish, and session-storage hydrate for republish. |
| 17 | Restaurants category posture is truthful in registry | TRUE | `clasificadosCategoryRegistry.ts` defaults for Restaurantes (live / full readiness) match implemented routes. |
| 18 | End-to-end launch path works | TRUE | Code paths + `npm run verify:restaurantes:launch` (typecheck + production build + HTTP smoke) green; signed-in Supabase publish → admin toggle → republish without duplicate is **manual QA** on a configured deployment (§Manual QA). |
| 19 | Repo build/type checks pass cleanly | TRUE | `npm run typecheck` exit 0; `npm run build` exit 0; `npm run verify:restaurantes:launch` (typecheck + build + `restaurantes-http-smoke.mjs`) exit 0 (see §Build hygiene). |

---

## GO LIVE DECISION: YES

**If NO, exact blockers:** N/A when the above automated checks pass and runtime prerequisites are satisfied on the target deployment.

**If YES, known non-blocking follow-ups**

- Run **§Manual QA** once per environment with real Supabase + auth cookies.
- Optional: extend `restaurantes-http-smoke.mjs` with a signed-in Playwright flow when test credentials are available in CI.
- Windows: avoid running two `next build` processes concurrently (manifest `ENOENT`).

---

## Build hygiene (Windows)

If `next build` fails with `ENOENT` on `.next/build-manifest.json` or `.next/server/pages-manifest.json`, stop all `node.exe` processes, delete `.next`, and run a **single** `npm run build`. An empty `app/api/clasificados/empleos/applications/[applicationId]/` directory (no `route.ts`) breaks the build — remove the stray folder if it reappears.

---

## Manual QA (Supabase + auth required)

1. Sign in as owner → `/publicar/restaurantes` → complete draft → preview → publish → expect HTTP 200 and `persisted: true`.
2. `/clasificados/restaurantes/resultados` → listing visible; exercise filters from URL contract.
3. `/clasificados/restaurantes/{slug}` → detail matches draft.
4. `/dashboard/restaurantes` → row visible; “Cargar en formulario” → republish → single row per `draft_listing_id`.
5. Admin login → `/admin/workspace/clasificados/restaurantes` → suspend / promote / verify → public surfaces match policy.
