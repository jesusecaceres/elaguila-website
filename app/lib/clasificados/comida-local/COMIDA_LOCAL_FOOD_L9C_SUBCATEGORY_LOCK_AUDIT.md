# Gate FOOD-L9C — Comida Local Subcategory Launch Lock + Customer Preview Readiness

## 1. Gate title

Gate FOOD-L9C — Comida Local Subcategory Launch Lock + Customer Preview Readiness

## 2. Gate type

BUILD-REQUIRED

## 3. Production blocker observed

On leonixmedia.com `/clasificados/comida-local`:

> Could not find the table 'public.comida_local_public_listings' in the schema cache

**Diagnosis (carried from FOOD-L9B):** Repo migration and code are correct; production Supabase has not applied `20260604120000_comida_local_public_listings.sql`. Customer-facing raw errors are masked in code; ops must apply migration for live inventory.

## 4. Files inspected

- `supabase/migrations/20260604120000_comida_local_public_listings.sql`
- `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors.ts`
- `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts`
- `app/lib/clasificados/comida-local/comidaLocalLeonixAdId.ts`
- `app/lib/clasificados/comida-local/comidaLocalSlug.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublishClient.ts`
- `app/api/clasificados/comida-local/publish/route.ts`
- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/[slug]/page.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx`
- `app/(site)/clasificados/comida-local/components/ComidaLocalDetailShell.tsx`
- `app/(site)/clasificados/comida-local/preview/page.tsx`
- `app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx`
- `app/(site)/publicar/comida-local/ComidaLocalValidationPanel.tsx`
- `app/lib/clasificados/comida-local/mapComidaLocalPublicListing.ts`
- `COMIDA_LOCAL_FOOD_L9B_PRODUCTION_TABLE_AUDIT.md` (prior gate)

## 5. Files changed

- `app/lib/clasificados/comida-local/comidaLocalPublishClient.ts` (new)
- `app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx` — wire publish CTA to API
- `app/(site)/publicar/comida-local/ComidaLocalValidationPanel.tsx` — remove stale “not active” copy
- `app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts` — launch-ready shell copy
- `scripts/comida-local-food-l9c-subcategory-lock-audit.ts` (new)
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L9C_SUBCATEGORY_LOCK_AUDIT.md` (new)
- `package.json` — `comida-local:food-l9c-subcategory-lock-audit` script only

No migration changes (table already defined). No admin UI changes.

## 6. Table/migration/query consistency result

| Layer | Table / object |
|-------|----------------|
| Migration | `public.comida_local_public_listings` in `20260604120000_comida_local_public_listings.sql` |
| Public results query | `.from("comida_local_public_listings")` + `status = published` |
| Publish API | insert/update/select on `comida_local_public_listings` |
| Dashboard query | `comida_local_public_listings` |
| Admin query | `comida_local_public_listings` |
| RLS public read | `comida_local_public_listings_select_public` (`status = 'published'`) |

All names consistent. No second conflicting table.

## 7. Production Supabase action needed

**Required before live results/publish on production:**

1. Apply `supabase/migrations/20260604120000_comida_local_public_listings.sql` to production Supabase (`supabase db push` linked to prod, or SQL Editor).
2. Verify table + RLS policies exist.
3. Reload `/clasificados/comida-local` — should show empty state or real rows, not unavailable banner.
4. Smoke publish one real listing via `/publicar/comida-local`.

Vercel deploy does **not** auto-apply Supabase migrations.

## 8. Customer-facing error handling result

(FOOD-L9B — verified, unchanged logic)

- DB/table failure → "Resultados temporalmente no disponibles." (no raw schema-cache text)
- Zero published rows → "Aún no hay publicaciones de Comida Local."
- Filter-empty → distinct filter message
- Technical errors logged server-side via `logComidaLocalInventoryFailure`

## 9. Publish flow readiness result

| Check | Status |
|-------|--------|
| `parseComidaLocalPublishRequest` validates required fields | PASS |
| Phone OR WhatsApp required | PASS (`validateComidaLocalPublishPayload`) |
| City required (canonical NorCal) | PASS |
| Main photo required | PASS (`hasComidaLocalMainPhoto`) |
| Unsafe image URLs rejected | PASS (`sanitizeComidaLocalImageForDb`, `validateComidaLocalImageMetadata`) |
| Invalid social/location URLs omitted | PASS (`normalizeComidaLocalSocialInput`, `isValidComidaLocalExternalUrl`) |
| `owner_user_id` from Bearer only | PASS (`comidaLocalOwnerIdFromBearer`) |
| Real COMIDA Leonix ID | PASS (`allocateNextComidaLocalLeonixAdId` + DB trigger) |
| Slug generated | PASS (`buildComidaLocalSlugBase` + `allocateUniqueSlug`) |
| Row inserted into `comida_local_public_listings` | PASS |
| Response: id, slug, leonix_ad_id, status, package_tier, payment_status, publicPath | PASS |
| No Stripe | PASS |
| No fake analytics on publish | PASS |
| Client publish wired | PASS (`comidaLocalPublishClient` + application «Publicar ficha» button) |

