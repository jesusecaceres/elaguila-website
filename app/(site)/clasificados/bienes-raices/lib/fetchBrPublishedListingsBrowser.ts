import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";

const BR_LISTINGS_SELECT =
  "id, title, description, city, price, is_free, images, detail_pairs, seller_type, business_name, created_at, status, is_published";

export type FetchBrPublishedListingsResult = {
  listings: BrNegocioListing[];
  error: string | null;
};

/**
 * Active, published `listings` rows for category `bienes-raices` (browser client + user session).
 * Mirrors `BienesRaicesResultsClient` live query contract.
 */
export async function fetchBrPublishedListingsForBrowse(opts: {
  lang: "es" | "en";
  limit?: number;
}): Promise<FetchBrPublishedListingsResult> {
  const limit = opts.limit ?? 80;
  try {
    const sb = createSupabaseBrowserClient();
    const { data, error } = await sb
      .from("listings")
      .select(BR_LISTINGS_SELECT)
      .eq("category", "bienes-raices")
      .eq("is_published", true)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      return { listings: [], error: error.message };
    }
    const rows = (data ?? []) as BrListingDbRow[];
    const mapped = rows
      .filter((r) => String(r.status ?? "").toLowerCase() === "active")
      .map((r) => mapBrListingRowToNegocioCard(r, opts.lang));
    return { listings: mapped, error: null };
  } catch (e) {
    return { listings: [], error: e instanceof Error ? e.message : String(e) };
  }
}
