"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

const LIVE_SELECT =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, status, is_published, created_at, images, contact_phone, contact_email";

/**
 * Dedup merge: live rows first (newest), optional demo tail for dev (`NEXT_PUBLIC_RENTAS_INCLUDE_DEMO_POOL=1`).
 */
export function mergeStagedRentasWithDemo(staged: RentasPublicListing[], demo: RentasPublicListing[]): RentasPublicListing[] {
  const seen = new Set<string>();
  const out: RentasPublicListing[] = [];
  const stagedSorted = [...staged].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  for (const l of stagedSorted) {
    if (seen.has(l.id)) continue;
    seen.add(l.id);
    out.push(l);
  }
  for (const l of demo) {
    if (seen.has(l.id)) continue;
    seen.add(l.id);
    out.push(l);
  }
  return out;
}

export function getDemoRentasBrowsePool(): RentasPublicListing[] {
  const map = new Map<string, RentasPublicListing>();
  for (const l of [rentasResultsFeatured, ...rentasResultsGridDemo]) {
    map.set(l.id, l);
  }
  return [...map.values()];
}

export type UseRentasPublicBrowseInventoryResult = {
  /** Live `listings` rows only (subset of merged when demo off). */
  staged: RentasPublicListing[];
  mergedPool: RentasPublicListing[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useRentasPublicBrowseInventory(opts: {
  initialLiveListings: RentasPublicListing[];
  lang: "es" | "en";
  includeDemoPool: boolean;
}): UseRentasPublicBrowseInventoryResult {
  const { initialLiveListings, lang, includeDemoPool } = opts;
  const [live, setLive] = useState<RentasPublicListing[]>(initialLiveListings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setLive(initialLiveListings);
  }, [initialLiveListings]);

  useEffect(() => {
    if (tick === 0 && initialLiveListings.length > 0) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: qErr } = await supabase
          .from("listings")
          .select(LIVE_SELECT)
          .eq("category", "rentas")
          .eq("status", "active")
          .or("is_published.is.null,is_published.eq.true")
          .order("created_at", { ascending: false })
          .limit(2000);

        if (cancelled) return;
        if (qErr) {
          setError(qErr.message);
          setLoading(false);
          return;
        }

        const mapped: RentasPublicListing[] = [];
        for (const raw of data ?? []) {
          const row = raw as Record<string, unknown>;
          if (row.is_published === false) continue;
          const m = mapListingRowToRentasPublicListing(row, lang);
          if (m && m.browseActive !== false) mapped.push(m);
        }
        setLive(mapped);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLiveListings.length, lang, tick]);

  const demoPool = useMemo(() => (includeDemoPool ? getDemoRentasBrowsePool() : []), [includeDemoPool]);
  const mergedPool = useMemo(() => mergeStagedRentasWithDemo(live, demoPool), [live, demoPool]);

  return {
    staged: live,
    mergedPool,
    loading,
    error,
    refetch,
  };
}
