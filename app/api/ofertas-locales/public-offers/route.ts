import { NextResponse, type NextRequest } from "next/server";

import {
  filterAndSortOfertaLocalPublicOffers,
  isOfertaLocalPublicOfferRowEligible,
  mapOfertaLocalPublicOfferRowToCard,
  parseOfertaLocalPublicOfferSearchQuery,
  type OfertaLocalPublicOfferRow,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers";
import {
  OFERTAS_LOCALES_PARTNER_ASSIGNMENT_SELECT,
  resolveOfertaLocalPartnerPublicVm,
  type OfertaLocalPartnerAssignmentRow,
  type OfertaLocalPartnerPublicVm,
} from "@/app/lib/ofertas-locales/ofertasLocalesPartnerOperations";
import type { OfertaLocalPublicOffersApiResponse } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_OFFERS = 200;

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

async function loadPartnerVmByOfferId(
  supabase: ReturnType<typeof getAdminSupabase>,
  offerIds: string[],
): Promise<Map<string, OfertaLocalPartnerPublicVm>> {
  const ids = [...new Set(offerIds.map((id) => id.trim()).filter(Boolean))];
  const out = new Map<string, OfertaLocalPartnerPublicVm>();
  if (ids.length === 0) return out;
  const { data } = await supabase
    .from("ofertas_local_partner_assignments")
    .select(OFERTAS_LOCALES_PARTNER_ASSIGNMENT_SELECT)
    .in("oferta_local_id", ids)
    .eq("assignment_status", "active");
  for (const row of (data ?? []) as unknown as OfertaLocalPartnerAssignmentRow[]) {
    out.set(row.oferta_local_id, resolveOfertaLocalPartnerPublicVm({ assignment: row }));
  }
  return out;
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
      coupon_text,
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
      draft_snapshot,
      flyer_assets,
      coupon_assets,
      published_at,
      expires_at,
      partner_assignment_id,
      commercial_eligibility_source,
      public_source_asset_id,
      asset_lifecycle_status,
      submitted_at,
      updated_at
    `
    )
    .eq("status", "approved")
    .not("published_at", "is", null)
    .not("expires_at", "is", null)
    .gt("expires_at", new Date().toISOString())
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

  const eligibleRows = (data ?? []).filter((row) =>
    isOfertaLocalPublicOfferRowEligible(row as OfertaLocalPublicOfferRow)
  ) as OfertaLocalPublicOfferRow[];
  const partnerVmByOfferId = await loadPartnerVmByOfferId(
    supabase,
    eligibleRows.map((row) => row.id),
  );
  const offers = filterAndSortOfertaLocalPublicOffers(
    eligibleRows.map((row) => mapOfertaLocalPublicOfferRowToCard(row, partnerVmByOfferId.get(row.id))),
    query
  );

  return NextResponse.json<OfertaLocalPublicOffersApiResponse>({
    ok: true,
    offers,
    total: offers.length,
  });
}
