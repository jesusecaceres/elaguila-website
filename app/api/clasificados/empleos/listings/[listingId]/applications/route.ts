import { NextRequest, NextResponse } from "next/server";

import { fetchEmpleosApplicationsForListing } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "@/app/api/_lib/bearerUser";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ listingId: string }> }): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const ownerUserId = await getBearerUserId(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { listingId } = await ctx.params;
  const rows = await fetchEmpleosApplicationsForListing({ listingId, ownerUserId });
  return NextResponse.json({ ok: true, rows });
}
