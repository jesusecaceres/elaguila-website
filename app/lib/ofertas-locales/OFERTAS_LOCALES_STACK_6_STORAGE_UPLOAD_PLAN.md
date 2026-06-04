# Stack 6 — Ofertas Locales — Storage Upload Plan (Gate A)

## 1. Existing storage/upload pattern found

| Pattern | Location | Notes |
|---------|----------|-------|
| **Vercel Blob draft upload** | `app/api/clasificados/comida-local/draft-media-upload/route.ts` | `put()` from `@vercel/blob`, `BLOB_READ_WRITE_TOKEN`, public HTTPS URL |
| **Bearer auth resolver** | `app/api/_lib/bearerUser.ts`, `comidaLocalPublishServerAuth.ts` | `Authorization: Bearer <access_token>` → Supabase `getUser()` |
| **Client FormData upload** | `comidaLocalDraftMediaUpload.ts` | `fetch('/api/...', { method: 'POST', body: form })` |
| **Stack 5 client validation** | `ofertasLocalesClientUploadValidation.ts` | MIME + size for flyer/coupon |
| **Supabase storage** | Publish flows (`listing-images` bucket) | Used at **publish** time, not draft blob upload |

**Recommendation:** Mirror **Comida Local Vercel Blob draft-media-upload** for Ofertas Locales assets (PDF + images). Do **not** use Supabase storage for this stack.

## 2. Recommended implementation path

1. **Server route:** `POST /api/ofertas-locales/assets/upload`
2. **Auth:** Require `getBearerUserId(req)` — **401 if missing** (stricter than comida-local anon fallback).
3. **Storage:** Vercel Blob `put()` with `access: "public"`, `addRandomSuffix: true`.
4. **Client:** `uploadOfertaLocalDraftAsset()` sends FormData + Bearer token from Supabase session.
5. **Draft:** Store returned `storagePath`, `publicUrl`, `fileName`, `mimeType`, `sizeBytes` in `OfertaLocalDraftAsset` (localStorage metadata only).

## 3. Storage bucket/path recommendation

No new Supabase bucket. Vercel Blob pathname prefix:

```
ofertas-locales/drafts/{ownerUserId}/{assetKind}/{assetId}/{uuid}-{safeFileName}
```

- `assetKind`: `flyer` | `coupon`
- `ownerUserId`: sanitized Supabase user UUID
- `assetId`: draft asset id from client
- Filename sanitized; extension allowlist: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`

## 4. Security guardrails

| Risk | Mitigation |
|------|------------|
| Unauthenticated upload | **401** unless Bearer resolves to user id |
| Path traversal | `sanitizeOfertaLocalStorageSegment()` strips `/\?%*` etc. |
| Overwriting files | UUID + `addRandomSuffix: true` on Blob put |
| Public vs private | Public blob URLs (same as comida-local drafts) — acceptable for marketing flyers |
| MIME spoofing | Server validates `content-type` against Stack 5 allowlist |
| Oversized uploads | Server enforces Stack 5 MB limits |
| Executable types | Reject non-PDF/image MIME; extension allowlist |
| DB offer records | **No** database writes in upload route |

## 5. Gate B/C implementation scope

**Gate B:** `ofertasLocalesStoragePaths.ts`, upload types, API route, server auth helper.

**Gate C:** Draft UI “Upload file” action, uploading state, preview uploaded metadata, stack audit + build.

## 6. Pending for publish (out of scope)

- Supabase `listing-images` mirror at publish time
- Public Ofertas Locales results/detail pages
- Database offer records
- Checkout / Stripe
- Analytics events

## Gate A STOP condition

**Not triggered.** Safe Vercel Blob + Bearer auth pattern exists and is production-used by Comida Local.
