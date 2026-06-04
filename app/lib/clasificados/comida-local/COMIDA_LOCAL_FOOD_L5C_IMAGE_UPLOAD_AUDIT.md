# Gate FOOD-L5C — Comida Local Image Upload + Storage Wiring

## 1. Gate title

Gate FOOD-L5C — Comida Local Image Upload + Storage Wiring

## 2. Preflight status

- `git status --short` at gate start: clean.
- Scope limited to Comida Local lib, publish/upload API, publicar/preview UI, audit script, `package.json`.

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5B | Publish API + DB; reject data/blob/base64 at publish; no upload during publish |
| FOOD-L5A | Main photo required for cards; gallery cap by package later |
| FOOD-L4 | Preview/detail shell; safe URL rendering only |
| FOOD-L3 | Draft localStorage; no base64 persistence |

## 4. Files inspected (read-only)

- `app/api/clasificados/restaurantes/draft-media-upload/route.ts`
- `app/api/clasificados/servicios/draft-media-upload/route.ts`
- `app/api/clasificados/rentas/draft-media-upload/route.ts`
- `app/api/clasificados/comida-local/publish/route.ts`
- FOOD-L1–L5B audit docs

## 5. Files changed

- `comidaLocalTypes.ts` — `ComidaLocalUploadedImage`, `draftListingId`
- `comidaLocalImageValidation.ts`, `comidaLocalImageNormalize.ts`
- `comidaLocalDraftMediaUpload.ts`
- `comidaLocalDraftPersistence.ts`, `comidaLocalValidation.ts`, `comidaLocalPublishValidation.ts`
- `comidaLocalPreviewImage.ts`, `mapComidaLocalDraftToPreviewVm.ts`, `comidaLocalConstants.ts`, `comidaLocalFieldCopy.ts`
- `createEmptyComidaLocalDraft.ts`
- `app/api/clasificados/comida-local/draft-media-upload/route.ts`
- `app/(site)/publicar/comida-local/components/ComidaLocalImageUploadField.tsx`
- `app/(site)/publicar/comida-local/components/ComidaLocalGalleryUpload.tsx`
- `ComidaLocalApplicationClient.tsx`
- `ComidaLocalDetailShell.tsx`
- `COMIDA_LOCAL_FOOD_L5C_IMAGE_UPLOAD_AUDIT.md`
- `scripts/comida-local-food-l5c-image-upload-audit.ts`
- `package.json` — audit script only

## 6. Existing upload patterns found

- **Storage:** Vercel Blob via `@vercel/blob` `put()` + `BLOB_READ_WRITE_TOKEN` (Restaurantes, Servicios, Rentas, Comida Local L5C).
- **Path:** `clasificados/{category}/drafts/{draftId}/{slot}-{index}-{timestamp}`; Comida Local uses `clasificados/comida-local/drafts/{owner|anon}/{role}/{uuid}-{filename}`.
- **Max size:** 12 MB images (Rentas/Restaurantes); Comida Local matches.
- **MIME:** JPEG, PNG, WebP only (no SVG).
- **Auth:** Optional Bearer for owner segment in path; anonymous uses `anon-{draftListingId}`.
- **No Supabase Storage** for draft uploads in these categories — avoids shared helper edits.

## 7. Image model result

- `ComidaLocalUploadedImage` with `id`, `role`, `url`, `storagePath`, `fileName`, `contentType`, `sizeBytes`, optional dimensions/alt, `uploadedAt`.
- Legacy `previewUrl`/`storageKey` migrated on load to HTTPS `url` only.

## 8. Image validation result

- `comidaLocalImageValidation.ts`: MIME, 12 MB cap, role, URL safety, gallery max 2, `sanitizeComidaLocalImageForDb`.

## 9. Upload API result

- `POST /api/clasificados/comida-local/draft-media-upload` — multipart `file` + `role` + `draftListingId`.
- Returns `{ ok, image }` metadata only; no DB/publish/analytics/Stripe.

## 10. Form upload UI result

- Main photo (required for publish validation), optional logo, gallery up to 2.
- Immediate upload to API; loading/error states; replace/remove.

## 11. Draft persistence result

- Persists uploaded metadata only; strips data/blob/placeholder URLs on load; `draftListingId` auto-assigned.

## 12. Preview/detail image rendering result

- `resolveComidaLocalPreviewImageSrc` — HTTPS only; empty state when no main photo (no fake URLs).
- Alt text from business name + food type.

## 13. Publish validation/mapper result

