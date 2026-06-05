/**
 * Gate B partial starter fixture — NOT complete coverage.
 * Gate C expands to additional high-volume models.
 */
import type {
  AutosVehicleEngineOption,
  AutosVehicleTrimOption,
  VehicleYearMakeModelData,
} from "./autosVehicleDataTypes";

const SRC = "manual_curated_seed" as const;
const CONF = "curated" as const;

function eng(
  label: string,
  extra?: Partial<Omit<AutosVehicleEngineOption, "label" | "normalizedValue">>,
): AutosVehicleEngineOption {
  return { label, normalizedValue: label, source: SRC, confidence: CONF, ...extra };
}

function trim(
  label: string,
  extra?: Partial<Omit<AutosVehicleTrimOption, "label" | "normalizedValue">>,
): AutosVehicleTrimOption {
  return { label, normalizedValue: label, source: SRC, confidence: CONF, ...extra };
}

/** Gate B starter models only: Camry, Civic, F-150. */
export const AUTOS_VEHICLE_STRUCTURED_SEED: readonly VehicleYearMakeModelData[] = [
  {
    make: "Toyota",
    model: "Camry",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LE", {
        engines: [eng("2.5L I4", { fuelType: "gasoline" }), eng("2.5L Hybrid", { fuelType: "hybrid", hybridOrEv: true })],
        transmissions: ["automatic"],
        drivetrains: ["fwd"],
        bodyStyles: ["sedan"],
        fuelTypes: ["gasoline", "hybrid"],
      }),
      trim("SE", {
        engines: [eng("2.5L I4"), eng("2.5L Hybrid", { fuelType: "hybrid", hybridOrEv: true })],
        transmissions: ["automatic"],
        drivetrains: ["fwd"],
        bodyStyles: ["sedan"],
      }),
      trim("XLE", { engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("XSE", { engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Honda",
    model: "Civic",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { engines: [eng("2.0L I4"), eng("1.5L Turbo I4")] }),
      trim("Sport", { engines: [eng("1.5L Turbo I4"), eng("2.0L I4")] }),
      trim("EX", { engines: [eng("1.5L Turbo I4")] }),
      trim("Touring", { engines: [eng("1.5L Turbo I4")] }),
      trim("Si", { engines: [eng("1.5L Turbo I4")] }),
      trim("Type R", { engines: [eng("2.0L Turbo I4")] }),
    ],
  },
  {
    make: "Ford",
    model: "F-150",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("XL", { engines: [eng("3.3L V6"), eng("2.7L EcoBoost V6"), eng("5.0L V8")] }),
      trim("XLT", { engines: [eng("2.7L EcoBoost V6"), eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Lariat", { engines: [eng("2.7L EcoBoost V6"), eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Raptor", { engines: [eng("3.5L High-Output EcoBoost V6")] }),
    ],
  },
];

const SEED_BY_MAKE_MODEL = new Map<string, VehicleYearMakeModelData>(
  AUTOS_VEHICLE_STRUCTURED_SEED.map((entry) => [`${entry.make}::${entry.model}`, entry]),
);

function trimKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ");
}

export function getStructuredVehicleEntry(
  make: string | undefined,
  model: string | undefined,
): VehicleYearMakeModelData | undefined {
  if (!make?.trim() || !model?.trim()) return undefined;
  return SEED_BY_MAKE_MODEL.get(`${make}::${model}`);
}

export function getStructuredTrimOptions(
  make: string | undefined,
  model: string | undefined,
): readonly AutosVehicleTrimOption[] {
  return getStructuredVehicleEntry(make, model)?.trims ?? [];
}

export function resolveStructuredTrimOption(
  make: string | undefined,
  model: string | undefined,
  trimValue: string | undefined,
): AutosVehicleTrimOption | undefined {
  const t = trimValue?.trim();
  if (!t) return undefined;
  const key = trimKey(t);
  for (const opt of getStructuredTrimOptions(make, model)) {
    if (trimKey(opt.label) === key || trimKey(opt.normalizedValue) === key) return opt;
    for (const alias of opt.aliases ?? []) {
      if (trimKey(alias) === key) return opt;
    }
  }
  return undefined;
}

export function getStructuredEngineOptions(
  make: string | undefined,
  model: string | undefined,
  trimValue: string | undefined,
): readonly AutosVehicleEngineOption[] {
  const trimOpt = resolveStructuredTrimOption(make, model, trimValue);
  if (trimOpt?.engines?.length) return trimOpt.engines;

  const entry = getStructuredVehicleEntry(make, model);
  if (!entry) return [];

  const merged = new Map<string, AutosVehicleEngineOption>();
  for (const tr of entry.trims) {
    for (const e of tr.engines ?? []) merged.set(e.normalizedValue, e);
  }
  return [...merged.values()];
}

export function resolveStructuredEngineOption(
  make: string | undefined,
  model: string | undefined,
  trimValue: string | undefined,
  engine: string | undefined,
): AutosVehicleEngineOption | undefined {
  const e = engine?.trim();
  if (!e) return undefined;
  const key = trimKey(e);
  for (const opt of getStructuredEngineOptions(make, model, trimValue)) {
    if (trimKey(opt.label) === key || trimKey(opt.normalizedValue) === key) return opt;
    for (const alias of opt.aliases ?? []) {
      if (trimKey(alias) === key) return opt;
    }
  }
  return undefined;
}
