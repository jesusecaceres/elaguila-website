import { VIAJES_NEGOCIO_PROFILES } from "./viajesNegocioProfileSampleData";
import { VIAJES_EDITORIAL_CARDS } from "./viajesEditorialSampleData";
import { VIAJES_TOP_OFFERS } from "./viajesLandingSampleData";
import type { ViajesPartnerSpotlightCard, ViajesTopOffersFeed } from "./viajesHomeFeedTypes";
import { VIAJES_SEASONAL_CAMPAIGNS } from "./viajesSeasonalSampleData";

/** Curated mixed feed: affiliate, business, editorial — ordered by featuredRank. */
export function selectViajesTopOffersFeed(): ViajesTopOffersFeed {
  return [...VIAJES_TOP_OFFERS].sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
}

/** Business / partner profiles only. */
export function selectViajesPartnerSpotlight(limit = 4): ViajesPartnerSpotlightCard[] {
  return Object.values(VIAJES_NEGOCIO_PROFILES)
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      businessName: p.businessName,
      tagline: p.tagline,
      destinationsLine: p.destinationsServed.slice(0, 4).join(" · "),
      verifiedPlaceholder: p.verifiedPlaceholder,
      profileHref: `/clasificados/viajes/negocio/${encodeURIComponent(p.slug)}`,
      logoAlt: p.logoAlt,
    }));
}

export function selectViajesEditorialFeed() {
  return VIAJES_EDITORIAL_CARDS;
}

export function selectViajesSeasonalCampaigns() {
  return VIAJES_SEASONAL_CAMPAIGNS;
}
