# Gate FOOD-L9B — Comida Local Production Table Visibility + Results Recovery

## 1. Gate title

Gate FOOD-L9B — Comida Local Production Table Visibility + Results Recovery

## 2. Gate type

BUILD-REQUIRED

## 3. Production error observed

Production `/clasificados/comida-local` returned a PostgREST schema-cache failure:

> Could not find the table 'public.comida_local_public_listings' in the schema cache

Prior to this gate, the raw message was passed through `bannerNote` and shown to customers on the results page.

## 4. Files inspected

- `supabase/migrations/20260604120000_comida_local_public_listings.sql`
- `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicTypes.ts`
- `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts`
- `app/api/clasificados/comida-local/publish/route.ts`
- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/[slug]/page.tsx`
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md`
- `package.json`, `AGENTS.md` (deployment/migration workflow)
- `scripts/comida-local-food-l5b-publish-db-audit.ts` (prior gate pattern)

## 5. Files changed

- `app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts` (new)
- `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicTypes.ts`
- `app/(site)/clasificados/comida-local/page.tsx`
- `scripts/comida-local-food-l9b-production-table-audit.ts` (new)
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md` (new)
- `package.json` — `comida-local:food-l9b-production-table-audit` script only

No migration file was added or changed (table already defined in FOOD-L5B).

## 6. Migration verification result

| Item | Result |
|------|--------|
| Migration filename | `supabase/migrations/20260604120000_comida_local_public_listings.sql` |
| Table created | `public.comida_local_public_listings` |
| Schema | `public` |
| RLS enabled | Yes (`alter table ... enable row level security`) |
| Public read policy | Yes — `comida_local_public_listings_select_public` with `using (status = 'published')` |
| Owner read policy | Yes — `comida_local_public_listings_select_owner` for authenticated owners |
| Leonix ID trigger | Yes — `comida_local_leonix_ad_id_bi` |
| Mirrors other listing tables | Same pattern as FOOD-L5B / Restaurantes-style dedicated table + RLS select policies |

**Conclusion:** Repo migration is correct and complete. Production error indicates the migration has **not been applied** to production Supabase (schema cache missing table).

## 7. Table name consistency result

All Comida Local DB reads/writes use `comida_local_public_listings`:

| Module | Table reference |
|--------|-----------------|
| `comidaLocalPublicQueries.ts` | `.from("comida_local_public_listings")` |
| `comidaLocalDashboardQueries.ts` | `.from("comida_local_public_listings")` |
| `comidaLocalAdminQueries.ts` | `.from("comida_local_public_listings")` |
| `publish/route.ts` | `.from("comida_local_public_listings")` (insert/update/select) |
| `comidaLocalAnalytics.ts` | `COMIDA_LOCAL_ANALYTICS_SOURCE_TABLE = "comida_local_public_listings"` |

No mismatches found (`comida_local_listings`, views, or alternate RPC names).

## 8. Public query result

- `listPublishedComidaLocalListings` queries `comida_local_public_listings` with `status = 'published'`.
- On failure, errors are classified via `classifyComidaLocalInventoryError` and mapped to customer-safe copy.
- `source: inventory_table_missing` when schema-cache / missing-relation errors are detected.
- Technical errors logged server-side via `logComidaLocalInventoryFailure` (`console.error`).
- Legitimate zero rows return `source: published` with empty `rows` (not masked as DB failure).

## 9. Publish API table result

`POST /api/clasificados/comida-local/publish` reads/writes `comida_local_public_listings` only. Publish will fail in production until the migration is applied (expected; not bypassed with fake data).

## 10. Dashboard/admin table result

- `comidaLocalDashboardQueries.ts` — `comida_local_public_listings`
- `comidaLocalAdminQueries.ts` — `comida_local_public_listings`

Consistent with public queries and migration.

## 11. Production schema cache / deployment finding

| Question | Finding |
|----------|---------|
| Repo has Supabase migrations? | Yes — `supabase/migrations/*.sql` |
| `package.json` auto-migrate on deploy? | **No** — no `supabase db push` / migrate script in npm scripts |
| Vercel deploy applies migrations? | **No** — Vercel builds Next.js only; Supabase schema is separate |
| Root cause | Production Supabase project lacks `public.comida_local_public_listings` because `20260604120000_comida_local_public_listings.sql` was not applied |
| Required manual action | Apply migration to **production** Supabase |

### Production Supabase action required

1. Open Supabase Dashboard → SQL Editor (production project), **or** run CLI against production:
   ```bash
   supabase link --project-ref <PRODUCTION_PROJECT_REF>
   supabase db push
   ```
   Alternatively paste/run the contents of `supabase/migrations/20260604120000_comida_local_public_listings.sql`.

2. Verify after apply:
   - Table exists: `select count(*) from public.comida_local_public_listings;`
   - RLS policies present for `comida_local_public_listings`
   - `/clasificados/comida-local` loads without `inventory_table_missing` banner
   - Publish smoke (staging/prod) can insert a real listing (no seed rows required for gate)

3. If PostgREST schema cache is stale after apply, reload schema in Supabase dashboard or wait for automatic refresh.

## 12. Customer-facing error handling result

| Scenario | Customer copy | Distinct from empty? |
|----------|---------------|----------------------|
| Table missing / schema cache | "Resultados temporalmente no disponibles." | Yes — amber banner + blocked panel |
| Supabase unconfigured / other query failure | "Resultados temporalmente no disponibles." | Yes |
| Published query, zero rows, no filters | "Aún no hay publicaciones de Comida Local." | Yes — CTA to publish |
| Published query, zero rows, active filters | "No hay fichas publicadas con estos filtros." | Yes |

Raw PostgREST strings (e.g. "schema cache", "Could not find the table") are **not** rendered on the results page.

## 13. What was fixed

- Added `comidaLocalPublicInventoryErrors.ts` for error classification and safe Spanish copy.
- Updated `comidaLocalPublicQueries.ts` to stop passing `fetched.error` into `bannerNote`.
- Extended `ComidaLocalPublicListingsQuerySource` with `inventory_table_missing`.
- Updated results `page.tsx` to distinguish empty inventory vs DB/table failure vs filter-empty.
- Added FOOD-L9B audit script and documentation.

## 14. What still requires production Supabase action

**Apply** `supabase/migrations/20260604120000_comida_local_public_listings.sql` to the production Supabase project. Until then, results will show "Resultados temporalmente no disponibles." and publish will fail at insert time — by design, not masked.

## 15. Manual verification checklist

- [ ] Apply `20260604120000_comida_local_public_listings.sql` on production Supabase
- [ ] Confirm table `public.comida_local_public_listings` in Table Editor
- [ ] Confirm RLS policies `comida_local_public_listings_select_public` and `_select_owner`
- [ ] Load `/clasificados/comida-local` — no amber schema-error banner
- [ ] With zero published rows, see "Aún no hay publicaciones de Comida Local." (not unavailable message)
- [ ] Publish a real Comida Local listing end-to-end (optional smoke)
- [ ] Confirm raw schema-cache text never appears in page HTML

## 16. Risks / deferred work

- **FOOD-L7A regression** (user dashboard not wired in `mis-anuncios`) — out of L9B scope; see FOOD-L9A audit.
- Detail page `[slug]` returns `notFound()` on DB errors (acceptable; does not leak raw errors).
- Stripe checkout (FOOD-L5E) still deferred.
- No production live DB smoke in CI (static audit only).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Repo state was inspected before edits | TRUE | `git status --short` at gate start; only Comida Local scoped files changed |
| Production error was documented | TRUE | Section 3; schema-cache message quoted |
| Migration for comida_local_public_listings exists | TRUE | `20260604120000_comida_local_public_listings.sql` |
| Migration creates the expected table name | TRUE | `create table if not exists public.comida_local_public_listings` |
| Results query uses comida_local_public_listings | TRUE | `comidaLocalPublicQueries.ts` `.from("comida_local_public_listings")` |
| Publish API uses comida_local_public_listings | TRUE | `publish/route.ts` |
| Dashboard/admin helpers use the same table name if present | TRUE | dashboard + admin query modules |
| No hardcoded demo listings were added | TRUE | Results page uses `listPublishedComidaLocalListings` only |
| No fake listings were added | TRUE | No seed migration; no fallback arrays |
| Raw schema-cache error is not shown directly to customers | TRUE | `comidaLocalPublicInventoryErrors.ts` + page copy audit |
| Empty state is distinct from DB/table error state | TRUE | `published` vs `inventory_table_missing` branches on page |
| Production migration blocker is documented if applicable | TRUE | Section 11 + 14 |
| No Restaurante files were edited | TRUE | `git diff --name-only` — no restaurantes paths |
| No unrelated category files were edited | TRUE | Diff limited to comida-local + package.json + L9B script |
| Audit script passed | TRUE | `npm run comida-local:food-l9b-production-table-audit` |
| npm run build passed | TRUE | `npm run build` (gate validation) |
