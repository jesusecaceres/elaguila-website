"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosNegociosDraft,
  loadAutosNegociosDraft,
  saveAutosNegociosDraft,
  type AutosNegociosDraftV1,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import {
  createEmptyListing,
  normalizeLoadedListing,
} from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";

function applyAutoTitle(listing: AutoDealerListing, override: boolean): AutoDealerListing {
  if (override) return listing;
  const t = buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim);
  return { ...listing, vehicleTitle: t || undefined };
}

export function useAutoDealerDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [vehicleTitleOverride, setVehicleTitleOverride] = useState(false);
  const [listing, setListing] = useState<AutoDealerListing>(() => createEmptyListing());
  const overrideRef = useRef(vehicleTitleOverride);
  overrideRef.current = vehicleTitleOverride;

  const persist = useCallback((next: AutoDealerListing, override: boolean) => {
    const payload: AutosNegociosDraftV1 = { v: 1, vehicleTitleOverride: override, listing: next };
    saveAutosNegociosDraft(payload);
  }, []);

  useEffect(() => {
    const d = loadAutosNegociosDraft();
    if (d) {
      setVehicleTitleOverride(d.vehicleTitleOverride);
      setListing(normalizeLoadedListing(d.listing));
    }
    setHydrated(true);
  }, []);

  const setListingPatch = useCallback(
    (patch: Partial<AutoDealerListing>) => {
      setListing((prev) => {
        const merged: AutoDealerListing = { ...prev, ...patch };
        const next = applyAutoTitle(merged, overrideRef.current);
        persist(next, overrideRef.current);
        return next;
      });
    },
    [persist],
  );

  const replaceListing = useCallback(
    (next: AutoDealerListing) => {
      const withTitle = applyAutoTitle(next, overrideRef.current);
      setListing(withTitle);
      persist(withTitle, overrideRef.current);
    },
    [persist],
  );

  const setVehicleTitleOverrideState = useCallback(
    (v: boolean) => {
      setVehicleTitleOverride(v);
      setListing((prev) => {
        const next = applyAutoTitle(prev, v);
        persist(next, v);
        return next;
      });
    },
    [persist],
  );

  const resetDraft = useCallback(() => {
    const empty = createEmptyListing();
    overrideRef.current = false;
    setVehicleTitleOverride(false);
    setListing(empty);
    clearAutosNegociosDraft();
  }, []);

  return {
    hydrated,
    vehicleTitleOverride,
    setVehicleTitleOverrideState,
    listing,
    setListingPatch,
    replaceListing,
    resetDraft,
  };
}
