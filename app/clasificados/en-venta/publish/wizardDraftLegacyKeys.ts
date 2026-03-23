/**
 * Legacy draft keys from the old shared publish wizard (En Venta–prefixed).
 * Per project rules, these string literals must not appear outside `en-venta/**`.
 * Non–En Venta code reads legacy values only through `coalesceWizardDetailValue` (or related helpers).
 */

export const LEGACY_WIZARD_BR_DETAIL = {
  fullDescription: "enVentaFullDescription",
  propertyType: "enVentaPropertyType",
  propertySubtype: "enVentaPropertySubtype",
  priceDisplayMode: "enVentaPriceDisplayMode",
  zone: "enVentaZone",
  address: "enVentaAddress",
  locationDisplayMode: "enVentaLocationDisplayMode",
  videoUrl: "enVentaVideoUrl",
  virtualTourUrl: "enVentaVirtualTourUrl",
  yearBuilt: "enVentaYearBuilt",
  zoning: "enVentaZoning",
  specialConditions: "enVentaSpecialConditions",
  servicioAgua: "enVentaServicioAgua",
  servicioElectricidad: "enVentaServicioElectricidad",
  servicioGas: "enVentaServicioGas",
  servicioDrenaje: "enVentaServicioDrenaje",
  servicioInternet: "enVentaServicioInternet",
  utilitiesForProperty: "enVentaUtilitiesForProperty",
  bedrooms: "enVentaBedrooms",
  bathrooms: "enVentaBathrooms",
  halfBathrooms: "enVentaHalfBathrooms",
  squareFeet: "enVentaSquareFeet",
  lotSize: "enVentaLotSize",
  levels: "enVentaLevels",
  parkingSpaces: "enVentaParkingSpaces",
  roomTypes: "enVentaRoomTypes",
  primaryBedroomFeatures: "enVentaPrimaryBedroomFeatures",
  primaryBathroomFeatures: "enVentaPrimaryBathroomFeatures",
  diningRoomFeatures: "enVentaDiningRoomFeatures",
  kitchenFeatures: "enVentaKitchenFeatures",
  heating: "enVentaHeating",
  cooling: "enVentaCooling",
  appliancesIncluded: "enVentaAppliancesIncluded",
  laundryFeatures: "enVentaLaundryFeatures",
  flooring: "enVentaFlooring",
  fireplaceCount: "enVentaFireplaceCount",
  fireplaceFeatures: "enVentaFireplaceFeatures",
  parkingFeatures: "enVentaParkingFeatures",
  attachedGarageSpaces: "enVentaAttachedGarageSpaces",
  uncoveredSpaces: "enVentaUncoveredSpaces",
  accessibilityFeatures: "enVentaAccessibilityFeatures",
  fencing: "enVentaFencing",
  lotFeatures: "enVentaLotFeatures",
  patioPorchFeatures: "enVentaPatioPorchFeatures",
  exteriorFeatures: "enVentaExteriorFeatures",
  additionalStructures: "enVentaAdditionalStructures",
  architecturalStyle: "enVentaArchitecturalStyle",
  materials: "enVentaMaterials",
  foundation: "enVentaFoundation",
  roof: "enVentaRoof",
  newConstruction: "enVentaNewConstruction",
  parcelNumber: "enVentaParcelNumber",
  sewer: "enVentaSewer",
  water: "enVentaWater",
  gas: "enVentaGas",
  accessDescription: "enVentaAccessDescription",
} as const;

/** Misrouted shared-wizard keys historically reused for negocio display names. */
export const LEGACY_WIZARD_SHARED_NEGOCIO = {
  businessName: "enVentaBusinessName",
  agentName: "enVentaAgentName",
} as const;

export const ALL_LEGACY_BR_WIZARD_DETAIL_VALUES: readonly string[] = Object.values(LEGACY_WIZARD_BR_DETAIL);
