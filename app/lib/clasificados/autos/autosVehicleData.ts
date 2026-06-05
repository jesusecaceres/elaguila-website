/**
 * A5.VDATA-B — Unified Autos vehicle data facade.
 *
 * Single import surface for publish UI, normalization, and search-readiness helpers.
 * Partial starter data: Toyota Camry, Honda Civic, Ford F-150 (Gate B).
 * Gate C expands curated seed — no external APIs.
 */
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import {
  AUTOS_VEHICLE_MAKES,
  getAutosVehicleYearOptions,
  getModelsForMake,
  getTrimOptionsForMakeModel,
  resolveMakeToCanonical,
  resolveModelToCanonical,
} from "./autosVehicleTaxonomy";
import {
  getEngineOptionsForVehicle,
  resolveEngineToCatalog,
} from "./autosVehicleEngineOptions";
import {
  resolveStructuredEngineOption,
  resolveStructuredTrimOption,
} from "./autosVehicleStructuredSeed";
import { buildAutosVehicleNormalizedIdentity } from "./autosVehicleSearchNormalize";
import { autosVehicleSpecAdjustHelper } from "./autosVehicleSpecHints";
import type { AutosVehicleNormalizedIdentity, AutosVehicleStructuredSelection } from "./autosVehicleDataTypes";

export type {
  AutosVehicleDataConfidence,
  AutosVehicleDataSource,
  AutosVehicleEngineOption,
  AutosVehicleTrimOption,
  AutosVehicleYearMakeModelData,
  AutosVehicleStructuredSelection,
  AutosVehicleNormalizedIdentity,
  VehicleYearMakeModelData,
} from "./autosVehicleDataTypes";

export {
  AUTOS_VEHICLE_MAKES,
  getAutosVehicleYearOptions,
  getModelsForMake,
  resolveMakeToCanonical,
  resolveModelToCanonical,
};

export { autosVehicleSpecAdjustHelper };

/** ES/EN copy when no structured trims exist for selected model. */
export function autosVehicleNoStructuredTrimHint(lang: "es" | "en"): string {
  return lang === "es"
    ? "No encontramos trims estructurados para este modelo. Puedes escribirlo manualmente."
    : "We do not have structured trims for this model yet. You can enter it manually.";
}

/**
 * Known trim labels for year/make/model. Returns [] when no curated data (free-text fallback).
 * Year is accepted for future year-scoped seed; currently optional/partial.
 */
export function getKnownTrimsForVehicle(
  _year: number | undefined,
  make: string | undefined,
  model: string | undefined,
): readonly string[] {
  if (!make?.trim() || !model?.trim()) return [];
  return getTrimOptionsForMakeModel(make, model);
}

/**
 * Known engine labels for trim. Returns [] when no curated data (free-text fallback).
 */
export function getKnownEnginesForTrim(
  _year: number | undefined,
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): readonly string[] {
  if (!make?.trim() || !model?.trim()) return [];
  return getEngineOptionsForVehicle(make, model, trim);
}

export function normalizeVehicleMake(value: string | undefined): string | undefined {
  const canon = resolveMakeToCanonical(value);
  if (canon) return canon;
  const t = value?.trim();
  return t ? normalizeVehicleSegment(t) ?? t : undefined;
}

export function normalizeVehicleModel(
  make: string | undefined,
  value: string | undefined,
): string | undefined {
  const canon = resolveModelToCanonical(make, value);
  if (canon) return canon;
  const t = value?.trim();
  return t ? normalizeVehicleSegment(t) ?? t : undefined;
}

export function normalizeVehicleTrim(
  make: string | undefined,
  model: string | undefined,
  value: string | undefined,
): string | undefined {
  const t = value?.trim();
  if (!t) return undefined;
  const structured = resolveStructuredTrimOption(make, model, t);
  return structured?.normalizedValue ?? normalizeVehicleSegment(t) ?? t;
}

export function normalizeVehicleEngine(
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
  value: string | undefined,
): string | undefined {
  const t = value?.trim();
  if (!t) return undefined;
  return (
    resolveEngineToCatalog(t) ??
    resolveStructuredEngineOption(make, model, trim, t)?.normalizedValue ??
    normalizeVehicleSegment(t) ??
    t
  );
}

/** Structured + custom values → normalized identity and keyword tokens for future search. */
export function buildVehicleSearchKeywords(
  selection: AutosVehicleStructuredSelection,
): AutosVehicleNormalizedIdentity {
  return buildAutosVehicleNormalizedIdentity(selection);
}

export function hasKnownTrimsForVehicle(
  year: number | undefined,
  make: string | undefined,
  model: string | undefined,
): boolean {
  return getKnownTrimsForVehicle(year, make, model).length > 0;
}

export function hasKnownEnginesForTrim(
  year: number | undefined,
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): boolean {
  return getKnownEnginesForTrim(year, make, model, trim).length > 0;
}
