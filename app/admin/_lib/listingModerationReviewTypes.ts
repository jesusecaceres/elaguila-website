/** Stored moderation review row (listing_moderation_reviews). */

export type ListingModerationDecision = "approved" | "needs_review" | "rejected" | "unavailable";

export type ListingModerationReasonCategory =
  | "safe"
  | "spam"
  | "scam"
  | "adult_or_sexual"
  | "weapons"
  | "drugs_or_controlled_substances"
  | "counterfeit_or_stolen"
  | "fraud_or_payment_scam"
  | "fake_business_claim"
  | "unsafe_service"
  | "fake_job"
  | "rental_scam"
  | "prohibited_item"
  | "suspicious_price"
  | "duplicate_listing"
  | "low_quality_or_missing_info"
  | "unsafe_contact"
  | "off_platform_risk"
  | "misleading_claim"
  | "policy_review"
  | "other"
  /** v1 legacy values still readable from old rows */
  | "duplicate"
  | "missing_info";

export type ListingModerationConfidence = "low" | "medium" | "high";

export type ListingModerationRiskLevel = "low" | "medium" | "high" | "critical";

export type ListingModerationRecommendedAction =
  | "approve"
  | "review_manually"
  | "contact_seller"
  | "request_more_info"
  | "edit_listing"
  | "archive"
  | "remove_listing";

export type ListingModerationReviewSummary = {
  id: string;
  listing_id: string;
  leonix_ad_id: string | null;
  decision: ListingModerationDecision;
  source: string;
  reason_category: string | null;
  reason_text: string | null;
  confidence: string | null;
  risk_level: string | null;
  recommended_action: string | null;
  policy_flags: string[] | null;
  keyword_flags: string[] | null;
  category_rules: string[] | null;
  scanner_summary: string | null;
  admin_summary: string | null;
  policy_version: string | null;
  model: string | null;
  reviewed_at: string | null;
  error_message: string | null;
};

export type ListingModerationAiResult = {
  decision: Exclude<ListingModerationDecision, "unavailable">;
  reason_category: ListingModerationReasonCategory;
  reason_text: string;
  confidence: ListingModerationConfidence;
  risk_level: ListingModerationRiskLevel;
  recommended_action: ListingModerationRecommendedAction;
  policy_flags: string[];
  keyword_flags: string[];
  category_rules: string[];
  admin_summary: string;
};

export type ListingModerationContentPayload = {
  listing_id: string;
  leonix_ad_id: string | null;
  source_table: string;
  category: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  zip: string | null;
  price: number | null;
  is_free: boolean | null;
  status: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  business_name: string | null;
  seller_type: string | null;
  owner_email: string | null;
  image_count: number;
  image_urls: string[];
};

/** Parse jsonb array columns or raw_result fallback for v1 rows. */
export function parseModerationStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const arr = value.map((x) => String(x).trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  return null;
}

export function readModerationPolicyFieldsFromRaw(
  raw: Record<string, unknown> | null | undefined,
): Pick<
  ListingModerationReviewSummary,
  "risk_level" | "recommended_action" | "policy_flags" | "keyword_flags" | "category_rules" | "admin_summary" | "scanner_summary"
> {
  if (!raw) {
    return {
      risk_level: null,
      recommended_action: null,
      policy_flags: null,
      keyword_flags: null,
      category_rules: null,
      admin_summary: null,
      scanner_summary: null,
    };
  }
  return {
    risk_level: raw.risk_level != null ? String(raw.risk_level) : null,
    recommended_action: raw.recommended_action != null ? String(raw.recommended_action) : null,
    policy_flags: parseModerationStringArray(raw.policy_flags),
    keyword_flags: parseModerationStringArray(raw.keyword_flags),
    category_rules: parseModerationStringArray(raw.category_rules),
    admin_summary: raw.admin_summary != null ? String(raw.admin_summary) : null,
    scanner_summary: raw.scanner_summary != null ? String(raw.scanner_summary) : null,
  };
}
