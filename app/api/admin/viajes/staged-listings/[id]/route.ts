import { NextRequest, NextResponse } from "next/server";

import { buildViajesAdminDetailView } from "@/app/(site)/clasificados/viajes/lib/viajesAdminDetailView";
import { fetchViajesStagedRowById } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  if (req.cookies.get("leonix_admin")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const stagedId = (id ?? "").trim();
  if (!stagedId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const row = await fetchViajesStagedRowById(stagedId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const detail = buildViajesAdminDetailView(row);
  return NextResponse.json({ ok: true, detail });
}
