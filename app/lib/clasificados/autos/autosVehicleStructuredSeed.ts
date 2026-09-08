/**
 * Gate C partial starter fixture — NOT complete global/year-perfect coverage.
 * Make/model-level curated data only; year-specific trim/engine variance is deferred to VDATA-D.
 */
import type {
  AutosVehicleEngineOption,
  AutosVehicleTrimOption,
  VehicleYearMakeModelData,
} from "./autosVehicleDataTypes";

const SRC = "manual_curated_seed" as const;
const CONF = "curated" as const;
const PARTIAL = "partial" as const;

/** Audit marker: starter seed is intentionally incomplete. */
export const AUTOS_VEHICLE_STARTER_SEED_IS_PARTIAL = true as const;

/** Gate C starter model list (make::model). Not exhaustive for all catalog models. */
export const AUTOS_VEHICLE_STARTER_SEED_MODELS: readonly string[] = [
  "Toyota::Camry",
  "Toyota::Corolla",
  "Toyota::RAV4",
  "Toyota::Tacoma",
  "Honda::Civic",
  "Honda::Accord",
  "Honda::CR-V",
  "Ford::F-150",
  "Ford::Explorer",
  "Ford::Mustang",
  "Chevrolet::Silverado 1500",
  "Chevrolet::Tahoe",
  "Chevrolet::Malibu",
  "Nissan::Altima",
  "Nissan::Rogue",
  "Nissan::Sentra",
  "Tesla::Model 3",
  "Tesla::Model Y",
  "Toyota::Sequoia",
  "Toyota::Tundra",
  "Toyota::Highlander",
  "Toyota::4Runner",
  "Honda::Pilot",
  "Honda::Passport",
  "Jeep::Grand Cherokee",
  "Jeep::Wrangler",
  "Ram::1500",
  "GMC::Sierra 1500",
  "Chevrolet::Colorado",
  "Hyundai::Tucson",
  "Kia::Telluride",
  "Subaru::Outback",
  "Chrysler::Pacifica",
];

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

function trimPartial(
  label: string,
  extra?: Partial<Omit<AutosVehicleTrimOption, "label" | "normalizedValue">>,
): AutosVehicleTrimOption {
  return { label, normalizedValue: label, source: SRC, confidence: PARTIAL, ...extra };
}

const sedan = { bodyStyles: ["sedan"] as const, transmissions: ["automatic"] as const };
const suv = { bodyStyles: ["suv"] as const, transmissions: ["automatic"] as const };
const truck = { bodyStyles: ["pickup"] as const, transmissions: ["automatic"] as const };
const minivan = { bodyStyles: ["minivan"] as const, transmissions: ["automatic"] as const };

