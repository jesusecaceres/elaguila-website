"use client";

import { useEffect, useMemo, useState } from "react";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";
import { resolveAutosLandingInventory } from "../../data/sampleAutosPublicInventory";

type ApiPayload = { ok?: boolean; listings?: AutosPublicListing[]; configured?: boolean };

/**
 * Active public Autos listings, with the same blueprint fallback as the landing page when the API is empty.
 */
export function useAutosPublicListingsFetch() {
  const [listings, setListings] = useState<AutosPublicListing[]>([]);
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
          setListings(j.listings);
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

  const inventory = useMemo(() => resolveAutosLandingInventory(listings), [listings]);

  return { listings: inventory, configured, loaded };
}
