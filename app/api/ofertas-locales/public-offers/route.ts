import { NextResponse, type NextRequest } from "next/server";

import {
  filterAndSortOfertaLocalPublicOffers,
  isOfertaLocalPublicOfferRowEligible,
  mapOfertaLocalPublicOfferRowToCard,
  parseOfertaLocalPublicOfferSearchQuery,
  type OfertaLocalPublicOfferRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers";
import type { OfertaLocalPublicOffersApiResponse } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_OFFERS = 200;

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

/**
 * Public approved offers only — no pending/rejected/draft/archived/expired.
 * Never returns owner private metadata.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalPublicOffersApiResponse>(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  const query = parseOfertaLocalPublicOfferSearchQuery(req.nextUrl.searchParams);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("ofertas_locales")
    .select(
      `
      id,
      status,
      offer_type,
      business_category,
      market_type,
      business_name,
      title,
      description,
      valid_from,
      valid_until,
      address,
      city,
      state,
      zip_code,
      phone,
      whatsapp,
      website_url,
      directions_url,
      flyer_assets,
      coupon_assets,
      submitted_at,
      updated_at
    `
    )
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(MAX_OFFERS);

  if (error) {
    if (isDbTableMissingError(error.message)) {
      return NextResponse.json<OfertaLocalPublicOffersApiResponse>({
        ok: true,
        offers: [],
        total: 0,
        message: "offers_table_unavailable",
      });
    }
    return NextResponse.json<OfertaLocalPublicOffersApiResponse>(
      { ok: false, error: "offers_fetch_failed", detail: error.message },
      { status: 500 }
    );
  }

  const offers = filterAndSortOfertaLocalPublicOffers(
    (data ?? [])
      .filter((row) => isOfertaLocalPublicOfferRowEligible(row as OfertaLocalPublicOfferRow))
      .map((row) => mapOfertaLocalPublicOfferRowToCard(row as OfertaLocalPublicOfferRow)),
    query
  );

  return NextResponse.json<OfertaLocalPublicOffersApiResponse>({
    ok: true,
    offers,
    total: offers.length,
  });
}
