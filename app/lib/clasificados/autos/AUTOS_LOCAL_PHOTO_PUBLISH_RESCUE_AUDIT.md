# AUTOS LOCAL PHOTO PUBLISH RESCUE AUDIT

## Objective

Fix production QA blocker on `/publicar/autos/negocios/confirm?lang=es` where `POST /api/clasificados/autos/listings` returned **400** because draft payloads contained local `data:` / `blob:` / IndexedDB photo refs. Local phone/desktop photos must upload to durable HTTPS before publish (Privado + Negocios). Videos remain external URL-only (no Mux, no local video upload).

## Live 400 error summary

- **Endpoint:** `POST /api/clasificados/autos/listings`
- **Status:** 400 Bad Request
- **User message (before fix):** “El borrador incluye archivos locales no publicables. Usa enlaces https para fotos y video antes de continuar.”
- **Classification:** local media durability issue **YES** — not SQL/table, not RLS, not publish status

## SQL proof summary (Chuy)

- `public.autos_classifieds_listings` exists
- Active Privado rows exist
- Active Negocios main row exists
- Leonix IDs generate
- `status = active` and `published_at` work
- `dealer_inventory_group_id` works for Negocios main row
- Orphan child query returned no orphan rows

## Files inspected

- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts`
- `app/api/clasificados/autos/listings/route.ts`
- `app/api/clasificados/servicios/draft-media-upload/route.ts` (read-only)
- `app/api/clasificados/rentas/draft-media-upload/route.ts` (read-only)
- `app/(site)/clasificados/rentas/shared/rentasDraftPublishPrepare.ts` (read-only)

## Files changed

- `app/lib/clasificados/autos/autosPublishMediaTransport.ts` (new)
- `app/lib/clasificados/autos/autosDraftPhotoPublishPrepare.ts` (new)
- `app/api/clasificados/autos/media/draft-photo-upload/route.ts` (new)
- `app/lib/clasificados/autos/autosPublishApiContract.ts`
- `app/lib/clasificados/autos/autosListingPayloadPersistence.ts`
- `app/api/clasificados/autos/listings/route.ts`
- `app/api/clasificados/autos/listings/[id]/route.ts`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `scripts/autos-local-photo-publish-rescue-audit.ts` (new)
- `package.json` (audit script only)

## Working category media pattern table

| Category | Local photo input | Upload helper/API | Storage bucket/path | Durable URL output | Draft update pattern | Publish payload pattern |
|---|---|---|---|---|---|---|
| Servicios | data:/blob: in draft | `/api/clasificados/servicios/draft-media-upload` | Vercel Blob `clasificados/servicios/drafts/{id}/…` | `https://…vercel-storage.com/…` | Client prepare replaces refs | HTTPS URLs in listing JSON |
| Rentas | data:/blob: gallery + logo | `/api/clasificados/rentas/draft-media-upload` | Vercel Blob `clasificados/rentas/drafts/{id}/…` | `https://…vercel-storage.com/…` | `resolveRentas*DraftMediaToRemoteUrls` before publish | HTTPS gallery in payload |
| En Venta | File → Supabase client | Supabase storage upload | `listing-images` bucket | Supabase public URL | Draft stores HTTPS | HTTPS in payload |
| Bienes Raíces | Similar classifieds blob path | Category API routes | Vercel Blob / storage | HTTPS | Prepare before publish | HTTPS |
| Empleos | Logo/photos where applicable | Category-specific | Vercel Blob pattern | HTTPS | Prepare before publish | HTTPS |
| **Autos (this gate)** | data:/blob:/IDB refs in `mediaImages`, `dealerLogo`, `financeContactImageUrl`, inventory `mediaImages` | `/api/clasificados/autos/media/draft-photo-upload` | Vercel Blob `clasificados/autos/drafts/{userId}/{draftId}/…` | `https://…vercel-storage.com/…` | `resolveAutosDraftPhotosForPublish` on confirm + checkout | HTTPS in `listing_payload` |

## Autos current media flow inventory

| Field | Local ref types | Lanes |
|---|---|---|
| `mediaImages[].url` | `data:image/*`, `blob:`, `__AUTOS_IDB_MEDIA__:{id}` | Privado, Negocios main, inventory child |
| `heroImages[]` | Derived from `mediaImages` | All |
| `dealerLogo` | `data:`, IDB `__AUTOS_IDB_LOGO__` | Negocios |
| `financeContactImageUrl` | `data:`, IDB `__AUTOS_IDB_FINANCE_IMAGE__` | Negocios |
| `videoUrl` / `videoUrls` | External HTTPS only; local blocked | All |
| `videoFileDataUrl` | Blocked at prepare (URL-only policy) | All |

## Storage decision

