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
  LEONIX_DP_BR_MAP_URL,
  LEONIX_DP_BR_SHOW_EXACT_ADDRESS,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { buildBrLiveGate12dHoaCard, buildBrLiveGate12dOpenHouseCard } from "@/app/clasificados/lib/leonixBrGate12d";
import { formatUsPhoneDisplay, digitsOnly } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { phoneTelHref, stripPhoneDigits } from "@/app/lib/leonix/phoneFormat";
import { formatUsdWhole } from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import { googleMapsSearchUrl } from "@/app/(site)/publicar/community/shared/lib/communityContactCtas";
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

/** F2 fix (mirrors Rentas' F7): tel:/sms:/wa.me all require E.164 (a leading `+1` country code for
 * a bare 10-digit US number) -- bare local digits work by accident on some devices and silently
 * fail on others. */
function telHref(phoneDigits: string): string | null {
  const href = phoneTelHref(phoneDigits);
  return href || null;
}

function smsHref(phoneDigits: string): string | null {
  const d = stripPhoneDigits(phoneDigits);
  return d ? `sms:+1${d}` : null;
}

function waHref(phoneDigits: string): string | null {
  const d = stripPhoneDigits(phoneDigits);
  return d ? `https://wa.me/1${d}` : null;
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

  const showExact = (readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_SHOW_EXACT_ADDRESS) ?? "").toLowerCase() === "true";
  const humanLocation = readLeonixDetailPairValue(detailPairs, "Ubicación") ?? listing.city ?? "";
  const mapsUrlFromPair = readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_MAP_URL);
  const mapsUrl = mapsUrlFromPair ?? (humanLocation ? googleMapsSearchUrl(humanLocation) : null);

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
    addressLine: showExact ? humanLocation : humanLocation,
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
      line1: showExact ? humanLocation : "",
      cityStateZip: humanLocation,
      fullAddress: showExact ? humanLocation : "",
      hasMeaningfulAddress: Boolean(humanLocation || mapsUrl),
    },
    mostrarDireccionExacta: showExact,
    footerNote: "",
    hoaCommunityCard: buildBrLiveGate12dHoaCard(detailPairs, lang),
    openHouseCard: buildBrLiveGate12dOpenHouseCard(detailPairs, lang),
  };
}
