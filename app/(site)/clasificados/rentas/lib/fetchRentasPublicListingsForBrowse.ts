/**
 * Server-side Rentas catalog: published `listings` rows only (no demo).
 * Uses the anon key — must match deployed RLS (see migration `20260421120000_listings_rentas_public_read_policy.sql`).
 */

import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

const BROWSE_COLS =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, business_meta, status, is_published, created_at, images, contact_phone, contact_email";

/** Hard cap for anon browse; pagination is client-side over this window. Raise only with DB/index support. */
const BROWSE_LIMIT = 5000;

export async function fetchRentasPublicListingsForBrowse(lang: "es" | "en"): Promise<RentasPublicListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("listings")
    .select(BROWSE_COLS)
    .eq("category", "rentas")
    .eq("status", "active")
    .or("is_published.is.null,is_published.eq.true")
    .order("created_at", { ascending: false })
    .limit(BROWSE_LIMIT);

  if (error || !data?.length) return [];

  const out: RentasPublicListing[] = [];
  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    const m = mapListingRowToRentasPublicListing(row, lang);
    if (m && m.browseActive !== false) out.push(m);
  }
  return out;
}
