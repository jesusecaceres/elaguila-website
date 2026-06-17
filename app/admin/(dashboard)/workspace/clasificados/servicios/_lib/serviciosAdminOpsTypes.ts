export type ServiciosPublicAdminRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  city: string;
  published_at: string;
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
