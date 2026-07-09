/**
 * Maps published `RentasPublicListing` + detail extras into the same preview VMs
 * consumed by `BienesRaicesPrivadoPreviewView` / `BienesRaicesNegocioPreviewView`.
 */

import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewFact,
  BienesRaicesPreviewMediaVm,
  BienesRaicesPreviewQuickFactVm,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import {
  digitsOnly,
  formatUsPhoneDisplay,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { parseNegocioRedesSocialLinks } from "@/app/clasificados/rentas/listing/utils/negocioRedesSocialLinks";
import type { RentasListingDetailExtra } from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import {
  filterRentasPhotoUrlList,
  rentasPublishedVideoShouldAppearInGallery,
} from "@/app/clasificados/rentas/lib/rentasListingPublishedMediaGuards";
import { rentasLeadSmsBody } from "@/app/clasificados/rentas/shared/rentasLeadContactCopy";
import { filterRentasLivePropertyRowsForFlow } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { buildRentasShowingPreviewCard } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";
import { formatRentasTipoDeRentaDisplay, rentasRentalFlowGroupForTipo } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import {
  formatLeonixPreferredContactLine,
  socialLinksFromChannelsPayload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function resolvePlatformLogoUrl(): string {
  if (typeof process === "undefined") return "/logo.png";
  const raw = String(process.env.NEXT_PUBLIC_LEONIX_BRAND_LOGO_URL ?? "").trim();
  return raw || "/logo.png";
}

function parseYoutubeId(u: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/.exec(u);
  return m?.[1] ?? null;
}

function digitsOnly15(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

function telHrefFromDigits(d: string): string | null {
  const x = digitsOnly15(d);
  if (x.length < 10) return null;
  return `tel:${x}`;
}

function smsHrefFromDigits(d: string, lang: "es" | "en"): string | null {
  const x = digitsOnly15(d);
  if (x.length < 10) return null;
  return `sms:${x}?&body=${encodeURIComponent(rentasLeadSmsBody(lang))}`;
}

function waHrefFromDigits(d: string, lang: "es" | "en"): string | null {
  const x = digitsOnly15(d);
  if (x.length < 10) return null;
  return `https://wa.me/${x}?text=${encodeURIComponent(rentasLeadSmsBody(lang))}`;
}

function phoneDisplay(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const d = digitsOnly(t);
  return d.length >= 10 ? formatUsPhoneDisplay(d) : t;
}

function formatLeaseCode(code: string | null | undefined, lang: "es" | "en"): string {
  const c = (code ?? "").trim();
  if (!c) return "";
  const labels: Record<string, { es: string; en: string }> = {
    "mes-a-mes": { es: "Mes a mes", en: "Month-to-month" },
    "6-meses": { es: "6 meses", en: "6 months" },
    "12-meses": { es: "12 meses", en: "12 months" },
    "1-ano": { es: "1 año", en: "1 year" },
    "2-anos": { es: "2 años", en: "2 years" },
  };
  return labels[c]?.[lang] ?? c;
}

function rentasAvailabilityLabel(
  code: RentasPublicListing["rentasListingAvailability"],
  lang: "es" | "en",
): string {
  const c = (code ?? "").trim().toLowerCase();
  const m: Record<string, { es: string; en: string }> = {
    disponible: { es: "Disponible", en: "Available" },
    pendiente: { es: "Pendiente / próximamente", en: "Pending / coming soon" },
    bajo_contrato: { es: "Bajo contrato", en: "Under lease" },
    rentado: { es: "Rentado / no disponible", en: "Rented / off market" },
  };
  return m[c]?.[lang] ?? "";
}

function operationSummary(cat: RentasPublicListing["categoriaPropiedad"]): string {
  if (cat === "residencial") return "Renta residencial";
  if (cat === "comercial") return "Renta comercial";
  return "Renta terreno / lote";
}

function kindLabel(kind: RentasPublicListing["resultsPropertyKind"], lang: "es" | "en"): string {
  if (!kind) return "";
  const m: Record<string, { es: string; en: string }> = {
    casa: { es: "Casa", en: "House" },
    departamento: { es: "Departamento", en: "Apartment" },
    terreno: { es: "Terreno", en: "Land" },
    comercial: { es: "Comercial", en: "Commercial" },
  };
  return m[kind]?.[lang] ?? kind;
}

function pushRow(rows: BienesRaicesPreviewFact[], label: string, value: string): void {
  const v = trim(value);
  if (!v || v === "—") return;
  rows.push({ label, value: v });
}

function depositDisplay(listing: RentasPublicListing, lang: "es" | "en"): string {
  if (typeof listing.depositUsd !== "number" || listing.depositUsd <= 0) return "";
  return new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(listing.depositUsd);
}

function buildLiveMediaVm(
  gallery: string[],
  videoUrl: string | null | undefined,
  videoPosterUrl?: string | null | undefined,
  videoUrls?: readonly string[] | null,
  lang: "es" | "en" = "es",
): BienesRaicesPreviewMediaVm {
  const urls = filterRentasPhotoUrlList(gallery.map((u) => trim(u)).filter(Boolean));
  const n = urls.length;
  const pi = n === 0 ? 0 : 0;
  const heroUrl = n > 0 ? urls[pi]! : null;
  const allVideos = Array.from(new Set([...(videoUrls ?? []), videoUrl ?? ""].map((u) => trim(u)).filter((u) => /^https?:\/\//i.test(u)))).slice(0, 4);
  const v = allVideos[0] ?? "";
  const exposeVideo = rentasPublishedVideoShouldAppearInGallery(v);
  const yt = exposeVideo ? parseYoutubeId(v) : null;
  const isMuxHls = exposeVideo && /\.m3u8(\?|$)/i.test(v);
  const v1 = allVideos[1] ?? "";
  const exposeVideo1 = rentasPublishedVideoShouldAppearInGallery(v1);
  const yt1 = exposeVideo1 ? parseYoutubeId(v1) : null;
  const poster = trim(videoPosterUrl ?? "");
  const hasVid = exposeVideo;
  const hasVid1 = exposeVideo1;
  const thumb0 = yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : isMuxHls && poster ? poster : null;
  const thumb1 = yt1 ? `https://img.youtube.com/vi/${yt1}/hqdefault.jpg` : null;
  const playback0 = exposeVideo ? v : null;
  const metaLine = n > 0 ? `${n} foto${n === 1 ? "" : "s"} en la galería` : allVideos.length ? `${allVideos.length} video${allVideos.length === 1 ? "" : "s"} en el anuncio` : "";

  return {
    heroUrl,
    secondaryPhotoUrls: [],
    videoThumbUrls: [thumb0, thumb1],
    videoPlaybackUrls: [yt ? null : playback0, yt1 ? null : hasVid1 ? v1 : null],
    youtubeIds: [yt, yt1],
    externalVideoLinks: allVideos.map((href, index) => ({
      href,
      label:
        index === 0
          ? lang === "es"
            ? "Ver video"
            : "View video"
          : lang === "es"
            ? `Ver video ${index + 1}`
            : `View video ${index + 1}`,
    })),
    virtualTourUrl: null,
    floorPlanUrls: [],
    sitePlanUrl: null,
    metaLine,
    hasPhotos: n > 0,
    hasVideo1: hasVid,
    hasVideo2: hasVid1,
    hasVirtualTour: false,
    hasFloorPlans: false,
    hasSitePlan: false,
    photoCount: n,
    heroCaption: null,
    allPhotoUrls: urls,
    coverPhotoIndex: pi,
    photoCaptionsFull: urls.map(() => ""),
  };
}

function zonaFromListing(listing: RentasPublicListing): string {
  const br = trim(listing.resultBrowseLocation);
  const parts = br.split("·").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1]!;
  return "";
}

function cityStateZipLine(listing: RentasPublicListing): string {
  const city = trim(listing.city);
  const st = trim(listing.stateRegion);
  const zip = trim(listing.postalCode);
  const a = [city, st].filter(Boolean).join(", ");
  if (a && zip) return `${a} ${zip}`;
  return a || zip;
}

function buildContractRows(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  pushRow(rows, "Renta mensual", trim(listing.rentDisplay));
  const tipo = formatRentasTipoDeRentaDisplay(listing.rentalTypeCode ?? "", listing.rentalTypeCustom ?? "");
  if (tipo) pushRow(rows, "Tipo de renta", tipo);
  const dep = depositDisplay(listing, lang);
  if (dep) rows.push({ label: "Depósito", value: dep });
  const pl = formatLeaseCode(listing.leaseTermCode, lang);
  if (pl) rows.push({ label: "Plazo del contrato", value: pl });
  const disp = trim(listing.availabilityNote);
  if (disp) rows.push({ label: "Disponibilidad", value: disp });
  const g = rentasRentalFlowGroupForTipo(listing.rentalTypeCode ?? "");
  const showFurnPets = g === "unset" || g === "full_housing" || g === "room_shared" || g === "commercial_space";
  if (showFurnPets) {
    if (listing.amueblado === true) rows.push({ label: "Amueblado", value: lang === "es" ? "Amueblado" : "Furnished" });
    if (listing.amueblado === false) rows.push({ label: "Amueblado", value: lang === "es" ? "Sin amueblar" : "Unfurnished" });
    if (listing.mascotasPermitidas === true) rows.push({ label: "Mascotas", value: lang === "es" ? "Permitidas" : "Allowed" });
    if (listing.mascotasPermitidas === false) rows.push({ label: "Mascotas", value: lang === "es" ? "No permitidas" : "Not allowed" });
  }
  const svc = trim(listing.servicesIncluded);
  if (svc) rows.push({ label: "Servicios incluidos", value: svc });
  const req = trim(listing.requirements);
  if (req) rows.push({ label: "Requisitos", value: req });
  const sprefs = trim(listing.sharedSpacePreferences);
  if (sprefs) {
    rows.push({
      label: lang === "es" ? "Preferencias del espacio compartido" : "Shared-space preferences",
      value: sprefs,
    });
  }
  const lc = trim(listing.leaseConditions);
  if (lc) rows.push({ label: "Condiciones importantes", value: lc });
  const zona = zonaFromListing(listing);
  if (zona) rows.push({ label: "Zona o vecindario", value: zona });
  const st = rentasAvailabilityLabel(listing.rentasListingAvailability, lang);
  if (st) rows.push({ label: "Estado del anuncio", value: st });
  return rows;
}

function buildResidencialPropertyRows(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const k = kindLabel(listing.resultsPropertyKind, lang);
  if (k) pushRow(rows, "Tipo", k);
  if (listing.propertySubtype) pushRow(rows, "Subtipo", listing.propertySubtype);
  pushRow(rows, "Recámaras", listing.beds);
  const baths = trim(listing.fullBaths) || trim(listing.baths);
  pushRow(rows, "Baños completos", baths);
  if (listing.halfBaths?.trim()) pushRow(rows, "Medios baños", listing.halfBaths);
  else if (typeof listing.halfBathsCount === "number" && listing.halfBathsCount > 0) {
    rows.push({ label: "Medios baños", value: String(listing.halfBathsCount) });
  }
  pushRow(rows, "Interior (ft²)", listing.sqft);
  if (listing.lotSqft?.trim()) pushRow(rows, "Lote (ft²)", listing.lotSqft!);
  if (listing.parking?.trim()) pushRow(rows, "Estacionamiento", listing.parking!);
  else if (typeof listing.parkingSpots === "number" && listing.parkingSpots > 0) {
    rows.push({ label: "Estacionamiento", value: String(listing.parkingSpots) });
  }
  if (listing.yearBuilt?.trim()) {
    rows.push({ label: "Año de construcción", value: listing.yearBuilt.replace(/,/g, "").trim() });
  }
  if (listing.condition?.trim()) pushRow(rows, "Condición", listing.condition!);
  if (listing.pool === true) pushRow(rows, "Alberca / piscina", lang === "es" ? "Sí" : "Yes");
  return rows;
}

function buildNonResidencialRows(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  const k = kindLabel(listing.resultsPropertyKind, lang);
  if (k) pushRow(rows, "Tipo", k);
  if (listing.propertySubtype) pushRow(rows, "Subtipo", listing.propertySubtype);
  pushRow(rows, "Interior (ft²)", listing.sqft);
  if (listing.lotSqft?.trim()) pushRow(rows, "Lote (ft²)", listing.lotSqft!);
  if (listing.parking?.trim()) pushRow(rows, "Estacionamiento", listing.parking!);
  else if (typeof listing.parkingSpots === "number" && listing.parkingSpots > 0) {
    rows.push({ label: "Estacionamiento", value: String(listing.parkingSpots) });
  }
  if (listing.yearBuilt?.trim()) {
    rows.push({ label: "Año de construcción", value: listing.yearBuilt.replace(/,/g, "").trim() });
  }
  if (listing.condition?.trim()) pushRow(rows, "Condición", listing.condition!);
  return rows;
}

function buildPropertyRows(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewFact[] {
  const base =
    listing.categoriaPropiedad === "residencial" ? buildResidencialPropertyRows(listing, lang) : buildNonResidencialRows(listing, lang);
  const filtered = filterRentasLivePropertyRowsForFlow(listing, base);
  const ext = listing.flowExtensionRows ?? [];
  return [...filtered, ...ext];
}

function buildRentasLiveShowingCard(
  listing: RentasPublicListing,
  lang: "es" | "en",
): { title: string; rows: BienesRaicesPreviewFact[]; virtualTourUrl: string | null } | null {
  return buildRentasShowingPreviewCard(
    {
      showingByAppointment: listing.showingByAppointment === true,
      showingAvailability: listing.showingAvailability ?? "",
      showingInstructions: listing.showingInstructions ?? "",
      virtualTourUrl: listing.virtualTourUrl ?? "",
    },
    lang,
  );
}

function rentasLiveLocationLines(listing: RentasPublicListing): {
  line1: string;
  cityStateZip: string;
  addressLine: string;
  exact: boolean;
} {
  const exact = listing.showExactAddress === true;
  const cityZip = cityStateZipLine(listing);
  const zona = zonaFromListing(listing);
  const crossOrPublic = trim(listing.addressLine);
  const approxBrowse = trim(listing.resultBrowseLocation) || [cityZip, zona].filter(Boolean).join(" · ");
  const line1 = exact ? crossOrPublic : zona || trim(listing.city) || approxBrowse;
  const addressLine = exact ? [crossOrPublic, cityZip].filter(Boolean).join(", ") : [cityZip, zona].filter(Boolean).join(" · ") || approxBrowse;
  return { line1, cityStateZip: cityZip, addressLine, exact };
}

function highlightsRowsFromListing(listing: RentasPublicListing): BienesRaicesPreviewFact[] {
  const map = new Map(BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.key.toLowerCase(), d.label] as const));
  const out: BienesRaicesPreviewFact[] = [];
  for (const raw of listing.highlightSlugs ?? []) {
    const kk = String(raw ?? "").trim().toLowerCase();
    if (!kk) continue;
    const label = map.get(kk) ?? kk;
    out.push({ label, value: "Sí" });
  }
  return out;
}

function dedupeQuickFacts(items: BienesRaicesPreviewQuickFactVm[]): BienesRaicesPreviewQuickFactVm[] {
  const seen = new Set<string>();
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  for (const x of items) {
    if (seen.has(x.label)) continue;
    seen.add(x.label);
    out.push(x);
  }
  return out;
}

function contractQuickStrip(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const rent = trim(listing.rentDisplay);
  if (rent) out.push({ label: "Renta mensual", value: rent, icon: "calendar" });
  const dep = depositDisplay(listing, lang);
  if (dep) out.push({ label: "Depósito", value: dep, icon: "pin" });
  const pl = formatLeaseCode(listing.leaseTermCode, lang);
  if (pl) out.push({ label: "Plazo", value: pl, icon: "calendar" });
  const disp = trim(listing.availabilityNote);
  if (disp) out.push({ label: "Disponibilidad", value: disp, icon: "calendar" });
  const g = rentasRentalFlowGroupForTipo(listing.rentalTypeCode ?? "");
  const showFurn = g === "unset" || g === "full_housing" || g === "room_shared" || g === "commercial_space";
  if (showFurn) {
    if (listing.amueblado === true) out.push({ label: "Amueblado", value: lang === "es" ? "Sí" : "Yes", icon: "home" });
    if (listing.amueblado === false) out.push({ label: "Amueblado", value: lang === "es" ? "No" : "No", icon: "home" });
  }
  return out;
}

function buildMailto(to: string, subject: string, body?: string): string | null {
  const e = trim(to);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  const b = trim(body ?? "");
  if (b) {
    return `mailto:${e}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(b)}`;
  }
  return `mailto:${e}?subject=${encodeURIComponent(subject)}`;
}

function hrefFromUserInput(t: string): string | null {
  const s = trim(t);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return null;
}

function mergeRentasLiveSocialIdentityLinks(
  channelRows: Array<{ label: string; href: string }>,
  legacy: Array<{ label: string; href: string }>,
): Array<{ label: string; href: string }> {
  const seen = new Set<string>();
  const out: Array<{ label: string; href: string }> = [];
  for (const row of [...channelRows, ...legacy]) {
    const h = String(row.href ?? "")
      .trim()
      .toLowerCase();
    if (!h || seen.has(h)) continue;
    seen.add(h);
    out.push({ label: row.label, href: String(row.href).trim() });
  }
  return out;
}

export function mapRentasListingToPrivadoPreviewVm(
  listing: RentasPublicListing,
  extra: RentasListingDetailExtra,
  lang: "es" | "en",
): BienesRaicesPrivadoPreviewVm {
  const gallery = extra.gallery.length ? extra.gallery : [listing.imageUrl].filter(Boolean);
  const media = buildLiveMediaVm(gallery, listing.videoUrl, listing.videoPosterUrl, listing.videoUrls, lang);
  const contract = buildContractRows(listing, lang);
  const property = buildPropertyRows(listing, lang);
  const highlightsRows = highlightsRowsFromListing(listing).map((r) => ({ ...r, value: trim(r.value) === "✓" ? "Sí" : r.value }));
  const quickFacts = dedupeQuickFacts([...contractQuickStrip(listing, lang), ...stripQuickFromProperty(listing, lang)]);

  const phoneRaw = trim(extra.contactPhone);
  const smsDigits = trim(extra.contactSmsDigits ?? listing.contactSmsDigits ?? "");
  const waDigits = trim(extra.contactWhatsappDigits ?? listing.contactWhatsappDigits ?? "");
  const waSource = waDigits || digitsOnly(phoneRaw);
  const telHref = phoneRaw ? telHrefFromDigits(phoneRaw) : null;
  const smsHref = smsDigits ? smsHrefFromDigits(smsDigits, lang) : smsHrefFromDigits(phoneRaw, lang);
  const waHref = waSource ? waHrefFromDigits(waSource, lang) : null;
  const mailto = buildMailto(
    trim(extra.contactEmail ?? listing.contactEmail ?? ""),
    lang === "es" ? "Pregunta sobre tu renta (Leonix)" : "Question about your rental (Leonix)",
    rentasLeadSmsBody(lang),
  );

  const ch = listing.contactChannels ?? null;
  const gateSocial = socialLinksFromChannelsPayload(ch);
  const websiteHref = ch?.website?.trim() ? ch.website : null;
  const instructionsLine = [trim(listing.contactNote ?? ""), ch?.instructions?.trim()].filter(Boolean).join("\n\n");
  const preferredContactLine = formatLeonixPreferredContactLine(ch, lang);

  const sellerName = lang === "en" ? extra.sellerDisplayEn : extra.sellerDisplayEs;
  const desc = lang === "en" ? extra.descriptionEn : extra.descriptionEs;
  const loc = rentasLiveLocationLines(listing);
  const mapsQuery = loc.exact ? loc.addressLine : loc.cityStateZip;
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : safeRentasMapUrl(listing.mapUrl);
  const showingCard = buildRentasLiveShowingCard(listing, lang);
  const tourUrl = normalizeLeonixHttpsUrl(listing.virtualTourUrl);

  return {
    categoria: listing.categoriaPropiedad,
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle: trim(listing.title),
    addressLine: loc.addressLine,
    priceDisplay: trim(listing.rentDisplay),
    listingStatusLabel: rentasAvailabilityLabel(listing.rentasListingAvailability, lang) || "—",
    operationSummary: operationSummary(listing.categoriaPropiedad),
    quickFacts,
    seller: {
      photoUrl: null,
      hasPhoto: false,
      name: sellerName,
      byOwnerLabel: lang === "es" ? "Anunciante" : "Advertiser",
      phoneDisplay: phoneRaw ? phoneDisplay(phoneRaw) : "",
      emailDisplay: trim(extra.contactEmail ?? ""),
      whatsappDisplay: waSource ? phoneDisplay(waSource) : "",
      smsDisplay: smsDigits ? phoneDisplay(smsDigits) : phoneRaw ? phoneDisplay(phoneRaw) : "",
      noteLine: trim(listing.contactNote ?? ""),
    },
    media: {
      ...media,
      virtualTourUrl: tourUrl ?? media.virtualTourUrl,
      hasVirtualTour: Boolean(tourUrl ?? media.hasVirtualTour),
    },
    propertyDetailsRows: [...contract, ...property],
    highlightsRows,
    hasHighlights: highlightsRows.length > 0,
    highlightsSectionTitle: lang === "es" ? "Destacados" : "Highlights",
    description: desc,
    hasDescription: Boolean(trim(desc)),
    contactRailTitle: lang === "es" ? "Contacto" : "Contact",
    contact: {
      showSolicitarInfo: Boolean(mailto),
      showLlamar: Boolean(telHref && ch?.allowCall !== false),
      showWhatsapp: Boolean(waHref && ch?.whatsappEnabled !== false),
      showSms: Boolean(smsHref && ch?.allowSms !== false),
      solicitarInfoHref: mailto,
      llamarHref: telHref,
      whatsappHref: waHref,
      smsHref,
      instructionsLine,
      websiteHref,
      socialLinks: gateSocial.length ? gateSocial : undefined,
      preferredContactLine: preferredContactLine || undefined,
    },
    location: {
      mapsUrl,
      line1: loc.line1,
      cityStateZip: loc.cityStateZip,
      fullAddress: loc.exact ? loc.addressLine : loc.line1,
      hasMeaningfulAddress: Boolean(loc.line1 || loc.cityStateZip || mapsUrl),
    },
    mostrarDireccionExacta: loc.exact,
    openHouseCard: showingCard ? { title: showingCard.title, rows: showingCard.rows } : null,
    footerNote: "",
  };
}

function safeRentasMapUrl(raw: string | null | undefined): string | null {
  const u = trim(raw ?? "");
  if (!u || !/^https?:\/\//i.test(u)) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

/** Quick facts from property for strip (beds/baths/sqft) when present */
function stripQuickFromProperty(listing: RentasPublicListing, lang: "es" | "en"): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  if (listing.categoriaPropiedad !== "residencial") return out;
  const g = rentasRentalFlowGroupForTipo(listing.rentalTypeCode ?? "");
  if (g === "storage_parking" || g === "room_shared") {
    const sq = trim(listing.sqft);
    if (sq && sq !== "—") out.push({ label: lang === "es" ? "Interior" : "Interior", value: sq, icon: "ruler" });
    return out;
  }
  const beds = trim(listing.beds);
  if (beds && beds !== "—") out.push({ label: lang === "es" ? "Recámaras" : "Beds", value: beds, icon: "bed" });
  const bt = trim(listing.fullBaths) || trim(listing.baths);
  if (bt && bt !== "—") out.push({ label: lang === "es" ? "Baños" : "Baths", value: bt, icon: "bath" });
  const sq = trim(listing.sqft);
  if (sq && sq !== "—") out.push({ label: lang === "es" ? "Interior" : "Interior", value: sq, icon: "ruler" });
  return out;
}

export function mapRentasListingToNegocioPreviewVm(
  listing: RentasPublicListing,
  extra: RentasListingDetailExtra,
  lang: "es" | "en",
): BienesRaicesNegocioPreviewVm {
  const gallery = extra.gallery.length ? extra.gallery : [listing.imageUrl].filter(Boolean);
  const media = buildLiveMediaVm(gallery, listing.videoUrl, listing.videoPosterUrl, listing.videoUrls, lang);
  const contract = buildContractRows(listing, lang);
  const property = buildPropertyRows(listing, lang);
  const highlightsRows = highlightsRowsFromListing(listing).map((r) => ({ ...r, value: "Sí" }));
  const quickFacts = dedupeQuickFacts([...contractQuickStrip(listing, lang), ...stripQuickFromProperty(listing, lang)]);

  const phoneRaw = trim(extra.contactPhone);
  const smsDigits = trim(extra.contactSmsDigits ?? listing.contactSmsDigits ?? "");
  const waDigits = trim(extra.contactWhatsappDigits ?? listing.contactWhatsappDigits ?? "");
  const waSource = waDigits || digitsOnly(phoneRaw);
  const email = trim(extra.contactEmail ?? listing.contactEmail ?? "");
  const telHref = phoneRaw ? telHrefFromDigits(phoneRaw) : null;
  const smsHref = smsDigits ? smsHrefFromDigits(smsDigits, lang) : smsHrefFromDigits(phoneRaw, lang);
  const waHref = waSource ? waHrefFromDigits(waSource, lang) : null;
  const mailto = buildMailto(
    email,
    lang === "es" ? "Consulta sobre renta publicada (Leonix)" : "Inquiry about published rental (Leonix)",
    rentasLeadSmsBody(lang),
  );

  const sellerLine = lang === "en" ? extra.sellerDisplayEn : extra.sellerDisplayEs;
  const agent = trim(listing.businessAgentName ?? "");
  const marca = trim(listing.businessMarca ?? "");
  const displayName = agent || sellerLine;
  const desc = lang === "en" ? extra.descriptionEn : extra.descriptionEs;
  const loc = rentasLiveLocationLines(listing);
  const colonia = zonaFromListing(listing);
  const mapsQuery = loc.exact ? loc.addressLine : loc.cityStateZip;
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : safeRentasMapUrl(listing.mapUrl);
  const showingCard = buildRentasLiveShowingCard(listing, lang);
  const tourUrl = normalizeLeonixHttpsUrl(listing.virtualTourUrl);
  const ch = listing.contactChannels ?? null;
  const gateSocialIcons = socialLinksFromChannelsPayload(ch);
  const channelRowsForIdentity = gateSocialIcons.map((sl) => ({
    label:
      sl.kind === "instagram"
        ? "Instagram"
        : sl.kind === "facebook"
          ? "Facebook"
          : sl.kind === "youtube"
            ? "YouTube"
            : "TikTok",
    href: sl.href,
  }));
  const redesParsed =
    parseNegocioRedesSocialLinks(listing.businessSocial)?.map((l) => ({ label: l.label, href: l.url })) ?? [];
  const socialLinks = mergeRentasLiveSocialIdentityLinks(channelRowsForIdentity, redesParsed);
  const webFromLegacy = hrefFromUserInput(trim(listing.businessWebsite ?? ""));
  const web = (ch?.website ?? "").trim() || webFromLegacy;

  return {
    publicationType: "",
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle: trim(listing.title),
    addressLine: loc.addressLine,
    priceDisplay: trim(listing.rentDisplay),
    listingStatusLabel: rentasAvailabilityLabel(listing.rentasListingAvailability, lang) || "—",
    operationSummary: operationSummary(listing.categoriaPropiedad),
    quickFacts,
    contactRailTitle: lang === "es" ? "Contacto" : "Contact",
    identity: {
      photoUrl: null,
      name: displayName,
      role: lang === "es" ? "Asesor / contacto" : "Agent / contact",
      brokerageName: marca || sellerLine,
      brokerageLogoUrl: null,
      showBrokerageBlock: true,
      verifiedLine: "",
      licenseLine: trim(listing.businessLicense ?? ""),
      bioLine: trim(listing.businessDescription ?? ""),
      socialLinks,
      profileCtaLabel: lang === "es" ? "Sitio web" : "Website",
      profileHref: web,
      profileCtaEnabled: Boolean(web),
      contactPhone: phoneRaw ? phoneDisplay(phoneRaw) : "",
      contactEmail: email,
      hasPhoto: false,
      hasSocialLinks: socialLinks.length > 0,
    },
    media: {
      ...media,
      virtualTourUrl: tourUrl ?? media.virtualTourUrl,
      hasVirtualTour: Boolean(tourUrl ?? media.hasVirtualTour),
    },
    propertyDetailsRows: [...contract, ...property],
    highlightsRows,
    description: desc,
    hasDescription: Boolean(trim(desc)),
    hasHighlights: highlightsRows.length > 0,
    highlightsSectionTitle: lang === "es" ? "Destacados" : "Highlights",
    openHouseCard: showingCard ? { title: showingCard.title, rows: showingCard.rows } : null,
    contact: {
      showSolicitarInfo: Boolean(mailto),
      showProgramarVisita: false,
      showLlamar: Boolean(telHref && ch?.allowCall !== false),
      showWhatsapp: Boolean(waHref && ch?.whatsappEnabled !== false),
      showSms: Boolean(smsHref && ch?.allowSms !== false),
      solicitarInfoHref: mailto,
      programarVisitaHref: null,
      llamarHref: telHref,
      whatsappHref: waHref,
      smsHref,
      instructionsLine: [trim(listing.contactNote ?? ""), ch?.instructions?.trim()].filter(Boolean).join("\n\n"),
      horarioPreferidoLine: "",
      openHouseSummary: null,
      secondAgent: null,
      lender: null,
      websiteHref: ch?.website?.trim() ? ch.website : null,
      socialIconLinks: gateSocialIcons.length ? gateSocialIcons : undefined,
      preferredContactLine: formatLeonixPreferredContactLine(ch, lang) || undefined,
    },
    deepBlocks: [],
    detailClusters: [],
    location: {
      line1: loc.line1,
      colonia,
      cityStateZip: loc.cityStateZip,
      fullAddress: loc.exact ? loc.addressLine : loc.line1,
      mapsUrl,
      hasMeaningfulAddress: Boolean(loc.line1 || colonia || loc.cityStateZip || mapsUrl),
    },
    schools: { rows: [], showModule: false },
    community: { rows: [], showModule: false },
    hoaDevelopment: { rows: [], showModule: false, sitePlanCallout: false },
    mostrarDireccionExacta: loc.exact,
    footerNote: "",
  };
}