export const AUTOS_VEHICLE_STRUCTURED_SEED: readonly VehicleYearMakeModelData[] = [
  {
    make: "Toyota",
    model: "Camry",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LE", { ...sedan, drivetrains: ["fwd"], engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true, fuelType: "hybrid" })] }),
      trim("SE", { ...sedan, drivetrains: ["fwd"], engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("XLE", { ...sedan, engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("XSE", { ...sedan, engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Toyota",
    model: "Corolla",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("L", { ...sedan, engines: [eng("1.8L I4"), eng("2.0L I4")] }),
      trim("LE", { ...sedan, engines: [eng("1.8L I4"), eng("2.0L I4")] }),
      trim("SE", { ...sedan, engines: [eng("2.0L I4"), eng("1.8L Hybrid", { hybridOrEv: true })] }),
      trim("XLE", { ...sedan, engines: [eng("1.8L I4"), eng("2.0L I4")] }),
    ],
  },
  {
    make: "Toyota",
    model: "RAV4",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LE", { ...suv, drivetrains: ["awd", "fwd"], engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("XLE", { ...suv, engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("Limited", { ...suv, engines: [eng("2.5L I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trim("Adventure", { ...suv, engines: [eng("2.5L I4")] }),
    ],
  },
  {
    make: "Toyota",
    model: "Tacoma",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("SR", { ...truck, engines: [eng("2.7L I4"), eng("3.5L V6")] }),
      trimPartial("SR5", { ...truck, engines: [eng("3.5L V6")] }),
      trimPartial("TRD Sport", { ...truck, engines: [eng("3.5L V6")] }),
      trimPartial("TRD Off-Road", { ...truck, engines: [eng("3.5L V6")] }),
    ],
  },
  {
    make: "Honda",
    model: "Civic",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { ...sedan, engines: [eng("2.0L I4"), eng("1.5L Turbo I4")] }),
      trim("Sport", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trim("EX", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trim("Touring", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trim("Si", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trim("Type R", { ...sedan, engines: [eng("2.0L Turbo I4")] }),
    ],
  },
  {
    make: "Honda",
    model: "Accord",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { ...sedan, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX", { ...sedan, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Sport", { ...sedan, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Touring", { ...sedan, engines: [eng("2.0L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Honda",
    model: "CR-V",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { ...suv, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("EX", { ...suv, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Sport", { ...suv, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
      trim("Touring", { ...suv, engines: [eng("1.5L Turbo I4"), eng("2.0L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Ford",
    model: "F-150",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("XL", { ...truck, engines: [eng("3.3L V6"), eng("2.7L EcoBoost V6"), eng("5.0L V8")] }),
      trim("XLT", { ...truck, engines: [eng("2.7L EcoBoost V6"), eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Lariat", { ...truck, engines: [eng("2.7L EcoBoost V6"), eng("3.5L EcoBoost V6"), eng("5.0L V8")] }),
      trim("Raptor", { ...truck, engines: [eng("3.5L High-Output EcoBoost V6")] }),
    ],
  },
  {
    make: "Ford",
    model: "Explorer",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("Base", { ...suv, engines: [eng("2.3L EcoBoost I4"), eng("3.0L EcoBoost V6")] }),
      trimPartial("XLT", { ...suv, engines: [eng("2.3L EcoBoost I4"), eng("3.0L EcoBoost V6")] }),
      trimPartial("Limited", { ...suv, engines: [eng("2.3L EcoBoost I4"), eng("3.0L EcoBoost V6")] }),
      trimPartial("ST", { ...suv, engines: [eng("3.0L EcoBoost V6")] }),
    ],
  },
  {
    make: "Ford",
    model: "Mustang",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("EcoBoost", { ...sedan, bodyStyles: ["coupe"], engines: [eng("2.3L EcoBoost I4")] }),
      trim("GT", { bodyStyles: ["coupe"], engines: [eng("5.0L V8")] }),
    ],
  },
  {
    make: "Chevrolet",
    model: "Silverado 1500",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("Work Truck", { ...truck, engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trimPartial("LT", { ...truck, engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trimPartial("RST", { ...truck, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trimPartial("LTZ", { ...truck, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
    ],
  },
  {
    make: "Chevrolet",
    model: "Tahoe",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("LS", { ...suv, engines: [eng("5.3L V8")] }),
      trimPartial("LT", { ...suv, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trimPartial("RST", { ...suv, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trimPartial("Premier", { ...suv, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
    ],
  },
  {
    make: "Chevrolet",
    model: "Malibu",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("LS", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trimPartial("LT", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
      trimPartial("RS", { ...sedan, engines: [eng("2.0L Turbo I4")] }),
      trimPartial("Premier", { ...sedan, engines: [eng("1.5L Turbo I4")] }),
    ],
  },
  {
    make: "Nissan",
    model: "Altima",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("S", { ...sedan, engines: [eng("2.5L I4")] }),
      trimPartial("SV", { ...sedan, engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
      trimPartial("SR", { ...sedan, engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
      trimPartial("SL", { ...sedan, engines: [eng("2.5L I4"), eng("2.0L Turbo I4")] }),
    ],
  },
  {
    make: "Nissan",
    model: "Rogue",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("S", { ...suv, engines: [eng("2.5L I4")] }),
      trimPartial("SV", { ...suv, engines: [eng("2.5L I4")] }),
      trimPartial("SL", { ...suv, engines: [eng("2.5L I4")] }),
      trimPartial("Platinum", { ...suv, engines: [eng("2.5L I4")] }),
    ],
  },
  {
    make: "Nissan",
    model: "Sentra",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("S", { ...sedan, engines: [eng("2.0L I4")] }),
      trimPartial("SV", { ...sedan, engines: [eng("2.0L I4")] }),
      trimPartial("SR", { ...sedan, engines: [eng("2.0L I4")] }),
    ],
  },
  {
    make: "Tesla",
    model: "Model 3",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("Standard Range", {
        fuelTypes: ["electric"],
        drivetrains: ["rwd"],
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
      }),
      trimPartial("Long Range", {
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
      }),
      trimPartial("Performance", {
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
      }),
    ],
  },
  {
    make: "Tesla",
    model: "Model Y",
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("Long Range", {
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
      }),
      trimPartial("Performance", {
        fuelTypes: ["electric"],
        drivetrains: ["awd"],
        engines: [eng("Electric", { fuelType: "electric", hybridOrEv: true })],
      }),
    ],
  },
  // --- Broad trim coverage batch (VDATA-D-lite): hand-curated, verified against multiple
  // current dealer trim-comparison pages per model. No external dataset imported — see
  // AUTOS_VEHICLE_DATA_POLICY.md and the trim-dataset audit for why (no compliant license
  // with real trim names was found). "partial" confidence marks a trim/lineup with a recent
  // or year-sensitive change worth double-checking before treating as year-complete.
  {
    make: "Toyota",
    model: "Sequoia",
    yearFrom: 2023,
    source: SRC,
    confidence: CONF,
    trims: [
      trim("SR5", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Limited", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Platinum", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("TRD Pro", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      // 1794 Edition added for MY2025 — not offered on MY2023-2024 Sequoia.
      trimPartial("1794", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Capstone", { ...suv, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Toyota",
    model: "Tundra",
    yearFrom: 2022,
    source: SRC,
    confidence: CONF,
    trims: [
      trim("SR", { ...truck, engines: [eng("3.4L Twin-Turbo V6"), eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("SR5", { ...truck, engines: [eng("3.4L Twin-Turbo V6"), eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Limited", { ...truck, engines: [eng("3.4L Twin-Turbo V6"), eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Platinum", { ...truck, engines: [eng("3.4L Twin-Turbo V6"), eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trimPartial("1794 Edition", { ...truck, engines: [eng("3.4L Twin-Turbo V6"), eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("TRD Pro", { ...truck, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
      trim("Capstone", { ...truck, engines: [eng("3.4L Twin-Turbo V6 Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Toyota",
    model: "Highlander",
    yearFrom: 2026,
    source: SRC,
    confidence: PARTIAL,
    trims: [
      trimPartial("XLE", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trimPartial("XSE", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trimPartial("Limited", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
      trimPartial("Platinum", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.5L Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Toyota",
    model: "4Runner",
    yearFrom: 2025,
    source: SRC,
    confidence: CONF,
    trims: [
      trim("SR5", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
      trim("TRD Sport", { ...suv, engines: [eng("2.4L Turbo I4")] }),
      trim("TRD Off-Road", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
      trim("Limited", { ...suv, engines: [eng("2.4L Turbo I4"), eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
      trim("Platinum", { ...suv, engines: [eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
      trim("TRD Pro", { ...suv, engines: [eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
      trim("Trailhunter", { ...suv, engines: [eng("2.4L Turbo I4 Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Honda",
    model: "Pilot",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Sport", { ...suv, engines: [eng("3.5L V6")] }),
      trim("EX-L", { ...suv, engines: [eng("3.5L V6")] }),
      trim("TrailSport", { ...suv, engines: [eng("3.5L V6")] }),
      trim("Touring", { ...suv, engines: [eng("3.5L V6")] }),
      trim("Elite", { ...suv, engines: [eng("3.5L V6")] }),
      trim("Black Edition", { ...suv, engines: [eng("3.5L V6")] }),
    ],
  },
  {
    make: "Honda",
    model: "Passport",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("EX-L", { ...suv, engines: [eng("3.5L V6")] }),
      trim("TrailSport", { ...suv, engines: [eng("3.5L V6")] }),
      trim("Black Edition", { ...suv, engines: [eng("3.5L V6")] }),
    ],
  },
  {
    make: "Jeep",
    model: "Grand Cherokee",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Laredo", { ...suv, engines: [eng("3.6L V6")] }),
      trim("Altitude", { ...suv, engines: [eng("3.6L V6")] }),
      trim("Limited", { ...suv, engines: [eng("3.6L V6")] }),
      trim("Overland", { ...suv, engines: [eng("3.6L V6")], drivetrains: ["4wd"] }),
      trim("Summit", { ...suv, engines: [eng("3.6L V6")], drivetrains: ["4wd"] }),
    ],
  },
  {
    make: "Jeep",
    model: "Wrangler",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Sport", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
      trim("Sport S", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
      trim("Willys", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
      trim("Sahara", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
      trim("Rubicon", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
      trim("High Altitude", { bodyStyles: ["suv"], drivetrains: ["4wd"], engines: [eng("3.6L V6")] }),
    ],
  },
  {
    make: "Ram",
    model: "1500",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Tradesman", { ...truck, engines: [eng("3.6L V6"), eng("3.0L Turbo I6")] }),
      trim("Big Horn", { ...truck, engines: [eng("3.6L V6"), eng("3.0L Turbo I6")] }),
      trim("Laramie", { ...truck, engines: [eng("3.0L Turbo I6")] }),
      trim("Rebel", { ...truck, engines: [eng("3.0L Turbo I6")], drivetrains: ["4wd"] }),
      trim("RHO", { ...truck, engines: [eng("3.0L High-Output Turbo I6")], drivetrains: ["4wd"] }),
      trim("Limited", { ...truck, engines: [eng("3.0L High-Output Turbo I6")] }),
      trim("Tungsten", { ...truck, engines: [eng("3.0L High-Output Turbo I6")] }),
    ],
  },
  {
    make: "GMC",
    model: "Sierra 1500",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Pro", { ...truck, engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trim("SLE", { ...truck, engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trim("Elevation", { ...truck, engines: [eng("2.7L Turbo I4"), eng("5.3L V8")] }),
      trim("SLT", { ...truck, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trim("AT4", { ...truck, engines: [eng("5.3L V8"), eng("6.2L V8")], drivetrains: ["4wd"] }),
      trim("AT4X", { ...truck, engines: [eng("6.2L V8")], drivetrains: ["4wd"] }),
      trim("Denali", { ...truck, engines: [eng("5.3L V8"), eng("6.2L V8")] }),
      trim("Denali Ultimate", { ...truck, engines: [eng("6.2L V8")] }),
    ],
  },
  {
    make: "Chevrolet",
    model: "Colorado",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("WT", { ...truck, engines: [eng("2.7L Turbo I4")] }),
      trim("LT", { ...truck, engines: [eng("2.7L Turbo I4")] }),
      trim("Trail Boss", { ...truck, engines: [eng("2.7L Turbo I4")], drivetrains: ["4wd"] }),
      trim("Z71", { ...truck, engines: [eng("2.7L Turbo I4")], drivetrains: ["4wd"] }),
      trim("ZR2", { ...truck, engines: [eng("2.7L Turbo I4")], drivetrains: ["4wd"] }),
    ],
  },
  {
    make: "Hyundai",
    model: "Tucson",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("SE", { ...suv, engines: [eng("2.5L I4")] }),
      trim("SEL", { ...suv, engines: [eng("2.5L I4")] }),
      trim("XRT", { ...suv, engines: [eng("2.5L I4")], drivetrains: ["awd"] }),
      trim("Limited", { ...suv, engines: [eng("2.5L I4"), eng("1.6L Turbo Hybrid", { hybridOrEv: true })] }),
    ],
  },
  {
    make: "Kia",
    model: "Telluride",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("LX", { ...suv, engines: [eng("3.8L V6")] }),
      trim("S", { ...suv, engines: [eng("3.8L V6")] }),
      trim("EX", { ...suv, engines: [eng("3.8L V6")] }),
      trim("SX", { ...suv, engines: [eng("3.8L V6")] }),
      trim("SX Prestige", { ...suv, engines: [eng("3.8L V6")] }),
    ],
  },
  {
    make: "Subaru",
    model: "Outback",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Base", { ...suv, drivetrains: ["awd"], engines: [eng("2.5L Flat-4")] }),
      trim("Premium", { ...suv, drivetrains: ["awd"], engines: [eng("2.5L Flat-4")] }),
      trim("Onyx Edition", { ...suv, drivetrains: ["awd"], engines: [eng("2.5L Flat-4")] }),
      trim("Wilderness", { ...suv, drivetrains: ["awd"], engines: [eng("2.4L Turbo Flat-4")] }),
      trim("Limited", { ...suv, drivetrains: ["awd"], engines: [eng("2.5L Flat-4")] }),
      trim("Touring", { ...suv, drivetrains: ["awd"], engines: [eng("2.5L Flat-4")] }),
    ],
  },
  {
    make: "Chrysler",
    model: "Pacifica",
    source: SRC,
    confidence: CONF,
    trims: [
      trim("Touring", { ...minivan, drivetrains: ["fwd", "awd"], engines: [eng("3.6L V6")] }),
      trim("Touring L", { ...minivan, drivetrains: ["fwd", "awd"], engines: [eng("3.6L V6")] }),
      trim("Limited", { ...minivan, drivetrains: ["fwd", "awd"], engines: [eng("3.6L V6")] }),
      trim("Pinnacle", { ...minivan, drivetrains: ["fwd", "awd"], engines: [eng("3.6L V6")] }),
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
  const canonMake = make.trim();
  const canonModel = model.trim();
  return (
    SEED_BY_MAKE_MODEL.get(`${canonMake}::${canonModel}`) ??
    [...SEED_BY_MAKE_MODEL.entries()].find(
      ([key]) => key.toLowerCase() === `${canonMake}::${canonModel}`.toLowerCase(),
    )?.[1]
  );
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

export function isAutosStarterSeedModel(make: string | undefined, model: string | undefined): boolean {
  const entry = getStructuredVehicleEntry(make, model);
  if (!entry) return false;
  return AUTOS_VEHICLE_STARTER_SEED_MODELS.includes(`${entry.make}::${entry.model}`);
}
