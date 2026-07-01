# BIENES BR-WORLDWIDE-LOCATION-VISIBLE-PARENT-CHILD-06 Audit

## Screenshot-proven issue

Chuy browser-tested production at `/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en` and still saw U.S.-only location copy:

- "Official NorCal list"
- "Two-letter abbreviation, e.g. CA"
- "5-digit ZIP"
- No visible **Country** field

**Root cause:** Production was likely on a build before BR-LOCATION-FIELD-PARITY-WORLDWIDE-04 (`BrAgenteLocationFormFields`). In-repo, the parent negocio route already renders `AgenteIndividualResidencialApplication` → `Step02InformacionBasica` → shared location fields, but copy was not gate-exact ("two-letter state", "ZIP+4") and publish mapping omitted `pais` / `colonia` (area) on the Negocio publish bridge.

## Exact visible route fixed

| Route | Component |
|-------|-----------|
| `/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en` | `negocio/page.tsx` → `AgenteIndividualResidencialApplication` → `Step02InformacionBasica` |
| Child inventory full app | `BrNegocioChildInventoryFullApplication` → same `Step02InformacionBasica` |

Field order Step 2: Street → Unit → **Country** → City → State/Province/Region → ZIP/Postal → Area → show-full-address toggle.

## Files inspected

- `negocio/page.tsx`, `AgenteIndividualResidencialApplication.tsx`
- `steps01-03.tsx`, `brLocationFormFields.tsx`, `brLocationHelpers.ts`
- `brAgenteResidencialCopy.en.ts`, `brAgenteResidencialCopy.es.ts`
- `BrNegocioChildInventoryFullApplication.tsx`, `brNegocioChildInventoryFormMapping.ts`
- `agenteResidencialPreviewFormat.ts`, `mapAgenteResidencialFormStateToNegocioForPublish.ts`
- `mapBienesRaicesNegocioStateToPreviewVm.ts`, `bienesRaicesNegocioFormState.ts`
- `brResultsFilters.ts`, `brCityMatch.ts`, `mapBrListingRowToCard.ts`
- `CityAutocomplete.tsx`

## Files changed

- `brAgenteResidencialCopy.en.ts` / `.es.ts` — gate-exact worldwide copy
- `brLocationFormFields.tsx` — Country first in location block; U.S. state datalist (CA or California); unified postal hint
- `brLocationHelpers.ts` — U.S. state labels + `resolveBrUsStateInput`
- `CityAutocomplete.tsx` — `freeText` skips NorCal canonicalization on blur
- `mapAgenteResidencialFormStateToNegocioForPublish.ts` — `pais`, `colonia` (area), `resolveBrListingCity`
- `bienesRaicesNegocioFormState.ts` — `pais` field
- `mapBienesRaicesNegocioStateToPreviewVm.ts` — country in display + `buildBrListingMapQuery`
- `scripts/bienes-worldwide-location-visible-parent-child-06-audit.ts`
- `package.json` — npm script

## Old copy locations found

| String | In Bienes publish UI (this gate) |
|--------|----------------------------------|
| Official NorCal list | **Absent** (was removed in BR-04) |
| Two-letter abbreviation | **Absent**; had remnant "choose the two-letter state" in EN copy — **removed** |
| 5-digit ZIP | **Absent** |
| ZIP+4 split hints | **Replaced** with unified international postal hint |

## Parent visible UI result

- Country field visible with hint: "Choose or type the country where the property is located."
- State label: "State / Province / Region"
- U.S.: state input with datalist (supports CA, California, etc.)
- Non-U.S.: free-text province/region
- ZIP hint: "U.S. ZIP or international postal code."
- City: `CityAutocomplete` with `freeText` (manual + suggestions, spacebar preserved)

## Child visible UI result

Same `BrAgenteLocationFormFields` via shared `Step02InformacionBasica`. Child draft mapping preserves `direccionPais` / `country` through save, edit, and carousel.

## Map truth result

- Parent/child preview: `buildMapQuery` / `buildBrListingMapQuery` — exact street only when toggle ON; otherwise city/state/country/postal/area only.
- Negocio publish preview VM now uses `buildBrListingMapQuery` with `pais`.

## Results / search / filter result

- `cityFilterMatchesListingAddress` uses substring + optional NorCal canonical — does **not** block manual worldwide cities.
- Results cards use `buildBrPublicLocationForLiveDetail`; published listings include country in `cityStateZip` line via preview VM → detail_pairs.

## Publish / payload preservation

| Field | Parent form | Child draft | Publish bridge |
|-------|-------------|-------------|----------------|
| country | `direccionPais` | `country` / `direccionPais` | `BienesRaicesNegocioFormState.pais` → preview VM `cityStateZip` → detail_pairs |
| area | `areaCiudad` | same | `colonia` on negocio state |
| city/state/postal | form fields | same | `ciudad`/`estado`/`codigoPostal` columns + detail_pairs |

No DB migration; country stored in human detail_pairs / listing display line (no dedicated `listings.country` column).

## Mobile result

Step 2 uses existing `brForm` / `min-h-[44px]` inputs; no new horizontal overflow patterns introduced.

## Remaining risks

- Production must redeploy this commit for Chuy to see changes (prior production lag vs. BR-04).
- Machine facet map pairs in `leonixBrMachineFacetPairsFromFormState.ts` still use legacy `composeBrExactMapQuery` without country for non-agente 15-step negocio lane (out of scope; agente route uses preview VM path).
- International postal codes shorter than 5 digits may not populate `Leonix:postal_code` machine facet (human line still preserves value).
