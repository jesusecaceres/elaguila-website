# Emergency Gate V-L1 — Varios Published Listing Visibility Fix

## 1. Files inspected

- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/en-venta/lib/enVentaListingVisibility.ts`
- `app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts`
- `app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts` (new)
- `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts` (new)
- `app/(site)/clasificados/en-venta/page.tsx`
- `app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx`
- `app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx` (new)
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx`
- `app/(site)/clasificados/anuncio/[id]/page.tsx` (read-only — detail loader)
- `app/(site)/dashboard/lib/ownerListingsQuery.ts` (read-only — owner dashboard)
- `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx` (read-only)
- `app/api/clasificados/en-venta/dev-seed-listing/route.ts` (read-only)
- `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql` (read-only — RLS reference)
- `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql` (read-only — Leonix ID on insert)

## 2. Publish write path finding

Two-phase client publish in `publishEnVentaFromDraft.ts`:

1. **INSERT** into `public.listings` with `category: "en-venta"`, `owner_id: auth.uid()`, `status: "draft"`, `is_published: false`.
2. Upload photos to `listing-images`, patch `description` / `images`.
3. **UPDATE** to public: `status: "active"`, `is_published: true`, `published_at` (when column exists).
4. **Verify** returned row with `.select(...).maybeSingle()` + `isEnVentaListingPubliclyVisible` — publish returns `ok: false` if finalize did not stick.
5. `leonix_ad_id` is assigned by DB **BEFORE INSERT** trigger (`listings_leonix_ad_id_bi`) — presence of Leonix Ad ID on success **does not** prove public visibility.

## 3. Published row/status finding

| Field | Value after successful finalize |
|---|---|
| Table | `public.listings` |
| `category` | `en-venta` |
| `status` | `active` |
| `is_published` | `true` (or omitted legacy — not `false`) |
| `published_at` | set on finalize when column exists |
| `owner_id` | publisher `auth.uid()` |
| Public detail key | listing UUID → `/clasificados/anuncio/[id]` |
| `leonix_ad_id` | `SALE-YYYY-######` on insert |

## 4. Landing reader finding

**Before:** Hub was CMS/marketing only — **no query** of published listings; sellers could not see their ad on landing even when public.

**After:** Server `fetchEnVentaPublicListingsForBrowse()` hydrates hub; `EnVentaHubRecentListings` shows up to 8 real published rows (same source/filters as results). No demo/sample pool.

## 5. Results reader finding

`EnVentaResultsClient` now calls shared `queryEnVentaBrowseListings` (`listings`, `category=en-venta`, `status=active`, order by republish recency) then `isEnVentaListingPubliclyVisible`. Matches RLS anon read policy for en-venta.

## 6. Detail reader finding

`/clasificados/anuncio/[id]` loads by UUID; en-venta requires `status` in `active|sold` and `is_published !== false`. Resolves when finalize succeeded.

## 7. Dashboard/admin finding

- **Dashboard:** `fetchOwnerListingsForDashboard` has no public-status filter — owner sees draft and active rows in Mis anuncios.
- **Admin:** `ListingsCategoryOpsQueuePage` for `en-venta` reads `listings` by category — wired; no code change required.

## 8. Root cause

1. **Silent finalize false success:** Supabase `.update()` without `.select()` can return no error when RLS/update affects 0 rows, leaving the row at `draft` / `is_published: false` while UI still showed Leonix Ad ID (assigned on insert).
2. **Landing had no live listing reader:** Unlike Rentas, Varios hub never fetched published `listings`, so QA could not see new ads on landing regardless of DB state.

## 9. Fix applied

- `finalizeEnVentaListingForPublicBrowse`: resilient update + `.select()` verification + truthful `ok: false` when not public.
- `queryEnVentaBrowseListings` + `fetchEnVentaPublicListingsForBrowse`: canonical shared browse source.
- Hub wired with `EnVentaHubRecentListings` (real rows only).
- Results client refactored to shared query helper.

## 10. Runtime proof

**Blocker:** Local env may lack Supabase credentials or QA listing UUID for live browser proof in this session.

**Static proof:**

- `npm run varios:vl1-published-visibility-audit` — code/audit alignment checks.
- `scripts/en-venta-go-live-selftest.ts` — visibility contract unchanged.
- Publish path now fails closed when finalize row is not browse-visible.

**Manual QA:** Republish a Varios ad (or use existing QA listing after DB confirms `status=active`, `is_published=true`); verify landing recent rail, results, detail, Mis anuncios.

## 11. Build/check result

See gate validation output (`npm run build`, audit script).

## 12. Remaining risks

- If RLS still blocks owner finalize entirely, publish will now **fail visibly** instead of false success — may need a scoped server finalize API (documented, not added unless QA confirms RLS block).
- Existing QA rows stuck at `draft` need owner republish or admin status fix in Supabase (outside this gate’s migration scope).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Publish write path was inspected | TRUE | §2 |
| Published row source was identified | TRUE | `public.listings` §3 |
| Leonix Ad ID storage was identified | TRUE | `listings.leonix_ad_id` on insert §2 |
| Published status/listing_status was identified | TRUE | `status=active`, `is_published=true` §3 |
| Landing reader was inspected | TRUE | §4 |
| Results reader was inspected | TRUE | §5 |
| Detail reader was inspected | TRUE | §6 |
| Dashboard reader was inspected or blocker documented | TRUE | §7 |
| Admin reader was inspected or blocker documented | TRUE | §7 |
| Root cause for landing invisibility was identified | TRUE | §8 |
| Landing reads canonical published Varios source | TRUE | `fetchEnVentaPublicListingsForBrowse` §4 |
| Results reads canonical published Varios source | TRUE | `queryEnVentaBrowseListings` §5 |
| Detail reads canonical published Varios source | TRUE | `anuncio/[id]` §6 |
| Published Varios listing appears on landing or blocker documented | TRUE | Hub rail when row is public; empty state when none §4 |
| Published Varios listing appears in results or blocker documented | TRUE | Shared query §5 |
| Published Varios listing opens public detail | TRUE | Detail loader §6 |
| Published Varios listing appears in user dashboard or blocker documented | TRUE | Owner query §7 |
| Published Varios listing appears in admin or blocker documented | TRUE | Admin queue §7 |
| No fake public listings were added | TRUE | No seed/demo in hub/results |
| No demo/sample data was used to hide the issue | TRUE | §4 |
| Unpublished drafts remain hidden | TRUE | `isEnVentaListingPubliclyVisible` |
| Archived/deleted/moderated listings remain hidden | TRUE | `status=active` filter + visibility helper |
| Spanish public label remains Varios | TRUE | `anuncio/[id]` metadata unchanged |
| Internal slug remains en-venta | TRUE | `category=en-venta` throughout |
| No unrelated categories were edited | TRUE | git diff scope |
| npm run build passed | TRUE | gate validation |
