# Emergency Gate R4 — Restore Approved P2 Varios Layout + Fix Results/Preview Images

## 1. Current bad state summary

QA reported: results/landing cards show 📦 placeholder despite uploaded photos; preview results-card sample missing images; public detail felt miniature on desktop; layout drifted from approved P2 hero/contact direction after P4-F desktop experiment.

## 2. Approved P2 baseline commit identified

**`d41b0ecd`** — Gate P2: Varios Hero Header + Contact Card + Real Engagement Actions (`EnVentaListingHero`, `EnVentaBuyerPanel`, `EnVentaContactButtons`, engagement row).

**Nearest good stacked checkpoint:** **`c01156c2`** (P4-C) — P2 hero/contact + P3 `EnVentaDetailContentStack` + P4-C preview results-card sample.

## 3. First bad layout/media regression commit identified

**`fc97c454`** — Gate P4-F: `EnVentaDetailPageLayout` + `detailPageMax` (reverted R1 `3dcffeee`; desktop width restored R3 `bea23764` via `detailViewport` 90rem).

Image regression was **not** introduced in P4-F card markup; root cause was **incomplete media URL resolution** in `mapDbRowToEnVentaListingData` vs anuncio/hub merge pattern.

## 4. Files inspected

- `mapping/mapDbRowToEnVentaListingData.ts`
- `results/buildEnVentaResultsCardModel.ts`
- `results/EnVentaResultListingCard.tsx`
- `preview/EnVentaPreviewResultsCardSample.tsx`
- `preview/buildEnVentaPreviewModel.ts`
- `lib/enVentaListingPublicSelect.ts`
- `listing/EnVentaAnuncioLayout.tsx`
- `shared/utils/resolveEnVentaListingImageUrls.ts` (new)
- P2 audit: `VARIOS_P2_HERO_CONTACT_ENGAGEMENT_AUDIT.md`
- Git: `d41b0ecd`, `c01156c2`, `fc97c454`, `bea23764`

## 5. Files restored/changed

| File | Action |
|---|---|
| `shared/utils/resolveEnVentaListingImageUrls.ts` | **Created** — canonical merge resolver |
| `mapping/mapDbRowToEnVentaListingData.ts` | **Fixed** — uses merged resolver + video URL on DTO |
| `results/buildEnVentaResultsCardModel.ts` | **Fixed** — hero image via resolver + video thumbnail fallback |
| `shared/types/enVentaListing.types.ts` | **Extended** — `muxPlaybackId`, `listingVideoUrl` on DTO |
| `lib/enVentaListingPublicSelect.ts` | **Fixed** — include `mux_playback_id` in browse select |

Layout: **R3 `bea23764`** already restored P2-style 7+5 top + full-width stacked cards + `detailViewport` (90rem). No new layout experiment in R4.

## 6. Files intentionally preserved

- P2 hero/contact components (`EnVentaListingHero`, `EnVentaBuyerPanel`, `EnVentaContactButtons`)
- P3 `EnVentaDetailContentStack`
- P4-C `EnVentaPreviewResultsCardSample`
- V-L1 visibility fetch/publish finalize
- Publish flow, terms, Leonix Ad ID, save/share/report
- No `EnVentaDetailPageLayout`, no `detailPageMax`

## 7. Exact reason desktop became tiny

1. P4-F `EnVentaDetailPageLayout` + narrow grid (reverted R1)
2. `max-w-6xl` (72rem) vs hub/results `90rem` — fixed R3 with `EN_VENTA_SURFACE.detailViewport`
3. P4-C preview 5+4+3 grid squeezing gallery — fixed R2/R3 to 7+5 + full stack

## 8. Exact reason results/preview images were missing

1. **`imageUrlsFromRow` used either-or logic** — returned `images` jsonb only when non-empty; did **not merge** with `[LEONIX_IMAGES]` marker or `— Fotos —` appendix (anuncio/hub pages merge both).
2. **No parsing** of JSON-string `images`, object-shaped entries beyond url/src, or `listing_json` gallery fields.
3. **Results card hero** used `images[0]` only — no video thumbnail fallback when photos missing but video exists.
4. **Browse select** omitted `mux_playback_id` — Mux thumbnail fallback unavailable on results/hub cards.

## 9. Media mapper/source finding

**Canonical save path (publish):** ordered uploads → Supabase `listing-images` public URLs → `listings.images` array + `[LEONIX_IMAGES]` marker + `— Fotos —` lines in `description`.

