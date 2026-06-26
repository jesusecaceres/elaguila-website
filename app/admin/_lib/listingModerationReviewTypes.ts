/** Stored moderation review row (listing_moderation_reviews). */

export type ListingModerationDecision = "approved" | "needs_review" | "rejected" | "unavailable";

export type ListingModerationReasonCategory =
  | "safe"
  | "spam"
  | "scam"
  | "prohibited_item"
  | "suspicious_price"
  | "duplicate"
  | "missing_info"
  | "unsafe_contact"
  | "policy_review"
  | "other";

export type ListingModerationConfidence = "low" | "medium" | "high";

export type ListingModerationReviewSummary = {
  id: string;
  listing_id: string;
  leonix_ad_id: string | null;
  decision: ListingModerationDecision;
  source: string;
  reason_category: string | null;
  reason_text: string | null;
  confidence: string | null;
  model: string | null;
  reviewed_at: string | null;
  error_message: string | null;
};

export type ListingModerationAiResult = {
  decision: Exclude<ListingModerationDecision, "unavailable">;
  reason_category: ListingModerationReasonCategory;
  reason_text: string;
  confidence: ListingModerationConfidence;
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
