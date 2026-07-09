import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import {
  digitsOnly,
  formatUsPhoneDisplay,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  buildRentasAssembledAddressLine,
  buildRentasCityStateZipLine,
  buildRentasGoogleMapsSearchQuery,
  buildRentasStreetLine,
  formatRentasDepositUsdPreview,
  formatRentasDisponibilidadDisplay,
  rentasGoogleMapsUrlFromQuery,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  buildRentasFlowContractRows,
  buildRentasFlowPropertyBodyRows,
  buildRentasFlowTipoResumenRow,
  buildRentasRentaMensualRow,
  rentasFlowGroupActive,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import type { RentasPrivadoFormState } from "../../schema/rentasPrivadoFormState";
import { rentasLeadSmsBody, RENTAS_LEAD_MESSAGE_ES } from "@/app/clasificados/rentas/shared/rentasLeadContactCopy";
import {
  buildLeonixContactChannelsV1PayloadFromFormSlice,
  formatLeonixPreferredContactLine,
  socialLinksFromChannelsPayload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
import type { BienesRaicesPreviewFact, BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { buildRentasShowingPreviewCard } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function digitsOnly15(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

function telHrefFromPhoneDisplay(raw: string): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function smsHrefFromPhoneDisplay(raw: string, lang: "es" | "en"): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `sms:${d}?&body=${encodeURIComponent(rentasLeadSmsBody(lang))}`;
}

function waHrefFromPhoneDisplay(raw: string, lang: "es" | "en"): string | null {
  const d = digitsOnly15(raw);
  if (d.length < 10) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(rentasLeadSmsBody(lang))}`;
}

function phoneDisplayFormatted(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const d = digitsOnly(t);
  return d.length >= 10 ? formatUsPhoneDisplay(d) : t;
}

function validVideoUrls(s: RentasPrivadoFormState): string[] {
  const raw = s.media.videoUrls?.length ? s.media.videoUrls : [s.media.videoUrl];
  const out: string[] = [];
  for (const item of raw) {
    const u = trim(item);
    if (!u || out.includes(u) || !/^https?:\/\//i.test(u)) continue;
    out.push(u);
    if (out.length >= 4) break;
  }
  return out;
}

function parseYoutubeId(url: string): string | null {
  const u = trim(url);
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/.exec(u);
  return m?.[1] ?? null;
}

function videoCards(urls: string[], lang: "es" | "en"): Array<{ label: string; href: string }> {
  return urls.map((href, index) => ({
    href,
    label:
      index === 0
        ? lang === "es"
          ? "Ver video"
          : "View video"
        : lang === "es"
          ? `Ver video ${index + 1}`
          : `View video ${index + 1}`,
  }));
}

const ESTADO_RENTAS: Record<RentasPrivadoFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  pendiente: "Pendiente",
  bajo_contrato: "Bajo contrato",
  rentado: "Rentado",
};

function priceDigits(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function formatUsdMonthly(precio: string): string {
  const d = priceDigits(precio);
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  const cur = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return `${cur} / mes`;
}

function toBienesRaicesPrivadoShape(s: RentasPrivadoFormState): BienesRaicesPrivadoFormState {
  const line1 = buildRentasStreetLine(s);
  const videos = validVideoUrls(s);
  return mergePartialBienesRaicesPrivadoState({
    categoriaPropiedad: s.categoriaPropiedad,
    titulo: s.titulo,
    precio: s.rentaMensual,
    ciudad: s.ciudad,
    ubicacionLinea: line1,
    enlaceMapa: "",
    descripcion: s.descripcion,
    estadoAnuncio: s.estadoAnuncio === "rentado" ? "vendido" : s.estadoAnuncio,
    media: {
      photoDataUrls: s.media.photoDataUrls,
      primaryImageIndex: 0,
      videoUrl: videos[0] ?? "",
      videoLocalDataUrl: "",
    },
    seller: {
      fotoDataUrl: s.seller.fotoDataUrl,
      nombre: s.seller.nombre,
      etiquetaRol: "",
      telefono: s.seller.telefono,
      whatsapp: s.seller.whatsapp,
      mensajesTexto: s.seller.mensajesTexto,
      correo: s.seller.correo,
      notaContacto: s.seller.notaContacto,
    },
    residencial: s.residencial,
    comercial: s.comercial,
    terreno: s.terreno,
    petsAllowed: s.mascotas === "permitidas" ? "yes" : s.mascotas === "no_permitidas" ? "no" : "",
    mostrarDireccionExacta: s.mostrarDireccionExacta === true,
  });
}

function plazoDisplay(s: RentasPrivadoFormState): string {
  if (s.plazoContrato === "otro") return trim(s.plazoContratoOtro);
  if (s.plazoContrato && RENTAS_PLAZO_LABELS[s.plazoContrato]) return RENTAS_PLAZO_LABELS[s.plazoContrato].es;
  return "";
}

function rentalQuickFacts(s: RentasPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const g = rentasFlowGroupActive(s);
  const showFurn = g === "unset" || g === "full_housing" || g === "room_shared" || g === "commercial_space";
  const rent = formatUsdMonthly(s.rentaMensual);
  if (rent) out.push({ label: "Renta mensual", value: rent, icon: "calendar" });
  const dep = formatRentasDepositUsdPreview(s.deposito);
  if (dep) out.push({ label: "Depósito", value: dep, icon: "pin" });
  const pl = plazoDisplay(s);
  if (pl) out.push({ label: "Plazo", value: pl, icon: "calendar" });
  const disp = formatRentasDisponibilidadDisplay(s.disponibilidad);
  if (disp) out.push({ label: "Disponibilidad", value: disp, icon: "calendar" });
  if (showFurn) {
    if (s.amueblado === "amueblado") out.push({ label: "Amueblado", value: "Sí", icon: "home" });
    if (s.amueblado === "sin_amueblar") out.push({ label: "Amueblado", value: "No", icon: "home" });
  }
  return out;
}

function dedupeQuickFactsByLabel(items: BienesRaicesPreviewQuickFactVm[]): BienesRaicesPreviewQuickFactVm[] {
  const seen = new Set<string>();
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  for (const x of items) {
    if (seen.has(x.label)) continue;
    seen.add(x.label);
    out.push(x);
  }
  return out;
}

function rentOperationSummary(cat: RentasPrivadoFormState["categoriaPropiedad"]): string {
  if (cat === "residencial") return "Renta residencial";
  if (cat === "comercial") return "Renta comercial";
  return "Renta terreno / lote";
}

function posterTypeDisplay(
  value: RentasPrivadoFormState["posterType"],
  lang: "es" | "en",
): string {
  if (value === "owner_private") return lang === "en" ? "Owner / private person" : "Dueño / particular";
  if (value === "agent") return lang === "en" ? "Agent" : "Agente";
  if (value === "property_manager") return "Property manager";
  if (value === "business") return lang === "en" ? "Business" : "Negocio";
  return "";
}

export function mapRentasPrivadoStateToPreviewVm(
  s: RentasPrivadoFormState,
  lang: "es" | "en" = "es",
): BienesRaicesPrivadoPreviewVm {
  const base = mapBienesRaicesPrivadoStateToPreviewVm(toBienesRaicesPrivadoShape(s));
  const exact = s.mostrarDireccionExacta === true;
  const cross = trim(s.direccionCruceCercano);
  const line1 = exact ? buildRentasStreetLine(s) : cross;
  const cityStateZip = buildRentasCityStateZipLine(s);
  const mapsQ = buildRentasGoogleMapsSearchQuery(s);
  const mapsUrl = rentasGoogleMapsUrlFromQuery(mapsQ);
  const hasMeaningfulAddress = Boolean(line1 || trim(s.ciudad) || trim(s.direccionCodigoPostal) || mapsUrl);
  const addressLine = exact
    ? buildRentasAssembledAddressLine(s)
    : [cityStateZip || trim(s.ciudad), trim(s.zonaVecindario)].filter(Boolean).join(" · ");

  const lead: BienesRaicesPreviewFact[] = [];
  const rm = buildRentasRentaMensualRow(s);
  if (rm) lead.push(rm);
  lead.push(...buildRentasFlowTipoResumenRow(s));
  const rentRows = [...lead, ...buildRentasFlowContractRows(s)];
  const rentFacts = rentalQuickFacts(s);
  const quickFacts = dedupeQuickFactsByLabel([...rentFacts, ...base.quickFacts]);
  const videos = validVideoUrls(s);
  const video0 = videos[0] ?? "";
  const video1 = videos[1] ?? "";
  const yt0 = video0 ? parseYoutubeId(video0) : null;
  const yt1 = video1 ? parseYoutubeId(video1) : null;

  const postedBy = posterTypeDisplay(s.posterType, lang);
  const postedByRows: BienesRaicesPreviewFact[] = postedBy
    ? [{ label: lang === "en" ? "Posted by" : "Publica", value: postedBy }]
    : [];
  const propertyBody: BienesRaicesPreviewFact[] = buildRentasFlowPropertyBodyRows(s);

  const telHref = telHrefFromPhoneDisplay(s.seller.telefono);
  const smsHref = smsHrefFromPhoneDisplay(s.seller.mensajesTexto, lang);
  const waDigitsPrimary = trim(s.seller.whatsapp) ? trim(s.seller.whatsapp) : trim(s.seller.telefono);
  const waHref = waHrefFromPhoneDisplay(waDigitsPrimary, lang);

  const mailto =
    trim(s.seller.correo) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(s.seller.correo))
      ? `mailto:${trim(s.seller.correo)}?subject=${encodeURIComponent(lang === "en" ? "Question about your rental (Leonix)" : "Pregunta sobre tu renta (Leonix)")}&body=${encodeURIComponent(rentasLeadSmsBody(lang))}`
      : null;

  const ch = buildLeonixContactChannelsV1PayloadFromFormSlice(s.contactChannels, {
    instructionsNote: s.seller.notaContacto,
  });
  const socialLinks = socialLinksFromChannelsPayload(ch);
  const preferredContactLine = formatLeonixPreferredContactLine(ch, lang);

  const highlightsRows = base.highlightsRows.map((r) => ({
    ...r,
    value: trim(r.value) === "✓" ? "Sí" : r.value,
  }));

  const showingCard = buildRentasShowingPreviewCard(s, lang);
  const tourUrl = normalizeLeonixHttpsUrl(s.virtualTourUrl);

  return {
    ...base,
    addressLine,
    priceDisplay: formatUsdMonthly(s.rentaMensual),
    listingStatusLabel: ESTADO_RENTAS[s.estadoAnuncio],
    operationSummary: rentOperationSummary(s.categoriaPropiedad),
    quickFacts,
    propertyDetailsRows: [...postedByRows, ...rentRows, ...propertyBody],
    highlightsRows,
    highlightsSectionTitle: "Destacados",
    seller: {
      ...base.seller,
      byOwnerLabel: "",
      phoneDisplay: phoneDisplayFormatted(s.seller.telefono),
      whatsappDisplay: phoneDisplayFormatted(s.seller.whatsapp),
      smsDisplay: phoneDisplayFormatted(s.seller.mensajesTexto),
      noteLine: trim(s.seller.notaContacto),
    },
    contact: {
      ...base.contact,
      solicitarInfoHref: mailto,
      showSolicitarInfo: Boolean(mailto),
      llamarHref: telHref,
      showLlamar: Boolean(telHref) && ch?.allowCall !== false,
      whatsappHref: waHref,
      showWhatsapp: Boolean(waHref) && ch?.whatsappEnabled !== false,
      smsHref,
      showSms: Boolean(smsHref) && ch?.allowSms !== false,
      instructionsLine: ch?.instructions?.trim() ?? "",
      websiteHref: ch?.website ?? null,
      socialLinks: socialLinks.length ? socialLinks : undefined,
      preferredContactLine: preferredContactLine || undefined,
    },
    location: {
      ...base.location,
      line1,
      cityStateZip,
      mapsUrl,
      hasMeaningfulAddress,
    },
    mostrarDireccionExacta: exact,
    openHouseCard: showingCard ? { title: showingCard.title, rows: showingCard.rows } : null,
    media: {
      ...base.media,
      videoThumbUrls: [
        yt0 ? `https://img.youtube.com/vi/${yt0}/hqdefault.jpg` : base.media.videoThumbUrls[0],
        yt1 ? `https://img.youtube.com/vi/${yt1}/hqdefault.jpg` : base.media.videoThumbUrls[1],
      ],
      videoPlaybackUrls: [yt0 ? null : video0 || base.media.videoPlaybackUrls[0], yt1 ? null : video1 || base.media.videoPlaybackUrls[1]],
      youtubeIds: [yt0 ?? base.media.youtubeIds[0], yt1 ?? base.media.youtubeIds[1]],
      hasVideo1: Boolean(video0 || base.media.hasVideo1),
      hasVideo2: Boolean(video1 || base.media.hasVideo2),
      externalVideoLinks: videoCards(videos, lang),
      virtualTourUrl: tourUrl ?? base.media?.virtualTourUrl ?? null,
    },
  };
}