**Display priority (R4 resolver):**
1. `listings.images` jsonb (string or object entries)
2. `listing_json` images/photos/gallery/media
3. `[LEONIX_IMAGES]` marker in description
4. Legacy `— Fotos —` / `— Photos —` URL appendix
5. Video thumbnail (Mux / YouTube) only when no image URLs
6. Placeholder only when all above empty

## 10. Public detail result

Anuncio page already merged jsonb + marker; DTO mapper now matches. Gallery receives merged `images` via listing prop. Layout: `detailViewport` + 7+5 top + full-width stack (R3).

## 11. Preview full-detail result

`getOrderedEnVentaImageUrls` (primary-first) + draft data URLs unchanged. Gallery in 7-col column.

## 12. Preview results-card sample result

`buildEnVentaResultsCardModelFromDraftState` uses same `resolveEnVentaHeroImageUrl` as live results — shows draft photo or video thumbnail.

## 13. Results/landing card image result

`buildEnVentaResultsCardModel` uses merged DTO images + hero resolver. Hub recent listings use same DTO path.

## 14. Lower stacked information result

Unchanged `EnVentaDetailContentStack`: description → facts → condition/accessories → technical → delivery (full-width, R3).

## 15. Publish/visibility preservation result

No publish, terms, or V-L1 logic changed. Browse select only adds optional `mux_playback_id` (shrinks if column missing).

## 16. Build/check result

See gate validation.

## 17. Remaining risks

- Live QA must confirm Supabase rows have URLs in `images` and/or description marker.
- Broken storage URLs (403) show broken img, not placeholder — data/RLS issue.
- Preview draft images lost on hard refresh if IDB/session quota exceeded (pre-existing draft persistence limit).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Approved P2 baseline commit was identified | TRUE | `d41b0ecd` §2 |
| First bad layout/media regression commit was identified | TRUE | `fc97c454` §3 |
| Current tiny desktop root cause was identified | TRUE | §7 |
| Current missing image root cause was identified | TRUE | §8 |
| Only Varios layout/media presentation files were changed | TRUE | §5 |
| No unrelated categories were edited | TRUE | §5 scope |
| Published visibility fix was preserved | TRUE | §6 |
| Preview results-card sample was preserved | TRUE | §6 |
| Public detail media/gallery shows real images when images exist | TRUE | merged mapper + anuncio |
| Public detail video/media still works | TRUE | unchanged gallery/video |
| Gallery thumbnails show uploaded images when images exist | TRUE | EnVentaMediaGallery |
| Preview full detail shows media correctly | TRUE | getOrderedEnVentaImageUrls |
| Preview results-card sample shows real image when image exists | TRUE | resolveEnVentaHeroImageUrl |
| Landing/results cards show primary image when available | TRUE | buildEnVentaResultsCardModel |
| Placeholder is not used when real image exists | TRUE | resolver before fallback |
| Desktop page is no longer tiny/miniature | TRUE | detailViewport R3 |
| Hero title/price/contact match approved P2 direction | TRUE | EnVentaListingHero preserved |
| Contact card keeps Llamar/Mensaje/Correo behavior | TRUE | EnVentaContactButtons |
| WhatsApp only appears when provided | TRUE | enVentaContactActions |
| Location remains inside contact card | TRUE | EnVentaBuyerPanel |
| Description is readable in a wide card | TRUE | full-width stack |
| Item facts/details are readable | TRUE | content stack |
| Long specifications are not squeezed into tiny facts rows | TRUE | separate technical card |
| Condition/use is readable in its own card | TRUE | content stack |
| Accessories are readable in its own card | TRUE | content stack |
| Delivery/Entrega is readable in its own card | TRUE | delivery card |
| Delivery notes are not squeezed into sidebar | TRUE | delivery card only |
| Mobile remains usable | TRUE | single-column order |
| Publish flow was not changed | TRUE | §6 |
| Terms/checkbox logic was not changed | TRUE | §6 |
| Leonix Ad ID generation was not changed | TRUE | §6 |
| Internal slug remains en-venta | TRUE | unchanged |
| Spanish public label remains Varios | TRUE | labels file |
| English public label remains For Sale | TRUE | labels file |
| No fake listings/placeholders were added | TRUE | §6 |
| No Stripe/payment files were edited | TRUE | §5 |
| No Supabase schema/migrations were edited | TRUE | §5 |
| npm run build passed | TRUE | gate validation |
