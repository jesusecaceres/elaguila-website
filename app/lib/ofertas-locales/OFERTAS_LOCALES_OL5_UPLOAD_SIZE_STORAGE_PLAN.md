# Gate OL-5 — Ofertas Locales Upload Size + Storage Readiness Plan

## Current issue

Real supermarket weekly flyer PDFs are rejected client-side at **15 MB** with:
`El archivo es demasiado grande (máx. 15.0 MB para volante).`

Weekly flyer PDFs with many pages/images often exceed 15 MB.

## Current file size limits (before OL-5)

| Type | Limit |
|------|-------|
| Flyer (all) | 15 MB |
| Coupon (all) | 10 MB |

Validator did not differentiate PDF vs image.

## Backend / storage route findings

| Finding | Detail |
|---------|--------|
| Upload API | `POST /api/ofertas-locales/assets/upload` — Vercel Blob `put()` |
| Large files | Vercel Functions body limit **4.5 MB** — server FormData upload cannot accept larger files |
| Storage destination | **Vercel Blob** at `ofertas-locales/drafts/{owner}/{kind}/{assetId}/` — **not Supabase Storage** (Stack 6 decision) |
| Token | `BLOB_READ_WRITE_TOKEN` |
| Draft persistence | Metadata only (`storagePath`, `publicUrl`, `fileName`, `mimeType`, `sizeBytes`) in sessionStorage |
| AI scan | Google Document AI still capped at **15 MB** — unchanged in OL-5 |

## Supabase Storage confirmation

**Blocker documented:** Ofertas Locales draft asset upload uses **Vercel Blob**, not Supabase Storage buckets. Supabase is used for auth (Bearer) and publish/scan DB — not draft file bytes.

Migrating to Supabase Storage is out of scope for OL-5 (no migration, no architecture rewrite).

## Recommended new limits (implemented)

| Asset type | Max |
|------------|-----|
| flyer_pdf | 75 MB |
| flyer_image | 20 MB |
| coupon_pdf | 30 MB |
| coupon_image | 15 MB |

PDF vs image limits supported via MIME → asset type mapping.

## Client + server alignment

- Client validation: type-specific limits + Spanish error copy
- Server FormData route: same validation, rejects > 4.5 MB with 413
- Server client-upload route: `handleUpload` token with `maximumSizeInBytes` per asset type
- Client upload: `@vercel/blob/client` `upload()` with multipart for files > 4.5 MB

## User-facing copy

Step 5 helper box (ES/EN): weekly flyer PDF recommendation, limits, upload-for-review note, honest pending-upload refresh note.

## Persistence impact

None — uploaded metadata fields unchanged. Raw `File` / base64 not stored in sessionStorage.

## What will not be touched

- AI scan algorithm / 15 MB scan cap
- Step 5 source model redesign
- Public results, admin, dashboard, payment
- Supabase migrations
- URL scraping

## QA checklist

- [ ] 20–50 MB flyer PDF passes client validation (no 15 MB message)
- [ ] Upload completes (client-direct path on Vercel)
- [ ] Same-tab refresh keeps uploaded metadata
- [ ] Preview → Volver a editar keeps metadata
- [ ] Unsafe MIME types still rejected
- [ ] AI scan on 75 MB PDF still fails at scan stage (expected until OL-6+)

## Deferred

- Supabase Storage migration (if product requires it)
- AI scan size increase for large PDFs
- English validation error messages in file picker (Spanish default preserved)
