# Restaurantes publish lane — truth audit (dev / QA)

Honest checklist for what works in this repo with **Supabase service role + URL** configured on the server, **RLS migration applied** for owner reads, and a **signed-in user** at publish time (so `owner_user_id` is set).

| # | Check | Status | Reason |
|---|--------|--------|--------|
| 1 | Landing page exists | **TRUE** | `/clasificados/restaurantes` renders `RestaurantesLandingPage`. |
| 2 | Landing search routes to results | **TRUE** | Form `router.push` uses `buildRestaurantesResultsHref` + discovery state. |
| 3 | Results page exists | **TRUE** | `/clasificados/restaurantes/resultados` renders `RestaurantesResultsShell`. |
| 4 | Results page uses live published restaurant inventory | **PARTIAL** | **TRUE** when `SUPABASE_SERVICE_ROLE_KEY` (and URL) are set: server loads `restaurantes_public_listings` → mapper → shell rows. **FALSE** when admin Supabase is missing: explicit **demo_fallback** uses blueprint rows + banner (no fake “live” copy). |
| 5 | Results filters operate on published inventory | **PARTIAL** | Same as row 4: filters apply to whatever inventory the server passed in (published rows or demo fallback). |
| 6 | Publish form exists | **TRUE** | `/publicar/restaurantes` + `RestauranteApplicationClient`. |
| 7 | Preview page exists | **TRUE** | `/clasificados/restaurantes/preview` + `RestaurantePreviewClient`. |
| 8 | Publish button performs a real publish | **PARTIAL** | **TRUE** when server admin client can write; API returns `persisted: true/false` honestly. **FALSE** path: no service role → no DB write (`persisted: false`, UI explains). |
| 9 | Publish persists to `restaurantes_public_listings` | **PARTIAL** | **TRUE** only with working service-role insert/update. |
| 10 | Republish/update avoids junk duplication | **TRUE** | API updates by `draft_listing_id` when a row already exists; slug kept stable. |
| 11 | Public detail page resolves published slugs | **TRUE** | `/clasificados/restaurantes/[slug]` loads published row by slug + `listing_json`. |
| 12 | Newly published listings can be found from results | **TRUE** | When inventory is live, new rows appear after refresh/navigation; preview links include `resultsUrl` with `rx_pub=1` flash. |
| 13 | Admin can see restaurant listings | **TRUE** | `/admin/workspace/clasificados/restaurantes` lists rows via service role (read-only table). |
| 14 | Admin can perform restaurant ops actions | **FALSE** | Table is **read-only**; copy states no fake write UI (suspend/promote would be a follow-up). |
| 15 | Owner dashboard shows restaurant listings | **PARTIAL** | **TRUE** when user is signed in at publish (`owner_user_id`), migration `restaurantes_public_listings_select_owner` is applied, and browser uses user JWT. **FALSE** if publish was anonymous (owner null) or RLS not migrated. |
| 16 | Owner can access their listing detail/management links | **PARTIAL** | Dashboard links: public detail, results search, publish form; **no** server “load listing_json back into draft” (draft remains localStorage — documented in UI). |
| 17 | Restaurants category posture is truthful in registry | **TRUE** | Default `operationalStatus: staged`, `readiness: partial`, `landingTarget: /clasificados/restaurantes`, notes describe real scope. |
| 18 | End-to-end dev test path works | **PARTIAL** | Full path works when env + migration + signed-in publish align; otherwise explicit fallbacks/banners explain gaps. |

## What remains before public launch

- Marketing / ops decision to move registry from **staged** to **live** and readiness to **full**.
- Admin **write** actions (suspend, promote) with authz audit, if desired in UI instead of SQL.
- Optional: hydrate publish form from `listing_json` for owners who lost local draft (needs careful UX + conflict rules).
- Harden publish API feedback when `update` matches zero rows (edge cases outside `draft_listing_id` contract).

## What is safe to test now

1. Configure `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` locally; apply Supabase migrations (including owner `SELECT` policy).
2. Sign in, open `/publicar/restaurantes`, fill draft, open preview, publish.
3. Confirm `persisted: true` in network JSON; open public URL + results link from preview.
4. Open `/clasificados/restaurantes/resultados` and confirm listing appears (filters optional).
5. Open `/admin/workspace/clasificados/restaurantes` and confirm row in admin table.
6. Open `/dashboard/restaurantes` as the same user and confirm owner table + links.
