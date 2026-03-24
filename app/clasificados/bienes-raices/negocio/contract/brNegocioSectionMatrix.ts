/**
 * BR Negocio — section → field ownership (target layout: BienesRaicesPreviewNegocioFresh).
 *
 * Sections match ANCHOR_IDS / tabs in negocio preview. "Primary" = drives section content.
 */

export type BrNegocioPreviewSectionId =
  | "heroMedia"
  | "summary"
  | "quickFacts"
  | "highlightChips"
  | "about"
  | "factsFeatures"
  | "mapLocation"
  | "rightRail"
  | "lowerBrokerage";

export type SectionFieldRule = {
  section: BrNegocioPreviewSectionId;
  primaryFields: string[];
  optionalFields: string[];
  fallbackFields: string[];
  hideIfEmpty: string;
};

/** Documentation matrix — field names are canonical form keys or ListingData keys */
export const BR_NEGOCIO_SECTION_MATRIX: SectionFieldRule[] = [
  {
    section: "heroMedia",
    primaryFields: ["images", "brVideoUrl", "negocioFloorPlanUrl", "negocioRecorridoVirtual", "brVirtualTourUrl"],
    optionalFields: ["proVideoUrl", "proVideoThumbUrl"],
    fallbackFields: ["/logo.png placeholder"],
    hideIfEmpty: "Never hide hero shell; show placeholder image if no photos",
  },
  {
    section: "summary",
    primaryFields: ["title", "priceLabel", "city", "todayLabel"],
    optionalFields: ["detailPairs (property type)", "quickFacts from partition"],
    fallbackFields: ["(Sin título)", "(No description) copy from page"],
    hideIfEmpty: "Title/price always shown with fallbacks",
  },
  {
    section: "quickFacts",
    primaryFields: ["partition → quickFacts from detailPairs"],
    optionalFields: ["structuredFacts (future)"],
    fallbackFields: [],
    hideIfEmpty: "Hide quick fact chips row if quickFacts length 0",
  },
  {
    section: "highlightChips",
    primaryFields: ["partition → featureTags"],
    optionalFields: [],
    fallbackFields: [],
    hideIfEmpty: "Omit row if no feature tags after partition",
  },
  {
    section: "about",
    primaryFields: ["description"],
    optionalFields: ["negocioDescripcion in rail"],
    fallbackFields: [],
    hideIfEmpty: "Show placeholder text in card if description empty",
  },
  {
    section: "factsFeatures",
    primaryFields: ["groupBienesRaicesNegocioDetailPairs(detailPairs)"],
    optionalFields: ["extra pairs in 'other' bucket"],
    fallbackFields: [],
    hideIfEmpty: "Hide each section bucket if filtered pairs empty",
  },
  {
    section: "mapLocation",
    primaryFields: ["detailPairs Address", "detailPairs Neighborhood", "city"],
    optionalFields: ["approximateArea", "mapsSearchHref"],
    fallbackFields: ["city-only line if no address"],
    hideIfEmpty: "Hide map CTA if no addressLine and no city",
  },
  {
    section: "rightRail",
    primaryFields: ["businessRail (BusinessListingIdentityRail)"],
    optionalFields: ["businessRailTier", "ownerId", "agentProfileReturnUrl"],
    fallbackFields: ["logo vs agent photo ordering inside rail component"],
    hideIfEmpty: "Preview requires businessRail — ListingView routes to negocio fresh only if set",
  },
  {
    section: "lowerBrokerage",
    primaryFields: ["rail lower section + listing representation copy"],
    optionalFields: ["availabilityRows JSON from negocioDisponibilidadPrecios"],
    fallbackFields: [],
    hideIfEmpty: "Hide lower blocks if corresponding rail data missing (see component)",
  },
];
