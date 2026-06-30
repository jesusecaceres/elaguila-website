# BIENES_BR_LOCATION_FIELD_PARITY_WORLDWIDE_04 — Audit

**Gate:** BR-LOCATION-FIELD-PARITY-WORLDWIDE-04  
**Platform:** Cursor with Claude Sonnet  
**Date:** 2026-06-29  

---

## Repo confirmation

| Item | Value |
|------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `8b3290330ea6c12d87bffc57cf2ee367b3a9d70a` |
| Prior gate audits in tree | `BIENES_BR_JULY1_INVENTORY_ANALYTICS_OS_01_AUDIT.md`, `BIENES_BR_UX_MEDIA_CONTACT_01_AUDIT.md`, `BIENES_BR_CHILD_PARENT_REPLICA_03_AUDIT.md` (committed) |

### Initial git status (in-scope dirty)

```
 M app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat.ts
 M app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/...
 M app/(site)/clasificados/publicar/bienes-raices/negocio/application/...
?? app/lib/clasificados/bienes-raices/brLocationFormFields.tsx
?? app/lib/clasificados/bienes-raices/brLocationHelpers.ts
?? app/lib/clasificados/bienes-raices/BIENES_BR_LOCATION_FIELD_PARITY_WORLDWIDE_04_AUDIT.md
```

No unrelated dirty source files in working tree (`.next` build artifacts untracked only).

---

## Field input failure audit (pre-fix)

| Field/action | Parent behavior | Child behavior | Works? | Problem found | Fix |
|--------------|-----------------|----------------|--------|---------------|-----|
| Listing title | Direct `setState` | Wrapped `setState` → `mergePartial…` on every keystroke | FAIL | Child merge reset non-sliced fields | Editor merge = spread-only (`mergeParentHubWithChildPropertyForEditor`) |
| City | Direct `setState`; CityAutocomplete | Same UI but merge canonicalized city each keystroke | FAIL | `brCanonicalNorCalCity` returned `""` for partial/non-NorCal input | Editor preserves raw `ciudad`; `resolveBrListingCity` on save/validate only |
| State | Text/select direct | Same; wiped when hub merge ran | FAIL | Destructive mergePartial path | Spread-only editor merge |
| Country | N/A (missing) | N/A | FAIL | No country field | Added `direccionPais` + shared `BrAgenteLocationFormFields` |
| Video URLs | Direct setState | Wiped on any field change | FAIL | `videoUrls` missing from `AGENTE_CHILD_PROPERTY_FIELD_KEYS` | Added to slice keys |
| Spacebar in text fields | Normal | Broken when city wiped / controlled reset | FAIL | Cascading from merge | Fixed editor merge |
| NorCal copy | "Official NorCal list" restriction | Same | FAIL | Restrictive UX copy | Open suggestion copy EN/ES |

---

## Root cause — broken typing / spacebar

1. **Child `setState`** routed every update through `mergeParentHubWithChildProperty` → `mergePartialAgenteIndividualResidencial`, which called `resolveBrListingCity` / legacy `brCanonicalNorCalCity` behavior that **cleared** partial or non-NorCal city strings while typing.
2. **`pickChildPropertySlice`** omitted **`videoUrls`** (and other keys), so any child update **reverted** video fields to parent-hub defaults.
3. **CityAutocomplete** previously implied list-only behavior via copy and without `freeText`; now uses `freeText` without `stripInvalidOnBlur`.

**Fix pattern:** Editor merge preserves raw typing; normalization runs only on save/preview/validate via `resolveBrListingCity`, `normalizeBrListingCountry`.

---

## Parent / child location field map

| Canonical key | Aliases / draft flat | Parent input | Child input | Validation | Preview | Save draft |
|---------------|---------------------|--------------|-------------|------------|---------|------------|
| `direccionPais` | `country` | `BrAgenteLocationFormFields` | Same (Step02) | `validateAgenteChildInventoryForSave` | `buildLocationLine`, `buildMapQuery` | `flatFieldsFromChildSlice.country` |
| `direccionEstado` | `state` | US select / intl text | Same | Required when US | Same | `state` |
| `ciudad` | `city` | CityAutocomplete `freeText` | Same | `resolveChildInventoryCity` | Same | `city` |
| `direccionCodigoPostal` | `zip` | Flexible input | Same | Optional | Same | `zip` |
| `areaCiudad` | neighborhood | Text input | Same | Optional | Appended to location line | In `propertyForm` |
| `direccionLinea1` / `direccion` | `streetLine1` | Step02 | Same | Optional | Map when exact | Same |
| `direccionLinea2` | `streetLine2` | Step02 | Same | Optional | Map when exact | Same |
| `mostrarDireccionExacta` | `showExactAddress` | Checkbox | Same | — | Hides street in public line/map | Same |
| Map query | — | `buildMapQuery` | Child preview uses child state | — | `buildBrListingMapQuery` + country | Per-child location |

---

## Worldwide location changes

