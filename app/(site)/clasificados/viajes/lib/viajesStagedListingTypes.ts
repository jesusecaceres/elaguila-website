/** DB row shape for `public.viajes_staged_listings` (snake_case from Supabase). */

import type { ViajesIntakeV1 } from "./viajesIntakeTypes";

export type ViajesStagedLifecycleStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "expired"
  | "unpublished";

export type ViajesStagedLane = "business" | "private";

export type ViajesStagedListingJsonV1 = {
  version: 1;
  negocios?: Record<string, unknown>;
  privado?: Record<string, unknown>;
  /**
   * Package 3 — Community Opportunity Intake snapshot (business lane only). Written by the
   * intake API; the full application PRESERVES it (submit merges `negocios` into the envelope
   * rather than replacing it) so Leonix keeps the original opportunity scope as an auditable
   * record. Additive — rows without `intake` are the pre-Package-3 shape and keep working.
   */
  intake?: ViajesIntakeV1;
};

/**
 * Package 3 — server/admin community-benefit truth for the public badge.
 * Lives in a dedicated COLUMN (not `listing_json`) because owner revisions rewrite the JSON
 * envelope wholesale — an owner must never be able to write "approved". Only the admin
 * moderation route promotes `claimed` → `approved`; any owner intake save recomputes
 * `claimed`/`none` (which also fail-safes an already-approved benefit back to `claimed`
 * for re-review). Optional on the row type: the column arrives with the (authored, not yet
 * applied) Package 3 migration — absent column ⇒ `undefined` ⇒ every consumer fails closed.
 */
export type ViajesCommunityBenefitStatus = "none" | "claimed" | "approved";

/** Derived — not stored. `intake` with no `negocios` is the intake stage of the one-row identity. */
export type ViajesStagedApplicationStage = "intake" | "full_application";

export function resolveViajesStagedApplicationStage(
  json: ViajesStagedListingJsonV1 | Record<string, unknown> | null | undefined,
): ViajesStagedApplicationStage {
  const j = (json ?? {}) as ViajesStagedListingJsonV1;
  if (j.intake && !j.negocios) return "intake";
  return "full_application";
}

export type ViajesStagedListingRow = {
  id: string;
  /** Permanent Leonix code (TRAV-YYYY-000001) when approved + public; null on drafts. */
  leonix_ad_id?: string | null;
  slug: string;
  category: string;
  lane: ViajesStagedLane;
  owner_user_id: string | null;
  business_profile_slug: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  title: string;
  lifecycle_status: ViajesStagedLifecycleStatus;
  is_public: boolean;
  /** Staff moderation columns (`20260508140000_classifieds_admin_ops_columns.sql`). */
  leonix_verified?: boolean;
  admin_promoted?: boolean;
  /** Package 3 — optional until the authored migration is applied; see ViajesCommunityBenefitStatus. */
  community_benefit_status?: ViajesCommunityBenefitStatus;
  review_notes: string | null;
  moderation_reason: string | null;
  hero_image_url: string | null;
  listing_json: ViajesStagedListingJsonV1 | Record<string, unknown>;
  lang: "es" | "en";
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
