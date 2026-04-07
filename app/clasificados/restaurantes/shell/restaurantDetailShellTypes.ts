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
  /** Optional when video tile uses gradient fallback */
  imageUrl?: string;
  alt: string;
  category: "interior" | "food" | "exterior" | "video";
  countOverlay?: number;
};

/** Contact + access: all optional — shell renders only filled rows */
export type ShellContactBlock = {
  addressLine1?: string;
  addressLine2?: string;
  mapsSearchQuery?: string;
  phoneDisplay?: string;
  phoneTelHref?: string;
  email?: string;
  websiteDisplay?: string;
  websiteHref?: string;
  instagramHref?: string;
  facebookHref?: string;
  tiktokHref?: string;
  youtubeHref?: string;
  whatsappHref?: string;
  menuFileLabel?: string;
  menuFileHref?: string;
};

export type ShellTrustLight = {
  summaryLine: string;
  externalTrustHref?: string;
  externalTrustLabel?: string;
};

export type ShellStackSection = {
  id: string;
  title: string;
  rows: { label: string; value: string }[];
};

/**
 * Full shell payload — one object per listing in production.
 * Optional sections may be omitted or empty; shell hides them without layout breaks.
 */
export type RestaurantDetailShellData = {
  id: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  businessName: string;
  cuisineTypeLine?: string;
  /** Custom “Otra” / supplemental taxonomy labels — short chips under the cuisine line */
  taxonomyChips?: { key: string; label: string }[];
  summaryShort?: string;
  trustRating?: {
    average: number;
    count: number;
  };
  hoursPreview: {
    status: ShellHoursStatus;
    statusLine: string;
    scheduleSummary: string;
  };
  seeHoursLabel: string;
  seeHoursHref: string;
  primaryCtas: ShellPrimaryCta[];
  quickInfo?: ShellQuickInfoItem[];
  menuHighlights?: ShellMenuHighlight[];
  fullMenuCta?: { label: string; href: string };
  highlightTags?: ShellHighlightTag[];
  gallery?: ShellGalleryItem[];
  galleryCta?: { label: string; href: string };
  contact?: ShellContactBlock;
  aboutTitle?: string;
  aboutBody?: string;
  trustLight?: ShellTrustLight;
  stackSections?: ShellStackSection[];
};
