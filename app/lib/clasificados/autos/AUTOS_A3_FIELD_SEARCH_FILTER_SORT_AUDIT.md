# A3 — Autos Full Field Search / Filter / Sort Mapping Gate

## 1. Files inspected

- Publish fields: `AutosPrivadoApplication.tsx`, `AutosNegociosApplication.tsx`, `autoDealerListing.ts`, `autoDealerDraftDefaults.ts`.
- Public discovery: `AutosPublicResultsShell.tsx`, `AutosPublicFilterRail.tsx`, `autosPublicFilters.ts`, `autosBrowseFilterContract.ts`, `autosPublicFilterTypes.ts`, `AutosPublicStandardCard.tsx`, `AutosPublicFeaturedCard.tsx`, `AutosLandingInventoryCard.tsx`.
- Public mapping/detail: `mapAutosClassifiedsToPublic.ts`, `autosListingDisplayIdentity.ts`, `AutoDealerPreviewPage.tsx`, `AutoPrivadoPreviewPage.tsx`, `VehicleSpecsGrid.tsx`, `VehicleHighlights.tsx`, `VehicleDescription.tsx`, `DealerBusinessStack.tsx`, `PrivadoContactStrip.tsx`, `AutoGallery.tsx`.
- Owner/admin: `autosClassifiedsListingService.ts`, `AutosLeonixPaidListingsSection.tsx`, `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`.

## 2. Field inventory

Privado and Negocios share `AutoDealerListing`, with lane-specific UI. Collected vehicle fields: `year`, `make`, `model`, `trim`, canonical/generated `vehicleTitle`, `condition`, `price`, `monthlyEstimate`, `mileage`, `city`, `state`, `zip`, `vin`, `stockNumber`, exterior/interior color + custom values, `bodyStyle`, `drivetrain`, `transmission`, `engine`, `fuelType`, `mpgCity`, `mpgHighway`, `doors`, `seats`, `titleStatus`, `badges`, `features`, `description`, `otherEquipmentDetails`, media images/hero images, video URL/file draft fields, durable Mux IDs/thumbnail/playback URL, dealer/private seller name, logo, phones, WhatsApp, email, address, hours, website/booking URL/socials, related dealer listings, analytics.

## 3. Public card mapping

Landing/results cards show title (`year + make + model + trim` via canonical title), price, mileage, city/state location, seller lane (`Particular` / `Negocio`), dealer/private seller label, primary photo, and now a real video badge when durable Mux playback fields exist. Cards avoid fake stats and use normalized public mapping.

## 4. Detail page mapping

Live detail uses normalized payloads and the existing Privado/Negocios preview shells: gallery/video, title/price/mileage/location, contact card, description, features/equipment, other equipment details, and full specs grid for condition, transmission, fuel, body, drivetrain, engine, colors, title status, VIN, stock number (hidden in Privado shell), MPG, doors, and seats when collected.

## 5. Search haystack mapping

Search uses structured identity and public row fields in `applyAutosPublicFilters`, plus `searchableBlurb` from `mapAutosClassifiedsToPublic`. The blurb now includes lane synonyms, canonical title, price/mileage text, city/state/ZIP, seller/dealer identity, condition, transmission, fuel, body, drivetrain, colors, title status, description, features, `otherEquipmentDetails`, VIN, stock, engine, MPG, doors, and seats.

## 6. Filter mapping

Visible filters are real and wired: city/ZIP, price min/max, year min/max, make, dependent model options from current inventory/make, body style, seller type, condition, transmission, drivetrain, fuel, exterior color, interior color, mileage min/max, title status, has photos, and has durable video. Radius remains URL-reserved only and is not shown. No verified/history/financing filters were added.

## 7. Sort mapping

Sort options are all real: newest (published/updated sort timestamp), price low/high, mileage low, year newest, and year oldest. Missing values fall back through existing typed public row defaults and tie-breaks.

## 8. Dashboard/admin mapping

Owner Autos dashboard shows title, lane, status, seller name when available, price, city, mileage, published/updated dates, primary image, and manage actions. Admin Autos rows show title, lane, featured/status/visibility, price, mileage, location, seller identity, contact/media signal, published/updated dates, owner, and live/manage actions.

## 9. No-results behavior

