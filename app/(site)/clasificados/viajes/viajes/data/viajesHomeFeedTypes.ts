/**
 * Structured feeds for Viajes home sections (replace with API selectors later).
 */

import type { ViajesTopOffer } from "./viajesLandingSampleData";

export type ViajesPartnerSpotlightCard = {
  slug: string;
  businessName: string;
  tagline: string;
  destinationsLine: string;
  verifiedPlaceholder?: boolean;
  profileHref: string;
  logoAlt?: string;
};

export type ViajesEditorialCardModel = {
  id: string;
  title: string;
  dek: string;
  readTime: string;
  imageSrc: string;
  imageAlt: string;
  /** Placeholder: can point to results with hints until editorial routes exist */
  href: string;
};

export type ViajesSeasonalOfferTeaser = {
  id: string;
  title: string;
  href: string;
  source: "affiliate" | "business";
  tag: string;
};

export type ViajesSeasonalCampaignModel = {
  id: string;
  headline: string;
  subline: string;
  theme: "verano" | "ultimo-minuto" | "romanticas" | "familiares" | "spring-break" | "cruceros";
  offers: ViajesSeasonalOfferTeaser[];
};

export type ViajesTopOffersFeed = ViajesTopOffer[];
