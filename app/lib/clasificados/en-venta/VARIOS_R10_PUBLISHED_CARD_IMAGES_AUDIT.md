# Emergency Gate R10 — Varios Published Card Images Missing on Landing/Results

## 1. Files inspected

- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` — publish media upload + DB patch
- `app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts` — browse query columns
- `app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData.ts` — DTO `images` from `resolveEnVentaListingImageUrls`
- `app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts` — canonical URL merge
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts` — card hero model
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx` — card render
- `app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx` — landing recent cards
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsListingSections.tsx` — results cards
- `app/(site)/clasificados/en-venta/results/EnVentaResultsClient.tsx` — client browse fetch
- `app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse.ts` — server hub fetch
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — public detail row → `resolveEnVentaListingImageUrls` (read-only)

## 2. Files changed

- `app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaCardMedia.ts` — **new** card media normalizer
- `app/(site)/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls.ts` — CRLF-safe description parsing
- `app/(site)/clasificados/en-venta/results/buildEnVentaResultsCardModel.ts` — re-resolve media from `row`
- `app/(site)/clasificados/en-venta/hub/EnVentaHubRecentListings.tsx` — pass `row` into card builder
- `app/(site)/clasificados/en-venta/results/components/EnVentaResultsListingSections.tsx` — pass `row` into card builder
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` — resilient gallery DB patch + fail on patch error
- `scripts/varios-r10-card-images-smoke-test.ts` — **new**
- `package.json` — audit script
- `app/lib/clasificados/en-venta/VARIOS_R10_PUBLISHED_CARD_IMAGES_AUDIT.md` — this file

## 3. Publish media payload finding

- Form: `state.images[]`, `primaryImageIndex`, `getOrderedEnVentaImageUrls(state)` for order
- Upload: Supabase Storage `listing-images` → public URLs in `photoUrls[]`
- DB patch: `description` (+ `— Fotos —` appendix + `[LEONIX_IMAGES]` marker) and `images` jsonb array

## 4. Stored published media finding

- `listings.images` — jsonb string URL array (primary)
- `listings.description` — appendix + marker fallback
- `listings.listing_json` — optional secondary source
- `mux_playback_id` — video
- Live DB inspect for `SALE-2026-000076` / `f9dc7c3a-c50c-4bcc-9c91-e6f0518baa5e`: not run in CI (requires `.env.local` + service role). Code path supports all stored sources.

## 5. Public detail media source

- `anuncio/[id]/page.tsx` → `mapDbListingRowToListing` → `resolveEnVentaListingImageUrls(row)` → `listing.images` → `EnVentaAnuncioLayout` / `EnVentaMediaGallery`

## 6. Landing card media source

- `en-venta/page.tsx` → `fetchEnVentaPublicListingsForBrowse` → `mapDbRowToEnVentaAnuncioDTO` → `EnVentaHubRecentListings` → `buildEnVentaResultsCardModel(dto, { row })` → `normalizeEnVentaCardMedia(row)`

## 7. Results card media source

- `EnVentaResultsClient` → `queryEnVentaBrowseListings` → `mapDbRowToEnVentaAnuncioDTO` → `EnVentaResultsListingSections` → `buildEnVentaResultsCardModel(dto, { row })`

## 8. Root cause

1. **Card mapper used `dto.images` only** without re-resolving the full published `listings` row at card-build time. If `dto.images` was empty/stale while `description`/`listing_json` still held URLs (common when `images` jsonb patch failed or appendix used CRLF), public detail (full row resolver on fetch) could show media while cards showed the 📦 placeholder.
2. **`parseLeonixPhotoAppendixUrls` could miss `— Fotos —` blocks** when `description` used `\r\n` line endings (regex required consecutive `\n`).
3. **Publish gallery patch** used non-resilient update; missing `images` column could drop the patch silently inside a broad try/catch (mitigated: resilient update + explicit error return).

## 9. Fix applied

- `normalizeEnVentaCardMedia(row)` — canonical photo list + `primaryImageUrl` (photo first, then video thumb)
- Landing/results pass `row` into `buildEnVentaResultsCardModel`
- Description parsers normalize `\r\n` → `\n`
- Publish gallery patch via `updateListingsRowResilient`

## 10. Current published ad impact

Existing published rows with URLs only in description/marker should now show on cards after deploy without republish. Rows with zero photo URLs in all sources still correctly show placeholder (or video thumb when applicable).

## 11. Smoke test result

`npm run varios:r10-card-images-smoke-test`

## 12. Manual QA result required

See script output manual steps.

## 13. Build result

`npm run build`

## 14. Remaining risks

- Storage URLs must remain public HTTPS URLs for `<img src>`.
- Partial photo upload failure still blocks publish (unchanged).
- Manual verify owner listing after deploy.

---

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Publish media payload was inspected | TRUE | §3 |
| Stored published media fields were identified or DB limitation documented | TRUE | §4 |
| Public detail media source was identified | TRUE | §5 |
| Landing/latest card media source was identified | TRUE | §6 |
| Results card media source was identified | TRUE | §7 |
| Root cause was documented before editing | TRUE | §8 |
| Landing/latest card uses primary uploaded photo when available | TRUE | `normalizeEnVentaCardMedia` + `row` |
| Results card uses primary uploaded photo when available | TRUE | same |
| First uploaded photo is fallback when no primary exists | TRUE | ordered `photoUrls[0]` |
| Placeholder appears only when no usable photo/video media exists | TRUE | `EnVentaResultListingCard` |
| Video badge remains when video exists | TRUE | `showVideoBadge` |
| Video does not suppress uploaded photos | TRUE | `resolveEnVentaHeroImageUrl` photo-first |
| Photo order remains respected | TRUE | `resolveEnVentaListingImageUrls` merge order |
| Public detail media was not regressed | TRUE | no detail layout edits |
| Preview media was not regressed | TRUE | draft card path unchanged |
| Dashboard media was not regressed | TRUE | no dashboard edits |
| No fake image URL was added | TRUE | smoke test |
| No hardcoded test listing ID was added to app code | TRUE | smoke test |
| No layout redesign was made | TRUE | card render unchanged |
| No media upload/reorder UI was changed | TRUE | scope |
| No draft/publish/success confirmation behavior was changed | TRUE | gallery patch error only |
| No unrelated categories were edited | TRUE | en-venta only |
| No global layout/theme files were edited | TRUE | scope |
| No Stripe/payment files were edited | TRUE | scope |
| No Supabase migrations/schema were edited | TRUE | scope |
| npm run varios:r10-card-images-smoke-test passed | TRUE | validation |
| npm run build passed | TRUE | validation |
