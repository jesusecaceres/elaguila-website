/**
 * Gate I.5.4A — published Bienes Raíces Privado row → the SAME `BienesRaicesPrivadoPreviewVm`
 * shape `BienesRaicesPrivadoPreviewView.tsx` already renders for preview. Mirrors the proven
 * pattern already shipped for Rentas (`mapRentasListingLiveToPreviewVm.ts`'s
 * `mapRentasListingToPrivadoPreviewVm`, which reuses this exact same VM type) — this file is the
 * Bienes Raíces equivalent of that already-working mapper, not a new pattern.
 *
 * Reuses the same detail_pairs read helpers `BienesRaicesNegocioLiveDetailShell.tsx`'s
 * `buildPublishedState()` already relies on for the Negocio side, so both lanes read published
 * facts through the same underlying contract.
 */
import {
  LEONIX_DP_BR_LISTING_STATUS,
  LEONIX_DP_BR_SHOW_EXACT_ADDRESS,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { formatUsPhoneDisplay, digitsOnly } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { formatUsdWhole } from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import { buildBrPublicLocationForLiveDetail } from "@/app/clasificados/lib/leonixBrGate12d";
import { buildInternationalWhatsAppWaMeHref } from "@/app/lib/whatsapp/internationalWhatsApp";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesLiveListingLike } from "./BienesRaicesNegocioLiveDetailShell";

type Lang = "es" | "en";

const ESTADO_LABEL: Record<string, { es: string; en: string }> = {
  disponible: { es: "Disponible", en: "Available" },
  pendiente: { es: "Pendiente", en: "Pending" },
  bajo_contrato: { es: "Bajo contrato", en: "Under contract" },
  vendido: { es: "Vendido", en: "Sold" },
};

/** Facts already surfaced elsewhere in the VM (seller identity, operation/status/location) — never
 * duplicated in the generic property-facts list. */
const RESERVED_HUMAN_LABELS = new Set(["Operación", "Estado del anuncio", "Ubicación", "Vendedor", "Foto del vendedor"]);

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

/**
 * Every human (non-`Leonix:`) label/value pair, RESERVED labels included.
 *
 * `humanFactRows` below deliberately drops "Ubicación"/"Operación"/… so they are not repeated in
 * the generic property-facts list. `buildBrPublicLocationForLiveDetail` needs exactly those
 * dropped rows — it looks for "Ubicación", "Dirección" and the zona/colonia variants to compose
 * its map query — so it must be fed the unfiltered set. Passing the filtered set would silently
 * blank the location for every legacy row that predates `Leonix:br_gate12d_v1`.
 */
function allHumanPairRows(detailPairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(detailPairs)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const label = trim(o.label);
    const value = trim(o.value);
    if (!label || !value) continue;
    if (label.startsWith("Leonix:")) continue;
    out.push({ label, value });
  }
  return out;
}

function humanFactRows(detailPairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(detailPairs)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const label = trim(o.label);
    const value = trim(o.value);
    if (!label || !value) continue;
    if (label.startsWith("Leonix:")) continue; // machine-only pairs, not human facts
    if (RESERVED_HUMAN_LABELS.has(label)) continue;
    out.push({ label, value });
  }
  return out;
}

function telHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  return d.length >= 10 ? `tel:${d}` : null;
}

function smsHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  return d.length >= 10 ? `sms:${d}` : null;
}

/**
 * Gate BIENES-PRIVADO-1 — the shared international WhatsApp contract, adopted verbatim.
 *
 * The previous implementation stripped to bare digits and appended them to `wa.me/` with no
 * country code, so a 10-digit US number produced `wa.me/5551234567` — a number WhatsApp cannot
 * route. Private sellers are exactly the population most likely to enter a plain local number.
 * `buildInternationalWhatsAppWaMeHref` is the platform-wide rule already used by the other categories
 * (10-digit US prefixing, an 8-digit floor and the 15-digit E.164 ceiling); this lane no longer
 * carries its own copy of it.
 */
