/**
 * Leonix Clasificados — Restaurantes desktop detail shell.
 * Types mirror the fields the live application will eventually bind.
 */

export type ShellHoursStatus = "open" | "closed" | "unknown";

export type ShellPrimaryCtaKey =
  | "website"
  | "call"
  | "whatsapp"
  | "message"
  | "menu"
  | "reserve"
  | "order"
  | "save"
  | "share";

export type ShellPrimaryCta = {
  /** Stable key for analytics / wiring */
  key: ShellPrimaryCtaKey;
  label: string;
  href: string;
  /** When false, shell renders as span/disabled (e.g. ordering not available) */
  enabled?: boolean;
  /** Accessible hint when disabled */
  disabledReason?: string;
};

export type ShellQuickInfoItem = {
  key: "neighborhood" | "price" | "businessType" | "hours" | "service";
  label: string;
  value: string;
};

export type ShellMenuHighlight = {
  name: string;
  supportingLine: string;
  imageUrl: string;
  /** Optional badge e.g. photo count from community */
  badge?: string;
};

export type ShellHighlightTag = {
  key: string;
  label: string;
};

export type ShellGalleryItem = {
  imageUrl: string;
  alt: string;
  category: "interior" | "food" | "exterior" | "video";
  countOverlay?: number;
};

export type ShellContactBlock = {
  addressLine1: string;
  addressLine2?: string;
  /** Used for maps search / “Ver ubicación” */
  mapsSearchQuery: string;
  phoneDisplay: string;
  phoneTelHref: string;
  email: string;
  websiteDisplay: string;
  websiteHref: string;
  instagramHandle: string;
  instagramHref: string;
  facebookDisplay: string;
  facebookHref: string;
  tiktokHandle: string;
  tiktokHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  menuFileLabel?: string;
  menuFileHref?: string;
};

export type ShellTrustLight = {
  summaryLine: string;
  externalTrustHref?: string;
  externalTrustLabel?: string;
};

/**
 * Full shell payload — one object per listing in production.
 */
export type RestaurantDetailShellData = {
  id: string;
  heroImageUrl: string;
  heroImageAlt: string;
  businessName: string;
  cuisineTypeLine: string;
  summaryShort: string;
  trustRating?: {
    average: number;
    count: number;
  };
  hoursPreview: {
    status: ShellHoursStatus;
    /** e.g. "Abierto ahora · hasta las 22:00" */
    statusLine: string;
    /** e.g. "Lun – Dom · 17:00 – 22:00" */
    scheduleSummary: string;
  };
  seeHoursLabel: string;
  seeHoursHref: string;
  primaryCtas: ShellPrimaryCta[];
  quickInfo: ShellQuickInfoItem[];
  menuHighlights: ShellMenuHighlight[];
  fullMenuCta: { label: string; href: string };
  highlightTags: ShellHighlightTag[];
  gallery: ShellGalleryItem[];
  galleryCta: { label: string; href: string };
  contact: ShellContactBlock;
  aboutTitle: string;
  aboutBody: string;
  trustLight?: ShellTrustLight;
};
