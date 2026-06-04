import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import {
  resolveMakeToCanonical,
  resolveModelToCanonical,
  getTrimOptionsForMakeModel,
} from "./autosVehicleTaxonomy";
import { resolveEngineToCatalog } from "./autosVehicleEngineOptions";
import {
  resolveStructuredEngineOption,
  resolveStructuredTrimOption,
} from "./autosVehicleStructuredSeed";
import type { AutosVehicleNormalizedIdentity } from "./autosVehicleDataTypes";

function pushUnique(out: string[], value: string | undefined) {
  const v = value?.trim();
  if (!v) return;
  const lower = v.toLowerCase();
  if (!out.some((x) => x.toLowerCase() === lower)) out.push(v);
}

/**
 * Prepare normalized identity + keyword tokens for future Autos search/filter.
 * Does not mutate listing or persist to DB in this gate.
 */
export function buildAutosVehicleNormalizedIdentity(
  listing: Pick<
    AutoDealerListing,
    "year" | "make" | "model" | "trim" | "engine" | "engineNormalized" | "vehicleTitle" | "otherEquipmentDetails"
  >,
): AutosVehicleNormalizedIdentity {
  const aliases: string[] = [];
  const keywords: string[] = [];

  const normalizedMake =
    resolveMakeToCanonical(listing.make) ??
    (listing.make?.trim() ? normalizeVehicleSegment(listing.make) ?? listing.make.trim() : undefined);

  const normalizedModel =
    resolveModelToCanonical(listing.make, listing.model) ??
    (listing.model?.trim() ? normalizeVehicleSegment(listing.model) ?? listing.model.trim() : undefined);

  let normalizedTrim: string | undefined;
  const trimRaw = listing.trim?.trim();
  if (trimRaw) {
    const structured = resolveStructuredTrimOption(listing.make, listing.model, trimRaw);
    normalizedTrim = structured?.normalizedValue ?? normalizeVehicleSegment(trimRaw) ?? trimRaw;
    for (const a of structured?.aliases ?? []) pushUnique(aliases, a);
  }

  const engineRaw = listing.engineNormalized?.trim() || listing.engine?.trim();
  let normalizedEngine: string | undefined;
  if (engineRaw) {
    normalizedEngine =
      resolveEngineToCatalog(engineRaw) ??
      resolveStructuredEngineOption(listing.make, listing.model, listing.trim, engineRaw)?.normalizedValue ??
      normalizeVehicleSegment(engineRaw) ??
      engineRaw;
    const engOpt = resolveStructuredEngineOption(listing.make, listing.model, listing.trim, engineRaw);
    for (const a of engOpt?.aliases ?? []) pushUnique(aliases, a);
  }

  if (listing.year) keywords.push(String(listing.year));
  pushUnique(keywords, normalizedMake);
  pushUnique(keywords, listing.make);
  pushUnique(keywords, normalizedModel);
  pushUnique(keywords, listing.model);
  pushUnique(keywords, normalizedTrim);
  pushUnique(keywords, listing.trim);
  pushUnique(keywords, normalizedEngine);
  pushUnique(keywords, listing.engine);
  pushUnique(keywords, listing.vehicleTitle);
  if (listing.otherEquipmentDetails?.trim()) {
    for (const token of listing.otherEquipmentDetails.split(/[,;\n]+/)) {
      pushUnique(keywords, token.trim());
    }
  }
  for (const a of aliases) pushUnique(keywords, a);

  return {
    normalizedMake,
    normalizedModel,
    normalizedTrim,
    normalizedEngine,
    aliases,
    keywords,
  };
}

export function hasStructuredTrimOptions(make: string | undefined, model: string | undefined): boolean {
  return getTrimOptionsForMakeModel(make, model).length > 0;
}
