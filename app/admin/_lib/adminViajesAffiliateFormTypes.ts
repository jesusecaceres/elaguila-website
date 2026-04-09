import type { AdminAffiliateOffer } from "./adminViajesAffiliateTypes";
import type { AdminAffiliatePlacement } from "./adminViajesAffiliateTypes";

export type AffiliateFormState = {
  partnerName: string;
  headline: string;
  destination: string;
  departureContext: string;
  offerType: string;
  priceFrom: string;
  duration: string;
  bookingUrl: string;
  imageUrl: string;
  shortDescription: string;
  tags: string;
  affiliateLabel: string;
  expiryDate: string;
  internalNotes: string;
  featuredRank: string;
  status: AdminAffiliateOffer["status"];
  featured: boolean;
  placements: AdminAffiliatePlacement[];
  seasonalCampaign: string;
  homepageInclusion: boolean;
  topOffersInclusion: boolean;
  resultsEligible: boolean;
  publicSlug: string;
};
