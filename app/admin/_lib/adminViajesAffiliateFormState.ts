import type { AdminAffiliateOffer } from "./adminViajesAffiliateTypes";
import type { AffiliateFormState } from "./adminViajesAffiliateFormTypes";

export type { AffiliateFormState } from "./adminViajesAffiliateFormTypes";

export function emptyAffiliateFormState(): AffiliateFormState {
  return {
    partnerName: "",
    headline: "",
    destination: "",
    departureContext: "",
    offerType: "Resort / paquete",
    priceFrom: "",
    duration: "",
    bookingUrl: "",
    imageUrl: "",
    shortDescription: "",
    tags: "",
    affiliateLabel: "Socio comercial",
    expiryDate: "",
    internalNotes: "",
    featuredRank: "0",
    status: "draft",
    featured: false,
    placements: ["results_eligible"],
    seasonalCampaign: "",
    homepageInclusion: false,
    topOffersInclusion: false,
    resultsEligible: true,
    publicSlug: "",
  };
}

export function offerToAffiliateFormState(row: AdminAffiliateOffer): AffiliateFormState {
  const home = row.placements.includes("homepage_featured");
  const top = row.placements.includes("top_offers_week");
  const res = row.placements.includes("results_eligible");
  return {
    partnerName: row.partnerName,
    headline: row.headline,
    destination: row.destination,
    departureContext: row.departureContext,
    offerType: row.offerType,
    priceFrom: row.priceFrom,
    duration: row.duration,
    bookingUrl: "https://partner.example/booking",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52befd2?w=1200",
    shortDescription: "",
    tags: "playa, familia, resort",
    affiliateLabel: row.affiliateLabel,
    expiryDate: row.expiryDate ?? "",
    internalNotes: "",
    featuredRank: String(row.featuredRank ?? ""),
    status: row.status,
    featured: row.featured,
    placements: row.placements,
    seasonalCampaign: "verano-2026",
    homepageInclusion: home,
    topOffersInclusion: top,
    resultsEligible: res,
    publicSlug: row.publicSlug ?? "",
  };
}
