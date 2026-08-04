/** Seven results-rail trip-type options (approved target). Maps to browse `t` values. */
export function getViajesResultsTripTypeOptions(lang: "es" | "en"): Array<{ value: string; label: string }> {
  if (lang === "en") {
    return [
      { value: "", label: "Any type" },
      { value: "dia", label: "Day trips" },
      { value: "fin-de-semana", label: "Getaways" },
      { value: "resorts", label: "Hotels & resorts" },
      { value: "hoteles", label: "Vacation rentals" },
      { value: "tours", label: "Tours & excursions" },
      { value: "cruceros", label: "Cruises" },
      { value: "transporte", label: "Cars & transfers" },
    ];
  }
  return [
    { value: "", label: "Cualquier tipo" },
    { value: "dia", label: "Viajes de un día" },
    { value: "fin-de-semana", label: "Escapadas" },
    { value: "resorts", label: "Hoteles y resorts" },
    { value: "hoteles", label: "Rentas vacacionales" },
    { value: "tours", label: "Tours y excursiones" },
    { value: "cruceros", label: "Cruceros" },
    { value: "transporte", label: "Autos y traslados" },
  ];
}

export const VIAJES_RESULTS_SOURCE_OPTIONS = [
  { value: "business", labelEs: "Negocios locales", labelEn: "Local businesses" },
  { value: "affiliate", labelEs: "Socios de viaje", labelEn: "Travel partners" },
  { value: "editorial", labelEs: "Guías Leonix", labelEn: "Leonix guides" },
] as const;
