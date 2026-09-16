import {
  normalizeLocale,
  pickTranslatableAdFields,
  shouldOfferTranslateAd,
} from "@/app/lib/translation/helpers";
import type { ContentLocale, Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { AutoDealerListing } from "../negocios/types/autoDealerListing";

export function normalizeAutosListingLang(raw: string | null | undefined): ContentLocale {
  return normalizeLocale(raw) ?? "unknown";
}

function isStructuredVehicleTitle(listing: AutoDealerListing): boolean {
  const title = listing.vehicleTitle?.trim();
  if (!title) return true;
  const parts = [listing.year, listing.make, listing.model].filter(Boolean).map(String);
  if (!parts.length) return false;
  const ymm = parts.join(" ").trim();
  return title.toLowerCase().replace(/\s+/g, " ") === ymm.toLowerCase().replace(/\s+/g, " ");
}

function encodeCustomEquipment(items: string[] | undefined): string | undefined {
  const lines = (items ?? []).map((s) => s.trim()).filter(Boolean);
  return lines.length ? lines.join("\n") : undefined;
}

function decodeCustomEquipment(encoded: string, original: string[] | undefined): string[] {
  const base = original ?? [];
  const lines = encoded.split("\n");
  if (!base.length) return lines.map((l) => l.trim()).filter(Boolean);
  return base.map((item, index) => {
    const next = lines[index]?.trim();
    return next || item;
  });
}

/**
 * Seller prose only — specs, price, VIN, dealer/contact identity (name/phone/email/URL) stay out.
 * `serviceLabel`/`highlights` carry the two free-text finance fields (advisor role/title and
 * finance notes) — both are buyer-visible natural language, inherited by every child from the
 * parent per Gate 21 (dealer-owned data), so translating them here covers parent AND child.
 */
export function buildAutosTranslatableContent(listing: AutoDealerListing): TranslatableAdFields {
  const description = listing.description?.trim();
  const notes = listing.otherEquipmentDetails?.trim();
  const title = isStructuredVehicleTitle(listing) ? undefined : listing.vehicleTitle?.trim();
  const financeTitle = listing.financeContactTitle?.trim();
  const financeNotes = listing.financeNotes?.trim();

  return {
    title,
    description: description || undefined,
    body: notes && notes !== description ? notes : undefined,
    details: encodeCustomEquipment(listing.customEquipment),
    serviceLabel: financeTitle || undefined,
    highlights: financeNotes || undefined,
  };
}

export function hasAutosTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferAutosTranslateAd(
  siteLocale: Locale,
  listingLang: ContentLocale,
  translatableContent: unknown,
): boolean {
  if (!hasAutosTranslatableProse(translatableContent)) return false;
  if (listingLang === "es" || listingLang === "en") {
    return shouldOfferTranslateAd({ siteLocale, originalLocale: listingLang });
  }
  return siteLocale === "es" || siteLocale === "en";
}

export function applyAutosTranslation(
  listing: AutoDealerListing,
  translated: Partial<TranslatableAdFields>,
): AutoDealerListing {
  let next: AutoDealerListing = listing;

  if (translated.title?.trim() && !isStructuredVehicleTitle(listing)) {
    next = { ...next, vehicleTitle: translated.title.trim() };
  }
  if (translated.description?.trim()) {
    next = { ...next, description: translated.description.trim() };
  }
  if (translated.body?.trim()) {
    next = { ...next, otherEquipmentDetails: translated.body.trim() };
  }
  if (translated.details?.trim()) {
    next = {
      ...next,
      customEquipment: decodeCustomEquipment(translated.details, next.customEquipment),
    };
  }
  if (translated.serviceLabel?.trim()) {
    next = { ...next, financeContactTitle: translated.serviceLabel.trim() };
  }
  if (translated.highlights?.trim()) {
    next = { ...next, financeNotes: translated.highlights.trim() };
  }

  return next;
}
