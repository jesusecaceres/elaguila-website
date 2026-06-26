import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { runBulkListingAiReview } from "@/app/admin/_lib/listingAiModerationService";
import { requireAdminCookie } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Admin-only bulk AI review for selected visible listings (manual; no auto backfill). */
export async function POST(req: Request) {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const listingIds = (body as { listingIds?: unknown }).listingIds;
  if (!Array.isArray(listingIds) || listingIds.some((x) => typeof x !== "string")) {
    return NextResponse.json({ ok: false, error: "invalid_listing_ids" }, { status: 400 });
  }

  const result = await runBulkListingAiReview(listingIds);
  revalidatePath("/admin/workspace/clasificados");

  return NextResponse.json({
    ok: result.failed === 0 && result.completed > 0,
    completed: result.completed,
    failed: result.failed,
    proofLabel: result.proofLabel,
    firstListingId: result.firstListingId,
  });
}
