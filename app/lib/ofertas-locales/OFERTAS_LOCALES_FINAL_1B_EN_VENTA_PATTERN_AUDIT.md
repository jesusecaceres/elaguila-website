# Stack FINAL-1B+ — En Venta Gold-Standard Pattern Audit

## En Venta files inspected

### Application
- `app/(site)/clasificados/publicar/en-venta/page.tsx` — hub (Free/Pro)
- `app/(site)/clasificados/publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx` — form orchestrator
- `app/(site)/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState.ts` — state shape

### Draft / session persistence
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraft.ts` — memory + sessionStorage + IndexedDB; **per-tab session id**
- `app/(site)/clasificados/en-venta/preview/enVentaPreviewDraftIdb.ts` — IDB for large images
- `app/(site)/clasificados/en-venta/publish/useEnVentaFormAutosave.ts` — 700ms debounced autosave
- `app/(site)/clasificados/en-venta/shared/utils/enVentaDraftMerge.ts` — merge prefer-complete

### Preview
- `app/(site)/clasificados/en-venta/preview/page.tsx`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`

### Publish
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` — two-phase: draft row → upload → active
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts`
- `app/(site)/clasificados/en-venta/contracts/enVentaPublishContract.ts`

### DB mapping
- `app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData.ts`
- `app/(site)/clasificados/en-venta/mapping/appendEnVentaDetailPairs.ts`

### Public browse / safety
- `app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts` — `status=active` + `is_published`
- `app/(site)/clasificados/en-venta/lib/enVentaListingVisibility.ts`
- `app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect.ts`

### Public card / detail
- `app/(site)/clasificados/en-venta/results/EnVentaResultListingCard.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx`

### Admin / dashboard
- `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx`
- `app/lib/clasificados/en-venta/dashboard/mapListingRowToEnVentaRepublishDraft.ts`

---

## En Venta application pattern

Single-page React state machine with section components. Autosave debounced to draft stores. Preview navigates to dedicated preview route reading same draft stores.

## En Venta upload/media persistence pattern

Images as base64 in state during wizard; on publish uploaded to Supabase `listing-images` bucket. Draft stores use **sessionStorage + IndexedDB + in-memory**, keyed with **per-tab session id** so new tabs do not inherit stale client data.

## En Venta publish pattern

Client-side `publishEnVentaFromDraft`: insert `listings` as `draft`/`is_published=false`, upload media, finalize to `active`/`is_published=true`. **No admin gate before public** (post-publish moderation).

## En Venta public card/detail pattern

Results card from `EnVentaAnuncioDTO`; detail via `/clasificados/anuncio/[id]` shell. Contact actions on detail only; browse query excludes private contact fields.

## En Venta admin review pattern

Admin ops queue (`ListingsCategoryOpsQueuePage`) for post-publish moderation — not pre-publish approval.

## En Venta dashboard/edit pattern

`Mis Anuncios` lists owner rows; manage card (pause/sold/republish). No in-place edit — **Republicar** seeds new publish draft from existing row.

---

## What Ofertas Locales already matches

| Area | Match |
|------|-------|
| Multi-step application wizard | ✅ |
| Preview route | ✅ |
| Server publish API with auth | ✅ (stronger than En Venta — pending_review only) |
| Asset upload to blob storage | ✅ |
| Public results page + filters | ✅ |
| Public detail drawer | ✅ (partial Business Hub) |
| Pending-before-public safety | ✅ **Better** — `pending_review` until admin approve |
| No fake reviews/ratings | ✅ |

## What Ofertas Locales does not match

| Area | Gap |
|------|-----|
| Draft storage | ❌ Was `localStorage` (cross-tab stale) — **fix in Gate C** |
| Publish visibility | ✅ Intentional — pending_review vs En Venta instant active |
| Public detail richness | ⚠️ Social/review links not on public card yet (in `internal_notes`) |
| Admin review queue | ❌ Not built |
| Seller dashboard / Mis Anuncios | ❌ Not built |
| Edit/republish flow | ❌ Not built |
| Google Review / Yelp fields | ❌ Missing — **fix in Gate C** |

## Exact fixes before production smoke (Gate C)

1. **sessionStorage** for draft (per-tab isolation, En Venta-aligned).
2. **googleReviewUrl / yelpUrl** in draft, UI, publish metadata.
3. Production DB migrations applied manually (Gate D blocker).

## Exact admin/dashboard follow-up (FINAL-2+)

Copy En Venta patterns:

1. **Admin queue** — `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx` mirroring En Venta ops queue; approve `pending_review` → `approved`; reject → `rejected`; activate AI items (`is_active=true`).
2. **Mis Anuncios card** — `OfertasLocalesListingManageCard` in dashboard; show status, submitted date, resubmit if rejected.
3. **Republish/edit** — seed publish wizard from existing row (like `mapListingRowToEnVentaRepublishDraft`).
4. **Public social promotion** — on approve, copy social/review metadata from `internal_notes` to public-safe columns or parse in public API.
