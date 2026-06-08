import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import { toBilingualFieldLocale } from "@/app/lib/translation/types";

export type AnuncioListingTranslatable = {
  title: { es: string; en: string };
  blurb: { es: string; en: string };
  detailPairs?: unknown;
};

const DETAIL_LINE_RE = /^(\d+)\t([^\t]*)\t(.*)$/;

const EXCLUDED_DETAIL_LABEL_RE =
  /phone|teléfono|telefono|email|correo|whatsapp|precio|price|url|website|sitio|address|dirección|direccion|mapa|\bmap\b|vin|mileage|millas|leonix\s*ad|bedroom|baño|bath|sq\.?\s*ft|deposit|depósito/i;

function isProseDetailPair(label: string, value: string): boolean {
  const l = label.trim();
  const v = value.trim();
  if (!v) return false;
  if (l.startsWith("Leonix:")) return false;
  if (EXCLUDED_DETAIL_LABEL_RE.test(l)) return false;
  if (/^https?:\/\/|mailto:|tel:|wa\.me/i.test(v)) return false;
  if (/^\+?\d[\d\s().-]{7,}$/.test(v)) return false;
  return true;
}

function encodeDetailPairs(pairs: Array<{ label: string; value: string }>): string | undefined {
  const prose = pairs.filter((p) => isProseDetailPair(p.label, p.value));
  if (!prose.length) return undefined;
  return prose
    .map((p, i) => `${i}\t${p.label.trim()}\t${p.value.trim()}`)
    .join("\n");
}

function decodeDetailPairs(
  encoded: string,
  original: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const byIndex = new Map<number, { label: string; value: string }>();
  for (const line of encoded.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    const match = DETAIL_LINE_RE.exec(trimmed);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 0) continue;
    byIndex.set(index, { label: match[2], value: match[3] });
  }
  return original.map((pair, index) => {
    const translated = byIndex.get(index);
    if (!translated) return pair;
    return {
      label: translated.label.trim() || pair.label,
      value: translated.value.trim() || pair.value,
    };
  });
}

/** User-authored listing prose — contact, price, location, and machine detail keys stay out. */
export function buildAnuncioTranslatableContent(
  listing: AnuncioListingTranslatable,
  siteLocale: Locale,
): TranslatableAdFields {
  const pairs = Array.isArray(listing.detailPairs)
    ? listing.detailPairs.filter(
        (p): p is { label: string; value: string } =>
          typeof p?.label === "string" && typeof p?.value === "string",
      )
    : [];

  const fieldLocale = toBilingualFieldLocale(siteLocale);

  return {
    title: listing.title[fieldLocale]?.trim() || listing.title.es?.trim() || undefined,
    description: listing.blurb[fieldLocale]?.trim() || listing.blurb.es?.trim() || undefined,
    details: encodeDetailPairs(pairs),
  };
}

export function hasAnuncioTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferAnuncioTranslateAd(
  siteLocale: Locale,
  translatableContent: unknown,
): boolean {
  if (!hasAnuncioTranslatableProse(translatableContent)) return false;
  return siteLocale === "es" || siteLocale === "en";
}

export function applyAnuncioTranslation(
  listing: AnuncioListingTranslatable,
  siteLocale: Locale,
  translated: Partial<TranslatableAdFields>,
): AnuncioListingTranslatable {
  let next: AnuncioListingTranslatable = listing;

  if (translated.title?.trim()) {
    const title = translated.title.trim();
    next = {
      ...next,
      title: { es: title, en: title },
    };
  }

  if (translated.description?.trim()) {
    const blurb = translated.description.trim();
    const fieldLocale = toBilingualFieldLocale(siteLocale);
    next = {
      ...next,
      blurb: {
        ...next.blurb,
        [fieldLocale]: blurb,
      },
    };
  }

  if (translated.details?.trim() && Array.isArray(listing.detailPairs)) {
    next = {
      ...next,
      detailPairs: decodeDetailPairs(translated.details, listing.detailPairs),
    };
  }

  return next;
}
