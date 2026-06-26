import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ListingModerationContentPayload,
  ListingModerationReviewSummary,
} from "./listingModerationReviewTypes";
import { parseModerationStringArray, readModerationPolicyFieldsFromRaw } from "./listingModerationReviewTypes";
import type { RunListingAiModerationResult } from "./listingAiModerationEngine";
import {
  LEONIX_MODERATION_POLICY_VERSION,
  LEONIX_MODERATION_PROMPT_VERSION,
} from "./listingModerationPolicy";

const SUMMARY_COLS =
  "id, listing_id, leonix_ad_id, decision, source, reason_category, reason_text, confidence, risk_level, recommended_action, policy_flags, keyword_flags, category_rules, scanner_result, policy_version, model, reviewed_at, error_message, raw_result";

function mapRow(row: Record<string, unknown>): ListingModerationReviewSummary {
  const rawResult =
    row.raw_result && typeof row.raw_result === "object" ? (row.raw_result as Record<string, unknown>) : null;
  const resolved = rawResult?.resolved && typeof rawResult.resolved === "object" ? (rawResult.resolved as Record<string, unknown>) : rawResult;
  const fromRaw = readModerationPolicyFieldsFromRaw(resolved ?? rawResult);

  const scannerResult =
    row.scanner_result && typeof row.scanner_result === "object" ? (row.scanner_result as Record<string, unknown>) : null;

  return {
    id: String(row.id),
    listing_id: String(row.listing_id),
    leonix_ad_id: row.leonix_ad_id != null ? String(row.leonix_ad_id) : null,
    decision: String(row.decision) as ListingModerationReviewSummary["decision"],
    source: String(row.source ?? "ai"),
    reason_category: row.reason_category != null ? String(row.reason_category) : null,
    reason_text: row.reason_text != null ? String(row.reason_text) : null,
    confidence: row.confidence != null ? String(row.confidence) : null,
    risk_level: row.risk_level != null ? String(row.risk_level) : fromRaw.risk_level,
    recommended_action:
      row.recommended_action != null ? String(row.recommended_action) : fromRaw.recommended_action,
    policy_flags: parseModerationStringArray(row.policy_flags) ?? fromRaw.policy_flags,
    keyword_flags: parseModerationStringArray(row.keyword_flags) ?? fromRaw.keyword_flags,
    category_rules: parseModerationStringArray(row.category_rules) ?? fromRaw.category_rules,
    scanner_summary:
      scannerResult?.scannerSummary != null
        ? String(scannerResult.scannerSummary)
        : fromRaw.scanner_summary,
    admin_summary: fromRaw.admin_summary,
    policy_version: row.policy_version != null ? String(row.policy_version) : null,
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
    patch.risk_level = ai.result.risk_level;
    patch.recommended_action = ai.result.recommended_action;
    patch.policy_flags = ai.result.policy_flags;
    patch.keyword_flags = ai.result.keyword_flags;
    patch.category_rules = ai.result.category_rules;
    patch.scanner_result = ai.scanner;
    patch.policy_version = ai.policyVersion;
    patch.prompt_version = ai.promptVersion;
    patch.model = ai.model;
    patch.raw_result = ai.rawResult;
    patch.error_message = null;
  } else {
    patch.decision = "unavailable";
    patch.reason_category = null;
    patch.reason_text = null;
    patch.confidence = null;
    patch.risk_level = ai.scanner?.riskLevel ?? null;
    patch.recommended_action = ai.scanner?.recommendedAction ?? null;
    patch.policy_flags = ai.scanner?.policyFlags ?? null;
    patch.keyword_flags = ai.scanner?.keywordFlags ?? null;
    patch.category_rules = ai.scanner?.categoryRules ?? null;
    patch.scanner_result = ai.scanner;
    patch.policy_version = ai.scanner ? LEONIX_MODERATION_POLICY_VERSION : null;
    patch.prompt_version = ai.scanner ? LEONIX_MODERATION_PROMPT_VERSION : null;
    patch.model = ai.model;
    patch.raw_result = ai.scanner ? { scanner: ai.scanner, error: ai.error } : null;
    patch.error_message = ai.error;
  }

  const { data, error } = await supabase.from("listing_moderation_reviews").insert(patch).select(SUMMARY_COLS).single();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}
