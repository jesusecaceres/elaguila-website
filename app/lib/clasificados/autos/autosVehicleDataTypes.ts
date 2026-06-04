/**
 * Shared Autos structured vehicle data shapes (A5.VDATA-01 foundation).
 * Partial data is allowed; unknown fields fall back to free text in UI.
 */

export type AutosVehicleDataConfidence = "curated" | "partial" | "inferred";

export type AutosVehicleDataSource =
  | "manual_curated_seed"
  | "taxonomy_legacy"
  | "future_vin_decode"
  | "unknown";

export type AutosVehicleEngineOption = {
  label: string;
  normalizedValue: string;
  displacementLiters?: number;
  cylinders?: number;
  fuelType?: string;
  aspiration?: string;
  hybridOrEv?: boolean;
  aliases?: readonly string[];
  transmissions?: readonly string[];
  drivetrains?: readonly string[];
  bodyStyles?: readonly string[];
  source?: AutosVehicleDataSource;
  confidence?: AutosVehicleDataConfidence;
};

export type AutosVehicleTrimOption = {
  label: string;
  normalizedValue: string;
  aliases?: readonly string[];
  engines?: readonly AutosVehicleEngineOption[];
  transmissions?: readonly string[];
  drivetrains?: readonly string[];
  bodyStyles?: readonly string[];
  fuelTypes?: readonly string[];
  source?: AutosVehicleDataSource;
  confidence?: AutosVehicleDataConfidence;
};

/** Make + model level seed; year is optional because coverage is partial by design. */
export type VehicleYearMakeModelData = {
  make: string;
  model: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  trims: readonly AutosVehicleTrimOption[];
  source?: AutosVehicleDataSource;
  confidence?: AutosVehicleDataConfidence;
};

export type AutosVehicleNormalizedIdentity = {
  normalizedMake?: string;
  normalizedModel?: string;
  normalizedTrim?: string;
  normalizedEngine?: string;
  aliases: string[];
  keywords: string[];
};
