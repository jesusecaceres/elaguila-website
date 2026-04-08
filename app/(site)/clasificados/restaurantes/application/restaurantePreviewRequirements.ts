/**
 * Structural fields required for a premium, non-broken Restaurantes preview / open-card shell.
 * Mirrors `satisfiesRestauranteMinimumValidPreview` + `satisfiesRestauranteServiceModes` (for validated preview navigation).
 *
 * Use for UI asterisks and copy — keep in sync with `restauranteListingApplicationModel.ts`.
 */
export const RESTAURANTE_PREVIEW_REQUIRED_FOR_SHELL = [
  "businessName",
  "businessType",
  "primaryCuisine",
  "shortSummary",
  "cityCanonical",
  "heroOrFirstGalleryImage",
  "atLeastOneContactChannel",
  "operatingHoursOrNote",
] as const;

export const RESTAURANTE_PREVIEW_REQUIRED_SERVICE_MODES = [
  "At least one modo de servicio (sección B) to use the validated “Vista previa” button.",
] as const;
