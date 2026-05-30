/**
 * Server-side Varios catalog: published `listings` rows only (no demo/sample pool).
 * Uses the anon key — must match deployed RLS for `category=en-venta`.
 */

import { createClient } from "@supabase/supabase-js";
import { queryEnVentaBrowseListings } from "@/app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect";
import { isEnVentaListingPubliclyVisible } from "@/app/(site)/clasificados/en-venta/lib/enVentaListingVisibility";
import { mapDbRowToEnVentaAnuncioDTO } from "@/app/(site)/clasificados/en-venta/mapping/mapDbRowToEnVentaListingData";
import type { EnVentaAnuncioDTO } from "@/app/(site)/clasificados/en-venta/shared/types/enVentaListing.types";

export type EnVentaPublicBrowseListing = {
  row: Record<string, unknown>;
  dto: EnVentaAnuncioDTO;
};

export async function fetchEnVentaPublicListingsForBrowse(): Promise<EnVentaPublicBrowseListing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  const { data, error } = await queryEnVentaBrowseListings(sb);
  if (error || !data?.length) return [];

  const out: EnVentaPublicBrowseListing[] = [];
  for (const raw of data) {
    const row = raw as Record<string, unknown>;
    if (!isEnVentaListingPubliclyVisible(row)) continue;
    try {
      const dto = mapDbRowToEnVentaAnuncioDTO(row);
      if (!dto.id) continue;
      out.push({ row, dto });
    } catch {
      /* skip malformed row */
    }
  }
  return out;
}
