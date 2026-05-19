# A5.0 — Autos Negocios Missing Publish-Blocker Fixes

## 1. Files inspected

| Area | Primary files |
|------|----------------|
| Vehicle identity | `AutosVehicleIdentityFields.tsx`, `autosVehicleTaxonomy.ts`, `autoDealerTitle.ts` |
| Engine | `AutosVehicleEngineField.tsx`, `autosVehicleEngineOptions.ts` |
| Negocios form | `AutosNegociosApplication.tsx`, `useAutoDealerDraft.ts`, `autosNegociosCopy.ts` |
| Structured address | `AutosDealerStructuredAddressFields.tsx`, `autosDealerStructuredAddress.ts` |
| Dealer logo | `AutosDealerLogoUpload.tsx`, `AutosNegociosMediaManager.tsx` |
| Media / photos | `AutosNegociosMediaManager.tsx`, `autoDealerHeroImages.ts` |
| Preview / public | `DealerBusinessStack.tsx`, `VehicleSpecsGrid.tsx`, `AutoDealerPreviewPage.tsx` |
| Persistence / search | `autoDealerDraftDefaults.ts`, `mapAutosClassifiedsToPublic.ts`, `autosListingDisplayIdentity.ts` |
| Inventory prefill | `autosDealerInventoryAddFlow.ts` |

## 2. Vehicle identity dropdown finding

Year, make, and model use controlled `<select>` elements via `AutosVehicleIdentityFields`. Trim uses a `<select>` when curated trims exist for make/model; otherwise free-text with manual fallback. Make/model are not filtered by year (static US catalog — no year→make API).

## 3. Trim/engine normalization finding

- Trim: catalog values from `TRIMS_BY_MAKE_MODEL`; custom trim stored in `trim` only (no separate filter facet for trim today).
- Engine: `engineNormalized` set when a catalog engine is chosen; custom motor clears `engineNormalized` so browse filters are not polluted. Search blurbs include display + raw engine text.

## 4. Structured address/maps finding

Dealer business address fields: `dealerStreetNumber`, `dealerStreetName`, `dealerUnitOrSuite`, `dealerAddressCity`, `dealerAddressState`, `dealerAddressZip`. `buildDealerDisplayAddress` syncs legacy `dealerAddress`. Preview dealer card links address to Google Maps when enough location data exists.

## 5. Dealer logo placement finding

`AutosDealerLogoUpload` lives in the Negocios **Información del negocio** step. Media step passes `hideDealerLogo` so vehicle photos stay separate.

## 6. Photo ordering finding

Reorder copy block plus labeled cover controls (`useAsCover` / `activeCover`) and chevron move buttons (mobile-friendly). Drag-and-drop for photos not added (chevrons + copy satisfy mobile-first requirement).

## 7. Schedule helper finding

`scheduleHelper` copy appears below “Añadir fila de horario” in ES/EN.

## 8. Preview/public/dashboard/admin mapping

- Preview: `DealerBusinessStack`, `VehicleSpecsGrid`, title band use normalized listing via `normalizeLoadedListing`.
- Public: `mapAutosClassifiedsToPublic` includes structured dealer address parts and engine display in `searchableBlurb`; card title prefers `buildVehicleTitle`.
- Dashboard/admin: no dedicated dealer-address columns; payload fields persist in `listing_payload` JSON.

## 9. Search/filter mapping

Vehicle location filters use listing `city` / `state` / `zip` on the main step (unchanged). Dealer address is search-only via blurb parts. No new unwired engine/trim filter chips.

## 10. Build/check result

`npm run build` completed successfully (exit 0). Lint and Autos audit scripts passed.

## 11. Remaining risks

- Engine catalog coverage is curated (Toyota/Honda/Ford/Tesla samples); most Y/M/T combos still use custom engine text.
- Legacy listings with only `dealerAddress` string are not auto-split into structured fields.
- Photo reorder relies on chevrons on small screens, not drag handles.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Year is controlled by dropdown/select | TRUE | `AutosVehicleIdentityFields` year `<select>` |
| Make is controlled by dropdown/select | TRUE | Make `<select>` + unlisted fallback |
| Model is controlled by dropdown/select | TRUE | Model `<select>` when catalog models exist |
| Trim shows known options when available | TRUE | Trim `<select>` when `getTrimOptionsForMakeModel` returns options |
| Custom trim fallback remains available | TRUE | `TRIM_CUSTOM` + manual input |
| Listing title preserves structured year/make/model/trim | TRUE | `buildVehicleTitle` in public map; fields stored separately |
| Custom trim does not create dirty filters | TRUE | No trim filter facet; search uses text only |
| Engine known options are supported when available or blocker documented | TRUE | `autosVehicleEngineOptions.ts` curated map; custom fallback documented in §11 |
| Custom engine fallback remains available | TRUE | `AutosVehicleEngineField` manual mode |
| Raw engine text does not create dirty filters | TRUE | `engineNormalized` only for catalog picks |
| Address is structured into street number/street/city/state/ZIP | TRUE | `AutoDealerListing` + `AutosDealerStructuredAddressFields` |
| No real/sample address placeholder was added | TRUE | Generic helper copy only in publish UI |
| Maps CTA uses structured address/location | TRUE | `buildDealerMapsHref` in `DealerBusinessStack` |
| City/state/ZIP remain search/filter friendly | TRUE | Vehicle `city`/`state`/`zip` on main step unchanged |
| Dealer logo moved to business information | TRUE | `AutosDealerLogoUpload` in dealer step |
| Dealer logo remains separate from vehicle photos | TRUE | `hideDealerLogo` on media manager |
| Photo ordering/reorder UX is clear | TRUE | `reorderHeading` / `reorderHint` copy |
| Cover image control remains available | TRUE | `useAsCover` / `activeCover` buttons |
| Photo ordering is mobile-friendly or blocker documented | TRUE | Chevron reorder buttons (§6) |
| Special hours/helper copy was added | TRUE | `scheduleHelper` in ES/EN |
| Preview receives the updated fields | TRUE | `normalizeLoadedListing` + preview components |
| Public detail receives the updated fields | TRUE | `mapAutosClassifiedsToPublic` blurb + dealer stack |
| Dashboard/admin receive the updated fields where applicable | TRUE | JSON payload persistence (no new admin columns) |
| Search/filter mapping is clean and documented | TRUE | §9 — no fake filter chips |
| No unrelated categories were touched | TRUE | `autos:a5-0-negocios-blockers-audit` scope check |
| npm run build passed | TRUE | `npm run build` exit 0 |
