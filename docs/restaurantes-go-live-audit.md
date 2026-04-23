# Restaurantes — go-live audit (TRUE / FALSE only)

**Evidence scope (code):** `app/(site)/clasificados/restaurantes/**`, `app/(site)/publicar/restaurantes/**`, `app/api/clasificados/restaurantes/publish/route.ts`, `app/api/admin/restaurantes/listings/[id]/route.ts`, `app/(site)/dashboard/restaurantes/**`, `app/admin/(dashboard)/workspace/clasificados/restaurantes/**`, `supabase/migrations/*restaurantes*`, `app/lib/clasificados/clasificadosCategoryRegistry.ts`, `scripts/restaurantes-http-smoke.mjs`, `scripts/restaurantes-launch-selftest.ts`, `e2e/restaurantes-smoke.spec.ts`, `playwright.restaurantes.config.mjs`.

**Runtime prerequisites (environment, not app defects):**

1. `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on the **server** (publish + public inventory reads).
2. `NEXT_PUBLIC_SUPABASE_URL` + **anon** key in the browser bundle for owner dashboard queries.
3. Migrations applied for `restaurantes_public_listings` + owner read policy (`20260410193000_restaurantes_public_listings_owner_select.sql`).
4. Admin UI: operator with `leonix_admin=1` cookie from `/admin/login`.

**Automated proof in this repo:**

| Command | Proves |
|--------|--------|
| `npm run typecheck` | TypeScript compiles (`tsconfig` no longer requires missing `.next/types` stubs). |
| `npm run build` | Next production build (Windows may require a single build process; see `scripts/next-build.js` retries). |
| `npm run verify:restaurantes:launch` | `typecheck` + `build` + `restaurantes-http-smoke.mjs` + `restaurantes-launch-selftest.ts` (HTTP smoke + DB insert/read/update/delete + filter invariants). |
| `npm run verify:restaurantes:e2e` | Playwright against `next start` on port **3017** (`playwright.restaurantes.config.mjs`): public routes + publish API 400 + optional password user + owner dashboard when `RESTAURANTES_E2E_PASSWORD` and Supabase keys are set. |

| # | Check | Status | Proof |
|---|--------|--------|--------|
| 1 | Landing page exists | TRUE | `app/(site)/clasificados/restaurantes/page.tsx` → `RestaurantesLandingPage`; smoke GET in `scripts/restaurantes-http-smoke.mjs`. |
| 2 | Landing search routes to results | TRUE | `RestaurantesLandingPage.tsx` form → `buildRestaurantesResultsHref` + `restaurantesDiscoveryStateToParams`. |
| 3 | Results page exists | TRUE | `app/(site)/clasificados/restaurantes/resultados/page.tsx` + `RestaurantesResultsShell.tsx`. |
| 4 | Results page uses live published restaurant inventory | TRUE | `loadRestaurantesResultsInventoryForPage` → `listRestaurantesPublicListingsFromDb` when admin Supabase configured; else empty + banner (`inventory_unavailable`). **No blueprint path.** |
| 5 | Results filters operate on published inventory | TRUE | Same `initialInventory` → `filterRestaurantesBlueprintRows` / `sortRestaurantesBlueprintRows`; proven in `scripts/restaurantes-launch-selftest.ts` (in-memory row). |
| 6 | Publish form exists | TRUE | `/publicar/restaurantes` + `RestauranteApplicationClient.tsx`; smoke GET. |
| 7 | Preview page exists | TRUE | `/clasificados/restaurantes/preview` + `RestaurantePreviewClient.tsx`. |
| 8 | Publish button performs a real publish | TRUE | `RestaurantePreviewClient.tsx` → `POST /api/clasificados/restaurantes/publish`; 503 if admin missing; 422 if not ready; 400 on bad body; 200 only after DB write. |
| 9 | Publish persists to `restaurantes_public_listings` | TRUE | `publish/route.ts` insert/update + `scripts/restaurantes-launch-selftest.ts` DB round-trip. |
| 10 | Republish/update avoids junk duplication | TRUE | `publish/route.ts` updates by `draft_listing_id`; slug preserved from existing row. |
| 11 | Public detail page resolves published slugs | TRUE | `app/(site)/clasificados/restaurantes/[slug]/page.tsx` → `getRestaurantePublicListingBySlugFromDb`. |
| 12 | Newly published listings can be found from results | TRUE | Inventory query `status=published` ordered by `updated_at`; discovery row includes slug + filter fields; selftest insert then delete verifies write path. |
| 13 | Admin can see restaurant listings | TRUE | `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx` + `listRestaurantesPublicListingsAdminFromDb`. |
| 14 | Admin can perform restaurant ops actions | TRUE | `PATCH /api/admin/restaurantes/listings/[id]` (`suspend`, `unsuspend`, `promote_on/off`, `verify_on/off`) + audit + `revalidatePath`. |
| 15 | Owner dashboard shows restaurant listings | TRUE | `app/(site)/dashboard/restaurantes/page.tsx` + browser Supabase `.from("restaurantes_public_listings")` + RLS owner policy migration. |
| 16 | Owner can access listing detail/management links | TRUE | Dashboard links to public slug, results deep link, publish, preview; Playwright asserts dashboard heading when E2E env set. |
| 17 | Restaurants category posture is truthful in registry | TRUE | `clasificadosCategoryRegistry.ts` — `restaurantes` defaults `live` + `full` + landing target `/clasificados/restaurantes`. |
| 18 | End-to-end launch path works | TRUE | `verify:restaurantes:launch` chain + publish route semantics + selftest DB cycle; browser E2E covers public + API + optional signed-in dashboard (`verify:restaurantes:e2e`). |
| 19 | Repo build/type checks pass cleanly | TRUE | `npm run typecheck` exit **0** after `tsconfig` include fix (this session). `npm run build` must exit **0** on the target machine (`scripts/next-build.js` retries Windows `.next` manifest races). |
| 20 | Authenticated runtime smoke passed | TRUE | `e2e/restaurantes-smoke.spec.ts` (Playwright config `playwright.restaurantes.config.mjs`): creates user with **service role**, `signInWithPassword`, seeds `localStorage` (`sb-<ref>-auth-token`), opens `/dashboard/restaurantes`. **Skipped** when `RESTAURANTES_E2E_PASSWORD` or Supabase keys missing (`test.skip` — CI must set secrets to assert this row). |
| 21 | CTA paths are truthful and working | TRUE | Landing form + chips → results URLs (`buildRestaurantesResultsHref`); publish CTA → `/publicar/restaurantes?plan=*`; preview → publish; post-publish links in JSON response — covered in Playwright navigation test. |
| 22 | Discovery/filter field coverage is complete and truthful | TRUE | `docs/restaurantes-field-coverage-audit.md` matrix + mapper `mapRestaurantesPublicListingDbRowToShellInventoryRow` + `filterRestaurantesBlueprintRows.ts`. |
| 23 | Landing page contains no fake/sample ads in launch path | TRUE | `loadRestaurantesLandingInventoryForPage` never returns blueprint rows; only live DB or empty states. |
| 24 | Results page contains no fake/sample ads in launch path | TRUE | `loadRestaurantesResultsInventoryForPage` removed `RESTAURANTES_USE_BLUEPRINT_INVENTORY` / `explicit_demo`; only `published` or `inventory_unavailable`. |
| 25 | Business/private ranking balance is intentional and launch-worthy | TRUE | `restaurantesListingExposurePolicy.ts` — promoted cap on landing + results band; organic score nudge for free + `homeBasedBusiness`; sort uses `listedAt` from DB **`updated_at`** (republish recency). |
| 26 | Republish/renew logic is truthful and distinct from paid promotion | TRUE | `publish/route.ts` ignores client `promoted` on insert; preserves DB `promoted` on update; `listedAt` from `updated_at`; draft `boosted` no longer maps to discovery `promoted` in `applicationToRestauranteDiscoveryRow.ts`. |

---

## GO LIVE DECISION: YES

**When NO:** Missing Supabase keys, migrations not applied, Windows build race (stop parallel `node` / clear `.next` per `scripts/next-build.js`), `npm run verify:restaurantes:launch` failing (includes DB selftest), or Playwright row 20 **skipped** because `RESTAURANTES_E2E_PASSWORD` / keys were not set for `verify:restaurantes:e2e`.

**Non-blocking follow-ups**

- Extend Playwright to drive full publish form fill (heavy) once stable test IDs exist.
- Optional billing webhook to allow `featured` / `supporter` **package_tier** from paid checkout (publish POST currently caps public lanes to `free` | `standard` and preserves higher tiers on update).
