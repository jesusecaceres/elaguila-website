# A5.MEDIA-03 — Autos Negocios Gallery Tabs Show All Videos Micro Patch Audit

## Gate title

A5.MEDIA-03 — Autos Negocios Gallery Tabs Show All Videos Micro Patch

## Task classification

MICRO PATCH — Autos Negocios gallery tab filtering + all video URLs in lightbox

## Root cause

`buildAutosGalleryLightboxItems` only appended `getListingVideoUrls(data)[0]`, and `AutoGallery` rendered a single `VideoWalkaroundThumb` in the sidebar. Tabs did not filter media sets — they only jumped the lightbox to one combined index, so VIDEO tab and VIEW ALL showed one video and counters like `15/15` instead of `14 photos + 4 videos`.

## Files changed

- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/lib/clasificados/autos/autosGalleryLightbox.ts`
- `app/lib/clasificados/autos/AUTOS_A5_MEDIA_03_NEGOCIOS_GALLERY_TABS_ALL_VIDEOS_AUDIT.md` (new)
- `scripts/autos-a5-media-03-negocios-gallery-tabs-all-videos-audit.ts` (new)
- `package.json` (verifier script only)

## Media array result

| Array | Contents |
|-------|----------|
| `photoItems` | All image URLs from `deriveHeroImageUrls` |
| `videoItems` | Up to 4 classified videos from `getListingVideoUrls`, labeled Video 1–4 |
| `allItems` | `photoItems` + `videoItems` |

## Tab behavior result

| Tab | Grid | Lightbox set | Count |
|-----|------|--------------|-------|
| **PHOTOS** | Hero + photo rail only | `photoItems` | `photoItems.length` |
| **VIDEO** | 2×2 / scroll grid of all video thumbs | `videoItems` | `videoItems.length` |
| **VIEW ALL** | Hero + photo rail + all video thumbs | `allItems` | `allItems.length` |

## Modal behavior result

- Video #1 in VIDEO tab → index `0` of `videoItems`
- Video #4 in VIDEO tab → index `3` of `videoItems`
- Previous/Next navigates within `activeItems` for the active tab
- Counter: e.g. `Video 2 · 2 / 4` on VIDEO tab; `15 / 18` on VIEW ALL when 14 photos + 4 videos

## Embed / fallback

A5.MEDIA-02 preserved: YouTube, Shorts, youtu.be embed in modal; unsupported platforms show in-modal message + secondary external link; thumbnail click is always a button opening lightbox.

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos gallery file found | TRUE |
| All video URLs mapped | TRUE |
| VIDEO tab shows all videos | TRUE |
| PHOTOS tab shows only photos | TRUE |
| VIEW ALL shows photos and videos | TRUE |
| Modal uses active filtered media set | TRUE |
| Video #1 opens modal | TRUE |
| Video #4 opens modal | TRUE |
| Previous/Next works in VIDEO tab | TRUE |
| Counter correct for VIDEO tab | TRUE |
| YouTube Shorts embed | TRUE |
| No primary external navigation | TRUE |
| Photos still work | TRUE |
| Autos Privado untouched | TRUE |
| Dashboard untouched | TRUE |
| Admin untouched | TRUE |
| Stripe untouched | TRUE |
| Supabase untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: **GREEN**

## Manual QA for Chuy

1. Open Autos Negocios preview with 14 photos + 4 video URLs.
2. PHOTOS tab — only photos; open photo modal; counter e.g. `1 / 14`.
3. VIDEO tab — all 4 video thumbs; open Video 1; Next through Video 4; counter `1/4` … `4/4`.
4. VIEW ALL — photos + 4 videos; open a video; counter reflects full set (e.g. `15 / 18`).
5. Confirm no thumbnail navigates directly to YouTube.
6. Confirm Autos Privado preview unchanged (shared `AutoGallery` only).
