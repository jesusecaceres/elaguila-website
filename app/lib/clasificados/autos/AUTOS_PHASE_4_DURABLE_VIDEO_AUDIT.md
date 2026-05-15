# Autos Phase 4 — Durable video / Mux publish

**Scope:** Optional Autos listing video must not rely on `videoFileDataUrl`, blob URLs, or non-durable `data:` payloads after publish. Local preview remains allowed before publish. **Servicios / other categories were not modified** (Mux client is imported read-only from existing browser helper).

---

## 1. Files inspected

| Area | Paths |
|------|--------|
| Draft video UI | `AutosNegociosMediaManager.tsx`, `autosPrivadoDraftStorage.ts`, `autosNegociosDraftStorage.ts` |
| Types / normalize | `autoDealerListing.ts`, `autoDealerDraftDefaults.ts`, `autosNegociosDraftGuards.ts` |
| Preview / public gallery | `AutoGallery.tsx`, `AutoDealerPreviewPage.tsx`, `AutoPrivadoPreviewPage.tsx`, `AutosLiveVehicleClient.tsx` |
| Publish confirm | `AutosPublishConfirmCore.tsx` |
| Persistence | `autosListingPayloadPersistence.ts`, `autosClassifiedsListingService.ts` |
| Mux reuse | `app/api/mux/direct-upload/route.ts`, `app/api/mux/upload-status/route.ts`, `serviciosMuxVideoClient.ts` (read-only import via Autos wrapper) |
| Video helpers | `autoDealerVideo.ts`, `muxVideoLifecycle.ts` |

---

## 2. Existing Autos video field finding

- **`videoUrl`**, **`videoSourceType`** (`url` \| `file` \| null), **`videoFileDataUrl`** (draft/local), **`videoFileName`**, **`videoUploadStatus`**
- **`muxPlaybackId`**, **`muxAssetId`**, **`muxThumbnailUrl`**, **`muxPlaybackUrl`** (persisted after successful Mux upload)
- **`autosVideoPublishDiagnostics`** — optional last Mux attempt / error code for ops/debug (not fake playback)

---

## 3. Existing media/Mux infrastructure finding

- Global **`POST /api/mux/direct-upload`** and **`GET /api/mux/upload-status`** already power Servicios/Rentas flows.
- Autos adds **`autosMuxVideoClient.ts`** → **`uploadServiciosGalleryVideoFileToMux`** (slot `0`) without editing Servicios source.
- **`autosMuxPublishPrepare.ts`** runs in the browser on publish click: optional file → Mux → merge IDs + HLS URL into listing before PATCH/checkout.

---

## 4. Publish persistence finding

- **`sanitizeAutosListingPayloadForPersistence`** always clears **`videoFileDataUrl`** and strips **`videoUrl`** when `blob:` / `data:`.
- **`omitAutosInlineVideoForApiPayload`** removes inline video bytes from confirm **`POST`/`PATCH`** JSON so requests stay small.
- **`stripDraftMuxFields` removed from `autosClassifiedsListingService`** so **`muxPlaybackId` / `muxAssetId`** persist on real rows after publish.

---

## 5. Public detail video rendering finding

- **`AutosLiveVehicleClient`** passes **`publicPlaybackOnly`** into preview shells.
- **`AutoGallery`** with **`publicPlaybackOnly`**: uses **`resolvePublishedAutosVideoPlayback`** — HLS via **`hls.js`** (Chrome/Firefox) or native Safari; external links for YouTube/Vimeo; **never** reads **`videoFileDataUrl`** on that path.

---

## 6. What changed

- Client Mux upload before checkout + durable fields + diagnostics + UI warnings on failure.
- Public gallery playback path hardened for durable URLs only.
- DB persistence retains Mux metadata; sanitizer blocks inline/blob video in payload.

---

## 7. Build/check result

Latest gate run (implementation pass): **`npm run autos:phase1-audit` … `npm run autos:phase4-audit`**, **`npm run autos:enforce-smoke`**, **`npm run lint`**, **`npm run build`**, **`npm run verify:autos:e2e`** — all exited **0**.

---

## 8. Remaining risks

- **Mux env**: Missing **`MUX_*`** credentials → upload fails; listing still publishes without video (warning shown).
- **Unpublish / asset delete**: Autos does not yet call Mux delete on unpublish (same gap as other categories unless wired elsewhere).

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Autos preview can still use local video before publish | TRUE (code) | Draft `AutoGallery` without `publicPlaybackOnly`; draft storage unchanged |
| Final publish payload avoids videoFileDataUrl | TRUE (code) | Sanitizer + `omitAutosInlineVideoForApiPayload` + Mux merge clears inline bytes |
| Final publish payload avoids giant base64/blob video | TRUE (code) | Same + blob/data `videoUrl` stripped at sanitize / prepare |
| Published public listing does not depend on local/blob video | TRUE (code) | `publicPlaybackOnly` + `resolvePublishedAutosVideoPlayback` |
| Durable video fields are used publicly if available | TRUE (code) | `muxPlaybackId` → HLS `stream.mux.com/...m3u8` |
| Mux/upload infrastructure was reused if available | TRUE (code) | `/api/mux/*` + `uploadServiciosGalleryVideoFileToMux` via Autos wrapper |
| Video failure does not block publish unless video is required | TRUE (code) | Optional video; failures clear video and continue PATCH/checkout |
| Video failure is surfaced as warning/diagnostic if applicable | TRUE (code) | Confirm-page banner + `autosVideoPublishDiagnostics` on payload |
| Listing still publishes without optional video | TRUE (code) | Same flow |
| No fake video playback was added | TRUE (code) | Only real Mux IDs / real https URLs |
| No unrelated categories were touched | TRUE (code) | Diff limited to allowed Autos paths + wrapper |
| npm run build passed | TRUE (runtime) | See §7 |