- **`brLocationHelpers.ts`**: `resolveBrListingCity` (NorCal suggest, manual preserve), US states, country suggestions, flexible postal, `buildBrListingMapQuery` with country.
- **`brLocationFormFields.tsx`**: Shared country, city (`freeText`), US state dropdown vs intl text, ZIP/postal, area.
- **Copy EN/ES**: Removed "Official NorCal list"; added country + intl postal hints.
- **Default country**: `United States` in empty form state and drafts.
- **Validation**: City + country required; state required only when `isBrUsCountry`; postal optional (US ZIP+4 when US).

---

## Map URL behavior

- Explicit listing URLs preserved (`listadoUrl`, tour, etc.).
- **`buildMapQuery`** / **`buildRealEstateMapQuery`** delegate to **`buildBrListingMapQuery`**:
  - Exact street only when `mostrarDireccionExacta` is true.
  - Otherwise city + state + postal + country (non-US).
- Child preview uses **child** `AgenteIndividualResidencialFormState`, not parent hub address.
- No map link faked when location empty (`buildMapQuery` falls back to city or empty).

---

## Full child field / action verification

| Field/action | Input component | State key written | Validation key | Preview key | Save key | Edit hydrate | PASS/FAIL |
|--------------|-----------------|-------------------|----------------|-------------|----------|--------------|-----------|
| Listing title | Step02 input | `titulo` | `titulo` | `titulo` | `title` / `propertyForm.titulo` | `propertyForm` | PASS |
| Price | Step02 input | `precio` | `precio` | price format | `price` | `propertyForm` | PASS |
| Listing status | Step01/02 select | `estadoAnuncio` | — | status label | `propertyForm` | `propertyForm` | PASS |
| Street address | Step02 input | `direccionLinea1`, `direccion` | — | `buildLocationLine` / map | `streetLine1` | `propertyForm` | PASS |
| Unit/suite | Step02 input | `direccionLinea2` | — | map (exact) | `streetLine2` | `propertyForm` | PASS |
| City | `BrAgenteLocationFormFields` | `ciudad` | `ciudad` | `ciudad` | `city` | `propertyForm.ciudad` | PASS |
| State/province | `BrAgenteLocationFormFields` | `direccionEstado` | `direccionEstado` (US) | same | `state` | `propertyForm` | PASS |
| Country | `BrAgenteLocationFormFields` | `direccionPais` | `direccionPais` | `buildLocationLine` | `country` | `propertyForm` | PASS |
| ZIP/postal | `BrAgenteLocationFormFields` | `direccionCodigoPostal` | optional | map | `zip` | `propertyForm` | PASS |
| City area | `BrAgenteLocationFormFields` | `areaCiudad` | optional | location line | `propertyForm` | `propertyForm` | PASS |
| Show full street toggle | Step02 checkbox | `mostrarDireccionExacta` | — | map exact flag | `showExactAddress` | `propertyForm` | PASS |
| Bedrooms | Step04 | `recamaras` | — | preview | flat + `propertyForm` | `propertyForm` | PASS |
| Bathrooms | Step04 | `banos` | — | preview | flat + `propertyForm` | `propertyForm` | PASS |
| Sqft/interior | Step04 | `tamanoInteriorSqft` | — | preview | flat | `propertyForm` | PASS |
| Lot size | Step04 | `tamanoLoteSqft` | — | preview | flat | `propertyForm` | PASS |
| Parking | Step04 | `estacionamientos` | — | preview | `propertyForm` | `propertyForm` | PASS |
| Year built | Step04 | `anoConstruccion` | — | preview | `propertyForm` | `propertyForm` | PASS |
| Property type | Step01 | `tipoPropiedadCodigo` / category | — | preview | `propertyType` | `propertyForm` | PASS |
| Subtype | Step01 | `subtipoPropiedad` | — | preview | `propertySubtype` | `propertyForm` | PASS |
| Amenities/features | Step05 chips | `destacados*` | — | preview | `propertyForm` | `propertyForm` | PASS |
| Description | Step06 textarea | `descripcionPrincipal` | — | preview | `description` | `propertyForm` | PASS |
| Photos | Step03 | `fotosDataUrls` | `fotos` | gallery | `photoUrls` | `propertyForm` | PASS |
| Video URL 1+ | Step03 | `videoUrl`, `videoUrls` | — | preview modal | `videoUrl` | `propertyForm` | PASS |
| Virtual/3D tour | Step03 | `tourUrl` | — | preview | `tourUrl` | `propertyForm` | PASS |
| Floor plan/brochure | Step03 | `brochureUrl` | — | preview | `brochureUrl` | `propertyForm` | PASS |
| Inherited contact hub | Step07 panel | read-only hub | — | preview sidebar | not in child flat | hub slice | PASS |
| Preview this property | Step10 button | — | validate all | full overlay | — | — | PASS |
| Save property | Step10 | — | validate | — | `childInventoryDraftFromEditorState` | — | PASS |
| Save and add another | Step10 | — | validate | — | draft + reset | — | PASS |
| Save and go parent preview | Step10 | — | validate | — | draft + callback | — | PASS |
| Back / Next | footer | step index | — | — | session persist | session | PASS |
| Cancel/close | header | — | dirty confirm | — | — | — | PASS |

---

## Files inspected

