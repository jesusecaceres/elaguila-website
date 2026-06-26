import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ListingModerationContentPayload,
  ListingModerationReviewSummary,
} from "./listingModerationReviewTypes";
import type { RunListingAiModerationResult } from "./listingAiModerationEngine";

const SUMMARY_COLS =
  "id, listing_id, leonix_ad_id, decision, source, reason_category, reason_text, confidence, model, reviewed_at, error_message";

function mapRow(row: Record<string, unknown>): ListingModerationReviewSummary {
  return {
    id: String(row.id),
    listing_id: String(row.listing_id),
    leonix_ad_id: row.leonix_ad_id != null ? String(row.leonix_ad_id) : null,
    decision: String(row.decision) as ListingModerationReviewSummary["decision"],
    source: String(row.source ?? "ai"),
    reason_category: row.reason_category != null ? String(row.reason_category) : null,
    reason_text: row.reason_text != null ? String(row.reason_text) : null,
    confidence: row.confidence != null ? String(row.confidence) : null,
    model: row.model != null ? String(row.model) : null,
    reviewed_at: row.reviewed_at != null ? String(row.reviewed_at) : null,
    error_message: row.error_message != null ? String(row.error_message) : null,
  };
}

/** Latest review per listing_id (most recent reviewed_at). */
export async function fetchLatestListingModerationReviews(
  supabase: SupabaseClient,
  listingIds: string[],
): Promise<Record<string, ListingModerationReviewSummary>> {
  const ids = [...new Set(listingIds.map((id) => id.trim()).filter(Boolean))];
  const out: Record<string, ListingModerationReviewSummary> = {};
  if (ids.length === 0) return out;

  const { data, error } = await supabase
    .from("listing_moderation_reviews")
    .select(SUMMARY_COLS)
    .in("listing_id", ids)
    .order("reviewed_at", { ascending: false })
    .limit(Math.min(ids.length * 3, 300));

  if (error || !data) return out;

  for (const row of data as Record<string, unknown>[]) {
    const lid = String(row.listing_id);
    if (!out[lid]) out[lid] = mapRow(row);
  }
  return out;
}

export async function insertListingModerationReview(
  supabase: SupabaseClient,
  content: ListingModerationContentPayload,
  ai: RunListingAiModerationResult,
): Promise<ListingModerationReviewSummary | null> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    listing_id: content.listing_id,
    leonix_ad_id: content.leonix_ad_id,
    source_table: content.source_table,
    category_slug: content.category,
    listing_title: content.title,
    reviewed_at: now,
    updated_at: now,
    raw_input: content,
    reviewed_by: "ai",
    source: "ai",
  };

  if (ai.ok) {
    patch.decision = ai.result.decision;
    patch.reason_category = ai.result.reason_category;
    patch.reason_text = ai.result.reason_text;
    patch.confidence = ai.result.confidence;
    patch.model = ai.model;
    patch.raw_result = ai.rawResult;
    patch.error_message = null;
  } else {
    patch.decision = "unavailable";
    patch.reason_category = null;
    patch.reason_text = null;
    patch.confidence = null;
    patch.model = ai.model;
    patch.raw_result = null;
    patch.error_message = ai.error;
  }

  const { data, error } = await supabase.from("listing_moderation_reviews").insert(patch).select(SUMMARY_COLS).single();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}
