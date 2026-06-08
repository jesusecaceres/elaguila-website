import type {
  AutosNhtsaCompletenessStatus,
  AutosNhtsaDecodeMetadata,
  AutosNhtsaSafetyFeatures,
  AutosVehicleStructuredFields,
} from "./autosVehicleStructuredData";

const VPIC_DECODE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

const INVALID_VIN_CHARS = /[IOQ]/i;

const IMPORTANT_DECODE_FIELDS: (keyof AutosVehicleStructuredFields)[] = [
  "year",
  "make",
  "model",
  "trim",
  "engine",
  "bodyStyle",
  "drivetrain",
  "transmission",
  "fuelType",
  "doors",
];

const SAFETY_NHTSA_MAP: { nhtsa: string; key: keyof AutosNhtsaSafetyFeatures }[] = [
  { nhtsa: "ABS", key: "abs" },
  { nhtsa: "ESC", key: "esc" },
  { nhtsa: "TractionControl", key: "tractionControl" },
  { nhtsa: "AdaptiveCruiseControl", key: "adaptiveCruiseControl" },
  { nhtsa: "BlindSpotMon", key: "blindSpotMonitoring" },
  { nhtsa: "LaneDepartureWarning", key: "laneDepartureWarning" },
  { nhtsa: "LaneKeepSystem", key: "laneKeepSystem" },
  { nhtsa: "BackupCamera", key: "backupCamera" },
  { nhtsa: "ParkAssist", key: "parkAssist" },
  { nhtsa: "TPMS", key: "tpms" },
  { nhtsa: "AirBagLocFront", key: "frontAirBags" },
  { nhtsa: "AirBagLocSide", key: "sideAirBags" },
  { nhtsa: "AirBagLocCurtain", key: "curtainAirBags" },
];

export type AutosNhtsaVinDecodeResult = {
  ok: boolean;
  fields: Partial<AutosVehicleStructuredFields>;
  filledCount: number;
  error?: "invalid_vin" | "network" | "empty_response" | "parse_failed";
  rawNhtsa?: Record<string, string>;
  metadata?: AutosNhtsaDecodeMetadata;
};

export function normalizeVinInput(vin: string | undefined | null): string {
  return (vin ?? "").replace(/\s+/g, "").toUpperCase();
}

export function isValidVinCandidate(vin: string | undefined | null): boolean {
  const n = normalizeVinInput(vin);
  if (n.length !== 17) return false;
  if (INVALID_VIN_CHARS.test(n)) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(n)) return false;
  return true;
}

function nhtsaValue(raw: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key]?.trim();
    if (!v) continue;
    if (/^not applicable$/i.test(v)) continue;
    if (/^incomplete$/i.test(v)) continue;
    if (v === "0" && /door/i.test(key)) continue;
    return v;
  }
  return undefined;
}