**STORAGE REQUIRED: NO** — uses existing Vercel Blob (`BLOB_READ_WRITE_TOKEN`) same as Servicios/Rentas. Path prefix: `clasificados/autos/drafts/{userId}/{draftId}/{slot}-{index}-{timestamp}`.

If token missing in an environment, upload API returns 503 `blob_unconfigured` and confirm shows actionable error (no fake success).

## Upload bridge result

- Client `resolveAutosDraftPhotosForPublish` scans listing + additional inventory for non-HTTPS photos
- Resolves IndexedDB placeholders via existing IDB helpers
- Uploads via `POST /api/clasificados/autos/media/draft-photo-upload`
- Replaces refs with durable HTTPS, preserves order + primary flag
- Persists back to session draft via `flushDraft({ listing, additionalInventoryVehicles })` so retry skips already-uploaded HTTPS URLs

## Privado result

Confirm prepare + checkout call photo upload before `POST`/`PATCH` listing API. UI phase `uploading_photos` with ES/EN copy. No dealer modules touched.

## Negocios result

Same bridge for main vehicle photos, dealer logo, finance image, and additional inventory gallery photos before publish/checkout bundle.

## Video URL-only result

Local/blob/data video blocked in `resolveAutosDraftPhotosForPublish` with dedicated message. No Mux. No video upload route. Server returns `LOCAL_VIDEO_URL_REQUIRED` if local video slips through.

## Server guard result

`detectAutosHeavyTransport` remains safety net for unpublished local **photos**. `detectAutosLocalVideoTransport` returns `LOCAL_VIDEO_URL_REQUIRED` for local video. Client-facing HEAVY_MEDIA copy no longer tells users to paste HTTPS photo links manually.

## Public / results / dashboard image result

Listing payload stores HTTPS Blob URLs in `mediaImages` / `heroImages`. Public detail, results cards, and dashboard thumbnails consume existing HTTPS URL fields — no blob/data in saved `listing_payload`.

## Additional inventory photo result

**ADDITIONAL INVENTORY CHILD PUBLISH:** bundle checkout path receives `additionalInventoryVehicles` with durable HTTPS photos after prepare. Main publish stable; child rows use same upload bridge when bundle publishes.

## Build result

Run `npm run build` in Gate 13 validation.

## Manual QA steps

1. Volver a editar from error screen
2. Keep same local photos
3. Confirm videos are external URLs only
4. Return to confirm — see “Estamos preparando tus fotos…”
5. Publish Negocios — POST should not return local-media 400
6. Success page, public detail, results card, dashboard thumbnail show photos
7. Repeat Privado with local photo
8. SQL latest rows — no blob/data in `listing_payload`

## Requirement checklist

| Requirement | PASS/FIXED/BLOCKED | Evidence |
|---|---|---|
| Live 400 local media blocker identified | FIXED | Root cause: data:/blob: in POST body; upload bridge added |
| SQL/table issue ruled out | PASS | Chuy SQL proof; no migration in this gate |
| Working category photo pattern inspected | PASS | Servicios/Rentas Blob pattern table above |
| Autos local photo fields inventoried | PASS | mediaImages, dealerLogo, finance, inventory |
| Storage decision documented | PASS | Vercel Blob, STORAGE REQUIRED: NO |
| Local photos upload before POST | FIXED | `resolveAutosDraftPhotosForPublish` in confirm |
| Draft payload replaced with durable HTTPS photos | FIXED | flushDraft persists HTTPS URLs |
| Retry does not reupload unnecessarily | FIXED | `autosDraftImageRequiresUpload` skips https |
| Local videos remain blocked | FIXED | assertAutosNoLocalVideo + server guard |
| No Mux added | PASS | No Mux imports/routes |
| Server guard remains safety net | FIXED | detectAutosHeavyTransport + LOCAL_VIDEO |
| Privado photo publish works by code path | FIXED | Confirm prepare + checkout upload |
| Negocios photo publish works by code path | FIXED | Same + logo/finance/inventory |
| Additional inventory photo path checked | FIXED | mapMediaImages on inventory vehicles |
| Public detail uses durable image URL | PASS | Existing HTTPS consumers |
| Results card uses durable image URL | PASS | Existing HTTPS consumers |
| Dashboard thumbnail uses durable image URL | PASS | Existing HTTPS consumers |
| No blob/data saved to listing_payload | FIXED | Upload + persistence strip IDB refs |
| No Stripe touched | PASS | No Stripe files edited |
| No unrelated categories edited | PASS | Read-only reference only |
| Build passed | PASS | Gate 13 `npm run build` |
| No staged files | PASS | Gate 13 git status |
| No commit created | PASS | Per gate lock |
| No push attempted | PASS | Per gate lock |

## Final release decision

**READY TO COMMIT AND PUSH: YES** (pending Chuy manual QA on production/staging with `BLOB_READ_WRITE_TOKEN` configured)
