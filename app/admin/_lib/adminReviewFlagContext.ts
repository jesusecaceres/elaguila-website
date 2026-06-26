import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchLatestListingModerationReviews } from "./listingModerationReviewsDb";
import type { ListingModerationReviewSummary } from "./listingModerationReviewTypes";

export type ListingFlagReportContext = {
  pendingReportReason: string | null;
  pendingReportCount: number;
  latestReportReason: string | null;
};

export type ListingFlagContextMaps = {
  reportsByListingId: Record<string, ListingFlagReportContext>;
  ownerEmailByUserId: Record<string, string>;
  aiReviewByListingId: Record<string, ListingModerationReviewSummary>;
};

/** Batch-load listing_reports + owner emails for admin queue truth (no schema changes). */
export async function fetchListingFlagContextMaps(
  supabase: SupabaseClient,
  listingIds: string[],
  ownerUserIds: string[],
): Promise<ListingFlagContextMaps> {
  const reportsByListingId: Record<string, ListingFlagReportContext> = {};
  const ownerEmailByUserId: Record<string, string> = {};
  const aiReviewByListingId: Record<string, ListingModerationReviewSummary> = {};

  const ids = [...new Set(listingIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length > 0) {
    const { data: reports } = await supabase
      .from("listing_reports")
      .select("listing_id, reason, status, created_at")
      .in("listing_id", ids)
      .order("created_at", { ascending: false })
      .limit(Math.min(ids.length * 5, 500));

    for (const id of ids) {
      const rows = (reports ?? []).filter((r) => String(r.listing_id) === id);
      const pending = rows.filter((r) => String(r.status).toLowerCase() === "pending");
      const pendingReportReason = pending[0]?.reason ? String(pending[0].reason).trim() : null;
      const latestReportReason = rows[0]?.reason ? String(rows[0].reason).trim() : null;
      reportsByListingId[id] = {
        pendingReportReason,
        pendingReportCount: pending.length,
        latestReportReason,
      };
    }
  }

  const owners = [...new Set(ownerUserIds.map((id) => id.trim()).filter(Boolean))];
  if (owners.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", owners);
    for (const p of profiles ?? []) {
      const email = String(p.email ?? "").trim();
      if (email) ownerEmailByUserId[String(p.id)] = email;
    }
  }

  if (ids.length > 0) {
    const aiMap = await fetchLatestListingModerationReviews(supabase, ids);
    Object.assign(aiReviewByListingId, aiMap);
  }

  return { reportsByListingId, ownerEmailByUserId, aiReviewByListingId };
}
