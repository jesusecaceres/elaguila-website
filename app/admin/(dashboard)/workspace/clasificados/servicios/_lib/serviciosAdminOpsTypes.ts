export type ServiciosPublicAdminRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  city: string;
  /** Null for pending/unpublished rows (Servicios epoch-fallback repair, 2026-09-17/18) — no fake epoch. */
  published_at: string | null;
  updated_at: string | null;
  leonix_verified: boolean;
  listing_status: string | null;
  internal_group: string | null;
  owner_user_id?: string | null;
  moderation_notes?: string | null;
  profile_json?: { opsMeta?: { leonixVerifiedInterest?: boolean } } | null;
  promoted?: boolean;
  republish_override?: boolean | null;
};
