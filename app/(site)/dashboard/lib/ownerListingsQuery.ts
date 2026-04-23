/**
 * Owner listing fetch with tiered SELECT — mirrors admin pattern when optional columns differ by environment.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { missingListingsColumnName, stripSelectColumn } from "@/app/clasificados/lib/listingsSelectShrink";

const CORE =
  "id,title,price,city,zip,status,created_at,category,seller_type,images,detail_pairs,boost_expires,views,original_price,current_price,price_last_updated,is_published";

/** Extra columns when present (tiered fallback on unknown columns). */
const WITH_OPTIONAL_META = `${CORE}, updated_at, published_at, business_name, expires_at`;
const WITH_TIMESTAMPS = `${CORE}, updated_at, published_at`;

export type OwnerListingFetchMeta = {
  optionalMetaAvailable: boolean;
  /** False when `boost_expires` is missing in the connected `listings` schema. */
  boostExpiresAvailable: boolean;
};

export async function fetchOwnerListingsForDashboard(
  sb: SupabaseClient,
  ownerId: string
): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null; meta: OwnerListingFetchMeta }> {
  const tiers: Array<{ cols: string; rich: boolean }> = [
    { cols: WITH_OPTIONAL_META, rich: true },
    { cols: WITH_TIMESTAMPS, rich: true },
    { cols: CORE, rich: false },
  ];

  let lastErr: { message: string } | null = null;
  for (const tier of tiers) {
    let cols = tier.cols;
    let boostExpiresAvailable = cols.split(",").map((s) => s.trim()).includes("boost_expires");
    for (let attempt = 0; attempt < 32; attempt++) {
      const res = await sb.from("listings").select(cols).eq("owner_id", ownerId).order("created_at", { ascending: false });
      if (!res.error) {
        return {
          data: (res.data as unknown as Record<string, unknown>[]) ?? [],
          error: null,
          meta: { optionalMetaAvailable: tier.rich, boostExpiresAvailable },
        };
      }
      lastErr = { message: res.error.message };
      const bad = missingListingsColumnName(res.error);
      if (!bad) break;
      const next = stripSelectColumn(cols, bad);
      if (next === cols) break;
      cols = next;
      if (bad === "boost_expires") boostExpiresAvailable = false;
    }
  }

  return {
    data: null,
    error: lastErr,
    meta: { optionalMetaAvailable: false, boostExpiresAvailable: true },
  };
}

/** Normalize row for UI — all fields optional for forward compatibility */
export function mapOwnerListingRow(r: Record<string, unknown>) {
  return {
    id: String(r.id ?? ""),
    title: (r.title as string | null | undefined) ?? null,
    price: r.price ?? null,
    city: (r.city as string | null | undefined) ?? null,
    zip: (r.zip as string | null | undefined) ?? null,
    status: (r.status as string | null | undefined) ?? null,
    created_at: (r.created_at as string | null | undefined) ?? null,
    updated_at: (r.updated_at as string | null | undefined) ?? null,
    published_at: (r.published_at as string | null | undefined) ?? null,
    expires_at: (r.expires_at as string | null | undefined) ?? null,
    category: (r.category as string | null | undefined) ?? null,
    seller_type: (r.seller_type as string | null | undefined) ?? null,
    business_name: (r.business_name as string | null | undefined) ?? null,
    images: r.images ?? null,
    detail_pairs: r.detail_pairs ?? null,
    boost_expires: r.boost_expires ?? null,
    views: typeof r.views === "number" ? r.views : null,
    original_price: r.original_price ?? null,
    current_price: r.current_price ?? null,
    price_last_updated: (r.price_last_updated as string | null | undefined) ?? null,
    is_published: typeof r.is_published === "boolean" ? r.is_published : (r.is_published as boolean | null) ?? null,
  };
}
