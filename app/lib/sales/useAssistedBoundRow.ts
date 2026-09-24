"use client";

/**
 * ASSISTED REOPEN (client side) — load the SERVER copy of the canonical row a staff session is
 * bound to, once per reopen, so an intake can hydrate its form from server truth instead of from
 * whatever this browser remembers.
 *
 * Usage inside a category intake (staff-only path; customers get 401 and see `status: "none"`):
 *
 *   const assisted = useAssistedBoundRow("servicios");
 *   useEffect(() => {
 *     if (assisted.status !== "ready" || !assisted.shouldHydrate) return;
 *     applyMyExistingRowToDraftMapper(assisted.bound.row);   // the category's OWN mapper
 *     assisted.markHydrated();
 *   }, [assisted.status, assisted.shouldHydrate, ...]);
 *
 * `shouldHydrate` is true only until `markHydrated()` runs for this (category, listingId) in this
 * browser tab, so Preview -> "Volver a editar" never overwrites in-progress edits with the stored
 * row. The cockpit calls `clearAssistedHydrationMarkers()` on every reopen, which is what makes a
 * reopen always load server truth. Holds no authority: the server decides what it returns.
 */
import { useCallback, useEffect, useState } from "react";
import type { QuickSalesCategory } from "./quickSalesCategories";

export type AssistedBoundRowClient = {
  category: QuickSalesCategory;
  listingSource: string;
  listingId: string;
  row: Record<string, unknown>;
  children: Record<string, unknown>[];
};

const MARKER_PREFIX = "leonix.assisted.hydrated.v1:";

function markerKey(category: string, listingId: string): string {
  return `${MARKER_PREFIX}${category}:${listingId}`;
}

function readMarker(category: string, listingId: string): boolean {
  try {
    return window.sessionStorage.getItem(markerKey(category, listingId)) === "1";
  } catch {
    return false;
  }
}

function writeMarker(category: string, listingId: string): void {
  try {
    window.sessionStorage.setItem(markerKey(category, listingId), "1");
  } catch {
    /* sessionStorage unavailable: hydrate may repeat, which only re-loads server truth */
  }
}

/** Called by the cockpit on every reopen so the next intake load hydrates from the server row. */
export function clearAssistedHydrationMarkers(): void {
  try {
    const drop: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(MARKER_PREFIX)) drop.push(key);
    }
    for (const key of drop) window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** One-shot fetch for callers that are not React components. Null = no staff session or no bound row. */
export async function fetchAssistedBoundRow(category: QuickSalesCategory): Promise<AssistedBoundRowClient | null> {
  try {
    const res = await fetch("/api/admin/sales-preview/bound-row", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; bound?: AssistedBoundRowClient | null };
    if (json.ok !== true || !json.bound || json.bound.category !== category) return null;
    return json.bound;
  } catch {
    return null;
  }
}

export type UseAssistedBoundRow =
  | { status: "loading"; bound: null; shouldHydrate: false; markHydrated: () => void }
  | { status: "none"; bound: null; shouldHydrate: false; markHydrated: () => void }
  | { status: "ready"; bound: AssistedBoundRowClient; shouldHydrate: boolean; markHydrated: () => void };

export function useAssistedBoundRow(category: QuickSalesCategory): UseAssistedBoundRow {
  const [state, setState] = useState<{ status: "loading" | "none" | "ready"; bound: AssistedBoundRowClient | null; hydrated: boolean }>({
    status: "loading",
    bound: null,
    hydrated: false,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const bound = await fetchAssistedBoundRow(category);
      if (cancelled) return;
      if (!bound) {
        setState({ status: "none", bound: null, hydrated: false });
        return;
      }
      setState({ status: "ready", bound, hydrated: readMarker(category, bound.listingId) });
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const markHydrated = useCallback(() => {
    setState((prev) => {
      if (prev.status === "ready" && prev.bound) writeMarker(category, prev.bound.listingId);
      return prev.status === "ready" ? { ...prev, hydrated: true } : prev;
    });
  }, [category]);

  if (state.status === "ready" && state.bound) {
    return { status: "ready", bound: state.bound, shouldHydrate: !state.hydrated, markHydrated };
  }
  return { status: state.status === "loading" ? "loading" : "none", bound: null, shouldHydrate: false, markHydrated };
}
