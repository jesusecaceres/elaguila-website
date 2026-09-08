/**
 * Program 6 — Creative Studio constants.
 * Mirrors the enum/check conventions from Program 4/5.
 */

export const CREATIVE_STUDIO_FLAG_KEY = "business_creative_studio";
export const MAGAZINE_AD_STUDIO_FLAG_KEY = "business_magazine_ad_studio";
export const SPONSORED_INSERT_STUDIO_FLAG_KEY = "business_sponsored_insert_studio";

export const CREATIVE_JOB_STATUSES: readonly string[] = [
  "draft", "ready_for_generation", "generated", "in_review",
  "changes_requested", "owner_review", "approved", "archived",
];

export const CREATIVE_JOB_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["ready_for_generation", "archived"],
  ready_for_generation: ["generated", "draft", "archived"],
  generated: ["in_review", "draft", "archived"],
  in_review: ["changes_requested", "owner_review", "approved", "archived"],
  changes_requested: ["ready_for_generation", "archived"],
  owner_review: ["approved", "changes_requested", "archived"],
  approved: ["archived"],
  archived: [],
};

export function isValidCreativeJobStatusTransition(from: string, to: string): boolean {
  const allowed = CREATIVE_JOB_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const CREATIVE_ASSET_TYPES: readonly string[] = [
  "magazine_ad", "sponsored_insert", "business_description", "social_copy",
  "whatsapp_promo_copy", "flyer_copy", "coupon_copy", "logo_direction",
  "website_strategy", "campaign_plan_30_day",
];

export const CREATIVE_LANGUAGES: readonly string[] = [
  "es", "en", "bilingual", "es_primary_en_support", "en_primary_es_support",
];

export const CREATIVE_LANES: readonly string[] = [
  "LANE_A_TRADITIONAL_UPGRADED", "LANE_B_PREMIUM_CREATIVE", "LANE_C_SPONSORED_EDITORIAL",
];

export const CREATIVE_BRIEF_STATUSES: readonly string[] = ["DRAFT", "STAFF_APPROVED"];

export const CREATIVE_REVIEW_ISSUE_TYPES: readonly string[] = [
  "FACT_ERROR", "CONTACT_ERROR", "OFFER_ERROR", "SPELLING", "TRANSLATION",
  "BRAND", "IMAGE", "RIGHTS", "LAYOUT", "READABILITY", "QR", "DISCLAIMER",
  "COMPLIANCE", "OTHER",
];

export const CREATIVE_EXPORT_TYPES: readonly string[] = [
  "CANVA_PRODUCTION_PACK_JSON", "CANVA_PRODUCTION_BRIEF_TEXT", "COPY_DECK",
  "IMAGE_BRIEF", "PRINT_SPEC_SHEET", "REVIEW_CHECKLIST", "APPROVAL_SNAPSHOT",
  "CREATIVE_PROOF_PDF",
];

export const ASSET_KINDS: readonly string[] = [
  "client_logo", "client_photo", "staff_portrait", "product", "food",
  "building", "service_work", "licensed_stock", "leonix_owned",
  "creator_supplied", "public_domain", "ai_illustrative", "other",
];

export const RIGHTS_SOURCES: readonly string[] = [
  "client_provided", "licensed_stock", "leonix_owned", "creator_supplied",
  "public_domain", "ai_generated", "unknown",
];

export const RIGHTS_STATUSES: readonly string[] = [
  "verified", "pending_review", "unknown_rights", "restricted", "expired",
];

export const AUTHENTICITY_CLASSIFICATIONS: readonly string[] = [
  "REAL_CLIENT", "LICENSED_STOCK", "AI_ILLUSTRATIVE", "UNKNOWN",
];

export const ASSET_APPROVAL_STATES: readonly string[] = ["pending", "approved", "rejected"];

export const CANVA_INTEGRATION_STATUSES: readonly string[] = [
  "manual_handoff", "provider_ready", "connected", "certified",
];

export const RISK_CLASSES: readonly string[] = [
  "NORMAL", "LEGAL", "MEDICAL", "FINANCIAL", "INSURANCE", "IMMIGRATION",
  "TAX", "SAFETY", "EMPLOYMENT", "HOUSING",
];

export const SNAPSHOT_TRUTH_STATUSES: readonly string[] = [
  "KNOWN", "STALE", "UNKNOWN", "CONTRADICTED", "UNAPPROVED_INFERENCE",
];

export const PROVIDER_RUN_STATUSES: readonly string[] = [
  "pending", "success", "failed", "fallback",
];

// ─── Owner-safe field visibility ────────────────────────────────────────────
export const OWNER_SAFE_VISIBLE_FIELDS: readonly string[] = [
  "approved_creative",
  "final_copy",
  "approved_preview",
  "asset_requests",
  "requested_corrections",
  "approval_controls",
  "approved_export_reference",
];

export const OWNER_SAFE_HIDDEN_FIELDS: readonly string[] = [
  "private_staff_notes",
  "provider_raw_reasoning",
  "api_metadata",
  "internal_cost",
  "unpublished_alternatives",
  "another_business_data",
  "unsupported_assumptions",
];
