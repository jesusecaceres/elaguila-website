import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import { assertAutosListingOwner, isAutosClassifiedsDbConfigured } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type Body = { eventType?: string; metadata?: Record<string, unknown> };

/** Owner-only analytics (draft through active — e.g. publish funnel). */
export async function POST(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured() || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await assertAutosListingOwner(id, userId);
  if (!row || row.status === "removed") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const eventType = body.eventType?.trim();
  if (!eventType) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("autos_classifieds_analytics_events").insert({
    listing_id: id,
    event_type: eventType,
    lane: row.lane,
    metadata: body.metadata ?? {},
  });
  if (error) {
    console.error("autos listing analytics", error);
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
