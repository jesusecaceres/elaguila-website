import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

/** Persisted listing lifecycle for paid Autos classifieds. */
export type AutosClassifiedsListingStatus =
  | "draft"
  | "pending_payment"
  | "active"
  | "payment_failed"
  | "cancelled"
  | "removed";

export type AutosClassifiedsLane = "negocios" | "privado";

export type AutosClassifiedsLang = "es" | "en";

export type AutosDealerInventoryRole = "main" | "inventory_vehicle";

export type AutosClassifiedsListingRow = {
  id: string;
  leonix_ad_id?: string | null;
  owner_user_id: string | null;
  dealer_inventory_group_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
  inventory_role?: AutosDealerInventoryRole | null;
  lane: AutosClassifiedsLane;
  status: AutosClassifiedsListingStatus;
  lang: AutosClassifiedsLang;
  featured: boolean;
  /** Staff Leonix verification (`20260508140000_classifieds_admin_ops_columns.sql`). */
  leonix_verified?: boolean;
  listing_payload: AutoDealerListing;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  published_at: string | null;
  /** Fixed-term (Privado only) expiration — `20260910120000_autos_privado_lifecycle_expires_at.sql`. Always null for dealer/negocios rows. */
  expires_at?: string | null;
  /**
   * Why a non-live status was applied (`20260805090500_lane_listing_suspended_reason.sql`).
   * `moderation` = staff suspend / remove-public: NOT owner-reversible. `payment` = payment engine.
   * NULL on rows the owner unpublished themselves (and on legacy staff removals written before this
   * field was set — those remain indistinguishable from an owner unpublish).
   */
  suspended_reason?: string | null;
  created_at: string;
  updated_at: string;
};
