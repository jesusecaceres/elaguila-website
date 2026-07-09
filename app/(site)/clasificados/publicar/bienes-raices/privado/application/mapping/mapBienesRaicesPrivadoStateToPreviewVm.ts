import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import {
  COMERCIAL_DESTACADOS_DEFS,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_DESTACADOS_DEFS,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
  labelComercialSubtipo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import {
  digitsOnly,
  formatUsPhoneDisplay,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { previewWhatsappClickHref } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";
import type { BienesRaicesPrivadoFormState } from "../../schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPreviewFact, BienesRaicesPreviewMediaVm, BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { sanitizeLeonixListingPublishDescriptionBody } from "@/app/clasificados/lib/leonixPublishPublicDescription";
import {
  composeBrApproximateMapQuery,
  composeBrExactMapQuery,
  sanitizeBrUserMapUrl,
} from "@/app/clasificados/lib/leonixBrGate12d";
import { buildBrGate12dHoaPreviewCard } from "@/app/clasificados/lib/leonixBrGate12dHoaPreview";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";
import { googleMapsSearchUrl } from "@/app/(site)/publicar/community/shared/lib/communityContactCtas";
import { normalizeZipForBrowse } from "@/app/clasificados/rentas/shared/rentasLocationNormalize";
import {
  buildLeonixContactChannelsV1PayloadFromFormSlice,
  formatLeonixPreferredContactLine,
  socialLinksFromChannelsPayload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";

function trim(s: string): string {
  return String(s ?? "").trim();
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

const ESTADO_LABEL: Record<BienesRaicesPrivadoFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  pendiente: "Pendiente",
  bajo_contrato: "Bajo contrato",
  vendido: "Vendido",
};

const CONDICION_LABEL: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  necesita_reparacion: "Necesita reparación",
};

import {
  formatCityStateZip,
  formatDetailCountDisplay,
  formatFullAddress,
  formatIntegerWithCommas,
  formatSqftDisplay,
  formatStreetUnitLine,
  formatUsdWhole,
  formatYearBuiltDisplay,
} from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";

function prettifyPlainNumber(raw: string): string {
  return formatDetailCountDisplay(raw) || formatIntegerWithCommas(raw) || trim(raw);
}

function prettifySqft(raw: string): string {
  return formatSqftDisplay(raw) || trim(raw);
}

function buildMailto(to: string, subject: string): string | null {
  const e = trim(to);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}`;
}

function buildTelHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function buildSmsHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  return `sms:${d}`;
}

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
}

/** Hide optional half-baths when empty or explicitly zero (avoid noisy "0" in preview). */
function rowOptionalCount(label: string, raw: string): BienesRaicesPreviewFact | null {
  const t = trim(raw);
  if (!t || t === "0") return null;
  return row(label, prettifyPlainNumber(raw));
}

function operationSummaryFor(cat: BienesRaicesPrivadoFormState["categoriaPropiedad"]): string {
  if (cat === "residencial") return "Venta residencial";
  if (cat === "comercial") return "Venta comercial";
  return "Venta terreno / lote";
}

function buildMediaVm(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewMediaVm {
  const urls = [...s.media.photoDataUrls];
  const n = urls.length;
  const pi = n === 0 ? 0 : Math.min(Math.max(0, s.media.primaryImageIndex), n - 1);
  const heroUrl = n > 0 ? urls[pi]! : null;
  const localV = trim(s.media.videoLocalDataUrl ?? "");
  const urlV = trim(s.media.videoUrl);
  /** Local file wins over URL for preview (draft-only; no Mux). */
  const primaryVideo = localV || urlV;
  const yt = !localV && urlV ? parseYoutubeId(urlV) : null;
  const hasVid = Boolean(primaryVideo);
  const thumb0 = yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
  const playback0 = hasVid ? (localV || urlV) : null;

  const vt = normalizeLeonixHttpsUrl(trim(s.gate12d?.virtualTourUrl ?? ""));
  const metaLine =
    n > 0 ? `${n} foto${n === 1 ? "" : "s"} en la galería` : hasVid ? "Video en el anuncio" : vt ? "Tour virtual" : "";

  return {
    heroUrl,
    secondaryPhotoUrls: [],
    videoThumbUrls: [thumb0, null],
    videoPlaybackUrls: [playback0, null],
    youtubeIds: [yt, null],
    virtualTourUrl: vt,
    floorPlanUrls: [],
    sitePlanUrl: null,
    metaLine,
    hasPhotos: n > 0,
    hasVideo1: hasVid,
    hasVideo2: false,
    hasVirtualTour: Boolean(vt),
    hasFloorPlans: false,
    hasSitePlan: false,
    photoCount: n,
    heroCaption: null,
    allPhotoUrls: urls,
    coverPhotoIndex: pi,
    photoCaptionsFull: urls.map(() => ""),
  };
}

function buildResidencialDetails(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const r = s.residencial;
  const tipoLabel = TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === r.tipoCodigo)?.label ?? "";
  const subLbl = labelForSubtipo(r.tipoCodigo, r.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo", tipoLabel),
    row("Subtipo", subLbl),
    row("Recámaras", prettifyPlainNumber(r.recamaras)),
    row("Baños completos", prettifyPlainNumber(r.banos)),
    rowOptionalCount("Medios baños", r.mediosBanos),
    row("Tamaño interior", r.interiorSqft ? prettifySqft(r.interiorSqft) : ""),
    row("Tamaño del lote", r.loteSqft ? prettifySqft(r.loteSqft) : ""),
    row("Estacionamiento", r.estacionamiento),
    row("Año de construcción", formatYearBuiltDisplay(r.ano)),
    row("Condición", r.condicion ? CONDICION_LABEL[r.condicion] ?? r.condicion : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}

function buildResidencialQuickFacts(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const r = s.residencial;
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const push = (label: string, value: string, icon: BienesRaicesPreviewQuickFactVm["icon"]) => {
    const v = trim(value);
    if (v) out.push({ label, value: v, icon });
  };
  push("Recámaras", prettifyPlainNumber(r.recamaras), "bed");
  push("Baños", prettifyPlainNumber(r.banos), "bath");
  const mb = trim(r.mediosBanos);
  if (mb && mb !== "0") push("Medios baños", prettifyPlainNumber(r.mediosBanos), "bath");
  push("Interior", r.interiorSqft ? prettifySqft(r.interiorSqft) : "", "ruler");
  push("Lote", r.loteSqft ? prettifySqft(r.loteSqft) : "", "pin");
  push("Estacionamiento", r.estacionamiento, "car");
  push("Año", formatYearBuiltDisplay(r.ano), "calendar");
  return out;
}

function buildResidencialHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.key, d.label]));
  const uniqueKeys = [...new Set(s.residencial.highlightKeys)];
  return uniqueKeys
    .map((k) => {
      const label = map.get(k);
      if (!label) return null;
      return { label, value: "✓" };
    })
    .filter((x): x is BienesRaicesPreviewFact => x != null);
}

function buildComercialDetails(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const c = s.comercial;
  const tipoLabel = COMERCIAL_TIPO_OPCIONES.find((o) => o.value === c.tipoCodigo)?.label ?? "";
  const subLbl = labelComercialSubtipo(c.tipoCodigo, c.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo comercial", tipoLabel),
    row("Subtipo", subLbl),
    row("Uso", c.uso),
    row("Tamaño interior", c.interiorSqft ? prettifySqft(c.interiorSqft) : ""),
    row("Oficinas", prettifyPlainNumber(c.oficinas)),
    row("Baños", prettifyPlainNumber(c.banos)),
    row("Niveles / pisos", prettifyPlainNumber(c.niveles)),
    row("Estacionamiento", c.estacionamiento),
    row("Zonificación", c.zonificacion),
    row("Condición", c.condicion ? CONDICION_LABEL[c.condicion] ?? c.condicion : ""),
    row("Acceso de carga", c.accesoCarga ? "Sí" : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}

function buildComercialQuickFacts(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const c = s.comercial;
  const tipoLabel = COMERCIAL_TIPO_OPCIONES.find((o) => o.value === c.tipoCodigo)?.label ?? "";
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const push = (label: string, value: string, icon: BienesRaicesPreviewQuickFactVm["icon"]) => {
    const v = trim(value);
    if (v) out.push({ label, value: v, icon });
  };
  if (trim(tipoLabel)) push("Tipo", tipoLabel, "home");
  push("Interior", c.interiorSqft ? prettifySqft(c.interiorSqft) : "", "ruler");
  push("Oficinas", prettifyPlainNumber(c.oficinas), "sparkle");
  push("Baños", prettifyPlainNumber(c.banos), "bath");
  push("Niveles", prettifyPlainNumber(c.niveles), "calendar");
  push("Estacionamiento", c.estacionamiento, "car");
  return out;
}

function buildComercialHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(COMERCIAL_DESTACADOS_DEFS.map((d) => [d.id, d.label]));
  const uniqueIds = [...new Set(s.comercial.destacadoIds)];
  return uniqueIds
    .map((id) => {
      const label = map.get(id);
      if (!label) return null;
      return { label, value: "✓" };
    })
    .filter((x): x is BienesRaicesPreviewFact => x != null);
}

function labelTerrenoSubtipo(codigo: (typeof TERRENO_TIPO_OPCIONES)[number]["value"], subvalor: string): string {
  const v = trim(subvalor);
  if (!v) return "";
  const list = TERRENO_SUBTIPO_POR_TIPO[codigo];
  return list.find((x) => x.value === v)?.label ?? "";
}

function buildTerrenoDetails(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const t = s.terreno;
  const tipoLabel = TERRENO_TIPO_OPCIONES.find((o) => o.value === t.tipoCodigo)?.label ?? "";
  const subLbl = labelTerrenoSubtipo(t.tipoCodigo, t.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo de terreno", tipoLabel),
    row("Subtipo", subLbl),
    row("Tamaño del lote", t.loteSqft ? prettifySqft(t.loteSqft) : ""),
    row("Uso / zonificación", t.usoZonificacion),
    row("Acceso", t.acceso),
    row("Servicios disponibles", t.servicios),
    row("Topografía", t.topografia),
    row("Listo para construir", t.listoConstruir ? "Sí" : ""),
    row("Cercado", t.cercado ? "Sí" : ""),
  ];
  return rows.filter((x): x is BienesRaicesPreviewFact => x != null);
}

function buildTerrenoQuickFacts(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewQuickFactVm[] {
  const t = s.terreno;
  const out: BienesRaicesPreviewQuickFactVm[] = [];
  const push = (label: string, value: string, icon: BienesRaicesPreviewQuickFactVm["icon"]) => {
    const v = trim(value);
    if (v) out.push({ label, value: v, icon });
  };
  push("Lote", t.loteSqft ? prettifySqft(t.loteSqft) : "", "ruler");
  push("Uso / zona", t.usoZonificacion, "pin");
  push("Acceso", t.acceso, "car");
  push("Servicios", t.servicios, "sparkle");
  return out;
}

function buildTerrenoHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(TERRENO_DESTACADOS_DEFS.map((d) => [d.id, d.label]));
  const uniqueIds = [...new Set(s.terreno.destacadoIds)];
  return uniqueIds
    .map((id) => {
      const label = map.get(id);
      if (!label) return null;
      return { label, value: "✓" };
    })
    .filter((x): x is BienesRaicesPreviewFact => x != null);
}

type BrPreviewLang = "es" | "en";

function buildGate12dHoaCard(
  s: BienesRaicesPrivadoFormState,
  lang: BrPreviewLang,
): { title: string; rows: BienesRaicesPreviewFact[] } | null {
  const card = buildBrGate12dHoaPreviewCard(s.gate12d, { lang, petsAllowed: s.petsAllowed });
  if (!card) return null;
  return { title: card.title, rows: card.rows };
}

function buildGate12dOpenHouseCard(
  s: BienesRaicesPrivadoFormState,
  lang: BrPreviewLang,
): { title: string; rows: BienesRaicesPreviewFact[] } | null {
  const g = s.gate12d;
  const rows: BienesRaicesPreviewFact[] = [];
  const L = (es: string, en: string) => (lang === "es" ? es : en);
  const pushRow = (label: string, value: string) => {
    const r = row(label, value);
    if (r) rows.push(r);
  };
  if (g.openHouseEnabled) {
    pushRow(L("Open house", "Open house"), L("Sí", "Yes"));
    if (trim(g.openHouseDate)) pushRow(L("Fecha", "Date"), trim(g.openHouseDate));
    const tw = [trim(g.openHouseStartTime), trim(g.openHouseEndTime)].filter(Boolean).join(" – ");
    if (tw) pushRow(L("Horario", "Hours"), tw);
  }
  if (g.showingByAppointment) pushRow(L("Visitas con cita", "Showings by appointment"), L("Sí", "Yes"));
  if (trim(g.showingInstructions)) pushRow(L("Instrucciones para visitas", "Showing instructions"), trim(g.showingInstructions));
  if (!rows.length) return null;
  return { title: L("Open house y visitas", "Open house and showings"), rows };
}

export function mapBienesRaicesPrivadoStateToPreviewVm(
  s: BienesRaicesPrivadoFormState,
  lang: BrPreviewLang = "es",
): BienesRaicesPrivadoPreviewVm {
  const cat = s.categoriaPropiedad;
  const g = s.gate12d;

  let propertyDetailsRows: BienesRaicesPreviewFact[] = [];
  let quickFacts: BienesRaicesPreviewQuickFactVm[] = [];
  let highlightsRows: BienesRaicesPreviewFact[] = [];

  if (cat === "residencial") {
    propertyDetailsRows = buildResidencialDetails(s);
    quickFacts = buildResidencialQuickFacts(s);
    highlightsRows = buildResidencialHighlights(s);
  } else if (cat === "comercial") {
    propertyDetailsRows = buildComercialDetails(s);
    quickFacts = buildComercialQuickFacts(s);
    highlightsRows = buildComercialHighlights(s);
  } else {
    propertyDetailsRows = buildTerrenoDetails(s);
    quickFacts = buildTerrenoQuickFacts(s);
    highlightsRows = buildTerrenoHighlights(s);
  }

  const sellerPhoto = trim(s.seller.fotoDataUrl);
  const sellerName = trim(s.seller.nombre);
  const ownerLabel = trim(s.seller.etiquetaRol) || (sellerName ? "Propietario" : "");

  const mailto = buildMailto(s.seller.correo, "Pregunta sobre tu propiedad (Leonix — particular)");
  const telHref = buildTelHref(s.seller.telefono);
  const waRaw = trim(s.seller.whatsapp) || trim(s.seller.telefono);
  const waHref = previewWhatsappClickHref(waRaw);
  const smsHref = buildSmsHref(s.seller.mensajesTexto);

  const city = trim(s.ciudad);
  const line = trim(s.ubicacionLinea);
  const showExact = s.mostrarDireccionExacta;
  const calle = trim(g.calleNumero);
  const unidad = trim(g.unidad);
  const estado = trim(g.estado);
  const zipPretty = normalizeZipForBrowse(trim(g.codigoPostal));
  const streetLine = formatStreetUnitLine(calle, unidad) || line;
  const cityStateZip = formatCityStateZip(city, estado, zipPretty);
  const addressLine = showExact
    ? formatFullAddress({ street: calle || line, unit: unidad, city, state: estado, zip: zipPretty }) || city
    : formatCityStateZip(city, estado, zipPretty) || city;

  const zipForCompose = zipPretty.length >= 5 ? zipPretty.replace(/\D/g, "").slice(0, 10) : "";
  const composedQ = showExact
    ? composeBrExactMapQuery({
        streetAddress: calle || line,
        unit: unidad,
        neighborhood: trim(g.colonia),
        city,
        state: estado,
        zip: zipForCompose,
      })
    : composeBrApproximateMapQuery({
        neighborhood: trim(g.colonia),
        city,
        state: trim(g.estado),
        zip: zipForCompose,
      });
  const q = (composedQ || (showExact ? line : "") || city).trim();
  const googleHref = q ? googleMapsSearchUrl(q) : null;
  const userMap = sanitizeBrUserMapUrl(s.enlaceMapa);
  const mapsUrl = userMap ?? googleHref;

  const desc = sanitizeLeonixListingPublishDescriptionBody(trim(s.descripcion));
  const phoneDisp = trim(s.seller.telefono) ? formatUsPhoneDisplay(digitsOnly(s.seller.telefono)) : "";
  const emailDisp = trim(s.seller.correo);
  const waDisp = trim(s.seller.whatsapp) ? formatUsPhoneDisplay(digitsOnly(s.seller.whatsapp)) : "";
  const smsDisp = trim(s.seller.mensajesTexto) ? formatUsPhoneDisplay(digitsOnly(s.seller.mensajesTexto)) : "";

  const ch = buildLeonixContactChannelsV1PayloadFromFormSlice(s.contactChannels, {
    instructionsNote: s.seller.notaContacto,
  });
  const socialLinks = socialLinksFromChannelsPayload(ch);
  const preferredContactLine = formatLeonixPreferredContactLine(ch, lang);

  const hoaCommunityCard = buildGate12dHoaCard(s, lang);
  const openHouseCard = buildGate12dOpenHouseCard(s, lang);

  return {
    categoria: cat,
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle: trim(s.titulo),
    addressLine,
    mostrarDireccionExacta: showExact,
    priceDisplay: formatUsdWhole(s.precio),
    listingStatusLabel: ESTADO_LABEL[s.estadoAnuncio],
    operationSummary: operationSummaryFor(cat),
    quickFacts,
    seller: {
      photoUrl: sellerPhoto || null,
      hasPhoto: Boolean(sellerPhoto),
      name: sellerName,
      byOwnerLabel: ownerLabel,
      phoneDisplay: phoneDisp,
      emailDisplay: emailDisp,
      whatsappDisplay: waDisp,
      smsDisplay: smsDisp,
      noteLine: trim(s.seller.notaContacto),
    },
    media: buildMediaVm(s),
    propertyDetailsRows,
    highlightsRows,
    hasHighlights: highlightsRows.length > 0,
    description: desc,
    hasDescription: Boolean(desc),
    contactRailTitle: "Contacto",
    contact: {
      showSolicitarInfo: Boolean(mailto),
      showLlamar: Boolean(telHref) && ch?.allowCall !== false,
      showWhatsapp: Boolean(waHref) && ch?.whatsappEnabled !== false,
      showSms: Boolean(smsHref) && ch?.allowSms !== false,
      solicitarInfoHref: mailto,
      llamarHref: telHref,
      whatsappHref: waHref,
      smsHref,
      instructionsLine: ch?.instructions?.trim() ?? "",
      websiteHref: ch?.website ?? null,
      socialLinks: socialLinks.length ? socialLinks : undefined,
      preferredContactLine: preferredContactLine || undefined,
    },
    location: {
      mapsUrl,
      line1: showExact ? streetLine : "",
      cityStateZip,
      fullAddress: showExact ? [streetLine, cityStateZip].filter(Boolean).join(", ") : "",
      hasMeaningfulAddress: Boolean((showExact && streetLine) || city || mapsUrl),
    },
    hoaCommunityCard,
    openHouseCard,
    footerNote: "",
  };
}
