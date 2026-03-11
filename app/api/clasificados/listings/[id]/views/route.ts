import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";

function startOfTodayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * GET /api/clasificados/listings/[id]/views
 * Returns view count and views today for a listing (listing_view events).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ count: 0, todayCount: 0 }, { status: 400 });
  }

  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from("listing_analytics")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", id)
      .eq("event_type", "listing_view");

    if (error) {
      return NextResponse.json({ count: 0, todayCount: 0 }, { status: 200 });
    }

    const since = startOfTodayUTC();
    const { count: todayCount, error: todayError } = await supabase
      .from("listing_analytics")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", id)
      .eq("event_type", "listing_view")
      .gte("created_at", since);

    if (todayError) {
      return NextResponse.json({ count: count ?? 0, todayCount: 0 });
    }
    return NextResponse.json({ count: count ?? 0, todayCount: todayCount ?? 0 });
  } catch {
    return NextResponse.json({ count: 0, todayCount: 0 }, { status: 200 });
  }
}