## 10. Results page readiness result

- Reads `listPublishedComidaLocalListings` only (no hardcoded arrays, no localStorage)
- Cards from `mapComidaLocalRowToCardVm`
- Safe unavailable vs empty vs filter states
- Ready for screenshot once production migration applied

## 11. Detail page readiness result

- `[slug]/page.tsx` loads via `getPublishedComidaLocalListingBySlug`
- `notFound()` when missing/unpublished
- `ComidaLocalPublicDetailClient` + `ComidaLocalDetailShell`
- Images via `resolveComidaLocalImageUrl` (safe URLs only)
- No fake ratings/reviews; no restaurant-only CTAs

## 12. Application/preview readiness result

| Route | Status |
|-------|--------|
| `/publicar/comida-local` | Form loads, draft autosave, image upload wired |
| Publish button | Calls `POST /api/clasificados/comida-local/publish` when validation passes |
| `/clasificados/comida-local/preview` | Reads local draft only; does **not** publish |
| Preview | No fake Leonix ID; «Publicar próximamente» disabled on preview (publish from form) |

## 13. Admin deferred note

Admin at `/admin/workspace/clasificados/comida-local` remains basic/functional from FOOD-L7B. **No admin polish in this gate.** Admin queries use `comida_local_public_listings` and do not block publish/results. Polish deferred to a future gate.

## 14. Manual production verification checklist

- [ ] Apply `20260604120000_comida_local_public_listings.sql` on production Supabase
- [ ] `/clasificados/comida-local` — no raw DB error; empty or real cards
- [ ] Complete `/publicar/comida-local` form with real photo + contact
- [ ] Click «Publicar ficha» — API returns `ok: true`, `publicPath`, `leonix_ad_id` COMIDA-…
- [ ] Listing appears on results page
- [ ] «Ver ficha» opens `/clasificados/comida-local/[slug]`
- [ ] Preview route still draft-only (no accidental publish)
- [ ] Screenshot pass: results, detail, preview, application

## 15. What is intentionally not polished yet

- Admin workspace UI (FOOD-L7B basic table only)
- Card visual polish (FOOD-L10)
- Stripe checkout (FOOD-L5E)
- User dashboard wiring in `mis-anuncios` (FOOD-L7A regression)
- Preview page publish button (intentionally disabled; publish from application)
- Global nav / categoryConfig surfacing

## 16. Risks / deferred work

- Production migration must be applied manually before customer preview goes live with real data.
- Publish without logged-in user sets `owner_user_id` null (allowed by schema); dashboard ownership requires auth.
- L7A dashboard gap remains for owners managing listings.
- Detail page returns 404 on DB outage (acceptable; no error leak).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Repo state was inspected before edits | TRUE | Preflight `git status` clean at gate start |
| Production schema-cache error was addressed or documented | TRUE | FOOD-L9B error handling + §7 migration action |
| Migration for comida_local_public_listings exists | TRUE | `20260604120000_comida_local_public_listings.sql` |
| Public query uses comida_local_public_listings | TRUE | `comidaLocalPublicQueries.ts` |
| Publish API uses comida_local_public_listings | TRUE | `publish/route.ts` |
| Dashboard/admin helpers use same table name if present | TRUE | dashboard + admin modules |
| Raw Supabase error is not shown directly to customers | TRUE | `comidaLocalPublicInventoryErrors.ts` + results page |
| Empty state is separate from DB error state | TRUE | `inventory_table_missing` vs `published` empty |
| Publish API creates real listing rows | TRUE | insert into `comida_local_public_listings` |
| Publish API generates real COMIDA Leonix ID | TRUE | `allocateNextComidaLocalLeonixAdId` |
| Public results read real DB rows only | TRUE | no hardcoded listing arrays |
| Public card links to detail via Ver ficha | TRUE | `ComidaLocalListingCard` + `detailHref` |
| Public detail reads real row by slug | TRUE | `[slug]/page.tsx` |
| Application route works | TRUE | form + publish client wired |
| Preview route works | TRUE | draft preview, no publish API |
| Admin polish is deferred and not blocking | TRUE | no admin edits; §13 |
| No fake listings were added | TRUE | no seed/fallback data |
| No demo data was added | TRUE | no hardcoded rows |
| No unrelated categories were edited | TRUE | git diff scope |
| Audit script passed | TRUE | `npm run comida-local:food-l9c-subcategory-lock-audit` |
| npm run build passed | TRUE | gate validation |
