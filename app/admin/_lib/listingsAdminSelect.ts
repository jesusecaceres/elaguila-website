import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns for Clasificados admin queue — includes JSON used by En Venta visibility helpers. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS =
  "id, title, description, city, category, price, is_free, status, owner_id, created_at, images, detail_pairs, boost_expires, is_published";

/** Same row shape minus `detail_pairs` when the live DB predates that migration. */
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS =
  "id, title, description, city, category, price, is_free, status, owner_id, created_at, images, boost_expires, is_published";

function shouldRetrySelectWithoutDetailPairs(err: { message?: string; code?: string } | null): boolean {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  return m.includes("detail_pairs");
}

export type ListingsAdminFetchResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
  /** False when we fell back to a select without `detail_pairs`. Apply `supabase/migrations/20250316200000_listings_detail_pairs.sql` (or later ensure migration) on production. */
  detailPairsAvailable: boolean;
};

/**
 * Load listings for admin moderation. If `detail_pairs` is missing in Postgres, retries without it so the page still loads.
 */
export async function fetchListingsForAdminWorkspace(
  supabase: SupabaseClient
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  const first = await supabase
    .from("listings")
    .select(LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS)
    .order("created_at", { ascending: false })
    .limit(300);

  if (!first.error) {
    return { data: (first.data as Record<string, unknown>[]) ?? [], error: null, detailPairsAvailable: true };
  }

  if (shouldRetrySelectWithoutDetailPairs(first.error)) {
    const second = await supabase
      .from("listings")
      .select(LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS)
      .order("created_at", { ascending: false })
      .limit(300);

    if (second.error) {
      return {
        data: null,
        error: { message: second.error.message, code: second.error.code },
        detailPairsAvailable: false,
      };
    }

    return {
      data: (second.data as Record<string, unknown>[]) ?? [],
      error: null,
      detailPairsAvailable: false,
    };
  }

  return {
    data: null,
    error: { message: first.error.message, code: first.error.code },
    detailPairsAvailable: true,
  };
}
