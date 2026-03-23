import type { BusinessRailData } from "@/app/clasificados/components/ListingView";

/** SessionStorage key for the listing draft used by `/clasificados/preview-listing` (and legacy `/preview-listing` redirect). */
export const PREVIEW_LISTING_DRAFT_KEY = "preview-listing-draft";

/** Single normalized draft shape for seller preview. imageUrls = exact upload order (data URLs so they survive navigation). */
export type PreviewListingDraft = {
  backToEditUrl: string;
  lang: "es" | "en";
  category: string;
  title: string;
  description: string;
  isFree: boolean;
  price: string;
  city: string;
  todayLabel: string;
  detailPairs: Array<{ label: string; value: string }>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  /** Ordered media: same order as uploader (cover first). Use data URLs so they survive navigation. */
  imageUrls: string[];
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  isPro: boolean;
  /** Real seller display name when available (e.g. from profile) */
  sellerName?: string | null;
  /** Optional negocio rail — same shape as ListingView when publish flow stores it on the draft JSON. */
  businessRail?: BusinessRailData | null;
  businessRailTier?: "business_standard" | "business_plus" | null;
  /** Publisher id for agent profile CTA / deep links. */
  ownerId?: string | null;
  /** BR only: branch from publish flow. Used to deterministically route premium vs generic preview. */
  branch?: "privado" | "negocio" | null;
  /**
   * When set (e.g. BR negocio "Ver anuncio" handoff), preview page parses this JSON as `ListingData`
   * so the page matches the publish wizard preview (`BienesRaicesPreviewNegocioFresh`).
   * Flat fields above remain for backward compatibility and fallback.
   */
  fullListingDataJson?: string | null;
};

export function getPreviewDraft(): PreviewListingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_LISTING_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreviewListingDraft;
  } catch {
    return null;
  }
}

export function setPreviewDraft(draft: PreviewListingDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PREVIEW_LISTING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}
