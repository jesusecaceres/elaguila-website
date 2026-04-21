"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

const STAGED_SELECT =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, status, is_published, created_at, images";

/**
 * **Staged testing:** merges `listings` rows (`category=rentas`, active, published) with demo fixtures.
 * Demo IDs are preserved; staged UUID rows are prepended (newest first). Swap for production search later.
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

export type UseRentasStagedInventoryResult = {
  staged: RentasPublicListing[];
  /** Staged `listings` rows first (newest), then demo pool (deduped by `id`). */
  mergedPool: RentasPublicListing[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useRentasStagedInventory(lang: "es" | "en"): UseRentasStagedInventoryResult {
  const [staged, setStaged] = useState<RentasPublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error: qErr } = await supabase
          .from("listings")
          .select(STAGED_SELECT)
          .eq("category", "rentas")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(200);

        if (cancelled) return;
        if (qErr) {
          setError(qErr.message);
          setStaged([]);
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
        setStaged(mapped);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, tick]);

  const demoPool = useMemo(() => getDemoRentasBrowsePool(), []);
  const mergedPool = useMemo(() => mergeStagedRentasWithDemo(staged, demoPool), [staged, demoPool]);

  return {
    staged,
    mergedPool,
    loading,
    error,
    refetch,
  };
}
