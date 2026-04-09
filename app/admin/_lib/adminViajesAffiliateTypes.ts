/** Admin-only affiliate offer model — maps to public Viajes surfaces when wired. */

export type AdminAffiliateOfferStatus = "live" | "draft" | "paused" | "expired";

export type AdminAffiliatePlacement =
  | "top_offers_week"
  | "homepage_featured"
  | "local_departures"
  | "destination_collections"
  | "seasonal_campaign"
  | "results_eligible"
  | "car_rental"
  | "audience_family"
  | "audience_romantic"
  | "audience_group"
  | "partner_spotlight";

export type AdminAffiliateOffer = {
  id: string;
  partnerName: string;
  headline: string;
  destination: string;
  departureContext: string;
  offerType: string;
  priceFrom: string;
  duration: string;
  affiliateLabel: string;
  expiryDate: string | null;
  status: AdminAffiliateOfferStatus;
  featured: boolean;
  featuredRank: number;
  placements: AdminAffiliatePlacement[];
  lastUpdated: string;
  /** Public offer detail slug when published (sample) */
  publicSlug?: string;
};

export const ADMIN_AFFILIATE_PLACEMENT_LABELS: Record<AdminAffiliatePlacement, string> = {
  top_offers_week: "Top ofertas de la semana",
  homepage_featured: "Homepage featured rail",
  local_departures: "Local departures",
  destination_collections: "Destination collections",
  seasonal_campaign: "Seasonal campaign",
  results_eligible: "Results eligibility",
  car_rental: "Car rental / mobility",
  audience_family: "Family audience",
  audience_romantic: "Romantic / couples",
  audience_group: "Groups",
  partner_spotlight: "Partner spotlight (future)",
};
