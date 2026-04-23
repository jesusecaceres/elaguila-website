/**
 * Server-side Rentas catalog: published `listings` rows only (no demo).
 * Uses the anon key — must match deployed RLS (see `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`).
 */

import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { queryRentasBrowseListings } from "@/app/clasificados/rentas/lib/rentasListingPublicSelect";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

export async function fetchRentasPublicListingsForBrowse(lang: "es" | "en"): Promise<RentasPublicListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  const { data, error } = await queryRentasBrowseListings(sb);

  if (error || !data?.length) return [];

  const out: RentasPublicListing[] = [];
  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const m = mapListingRowToRentasPublicListing(row, lang);
    if (m && m.browseActive !== false) out.push(m);
  }
  return out;
}
