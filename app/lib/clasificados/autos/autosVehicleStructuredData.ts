import type { AutoDealerListing } from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";

export type AutosNhtsaCompletenessStatus = "full" | "partial" | "minimal";

export type AutosNhtsaSafetyFeatures = {
  abs?: boolean;
  esc?: boolean;
  tractionControl?: boolean;
  adaptiveCruiseControl?: boolean;
  blindSpotMonitoring?: boolean;
  laneDepartureWarning?: boolean;
  laneKeepSystem?: boolean;
  backupCamera?: boolean;
  parkAssist?: boolean;
  tpms?: boolean;
  frontAirBags?: boolean;
  sideAirBags?: boolean;
  curtainAirBags?: boolean;
};

export type AutosNhtsaDecodeMetadata = {
  source: "nhtsa_vpic";
  decodedAt: string;
  completenessScore: number;
  completenessStatus: AutosNhtsaCompletenessStatus;
  availableFields: string[];
};

/** Shared Autos structured vehicle identity/spec fields (draft + listing_payload). */
export type AutosVehicleStructuredFields = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  trim2?: string;
  version?: string;
  series?: string;
  series2?: string;
  vehicleTitle?: string;
  stockNumber?: string;
  engine?: string;
  motor?: string;
  engineNormalized?: string;
  engineModel?: string;
  engineManufacturer?: string;
  engineConfiguration?: string;
  engineCylinders?: number;
  engineHP?: number;
  engineKW?: number;
  displacementL?: number;
  displacementCC?: number;
  displacementCI?: number;
  turbo?: string;
  valveTrain?: string;
  bodyStyle?: string;
  bodyStyleCustom?: string;
  bodyClass?: string;
  vehicleType?: string;
  vehicleDescriptor?: string;
  drivetrain?: string;
  drivetrainCustom?: string;
  driveType?: string;
  transmission?: string;
  transmissionCustom?: string;
  transmissionStyle?: string;
  transmissionSpeeds?: string;
  fuelType?: string;
  fuelTypeCustom?: string;
  fuelTypePrimary?: string;
  fuelTypeSecondary?: string;
  electrificationLevel?: string;
  doors?: number;
  cabType?: string;
  bedType?: string;
  bedLength?: string;
  gvwr?: string;
  manufacturer?: string;
  manufacturerId?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  plantCompanyName?: string;
  vinDetectedTrim?: string;
  safetyFeatures?: AutosNhtsaSafetyFeatures;
  nhtsaDecode?: AutosNhtsaDecodeMetadata;
};

export const AUTOS_VEHICLE_STRUCTURED_FIELD_KEYS = [
  "vin",
  "year",
  "make",
  "model",
  "trim",
  "trim2",
  "version",
  "series",
  "series2",
  "vehicleTitle",
  "stockNumber",
  "engine",
  "motor",
  "engineNormalized",
  "engineModel",
  "engineManufacturer",
  "engineConfiguration",
  "engineCylinders",
  "engineHP",
  "engineKW",
  "displacementL",
  "displacementCC",
  "displacementCI",
  "turbo",
  "valveTrain",
  "bodyStyle",
  "bodyStyleCustom",
  "bodyClass",
  "vehicleType",
  "vehicleDescriptor",
  "drivetrain",
  "drivetrainCustom",
  "driveType",
  "transmission",
  "transmissionCustom",
  "transmissionStyle",
  "transmissionSpeeds",
  "fuelType",
  "fuelTypeCustom",
  "fuelTypePrimary",
  "fuelTypeSecondary",
  "electrificationLevel",
  "doors",
  "cabType",
  "bedType",
  "bedLength",
  "gvwr",
  "manufacturer",
  "manufacturerId",
  "plantCountry",
  "plantState",
  "plantCity",
  "plantCompanyName",
  "vinDetectedTrim",
  "safetyFeatures",
  "nhtsaDecode",
] as const satisfies readonly (keyof AutosVehicleStructuredFields)[];

export type AutosDecodedFieldSummaryRow = {
  key: string;
  labelEs: string;
  labelEn: string;
  value: string;
};

