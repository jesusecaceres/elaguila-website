/**
 * Gate REST1 — saved_listings row identity for Restaurantes public listings.
 * listing_id matches restaurantesEngagementListingKey (leonix_ad_id → id).
 */
import { restaurantesEngagementListingKey } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesListingEngagement";

export type RestaurantesSavedListingSource = {
  slug: string;
  id?: string | null;
  leonix_ad_id?: string | null;
};

export type RestaurantesSaveExtras = {
  category?: string;
  source_table?: string;
  source_id?: string;
  canonical_ad_id?: string;
};

export function restaurantesSavedListingExtras(row: RestaurantesSavedListingSource): RestaurantesSaveExtras {
  const slug = (row.slug ?? "").trim();
  const sourceId = (row.id ?? "").trim() || slug;
  const listingId = restaurantesEngagementListingKey({ id: row.id ?? "", leonix_ad_id: row.leonix_ad_id });
  return {
    category: "restaurantes",
    source_table: "restaurantes_public_listings",
    source_id: sourceId,
    canonical_ad_id: listingId,
  };
}

export function restaurantesSavedListingExtrasFromClient(args: {
  slug: string;
  engagementListingId?: string | null;
  listingSourceId?: string | null;
}): RestaurantesSaveExtras {
  const slug = (args.slug ?? "").trim();
  const sourceId = (args.listingSourceId ?? "").trim();
  const key = (args.engagementListingId ?? "").trim();
  const leonix_ad_id = /^REST-/i.test(key) ? key.toUpperCase() : null;
  const id = sourceId || (key && /^[0-9a-f-]{36}$/i.test(key) ? key : null);
  return restaurantesSavedListingExtras({ slug, id, leonix_ad_id });
}
