# Gate FOOD-QA1 — Comida Local Production Data Availability + Live QA Lock

## 1. Gate title

Gate FOOD-QA1 — Comida Local Production Data Availability + Live QA Lock

## 2. Production QA screenshots summary

Live production QA (pre-gate) observed:

| Route | Observation |
|-------|-------------|
| `/clasificados/comida-local` | Loads; shows customer-safe **“Resultados temporalmente no disponibles.”** — not raw Supabase error |
| Results cards | None — query path failing (DB unavailable), not true empty |
| True empty copy | **“Aún no hay publicaciones de Comida Local.”** not shown (correct: query did not succeed) |
| `/clasificados/comida-local/[slug]` | Unknown/real slug returns 404 when no published row readable |
| `/publicar/comida-local` | Loads |
| `/clasificados/comida-local/preview` | Loads; empty draft state |
| `/dashboard/mis-anuncios` | Loads; Comida Local category card count **0** (no owner rows or owner query empty) |

**Root cause class:** Production Supabase likely missing `public.comida_local_public_listings` (migration `20260604120000` not applied per FOOD-L9B). Code correctly maps that failure to unavailable — not to empty.

## 3. Files inspected

- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/[slug]/page.tsx`
- `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicTypes.ts`
- `app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts`
- `app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx`
- `app/lib/supabase/server.ts`
- `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts`
- `app/(site)/dashboard/mis-anuncios/page.tsx` (read-only — dashboard count meaning)
- `app/api/clasificados/comida-local/publish/route.ts` (read-only — table parity)
- `supabase/migrations/20260604120000_comida_local_public_listings.sql`
- `COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md`

## 4. Files changed

- `app/lib/supabase/server.ts` — `isSupabasePublicReadConfigured`, `getServerSupabaseAnon`
- `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts` — prefer anon+RLS public reads; admin fallback
- `app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts` — optional extra log context
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_QA1_PRODUCTION_DATA_AUDIT.md` (this file)
- `scripts/comida-local-food-qa1-production-data-audit.ts` (new)
- `package.json` — `comida-local:food-qa1-production-data-audit` script only

No migration edits. No public UI redesign. No dashboard edits.

## 5. Results route diagnosis

| Item | Finding |
|------|---------|
| Table | `comida_local_public_listings` |
| Status filter | `.eq("status", "published")` |
| Payment/package filter on results | None (all published rows) |
| Client used (post-gate) | **Anon + RLS first** (`comida_local_public_listings_select_public`); service role fallback |
| Error → unavailable | `classifyComidaLocalInventoryError` → `inventory_table_missing` / `inventory_unavailable` / `inventory_query_failed` |
| Zero rows → empty | `source: "published"` with `rows: []` — never masked as DB failure |
| Page wiring | `inventoryBlocked` vs `source === "published"` separates A/B/C |

Production unavailable banner = **Case A** (query/DB failure), consistent with missing table in production schema cache.

## 6. Migration/RLS diagnosis

| Item | Value |
|------|-------|
| Migration | `supabase/migrations/20260604120000_comida_local_public_listings.sql` |
| Table | `public.comida_local_public_listings` |
| RLS | Enabled |
| Public read | `comida_local_public_listings_select_public` — `using (status = 'published')` |
| Owner read | `comida_local_public_listings_select_owner` — authenticated, `owner_user_id = auth.uid()` |
| Insert | No client insert policy — publish API uses service role |
| Indexes | slug, leonix_ad_id, status, owner, city, food_type, published_at |

**Production manual action required:** Apply migration to production Supabase (SQL Editor or `supabase db push`). Vercel deploy does not apply migrations.

## 7. Query state handling result

**PASS (code)** — Three states implemented:

- **A — DB/query unavailable:** `inventoryBlocked` + banner “Resultados temporalmente no disponibles.”
- **B — Success, zero rows:** `source: "published"`, count 0, panel with “Aún no hay publicaciones de Comida Local.”
- **C — Success, rows:** Real cards via `mapComidaLocalRowToCardVm` only

**Enhancement:** Public reads no longer require `SUPABASE_SERVICE_ROLE_KEY` when anon key + RLS policy exist (typical Vercel setup).

## 8. Empty-state result

When query succeeds with zero published rows and no active filters, results page shows:

- Summary line: `COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES`
- Panel: “Aún no hay publicaciones de Comida Local.” + publish CTA

## 9. Unavailable-state result

On classified failures, page shows amber banner + panel with customer-safe copy only. Technical PostgREST/schema-cache messages logged server-side via `logComidaLocalInventoryFailure`.

