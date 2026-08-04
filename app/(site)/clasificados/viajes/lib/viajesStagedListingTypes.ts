/** DB row shape for `public.viajes_staged_listings` (snake_case from Supabase). */

export type ViajesStagedLifecycleStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "expired"
  | "unpublished";

/** Staged writes today use business|private; affiliate|editorial accepted for public read when present. */
export type ViajesStagedLane = "business" | "private" | "affiliate" | "editorial";

export type ViajesStagedListingJsonV1 = {
  version: 1;
  negocios?: Record<string, unknown>;
  privado?: Record<string, unknown>;
};

/** V2 staged envelope — canonical offer lives in `offer`. */
export type ViajesStagedListingJsonV2 = {
  version: 2;
  offer: Record<string, unknown>;
};

export type ViajesStagedListingJson = ViajesStagedListingJsonV1 | ViajesStagedListingJsonV2;

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
  review_notes: string | null;
  moderation_reason: string | null;
  hero_image_url: string | null;
  listing_json: ViajesStagedListingJson | Record<string, unknown>;
  lang: "es" | "en";
  submitted_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};
