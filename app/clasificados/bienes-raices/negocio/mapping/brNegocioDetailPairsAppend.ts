/**
 * Append long-tail BR negocio rows to `detailPairs` for legacy rendering / grouped sections.
 * Typed `structuredFacts` + mapper remain primary for preview summary.
 */

type Lang = "es" | "en";

const EXTRA: Array<{ key: string; es: string; en: string }> = [
  { key: "enVentaKitchenFeatures", es: "Cocina", en: "Kitchen" },
  { key: "enVentaHeating", es: "Calefacción", en: "Heating" },
  { key: "enVentaCooling", es: "Enfriamiento", en: "Cooling" },
  { key: "enVentaAppliancesIncluded", es: "Electrodomésticos", en: "Appliances" },
  { key: "enVentaFlooring", es: "Pisos", en: "Flooring" },
  { key: "enVentaParkingFeatures", es: "Estacionamiento (detalles)", en: "Parking details" },
  { key: "enVentaLotFeatures", es: "Terreno (detalles)", en: "Lot details" },
  { key: "enVentaExteriorFeatures", es: "Exterior", en: "Exterior" },
  { key: "enVentaArchitecturalStyle", es: "Estilo", en: "Style" },
  { key: "enVentaMaterials", es: "Materiales", en: "Materials" },
  { key: "enVentaSpecialConditions", es: "Condiciones especiales", en: "Special conditions" },
  { key: "enVentaUtilitiesForProperty", es: "Detalles de servicios", en: "Utility details" },
];

export function appendBrNegocioLongTailDetailPairs(
  lang: Lang,
  details: Record<string, string>,
  out: Array<{ label: string; value: string }>
): void {
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    out.push({ label, value: v });
  };

  const status = (details.brNegocioListingStatus ?? "").trim();
  if (status) {
    const label =
      lang === "es" ? "Estado del listado" : "Listing status";
    const map: Record<string, string> = {
      active: lang === "es" ? "Activo" : "Active",
      pending: lang === "es" ? "Pendiente" : "Pending",
      sold: lang === "es" ? "Vendido" : "Sold",
      coming_soon: lang === "es" ? "Próximamente" : "Coming soon",
    };
    push(label, map[status] ?? status);
  }

  const sum = (details.brNegocioListingSummary ?? "").trim();
  if (sum) push(lang === "es" ? "Resumen corto" : "Short summary", sum);

  const br = (details.negocioNombreCorreduria ?? "").trim();
  if (br) push(lang === "es" ? "Correduría / broker" : "Brokerage", br);

  const co = (details.negocioCoAgente ?? "").trim();
  if (co) push(lang === "es" ? "Co-agente" : "Co-agent", co);

  for (const row of EXTRA) {
    const v = (details[row.key] ?? "").trim();
    if (v) push(lang === "es" ? row.es : row.en, v);
  }
}
