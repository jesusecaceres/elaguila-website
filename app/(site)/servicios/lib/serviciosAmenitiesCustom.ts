import {
  CUSTOM_SERVICIOS_AMENITY_LABEL_MAX,
  MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS,
  collectStandardAmenityLabelKeys,
  normalizeServiciosAmenityDedupeKey,
} from "./serviciosAmenitiesCatalog";

export type AddCustomAmenityOutcome =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" | "standard_collision" };

export function evaluateAddCustomAmenityLabel(params: {
  customAmenityOptions: string[] | undefined;
  raw: string;
}): AddCustomAmenityOutcome {
  const label = params.raw.trim().slice(0, CUSTOM_SERVICIOS_AMENITY_LABEL_MAX);
  if (!label) return { ok: false, reason: "blank" };

  const customs = params.customAmenityOptions ?? [];
  if (customs.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS) return { ok: false, reason: "cap" };

  const key = normalizeServiciosAmenityDedupeKey(label);
  const blocked = collectStandardAmenityLabelKeys();
  if (blocked.has(key)) return { ok: false, reason: "standard_collision" };

  if (customs.some((x) => normalizeServiciosAmenityDedupeKey(x) === key)) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true, label };
}

