import {
  normalizeLocale,
  pickTranslatableAdFields,
} from "@/app/lib/translation/helpers";
import type { ContentLocale, Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { AutoDealerListing, DealerCustomLink, DealerSpecialHoursRow } from "../negocios/types/autoDealerListing";

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

/** Custom-link DISPLAY LABELS only — id and url are identity/destination data, never sent. */
function encodeCustomLinkLabels(links: DealerCustomLink[] | undefined): string | undefined {
  const lines = (links ?? []).map((l) => (l.label ?? "").trim());
  return lines.some(Boolean) ? lines.join("\n") : undefined;
}

/** Malformed/short translation gracefully retains the original label per row — never drops a link. */
function decodeCustomLinkLabels(encoded: string, original: DealerCustomLink[] | undefined): DealerCustomLink[] {
  const base = original ?? [];
  const lines = encoded.split("\n");
  return base.map((link, index) => {
    const next = lines[index]?.trim();
    return next ? { ...link, label: next } : link;
  });
}

const SPECIAL_HOURS_FIELD_SEP = "\t";

/** Special-hours occasion LABEL + resulting NOTE only — never the row order, never a date/time value the label/note text might itself contain a mention of (those stay exactly as the seller typed). */
function encodeSpecialHours(rows: DealerSpecialHoursRow[] | undefined): string | undefined {
  const lines = (rows ?? [])
    .map((r) => `${(r.label ?? "").trim()}${SPECIAL_HOURS_FIELD_SEP}${(r.note ?? "").trim()}`)
    .filter((line) => line !== SPECIAL_HOURS_FIELD_SEP);
  return lines.length ? lines.join("\n") : undefined;
}

/** Malformed/short/reordered translation gracefully retains the original row — never invents or drops a row. */
function decodeSpecialHours(encoded: string, original: DealerSpecialHoursRow[] | undefined): DealerSpecialHoursRow[] {
  const base = original ?? [];
  const lines = encoded.split("\n");
  return base.map((row, index) => {
    const line = lines[index];
    if (!line) return row;
    const sepIdx = line.indexOf(SPECIAL_HOURS_FIELD_SEP);
    if (sepIdx < 0) return row;
    const label = line.slice(0, sepIdx).trim();
    const note = line.slice(sepIdx + 1).trim();
    return { label: label || row.label, note: note || row.note };
  });
}

/**
 * `dealerAddress` is one free-typed field mixing structured identity (street/city/state/zip)
 * with an optional trailing human note the dealer appended themselves (e.g. "— showroom con 18
 * plazas de estacionamiento para clientes."), separated by " — ". Only that note is buyer-facing
 * prose; the address prefix is identity data and must never reach a translation provider. No
 * separator present → nothing to translate (a plain address has no note).
 */
const DEALER_ADDRESS_NOTE_SEP = " — ";

function encodeDealerAddressNote(dealerAddress: string | undefined): string | undefined {
  const addr = dealerAddress?.trim();
  if (!addr) return undefined;
  const idx = addr.indexOf(DEALER_ADDRESS_NOTE_SEP);
  if (idx < 0) return undefined;
  const note = addr.slice(idx + DEALER_ADDRESS_NOTE_SEP.length).trim();
  return note || undefined;
}

/** Keeps the identity prefix byte-for-byte and swaps in the translated note. A missing separator
 * in the original (shouldn't happen — encode already required one) leaves the address untouched. */
function decodeDealerAddressNote(dealerAddress: string | undefined, translatedNote: string): string | undefined {
  const addr = dealerAddress?.trim();
  if (!addr) return dealerAddress;
  const idx = addr.indexOf(DEALER_ADDRESS_NOTE_SEP);
  if (idx < 0) return dealerAddress;
  const prefix = addr.slice(0, idx + DEALER_ADDRESS_NOTE_SEP.length);
  const note = translatedNote.trim();
  return note ? `${prefix}${note}` : dealerAddress;
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
    customServiceText: encodeCustomLinkLabels(listing.dealerCustomLinks),
    shareText: encodeSpecialHours(listing.dealerSpecialHoursRows),
    locationNote: encodeDealerAddressNote(listing.dealerAddress),
  };
}

export function hasAutosTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

/**
 * Owner lock (2026-09-17): source content language and translation offer are independent —
 * a Spanish-authored ad on the Spanish site still offers "Translate to English" (matching
 * Servicios' doctrine, which always offers once there's real prose). `listingLang` no longer
 * gates visibility here; it still drives which direction `TranslateAdControl` actually
 * translates into (see its `knownSourceTargetLocale` logic).
 */
export function shouldOfferAutosTranslateAd(
  siteLocale: Locale,
  _listingLang: ContentLocale,
  translatableContent: unknown,
): boolean {
  if (!hasAutosTranslatableProse(translatableContent)) return false;
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
  if (translated.customServiceText?.trim()) {
    next = {
      ...next,
      dealerCustomLinks: decodeCustomLinkLabels(translated.customServiceText, next.dealerCustomLinks),
    };
  }
  if (translated.shareText?.trim()) {
    next = {
      ...next,
      dealerSpecialHoursRows: decodeSpecialHours(translated.shareText, next.dealerSpecialHoursRows),
    };
  }
  if (translated.locationNote?.trim()) {
    const nextAddress = decodeDealerAddressNote(next.dealerAddress, translated.locationNote);
    if (nextAddress) next = { ...next, dealerAddress: nextAddress };
  }

  return next;
}
