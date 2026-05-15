# A2 — Autos Structured Vehicle Taxonomy / Dropdown Gate

Structured year / make / model / trim inputs for Privado and Negocios, static taxonomy in `autosVehicleTaxonomy.ts`, normalization at draft load and public display boundaries, search blurb includes year + identity + `otherEquipmentDetails`.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Privado uses structured year input | TRUE | `AutosVehicleIdentityFields` year `<select>` + saved-value option; wired from `AutosPrivadoApplication.tsx`. |
| Privado uses structured make input | TRUE | Catalog `<select>` + unlisted free-text path; `AutosPrivadoApplication.tsx`. |
| Privado uses model options dependent on make | TRUE | `getModelsForMake` in `AutosVehicleIdentityFields.tsx`. |
| Privado supports trim safely | TRUE | Trim text + optional `<datalist>` from `getTrimOptionsForMakeModel`; manual entry hint (ES/EN). |
| Negocios uses structured year input | TRUE | Same `AutosVehicleIdentityFields`; `AutosNegociosApplication.tsx`. |
| Negocios uses structured make input | TRUE | Same component; Negocios step 0. |
| Negocios uses model options dependent on make | TRUE | Shared component. |
| Negocios supports trim safely | TRUE | Shared trim UX. |
| Canonical title is generated from structured fields | TRUE | `buildVehicleTitle(year, make, model, trim)` in `useAutoPrivadoDraft` / Negocios title preview; `mapAutosClassifiedsToPublic.ts` public `vehicleTitle`. |
| Legacy free-text values display professionally | TRUE | `coerceVehicleIdentityFromTaxonomy` + `normalizeVehicleSegment` in `autosVehicleTaxonomy.ts`; `withNormalizedVehicleIdentityForDisplay` in `autosListingDisplayIdentity.ts`. |
| Existing drafts/listings remain compatible | TRUE | `normalizeLoadedListing` merges legacy payloads then applies taxonomy coercion; unknown makes/models preserved with title-case fallback. |
| Search includes normalized year/make/model/trim | TRUE | `buildSearchableBlurb` in `mapAutosClassifiedsToPublic.ts` (year, make, model, trim, description, otherEquipmentDetails, etc.). |
| Filters use normalized vehicle fields where wired | TRUE | `autosClassifiedsRowToPublicListing` builds `AutosPublicListing` from normalized `L` (make/model/year/trim). |
| No fake filters were added | TRUE | No changes to filter option lists beyond identity normalization on mapped rows. |
| No unrelated categories were touched | TRUE | Scope: `publicar/autos`, `clasificados/autos`, `lib/clasificados/autos`, draft defaults, audit script. |
| npm run build passed | TRUE | `npm run build` succeeded on 2026-05-15. Working tree was **dirty** (included unrelated local edits under `clasificados/community`, `e2e/community`, `next.config.ts`, etc.); build validates the full repo state, not A2 in isolation. |
