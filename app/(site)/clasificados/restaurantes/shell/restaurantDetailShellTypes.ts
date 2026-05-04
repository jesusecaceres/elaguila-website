/**
 * Leonix Clasificados — Restaurantes desktop detail shell.
 * Types mirror the fields the live application will eventually bind.
 */

export type ShellHoursStatus = "open" | "closed" | "unknown";

export type ShellPrimaryCtaKey =
  | "call"
  | "website"
  | "directions"
  | "whatsapp"
  | "order"
  | "reserve"
  | "menu"
  | "menuAsset"
  | "message"
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
  /** Omitted when the seller named the dish but has not added a photo yet */
  imageUrl?: string;
  /** Optional badge e.g. photo count from community */
  badge?: string;
};

/** Full week grid for “Ver horarios” target section */
export type ShellHoursDetail = {
  rows: { dayLabel: string; line: string }[];
  specialNote?: string;
  temporaryNote?: string;
};

export type ShellHighlightTag = {
  key: string;
  label: string;
};

export type ShellGalleryItem = {
  /** Optional when video tile uses gradient fallback */
  imageUrl?: string;
  /** Inline playable source (e.g. data:video/… or blob URL) */
  videoSrc?: string;
  /** External link (YouTube, Vimeo, etc.) when no file src */
  videoRemoteUrl?: string;
  alt: string;
  /** `general` = mixed main gallery only; not venue interior/comida/exterior buckets */
  category: "interior" | "food" | "exterior" | "video" | "general";
  countOverlay?: number;
};

/** Venue media tabs: interior / comida / exterior / video (non-empty buckets only). */
export type ShellVenueGalleryCategoryKey = "interior" | "food" | "exterior" | "video";

export type ShellVenueGalleryCategory = {
  key: ShellVenueGalleryCategoryKey;
  label: string;
  items: ShellGalleryItem[];
};

/** Grouped listing media + optional general-gallery supplement (smaller role). */
export type ShellVenueGalleryBundle = {
  categories: ShellVenueGalleryCategory[];
  supplemental?: ShellGalleryItem[];
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
  /** Brochure / supporting PDF or image (data URL in session draft) */
  brochureFileHref?: string;
  brochureFileLabel?: string;
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
  businessLogo?: string;
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
  /** In-page anchor for full hours block (e.g. #horarios-detalle) */
  seeHoursHref: string;
  /** When present, shell renders a full week + notes below the fold */
  hoursDetail?: ShellHoursDetail;
  primaryCtas: ShellPrimaryCta[];
  quickInfo?: ShellQuickInfoItem[];
  menuHighlights?: ShellMenuHighlight[];
  fullMenuCta?: { label: string; href: string };
  highlightTags?: ShellHighlightTag[];
  /** Grouped venue gallery (preview default). */
  venueGallery?: ShellVenueGalleryBundle;
  /** Legacy flat gallery (demo / fallback). */
  gallery?: ShellGalleryItem[];
  galleryCta?: { label: string; href: string };
  contact?: ShellContactBlock;
  aboutTitle?: string;
  aboutBody?: string;
  trustLight?: ShellTrustLight;
  stackSections?: ShellStackSection[];
  /** Grouped features for Servicios y Características section */
  groupedFeatures?: import("../lib/restauranteFeaturesNormalization").GroupedFeatures;
};
