import { NextResponse, type NextRequest } from "next/server";

import {
  filterAndSortOfertaLocalPublicSearchItems,
  isOfertaLocalPublicSearchRowEligible,
  mapOfertaLocalPublicSearchRowToItem,
  parseOfertaLocalPublicSearchQuery,
  type OfertaLocalPublicSearchJoinedRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers";
import type { OfertaLocalPublicSearchApiResponse } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_CANDIDATES = 200;

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalPublicSearchApiResponse>(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  const query = parseOfertaLocalPublicSearchQuery(req.nextUrl.searchParams);
  const langParam = req.nextUrl.searchParams.get("lang")?.trim();
  const lang = langParam === "en" ? "en" : "es";

  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("oferta_local_items")
    .select(
      `
      *,
      ofertas_locales!inner (
        id,
        status,
        offer_type,
        business_category,
        market_type,
        business_name,
        address,
        city,
        state,
        zip_code,
        phone,
        whatsapp,
        website_url,
        directions_url,
        valid_from,
        valid_until,
        membership_url,
        membership_note,
        requires_membership_for_deals,
        digital_coupon_url,
        digital_coupon_note,
        flyer_assets,
        coupon_assets,
        internal_notes
      )
    `
    )
    .eq("review_status", "approved")
    .eq("is_active", true)
    .eq("ofertas_locales.status", "approved")
    .order("updated_at", { ascending: false })
    .limit(MAX_CANDIDATES);

  if (error) {
    if (isDbTableMissingError(error.message)) {
      return NextResponse.json<OfertaLocalPublicSearchApiResponse>({
        ok: true,
        items: [],
        total: 0,
        message: "items_table_unavailable",
      });
    }
    return NextResponse.json<OfertaLocalPublicSearchApiResponse>(
      { ok: false, error: "search_failed", detail: error.message },
      { status: 500 }
    );
  }

  const eligible = (data ?? [])
    .filter((row) => isOfertaLocalPublicSearchRowEligible(row as OfertaLocalPublicSearchJoinedRow))
    .map((row) => mapOfertaLocalPublicSearchRowToItem(row as OfertaLocalPublicSearchJoinedRow, lang));

  const items = filterAndSortOfertaLocalPublicSearchItems(eligible, query);

  return NextResponse.json<OfertaLocalPublicSearchApiResponse>({
    ok: true,
    items,
    total: items.length,
  });
}
