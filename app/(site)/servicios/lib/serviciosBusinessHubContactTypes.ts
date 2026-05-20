import type { ServiciosLang } from "../types/serviciosBusinessProfile";

/** Future-ready view model — populated only from existing published profile data in P1. */
export type ServiciosBusinessHubCustomLink = {
  label: string;
  url: string;
};

export type ServiciosBusinessHubReviewLink = {
  id: "google_business" | "google_review" | "yelp";
  label: string;
  url: string;
  /** Only set when real aggregate rating exists — never invented in production. */
  rating?: number;
  reviewCount?: number;
};

export type ServiciosBusinessHubSocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "linkedin"
  | "snapchat"
  | "pinterest";

export type ServiciosBusinessHubSocialLink = {
  platform: ServiciosBusinessHubSocialPlatform;
  url: string;
};

export type ServiciosBusinessHubContactActions = {
  /** Set when `phoneTelHref` exists on the resolved profile. */
  hasCall?: boolean;
  messageSmsHref?: string;
  whatsappHref?: string;
  emailMailto?: string;
  emailDisplay?: string;
};

export type ServiciosBusinessHubContactViewModel = {
  lang: ServiciosLang;
  showLeonixVerifiedCue: boolean;
  contact: ServiciosBusinessHubContactActions;
  social: ServiciosBusinessHubSocialLink[];
  reviews: ServiciosBusinessHubReviewLink[];
  moreLinks: ServiciosBusinessHubCustomLink[];
  location?: {
    addressDisplay: string;
    mapsHref?: string;
  };
};
