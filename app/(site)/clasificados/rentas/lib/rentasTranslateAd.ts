import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import { toBilingualFieldLocale } from "@/app/lib/translation/types";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

const FLOW_LINE_RE = /^(\d+)\t([^\t]*)\t(.*)$/;
const PROSE_FIELD_RE = /^(lease|requirements|availability|shared|services)\t([\s\S]*)$/;

const EXCLUDED_FLOW_LABEL_RE =
  /phone|teléfono|telefono|email|correo|whatsapp|precio|price|renta|deposit|depósito|url|website|sitio|address|dirección|direccion|mapa|\bmap\b|recámara|bedroom|baño|bath|sq\.?\s*ft|estacionamiento|parking|vin|mileage|leonix\s*ad/i;

function isProseFlowRow(label: string, value: string): boolean {
  const l = label.trim();
  const v = value.trim();
  if (!v) return false;
  if (l.startsWith("Leonix:")) return false;
  if (EXCLUDED_FLOW_LABEL_RE.test(l)) return false;
  if (/^https?:\/\/|mailto:|tel:|wa\.me/i.test(v)) return false;
  if (/^\+?\d[\d\s().-]{7,}$/.test(v)) return false;
  return true;
}

function encodeFlowRows(rows: Array<{ label: string; value: string }>): string | undefined {
  const prose = rows.filter((r) => isProseFlowRow(r.label, r.value));
  if (!prose.length) return undefined;
  return prose.map((r, i) => `${i}\t${r.label.trim()}\t${r.value.trim()}`).join("\n");
}

function decodeFlowRows(
  encoded: string,
  original: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const byIndex = new Map<number, { label: string; value: string }>();
  for (const line of encoded.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    const match = FLOW_LINE_RE.exec(trimmed);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 0) continue;
    byIndex.set(index, { label: match[2], value: match[3] });
  }
  return original.map((row, index) => {
    const translated = byIndex.get(index);
    if (!translated) return row;
    return {
      label: translated.label.trim() || row.label,
      value: translated.value.trim() || row.value,
    };
  });
}

function descriptionForLocale(listing: RentasPublicListing, siteLocale: Locale): string | undefined {
  const fieldLocale = toBilingualFieldLocale(siteLocale);
  const fromBilingual = listing.description?.[fieldLocale]?.trim() || listing.description?.es?.trim();
  return fromBilingual || undefined;
}

function encodeRentasProseBundle(listing: RentasPublicListing): string | undefined {
  const lines: string[] = [];
  if (listing.leaseConditions?.trim()) lines.push(`lease\t${listing.leaseConditions.trim()}`);
  if (listing.requirements?.trim()) lines.push(`requirements\t${listing.requirements.trim()}`);
  if (listing.availabilityNote?.trim()) lines.push(`availability\t${listing.availabilityNote.trim()}`);
  if (listing.sharedSpacePreferences?.trim()) lines.push(`shared\t${listing.sharedSpacePreferences.trim()}`);
  if (listing.servicesIncluded?.trim()) lines.push(`services\t${listing.servicesIncluded.trim()}`);
  return lines.length ? lines.join("\n") : undefined;
}

function applyRentasProseBundle(
  listing: RentasPublicListing,
  encoded: string,
): RentasPublicListing {
  let next = { ...listing };
  for (const line of encoded.split("\n")) {
    const match = PROSE_FIELD_RE.exec(line.trimEnd());
    if (!match) continue;
    const value = match[2].trim();
    if (!value) continue;
    switch (match[1]) {
      case "lease":
        next = { ...next, leaseConditions: value };
        break;
      case "requirements":
        next = { ...next, requirements: value };
        break;
      case "availability":
        next = { ...next, availabilityNote: value };
        break;
      case "shared":
        next = { ...next, sharedSpacePreferences: value };
        break;
      case "services":
        next = { ...next, servicesIncluded: value };
        break;
      default:
        break;
    }
  }
  return next;
}

/** Rental prose only — rent, address, specs, contact, and business identity stay out. */
export function buildRentasTranslatableContent(
  listing: RentasPublicListing,
  siteLocale: Locale,
): TranslatableAdFields {
  const flowRows = Array.isArray(listing.flowExtensionRows)
    ? listing.flowExtensionRows.filter(
        (r): r is { label: string; value: string } =>
          typeof r?.label === "string" && typeof r?.value === "string",
      )
    : [];

  return {
    title: listing.title?.trim() || undefined,
    description: descriptionForLocale(listing, siteLocale),
    body: encodeRentasProseBundle(listing),
    customServiceText: listing.businessDescription?.trim() || undefined,
    details: encodeFlowRows(flowRows),
  };
}

export function hasRentasTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferRentasTranslateAd(siteLocale: Locale, translatableContent: unknown): boolean {
  if (!hasRentasTranslatableProse(translatableContent)) return false;
  return siteLocale === "es" || siteLocale === "en";
}

export function applyRentasTranslation(
  listing: RentasPublicListing,
  siteLocale: Locale,
  translated: Partial<TranslatableAdFields>,
): RentasPublicListing {
  let next: RentasPublicListing = listing;

  if (translated.title?.trim()) {
    next = { ...next, title: translated.title.trim() };
  }

  if (translated.description?.trim()) {
    const text = translated.description.trim();
    next = {
      ...next,
      description: {
        es: siteLocale === "es" ? text : next.description?.es ?? text,
        en: siteLocale === "en" ? text : next.description?.en ?? text,
      },
    };
  }

  if (translated.body?.trim()) {
    next = applyRentasProseBundle(next, translated.body);
  }

  if (translated.customServiceText?.trim()) {
    next = { ...next, businessDescription: translated.customServiceText.trim() };
  }

  if (translated.details?.trim() && Array.isArray(listing.flowExtensionRows)) {
    next = {
      ...next,
      flowExtensionRows: decodeFlowRows(translated.details, listing.flowExtensionRows),
    };
  }

  return next;
}
