/**
 * BR Negocio — explicit fallback / hide-if-empty rules (preflight).
 *
 * Current behavior lives in BienesRaicesPreviewNegocioFresh + ListingView; this locks intent for rebuild.
 */

export const BR_NEGOCIO_FALLBACK_RULES = {
  videoTile: {
    sources: ["listing.proVideoUrl", "brVideoUrl via media normalization"],
    hideIf: "no normalized video URL after trim",
  },
  virtualTourTile: {
    sources: ["businessRail.virtualTourUrl", "detailPairs label matching tour virtual|virtual tour"],
    hideIf: "no URL after normalizeMediaHref",
  },
  floorPlanTile: {
    sources: ["listing.floorPlanUrl", "detailPairs plano|floorplan"],
    hideIf: "no href",
  },
  agentPhoto: {
    sources: ["businessRail.agentPhotoUrl"],
    fallback: "businessRail.logoUrl emphasis in BusinessListingIdentityRail",
    hideIf: "component chooses compact identity — never hard-error",
  },
  neighborhood: {
    sources: ["detailPairs neighborhood", "brZone"],
    fallback: "city-only subtitle",
    hideIf: "optional line omitted if both empty",
  },
  highlightChips: {
    hideIf: "partition yields zero feature tags",
  },
  factsGroups: {
    hideIf: "per-group if bucket empty after filter + dedupe",
  },
  mapCta: {
    hideIf: "!mapsSearchHref (needs addressLine or city)",
  },
} as const;