- `hasComidaLocalMainPhoto` required (error); gallery cap enforced; `sanitizeComidaLocalImageForDb` on publish.
- Mapper unchanged shape: `main_photo`, `logo_image`, `gallery_images` JSONB.

## 14. Storage path/bucket result

- **Provider:** Vercel Blob (public HTTPS URLs).
- **Prefix:** `clasificados/comida-local/drafts/…`
- **Env:** `BLOB_READ_WRITE_TOKEN` required (503 if missing).

## 15. Image limits result

| Role | Limit |
|------|-------|
| mainPhoto | 1 required for publish |
| logoImage | 1 optional |
| galleryImages | max 2 (Basic-ready; Plus later) |

## 16. What is intentionally not implemented

- Stripe/payment, dashboard, admin, search/results, analytics
- Publish-time upload (upload before publish only)
- Storage file delete on draft reset
- Supabase Storage bucket (used Blob to match siblings)
- Form → publish API button wiring

## 17. Risks / deferred work

- Blob cleanup on draft reset/delete not implemented.
- Plus tier higher gallery cap in FOOD-L5D/package gate.
- Requires `BLOB_READ_WRITE_TOKEN` in deployment env.

## 18. Manual QA checklist

1. Open `/publicar/comida-local` → Fotos.
2. Upload main JPEG → preview shows HTTPS image; reload persists metadata.
3. Publish validation panel shows error without main photo.
4. Upload logo + 2 gallery; third blocked.
5. Reject `.svg` or oversized file → error message.
6. Preview page shows main/logo/gallery; no broken blob URLs.
7. `POST` publish with valid draft + main photo HTTPS metadata succeeds.
8. Audit script + `npm run build` pass.

## Requirement audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------- | ---------- | -------- |
| FOOD-L5B audit was read and followed | TRUE | Publish path unchanged; image sanitize reused |
| Comida Local remains separate from Restaurantes Premium | TRUE | Own Blob prefix + APIs |
| Existing upload patterns were inspected read-only | TRUE | Restaurantes/Servicios/Rentas routes |
| Comida Local image metadata model exists | TRUE | `comidaLocalTypes.ts` |
| Image validation helper exists | TRUE | `comidaLocalImageValidation.ts` |
| Draft media upload API exists | TRUE | `draft-media-upload/route.ts` |
| Upload API validates file type | TRUE | MIME check |
| Upload API validates file size | TRUE | 12 MB |
| Upload API sanitizes filenames/paths | TRUE | `sanitizeFilename`, server pathname |
| Upload API writes to storage only, not listing DB | TRUE | Blob put only |
| Upload API does not publish listing | TRUE | no publish import |
| Upload API does not call Stripe/payment | TRUE | grep clean |
| Upload API does not create analytics events | TRUE | grep clean |
| Main photo upload is wired in form | TRUE | `ComidaLocalImageUploadField` role main |
| Logo upload is wired as optional | TRUE | role logo optional |
| Gallery upload is wired with cap | TRUE | `ComidaLocalGalleryUpload` max 2 |
| Draft stores uploaded metadata only | TRUE | persistence normalize |
| Draft does not store base64 images | TRUE | strip on load |
| Draft does not store File objects | TRUE | upload then metadata only |
| Draft strips unsafe data/blob URLs | TRUE | `normalizeComidaLocalImageFromStorage` |
| Preview renders safe uploaded main photo | TRUE | `mapComidaLocalDraftToPreviewVm` |
| Preview renders safe uploaded logo if present | TRUE | same |
| Preview renders safe uploaded gallery if present | TRUE | same |
| Preview does not render fake image URLs | TRUE | `isUnsafeComidaLocalImageUrl` |
| Publish validation requires main photo | TRUE | `hasComidaLocalMainPhoto` error |
| Publish mapper stores image metadata | TRUE | `main_photo`, etc. |
| Publish API rejects unsafe image metadata | TRUE | `sanitizeComidaLocalImageForDb` |
| No Restaurante files were edited | TRUE | git scope |
| No Rentas files were edited | TRUE | git scope |
| No Bienes Raíces files were edited | TRUE | git scope |
| No Servicios files were edited | TRUE | git scope |
| No En Venta/Varios files were edited | TRUE | git scope |
| No dashboard/admin files were edited | TRUE | git scope |
| No search/results/categoryConfig files were edited | TRUE | git scope |
| No fake listings/data/counters/reviews were added | TRUE | no seeds |
| Audit script passed | TRUE | `npm run comida-local:food-l5c-image-upload-audit` |
| npm run build passed | TRUE | Phase 14 validation |
