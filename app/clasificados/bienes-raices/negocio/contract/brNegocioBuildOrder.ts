/**
 * Mandatory implementation order for BR negocio rebuild (final build phase).
 * Do not skip or reorder without updating this contract.
 */
export const BR_NEGOCIO_FINAL_BUILD_ORDER = [
  "1. Contract & types — brNegocio* in negocio/contract/, align with BUSINESS_META_KEYS",
  "2. Normalization — single mapper: BrNegocioFormState → BrNegocioNormalizedPreviewData + ListingData adapter",
  "3. Form wiring — publish basics/media/details: ensure canonical keys only in new code paths",
  "4. Preview data wiring — BienesRaicesPreviewNegocioFresh consumes normalized model + detailPairs compat",
  "5. Business rail — BusinessListingIdentityRail props from BrNegocioBusinessRailData",
  "6. Compatibility — detailPairs + partition/group helpers until DB migration",
  "7. Page composition — ListingView switchboard unchanged; negocio branch uses fresh preview only",
  "8. typecheck / build",
  "9. Polish — UI only after data contract verified",
] as const;
