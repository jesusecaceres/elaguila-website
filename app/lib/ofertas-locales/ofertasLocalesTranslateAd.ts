import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { TranslatableAdFields } from "@/app/lib/translation/types";
import type { OfertaLocalPublicOfferDetail } from "./ofertasLocalesTypes";

/**
 * Ofertas Locales / Cupones translate-ad adoption (Globalization Build 04, Gate 13).
 *
 * This surface intentionally does NOT reuse the whole `OfertaLocalPublicOfferDetail` object —
 * only the two human-authored, offer-level prose fields actually rendered on the canonical public
 * detail page (`OfertasLocalesPublicDetailView.tsx`): `description` and `membershipNote`.
 *
 * Deliberately excluded, and why:
 *   - `couponText` — a real offer-level prose field, but not rendered on this canonical detail
 *     page today (only in the separate search-results drawer preview), so it is out of scope for
 *     "wire only the safe public detail surface."
 *   - Every item-level field (`itemName`, `normalizedItemName`, `priceText`, `priceAmount`,
 *     `category`, `subcategory`, `searchTags`, `sourceBbox`, `item.digitalCouponNote`, etc.) is
 *     AI/OCR-extracted from a scanned flyer image, not owner-typed prose. `itemName` in particular
 *     drives search matching (`normalizedItemName`) and the clickable image-overlay hit target —
 *     translating it would desync the displayed name from both the flyer crop it comes from and
 *     the search index built on the original text. None of this is ever built into
 *     `translatableContent` here, and no item-level component in this category should ever import
 *     TranslateAdControl for its own item cards.
 */
export function buildOfertasLocalesTranslatableContent(
  offer: OfertaLocalPublicOfferDetail,
): TranslatableAdFields {
  return {
    description: offer.description?.trim() || undefined,
    highlights: offer.membershipNote?.trim() || undefined,
  };
}

export function hasOfertasLocalesTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function applyOfertasLocalesTranslation<T extends OfertaLocalPublicOfferDetail>(
  offer: T,
  translated: Partial<TranslatableAdFields>,
): T {
  let next: T = offer;

  if (translated.description?.trim()) {
    next = { ...next, description: translated.description.trim() };
  }
  if (translated.highlights?.trim()) {
    next = { ...next, membershipNote: translated.highlights.trim() };
  }

  return next;
}

/** Client-only: POST masked fields to the server translate route (no API keys). */
export { requestAdTranslation as requestOfertasLocalesAdTranslation } from "@/app/lib/translation/requestAdTranslation";
