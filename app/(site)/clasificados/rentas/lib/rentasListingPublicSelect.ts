/**
 * Public Rentas reads from `listings`. Some deployments never applied older `listings` migrations;
 * use shared select-shrink (see `listingsSelectShrink.ts`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";

export const RENTAS_LISTING_PUBLIC_ROW_BASE =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, business_meta, status, is_published, created_at, images, contact_phone, contact_email, leonix_ad_id";

/** Rich row for browse + detail (republish ordering + timestamps). */
export const RENTAS_LISTING_PUBLIC_ROW_RICH = `${RENTAS_LISTING_PUBLIC_ROW_BASE}, published_at, republished_at, republish_sort_at, updated_at, mux_asset_id, mux_playback_id, mux_thumbnail_url, mux_status`;

/** @deprecated Use `RENTAS_LISTING_PUBLIC_ROW_RICH` — kept for external imports during transition. */
export const RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST = RENTAS_LISTING_PUBLIC_ROW_RICH;

const BROWSE_LIMIT = 5000;

type BrowseOrder =
  | { kind: "column"; column: string; ascending: boolean; nullsFirst?: boolean }
  | { kind: "none" };

const BROWSE_ORDER_ATTEMPTS: BrowseOrder[] = [
  { kind: "column", column: "republish_sort_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "republished_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "published_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "updated_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "created_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "id", ascending: false },
  { kind: "none" },
];

async function runRentasBrowseSelect(
  supabase: SupabaseClient,
  cols: string,
  order: BrowseOrder,
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  let q = supabase.from("listings").select(cols).eq("category", "rentas").limit(BROWSE_LIMIT);
  if (order.kind === "column") {
    q = q.order(order.column, {
      ascending: order.ascending,
      nullsFirst: order.nullsFirst ?? false,
    });
  }
  const { data, error } = await q;
  return { data, error: error ? { message: error.message } : null };
}

export async function queryRentasBrowseListings(supabase: SupabaseClient): Promise<{
  data: unknown[] | null;
  error: { message: string } | null;
}> {
  /** RLS enforces visibility for anon; avoid `.eq(status)` / `is_published` filters when those columns are absent. */
  let lastErr: { message: string } | null = null;
  for (const ord of BROWSE_ORDER_ATTEMPTS) {
    const res = await listingsQueryWithSelectShrink(RENTAS_LISTING_PUBLIC_ROW_RICH, async (cols) =>
      runRentasBrowseSelect(supabase, cols, ord),
    );
    if (!res.error) {
      return { data: (res.data as unknown[] | null) ?? null, error: null };
    }
    lastErr = res.error;
  }
  return { data: null, error: lastErr };
}

export async function queryRentasListingById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const res = await listingsQueryWithSelectShrink(RENTAS_LISTING_PUBLIC_ROW_RICH, async (cols) => {
    const { data, error } = await supabase.from("listings").select(cols).eq("id", id).eq("category", "rentas").maybeSingle();
    return { data, error: error ? { message: error.message } : null };
  });
  return { data: (res.data as unknown | null) ?? null, error: res.error };
}
