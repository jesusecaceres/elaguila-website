/** Bilingual strings edited in admin (ES default locale for Leonix). */
export type BilingualText = { es: string; en: string };

/** `/tienda` marketing shell — merges over `tiendaCopy` + optional imagery. */
export type TiendaStorefrontPayload = {
  hero?: {
    eyebrow?: Partial<BilingualText>;
    headline?: Partial<BilingualText>;
    subhead?: Partial<BilingualText>;
    ctaPrimary?: Partial<BilingualText>;
    ctaSecondary?: Partial<BilingualText>;
    supportingLine?: Partial<BilingualText>;
  };
  categoriesSection?: {
    eyebrow?: Partial<BilingualText>;
    title?: Partial<BilingualText>;
    description?: Partial<BilingualText>;
  };
  featuredSection?: {
    eyebrow?: Partial<BilingualText>;
    title?: Partial<BilingualText>;
    description?: Partial<BilingualText>;
  };
  howItWorks?: {
    eyebrow?: Partial<BilingualText>;
    title?: Partial<BilingualText>;
    description?: Partial<BilingualText>;
    note?: Partial<BilingualText>;
  };
  trust?: {
    eyebrow?: Partial<BilingualText>;
    title?: Partial<BilingualText>;
    items?: { es?: string[]; en?: string[] };
  };
  finalCta?: {
    title?: Partial<BilingualText>;
    body?: Partial<BilingualText>;
    primary?: Partial<BilingualText>;
    secondary?: Partial<BilingualText>;
  };
  /** Override category card cover image (HTTPS URL). Key = category slug. */
  categoryCardCoverUrls?: Record<string, string>;
  /** Optional title/description overrides per category slug. */
  categoryCardCopy?: Record<string, { title?: Partial<BilingualText>; description?: Partial<BilingualText> }>;
  /** Reorder category cards within the primary storefront group (valid slugs only; rest follow code order). */
  homepageCategorySlugs?: string[];
  /** Optional promo band between hero and “Shop by category” on `/tienda`. */
  storefrontPromoStrip?: Partial<BilingualText>;
  /** Optional hero tile / thumb image URLs (HTTPS). Falls back to code assets. */
  heroTileImages?: Partial<
    Record<
      "businessCards" | "bannersSigns" | "printWorkflow" | "thumbFlyers" | "thumbBrochures" | "thumbStickers" | "thumbPromo",
      string
    >
  >;
};

/** Single bilingual row for optional homepage link chips (e.g. clasificados categories). */
export type HomeFeaturedCallout = {
  labelEs: string;
  labelEn: string;
  /** Path or https URL */
  href: string;
};

/** `/home` magazine gateway — merges over inline defaults in `app/home/HomeMarketingClient.tsx`. */
export type HomeMarketingPayload = {
  title?: Partial<BilingualText>;
  identity?: Partial<BilingualText>;
  precedent?: Partial<BilingualText>;
  ctaPrimary?: Partial<BilingualText>;
  ctaSecondary?: Partial<BilingualText>;
  /** Public path e.g. `/home_thumbnail.png` or absolute HTTPS */
  coverImageSrc?: string;
  coverAlt?: Partial<BilingualText>;
  /** Thin strip above the hero (operational or promo line). */
  announcementBar?: Partial<BilingualText>;
  /** Optional strip below primary CTA (secondary promo). */
  promoStrip?: Partial<BilingualText>;
  /** When set, primary CTA uses this href (path or https). Default: magazine with current `lang`. */
  ctaPrimaryHref?: string;
  /** When set, secondary line becomes a link (otherwise plain text under CTA). */
  ctaSecondaryHref?: string;
  /** Visibility for blocks that already exist in the `/home` template (not new section types). */
  modules?: {
    showAnnouncement?: boolean;
    showHeroImage?: boolean;
    showSecondaryLine?: boolean;
    showCallouts?: boolean;
  };
  /** Up to 5 optional link chips (manual URLs — not auto-synced with Clasificados registry). */
  featuredCallouts?: HomeFeaturedCallout[];
  /** Where callout chips render in the hero column. Default: under identity + precedent (current layout). */
  calloutsPlacement?: "below_precedent" | "below_title";
};

