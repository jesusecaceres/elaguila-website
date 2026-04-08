/**
 * Canonical trip-type taxonomy for Viajes (URL param `t`, filters, chips).
 * Spanish-first labels; param keys are URL-stable slugs.
 */

/** Hero + primary filter dropdown options (Spanish-first). */
export const VIAJES_TRIP_TYPE_HERO_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "fin-de-semana", label: "Escapadas de fin de semana" },
  { value: "dia", label: "Viajes de un día" },
  { value: "resorts", label: "Resorts / todo incluido" },
  { value: "hoteles", label: "Hoteles / estadías" },
  { value: "tours", label: "Tours y excursiones" },
  { value: "actividades", label: "Actividades en destino" },
  { value: "cruceros", label: "Cruceros" },
  { value: "renta-autos", label: "Renta de autos" },
  { value: "transporte", label: "Transporte / traslados" },
  { value: "ultimo-minuto", label: "Último minuto" },
  { value: "presupuesto", label: "Ofertas por presupuesto" },
  { value: "cerca", label: "Cerca de ti" },
];

/**
 * Map URL `t` param to canonical trip-type keys stored on inventory rows.
 */
export const VIAJES_TRIP_PARAM_TO_KEYS: Record<string, readonly string[]> = {
  "fin-de-semana": ["fin-de-semana", "escapada"],
  dia: ["dia"],
  resorts: ["resorts", "resort"],
  resort: ["resorts", "resort"],
  hoteles: ["hoteles", "hotel"],
  tours: ["tours", "tour"],
  tour: ["tours", "tour"],
  actividades: ["actividades", "actividad"],
  cruceros: ["cruceros", "crucero"],
  crucero: ["cruceros", "crucero"],
  "renta-autos": ["renta-autos", "auto", "car-rental"],
  transporte: ["transporte", "traslado", "traslados"],
  "ultimo-minuto": ["ultimo-minuto", "last-minute"],
  presupuesto: ["presupuesto", "budget"],
  cerca: ["cerca", "local"],
  escapada: ["fin-de-semana", "escapada"],
};

export function viajesRowMatchesTripParam(rowKeys: readonly string[] | undefined, param: string): boolean {
  const p = param.trim();
  if (!p) return true;
  const allowed = VIAJES_TRIP_PARAM_TO_KEYS[p] ?? [p];
  const keys = rowKeys ?? [];
  return keys.some((k) => allowed.includes(k));
}
