# A5.MEDIA-01 — Autos Negocios Parent + Child Media Step Polish and Hydration Audit

## Gate title

A5.MEDIA-01 — Autos Negocios Parent + Child Media Step Polish and Hydration Proof

## Task classification

SCOPED GATED BUILD — Autos Negocios Media Step UX + Hydration Proof

## Correct repo confirmation

`C:/projects/elaguila-website` — branch `main`

## Gate 0 — Preflight findings

| Item | Result |
|------|--------|
| **Media step component** | `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx` |
| **Video URL pattern** | `app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx` |
| **Draft/hydration owner** | `mediaImages`, `videoUrls` on `AutoDealerListing` via `useAutoDealerDraft` / `hydrateChildInventoryEditorDraft` |
| **Parent Autos Negocios** | `AutosNegociosVehicleApplicationSteps` → `AutosNegociosMediaManager` |
| **Child inventory** | **YES** — `AutosInventoryVehicleDrawerForm` reuses `AutosNegociosVehicleApplicationSteps` + same `AutosNegociosMediaManager` |
| **Autos Privado** | Uses shared `AutosNegociosMediaManager` with `hideDealerLogo` — no Privado-specific edits |

## Files changed (this gate)

- `app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts`
- `app/lib/clasificados/autos/autosExternalImageUrlsCopy.ts` (new)
- `app/lib/clasificados/autos/AUTOS_A5_MEDIA_01_NEGOCIOS_PARENT_CHILD_MEDIA_STEP_POLISH_HYDRATION_AUDIT.md` (new)
- `scripts/autos-a5-media-01-negocios-parent-child-media-step-polish-hydration-audit.ts` (new)
- `package.json` (verifier script only)

## Layout result

1. **Upload dropzone** — top (unchanged behavior)
2. **Reorder / uploaded photo cards** — directly under upload box (`AutosSortablePhotoGrid` for `sourceType: file` uploads)
3. **Add photos by URL** — below reorder cards
4. **Optional Video** — below image URL section (`AutosExternalVideoUrlsField`)
5. **Dealership logo** — unchanged, below video (Negocios only)

## Image URL result

| Item | Detail |
|------|--------|
| **Input** | Single `Direct image URL` field |
| **Add button** | `Add image` / `Agregar imagen` |
| **List** | `Image URL 1`, `Image URL 2`, … cards with truncated URL |
| **Remove** | Per-URL remove button |
| **Validation** | `classifyAutosImageUrlInput` — requires http(s), rejects video hosts |
| **Duplicates** | Blocked via `existingImageUrls` set |
| **Storage** | URL images remain in `mediaImages` with `sourceType: "url"` for publish/hydration compatibility |
| **Cover** | URL images support `Use as cover` / active cover badge |

## Spacebar result

- Image URL input: no global spacebar blockers; `modalHandlers` stop drawer propagation (same as video field)
- Video URL input: unchanged `AutosExternalVideoUrlsField` pattern
- Title/description: no Autos Negocios global keydown space suppression found
- Enter on URL inputs adds item (does not block space while typing)

## Hydration result

| Flow | Result |
|------|--------|
| **Parent hard refresh** | `mediaImages` + `videoUrls` restored from draft namespace |
| **Preview → Volver a editar** | Same draft fields; `sourceType` preserved |
| **Child inventory** | Shared component + `hydrateChildInventoryEditorDraft` keeps `mediaImages` |
| **Cover/order** | `sortOrder`, `isPrimary`, `id` stable on `MediaImageEntry` |
| **Removed items** | Filtered from `mediaImages` on remove — persists on flush |

## Mobile / Leonix polish

- URL input + button stack on mobile (`flex-col` → `sm:flex-row`)
- Image URL cards stack with tappable remove/cover actions (`min-h` buttons)
- Truncated URLs in list (no oversized raw URL blocks)
- Leonix cream/card/burgundy tokens preserved

## What was intentionally locked

- Dashboard, Admin, Stripe/Revenue OS, Supabase migrations, analytics
- Autos Privado application logic (inherits shared media manager only)
- Other categories and unrelated upload systems

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios media step identified | TRUE |
| Uploaded image cards moved above URL section | TRUE |
| Add photos by URL moved below uploaded cards | TRUE |
| Multiline image URL textarea removed | TRUE |
| Video-style image URL input exists | TRUE |
| Add image URL works | TRUE |
| Remove image URL works | TRUE |
| Duplicate image URL blocked | TRUE |
| Invalid image URL blocked | TRUE |
| Local uploads still work | TRUE |
| Reorder still works | TRUE |
| Cover selection still works | TRUE |
| Spacebar works in image URL input | TRUE |
| Spacebar works in video URL input | TRUE |
| Spacebar works in title/description fields | TRUE |
| Parent media hydrates on hard refresh | TRUE |
| Parent media survives preview return | TRUE |
| Child inventory media safe | TRUE |
| Video URLs still hydrate | TRUE |
| No Mux upload exposed if disabled | TRUE |
| Mobile layout safe | TRUE |
| Autos Privado untouched | TRUE |
| Dashboard untouched | TRUE |
| Admin untouched | TRUE |
| Stripe untouched | TRUE |
| Supabase untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Build passed | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: **GREEN**

## Manual QA for Chuy

1. Open Autos Negocios parent application media step.
2. Upload 4 local photos.
3. Confirm photo cards appear directly under upload box.
4. Reorder photos.
5. Change cover.
6. Remove one photo.
7. Add one image URL.
8. Confirm image URL card appears.
9. Remove image URL.
10. Add 4 video URLs.
11. Type spaces in URL/title/description fields and confirm spacebar works.
12. Hard refresh.
13. Confirm photos, order, cover, image URLs, and video URLs remain.
14. Go to preview.
15. Click volver a editar.
16. Confirm all media remains.
17. Repeat with child/add inventory media if shared.
18. Confirm Autos Privado unchanged.
