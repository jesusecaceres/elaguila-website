/**
 * Canonical identity keys for Autos listings (DB + client).
 * All Autos lanes must resolve through listingId + owner; dealer flows add dealerProfileId when modeled.
 */

export const AUTOS_LISTING_ID_FIELD = "id" as const;
export const AUTOS_OWNER_ID_FIELD = "owner_id" as const;

/** Future: column or profile join for dealer storefront identity (not yet required on every row). */
export const AUTOS_DEALER_PROFILE_ID_FIELD = "dealer_profile_id" as const;
