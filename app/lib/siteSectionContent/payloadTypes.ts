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
  /** Optional hero tile / thumb image URLs (HTTPS). Falls back to code assets. */
  heroTileImages?: Partial<
    Record<
      "businessCards" | "bannersSigns" | "printWorkflow" | "thumbFlyers" | "thumbBrochures" | "thumbStickers" | "thumbPromo",
      string
    >
  >;
};

/** `/home` magazine gateway — merges over inline defaults in `app/home/page.tsx`. */
export type HomeMarketingPayload = {
  title?: Partial<BilingualText>;
  identity?: Partial<BilingualText>;
  precedent?: Partial<BilingualText>;
  ctaPrimary?: Partial<BilingualText>;
  ctaSecondary?: Partial<BilingualText>;
  /** Public path e.g. `/home_thumbnail.png` or absolute HTTPS */
  coverImageSrc?: string;
  coverAlt?: Partial<BilingualText>;
};

/** `/contacto` — merges over static copy; still uses GlobalContactForm behavior. */
export type ContactoPayload = {
  intro?: Partial<BilingualText>;
  hours?: Partial<BilingualText>;
  phone?: string;
  email?: string;
  address?: Partial<BilingualText>;
  mapUrl?: string;
  noticeBanner?: Partial<BilingualText>;
};

/** Future `/nosotros` page — persisted for when the public route ships. */
export type NosotrosPayload = {
  heroTitle?: Partial<BilingualText>;
  lead?: Partial<BilingualText>;
  mission?: Partial<BilingualText>;
  ctaPrimary?: Partial<BilingualText>;
};

/** Revista workspace — copy around manifest; featured issue still from editions.json. */
export type RevistaSpotlightPayload = {
  workspaceNoteEs?: string;
  workspaceNoteEn?: string;
  archiveBlurbEs?: string;
  archiveBlurbEn?: string;
};
