import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  listOfertasLocalesForOwner,
  mapOfertaLocalRowToOwnerListItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Owner list — authenticated user sees only their ofertas_locales rows.
 * Never returns raw admin metadata in JSON responses.
 */
export async function GET(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const langParam = req.nextUrl.searchParams.get("lang")?.trim();
  const lang = langParam === "en" ? "en" : "es";

  const rows = await listOfertasLocalesForOwner(getAdminSupabase(), ownerId);
  const offers = rows.map((row) => mapOfertaLocalRowToOwnerListItem(row, lang));

  return NextResponse.json({ ok: true, offers, total: offers.length });
}