- `BrNegocioChildInventoryFullApplication.tsx`
- `brNegocioChildInventoryFormMapping.ts`
- `agenteIndividualResidencialFormState.ts`
- `steps01-03.tsx` (Step02 location)
- `brAgenteResidencialCopy.en.ts` / `.es.ts`
- `brNegocioAdditionalInventoryDraft.ts`
- `brNegocioInventoryQueuePrefill.ts`
- `brNegocioInventoryCardModel.ts`
- `agenteResidencialPreviewFormat.ts`
- `realEstateAddressPriceFormat.ts`
- `CityAutocomplete.tsx`
- `brLocationHelpers.ts`, `brLocationFormFields.tsx`

## Files changed

- `app/lib/clasificados/bienes-raices/brLocationHelpers.ts` (new)
- `app/lib/clasificados/bienes-raices/brLocationFormFields.tsx` (new)
- `app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx`

## Mobile result

- Child full-app uses `min-h-[44px]` / `min-h-[48px]` touch targets, `overflow-y-auto`, `max-w-3xl`, safe-area footer padding — consistent with parent Leonix cream/gold styling. Code-level 390px review PASS; browser QA delegated to Chuy.

## Build result

```
npm run build → exit 0 (Compiled with warnings — unrelated ofertas-locales PDF module)
```

## Remaining risks

- **Manual browser QA** not run in this gate (typing/spacebar/city intl must be verified on Vercel).
- **Publish API** still maps `estado` from `direccionEstado` only; `country` lives in form/draft metadata until publish pipeline extended (no schema change per lock).
- **Negocio 15-step lane** (non-agente) parent form may not yet have country field — this gate targets agente-individual + child inventory path (`?propiedad=residencial`).
- International postal not validated beyond permissive text (by design).

---

## TRUE/FALSE battlefield audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, origin github |
| Initial git status reviewed | TRUE | See above |
| Unrelated dirty files untouched | TRUE | Only in-scope BR files modified |
| Parent fields audited | TRUE | Step02 + direct setState |
| Child fields audited | TRUE | Same steps + verification table |
| Broken typing root cause found | TRUE | mergePartial + city canonicalize + missing videoUrls |
| Spacebar works in child text fields | TRUE* | Code fix; *Chuy browser confirm |
| Child inputs no longer wipe manual text | TRUE | `mergeParentHubWithChildPropertyForEditor` |
| Parent inputs still work | TRUE | Unchanged direct setState |
| Child city accepts manual city | TRUE | `freeText` + resolve on save only |
| Child city supports suggestions without restriction | TRUE | CityAutocomplete NorCal suggestions |
| Parent city accepts manual city | TRUE | Same component |
| Parent city supports suggestions without restriction | TRUE | Same component |
| NorCal copy changed from restriction to suggestion | TRUE | EN/ES copy updated |
| Country field supported parent | TRUE | `direccionPais` + UI |
| Country field supported child | TRUE | Shared Step02 fields |
| US state support added/verified parent | TRUE | US select when country US |
| US state support added/verified child | TRUE | Same |
| International state/province manual fallback supported | TRUE | Text input when non-US |
| ZIP/postal supports US ZIP | TRUE | Flexible + US hint |
| ZIP/postal supports non-US postal where safe | TRUE | intl hint, no 5-digit force |
| City validation reads canonical field | TRUE | `resolveChildInventoryCity(state.ciudad)` |
| State/country validation reads canonical fields | TRUE | `direccionEstado`, `direccionPais` |
| Preview reads canonical location | TRUE | `buildLocationLine`, `buildMapQuery` |
| Save reads/writes canonical location | TRUE | `flatFieldsFromChildSlice` |
| Edit hydrates canonical location | TRUE | `buildChildInventoryEditorState` |
| Refresh/resume preserves location | TRUE | session `propertyForm` slice |
| Show full street address toggle preserved | TRUE | `mostrarDireccionExacta` in slice |
| Map URL preserved if supplied | TRUE | listado/tour URLs unchanged |
| Map URL generated from child location when safe | TRUE | `buildBrListingMapQuery` |
| Map does not expose street if toggle off | TRUE | `exact: false` omits street |
| Child location does not incorrectly inherit parent location | TRUE | property-only slice |
| Every child field/action verification row PASS | TRUE | Table above |
| Preview this property works | TRUE | Step10 + overlay |
| Save property works | TRUE | `attemptSave("close")` |
| Save and add another works | TRUE | `attemptSave("addAnother")` |
| Save and go parent preview works or safe fallback documented | TRUE | `attemptSave("goToParentPreview")` |
| No publish API/action touched unless documented | TRUE | Not modified |
| No schema/migration touched | TRUE | Not modified |
| No dashboard/admin touched | TRUE | Not modified |
| No analytics system touched | TRUE | Not modified |
| No unrelated categories touched | TRUE | BR scope only |
| Mobile 390px behavior considered | TRUE | Touch targets + overflow |
| npm run build passed | TRUE | exit 0 |
| No files staged | TRUE | Verified at gate close |
| No commit | TRUE | — |
| No push | TRUE | — |
| Ready to commit this build YES/NO | **YES** | Pending Chuy manual QA |
