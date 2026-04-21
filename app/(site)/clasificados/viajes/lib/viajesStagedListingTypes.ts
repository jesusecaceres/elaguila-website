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

export type ViajesStagedLane = "business" | "private";

export type ViajesStagedListingJsonV1 = {
  version: 1;
  negocios?: Record<string, unknown>;
  privado?: Record<string, unknown>;
};

export type ViajesStagedListingRow = {
  id: string;
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
