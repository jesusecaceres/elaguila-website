/**
 * Canonical identity keys for Autos listings (DB + client + analytics).
 *
 * **Stable engagement / analytics key (Servicios-aligned):** prefer `leonix_ad_id` from the public row when
 * emitting client events; fall back to primary key `id` (UUID). The live URL segment is `/clasificados/autos/vehiculo/[id]`
 * — there is no separate `slug` column on `autos_classifieds_listings`; the UUID path is the public permalink.
 */

export const AUTOS_LISTING_ID_FIELD = "id" as const;
export const AUTOS_OWNER_ID_FIELD = "owner_id" as const;
export const AUTOS_LEONIX_AD_ID_FIELD = "leonix_ad_id" as const;

/** Future: column or profile join for dealer storefront identity (not yet required on every row). */
export const AUTOS_DEALER_PROFILE_ID_FIELD = "dealer_profile_id" as const;
