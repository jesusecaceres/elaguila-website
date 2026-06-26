import "server-only";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import {
  buildListingModerationContentPayload,
  formatAiReviewProofLabel,
  runListingAiModeration,
} from "@/app/admin/_lib/listingAiModerationEngine";
import {
  fetchLatestListingModerationReviews,
  insertListingModerationReview,
} from "@/app/admin/_lib/listingModerationReviewsDb";
import type { ListingModerationReviewSummary } from "@/app/admin/_lib/listingModerationReviewTypes";
import { getAdminSupabase } from "@/app/lib/supabase/server";

const LISTING_MODERATION_SELECT =
  "id, leonix_ad_id, title, description, city, zip, category, price, is_free, status, owner_id, images, contact_email, contact_phone, business_name, seller_type";

export type RunListingAiReviewOutcome = {
  ok: boolean;
  listingId: string;
  leonixAdId: string | null;
  proofLabel: string;
  error?: string;
  review: ListingModerationReviewSummary | null;
};

export async function runListingAiReviewForId(listingId: string): Promise<RunListingAiReviewOutcome> {
  const id = listingId.trim();
  if (!id) {
    return {
      ok: false,
      listingId: id,
      leonixAdId: null,
      proofLabel: "AI review unavailable: listing content not found.",
      error: "missing_id",
      review: null,
    };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: loadErr } = await supabase.from("listings").select(LISTING_MODERATION_SELECT).eq("id", id).maybeSingle();

  if (loadErr || !row) {
    return {
      ok: false,
      listingId: id,
      leonixAdId: null,
      proofLabel: "AI review unavailable: listing content not found.",
      error: "not_found",
      review: null,
    };
  }

  const ownerId = String((row as { owner_id?: string }).owner_id ?? "").trim();
  let ownerEmail: string | null = null;
  if (ownerId) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", ownerId).maybeSingle();
    ownerEmail = profile?.email?.trim() ?? null;
  }

  const content = buildListingModerationContentPayload(row as Record<string, unknown>, ownerEmail);
  const ai = await runListingAiModeration(content);
  const saved = await insertListingModerationReview(supabase, content, ai);

  const proofLabel = saved
    ? formatAiReviewProofLabel(
        saved.decision,
        saved.reason_category,
        saved.reason_text ?? saved.error_message,
        saved.risk_level,
      )
    : ai.ok
      ? formatAiReviewProofLabel(
          ai.result.decision,
          ai.result.reason_category,
          ai.result.reason_text,
          ai.result.risk_level,
        )
      : formatAiReviewProofLabel("unavailable", null, ai.error);

  void appendAdminAuditLog({
    action: "listing_ai_review",
    targetType: "listings",
    targetId: id,
    meta: {
      decision: saved?.decision ?? (ai.ok ? ai.result.decision : "unavailable"),
      reason_category: saved?.reason_category ?? null,
      risk_level: saved?.risk_level ?? (ai.ok ? ai.result.risk_level : null),
      model: saved?.model ?? null,
    },
  });

  const aiError = ai.ok ? undefined : ai.error;

  return {
    ok: Boolean(saved && saved.decision !== "unavailable"),
    listingId: id,
    leonixAdId: content.leonix_ad_id,
    proofLabel,
    error: saved?.decision === "unavailable" ? saved.error_message ?? aiError : aiError,
    review: saved,
  };
}

export async function runBulkListingAiReview(listingIds: string[]): Promise<{
  completed: number;
  failed: number;
  proofLabel: string;
  firstListingId: string | null;
}> {
  const ids = [...new Set(listingIds.map((x) => x.trim()).filter(Boolean))].slice(0, 15);
  if (ids.length === 0) {
    return { completed: 0, failed: 0, proofLabel: "No listings selected for AI review.", firstListingId: null };
  }

  let completed = 0;
  let failed = 0;
  let firstListingId: string | null = null;
  const summaries: string[] = [];

  for (const id of ids) {
    if (!firstListingId) firstListingId = id;
    const outcome = await runListingAiReviewForId(id);
    if (outcome.ok) {
      completed += 1;
      summaries.push(outcome.proofLabel);
    } else {
      failed += 1;
    }
  }

  const sample = summaries[0] ?? "AI review batch finished.";
  const proofLabel =
    failed > 0
      ? `AI review batch: ${completed} completed, ${failed} failed. ${sample}`
      : `AI review batch: ${completed} completed. ${sample}`;

  return { completed, failed, proofLabel, firstListingId };
}

export { fetchLatestListingModerationReviews };