const SUMMARY_LABELS: Record<string, { es: string; en: string }> = {
  year: { es: "Año", en: "Year" },
  make: { es: "Marca", en: "Make" },
  model: { es: "Modelo", en: "Model" },
  trim: { es: "Versión / trim", en: "Trim / version" },
  version: { es: "Versión", en: "Version" },
  series: { es: "Serie", en: "Series" },
  series2: { es: "Serie 2", en: "Series 2" },
  trim2: { es: "Trim 2", en: "Trim 2" },
  engine: { es: "Motor", en: "Engine" },
  engineCylinders: { es: "Cilindros", en: "Cylinders" },
  displacementL: { es: "Desplazamiento (L)", en: "Displacement (L)" },
  displacementCC: { es: "Desplazamiento (cc)", en: "Displacement (cc)" },
  bodyStyle: { es: "Tipo de carrocería", en: "Body style" },
  bodyClass: { es: "Clase de carrocería", en: "Body class" },
  drivetrain: { es: "Tracción", en: "Drivetrain" },
  driveType: { es: "Tipo de tracción", en: "Drive type" },
  transmission: { es: "Transmisión", en: "Transmission" },
  fuelType: { es: "Combustible", en: "Fuel" },
  fuelTypePrimary: { es: "Combustible principal", en: "Primary fuel" },
  doors: { es: "Puertas", en: "Doors" },
  vehicleType: { es: "Tipo de vehículo", en: "Vehicle type" },
  cabType: { es: "Tipo de cabina", en: "Cab type" },
  bedType: { es: "Tipo de caja", en: "Bed type" },
  manufacturer: { es: "Fabricante", en: "Manufacturer" },
  electrificationLevel: { es: "Electrificación", en: "Electrification" },
};

const SUMMARY_ORDER = [
  "year",
  "make",
  "model",
  "trim",
  "version",
  "series",
  "series2",
  "trim2",
  "engine",
  "engineCylinders",
  "displacementL",
  "displacementCC",
  "bodyStyle",
  "bodyClass",
  "drivetrain",
  "driveType",
  "transmission",
  "fuelType",
  "fuelTypePrimary",
  "doors",
  "vehicleType",
  "cabType",
  "bedType",
  "manufacturer",
  "electrificationLevel",
];

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object" && !Array.isArray(v)) return Object.keys(v as object).length === 0;
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

export function mergeDecodedVehicleFieldsIntoDraft(
  current: Partial<AutosVehicleStructuredFields>,
  decoded: Partial<AutosVehicleStructuredFields>,
  options?: { fillEmptyOnly?: boolean },
): Partial<AutosVehicleStructuredFields> {
  const fillEmptyOnly = options?.fillEmptyOnly !== false;
  const patch = fillEmptyOnly ? buildVinDecodeFillEmptyPatch(current, decoded) : { ...decoded };

  if (decoded.nhtsaDecode) {
    patch.nhtsaDecode = decoded.nhtsaDecode;
  }
  if (decoded.safetyFeatures && !isEmptyValue(decoded.safetyFeatures)) {
    if (isEmptyValue(current.safetyFeatures)) patch.safetyFeatures = decoded.safetyFeatures;
  }

  const trimCandidate = decoded.trim ?? decoded.version;
  if (trimCandidate && patch.trim) {
    patch.vinDetectedTrim = trimCandidate;
  }
  if (decoded.version && isEmptyValue(current.version) && patch.version === undefined && patch.trim) {
    patch.version = decoded.version;
  }

  return patch;
}

export function getDecodedVehicleFieldSummary(fields: Partial<AutosVehicleStructuredFields>): AutosDecodedFieldSummaryRow[] {
  const rows: AutosDecodedFieldSummaryRow[] = [];
  for (const key of SUMMARY_ORDER) {
    const v = fields[key as keyof AutosVehicleStructuredFields];
    if (isEmptyValue(v)) continue;
    if (typeof v === "object") continue;
    const labels = SUMMARY_LABELS[key] ?? { es: key, en: key };
    rows.push({
      key,
      labelEs: labels.es,
      labelEn: labels.en,
      value: String(v),
    });
  }
  return rows;
}

export function getMissingStructuredFields(fields: Partial<AutosVehicleStructuredFields>): string[] {
  const important = ["year", "make", "model", "trim", "engine", "bodyStyle", "drivetrain", "transmission", "fuelType", "doors"];
  return important.filter((k) => isEmptyValue(fields[k as keyof AutosVehicleStructuredFields]));
}

export function autosVehicleStructuredFilterKeys(): readonly string[] {
  return [
    "year",
    "make",
    "model",
    "trim",
    "trim2",
    "version",
    "series",
    "series2",
    "engine",
    "motor",
    "engineCylinders",
    "displacementL",
    "displacementCC",
    "bodyStyle",
    "bodyClass",
    "vehicleType",
    "drivetrain",
    "driveType",
    "transmission",
    "transmissionStyle",
    "fuelType",
    "fuelTypePrimary",
    "electrificationLevel",
    "doors",
    "cabType",
    "bedType",
    "vin",
    "manufacturer",
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
