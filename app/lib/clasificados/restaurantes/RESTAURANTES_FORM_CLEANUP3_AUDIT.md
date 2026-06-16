# Gate REST-FORM-CLEANUP3 — Restaurante Establishment Address + Google Review Link Cleanup

**Gate type:** STRICT RESTAURANTE LOCATION/CONTACT FORM CLEANUP — BUILD REQUIRED AT END

## Preflight status

- Active route: `/publicar/restaurantes?lang=es` → `RestauranteApplicationClient.tsx`
- Comida Local read-only confirmed; location flexibility unchanged there

## Files inspected

- `RestauranteApplicationClient.tsx` (Sections D, E)
- `restauranteApplicationSectionModel.ts`
- `restauranteTaxonomy.ts` (placeholders)
- `restauranteContactHref.ts` (map/address helpers)
- `mapRestauranteDraftToShell.ts`, `buildRestaurantContactHub.ts`
- `createEmptyRestauranteDraft.ts`, `useRestauranteDraft.ts`
- `CityAutocomplete.tsx` (read-only; uses existing `freeText` prop)

## Files changed

- `app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx`
- `app/(site)/publicar/restaurantes/restauranteApplicationSectionModel.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteTaxonomy.ts`
- `app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts`
- `app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts`
- `app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts`
- `app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts`
- `app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts`
- `scripts/restaurantes-form-cleanup3-audit.ts`
- `package.json`
- `RESTAURANTES_FORM_CLEANUP3_AUDIT.md`

## Gate A result — Google reviews/profile copy

Updated label, helper, and placeholder to Google Business Profile / public reviews (not Maps directions).

## Gate B result — establishment address form cleanup

Section E reordered: street → line 2 → city → state dropdown → ZIP. City uses `freeText` CityAutocomplete. Removed custom map URL field, exact-address checkbox, and mobile/pop-up privacy copy. Section renamed to “Ubicación del establecimiento”.

## Gate C result — full address map CTA/output

`formatRestauranteCityStateZipLine` + improved `buildRestaurantPublicAddressQuery` include street, line 2, city, state, ZIP. Preview/hub/shell use full address for map CTA. `verUbicacionUrl` fallback preserved in `resolveRestaurantMapsHref` for old listings.

## Draft/session persistence result

Address fields, state default CA on merge, and removed form fields no longer block save; legacy `verUbicacionUrl` / `showExactAddress` values in stored JSON remain for old drafts.

## Preview output result

Contact block and hub show street + city/state/ZIP; map query uses full address.

## Public detail output result

Same mappers; legacy custom map URL still wins when present.

## Comida Local read-only pipeline result

No Comida Local files edited.

## What was intentionally not touched

- Comida Local, app/api, Supabase, dashboard/admin, analytics, payment
- Public detail visual redesign
- Media/photo/video behavior

## Risks/deferred work

- Old drafts with `showExactAddress: false` still hide street per legacy privacy rules until republished with address filled.
- NorCal city suggestions still come from CA catalog; non-CA cities are free-typed only.

## Manual QA checklist

- [ ] Section D Google field helper reads as reviews/profile, not maps
- [ ] Section E field order: street, line 2, city, state, ZIP
- [ ] Type non-NorCal city (e.g. Portland) — persists after refresh
- [ ] Change state from CA to OR — persists
- [ ] Fill full address — preview shows address + “Cómo llegar” from full address
- [ ] Old listing with `verUbicacionUrl` still opens custom URL

## Gate A TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Google review/profile field was inspected | TRUE | Section D |
| Google helper no longer implies Maps/directions URL | TRUE | helper + placeholder |
| Google review/profile field remains supported | TRUE | `googleReviewUrl` input |
| Yelp field remains supported | TRUE | Section D |
| Empty Google/Yelp output still hides | TRUE | contact hub guards |
| No fake review/rating/count added | TRUE | no new fields |

## Gate B TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Section E location fields were inspected | TRUE | Section E rewrite |
| Address order is street, line 2, city, state, ZIP | TRUE | form order |
| City keeps suggestions but accepts any city | TRUE | `freeText` CityAutocomplete |
| City is not restricted to NorCal | TRUE | freeText, no stripInvalidOnBlur |
| State dropdown exists | TRUE | `<select>` + `RESTAURANTE_US_STATE_OPTIONS` |
| State defaults safely, preferably CA | TRUE | empty draft + merge default CA |
| ZIP field remains | TRUE | Código postal input |
| Custom Google Maps URL field removed from Restaurante form | TRUE | field removed |
| Exact address checkbox removed from Restaurante form | TRUE | checkbox removed |
| Mobile/home/pop-up privacy copy removed from Restaurante form | TRUE | copy removed |
| Existing old listing custom map URL compatibility preserved | TRUE | `resolveRestaurantMapsHref` |
| Comida Local files were not edited | TRUE | scope check |

## Gate C TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| --- | --- | --- |
| Preview receives full address fields | TRUE | `buildContact` + hub |
| Public detail receives full address fields | TRUE | same mappers |
| Address display uses clean street/city/state/ZIP format | TRUE | `formatRestauranteCityStateZipLine` |
| Map CTA is generated from full address | TRUE | `buildRestaurantPublicAddressQuery` |
| Old listing location URL fallback remains safe | TRUE | `verUbicacionUrl` first in resolver |
| Empty address pieces do not render undefined/null/bad commas | TRUE | filter(nonEmpty) |
| Mobile output does not overflow | TRUE | grid layout unchanged |
| No database migration created | TRUE | no migration files |
| No app/api files edited unless explicitly documented | TRUE | none edited |
| No Comida Local files edited | TRUE | scope check |
| npm run build passed | TRUE | see build log |
