/**
 * Public Rentas reads from `listings`. Some deployments never applied older `listings` migrations;
 * use shared select-shrink (see `listingsSelectShrink.ts`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";

export const RENTAS_LISTING_PUBLIC_ROW_BASE =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, business_meta, status, is_published, created_at, images, contact_phone, contact_email";

export const RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST = `${RENTAS_LISTING_PUBLIC_ROW_BASE}, boost_expires`;

const BROWSE_LIMIT = 5000;

export async function queryRentasBrowseListings(supabase: SupabaseClient): Promise<{
  data: unknown[] | null;
  error: { message: string } | null;
}> {
  /** RLS enforces visibility for anon; avoid `.eq(status)` / `is_published` filters when those columns are absent. */
  const res = await listingsQueryWithSelectShrink(RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST, async (cols) => {
    const { data, error } = await supabase
      .from("listings")
      .select(cols)
      .eq("category", "rentas")
      .order("created_at", { ascending: false })
      .limit(BROWSE_LIMIT);
    return { data, error: error ? { message: error.message } : null };
  });
  return { data: (res.data as unknown[] | null) ?? null, error: res.error };
}

export async function queryRentasListingById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const res = await listingsQueryWithSelectShrink(RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST, async (cols) => {
    const { data, error } = await supabase.from("listings").select(cols).eq("id", id).eq("category", "rentas").maybeSingle();
    return { data, error: error ? { message: error.message } : null };
  });
  return { data: (res.data as unknown | null) ?? null, error: res.error };
}
