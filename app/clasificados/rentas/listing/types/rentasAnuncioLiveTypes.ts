export type RentasAnuncioLang = "es" | "en";

export type RentasAnuncioFactPair = { label: string; value: string };

/** Minimal listing shape for Rentas live-detail derived state on `/clasificados/anuncio/[id]`. */
export type RentasAnuncioListingLike = {
  id: string;
  category: string;
  sellerType?: string;
  seller_type?: string;
  business_name?: string | null;
  businessName?: string | null;
  business_meta?: string | null;
  rentasTier?: string | null;
  rentas_tier?: string | null;
  servicesTier?: string | null;
  title?: Record<RentasAnuncioLang, string>;
  blurb?: Record<RentasAnuncioLang, string>;
  priceLabel?: Record<RentasAnuncioLang, string>;
  detailPairs?: RentasAnuncioFactPair[];
  detail_pairs?: RentasAnuncioFactPair[];
};

export type RentasNegocioSocialLink = { label: string; url: string };

export type RentasNegocioLiveDisplay = {
  name: string;
  agent: string;
  role: string;
  agentLicense: string;
  officePhone: string;
  website: string | null;
  socialLinks: RentasNegocioSocialLink[] | null;
  rawSocials: string;
  logoUrl: string | null;
  agentPhotoUrl: string | null;
  languages: string;
  hours: string;
  virtualTourUrl: string | null;
  plusMoreListings: boolean;
};

export type RentasSameCompanySampleItem = {
  id: string;
  category: string;
  title: Record<RentasAnuncioLang, string>;
  priceLabel: Record<RentasAnuncioLang, string>;
  city: string;
  postedAgo: Record<RentasAnuncioLang, string>;
  business_name?: string | null;
  businessName?: string | null;
};
