/**
 * BR Negocio + Rentas Negocio — shared string<->chip adapter for "Área de servicio" using the
 * same shared `LanguagesInput` primitive already proven for Idiomas
 * (`@/app/clasificados/publicar/bienes-raices/shared/brRentasLanguagesAdapter.ts`).
 *
 * Service areas have no fixed canonical catalog (unlike languages) — every value is owner-typed
 * free text (e.g. "San José", "Área de la Bahía"). So there are no preset checkbox chips; the
 * custom-add area is always active. Storage stays a single comma-separated string
 * (`agenteAreaServicio`/`negocioAreaServicio`) — this adapter is additive-only, it never changes
 * that shape, it only parses it into removable chips and serializes back on save.
 */

/** Always-active "custom" key — service areas have no presets, so this key is always selected. */
export const BR_RENTAS_SERVICE_AREA_KEY = "custom" as const;

/** No preset chips for service areas — kept as a typed empty array for LanguagesInput's `options`. */
export const BR_RENTAS_SERVICE_AREA_OPTIONS: { key: string; label: string }[] = [];

/** Splits the stored comma-separated string into removable chip values. */
export function parseBrRentasServiceAreaString(raw: string): { selectedKeys: string[]; customValues: string[] } {
  const tokens = String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return { selectedKeys: [BR_RENTAS_SERVICE_AREA_KEY], customValues: tokens };
}

/** Serializes the chip list back into the same comma-separated string format. */
export function serializeBrRentasServiceAreaString(customValues: string[]): string {
  return customValues.join(", ");
}
