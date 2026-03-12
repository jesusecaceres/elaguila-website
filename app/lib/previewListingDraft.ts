/** SessionStorage key for the listing draft used by /preview-listing */
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
  /** Ordered media: same order as uploader (cover first). Use data URLs so preview survives navigation. */
  imageUrls: string[];
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  isPro: boolean;
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
