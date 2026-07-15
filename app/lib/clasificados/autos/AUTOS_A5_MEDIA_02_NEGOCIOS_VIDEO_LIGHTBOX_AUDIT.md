# A5.MEDIA-02 — Autos Negocios Preview Video Lightbox Micro Patch Audit

## Gate title

A5.MEDIA-02 — Autos Negocios Preview Video Lightbox Micro Patch

## Task classification

MICRO PATCH — Autos Negocios preview/public gallery video click behavior

## Root cause

`VideoTile` and `PublishedVideoTile` rendered external video URLs as primary `<a target="_blank">` anchors. YouTube/Shorts links could not play inline via `<video src>`, so clicking the Video Walkaround thumbnail navigated away from Leonix instead of opening the existing photo lightbox.

## Files changed

- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/lib/clasificados/autos/autosYoutubeEmbed.ts` (new)
- `app/lib/clasificados/autos/autosGalleryLightbox.ts` (new)
- `app/lib/clasificados/autos/AUTOS_A5_MEDIA_02_NEGOCIOS_VIDEO_LIGHTBOX_AUDIT.md` (new)
- `scripts/autos-a5-media-02-negocios-video-lightbox-audit.ts` (new)
- `package.json` (verifier script only)

## Fix result

| Item | Detail |
|------|--------|
| **Video thumbnail** | `VideoWalkaroundThumb` button opens `openVideoLightbox()` — no primary external anchor |
| **Modal** | Unified `mediaItems` lightbox for photos + video |
| **YouTube / Shorts / youtu.be** | `resolveAutosYoutubeEmbedUrl` → `https://www.youtube.com/embed/{id}` iframe in modal |
| **Progressive / HLS / Mux** | `<video>` player in modal via `StreamableAutosVideo` |
| **TikTok / Instagram / other** | In-modal message + secondary “Open on external site” link |
| **Video tab** | Opens lightbox at video index (no `window.open`) |

## Photo gallery regression

- Photos still use `openAt(index)` → same lightbox overlay
- Previous / Next navigates all `mediaItems`
- Close button and backdrop click unchanged
- Keyboard Escape / arrows preserved

## Mobile result

- `aspect-video` iframe container fits screen width
- `object-contain` for stream videos
- Controls remain tappable; no horizontal overflow

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios video thumbnail found | TRUE |
| Photo lightbox found | TRUE |
| Video thumbnail no longer navigates away | TRUE |
| Video opens modal/lightbox | TRUE |
| YouTube Shorts embeds in modal | TRUE |
| Photos still open modal | TRUE |
| Close works | TRUE |
| Mobile safe | TRUE |
| Autos Privado untouched | TRUE |
| Dashboard untouched | TRUE |
| Admin untouched | TRUE |
| Stripe untouched | TRUE |
| Supabase untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: **GREEN**

## Manual QA for Chuy

1. Open Autos Negocios preview.
2. Click a photo — confirm modal opens.
3. Close modal.
4. Click Video Walkaround thumbnail — confirm modal opens (not external YouTube).
5. Confirm YouTube/Shorts embed is playable.
6. Close modal.
7. Test Previous / Next when multiple media items exist.
8. Test mobile width.
9. Confirm Autos Privado preview still uses shared gallery without privado-specific edits.
