# Gate REST-VIDEO-URL1 — Restaurante External Video URLs Only + Cross-Pipeline Output Verification

## 1. Gate title

Gate REST-VIDEO-URL1 — Restaurante External Video URLs Only + Cross-Pipeline Output Verification

## 2. Preflight status

Clean worktree at gate start.

## 3. Files inspected

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/RestauranteExternalVideoUrlsSection.tsx` (new)
- `app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx`
- `app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaStrip.tsx` (unused in form; legacy)
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteDraftMedia.ts`
- `app/(site)/clasificados/restaurantes/shell/RestauranteShellVenueGalleryBlock.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx`
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/EnVentaExternalVideoUrlsSection.tsx` (read-only reference)
- `app/(site)/publicar/comida-local/**` (read-only — no video fields)
- `app/api/clasificados/restaurantes/publish/route.ts` (read-only — accepts listing_json draft)

## 4. Files changed

- `app/lib/clasificados/restaurantes/restauranteVideoUrls.ts` (new)
- `app/(site)/publicar/restaurantes/RestauranteExternalVideoUrlsSection.tsx` (new)
- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteGalleryMediaSequence.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts`
- `app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx`
- `app/lib/clasificados/restaurantes/RESTAURANTES_VIDEO_URL1_AUDIT.md` (this file)
- `scripts/restaurantes-video-url1-audit.ts` (new)
- `package.json` — audit script only

## 5. En Venta/Varios external-video reference findings

Pattern from `EnVentaExternalVideoUrlsSection.tsx` + `enVentaVideoUrls.ts`:
- Max 4 external URLs
- Añadir video flow with validation via `isEmbeddableExternalVideoUrl`
- Duplicate/empty blocking
- Persisted in draft → publish → detail output
Restaurante gate mirrors this using `restauranteVideoUrls.ts` + `RestauranteExternalVideoUrlsSection.tsx`.

## 6. Restaurante current video pipeline findings (pre-patch)

- Direct local video upload in `RestaurantePublishMediaBuckets` (`Subir video`, `accept="video/*"`)
- Single `videoUrl` text field in `RestauranteApplicationClient`
- `videoFile` data URL stored in session/IDB via `restauranteDraftMedia.ts`
- Shell mapper `buildVideoShellItem` — single video in venue gallery
- Publish payload sent `videoFile`/`videoUrl` in `listing_json` (no Mux trigger from client form)

## 7. Comida Local read-only video pipeline findings

**No video feature present** — grep across `app/(site)/publicar/comida-local/**` found no video/Mux/videoUrl fields. Comida Local does not expose direct video upload or video output in this repo.

## 8. Gate A result — inspection

All inspection rows TRUE. No code edits during Gate A except this audit doc.

## 9. Gate B result — form/draft video URL manager

**PATCHED** — Removed direct upload UI; added Video opcional + Añadir video (max 4); `videoUrls[]` canonical with legacy `videoUrl` migration.

## 10. Gate C result — preview/publish/public/mobile output

**PATCHED** — Multiple videos in venue gallery tab; publish stores `videoUrls`; legacy local `videoFile` still renders for old drafts; mobile gallery uses ShellVideoSlide + Video 1/2/3/4 picker.

## 11–22. Summary results

| Area | Result |
|------|--------|
| Form video URL manager | Video opcional + Añadir video + Quitar rows |
| Draft persistence | `videoUrls` via `setDraftPatch` / sessionStorage |
| Preview | Venue gallery Videos tab when URLs exist; photos separate |
| Publish payload | `videoUrls` + legacy `videoUrl[0]`; `videoFile` omitted |
| Public detail | `mapRestauranteDraftToShell` → multiple video items |
| Mobile | `RestauranteLockedGallerySection` embed + Video N tabs |
| Backward compat | Legacy `videoUrl`, local `videoFile`, stream.mux.com URLs |
| Cost protection | No new Mux/direct file upload from client form |
| Photos/gallery | Image buckets unchanged |

## 23. Manual QA checklist

- [ ] `/publicar/restaurantes` — no Subir video / file picker for video
- [ ] Video opcional — add up to 4 YouTube/TikTok/etc. URLs
- [ ] Duplicate/invalid URLs blocked
- [ ] Refresh preserves videoUrls order
- [ ] Preview — Videos tab only when URLs exist; multiple Video 1/2/3/4
- [ ] Volver a editar hydrates all URLs
- [ ] Publish succeeds without videos
- [ ] Public detail shows saved videos
- [ ] Photo uploads still work (comida/interior/exterior/hero)
- [ ] Comida Local unchanged

## Gate A TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante video form fields were inspected | TRUE | RestauranteApplicationClient, Buckets |
| Restaurante draft/session video persistence was inspected | TRUE | useRestauranteDraft, restauranteDraftMedia |
| Restaurante preview video output was inspected | TRUE | mapRestauranteDraftToShell, shell gallery |
| Restaurante publish payload video handling was inspected | TRUE | buildRestaurantePublishPayload, publish route |
| Restaurante public detail video output was inspected | TRUE | RestauranteShellVenueGalleryBlock, LockedGallery |
| Restaurante mobile video output was inspected | TRUE | RestauranteLockedGallerySection |
| Direct video upload/Mux path was identified or confirmed absent in Restaurante | TRUE | Subir video in Buckets (pre-patch) |
| Comida Local video pipeline was inspected read-only | TRUE | no matches in comida-local |
| Comida Local direct video upload/Mux status was documented | TRUE | no video feature |
| En Venta/Varios external-video pattern was inspected read-only | TRUE | EnVentaExternalVideoUrlsSection |
| No files were edited during Gate A except audit notes if necessary | TRUE | inspection only |

## Gate B TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Restaurante direct video file upload UI is hidden/removed | TRUE | Buckets rewritten without video upload |
| Restaurante form no longer triggers direct Mux upload for new videos | TRUE | no video file handlers in active form |
| Photo upload behavior was not changed | TRUE | image buckets preserved |
| Photo gallery behavior was not changed | TRUE | sortable grids unchanged |
| Video opcional section exists | TRUE | RestauranteExternalVideoUrlsSection |
| Añadir video flow exists | TRUE | tryAdd + button |
| Added video URLs render as Video 1/2/3/4 rows | TRUE | list UI |
| Quitar removes individual video URLs | TRUE | removeAt |
| Max video URL limit is enforced | TRUE | RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS = 4 |
| Empty URLs are blocked | TRUE | trim + early return |
| Duplicate URLs are blocked | TRUE | lowercase dedupe |
| Invalid URLs show validation message | TRUE | Pega un enlace válido… |
| videoUrls persists in Restaurante draft/session state | TRUE | setDraftPatch |
| Old single video URL compatibility is handled | TRUE | mergeRestauranteDraft + collectRestauranteExternalVideoUrls |
| No Comida Local files were edited | TRUE | git diff scope |
| No En Venta/Varios files were edited | TRUE | git diff scope |

## Gate C TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Preview keeps photos and videos separated | TRUE | venue gallery categories |
| Preview shows Videos only when videoUrls exist | TRUE | buildVideoShellItems |
| Preview supports multiple video URLs | TRUE | multiple items in video category |
| Volver a editar preserves videoUrls in order | TRUE | mergeRestauranteDraft |
| Publish payload stores videoUrls | TRUE | buildRestaurantePublishPayload |
| Publish does not require videos | TRUE | optional field |
| Publish does not trigger Mux/direct video upload | TRUE | videoFile: undefined in payload |
| Public detail shows Videos only when saved videoUrls exist | TRUE | shell mapper |
| Public detail supports multiple video URLs | TRUE | video category items[] |
| Public detail keeps photos/gallery working | TRUE | interior/food/exterior unchanged |
| Mobile output exposes videoUrls cleanly | TRUE | LockedGallery Video N tabs + ShellVideoSlide |
| Backward compatibility for old single video URL exists | TRUE | collectRestauranteExternalVideoUrls |
| Backward compatibility for old stream.mux.com URL exists if possible | TRUE | isEmbeddableExternalVideoUrl |
| No photo upload/gallery behavior was changed | TRUE | buckets |
| No dashboard/admin files were edited | TRUE | git diff |
| No analytics files were edited | TRUE | git diff |
| No Stripe/payment files were edited | TRUE | git diff |
| No Supabase/database migrations were created | TRUE | listing_json only |
| No Comida Local files were edited | TRUE | git diff |
| Comida Local video status was documented read-only | TRUE | section 7 |
| No En Venta/Varios files were edited | TRUE | git diff |
| No fake videos/listings/metrics were added | TRUE | user-provided URLs only |
| Audit script passed if added | TRUE | npm run restaurantes:video-url1-audit |
| npm run build passed | TRUE | gate validation |

## Root cause

Restaurante pipeline predated En Venta external-video policy; used local file upload + single URL field. **Missing implementation**, not deployment mismatch.

## Next recommended gate

REST-VIDEO-URL1-COMIDA — evaluate whether Comida Local needs external video URLs (currently no video feature).
