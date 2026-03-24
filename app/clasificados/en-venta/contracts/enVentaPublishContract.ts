/**
 * En Venta canonical publish / persistence contract (free MVP + boost hooks).
 */

import type { EnVentaConditionValue } from "../shared/fields/enVentaTaxonomy";

export type EnVentaSellerKind = "individual" | "business";

export type EnVentaPlanTier = "free" | "pro" | "business";

/** Wizard + draft payload (subset persisted in listing_drafts.draft_data.details). */
export type EnVentaDraftDetails = {
  rama: string;
  evSub?: string;
  itemType: string;
  condition: EnVentaConditionValue | string;
  brand?: string;
  model?: string;
  negotiable?: "" | "yes";
  zip?: string;
  pickup?: "" | "1";
  shipping?: "" | "1";
  delivery?: "" | "1";
  seller_kind?: EnVentaSellerKind | "";
  /** Future: plan_tier, featured_rank, boost_until stored server-side or in metadata. */
  plan_tier?: EnVentaPlanTier;
};

export type EnVentaInsertExtras = {
  seller_type: "personal" | "business";
  detail_pairs: Array<{ label: string; value: string }> | null;
};

export const EN_VENTA_MODERATION_REASONS = [
  "prohibited_item",
  "counterfeit",
  "misleading_price",
  "spam",
  "duplicate",
] as const;

export type EnVentaModerationReason = (typeof EN_VENTA_MODERATION_REASONS)[number];
