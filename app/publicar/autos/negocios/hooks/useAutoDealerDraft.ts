"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AutoDealerListing, DealerHoursEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  clearAutosNegociosDraft,
  loadAutosNegociosDraftResolved,
  saveAutosNegociosDraftResolved,
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

  const persist = useCallback(async (next: AutoDealerListing, override: boolean) => {
    const normalized = normalizeLoadedListing(next);
    const payload: AutosNegociosDraftV1 = { v: 1, vehicleTitleOverride: override, listing: normalized };
    await saveAutosNegociosDraftResolved(payload);
  }, []);

  useEffect(() => {
    const run = async () => {
      const d = await loadAutosNegociosDraftResolved();
      if (d) {
        setVehicleTitleOverride(d.vehicleTitleOverride);
        setListing(normalizeLoadedListing(d.listing));
      }
      setHydrated(true);
    };
    void run();
  }, []);

  const setListingPatch = useCallback(
    (patch: Partial<AutoDealerListing>) => {
      setListing((prev) => {
        const merged: AutoDealerListing = { ...prev, ...patch };
        if (patch.dealerSocials !== undefined) {
          merged.dealerSocials = { ...prev.dealerSocials, ...patch.dealerSocials };
        }
        const next = applyAutoTitle(merged, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const replaceListing = useCallback(
    (next: AutoDealerListing) => {
      const withTitle = applyAutoTitle(next, overrideRef.current);
      const normalized = normalizeLoadedListing(withTitle);
      setListing(normalized);
      void persist(normalized, overrideRef.current);
    },
    [persist],
  );

  const setVehicleTitleOverrideState = useCallback(
    (v: boolean) => {
      setVehicleTitleOverride(v);
      setListing((prev) => {
        const next = applyAutoTitle(prev, v);
        void persist(next, v);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const updateDealerHourRow = useCallback(
    (rowId: string, patch: Partial<DealerHoursEntry>) => {
      setListing((prev) => {
        const rows = [...(prev.dealerHours ?? [])];
        const i = rows.findIndex((r) => r.rowId === rowId);
        if (i < 0) return prev;
        rows[i] = { ...rows[i]!, ...patch };
        const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
      });
    },
    [persist],
  );

  const removeDealerHourRow = useCallback(
    (rowId: string) => {
      setListing((prev) => {
        const before = prev.dealerHours ?? [];
        const rows = before.filter((r) => r.rowId !== rowId);
        if (rows.length === before.length) return prev;
        const next = applyAutoTitle({ ...prev, dealerHours: rows }, overrideRef.current);
        void persist(next, overrideRef.current);
        return normalizeLoadedListing(next);
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
    updateDealerHourRow,
    removeDealerHourRow,
  };
}