function waHref(phoneDigits: string): string | null {
  return buildInternationalWhatsAppWaMeHref(phoneDigits);
}

function mailtoHref(email: string, subject: string): string | null {
  const e = trim(email);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}`;
}

/** Maps a published BR listing row (Privado lane) into the exact VM `BienesRaicesPrivadoPreviewView`
 * already renders for preview — same component, same shape, no duplicate JSX tree. */
export function mapBrListingRowToPrivadoPreviewVm(listing: BienesLiveListingLike, lang: Lang): BienesRaicesPrivadoPreviewVm {
  const detailPairs = listing.detailPairs;
  const contract = parseLeonixListingContract(detailPairs);
  const facets = parseLeonixMachineFacetRead(detailPairs);

  const sellerName = readLeonixDetailPairValue(detailPairs, "Vendedor") ?? "";
  const sellerPhoto = readLeonixDetailPairValue(detailPairs, "Foto del vendedor");

  const phone = trim(listing.contact_phone);
  const email = trim(listing.contact_email);

  const statusRaw = readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_LISTING_STATUS) ?? "disponible";
  const statusLabel = (ESTADO_LABEL[statusRaw] ?? ESTADO_LABEL.disponible)[lang];

  /**
   * Gate BIENES-PRIVADO-1 — address privacy BY CONSTRUCTION.
   *
   * What was here before read the human "Ubicación" pair unconditionally and used it for the
   * hero address line, the city/state/zip line AND the Google Maps query. The opt-in flag was
   * read into `showExact` but the only place it was consulted (`addressLine`) had the SAME
   * expression on both sides of the ternary, so the flag changed nothing. A seller who never
   * opted in still had whatever "Ubicación" contained — an exact street address, in the forms
   * this lane's own publisher can produce — rendered publicly and handed to Google Maps.
   *
   * The repair is not a new guard bolted on top: this mapper now composes its location through
   * `buildBrPublicLocationForLiveDetail`, the SAME shared builder the browse cards and the
   * Negocio live detail already use. That builder reads the opt-in flag itself, composes an
   * APPROXIMATE map query (neighborhood/city/state/zip) when the seller has not opted in,
   * composes the exact one only when they have, and runs the display line through
   * `privacySafeLocation`. So the Privado lane cannot drift from the rest of the category, and
   * there is no path left where an un-opted-in exact address reaches a public field.
   *
   * The dead `mapBrPrivadoListingToPreviewVm`-style module that hardcodes exact-address = true is
   * deliberately NOT revived and NOT deleted (Master §15 duplicate safety) — it is simply not
   * what this live path uses.
   */
  const showExact = (readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_SHOW_EXACT_ADDRESS) ?? "").toLowerCase() === "true";
  const publicLocation = buildBrPublicLocationForLiveDetail({
    detailPairs,
    humanRows: allHumanPairRows(detailPairs),
    listingCity: trim(listing.city ?? ""),
  });
  const humanLocation = publicLocation.display;
  const mapsUrl = publicLocation.mapsHref;
  // Only ever populated when the seller genuinely opted in; every non-opt-in field below falls
  // back to the privacy-safe line, never to the raw pair.
  const exactAddressLine = showExact ? (readLeonixDetailPairValue(detailPairs, "Ubicación") ?? humanLocation) : "";

  const rawPrice = listing.priceLabel[lang] || listing.priceLabel.es || listing.priceLabel.en;
  const priceNum = Number(String(rawPrice).replace(/[^0-9.]/g, ""));

  const quickFacts: BienesRaicesPrivadoPreviewVm["quickFacts"] = [];
  if (facets.bedroomsCount != null) quickFacts.push({ label: lang === "es" ? "Recámaras" : "Bedrooms", value: String(facets.bedroomsCount), icon: "bed" });
  if (facets.bathroomsCount != null) quickFacts.push({ label: lang === "es" ? "Baños" : "Bathrooms", value: String(facets.bathroomsCount), icon: "bath" });
  if (facets.parkingSpots != null && facets.parkingSpots > 0) {
    quickFacts.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: String(facets.parkingSpots), icon: "car" });
  }

  const images = (listing.images ?? []).map(trim).filter(Boolean);
  const photoCount = images.length;

  return {
    categoria: contract.categoriaPropiedad ?? "residencial",
    platformLogoUrl: "/logo.png",
    heroTitle: listing.title[lang] || listing.title.es || listing.title.en,
    addressLine: showExact ? exactAddressLine : humanLocation,
    priceDisplay: Number.isFinite(priceNum) ? formatUsdWhole(String(priceNum)) : rawPrice,
    listingStatusLabel: statusLabel,
    operationSummary: readLeonixDetailPairValue(detailPairs, "Operación") ?? (lang === "es" ? "Venta" : "For sale"),
    quickFacts,
    seller: {
      photoUrl: sellerPhoto,
      hasPhoto: Boolean(sellerPhoto),
      name: sellerName,
      byOwnerLabel: sellerName ? (lang === "es" ? "Propietario" : "Owner") : "",
      phoneDisplay: phone ? formatUsPhoneDisplay(digitsOnly(phone)) : "",
      emailDisplay: email,
      whatsappDisplay: phone ? formatUsPhoneDisplay(digitsOnly(phone)) : "",
      smsDisplay: phone ? formatUsPhoneDisplay(digitsOnly(phone)) : "",
      noteLine: "",
    },
    media: {
      heroUrl: images[0] ?? null,
      secondaryPhotoUrls: [],
      videoThumbUrls: [null, null],
      videoPlaybackUrls: [null, null],
      youtubeIds: [null, null],
      virtualTourUrl: null,
      floorPlanUrls: [],
      sitePlanUrl: null,
      metaLine: photoCount > 0 ? `${photoCount} foto${photoCount === 1 ? "" : "s"} en la galería` : "",
      hasPhotos: photoCount > 0,
      hasVideo1: false,
      hasVideo2: false,
      hasVirtualTour: false,
      hasFloorPlans: false,
      hasSitePlan: false,
      photoCount,
      heroCaption: null,
      allPhotoUrls: images,
      coverPhotoIndex: 0,
      photoCaptionsFull: images.map(() => ""),
    },
    propertyDetailsRows: humanFactRows(detailPairs),
    highlightsRows: [],
    hasHighlights: false,
    description: listing.blurb[lang] || listing.blurb.es || listing.blurb.en,
    hasDescription: Boolean(trim(listing.blurb[lang] || listing.blurb.es || listing.blurb.en)),
    contactRailTitle: lang === "es" ? "Contacto" : "Contact",
    contact: {
      showSolicitarInfo: Boolean(mailtoHref(email, lang === "es" ? "Pregunta sobre tu propiedad (Leonix)" : "Question about your property (Leonix)")),
      showLlamar: Boolean(telHref(phone)),
      showWhatsapp: Boolean(waHref(phone)),
      showSms: Boolean(smsHref(phone)),
      solicitarInfoHref: mailtoHref(email, lang === "es" ? "Pregunta sobre tu propiedad (Leonix)" : "Question about your property (Leonix)"),
      llamarHref: telHref(phone),
      whatsappHref: waHref(phone),
      smsHref: smsHref(phone),
      instructionsLine: "",
      websiteHref: null,
      socialLinks: undefined,
      preferredContactLine: undefined,
    },
    location: {
      mapsUrl,
      line1: showExact ? exactAddressLine : "",
      // Always the privacy-safe composed line — never the raw pair, in either branch.
      cityStateZip: humanLocation,
      fullAddress: showExact ? exactAddressLine : "",
      hasMeaningfulAddress: Boolean(humanLocation || mapsUrl),
    },
    mostrarDireccionExacta: showExact,
    footerNote: "",
    hoaCommunityCard: null,
    openHouseCard: null,
  };
}
