/**
 * Keys consumed by the privado structured publish mapper and core property block.
 * Long-tail rows still come from `getPublishCategoryFields` + generic iteration in `publishDetailPairs`.
 */

export const BR_PRIVADO_STRUCTURED_DETAIL_KEYS = [
  "brPropertyType",
  "brPropertySubtype",
  "brZone",
  "brAddress",
  "direccionPropiedad",
  "brBedrooms",
  "brBathrooms",
  "brHalfBathrooms",
  "brSquareFeet",
  "brLotSize",
  "brLevels",
  "brParkingSpaces",
  "brVideoUrl",
  "brVirtualTourUrl",
  "brYearBuilt",
  "brZoning",
  "brServicioAgua",
  "brServicioElectricidad",
  "brServicioGas",
  "brServicioDrenaje",
  "brServicioInternet",
  "brUtilitiesForProperty",
  "bienesRaicesBranch",
] as const;
