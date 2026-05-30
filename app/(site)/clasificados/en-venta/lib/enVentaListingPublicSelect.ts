/**
 * Canonical public Varios (`en-venta`) browse reads from `public.listings`.
 * Server (anon) and client browsers share this query — same filters as results browse.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { listingsQueryWithSelectShrink } from "@/app/(site)/clasificados/lib/listingsSelectShrink";

export const EN_VENTA_LISTING_PUBLIC_ROW_BASE =
  "id, owner_id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, status, is_published, created_at, images, views, rentas_tier, published_at, republished_at, republish_sort_at, admin_promoted, leonix_ad_id";

const BROWSE_LIMIT = 800;

type BrowseOrder =
  | { kind: "column"; column: string; ascending: boolean; nullsFirst?: boolean }
  | { kind: "none" };

const BROWSE_ORDER_ATTEMPTS: BrowseOrder[] = [
  { kind: "column", column: "republish_sort_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "republished_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "published_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "created_at", ascending: false, nullsFirst: true },
  { kind: "column", column: "id", ascending: false },
  { kind: "none" },
];

async function runEnVentaBrowseSelect(
  supabase: SupabaseClient,
  cols: string,
  order: BrowseOrder,
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  let q = supabase
    .from("listings")
    .select(cols)
    .eq("category", "en-venta")
    .eq("status", "active")
    .limit(BROWSE_LIMIT);
  if (order.kind === "column") {
    q = q.order(order.column, {
      ascending: order.ascending,
      nullsFirst: order.nullsFirst ?? false,
    });
  }
  const { data, error } = await q;
  return { data, error: error ? { message: error.message } : null };
}

export async function queryEnVentaBrowseListings(supabase: SupabaseClient): Promise<{
  data: unknown[] | null;
  error: { message: string } | null;
}> {
  let lastErr: { message: string } | null = null;
  for (const ord of BROWSE_ORDER_ATTEMPTS) {
    const res = await listingsQueryWithSelectShrink(EN_VENTA_LISTING_PUBLIC_ROW_BASE, async (cols) =>
      runEnVentaBrowseSelect(supabase, cols, ord),
    );
    if (!res.error) {
      return { data: (res.data as unknown[] | null) ?? null, error: null };
    }
    lastErr = res.error;
  }
  return { data: null, error: lastErr };
}
