import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  aggregateRawListingAnalyticsEvents,
  type AutosListingAnalyticsSnapshot,
} from "@/app/(site)/clasificados/autos/shared/types/autosListingAnalytics";

/**
 * Package F Build F2, Gate 1 (P0 security fix) — GET /api/clasificados/autos/listing/[id]/analytics-summary
 *
 * Replaces `AutosAnuncioAnalyticsStrip.tsx`'s prior direct browser-client SELECT against
 * `listing_analytics` (which pulled raw `user_id` values into the page for client-side
 * aggregation) with a server-side aggregate using the SAME rollup function the dashboard and the
 * previous client-side call already used (`aggregateRawListingAnalyticsEvents`) — never a second
 * counting implementation. Uses the service-role client (bypasses the now-tightened owner-scoped
 * RLS by design) since this is a legitimate public aggregate-metrics feature, but only ever
 * returns the final rolled-up numbers, never a raw row or any user_id.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empty: AutosListingAnalyticsSnapshot = { views: 0, uniqueViews: 0, saves: 0, shares: 0, contacts: 0 };
  if (!id) {
    return NextResponse.json(empty, { status: 400 });
  }

  try {
    const supabase = getAdminSupabase();
    const { data: events, error } = await supabase
      .from("listing_analytics")
      .select("event_type, user_id")
      .eq("listing_id", id);

    if (error || !events) {
      return NextResponse.json(empty, { status: 200 });
    }

    return NextResponse.json(aggregateRawListingAnalyticsEvents(events));
  } catch {
    return NextResponse.json(empty, { status: 200 });
  }
}
