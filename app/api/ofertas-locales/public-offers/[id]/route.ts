import { NextResponse, type NextRequest } from "next/server";

import { fetchPublicOfertaLocalDetailById } from "@/app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers";
import type { OfertaLocalPublicOfferDetailApiResponse } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Public approved offer detail — safe projection only (no private fields in JSON).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalPublicOfferDetailApiResponse>(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  const { id } = await ctx.params;
  const offer = await fetchPublicOfertaLocalDetailById(getAdminSupabase(), id);

  if (!offer) {
    return NextResponse.json<OfertaLocalPublicOfferDetailApiResponse>(
      { ok: false, error: "not_available" },
      { status: 404 }
    );
  }

  return NextResponse.json<OfertaLocalPublicOfferDetailApiResponse>({ ok: true, offer });
}