/** `/contacto` — merges over static copy; still uses GlobalContactForm behavior. */
export type ContactoPayload = {
  headline?: Partial<BilingualText>;
  subheadline?: Partial<BilingualText>;
  intro?: Partial<BilingualText>;
  hours?: Partial<BilingualText>;
  phone?: string;
  email?: string;
  address?: Partial<BilingualText>;
  mapUrl?: string;
  noticeBanner?: Partial<BilingualText>;
  /** Optional copy for the Tienda card (defaults stay in merge). */
  tiendaCard?: {
    title?: Partial<BilingualText>;
    body?: Partial<BilingualText>;
    cta?: Partial<BilingualText>;
  };
};

/** Sitewide bars — read in root layout; not the `/home` editor. */
export type GlobalSitePayload = {
  sitewideNotice?: Partial<BilingualText>;
  globalPromoStrip?: Partial<BilingualText>;
  toggles?: {
    /** When false, hides the whole banner stack under the nav (both strips), regardless of copy. */
    showSiteWideBanners?: boolean;
    showSitewideNotice?: boolean;
    showGlobalPromoStrip?: boolean;
  };
};

/** `/about` (Nosotros) — merged in `nosotrosMerge`. */
export type NosotrosPayload = {
  heroTitle?: Partial<BilingualText>;
  lead?: Partial<BilingualText>;
  mission?: Partial<BilingualText>;
  vision?: Partial<BilingualText>;
  values?: Partial<BilingualText>;
  /** Hero or inline image URL (https or /path). */
  mediaImageSrc?: string;
  mediaImageAlt?: Partial<BilingualText>;
  ctaPrimary?: Partial<BilingualText>;
  ctaPrimaryHref?: string;
  ctaSecondary?: Partial<BilingualText>;
  ctaSecondaryHref?: string;
};

/** Revista workspace — copy around manifest; featured issue still from editions.json. */
export type RevistaSpotlightPayload = {
  workspaceNoteEs?: string;
  workspaceNoteEn?: string;
  archiveBlurbEs?: string;
  archiveBlurbEn?: string;
};

/** `/noticias` — shell copy only; RSS feed + articles stay code/API. */
export type NoticiasPagePayload = {
  pageTitle?: Partial<BilingualText>;
  subtitle?: Partial<BilingualText>;
  breakingLabel?: Partial<BilingualText>;
};

/** `/iglesias` — placeholder page until a real directory ships. */
export type IglesiasPagePayload = {
  title?: Partial<BilingualText>;
  subtitle?: Partial<BilingualText>;
  note?: Partial<BilingualText>;
  backCta?: Partial<BilingualText>;
};

/** Bilingual coupon row for `/cupones` and `/coupons` (shared payload). */
export type CuponCardPayload = {
  titleEs: string;
  titleEn: string;
  businessEs: string;
  businessEn: string;
  descriptionEs: string;
  descriptionEn: string;
  image: string;
  expiresEs: string;
  expiresEn: string;
};

/** `/cupones` + `/coupons` — headline, intro, optional coupon grid (falls back to code seed). */
export type CuponesPagePayload = {
  pageTitle?: Partial<BilingualText>;
  intro?: Partial<BilingualText>;
  coupons?: CuponCardPayload[];
};

/**
 * Planned magazine issues — optional registry payload for tooling.
 * Public `/magazine` resolves from `magazine_issues` (published + archived) when rows exist; otherwise `public/magazine/editions.json`.
 */
export type RevistaPlannedIssue = {
  id: string;
  titleEs: string;
  titleEn: string;
  year: string;
  monthSlug: string;
  lang: "es" | "en";
  coverUrl: string;
  fileUrl: string;
  publishedAtIso: string;
  status: "draft" | "scheduled" | "live" | "archived";
  internalNotes?: string;
};

export type RevistaIssueRegistryPayload = {
  plannedIssues?: RevistaPlannedIssue[];
};
