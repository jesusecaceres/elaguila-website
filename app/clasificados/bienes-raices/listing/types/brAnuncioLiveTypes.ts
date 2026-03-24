export type BrAnuncioLang = "es" | "en";

export type BrAnuncioDetailPair = { label: string; value: string };

/** Minimal listing shape for BR live-detail derived state on `/clasificados/anuncio/[id]`. */
export type BrAnuncioListingLike = {
  id: string;
  category: string;
  sellerType?: string;
  seller_type?: string;
  business_name?: string | null;
  businessName?: string | null;
  business_meta?: string | null;
  detailPairs?: BrAnuncioDetailPair[];
  detail_pairs?: BrAnuncioDetailPair[];
  details?: Record<string, string>;
};

export type BrNegocioSocialLink = { label: string; url: string };

/** BR negocio business block + desktop rail (live anuncio). Mirrors prior inline shape in anuncio page. */
export type BrNegocioLiveDisplay = {
  name: string;
  agent: string;
  role: string;
  agentLicense: string;
  officePhone: string;
  website: string | null;
  socialLinks: BrNegocioSocialLink[] | null;
  rawSocials: string;
  logoUrl: string | null;
  agentPhotoUrl: string | null;
  languages: string;
  hours: string;
  virtualTourUrl: string | null;
  plusMoreListings: boolean;
  businessDescription: string;
  availabilityRows: Array<{ title: string; price: string; size: string; ctaText?: string; ctaLink?: string }>;
};

export type BrSameCompanySampleItem = {
  id: string;
  category: string;
  title: Record<BrAnuncioLang, string>;
  priceLabel: Record<BrAnuncioLang, string>;
  city: string;
  postedAgo: Record<BrAnuncioLang, string>;
};
