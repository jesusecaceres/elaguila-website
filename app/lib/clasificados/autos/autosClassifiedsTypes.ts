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

export type AutosClassifiedsListingRow = {
  id: string;
  owner_user_id: string;
  lane: AutosClassifiedsLane;
  status: AutosClassifiedsListingStatus;
  lang: AutosClassifiedsLang;
  featured: boolean;
  listing_payload: AutoDealerListing;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
