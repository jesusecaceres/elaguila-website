import type { AutosVehicleStructuredFields } from "./autosVehicleStructuredData";

const VPIC_DECODE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues";

const INVALID_VIN_CHARS = /[IOQ]/i;

export type AutosNhtsaVinDecodeResult = {
  ok: boolean;
  fields: Partial<AutosVehicleStructuredFields>;
  filledCount: number;
  error?: "invalid_vin" | "network" | "empty_response" | "parse_failed";
  rawNhtsa?: Record<string, string>;
};

export function normalizeVinInput(vin: string | undefined | null): string {
  return (vin ?? "").replace(/\s+/g, "").toUpperCase();
}

/** True when VIN looks complete enough to decode (17 chars, no I/O/Q). */
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
    if (v === "0" && key.toLowerCase().includes("door")) continue;
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

function mapDrivetrain(raw: string | undefined): Pick<AutosVehicleStructuredFields, "drivetrain" | "drivetrainCustom"> {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  if (lower.includes("fwd") || lower.includes("front-wheel")) return { drivetrain: "FWD" };
  if (lower.includes("rwd") || lower.includes("rear-wheel")) return { drivetrain: "RWD" };
  if (lower.includes("awd") || lower.includes("all-wheel")) return { drivetrain: "AWD" };
  if (lower.includes("4wd") || lower.includes("4x4") || lower.includes("four-wheel")) return { drivetrain: "4WD" };
  return { drivetrain: "Otro", drivetrainCustom: raw };
}

function mapTransmission(raw: string | undefined): Pick<AutosVehicleStructuredFields, "transmission" | "transmissionCustom"> {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  if (lower.includes("cvt")) return { transmission: "CVT" };
  if (lower.includes("manual")) return { transmission: "Manual" };
  if (lower.includes("dual clutch") || lower.includes("dct")) return { transmission: "Automática de doble embrague" };
  if (lower.includes("auto")) return { transmission: "Automática" };
  return { transmission: "Otro", transmissionCustom: raw };
}

function mapFuel(raw: string | undefined): Pick<AutosVehicleStructuredFields, "fuelType" | "fuelTypeCustom"> {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  if (lower.includes("electric") && !lower.includes("hybrid")) return { fuelType: "Eléctrico" };
  if (lower.includes("plug") || lower.includes("phev")) return { fuelType: "Híbrido enchufable" };
  if (lower.includes("hybrid")) return { fuelType: "Híbrido" };
  if (lower.includes("diesel")) return { fuelType: "Diésel" };
  if (lower.includes("premium")) return { fuelType: "Gasolina premium" };
  if (lower.includes("gas") || lower.includes("gasoline") || lower.includes("petrol")) return { fuelType: "Gasolina" };
  return { fuelType: "Otro", fuelTypeCustom: raw };
}

function buildEngineLabel(raw: Record<string, string>): string | undefined {
  const disp = nhtsaValue(raw, "DisplacementL", "DisplacementCC");
  const cyl = nhtsaValue(raw, "EngineCylinders");
  const config = nhtsaValue(raw, "EngineConfiguration");
  const model = nhtsaValue(raw, "EngineModel");
  const parts: string[] = [];
  const dispN = parseOptionalFloat(disp);
  if (dispN) parts.push(`${dispN}L`);
  if (config) parts.push(config);
  else if (cyl) parts.push(`${cyl}-cyl`);
  if (parts.length) return parts.join(" ");
  return model ? titleCaseWords(model) : undefined;
}

export function mapNhtsaDecodeToAutosVehicleFields(
  raw: Record<string, string>,
  normalizedVin: string,
): Partial<AutosVehicleStructuredFields> {
  const yearRaw = nhtsaValue(raw, "ModelYear");
  const makeRaw = nhtsaValue(raw, "Make");
  const modelRaw = nhtsaValue(raw, "Model");
  const trimRaw = nhtsaValue(raw, "Trim", "Trim2", "Series", "Series2");
  const engine = buildEngineLabel(raw);
  const body = mapBodyStyle(nhtsaValue(raw, "BodyClass", "BodyType"));
  const drive = mapDrivetrain(nhtsaValue(raw, "DriveType"));
  const trans = mapTransmission(nhtsaValue(raw, "TransmissionStyle", "TransmissionSpeeds"));
  const fuel = mapFuel(nhtsaValue(raw, "FuelTypePrimary", "FuelTypeSecondary"));

  const fields: Partial<AutosVehicleStructuredFields> = {
    vin: normalizedVin,
    year: parseOptionalInt(yearRaw),
    make: makeRaw ? titleCaseWords(makeRaw) : undefined,
    model: modelRaw ? titleCaseWords(modelRaw) : undefined,
    trim: trimRaw ? titleCaseWords(trimRaw) : undefined,
    version: trimRaw ? titleCaseWords(trimRaw) : undefined,
    engine,
    motor: engine,
    engineCylinders: parseOptionalInt(nhtsaValue(raw, "EngineCylinders")),
    displacementL: parseOptionalFloat(nhtsaValue(raw, "DisplacementL")),
    vehicleType: nhtsaValue(raw, "VehicleType", "VehicleDescriptor"),
    doors: parseOptionalInt(nhtsaValue(raw, "Doors")),
    manufacturer: nhtsaValue(raw, "Manufacturer", "ManufacturerName")
      ? titleCaseWords(nhtsaValue(raw, "Manufacturer", "ManufacturerName")!)
      : undefined,
    plantCountry: nhtsaValue(raw, "PlantCountry"),
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
  return cleaned;
}

function countFilled(fields: Partial<AutosVehicleStructuredFields>): number {
  return Object.values(fields).filter((v) => v !== undefined && v !== null && v !== "").length;
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
    return { ok: false, fields, filledCount, error: "empty_response", rawNhtsa: row };
  }

  return { ok: true, fields, filledCount, rawNhtsa: row };
}
