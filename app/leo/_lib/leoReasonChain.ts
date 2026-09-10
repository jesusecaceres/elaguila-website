/**
 * LEO-2 Listing Reason Chain — server-only per-listing drill-down loader.
 *
 * Executive snapshot (LEO-1) stays lightweight; this module loads evidence for one listing
 * and delegates composition to assembleLeoListingReasonChain (pure).
 *
 * No writes, no LLM, no Concierge, no PII dumps.
 */
import "server-only";

import { fetchListingFlagContextMaps } from "@/app/admin/_lib/adminReviewFlagContext";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import {
  assembleLeoListingReasonChain,
  type LeoListingReasonChainInput,
} from "@/app/leo/_lib/leoReasonChainAssemble";
import type { LeoListingReasonChain } from "@/app/leo/_lib/leoTypes";

export { assembleLeoListingReasonChain };
export type { LeoListingReasonChainInput };

/**
 * Server-only per-listing reason-chain drill-down.
 * Owner_admin required. Read-only. Does not run AI.
 */
export async function getLeoListingReasonChain(listingId: string): Promise<LeoListingReasonChain> {
  await requireLeoOwnerAccess();

  const id = listingId.trim();
  if (!id) {
    return assembleLeoListingReasonChain({
      listingId: "",
      status: "",
    });
  }

  const supabase = getAdminSupabase();
  const { data: row, error } = await supabase
    .from("listings")
    .select("id, status, leonix_ad_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return assembleLeoListingReasonChain({
      listingId: id,
      status: "",
    });
  }

  const status = String((row as { status?: string }).status ?? "");
  const leonixAdId =
    (row as { leonix_ad_id?: string | null }).leonix_ad_id != null
      ? String((row as { leonix_ad_id: string }).leonix_ad_id)
      : null;

  // Empty owner ids — LEO must not load owner emails for reason chains.
  const maps = await fetchListingFlagContextMaps(supabase, [id], []);
  const report = maps.reportsByListingId[id];
  const storedAi = maps.aiReviewByListingId[id] ?? null;

  return assembleLeoListingReasonChain({
    listingId: id,
    leonixAdId,
    status,
    sourceTable: "generic_listings",
    pendingReportReason: report?.pendingReportReason ?? null,
    pendingReportCount: report?.pendingReportCount ?? 0,
    latestReportReason: report?.latestReportReason ?? null,
    storedAiReview: storedAi,
  });
}
