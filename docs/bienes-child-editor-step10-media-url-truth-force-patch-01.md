# Bienes Child Editor Step 10 Media + URL Truth Force Patch

## User Browser Proof

After the prior Step 10 fix, production still showed:

1. Step 3: 5 child photos visible after hard refresh.
2. Video/listing/tour/brochure URL fields missing or inconsistent after hard refresh.
3. Step 10 Property preview card still showed **No photo**.
4. Parent final inventory card showed cover + **5 photos**.
5. Main preview inventory card showed cover + **5 photos**.

## Root Cause

1. **`applyLiveChildEditorFieldsToPreviewDraft`** copied stale `mediaSynced.photoUrls`, `videoUrl`, and URL fields from merged draft/bridge instead of live editor `propertyForm`, so Step 10 could show zero photos while Step 3 had photos.
2. **`mediaSlice` spread order** let stale draft media beat live editor `videoUrls` and URL text fields.
3. **`durableHttpUrl`** stripped non-`http(s)` URL text (e.g. pasted YouTube paths), causing video/tour/brochure/listing fields to disappear on merge/rehydration.
4. **`mergeChildInventoryWithMediaBridge`** re-applied after live merge could reintroduce stale empty media unless live editor priority ran again at the end.

## Files Changed

- `brNegocioChildInventoryFormMapping.ts` — live editor media priority, `preserveUrlText`, re-apply live after bridge
- `brNegocioAdditionalInventoryDraft.ts` — URL text preservation in `syncChildInventoryDraftMedia`
- `brNegocioChildInventoryEditorSession.ts` — normalize/persist plain URL text across hard refresh
- `brNegocioInventoryCardModel.ts` — photoUrls fallback + Step 10 live photo safety net
- `BrNegocioChildInventoryFullApplication.tsx` — apply live photo fallback on Step 10 card

## Live Editor Priority Rule

Priority order (forced in `buildLiveChildInventoryPreviewDraft`):

1. Current editor state media fields (`fotosDataUrls`, `fotoPortadaIndex`, `videoUrls`, `videoUrl`, `tourUrl`, `brochureUrl`, `listadoUrl`)
2. Resolved IDB inline of current editor state
3. Initial saved draft only when live field is empty
4. Media bridge only when live + initial draft are empty

Live fields are applied **after** media bridge merge so stale bridge cannot overwrite.

## Step 10 Card Fallback Rule

If `mapAdditionalDraftToInventoryCard` returns empty `photoUrl` but live editor `fotosDataUrls` has displayable photos, `applyLiveEditorPhotosToInventoryCard` patches cover + count from live state. No parent photos substituted.

## URL Persistence Rule

- Session persistence keeps plain URL text (`videoUrls`, `videoUrl`, `listadoUrl`, `tourUrl`, `brochureUrl`).
- Only heavy blobs stripped: `videoDataUrl`, `tourDataUrl`, `brochureDataUrl`, `listadoArchivoDataUrl`, image `data:` moved to IDB.
- `normalizeSessionPropertyFormUrls` rebuilds `videoUrl` from `videoUrls[0]` on load.

## Manual QA Checklist

- [ ] Add 5 child photos.
- [ ] Add listing URL.
- [ ] Add 4 video URLs.
- [ ] Add tour URL.
- [ ] Add brochure URL.
- [ ] Hard refresh in child editor.
- [ ] Confirm Step 3 shows all photos and all URLs.
- [ ] Go to Step 10.
- [ ] Confirm Property preview card shows cover image + 5 photos.
- [ ] Click Preview this property — full preview matches media/URLs.
- [ ] Save and go parent review — parent child card shows cover + 5 photos.
- [ ] Open main preview — child card shows cover + 5 photos.
- [ ] Only then continue publish QA.

## What Was Not Touched

Stripe, Revenue OS, webhooks, Supabase/schema, auth, admin, dashboard, public results/detail, Autos, unrelated categories, `.env`/secrets.