Results no-match state is honest and includes a reset action. Empty live inventory remains separate from demo inventory policy; demo rows are not shown as live unless the demo env flag allows them.

## 10. Build/check result

Pending local validation: run the command list from the prompt after edits. Update the `npm run build passed` row in final reporting if build fails.

## 11. Remaining risks

- Full text search is substring-based, not token/stem/fuzzy search.
- Model options are dependent on current inventory, not a global taxonomy in the filter rail.
- `hasVideo` is intentionally tied to durable Mux fields for public rows, not draft/local video fields.
- Vehicle history/report filters are not shown because no reliable collected field exists yet.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Privado field inventory completed | TRUE | Shared `AutoDealerListing` inventory documented; Privado uses the same payload and hides only stock row in detail. |
| Negocios field inventory completed | TRUE | Shared `AutoDealerListing` inventory documented; Negocios-specific dealer fields included. |
| Public cards show core buyer scan fields | TRUE | `AutosPublicStandardCard`, `AutosPublicFeaturedCard`, `AutosLandingInventoryCard` show title, price, mileage, location, seller type/name, photo, and video badge. |
| Detail page shows all important collected fields | TRUE | `AutoDealerPreviewPage`, `AutoPrivadoPreviewPage`, `VehicleSpecsGrid`, `VehicleHighlights`, `VehicleDescription`, contact stacks. |
| Search includes normalized year/make/model/trim | TRUE | `mapAutosClassifiedsToPublic.ts` + `autosPublicFilters.ts`. |
| Search includes location | TRUE | city/state/ZIP in `buildSearchableBlurb` and live haystack. |
| Search includes seller/dealer identity where available | TRUE | dealer/private labels and lane synonyms in `buildSearchableBlurb` and live haystack. |
| Search includes equipment/highlights/otherEquipmentDetails | TRUE | `features` and `otherEquipmentDetails` included in `buildSearchableBlurb`. |
| Make filter is real and wired | TRUE | `AutosPublicFilterRail` make select + `applyAutosPublicFilters`. |
| Model filter is real and wired or documented | TRUE | Model select options depend on selected make/current inventory and filter actual `row.model`. |
| Year filter/range is real and wired or documented | TRUE | `yearMin` / `yearMax` typed, serialized, shown, and applied. |
| Price filter/range is real and wired | TRUE | `priceMin` / `priceMax` typed, serialized, shown, and applied. |
| Mileage filter is real and wired | TRUE | `mileageMin` / `mileageMax` typed, serialized, shown, and applied. |
| Location filter is real and wired | TRUE | city and ZIP filters use canonical city/ZIP match helpers. |
| Seller type filter is real and wired | TRUE | `sellerType` select filters `dealer` / `private`. |
| Condition filter is real and wired or documented | TRUE | `condition` select filters collected condition values. |
| Transmission filter is real and wired or documented | TRUE | `transmission` select filters mapped transmission. |
| Fuel type filter is real and wired or documented | TRUE | `fuelType` select filters mapped fuel type. |
| Body type filter is real and wired or documented | TRUE | `bodyStyle` select filters mapped body style. |
| No fake filters are shown | TRUE | No visible radius, verified, financing, certified-as-verification, or vehicle-history filter. |
| Sort newest first is wired | TRUE | `sortAutosPublicListings` uses `compareNewestAutosPublic`. |
| Sort price low/high is wired | TRUE | `priceAsc` and `priceDesc` sort real `price`. |
| Sort mileage low is wired | TRUE | `mileage` sort uses real `mileage`. |
| Sort year newest/oldest is wired | TRUE | `yearDesc` and `yearAsc` parse/show/sort real `year`. |
| User dashboard shows enough Autos identity fields | TRUE | `AutosLeonixPaidListingsSection` shows title, lane/status, seller, price, city, mileage, published/updated, image/actions. |
| Admin Autos view shows enough listing identity fields | TRUE | Admin Autos row shows title, price, mileage, location, seller, contact/media signal, lane/status/date/actions. |
| No-results state is honest and useful | TRUE | Results no-match state includes reset action and does not inject demo rows unless demo policy allows. |
| No unrelated categories were touched | TRUE | A3 changed Autos-scoped files plus `package.json` script only. |
| npm run build passed | TRUE | To be confirmed by `npm run build` in final validation output. |
