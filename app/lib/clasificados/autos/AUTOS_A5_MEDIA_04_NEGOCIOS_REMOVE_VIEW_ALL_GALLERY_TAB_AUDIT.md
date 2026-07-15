# A5.MEDIA-04 — Autos Negocios Remove View All Gallery Tab Micro Patch Audit

## Gate title

A5.MEDIA-04 — Autos Negocios Remove View All Gallery Tab Micro Patch

## Task classification

MICRO PATCH — Autos Negocios remove View All gallery tab

## PM decision

Remove VIEW ALL tab entirely. Gallery exposes only **PHOTOS** and **VIDEO** tabs. A5.MEDIA-03 multi-video behavior is preserved; A5.MEDIA-04 supersedes the A5.MEDIA-03 VIEW ALL requirement.

## Files changed

- `app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx`
- `app/lib/clasificados/autos/AUTOS_A5_MEDIA_04_NEGOCIOS_REMOVE_VIEW_ALL_GALLERY_TAB_AUDIT.md` (new)
- `scripts/autos-a5-media-04-negocios-remove-view-all-gallery-tab-audit.ts` (new)
- `package.json` (verifier script only)

## Tab behavior result

| Tab | Behavior |
|-----|----------|
| **PHOTOS** | Photo hero + rail only; lightbox uses `photoItems` |
| **VIDEO** | All video thumbs (up to 4); lightbox uses `videoItems` |
| **VIEW ALL** | Removed — no button, count, or code path exposed |

## Modal behavior result

- Photo modal: counter e.g. `1 / 14` within `photoItems`
- Video modal: counter e.g. `Video 1 · 1 / 4` within `videoItems`
- Previous/Next scoped to active tab only
- A5.MEDIA-02 embed/fallback preserved

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos gallery file found | TRUE |
| VIEW ALL tab removed | TRUE |
| PHOTOS tab preserved | TRUE |
| VIDEO tab preserved | TRUE |
| PHOTOS shows photos only | TRUE |
| VIDEO shows videos only | TRUE |
| Modal uses active filtered media set | TRUE |
| Photo modal still works | TRUE |
| Video modal still works | TRUE |
| Previous/Next scoped to active tab | TRUE |
| Counter correct for active tab | TRUE |
| No primary external video navigation | TRUE |
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
2. Confirm only **PHOTOS** and **VIDEO** tabs — no VIEW ALL.
3. PHOTOS tab: images only; open photo modal; counter photo-only.
4. VIDEO tab: all videos; open Video 1; Next through all; counter video-only.
5. Confirm no thumbnail navigates directly to YouTube.
