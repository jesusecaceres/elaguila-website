import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import {
  autosHasDraftTrailingSpace,
  autosPreserveDraftTypingValue,
} from "@/app/lib/clasificados/autos/autosPublishFormText";
import {
  getStructuredTrimOptions,
} from "@/app/lib/clasificados/autos/autosVehicleStructuredSeed";

/**
 * Curated Autos vehicle taxonomy (US marketplace oriented). Expand by editing `MODELS_BY_MAKE`.
 * No external APIs — all data is static and Autos-scoped.
 */

const MODELS_BY_MAKE: Record<string, readonly string[]> = {
  Toyota: [
    "Camry",
    "Corolla",
    "Corolla Cross",
    "RAV4",
    "Tacoma",
    "Tundra",
    "Sequoia",
    "Highlander",
    "4Runner",
    "Land Cruiser",
    "Prius",
    "Sienna",
    "Avalon",
    "Venza",
    "C-HR",
    "Yaris",
    "Supra",
    "GR86",
    "Celica",
  ],
  Honda: [
    "Civic",
    "Accord",
    "CR-V",
    "HR-V",
    "Pilot",
    "Passport",
    "Odyssey",
    "Ridgeline",
    "Fit",
    "Insight",
  ],
  Ford: [
    "F-150",
    "F-250",
    "F-350",
    "Ranger",
    "Maverick",
    "Mustang",
    "Explorer",
    "Expedition",
    "Escape",
    "Edge",
    "Bronco",
    "Bronco Sport",
    "Focus",
    "Fusion",
    "Transit",
  ],
  Chevrolet: [
    "Silverado 1500",
    "Silverado 2500",
    "Silverado 3500",
    "Colorado",
    "Malibu",
    "Equinox",
    "Trax",
    "Trailblazer",
    "Blazer",
    "Tahoe",
    "Suburban",
    "Camaro",
    "Corvette",
    "Traverse",
    "Bolt EV",
  ],
  Nissan: [
    "Altima",
    "Sentra",
    "Versa",
    "Rogue",
    "Kicks",
    "Murano",
    "Pathfinder",
    "Armada",
    "Frontier",
    "Titan",
    "Maxima",
    "Leaf",
    "Z",
  ],
  Hyundai: [
    "Elantra",
    "Sonata",
    "Accent",
    "Venue",
    "Kona",
    "Tucson",
    "Santa Fe",
    "Santa Cruz",
    "Palisade",
    "Ioniq 5",
  ],
  Kia: [
    "Forte",
    "K5",
    "Optima",
    "Rio",
    "Seltos",
    "Sportage",
    "Sorento",
    "Telluride",
    "Carnival",
    "Soul",
    "Niro",
    "EV6",
    "Stinger",
  ],
  Jeep: [
    "Wrangler",
    "Grand Cherokee",
    "Cherokee",
    "Compass",
    "Renegade",
    "Gladiator",
    "Wagoneer",
    "Grand Wagoneer",
  ],
  Dodge: ["Charger", "Challenger", "Durango", "Journey", "Grand Caravan", "Hornet"],
  Ram: ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
  GMC: [
    "Sierra 1500",
    "Sierra 2500",
    "Sierra 3500",
    "Canyon",
    "Terrain",
    "Acadia",
    "Yukon",
    "Yukon XL",
  ],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX"],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "CLA",
    "GLA",
    "GLB",
    "GLC",
    "GLE",
    "GLS",
    "G-Class",
  ],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  Volkswagen: ["Jetta", "Passat", "Golf", "GTI", "Taos", "Tiguan", "Atlas", "ID.4", "Arteon"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Mazda: ["Mazda3", "Mazda6", "CX-30", "CX-5", "CX-50", "CX-9", "CX-90", "MX-5 Miata"],
  Subaru: ["Impreza", "Legacy", "Crosstrek", "Forester", "Outback", "Ascent", "WRX", "BRZ", "Solterra"],
  Lexus: ["ES", "IS", "LS", "UX", "NX", "RX", "TX", "GX", "LX", "RZ", "LC"],
  Acura: ["Integra", "TLX", "RDX", "MDX", "ZDX", "NSX"],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Cadillac: ["CT4", "CT5", "XT4", "XT5", "XT6", "Escalade", "Lyriq"],
  Lincoln: ["Corsair", "Nautilus", "Aviator", "Navigator"],
  Buick: ["Encore", "Encore GX", "Envision", "Enclave"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Mitsubishi: ["Outlander", "Outlander Sport", "Eclipse Cross", "Mirage", "Mirage G4"],
};

/** All makes we advertise in the picker (includes makes we may not have full model lists for yet). */
export const AUTOS_VEHICLE_MAKES: readonly string[] = [
  "Acura",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ford",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jeep",
  "Kia",
  "Lexus",
  "Lincoln",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
].sort((a, b) => a.localeCompare(b));

const MAKE_LOOKUP = new Map<string, string>(
  AUTOS_VEHICLE_MAKES.map((m) => [m.toLowerCase().replace(/\s+/g, " "), m]),
);

/** Legacy trim mirror — seed in autosVehicleStructuredSeed.ts is primary. Gate C starter models only. */
const TRIMS_BY_MAKE_MODEL: Record<string, Record<string, readonly string[]>> = {};

export function getAutosVehicleYearOptions(): number[] {
  const max = new Date().getFullYear() + 1;
  const min = 1985;
  const out: number[] = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}

export function getModelsForMake(make: string | undefined): readonly string[] {
  const canon = resolveMakeToCanonical(make);
  if (!canon) return [];
  return MODELS_BY_MAKE[canon] ?? [];
}

export function getTrimOptionsForMakeModel(make: string | undefined, model: string | undefined): readonly string[] {
  const m = resolveMakeToCanonical(make);
  const mo = resolveModelToCanonical(make, model);
  if (!m || !mo) return [];

  const merged = new Set<string>();
  for (const t of getStructuredTrimOptions(m, mo)) merged.add(t.label);
  const byModel = TRIMS_BY_MAKE_MODEL[m];
  if (byModel?.[mo]) {
    for (const t of byModel[mo]) merged.add(t);
  }
  return [...merged].sort((a, b) => a.localeCompare(b));
}

/** Case-insensitive match → canonical catalog make, or undefined if unknown. */
export function resolveMakeToCanonical(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return MAKE_LOOKUP.get(t.toLowerCase().replace(/\s+/g, " "));
}

/** When make is known, map free-text model to catalog spelling if it matches ignoring case. */
export function resolveModelToCanonical(make: string | undefined, raw: string | undefined): string | undefined {
  const models = getModelsForMake(make);
  if (models.length === 0) return undefined;
  const t = raw?.trim();
  if (!t) return undefined;
  const tl = t.toLowerCase().replace(/\s+/g, " ");
  for (const m of models) {
    if (m.toLowerCase().replace(/\s+/g, " ") === tl) return m;
  }
  return undefined;
}

/**
 * When load/save normalization: upgrade obvious typos/casing to catalog make/model when unambiguous.
 * Unknown values are preserved (only light trim casing via normalizeVehicleSegment).
 */
export function coerceVehicleIdentityFromTaxonomy(
  listing: AutoDealerListing,
  opts?: { liveDraft?: boolean },
): AutoDealerListing {
  const makeRaw = listing.make;
  const modelRaw = listing.model;
  const trimRaw = listing.trim;

  if (opts?.liveDraft) {
    if (
      autosHasDraftTrailingSpace(makeRaw) ||
      autosHasDraftTrailingSpace(modelRaw) ||
      autosHasDraftTrailingSpace(trimRaw)
    ) {
      return listing;
    }
  }

  const makeTrimmed = makeRaw?.trim();
  const modelTrimmed = modelRaw?.trim();
  const trimTrimmed = trimRaw?.trim();

  const makeCanon =
    resolveMakeToCanonical(makeTrimmed) ??
    (makeTrimmed ? normalizeVehicleSegment(makeTrimmed) ?? makeTrimmed : undefined);

  const catalogModels = getModelsForMake(makeCanon ?? makeTrimmed);
  let modelOut: string | undefined;
  if (modelTrimmed) {
    if (catalogModels.length > 0) {
      modelOut =
        resolveModelToCanonical(makeCanon ?? makeTrimmed, modelTrimmed) ??
        (normalizeVehicleSegment(modelTrimmed) ?? modelTrimmed);
    } else {
      modelOut = normalizeVehicleSegment(modelTrimmed) ?? modelTrimmed;
    }
  }

  const trimOut = trimTrimmed ? normalizeVehicleSegment(trimTrimmed) ?? trimTrimmed : undefined;

  return {
    ...listing,
    make: autosPreserveDraftTypingValue(makeRaw, makeCanon ?? makeTrimmed),
    model: autosPreserveDraftTypingValue(modelRaw, modelOut ?? modelTrimmed),
    trim: autosPreserveDraftTypingValue(trimRaw, trimOut ?? trimTrimmed),
  };
}
