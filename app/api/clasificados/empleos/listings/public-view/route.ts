import { NextRequest, NextResponse } from "next/server";

import { incrementEmpleosPublishedListingViewCountBySlug } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const slug = String((body as Record<string, unknown>).slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "missing_slug" }, { status: 400 });
  }
  const res = await incrementEmpleosPublishedListingViewCountBySlug(slug);
  return NextResponse.json({ ok: res.ok });
}
