/**
 * Server-side fetch for Rentas public detail (`/clasificados/rentas/listing/[id]`).
 * Uses anon Supabase client — requires RLS allowing read on published active `rentas` listings.
 */

import { createClient } from "@supabase/supabase-js";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { queryRentasListingById } from "@/app/clasificados/rentas/lib/rentasListingPublicSelect";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

export async function fetchRentasListingForPublicDetail(
  id: string,
  lang: "es" | "en"
): Promise<RentasPublicListing | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);
  const { data, error } = await queryRentasListingById(sb, id);

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const statusNorm = String(row.status ?? "").trim().toLowerCase();
  const statusOk = !statusNorm || statusNorm === "active";
  if (!statusOk || row.is_published === false) {
    return null;
  }
  const mapped = mapListingRowToRentasPublicListing(row, lang);
  if (!mapped || mapped.browseActive === false) return null;
  return mapped;
}
