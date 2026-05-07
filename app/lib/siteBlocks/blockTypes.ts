/**
 * Typed contract for `public.site_page_blocks` (payload JSON per `block_type`).
 * DB columns use snake_case; row shape matches Supabase selects.
 */

export const SITE_BLOCK_LOCALES = ["es", "en", "neutral"] as const;
export type SiteBlockLocale = (typeof SITE_BLOCK_LOCALES)[number];

export const SITE_BLOCK_TYPES = [
  "hero",
  "rich_text",
  "image_text",
  "cta_strip",
  "card_group",
  "announcement",
  "spacer",
] as const;
export type SiteBlockType = (typeof SITE_BLOCK_TYPES)[number];

export type HeroBlockPayload = {
  headlineEs?: string;
  headlineEn?: string;
  subheadlineEs?: string;
  subheadlineEn?: string;
  /** Primary CTA (labels + href localized). */
  primaryCtaLabelEs?: string;
  primaryCtaLabelEn?: string;
  primaryCtaHref?: string;
  secondaryCtaLabelEs?: string;
  secondaryCtaLabelEn?: string;
  secondaryCtaHref?: string;
  /** Hero image URL (site-relative or absolute). */
  imageUrl?: string;
  imageAltEs?: string;
  imageAltEn?: string;
};

export type RichTextBlockPayload = {
  bodyEs?: string;
  bodyEn?: string;
};

export type ImageTextBlockPayload = {
  imageUrl?: string;
  imageAltEs?: string;
  imageAltEn?: string;
  titleEs?: string;
  titleEn?: string;
  bodyEs?: string;
  bodyEn?: string;
  ctaLabelEs?: string;
  ctaLabelEn?: string;
  ctaHref?: string;
};

export type CtaStripBlockPayload = {
  /** Short strip; one or two CTAs. */
  primaryLabelEs?: string;
  primaryLabelEn?: string;
  primaryHref?: string;
  secondaryLabelEs?: string;
  secondaryLabelEn?: string;
  secondaryHref?: string;
};

export type CardGroupCard = {
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CardGroupBlockPayload = {
  sectionTitleEs?: string;
  sectionTitleEn?: string;
  cards?: CardGroupCard[];
};

export type AnnouncementBlockPayload = {
  messageEs?: string;
  messageEn?: string;
  /** Optional dismissible / role hint for a11y (optional strings). */
  variant?: string;
};

export type SpacerBlockPayload = {
  /** Visual gap in rem units (bounded in validation). */
  heightRem?: number;
};

export type SiteBlockPayloadByType = {
  hero: HeroBlockPayload;
  rich_text: RichTextBlockPayload;
  image_text: ImageTextBlockPayload;
  cta_strip: CtaStripBlockPayload;
  card_group: CardGroupBlockPayload;
  announcement: AnnouncementBlockPayload;
  spacer: SpacerBlockPayload;
};

/** Row as returned from `site_page_blocks` (service-role reads). */
export type SitePageBlockRow = {
  id: string;
  page_key: string;
  locale: SiteBlockLocale;
  sort_index: number;
  block_type: SiteBlockType;
  visible: boolean;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Normalized block ready for insert (no DB id; sort_index assigned by replace helper). */
export type NormalizedPageBlockForSave = {
  block_type: SiteBlockType;
  visible: boolean;
  payload: Record<string, unknown>;
};