function titleCaseWords(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseOptionalInt(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseOptionalFloat(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function isTruthyNhtsaFeature(v: string | undefined): boolean {
  if (!v?.trim()) return false;
  const lower = v.toLowerCase();
  if (/^not applicable$/i.test(v)) return false;
  if (lower === "no" || lower === "false") return false;
  return true;
}

function mapSafetyFeatures(raw: Record<string, string>): AutosNhtsaSafetyFeatures | undefined {
  const out: AutosNhtsaSafetyFeatures = {};
  for (const { nhtsa, key } of SAFETY_NHTSA_MAP) {
    const v = nhtsaValue(raw, nhtsa);
    if (isTruthyNhtsaFeature(v)) out[key] = true;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function mapBodyStyle(raw: string | undefined): Pick<AutosVehicleStructuredFields, "bodyStyle" | "bodyStyleCustom"> {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  if (lower.includes("sedan") || lower.includes("saloon")) return { bodyStyle: "Sedán" };
  if (lower.includes("suv") || lower.includes("sport utility") || lower.includes("crossover")) return { bodyStyle: "SUV" };
  if (lower.includes("pickup") || lower.includes("truck")) return { bodyStyle: "Pickup" };
  if (lower.includes("coupe")) return { bodyStyle: "Coupe" };
  if (lower.includes("hatch")) return { bodyStyle: "Hatchback" };
  if (lower.includes("minivan") || lower.includes("van")) return { bodyStyle: "Minivan" };
  if (lower.includes("convert")) return { bodyStyle: "Convertible" };
  if (lower.includes("wagon")) return { bodyStyle: "Wagon" };
  return { bodyStyle: "Otro", bodyStyleCustom: raw };
}

function mapDrivetrain(raw: string | undefined): Pick<AutosVehicleStructuredFields, "drivetrain" | "drivetrainCustom" | "driveType"> {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  let drivetrain: string | undefined;
  if (lower.includes("fwd") || lower.includes("front-wheel")) drivetrain = "FWD";
  else if (lower.includes("rwd") || lower.includes("rear-wheel")) drivetrain = "RWD";
  else if (lower.includes("awd") || lower.includes("all-wheel")) drivetrain = "AWD";
  else if (lower.includes("4wd") || lower.includes("4x4") || lower.includes("four-wheel")) drivetrain = "4WD";
  if (drivetrain) return { drivetrain, driveType: raw };
  return { drivetrain: "Otro", drivetrainCustom: raw, driveType: raw };
}

function mapTransmission(
  style: string | undefined,
  speeds: string | undefined,
): Pick<AutosVehicleStructuredFields, "transmission" | "transmissionCustom" | "transmissionStyle" | "transmissionSpeeds"> {
  const styleRaw = style?.trim();
  const speedsRaw = speeds?.trim();
  const combined = [styleRaw, speedsRaw ? `${speedsRaw}-speed` : undefined].filter(Boolean).join(" ");
  if (!combined) return {};

  const lower = combined.toLowerCase();
  let transmission: string | undefined;
  if (lower.includes("cvt")) transmission = "CVT";
  else if (lower.includes("manual")) transmission = "Manual";
  else if (lower.includes("dual clutch") || lower.includes("dct")) transmission = "Automática de doble embrague";
  else if (lower.includes("auto")) transmission = "Automática";

  if (transmission) {
    return {
      transmission,
      transmissionStyle: styleRaw,
      transmissionSpeeds: speedsRaw,
    };
  }
  return {
    transmission: "Otro",
    transmissionCustom: combined,
    transmissionStyle: styleRaw,
    transmissionSpeeds: speedsRaw,
  };
}

function mapFuel(
  primary: string | undefined,
  secondary: string | undefined,
): Pick<AutosVehicleStructuredFields, "fuelType" | "fuelTypeCustom" | "fuelTypePrimary" | "fuelTypeSecondary"> {
  const primaryRaw = primary?.trim();
  const secondaryRaw = secondary?.trim();
  const raw = primaryRaw ?? secondaryRaw;
  if (!raw) return { fuelTypePrimary: primaryRaw, fuelTypeSecondary: secondaryRaw };

  const lower = raw.toLowerCase();
  let fuelType: string | undefined;
  if (lower.includes("electric") && !lower.includes("hybrid")) fuelType = "Eléctrico";
  else if (lower.includes("plug") || lower.includes("phev")) fuelType = "Híbrido enchufable";
  else if (lower.includes("hybrid")) fuelType = "Híbrido";
  else if (lower.includes("diesel")) fuelType = "Diésel";
  else if (lower.includes("premium")) fuelType = "Gasolina premium";
  else if (lower.includes("gas") || lower.includes("gasoline") || lower.includes("petrol")) fuelType = "Gasolina";

  if (fuelType) {
    return { fuelType, fuelTypePrimary: primaryRaw, fuelTypeSecondary: secondaryRaw };
  }
  return {
    fuelType: "Otro",
    fuelTypeCustom: raw,
    fuelTypePrimary: primaryRaw,
    fuelTypeSecondary: secondaryRaw,
  };
}

function resolveTrimFields(raw: Record<string, string>): {
  trim?: string;
  trim2?: string;
  series?: string;
  series2?: string;
  version?: string;
} {
  const trim = nhtsaValue(raw, "Trim");
  const trim2 = nhtsaValue(raw, "Trim2");
  const series = nhtsaValue(raw, "Series");
  const series2 = nhtsaValue(raw, "Series2");

  let displayTrim = trim ? titleCaseWords(trim) : undefined;
  if (!displayTrim && series) displayTrim = titleCaseWords(series);
  if (!displayTrim && trim2) displayTrim = titleCaseWords(trim2);

  let version = displayTrim;
  if (trim && series && trim.toLowerCase() !== series.toLowerCase()) {
    version = `${titleCaseWords(trim)} / ${titleCaseWords(series)}`;
  }

  return {
    trim: displayTrim,
    trim2: trim2 ? titleCaseWords(trim2) : undefined,
    series: series ? titleCaseWords(series) : undefined,
    series2: series2 ? titleCaseWords(series2) : undefined,
    version,
  };
}

function buildEngineLabel(raw: Record<string, string>): string | undefined {
  const engineModel = nhtsaValue(raw, "EngineModel");
  const config = nhtsaValue(raw, "EngineConfiguration");
  const cyl = nhtsaValue(raw, "EngineCylinders");
  const dispL = parseOptionalFloat(nhtsaValue(raw, "DisplacementL"));
  const dispCC = nhtsaValue(raw, "DisplacementCC");
  const turbo = nhtsaValue(raw, "Turbo");
  const parts: string[] = [];
  if (dispL) parts.push(`${dispL}L`);
  else if (dispCC) parts.push(`${dispCC} cc`);
  if (config) parts.push(config);
  else if (cyl) parts.push(`${cyl}-cyl`);
  if (turbo && !/^not/i.test(turbo)) parts.push(turbo);
  if (parts.length) return parts.join(" ");
  return engineModel ? titleCaseWords(engineModel) : undefined;
}

function computeCompleteness(fields: Partial<AutosVehicleStructuredFields>): AutosNhtsaDecodeMetadata {
  const availableFields = Object.entries(fields)
    .filter(([k, v]) => k !== "nhtsaDecode" && v !== undefined && v !== null && v !== "")
    .map(([k]) => k);

  const importantFilled = IMPORTANT_DECODE_FIELDS.filter((f) => {
    const v = fields[f];
    return v !== undefined && v !== null && v !== "";
  }).length;

  const score = Math.round((importantFilled / IMPORTANT_DECODE_FIELDS.length) * 100);
  let completenessStatus: AutosNhtsaCompletenessStatus = "minimal";
  if (score >= 70) completenessStatus = "full";
  else if (score >= 40) completenessStatus = "partial";

  return {
    source: "nhtsa_vpic",
    decodedAt: new Date().toISOString(),
    completenessScore: score,
    completenessStatus,
    availableFields,
  };
}

export function mapNhtsaDecodeToAutosVehicleFields(
  raw: Record<string, string>,
  normalizedVin: string,
): Partial<AutosVehicleStructuredFields> {
  const trimFields = resolveTrimFields(raw);
  const engine = buildEngineLabel(raw);
  const bodyClassRaw = nhtsaValue(raw, "BodyClass", "BodyType");
  const body = mapBodyStyle(bodyClassRaw);
  const driveRaw = nhtsaValue(raw, "DriveType");
  const drive = mapDrivetrain(driveRaw);
  const trans = mapTransmission(nhtsaValue(raw, "TransmissionStyle"), nhtsaValue(raw, "TransmissionSpeeds"));
  const fuel = mapFuel(nhtsaValue(raw, "FuelTypePrimary"), nhtsaValue(raw, "FuelTypeSecondary"));
  const gvwrFrom = nhtsaValue(raw, "GVWR");
  const gvwrTo = nhtsaValue(raw, "GVWR_to");
  const gvwr = gvwrFrom && gvwrTo && gvwrFrom !== gvwrTo ? `${gvwrFrom}–${gvwrTo}` : gvwrFrom ?? gvwrTo;

  const fields: Partial<AutosVehicleStructuredFields> = {
    vin: normalizedVin,
    year: parseOptionalInt(nhtsaValue(raw, "ModelYear")),
    make: nhtsaValue(raw, "Make") ? titleCaseWords(nhtsaValue(raw, "Make")!) : undefined,
    model: nhtsaValue(raw, "Model") ? titleCaseWords(nhtsaValue(raw, "Model")!) : undefined,
    ...trimFields,
    engine,
    motor: engine,
    engineModel: nhtsaValue(raw, "EngineModel") ? titleCaseWords(nhtsaValue(raw, "EngineModel")!) : undefined,
    engineManufacturer: nhtsaValue(raw, "EngineManufacturer")
      ? titleCaseWords(nhtsaValue(raw, "EngineManufacturer")!)
      : undefined,
    engineConfiguration: nhtsaValue(raw, "EngineConfiguration"),
    engineCylinders: parseOptionalInt(nhtsaValue(raw, "EngineCylinders")),
    engineHP: parseOptionalInt(nhtsaValue(raw, "EngineHP")),
    engineKW: parseOptionalInt(nhtsaValue(raw, "EngineKW")),
    displacementL: parseOptionalFloat(nhtsaValue(raw, "DisplacementL")),
    displacementCC: parseOptionalInt(nhtsaValue(raw, "DisplacementCC")),
    displacementCI: parseOptionalFloat(nhtsaValue(raw, "DisplacementCI")),
    turbo: nhtsaValue(raw, "Turbo"),
    valveTrain: nhtsaValue(raw, "ValveTrainDesign"),
    bodyClass: bodyClassRaw,
    vehicleType: nhtsaValue(raw, "VehicleType"),
    vehicleDescriptor: nhtsaValue(raw, "VehicleDescriptor"),
    doors: parseOptionalInt(nhtsaValue(raw, "Doors")),
    cabType: nhtsaValue(raw, "CabType"),
    bedType: nhtsaValue(raw, "BedType"),
    bedLength: nhtsaValue(raw, "BedLengthIN"),
    gvwr,
    manufacturer: nhtsaValue(raw, "Manufacturer", "ManufacturerName")
      ? titleCaseWords(nhtsaValue(raw, "Manufacturer", "ManufacturerName")!)
      : undefined,
    manufacturerId: nhtsaValue(raw, "ManufacturerId"),
    plantCountry: nhtsaValue(raw, "PlantCountry"),
    plantState: nhtsaValue(raw, "PlantState"),
    plantCity: nhtsaValue(raw, "PlantCity"),
    plantCompanyName: nhtsaValue(raw, "PlantCompanyName"),
    electrificationLevel: nhtsaValue(raw, "ElectrificationLevel"),
    safetyFeatures: mapSafetyFeatures(raw),
    ...body,
    ...drive,
    ...trans,
    ...fuel,
  };

  const cleaned: Partial<AutosVehicleStructuredFields> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== "") {
      (cleaned as Record<string, unknown>)[k] = v;
    }
  }

  const metadata = computeCompleteness(cleaned);
  cleaned.nhtsaDecode = metadata;
  if (cleaned.trim) cleaned.vinDetectedTrim = cleaned.trim;

  return cleaned;
}

function countFilled(fields: Partial<AutosVehicleStructuredFields>): number {
  return Object.entries(fields).filter(([k, v]) => k !== "nhtsaDecode" && v !== undefined && v !== null && v !== "").length;
}

export async function decodeAutosVinWithNhtsa(input: {
  vin: string;
  modelYear?: number;
}): Promise<AutosNhtsaVinDecodeResult> {
  const normalizedVin = normalizeVinInput(input.vin);
  if (!isValidVinCandidate(normalizedVin)) {
    return { ok: false, fields: {}, filledCount: 0, error: "invalid_vin" };
  }

  const yearQ =
    input.modelYear && Number.isFinite(input.modelYear) ? `&modelyear=${encodeURIComponent(String(input.modelYear))}` : "";
  const url = `${VPIC_DECODE_URL}/${encodeURIComponent(normalizedVin)}?format=json${yearQ}`;

  let json: { Results?: Record<string, string>[] };
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, fields: {}, filledCount: 0, error: "network" };
    json = (await res.json()) as { Results?: Record<string, string>[] };
  } catch {
    return { ok: false, fields: {}, filledCount: 0, error: "network" };
  }

  const row = json.Results?.[0];
  if (!row || typeof row !== "object") {
    return { ok: false, fields: {}, filledCount: 0, error: "empty_response" };
  }

  const fields = mapNhtsaDecodeToAutosVehicleFields(row, normalizedVin);
  const filledCount = countFilled(fields);
  if (filledCount <= 1) {
    return { ok: false, fields, filledCount, error: "empty_response", rawNhtsa: row, metadata: fields.nhtsaDecode };
  }

  return {
    ok: true,
    fields,
    filledCount,
    rawNhtsa: row,
    metadata: fields.nhtsaDecode,
  };
}

export {
  mergeDecodedVehicleFieldsIntoDraft,
  getDecodedVehicleFieldSummary,
  getMissingStructuredFields,
} from "./autosVehicleStructuredData";
