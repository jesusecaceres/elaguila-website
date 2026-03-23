/**
 * Append long-tail BR privado questionnaire rows to `detailPairs` (facts & features depth).
 * Structured rows from `getBrPrivadoPublishStructuredDetailPairs` stay primary for summary.
 */

type Lang = "es" | "en";

const PRIVADO_EXTRA: Array<{ key: string; es: string; en: string }> = [
  { key: "brRoomTypes", es: "Espacios de la propiedad", en: "Property spaces" },
  { key: "brPrimaryBedroomFeatures", es: "Recámara principal", en: "Primary bedroom" },
  { key: "brPrimaryBathroomFeatures", es: "Baño principal", en: "Primary bathroom" },
  { key: "brDiningRoomFeatures", es: "Comedor", en: "Dining room" },
  { key: "brKitchenFeatures", es: "Cocina", en: "Kitchen" },
  { key: "brHeating", es: "Calefacción", en: "Heating" },
  { key: "brCooling", es: "Enfriamiento", en: "Cooling" },
  { key: "brAppliancesIncluded", es: "Electrodomésticos incluidos", en: "Appliances included" },
  { key: "brLaundryFeatures", es: "Lavandería", en: "Laundry" },
  { key: "brFlooring", es: "Pisos", en: "Flooring" },
  { key: "brFireplaceCount", es: "Número de chimeneas", en: "Fireplace count" },
  { key: "brFireplaceFeatures", es: "Detalles de chimenea", en: "Fireplace features" },
  { key: "brParkingFeatures", es: "Estacionamiento (detalles)", en: "Parking details" },
  { key: "brAttachedGarageSpaces", es: "Cocheras cubiertas", en: "Attached garage spaces" },
  { key: "brUncoveredSpaces", es: "Espacios descubiertos", en: "Uncovered parking spaces" },
  { key: "brAccessibilityFeatures", es: "Accesibilidad", en: "Accessibility" },
  { key: "brFencing", es: "Cercado", en: "Fencing" },
  { key: "brLotFeatures", es: "Características del terreno", en: "Lot features" },
  { key: "brPatioPorchFeatures", es: "Patio / portal", en: "Patio & porch" },
  { key: "brExteriorFeatures", es: "Exterior", en: "Exterior features" },
  { key: "brAdditionalStructures", es: "Estructuras adicionales", en: "Additional structures" },
  { key: "brArchitecturalStyle", es: "Estilo arquitectónico", en: "Architectural style" },
  { key: "brMaterials", es: "Materiales", en: "Materials" },
  { key: "brFoundation", es: "Cimentación", en: "Foundation" },
  { key: "brRoof", es: "Techo", en: "Roof" },
  { key: "brNewConstruction", es: "Construcción nueva", en: "New construction" },
  { key: "brParcelNumber", es: "Número de parcela / APN", en: "Parcel / APN" },
  { key: "brSewer", es: "Drenaje (detalle)", en: "Sewer (detail)" },
  { key: "brWater", es: "Agua (detalle)", en: "Water (detail)" },
  { key: "brGas", es: "Gas (detalle)", en: "Gas (detail)" },
  { key: "brAccessDescription", es: "Acceso al terreno", en: "Lot access" },
  { key: "brSpecialConditions", es: "Condiciones especiales de la venta", en: "Special sale conditions" },
];

export function appendBrPrivadoLongTailDetailPairs(
  lang: Lang,
  details: Record<string, string>,
  out: Array<{ label: string; value: string }>
): void {
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    out.push({ label, value: v });
  };

  const priceMode = (details.brPriceDisplayMode ?? "").trim().toLowerCase();
  if (priceMode === "desde") {
    push(lang === "es" ? "Modo de precio" : "Price display", lang === "es" ? "Desde" : "From");
  }

  for (const row of PRIVADO_EXTRA) {
    const v = (details[row.key] ?? "").trim();
    if (v) push(lang === "es" ? row.es : row.en, v);
  }
}
