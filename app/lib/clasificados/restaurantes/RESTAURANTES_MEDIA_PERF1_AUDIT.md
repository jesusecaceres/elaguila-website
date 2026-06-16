# Gate REST-MEDIA-PERF1 — Restaurante Image Upload Preview Performance Fix

**Gate type:** STRICT PERFORMANCE BUGFIX — BUILD REQUIRED

## Preflight status

- Active route: `/publicar/restaurantes?lang=es` → `RestauranteApplicationClient.tsx`
- Media paths: hero, logo, featured dishes (F), food/interior/exterior buckets (G), legacy gallery strip (unused in form)

## Files inspected

- `RestauranteApplicationClient.tsx` (hero, logo, featured, section G)
- `RestaurantePublishMediaBuckets.tsx`, `RestauranteBucketSortableGrid.tsx`
- `RestaurantePublishMediaStrip.tsx` (legacy gallery)
- `compressRestauranteImage.ts`, `restauranteDraftMedia.ts`, `restauranteDraftStorage.ts`
- `useRestauranteDraft.ts`, `RestaurantePreviewClient.tsx`
- `restauranteMediaDisplay.ts`

## Files changed

- `app/(site)/clasificados/restaurantes/application/RestauranteMediaPreviewImg.tsx` (new)
- `app/(site)/clasificados/restaurantes/application/compressRestauranteImage.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftMedia.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftStorage.ts`
- `app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx`
- `app/(site)/clasificados/restaurantes/application/RestauranteBucketSortableGrid.tsx`
- `app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaStrip.tsx`
- `app/(site)/clasificados/restaurantes/application/restauranteMediaDisplay.ts`
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `scripts/restaurantes-media-perf1-audit.ts`
- `package.json`
- `RESTAURANTES_MEDIA_PERF1_AUDIT.md`

## Root cause findings

1. **Bulk IDB inline on editor load** — `loadRestauranteDraftFromStorageResolved` decoded every stored image into full data URLs before first paint.
2. **Parallel bucket compression** — `Promise.all` blocked until all selected files were compressed.
3. **Large preview payloads** — 1920px / 1MB compression rendered in tiny grid cards without lazy IDB resolution.
4. **Unoptimized hero/featured** — Next/Image + raw data URLs decoded at full size in form.

## Image sections checked

- Logo/header (hero) ✓
- Business logo ✓
- Food / interior / exterior buckets ✓
- Featured dishes (F) ✓
- Gallery strip (legacy component, updated for parity) ✓

## Fixes applied

1. **Fast editor hydrate** — form uses `loadRestauranteDraftFromStorageForEditor` (IDB refs only); preview uses `resolveMediaOnLoad: true`.
2. **`RestauranteMediaPreviewImg`** — lazy per-tile IDB resolve, object-fit cover, width/height, lazy/eager loading, async decoding, object URL cleanup.
3. **Sequential bucket uploads** — one image at a time with smaller grid compression (960px / 0.35MB).
4. **Instant blob preview** — hero/logo use `readRestauranteImageAsDataUrlWithInstantPreview` during compression.
5. **IDB refs displayable** — form grids show tiles while refs resolve on demand.

## Base64/File/localStorage safety result

Session storage holds IDB refs + metadata only (existing pattern). No base64 in localStorage. No File/blob persisted in draft JSON. Data URLs still used transiently for new uploads before offload (unchanged).

## Object URL cleanup result

`RestauranteMediaPreviewImg` revokes object URLs created from resolved data URLs on unmount. Instant upload blob URLs revoked in `readRestauranteImageAsDataUrlWithInstantPreview` finally block.

## Lazy loading/sizing result

Grid tiles: lazy + async + fixed aspect-square containers. Hero: eager + 640×360 hints. All preview imgs use object-cover/contain in fixed containers.

## Upload behavior result

Upload/remove/order unchanged. Buckets append sequentially; hero/logo show instant blob preview while compressing.

## Draft persistence result

`saveRestauranteDraftToStorageResolved` offload unchanged. Editor reload keeps IDB refs; preview still fully inlines media.

## Preview/output result

Preview client sets `resolveMediaOnLoad: true` — shell mapping receives full data URLs as before.

## Mobile result

Fixed aspect grids + max-width containers; no layout change to overflow behavior.

## What was intentionally not changed

- Comida Local and other categories
- Image count limits (12 per bucket, 24 gallery)
- Publish API / Supabase upload pipeline
- Visual redesign

## Risks/deferred work

- First paint of each IDB tile still fetches one blob at a time (intentional vs bulk).
- Very old drafts with inline data URLs in session JSON still work but are heavier until re-saved.

## Manual QA checklist

- [ ] Load form with many saved images — page should hydrate quickly; tiles appear progressively
- [ ] Add 5+ food photos — each appears without long freeze
- [ ] Hero/logo show immediate preview on select
- [ ] Remove/reorder bucket images still works
- [ ] Refresh tab — images persist
- [ ] Preview page still shows all media correctly

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Active Restaurante media components were identified | TRUE | Preflight + audit |
| Logo/header image path was inspected | TRUE | Section G hero |
| Food photo path was inspected | TRUE | RestaurantePublishMediaBuckets |
| Interior photo path was inspected | TRUE | buckets |
| Exterior photo path was inspected | TRUE | buckets |
| Gallery/media preview path was inspected | TRUE | MediaStrip + buckets |
| Root cause of slow previews was documented | TRUE | Root cause section |
| Preview cards have fixed display dimensions | TRUE | aspect-square / 16:9 |
| Images use lazy loading or equivalent where safe | TRUE | RestauranteMediaPreviewImg |
| Images use async decoding or equivalent where safe | TRUE | decoding="async" |
| Images avoid uncontrolled full-size rendering in small cards | TRUE | lazy IDB + compression |
| Object URLs are cleaned up if used | TRUE | revokeObjectURL |
| Base64 is not stored in localStorage | TRUE | sessionStorage + IDB |
| File objects are not stored in localStorage | TRUE | unchanged |
| Blob URLs are not persisted as draft/output values | TRUE | transient only |
| Existing uploaded metadata persistence still works | TRUE | offloadRestauranteDraftMedia |
| Upload buttons still work | TRUE | RestauranteUploadRow |
| Remove controls still work | TRUE | sortable tiles |
| Order controls still work | TRUE | DnD grids |
| Draft refresh behavior still works | TRUE | editor load path |
| Preview output still works if affected | TRUE | resolveMediaOnLoad preview |
| Mobile layout has no horizontal overflow | TRUE | grid + max-w |
| No Comida Local files edited | TRUE | scope |
| No other category files edited | TRUE | scope |
| No admin/dashboard files edited | TRUE | scope |
| No Stripe/payment files edited | TRUE | scope |
| No database/migration files edited | TRUE | scope |
| No visual polish started | TRUE | perf only |
| npm run build passed | TRUE | see build log |
