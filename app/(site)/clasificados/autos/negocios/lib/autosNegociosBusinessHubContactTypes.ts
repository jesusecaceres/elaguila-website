import type { AutosNegociosLang } from "./autosNegociosLang";

export type AutosNegociosBusinessHubCustomLink = {
  label: string;
  url: string;
};

export type AutosNegociosBusinessHubReviewLink = {
  id: "google" | "yelp";
  label: string;
  url: string;
};

export type AutosNegociosBusinessHubSocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "linkedin"
  | "snapchat"
  | "pinterest"
  | "whatsapp";

export type AutosNegociosBusinessHubSocialLink = {
  platform: AutosNegociosBusinessHubSocialPlatform;
  url: string;
};

export type AutosNegociosBusinessHubContactActions = {
  whatsappHref?: string;
  callTelHref?: string;
  smsHref?: string;
  bookingHref?: string;
  websiteHref?: string;
  emailMailto?: string;
};

export type AutosNegociosBusinessHubContactViewModel = {
  lang: AutosNegociosLang;
  contact: AutosNegociosBusinessHubContactActions;
  social: AutosNegociosBusinessHubSocialLink[];
  reviews: AutosNegociosBusinessHubReviewLink[];
  moreLinks: AutosNegociosBusinessHubCustomLink[];
  location?: {
    addressDisplay: string;
    mapsHref?: string;
  };
};
