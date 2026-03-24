/**
 * BR Negocio — canonical field registry (preflight contract).
 *
 * Single source of truth for naming. Form `details` keys match publish + draft restore.
 * `ListingData` / `BusinessRailData` use normalized preview names (see brNegocioTypes.ts).
 *
 * Legacy aliases MUST be read in mappers only; new code should use canonical keys.
 */

/** Canonical branch value for dedicated negocio flow */
export const BR_NEGOCIO_BRANCH_VALUE = "negocio" as const;

/**
 * Canonical form-state keys (flat `Record<string, string>` in publish).
 * Grouped by domain — not all are required.
 */
export const BR_NEGOCIO_FORM_KEYS = {
  branch: "bienesRaicesBranch",
  subcategoria: "bienesRaicesSubcategoria",
  propertyType: "brPropertyType",
  propertySubtype: "brPropertySubtype",
  zone: "brZone",
  addressLegacy: "brAddress",
  addressStructured: {
    streetNumber: "brNegocioStreetNumber",
    street: "brNegocioStreet",
    city: "brNegocioCity",
    state: "brNegocioState",
    zip: "brNegocioZip",
  },
  direccionPropiedad: "direccionPropiedad",
  bedrooms: "brBedrooms",
  bathrooms: "brBathrooms",
  halfBathrooms: "brHalfBathrooms",
  squareFeet: "brSquareFeet",
  lotSize: "brLotSize",
  levels: "brLevels",
  parkingSpaces: "brParkingSpaces",
  yearBuilt: "brYearBuilt",
  zoning: "brZoning",
  utilitiesFlags: {
    water: "brServicioAgua",
    electric: "brServicioElectricidad",
    gas: "brServicioGas",
    sewer: "brServicioDrenaje",
    internet: "brServicioInternet",
  },
  utilitiesDetails: "brUtilitiesForProperty",
  propertyVideoUrl: "brVideoUrl",
  virtualTourUrlPrimary: "brVirtualTourUrl",
  virtualTourUrlNegocio: "negocioRecorridoVirtual",
  floorPlanUrl: "negocioFloorPlanUrl",
  negocio: {
    nombre: "negocioNombre",
    agente: "negocioAgente",
    cargo: "negocioCargo",
    licencia: "negocioLicencia",
    telOficina: "negocioTelOficina",
    telExtension: "negocioTelExtension",
    email: "negocioEmail",
    sitioWeb: "negocioSitioWeb",
    redesLegacy: "negocioRedes",
    socialFacebook: "negocioSocialFacebook",
    socialInstagram: "negocioSocialInstagram",
    socialYoutube: "negocioSocialYoutube",
    socialTiktok: "negocioSocialTiktok",
    socialWhatsapp: "negocioSocialWhatsapp",
    socialX: "negocioSocialX",
    logoUrl: "negocioLogoUrl",
    fotoAgenteUrl: "negocioFotoAgenteUrl",
    idiomas: "negocioIdiomas",
    horario: "negocioHorario",
    zonasServicio: "negocioZonasServicio",
    plusMasAnuncios: "negocioPlusMasAnuncios",
    descripcion: "negocioDescripcion",
    disponibilidadPrecios: "negocioDisponibilidadPrecios",
    /** Optional lender / bank / financing partner (display + rail). */
    socioFinanciero: "negocioSocioFinanciero",
  },
} as const;

/** Misrouted legacy wizard keys (read via coalesce only) are defined in `app/clasificados/lib/legacyWizardDraftKeys`. */

/** Preview / ListingData field names (already in ListingView.tsx) */
export const BR_NEGOCIO_LISTING_DATA_KEYS = {
  floorPlanUrl: "floorPlanUrl",
  businessRail: "businessRail",
  businessRailTier: "businessRailTier",
  detailPairs: "detailPairs",
  images: "images",
  proVideoUrl: "proVideoUrl",
  proVideoThumbUrl: "proVideoThumbUrl",
  category: "category",
  agentProfileReturnUrl: "agentProfileReturnUrl",
} as const;

/**
 * Maps canonical form key → where it flows today (read-only documentation).
 * "pairs" = appears in getDetailPairs() for BR negocio when non-empty.
 */
export const BR_NEGOCIO_FIELD_FLOW: ReadonlyArray<{
  canonicalKey: string;
  businessMeta: boolean;
  detailPairs: boolean;
  listingDataTopLevel: string | null;
  /** Key on `BusinessRailData` when mapped in full preview */
  businessRail: string | null;
}> = [
  { canonicalKey: "negocioNombre", businessMeta: true, detailPairs: true, listingDataTopLevel: null, businessRail: "name" },
  { canonicalKey: "negocioAgente", businessMeta: true, detailPairs: true, listingDataTopLevel: null, businessRail: "agent" },
  { canonicalKey: "negocioCargo", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "role" },
  { canonicalKey: "negocioLicencia", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "agentLicense" },
  { canonicalKey: "negocioTelOficina", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "officePhone" },
  { canonicalKey: "negocioTelExtension", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "officePhone" },
  { canonicalKey: "negocioEmail", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "agentEmail" },
  { canonicalKey: "negocioSitioWeb", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "website" },
  { canonicalKey: "negocioLogoUrl", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "logoUrl" },
  { canonicalKey: "negocioFotoAgenteUrl", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "agentPhotoUrl" },
  { canonicalKey: "negocioIdiomas", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "languages" },
  { canonicalKey: "negocioHorario", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "hours" },
  { canonicalKey: "negocioRecorridoVirtual", businessMeta: true, detailPairs: true, listingDataTopLevel: null, businessRail: "virtualTourUrl" },
  { canonicalKey: "brVirtualTourUrl", businessMeta: false, detailPairs: true, listingDataTopLevel: null, businessRail: "virtualTourUrl" },
  { canonicalKey: "negocioPlusMasAnuncios", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "plusMoreListings" },
  { canonicalKey: "negocioDescripcion", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "businessDescription" },
  { canonicalKey: "negocioDisponibilidadPrecios", businessMeta: true, detailPairs: false, listingDataTopLevel: null, businessRail: "availabilityRows" },
  { canonicalKey: "negocioSocioFinanciero", businessMeta: true, detailPairs: true, listingDataTopLevel: null, businessRail: "lenderPartnerName" },
  { canonicalKey: "negocioFloorPlanUrl", businessMeta: false, detailPairs: true, listingDataTopLevel: "floorPlanUrl", businessRail: null },
  { canonicalKey: "brVideoUrl", businessMeta: false, detailPairs: true, listingDataTopLevel: "proVideoUrl", businessRail: null },
];
