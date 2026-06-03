import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  fetchOwnerEngagementRollupsServer,
  supplementOwnerTotalsWithRollups,
} from "@/app/lib/ownerEngagementRollupsServer";
import { fetchOwnerAnalyticsTotals } from "@/app/(site)/dashboard/lib/dashboardAnalyticsSummary";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const ownerId = data.user.id;
  const clientAgg = await fetchOwnerAnalyticsTotals(sb, ownerId);
  const rollups = isSupabaseAdminConfigured() ? await fetchOwnerEngagementRollupsServer(ownerId) : null;
  const totals = supplementOwnerTotalsWithRollups(clientAgg.totals, rollups);

  return NextResponse.json({
    ok: true,
    totals,
    listingCount: clientAgg.listingCount,
    listingAnalyticsUnavailable: clientAgg.listingAnalyticsUnavailable,
    serviciosBySlug: rollups?.serviciosBySlug ?? {},
  });
}
