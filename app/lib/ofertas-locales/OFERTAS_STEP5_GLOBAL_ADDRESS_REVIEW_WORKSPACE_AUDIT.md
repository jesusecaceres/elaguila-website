# OFERTAS STEP 5 GLOBAL ADDRESS REVIEW WORKSPACE AUDIT

## Files Inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesFormatting.ts`
- `app/lib/ofertas-locales/ofertasLocalesValidation.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`
- `app/api/ofertas-locales/items/route.ts`
- `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts`
- `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts`

## Files Changed

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesFormatting.ts`
- `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts`
- `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesValidation.ts`
- `app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts`
- `app/lib/ofertas-locales/OFERTAS_STEP5_GLOBAL_ADDRESS_REVIEW_WORKSPACE_AUDIT.md`

## Global Address Changes

- Added `country` to the Ofertas draft model, empty draft, session persistence, preview display, and publish draft snapshot.
- City remains free text.
- State/province/region is no longer normalized to a two-letter US code.
- ZIP/postal code now accepts letters, numbers, spaces, and hyphens instead of US-only five digits.
- Copy now says: “Enter the city, state/province, country, and postal code customers should use to find this offer.” / “Ingresa la ciudad, estado/provincia, país y código postal que los clientes deben usar para encontrar esta oferta.”
- Existing DB columns still support `city`, `state`, and `zip_code`; first-class `country` is not in the production column contract, so country is preserved in `draft_snapshot.location` until a schema gate adds a column/search filter.

## Coupon Collapse Changes

- Step 5 weekly flyer flow now labels the primary section “Main flyer” / “Volante principal”.
- Main helper tells users to upload the full weekly flyer first.
- Coupons/supporting files are behind a collapsed optional panel: “Want to add coupons or extra files?” / “¿Quieres agregar cupones o archivos adicionales?”
- Existing coupon/additional upload components remain mounted when collapsed, so component-local pending upload state is not discarded.

## Review Workspace Changes

- Mobile order now places review/editor before the large flyer viewer.
- Desktop keeps a two-column source viewer plus review workspace, but narrows the viewer and gives the editor more room.
- Selected item editor is moved above item navigation and queue.
- Page cards are shorter and more compact.
- Product rows remain compact with title, price, page, clip state, and review status.
- Page lock and Step 5 lock logic were preserved.

## Clip / Source Crop URL Audit

Code path:

- Scan crop generator writes `source_crop_url` when crop upload succeeds.
- Items API selects `*` from `oferta_local_items`.
- `mapOfertaLocalItemReviewRowToViewModel()` maps `source_crop_url` to `sourceCropUrl`.
- UI prefers `sourceCropUrl` before any fallback.

Live SQL finding from production scan `7e28ca86-819f-4d45-bafd-160e345c5698`:

- 125 total rows.
- 125 rows with `source_bbox`.
- 0 rows with `source_crop_url`.
- 125 rows with bbox but no crop URL.
- Scan job error shows `PNG rasterization unavailable` and `crop: page_1_no_raster_image`.

Fix applied:

- Removed the server-side PDF.js worker `createRequire()` path from PDF rasterization.
- Added `disableWorker: true` to the PDF.js `getDocument()` call so Vercel/serverless can render with `@napi-rs/canvas` without loading `pdf.worker.mjs`.
- UI wording is now truthful: real crop URL means clip ready; bbox with no crop means AI found the item location but product clip is not ready; no bbox/crop says “No product clip or location available yet.”

Remaining proof needed:

- Run a fresh production scan after deploy.
- Confirm `PAGE_RENDER_SUCCESS`, `CROP_EXTRACTION_SUCCESS`, `STORAGE_UPLOAD_SUCCESS`, and non-empty `source_crop_url` rows.

## Brand Polish Mapping

- Cream/ivory cards and backgrounds remain local to Ofertas.
- Burgundy primary actions and active page/item states.
- Bronze/gold borders, optional cards, chips, and dividers.
- Charcoal text for body/headings.
- Restrained green only for ready/success states.
- Rectangular, premium controls preserved.

## Mobile / PWA Result

- Step 5 optional files no longer create a large distraction before scan/review.
- On mobile, users see scan/status, page cards, and the selected item editor before the large PDF/flyer viewer.
- Product queue is compact and scrollable.
- Buttons remain thumb-friendly.

## Production QA Instructions

1. Open `/publicar/ofertas-locales?lang=en`.
2. Verify city, state/province/region, country, and ZIP/postal code accept global values like `Toronto`, `Ontario`, `Canada`, `K1A 0B1`.
3. Reach Step 5.
4. Confirm “Main flyer” is primary.
5. Confirm optional coupons/additional files are collapsed by default.
6. Upload the weekly flyer PDF.
7. Run AI scan.
8. Select a Page 1 item.
9. Confirm selected item editor is visible before the queue on mobile.
10. Confirm clip label is truthful.
11. Approve/reject one Page 1 item.
12. Confirm Page 2 remains locked until Page 1 is complete.
13. Complete current-scan review to reach Preview.
14. Confirm Preview remains approved-only.
15. After deploy, run SQL for `source_crop_url` proof.

## Remaining Blockers

- Production country is preserved in `draft_snapshot.location`, not a first-class searchable column. Add `country` only in a separate schema/search gate.
- Production crop proof requires a fresh deployed scan after the PDF.js workerless raster fix.
- No Stripe or analytics work was done in this gate.

## TRUE/FALSE Table

| Requirement | TRUE/FALSE/PARTIAL | Evidence |
|---|---:|---|
| Global city free input | TRUE | Step 4 city remains free text |
| Global state/province free input | TRUE | State normalization no longer forces 2 letters |
| Country field exists | TRUE | `OfertaLocalDraft.country` and Step 4 input |
| Postal code accepts international formats | TRUE | `normalizeOfertaLocalPostalCodeInput()` |
| NorCal suggestions are optional only | TRUE | Copy says examples are not limits |
| Location maps to draft state | TRUE | `OfertaLocalDraft` + session persistence |
| Location maps to preview payload | TRUE | Preview location line includes country |
| Location maps to publish payload | PARTIAL | city/state/postal use existing columns; country stored in `draft_snapshot.location` |
| Coupon/additional files collapsed by default | TRUE | Optional panel state defaults closed |
| Main flyer remains primary | TRUE | Main flyer section title/helper |
| Existing coupon functionality preserved | TRUE | Existing upload components retained |
| Review workspace has clear flyer viewer | TRUE | Source viewer remains available |
| Review workspace has visible selected item form | TRUE | Editor moved above queue |
| Product queue is compact | TRUE | compact scroll list |
| Page cards are compact | TRUE | shorter page cards |
| Page 2 lock still works | TRUE | existing lock logic preserved |
| Step 5 lock still works | TRUE | gate state unchanged |
| `source_crop_url` passthrough audited | TRUE | API/mapper/UI path verified |
| `source_crop_url` API/client mapping fixed or verified | TRUE | mapping verified; raster bug fixed |
| Clip-ready label only appears with real URL | TRUE | UI checks `sourceCropUrl` |
| Clip pending/fallback is honest | TRUE | copy updated |
| No fake clips | TRUE | no placeholder URLs added |
| Leonix cream/burgundy/gold/charcoal applied | TRUE | local classes retained/refined |
| Mobile layout puts form before giant viewer | TRUE | workspace order changed |
| No unrelated categories touched | TRUE | Ofertas-only scope |
| Stripe untouched | TRUE | no Stripe files touched |
| Analytics untouched | TRUE | no analytics files touched |
| Build passed | PENDING | run after implementation |
