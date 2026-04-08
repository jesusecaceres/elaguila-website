"use client";

import { useEffect, useState } from "react";
import type { AutosPublicListing } from "../../data/autosPublicSampleTypes";

type ApiPayload = { ok?: boolean; listings?: AutosPublicListing[]; configured?: boolean };

/**
 * Active public Autos listings (no sample fallback). Empty when DB is off or there are no active rows.
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

  return { listings, configured, loaded };
}
