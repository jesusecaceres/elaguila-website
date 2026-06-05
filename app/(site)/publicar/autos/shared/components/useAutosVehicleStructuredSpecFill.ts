"use client";

import { useEffect, useRef } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  buildSafeAutosVehicleSpecHintPatch,
  getAutosVehicleSpecHints,
} from "@/app/lib/clasificados/autos/autosVehicleSpecHints";
import {
  getKnownEnginesForTrim,
  getKnownTrimsForVehicle,
} from "@/app/lib/clasificados/autos/autosVehicleData";

/**
 * When user picks a catalog trim or engine, safely pre-fill empty spec fields only.
 * Never overwrites user-edited values.
 */
export function useAutosVehicleStructuredSpecFill({
  listing,
  onPatch,
}: {
  lang: "es" | "en";
  listing: AutoDealerListing;
  onPatch: (patch: Partial<AutoDealerListing>) => void;
}): void {
  const prevTrim = useRef(listing.trim);
  const prevEngineNorm = useRef(listing.engineNormalized ?? listing.engine);

  useEffect(() => {
    const trimChanged = listing.trim !== prevTrim.current;
    const engineChanged =
      (listing.engineNormalized ?? listing.engine) !== prevEngineNorm.current;

    prevTrim.current = listing.trim;
    prevEngineNorm.current = listing.engineNormalized ?? listing.engine;

    if (!trimChanged && !engineChanged) return;

    const trimCatalog =
      listing.trim?.trim() &&
      getKnownTrimsForVehicle(listing.year, listing.make, listing.model).some(
        (t) => t.toLowerCase() === listing.trim!.trim().toLowerCase(),
      );

    const engineLabel = listing.engineNormalized?.trim() || listing.engine?.trim();
    const engineCatalog =
      engineLabel &&
      getKnownEnginesForTrim(listing.year, listing.make, listing.model, listing.trim).some(
        (e) => e.toLowerCase() === engineLabel.toLowerCase(),
      );

    if ((trimChanged && trimCatalog) || (engineChanged && engineCatalog)) {
      const hints = getAutosVehicleSpecHints({
        make: listing.make,
        model: listing.model,
        trim: listing.trim,
        engine: listing.engine,
        engineNormalized: listing.engineNormalized,
      });
      const patch = buildSafeAutosVehicleSpecHintPatch(listing, hints);
      if (Object.keys(patch).length > 0) onPatch(patch);
    }
  }, [
    listing.trim,
    listing.engine,
    listing.engineNormalized,
    listing.year,
    listing.make,
    listing.model,
    listing.transmission,
    listing.drivetrain,
    listing.fuelType,
    listing.bodyStyle,
    onPatch,
  ]);
}
