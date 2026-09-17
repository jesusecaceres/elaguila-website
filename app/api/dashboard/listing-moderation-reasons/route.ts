import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { resolveOwnedListingIdentityKeys } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * Owner Attention Truth Gate — the generic `listings` "moderation" attention item
 * (derivedDashboardFeed.ts) previously only knew the listing's status was `pending`/`flagged`,
 * never WHY. `public.listing_moderation_reviews` (ADMIN-AI-MODERATION-ENGINE-01) already has the
 * real reason on file for AI-reviewed listings, but that table has RLS enabled with NO policies
 * — it is service-role/admin-only by design, so an owner's browser session cannot read it
 * directly. This route is the thin, owner-safe projection: it re-verifies ownership server-side
 * (never trusts the caller's claimed listing ids — same pattern as
 * listing-package-entitlements/route.ts) and returns ONLY `decision`, `reasonCategory`,
 * `reasonText`, `reviewedAt` for listings the caller actually owns — never `raw_input`,
 * `raw_result`, `model`, `confidence`, `reviewed_by`, or `error_message` (staff-only internals).
 * No moderation decision logic lives here — this never writes, never re-classifies; it only
 * reads and narrows an existing, real evidence table for the one owner allowed to see it.
 */

type ModerationReasonPayload = {
  decision: string;
  reasonCategory: string | null;
  reasonText: string | null;
  reviewedAt: string | null;
};

export async function POST(req: NextRequest) {
  const userId = await getBearerUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { listingIds?: string[] };
  try {
    body = (await req.json()) as { listingIds?: string[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const listingIds = Array.isArray(body.listingIds)
    ? [...new Set(body.listingIds.filter((v): v is string => typeof v === "string" && v.trim().length > 0))].slice(0, 60)
    : [];
  if (listingIds.length === 0 || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ reasons: {} });
  }

  const adminSupabase = getAdminSupabase();

  // Fail closed: only ids the generic `listings` table's owner_id column actually attributes to
  // this caller are ever looked up in the moderation-review table below.
  const owned = await resolveOwnedListingIdentityKeys(adminSupabase, "listings", listingIds, userId);
  if (owned.size === 0) return NextResponse.json({ reasons: {} });

  const { data, error } = await adminSupabase
    .from("listing_moderation_reviews")
    .select("listing_id, decision, reason_category, reason_text, reviewed_at, created_at")
    .in("listing_id", [...owned])
    .order("created_at", { ascending: false });

  const reasons: Record<string, ModerationReasonPayload> = {};
  if (!error && Array.isArray(data)) {
    for (const row of data as Array<{
      listing_id: string;
      decision: string;
      reason_category: string | null;
      reason_text: string | null;
      reviewed_at: string | null;
    }>) {
      // Rows are ordered newest-first — the first one seen per listing_id is the latest review.
      if (reasons[row.listing_id]) continue;
      reasons[row.listing_id] = {
        decision: row.decision,
        reasonCategory: row.reason_category,
        reasonText: row.reason_text,
        reviewedAt: row.reviewed_at,
      };
    }
  }

  return NextResponse.json({ reasons });
}
