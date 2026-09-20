"use client";

/**
 * Browser side of `businessBasePlanOffer` — asks the server which base package an EXISTING
 * business listing should be sold, and nothing else.
 *
 * Kept separate from the server module so no preview ever pulls the admin Supabase client into
 * the browser bundle, and shared by all four business previews so the question is asked one way.
 * The hook returns `null` until the server answers: "not yet known", never "nothing to offer".
 * Callers must therefore wait before showing an upgrade, which is the fail-closed direction.
 */

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export const BUSINESS_BASE_PLAN_OFFER_ROUTE = "/api/revenue-os/business-base-plan";

export type BusinessBasePlanOfferView = {
  mode: "new" | "resume" | "upgrade" | "settled";
  sellPackageKey: string | null;
  heldPackageKey: string | null;
  accessLevel: "none" | "simple" | "full";
  /** Server matrix price of `sellPackageKey`. Display only — checkout re-prices server-side. */
  sellPriceCents: number | null;
};

export function useBusinessBasePlanOffer(input: {
  category: string;
  listingId: string | null | undefined;
  /** Only ask for a listing-bound preview; a fresh application has no row to ask about. */
  enabled: boolean;
}): BusinessBasePlanOfferView | null {
  const { category, enabled } = input;
  const listingId = input.listingId?.trim() ?? "";
  const [offer, setOffer] = useState<BusinessBasePlanOfferView | null>(null);

  useEffect(() => {
    if (!enabled || !listingId || !category) {
      setOffer(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch(
          `${BUSINESS_BASE_PLAN_OFFER_ROUTE}?category=${encodeURIComponent(category)}&listingId=${encodeURIComponent(listingId)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { ok?: boolean; offer?: BusinessBasePlanOfferView };
        if (!cancelled && json.ok && json.offer) setOffer(json.offer);
      } catch {
        // Stays null — the preview keeps its existing behaviour rather than guessing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, listingId, enabled]);

  return offer;
}
