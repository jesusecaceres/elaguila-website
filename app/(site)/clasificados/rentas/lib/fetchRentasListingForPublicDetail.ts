/**
 * Server-side fetch for Rentas public detail (`/clasificados/rentas/listing/[id]`).
 * Uses anon Supabase client — requires RLS allowing read on published active `rentas` listings.
 */

import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

const COLS =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, business_meta, status, is_published, created_at, images, contact_phone, contact_email";

export async function fetchRentasListingForPublicDetail(
  id: string,
  lang: "es" | "en"
): Promise<RentasPublicListing | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);
  const { data, error } = await sb.from("listings").select(COLS).eq("id", id).eq("category", "rentas").maybeSingle();

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  if (String(row.status ?? "").toLowerCase() !== "active" || row.is_published === false) {
    return null;
  }
  return mapListingRowToRentasPublicListing(row, lang);
}
