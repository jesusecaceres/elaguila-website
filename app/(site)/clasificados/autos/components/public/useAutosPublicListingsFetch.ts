"use client";

import { useEffect, useMemo, useState } from "react";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { resolveAutosLandingInventory } from "../../data/sampleAutosPublicInventory";

type ApiPayload = { ok?: boolean; listings?: AutosPublicListing[]; configured?: boolean };

/**
 * Fetches live public listings; merges demo sample only when `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` and API is empty.
 */
export function useAutosPublicListingsFetch() {
  const [apiListings, setApiListings] = useState<AutosPublicListing[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/clasificados/autos/public/listings");
        const j = (await r.json()) as ApiPayload;
        if (cancelled) return;
        if (j.ok && Array.isArray(j.listings)) {
          setApiListings(j.listings);
          setConfigured(j.configured !== false);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listings = useMemo(() => resolveAutosLandingInventory(apiListings), [apiListings]);

  /** True when demo blueprint is filling an otherwise-empty API response. */
  const isDemoInventory = useMemo(
    () => apiListings.length === 0 && listings.length > 0,
    [apiListings.length, listings.length],
  );

  return { listings, apiListings, isDemoInventory, configured, loaded };
}
