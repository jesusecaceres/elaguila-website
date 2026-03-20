/**
 * BR Negocio — explicit `detailPairs` policy (preflight).
 *
 * `detailPairs` = array of { label, value } built by `getDetailPairs("bienes-raices", ...)` in publish page.
 * Preview partitions them via `partitionBienesRaicesPreviewDetailPairs` and `groupBienesRaicesNegocioDetailPairs`.
 */

/**
 * A) First-class typed sources (read from `details` / snapshot, NOT invented in pairs):
 * - Property: tipo, subtipo, recámaras, baños, pies², terreno, niveles, estacionamiento, año, zonificación, servicios
 * - Address: split BR negocio lines OR legacy `enVentaAddress`
 * - Media URLs: video propiedad, tour virtual, plano (duplicated as top-level `floorPlanUrl` / `proVideoUrl` on ListingData where applicable)
 * - Negocio identity rows in pairs: nombre negocio, plan, agente (summary chips only — rail uses raw `negocio*` keys)
 *
 * B) Stay in `detailPairs` as long-tail / compatibility:
 * - All non-empty `getCategoryFields` rows for BR
 * - Comma-separated amenity / utility long text
 * - Historical drafts that only stored pair-shaped data
 *
 * C) Derived into grouped sections (not primary storage):
 * - `groupBienesRaicesNegocioDetailPairs` → Interior / Exterior / Utilities / Location / Listing links / Other
 * - `partitionBienesRaicesPreviewDetailPairs` → quick facts row vs feature tags
 *
 * Rule: For rebuild, prefer typed `details` + `BrNegocioNormalizedPreviewData.structuredFacts` for hero/summary;
 * keep emitting `detailPairs` for backward compatibility until DB migration.
 */
export const BR_NEGOCIO_DETAIL_PAIRS_POLICY = {
  primarySourceOfTruth: "form_details_record" as const,
  pairsAre: "derived_display_and_legacy_compat" as const,
  doNotAddNewBusinessIdentityToPairsAlone: true,
} as const;
