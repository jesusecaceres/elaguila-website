import type { AutoDealerListing } from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";

/** Shared Autos structured vehicle identity/spec fields (draft + listing_payload). */
export type AutosVehicleStructuredFields = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  version?: string;
  engine?: string;
  motor?: string;
  engineNormalized?: string;
  engineCylinders?: number;
  displacementL?: number;
  bodyStyle?: string;
  bodyStyleCustom?: string;
  vehicleType?: string;
  drivetrain?: string;
  drivetrainCustom?: string;
  transmission?: string;
  transmissionCustom?: string;
  fuelType?: string;
  fuelTypeCustom?: string;
  doors?: number;
  stockNumber?: string;
  manufacturer?: string;
  plantCountry?: string;
};

export const AUTOS_VEHICLE_STRUCTURED_FIELD_KEYS = [
  "vin",
  "year",
  "make",
  "model",
  "trim",
  "version",
  "engine",
  "motor",
  "engineNormalized",
  "engineCylinders",
  "displacementL",
  "bodyStyle",
  "bodyStyleCustom",
  "vehicleType",
  "drivetrain",
  "drivetrainCustom",
  "transmission",
  "transmissionCustom",
  "fuelType",
  "fuelTypeCustom",
  "doors",
  "stockNumber",
  "manufacturer",
  "plantCountry",
] as const satisfies readonly (keyof AutosVehicleStructuredFields)[];

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  return false;
}

export function pickAutosVehicleStructuredFields(
  source: Partial<AutoDealerListing> | Partial<AutosAdditionalInventoryVehicleDraft>,
): AutosVehicleStructuredFields {
  const out: AutosVehicleStructuredFields = {};
  for (const key of AUTOS_VEHICLE_STRUCTURED_FIELD_KEYS) {
    const v = source[key as keyof typeof source];
    if (!isEmptyValue(v)) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

/**
 * Apply VIN decode results — only fills fields that are currently empty.
 * Never overwrites user-entered values.
 */
export function buildVinDecodeFillEmptyPatch<T extends AutosVehicleStructuredFields>(
  current: T,
  decoded: Partial<AutosVehicleStructuredFields>,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of AUTOS_VEHICLE_STRUCTURED_FIELD_KEYS) {
    const next = decoded[key];
    if (isEmptyValue(next)) continue;
    const cur = current[key];
    if (!isEmptyValue(cur)) continue;
    (patch as Record<string, unknown>)[key] = next;
  }
  return patch;
}

/** Normalized keys for future filter/search facets from listing_payload. */
export function autosVehicleStructuredFilterKeys(): readonly string[] {
  return [
    "year",
    "make",
    "model",
    "trim",
    "version",
    "engine",
    "motor",
    "engineCylinders",
    "displacementL",
    "bodyStyle",
    "vehicleType",
    "drivetrain",
    "transmission",
    "fuelType",
    "fuel",
    "doors",
    "vin",
  ];
}

export function listingHasStructuredVehicleData(listing: Partial<AutoDealerListing>): boolean {
  return Boolean(
    listing.year ||
      listing.make?.trim() ||
      listing.model?.trim() ||
      listing.trim?.trim() ||
      listing.engine?.trim() ||
      listing.bodyStyle?.trim(),
  );
}
