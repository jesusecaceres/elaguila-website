import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";

/**
 * GET /api/seller-stats?seller_id=uuid
 * Returns aggregate rating and count of completed sales (ratings) for a seller.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("seller_id");
  if (!sellerId) {
    return NextResponse.json({ avgRating: null, totalRatings: 0 }, { status: 400 });
  }

  try {
    const supabase = getAdminSupabase();
    const { data: rows, error } = await supabase
      .from("seller_ratings")
      .select("rating")
      .eq("seller_id", sellerId);

    if (error) {
      return NextResponse.json({ avgRating: null, totalRatings: 0 }, { status: 200 });
    }

    const total = rows?.length ?? 0;
    if (total === 0) {
      return NextResponse.json({ avgRating: null, totalRatings: 0 });
    }
    const sum = (rows ?? []).reduce((a, r) => a + (r.rating ?? 0), 0);
    const avg = Math.round((sum / total) * 10) / 10; // one decimal
    return NextResponse.json({ avgRating: avg, totalRatings: total });
  } catch {
    return NextResponse.json({ avgRating: null, totalRatings: 0 }, { status: 200 });
  }
}
