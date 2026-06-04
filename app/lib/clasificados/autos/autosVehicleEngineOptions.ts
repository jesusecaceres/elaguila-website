import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { resolveMakeToCanonical, resolveModelToCanonical } from "@/app/lib/clasificados/autos/autosVehicleTaxonomy";
import {
  autosHasDraftTrailingSpace,
  autosPreserveDraftTypingValue,
} from "@/app/lib/clasificados/autos/autosPublishFormText";
import {
  AUTOS_VEHICLE_STRUCTURED_SEED,
  getStructuredEngineOptions,
  resolveStructuredEngineOption,
} from "@/app/lib/clasificados/autos/autosVehicleStructuredSeed";

/** Legacy curated engines (make → model → trim → engines). Merged with structured seed. */
const ENGINES_BY_MAKE_MODEL_TRIM: Record<string, Record<string, Record<string, readonly string[]>>> = {
  Toyota: {
    Camry: {
      LE: ["2.5L I4", "2.5L Hybrid"],
      SE: ["2.5L I4", "2.5L Hybrid"],
      XLE: ["2.5L I4", "2.5L Hybrid"],
      XSE: ["2.5L I4", "2.5L Hybrid"],
    },
    Corolla: {
      L: ["1.8L I4", "2.0L I4"],
      LE: ["1.8L I4", "2.0L I4"],
      SE: ["2.0L I4", "1.8L Hybrid"],
    },
    RAV4: {
      LE: ["2.5L I4", "2.5L Hybrid"],
      XLE: ["2.5L I4", "2.5L Hybrid"],
      Limited: ["2.5L I4", "2.5L Hybrid"],
    },
  },
  Honda: {
    Civic: {
      LX: ["2.0L I4", "1.5L Turbo I4"],
      Sport: ["1.5L Turbo I4", "2.0L I4"],
      Touring: ["1.5L Turbo I4"],
      "Type R": ["2.0L Turbo I4"],
    },
    Accord: {
      LX: ["1.5L Turbo I4", "2.0L Turbo I4", "2.0L Hybrid"],
      EX: ["1.5L Turbo I4", "2.0L Hybrid"],
      Touring: ["2.0L Turbo I4", "2.0L Hybrid"],
    },
    "CR-V": {
      LX: ["1.5L Turbo I4", "2.0L Hybrid"],
      EX: ["1.5L Turbo I4", "2.0L Hybrid"],
      Touring: ["1.5L Turbo I4", "2.0L Hybrid"],
    },
  },
  Ford: {
    "F-150": {
      XLT: ["2.7L EcoBoost V6", "3.5L EcoBoost V6", "5.0L V8"],
      Lariat: ["2.7L EcoBoost V6", "3.5L EcoBoost V6", "5.0L V8"],
      Raptor: ["3.5L High-Output EcoBoost V6"],
    },
    Mustang: {
      EcoBoost: ["2.3L EcoBoost I4"],
      GT: ["5.0L V8"],
    },
  },
  Tesla: {
    "Model Y": {
      __any__: ["Electric"],
    },
  },
};

const ENGINE_LOOKUP = new Map<string, string>();

function registerEngine(label: string) {
  const key = label.toLowerCase().replace(/\s+/g, " ");
  if (!ENGINE_LOOKUP.has(key)) ENGINE_LOOKUP.set(key, label);
}

for (const byMake of Object.values(ENGINES_BY_MAKE_MODEL_TRIM)) {
  for (const byModel of Object.values(byMake)) {
    for (const engines of Object.values(byModel)) {
      for (const e of engines) registerEngine(e);
    }
  }
}

for (const entry of AUTOS_VEHICLE_STRUCTURED_SEED) {
  for (const tr of entry.trims) {
    for (const e of tr.engines ?? []) registerEngine(e.label);
  }
}

function legacyEngineOptions(
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): readonly string[] {
  const m = resolveMakeToCanonical(make);
  const mo = resolveModelToCanonical(make, model);
  if (!m || !mo) return [];
  const byModel = ENGINES_BY_MAKE_MODEL_TRIM[m]?.[mo];
  if (!byModel) return [];

  const trimCanon = trim?.trim();
  if (trimCanon && byModel[trimCanon]) return byModel[trimCanon] ?? [];
  if (byModel.__any__) return byModel.__any__;

  const merged = new Set<string>();
  for (const list of Object.values(byModel)) for (const e of list) merged.add(e);
  return [...merged].sort((a, b) => a.localeCompare(b));
}

export function getEngineOptionsForVehicle(
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): readonly string[] {
  const structured = getStructuredEngineOptions(make, model, trim).map((e) => e.label);
  const legacy = legacyEngineOptions(make, model, trim);
  const merged = new Set<string>([...structured, ...legacy]);
  return [...merged].sort((a, b) => a.localeCompare(b));
}

export function resolveEngineToCatalog(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return ENGINE_LOOKUP.get(t.toLowerCase().replace(/\s+/g, " "));
}

/** Display string for specs/preview; filters should use `engineNormalized` when set. */
export function resolveEngineForDisplay(listing: Pick<AutoDealerListing, "engine" | "engineNormalized">): string | undefined {
  const norm = listing.engineNormalized?.trim();
  if (norm) return norm;
  const raw = listing.engine?.trim();
  if (!raw) return undefined;
  return normalizeVehicleSegment(raw) ?? raw;
}

export function coerceEngineFromCatalog(
  listing: Pick<AutoDealerListing, "make" | "model" | "trim" | "engine" | "engineNormalized">,
  opts?: { liveDraft?: boolean },
): Pick<AutoDealerListing, "engine" | "engineNormalized"> {
  const raw = listing.engine;
  if (!raw?.trim()) return { engine: undefined, engineNormalized: undefined };

  if (opts?.liveDraft && autosHasDraftTrailingSpace(raw)) {
    return { engine: raw, engineNormalized: listing.engineNormalized };
  }

  const trimmed = raw.trim();
  const catalog = resolveEngineToCatalog(trimmed);
  if (catalog) {
    return {
      engine: autosPreserveDraftTypingValue(raw, catalog),
      engineNormalized: catalog,
    };
  }

  const structured = resolveStructuredEngineOption(listing.make, listing.model, listing.trim, trimmed);
  if (structured) {
    return {
      engine: autosPreserveDraftTypingValue(raw, structured.normalizedValue),
      engineNormalized: structured.normalizedValue,
    };
  }

  const options = getEngineOptionsForVehicle(listing.make, listing.model, listing.trim);
  const match = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  if (match) {
    return {
      engine: autosPreserveDraftTypingValue(raw, match),
      engineNormalized: match,
    };
  }

  const normalized = normalizeVehicleSegment(trimmed) ?? trimmed;
  return {
    engine: autosPreserveDraftTypingValue(raw, normalized),
    engineNormalized: undefined,
  };
}
