import { NextRequest, NextResponse } from "next/server";

import {
  fetchAllEmpleosListingsForAdmin,
  fetchEmpleosApplicationHealthByListingIds,
} from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (req.cookies.get("leonix_admin")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const rows = await fetchAllEmpleosListingsForAdmin();
  const ids = rows.map((r) => r.id);
  const health = await fetchEmpleosApplicationHealthByListingIds(ids);
  const enriched = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    company_name: r.company_name,
    lifecycle_status: r.lifecycle_status,
    lane: r.lane,
    owner_user_id: r.owner_user_id,
    moderation_reason: r.moderation_reason,
    apply_count: typeof (r as { apply_count?: number }).apply_count === "number" ? (r as { apply_count: number }).apply_count : 0,
    view_count: typeof (r as { view_count?: number }).view_count === "number" ? (r as { view_count: number }).view_count : 0,
    application_health: health.get(r.id) ?? {
      listing_id: r.id,
      total: 0,
      submitted: 0,
      viewed: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    },
  }));
  return NextResponse.json({ ok: true, rows: enriched });
}