## 10. Real-card rendering result

Cards render only when `count > 0` from DB rows. No placeholder/demo arrays. Detail href: `/clasificados/comida-local/[slug]`.

## 11. Detail route result

- `getPublishedComidaLocalListingBySlug` uses same anon/admin read client
- Published row → `ComidaLocalPublicDetailClient` with real VM
- Missing/unpublished slug → `notFound()`
- Optional empty sections hide via existing detail mapper (no fake contact/social)

## 12. Dashboard count result

Mis Anuncios Comida Local count = `fetchOwnerComidaLocalListings(supabase, u.id)` row length. Count **0** means:

- No rows with `owner_user_id` matching logged-in user, **or**
- RLS/query error returns `[]` silently in dashboard helper (pre-existing pattern)

Dashboard count **0** does not prove public results empty — public and owner scopes differ.

## 13. Manual Supabase/Vercel action needed

1. **Apply migration** `20260604120000_comida_local_public_listings.sql` to **production** Supabase.
2. Verify env on Vercel production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required for public reads post-QA1)
   - `SUPABASE_SERVICE_ROLE_KEY` (publish API + admin)
3. After migration: reload PostgREST schema if stale.
4. Smoke publish one real listing → results should show **Case C** or **Case B** (not unavailable).

## 14. What was intentionally not implemented

- Brand/visual polish (FOOD-P3+)
- Seed/fake listings
- Stripe checkout
- Admin redesign
- Dashboard redesign
- Global nav / categoryConfig
- Migration file changes (manual apply only)

## 15. Desktop QA result

Code-ready: unavailable / empty / cards branches wired. Live desktop will show **Case B** after migration with zero rows, or **Case C** with published data.

## 16. Mobile QA result

Same state machine as desktop; responsive layout unchanged.

## 17. Risks/deferred work

- Until production migration runs, live site stays **Case A** (correct, not a code bug).
- Listings with `owner_user_id = null` won’t appear in Mis Anuncios.
- Detail route returns 404 on DB unconfigured (acceptable; no customer raw error).

## 18. Manual QA checklist for Chuy

- [ ] Apply `20260604120000_comida_local_public_listings.sql` on production Supabase
- [ ] Confirm Vercel prod has `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Visit `/clasificados/comida-local` — expect empty state OR cards (not unavailable)
- [ ] Publish test listing via `/publicar/comida-local` — card appears on results
- [ ] **Ver ficha** opens `/clasificados/comida-local/[slug]`
- [ ] Unknown slug → 404
- [ ] Logged-in owner sees listing in Mis Anuncios (count ≥ 1)
- [ ] No raw Supabase errors on customer pages

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| -------------------------------------------------------- | ---------- | -------- |
| Production screenshots were reviewed | TRUE | Gate brief + FOOD-L9B prior audit |
| Results route was inspected | TRUE | `page.tsx` |
| Results query helper was inspected | TRUE | `comidaLocalPublicQueries.ts` |
| Migration for comida_local_public_listings was inspected | TRUE | `20260604120000_*.sql` |
| RLS/public read behavior was inspected | TRUE | `select_public` policy |
| Results route uses comida_local_public_listings | TRUE | `.from("comida_local_public_listings")` |
| Publish table and results table match | TRUE | publish route + queries |
| Query errors show customer-safe unavailable state | TRUE | `inventoryBlocked` + banner |
| Query success with zero rows shows true empty state | TRUE | `source === "published"` + empty panel |
| Query success with rows shows real cards only | TRUE | `cards.map` from DB rows |
| No fake listings were added | TRUE | No seed/demo arrays |
| No seed data was added | TRUE | No migration/data inserts |
| No raw Supabase errors render to customers | TRUE | `customerMessageForComidaLocalInventoryFailure` |
| Unknown slug returns not found | TRUE | `notFound()` in `[slug]/page.tsx` |
| Real slug route is ready to render published row data | TRUE | `getPublishedComidaLocalListingBySlug` |
| Detail page uses real row data only | TRUE | `mapComidaLocalRowToDetailVm` |
| Empty optional detail sections hide | TRUE | Existing detail VM mapper |
| Dashboard Comida Local count meaning was checked | TRUE | Owner-scoped fetch |
| No Stripe/payment files were edited | TRUE | git diff |
| No admin redesign was done | TRUE | git diff |
| No dashboard redesign was done | TRUE | git diff |
| No unrelated categories were edited | TRUE | git diff |
| No brand/visual polish was started | TRUE | No style token changes |
| Audit script passed | TRUE | gate validation |
| npm run build passed | TRUE | gate validation |
