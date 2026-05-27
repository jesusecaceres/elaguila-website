import {
  normalizeLocale,
  pickTranslatableAdFields,
  shouldOfferTranslateAd,
} from "@/app/lib/translation/helpers";
import type { ContentLocale, Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";

function encodeLines(items: readonly string[]): string | undefined {
  const lines = items.map((s) => s.trim()).filter(Boolean);
  return lines.length ? lines.join("\n") : undefined;
}

function decodeLines(encoded: string, original: readonly string[]): string[] {
  const lines = encoded.split("\n");
  if (!original.length) return lines.map((l) => l.trim()).filter(Boolean);
  return original.map((item, index) => {
    const next = lines[index]?.trim();
    return next || item;
  });
}

export function normalizeViajesListingLang(raw: string | null | undefined): ContentLocale {
  return normalizeLocale(raw) ?? "unknown";
}

/** User-authored travel prose only — prices, dates, destinations, and contact stay out. */
export function buildViajesTranslatableContent(offer: ViajesOfferDetailModel): TranslatableAdFields {
  return {
    title: offer.title?.trim() || undefined,
    description: offer.description?.trim() || undefined,
    details: encodeLines(offer.includes),
    highlights: encodeLines(offer.whoItsFor),
    body: offer.notes?.trim() || undefined,
    shareText: offer.trustNote?.trim() || undefined,
  };
}

export function hasViajesTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferViajesTranslateAd(
  siteLocale: Locale,
  listingLang: ContentLocale,
  translatableContent: unknown,
): boolean {
  if (!hasViajesTranslatableProse(translatableContent)) return false;
  if (listingLang === "es" || listingLang === "en") {
    return shouldOfferTranslateAd({ siteLocale, originalLocale: listingLang });
  }
  return siteLocale === "es" || siteLocale === "en";
}

export function applyViajesTranslation(
  offer: ViajesOfferDetailModel,
  translated: Partial<TranslatableAdFields>,
): ViajesOfferDetailModel {
  let next: ViajesOfferDetailModel = offer;

  if (translated.title?.trim()) {
    next = { ...next, title: translated.title.trim() };
  }
  if (translated.description?.trim()) {
    next = { ...next, description: translated.description.trim() };
  }
  if (translated.details?.trim()) {
    next = { ...next, includes: decodeLines(translated.details, next.includes) };
  }
  if (translated.highlights?.trim()) {
    next = { ...next, whoItsFor: decodeLines(translated.highlights, next.whoItsFor) };
  }
  if (translated.body?.trim()) {
    next = { ...next, notes: translated.body.trim() };
  }
  if (translated.shareText?.trim()) {
    next = { ...next, trustNote: translated.shareText.trim() };
  }

  return next;
}
