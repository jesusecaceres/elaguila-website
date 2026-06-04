/**
 * Curated high-volume Autos models (partial coverage — not global).
 * Source: manual_curated_seed for initial structured dropdown foundation.
 */
import type {
  AutosVehicleEngineOption,
  AutosVehicleTrimOption,
  VehicleYearMakeModelData,
} from "./autosVehicleDataTypes";

const SRC = "manual_curated_seed" as const;
const CONF = "curated" as const;
const PARTIAL_CONF = "partial" as const;

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

/** Partial seed — expand incrementally; never claim complete global coverage. */
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
      trim("TRD", { engines: [eng("3.5L V6")] }),
      trim("Nightshade", { engines: [eng("2.5L I4")] }),
    ],
  },
  {
    make: "Toyota",
    model: "Corolla",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("L", { engines: [eng("1.8L I4"), eng("2.0L I4")] }),
      trim("LE", { engines: [eng("1.8L I4"), eng("2.0L I4")] }),
      trim("SE", { engines: [eng("2.0L I4"), eng("1.8L Hybrid", { hybridOrEv: true })] }),
      trim("XLE", { engines: [eng("1.8L I4"), eng("2.0L I4")] }),
      trim("XSE", { engines: [eng("2.0L I4")] }),
      trim("APEX", { engines: [eng("2.0L I4")] }),
    ],
  },
  {
    make: "Toyota",
    model: "RAV4",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LE", {
        engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })],
        drivetrains: ["awd", "fwd"],
        bodyStyles: ["suv"],
      }),
      trim("XLE", { engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("Limited", { engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("Adventure", { engines: [eng("2.5L I4")] }),
      trim("TRD Off-Road", { engines: [eng("2.5L I4")] }),
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
    make: "Honda",
    model: "Accord",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { engines: [eng("1.5L Turbo I4"), eng("2.0L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Sport", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX-L", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Touring", { engines: [eng("2.0L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Honda",
    model: "CR-V",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Sport", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX-L", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Touring", { engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
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
      trim("King Ranch", { engines: [eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Platinum", { engines: [eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Limited", { engines: [eng("3.5L EcoBoost V6")] }),
      trim("Raptor", { engines: [eng("3.5L High-Output EcoBoost V6")] }),
    ],
  },
  {
    make: "Chevrolet",
    model: "Silverado 1500",
    source: SRC,
    confidence: PARTIAL_CONF,
    trims: [
      trim("Work Truck", { engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trim("Custom", { engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trim("LT", { engines: [eng("2.7L Turbo I4"), eng("5.3L V8"), eng("3.0L Duramax Diesel")] }),
      trim("RST", { engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trim("LTZ", { engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trim("High Country", { engines: [eng("6.2L V8")] }),
    ],
  },
  {
    make: "Nissan",
    model: "Altima",
    source: SRC,
    confidence: PARTIAL_CONF,
    trims: [
      trim("S", { engines: [eng("2.5L I4")] }),
      trim("SV", { engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
      trim("SR", { engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
      trim("SL", { engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
      trim("Platinum", { engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
    ],
  },
  {
    make: "Tesla",
    model: "Model 3",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Standard Range", {
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
        fuelTypes: ["electric"],
        drivetrains: ["rwd", "awd"],
      }),
      trim("Long Range", {
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
      }),
      trim("Performance", {
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
      }),
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
  trim: string | undefined,
): AutosVehicleTrimOption | undefined {
  const t = trim?.trim();
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
  trim: string | undefined,
): readonly AutosVehicleEngineOption[] {
  const trimOpt = resolveStructuredTrimOption(make, model, trim);
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
  trim: string | undefined,
  engine: string | undefined,
): AutosVehicleEngineOption | undefined {
  const e = engine?.trim();
  if (!e) return undefined;
  const key = trimKey(e);
  for (const opt of getStructuredEngineOptions(make, model, trim)) {
    if (trimKey(opt.label) === key || trimKey(opt.normalizedValue) === key) return opt;
    for (const alias of opt.aliases ?? []) {
      if (trimKey(alias) === key) return opt;
    }
  }
  return undefined;
}
