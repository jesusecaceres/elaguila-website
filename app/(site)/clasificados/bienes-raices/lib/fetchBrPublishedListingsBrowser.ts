import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { mapBrListingRowToNegocioCard, type BrListingDbRow } from "../resultados/lib/mapBrListingRowToCard";

/** Baseline columns — safe if optional timestamp columns are missing in an older DB. */
const BR_LISTINGS_SELECT_BASE =
  "id, title, description, city, price, is_free, images, detail_pairs, seller_type, business_name, created_at, status, is_published";

/** Rich timestamps for `reciente` / republish fairness (`mapBrListingRowToNegocioCard`). */
const BR_LISTINGS_SELECT_RICH = `${BR_LISTINGS_SELECT_BASE}, updated_at, published_at`;

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
    let data: unknown[] | null = null;
    let error: { message: string } | null = null;
    const rich = await sb
      .from("listings")
      .select(BR_LISTINGS_SELECT_RICH)
      .eq("category", "bienes-raices")
      .eq("is_published", true)
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(limit);
    if (rich.error) {
      const base = await sb
        .from("listings")
        .select(BR_LISTINGS_SELECT_BASE)
        .eq("category", "bienes-raices")
        .eq("is_published", true)
        .in("status", ["active", "sold"])
        .order("created_at", { ascending: false })
        .limit(limit);
      data = base.data as unknown[] | null;
      error = base.error ? { message: base.error.message } : null;
    } else {
      data = rich.data as unknown[] | null;
    }
    if (error) {
      return { listings: [], error: error.message };
    }
    const rows = (data ?? []) as BrListingDbRow[];
    const mapped = rows
      .filter((r) => isListingRowActiveAndPublishedForBrowse(r))
      .map((r) => mapBrListingRowToNegocioCard(r, opts.lang));
    return { listings: mapped, error: null };
  } catch (e) {
    return { listings: [], error: e instanceof Error ? e.message : String(e) };
  }
}
