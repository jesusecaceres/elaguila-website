"use client";

import { useEffect } from "react";

import { clearEmpleosPendingCheckoutListingIdIfPaid } from "@/app/(site)/publicar/empleos/shared/publish/empleosPendingCheckoutIdentity";
import {
  clearRealEstateDraftKeyIfRowMatches,
  readRealEstateDraftKeyFromListingJson,
} from "@/app/(site)/clasificados/lib/realEstateDraftKey";
import { paidReturnCleanupTarget } from "@/app/lib/listingIdentity/paidReturnIdentityPolicy";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

/**
 * Revenue OS SUCCESS return for a Rentas / Bienes Raices / Empleos payment: the application this browser
 * saved is now paid, so its client-side identity memo is released - and only then, so the NEXT application
 * in this tab starts its own row instead of inheriting (and overwriting / matching) this one.
 *
 * Ownership-safe by construction:
 *  - it only runs for a VERIFIED paid return (`verified` = the payment record was found and names the row);
 *  - Rentas / Bienes: the stored draft key is cleared only when it equals the key written on the paid row
 *    itself (read with the signed-in owner's session, owner_id must match), so an unrelated in-progress
 *    application's key is left alone;
 *  - Empleos: the checkout memo is cleared only when it remembers the paid row.
 * Cancel / retry / back never mount this component (the cancel page has no cleanup) and never clear identity.
 */
export function ListingIdentityPaidReturnCleanup({
  category,
  paidListingId,
  verified,
}: {
  category?: string | null;
  paidListingId?: string | null;
  verified: boolean;
}) {
  useEffect(() => {
    const paid = String(paidListingId ?? "").trim();
    const target = paidReturnCleanupTarget(category);
    if (!verified || !paid || target === "none") return;
    let cancelled = false;
    void (async () => {
      try {
        if (target === "empleos") {
          clearEmpleosPendingCheckoutListingIdIfPaid(window.sessionStorage, paid);
          return;
        }
        const supabase = createSupabaseBrowserClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id?.trim() || "";
        if (!userId) return;
        const { data: row } = await supabase
          .from("listings")
          .select("id, owner_id, category, seller_type, listing_json")
          .eq("id", paid)
          .maybeSingle();
        if (cancelled || !row) return;
        const rec = row as {
          id?: string | null;
          owner_id?: string | null;
          category?: string | null;
          seller_type?: string | null;
          listing_json?: unknown;
        };
        if (String(rec.owner_id ?? "") !== userId) return;
        const rowCategory = String(rec.category ?? "").trim();
        const sellerType = String(rec.seller_type ?? "").trim();
        if (!rowCategory || !sellerType) return;
        clearRealEstateDraftKeyIfRowMatches(
          window.sessionStorage,
          { userId, category: rowCategory, sellerType },
          { listingId: paid, draftKey: readRealEstateDraftKeyFromListingJson(rec.listing_json) },
        );
      } catch {
        /* best-effort: the server-truth key rotation in the publish core still protects the next save */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, paidListingId, verified]);
  return null;
}
