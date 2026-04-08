import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import {
  COMERCIAL_DESTACADOS_DEFS,
  COMERCIAL_SUBTIPO_POR_TIPO,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_DESTACADOS_DEFS,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
  labelComercialSubtipo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import { digitsOnly } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { previewWhatsappClickHref } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";
import type { BienesRaicesPrivadoFormState } from "../../schema/bienesRaicesPrivadoFormState";
import type { BienesRaicesPreviewFact, BienesRaicesPreviewMediaVm, BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

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

function formatUsdWhole(digits: string): string {
  const d = digitsOnly(digits);
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
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

function hrefFromUserInput(raw: string): string | null {
  const s = trim(raw);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;
  const guess = `https://${s}`;
  try {
    new URL(guess);
    return guess;
  } catch {
    return null;
  }
}

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
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
  const vu = trim(s.media.videoUrl);
  const yt = vu ? parseYoutubeId(vu) : null;
  const hasVid = Boolean(vu);
  const thumb0 = yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
  const playback0 = hasVid ? vu : null;

  const metaLine = n > 0 ? `${n} foto${n === 1 ? "" : "s"} en la galería` : "";

  return {
    heroUrl,
    secondaryPhotoUrls: [],
    videoThumbUrls: [thumb0, null],
    videoPlaybackUrls: [playback0, null],
    youtubeIds: [yt, null],
    virtualTourUrl: null,
    floorPlanUrls: [],
    sitePlanUrl: null,
    metaLine,
    hasPhotos: n > 0,
    hasVideo1: hasVid,
    hasVideo2: false,
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

function buildResidencialDetails(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const r = s.residencial;
  const tipoLabel = TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === r.tipoCodigo)?.label ?? "";
  const subLbl = labelForSubtipo(r.tipoCodigo, r.subtipo);
  const rows: Array<BienesRaicesPreviewFact | null> = [
    row("Tipo", tipoLabel),
    row("Subtipo", subLbl),
    row("Recámaras", r.recamaras),
    row("Baños completos", r.banos),
    row("Medios baños", r.mediosBanos),
    row("Tamaño interior", r.interiorSqft ? `${trim(r.interiorSqft)} ft²` : ""),
    row("Tamaño del lote", r.loteSqft ? `${trim(r.loteSqft)} ft²` : ""),
    row("Estacionamiento", r.estacionamiento),
    row("Año de construcción", r.ano),
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
  push("Recámaras", r.recamaras, "bed");
  push("Baños", r.banos, "bath");
  push("Interior", r.interiorSqft ? `${trim(r.interiorSqft)} ft²` : "", "ruler");
  push("Lote", r.loteSqft ? `${trim(r.loteSqft)} ft²` : "", "pin");
  push("Estacionamiento", r.estacionamiento, "car");
  push("Año", r.ano, "calendar");
  return out;
}

function buildResidencialHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.key, d.label]));
  return s.residencial.highlightKeys
    .map((k) => {
      const label = map.get(k);
      if (!label) return null;
      return { label: "Destacado", value: label };
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
    row("Tamaño interior", c.interiorSqft ? `${trim(c.interiorSqft)} ft²` : ""),
    row("Oficinas", c.oficinas),
    row("Baños", c.banos),
    row("Niveles / pisos", c.niveles),
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
  push("Interior", c.interiorSqft ? `${trim(c.interiorSqft)} ft²` : "", "ruler");
  push("Oficinas", c.oficinas, "sparkle");
  push("Baños", c.banos, "bath");
  push("Niveles", c.niveles, "calendar");
  push("Estacionamiento", c.estacionamiento, "car");
  return out;
}

function buildComercialHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(COMERCIAL_DESTACADOS_DEFS.map((d) => [d.id, d.label]));
  return s.comercial.destacadoIds
    .map((id) => {
      const label = map.get(id);
      if (!label) return null;
      return { label: "Destacado", value: label };
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
    row("Tamaño del lote", t.loteSqft ? `${trim(t.loteSqft)} ft²` : ""),
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
  push("Lote", t.loteSqft ? `${trim(t.loteSqft)} ft²` : "", "ruler");
  push("Uso / zona", t.usoZonificacion, "pin");
  push("Acceso", t.acceso, "car");
  push("Servicios", t.servicios, "sparkle");
  return out;
}

function buildTerrenoHighlights(s: BienesRaicesPrivadoFormState): BienesRaicesPreviewFact[] {
  const map = new Map(TERRENO_DESTACADOS_DEFS.map((d) => [d.id, d.label]));
  return s.terreno.destacadoIds
    .map((id) => {
      const label = map.get(id);
      if (!label) return null;
      return { label: "Destacado", value: label };
    })
    .filter((x): x is BienesRaicesPreviewFact => x != null);
}

export function mapBienesRaicesPrivadoStateToPreviewVm(s: BienesRaicesPrivadoFormState): BienesRaicesPrivadoPreviewVm {
  const cat = s.categoriaPropiedad;
  const mapsUrl = hrefFromUserInput(s.enlaceMapa);

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

  const mailto = buildMailto(s.seller.correo, "Consulta sobre tu anuncio en Leonix");
  const telHref = buildTelHref(s.seller.telefono);
  const waRaw = trim(s.seller.whatsapp) || trim(s.seller.telefono);
  const waHref = previewWhatsappClickHref(waRaw);

  const city = trim(s.ciudad);
  const line = trim(s.ubicacionLinea);
  const addressLine = [line, city].filter(Boolean).join(line && city ? " · " : "") || "";

  const desc = trim(s.descripcion);

  const sellerPhoto = trim(s.seller.fotoDataUrl);
  const sellerName = trim(s.seller.nombre);
  const phoneDisp = trim(s.seller.telefono) ? s.seller.telefono : "";
  const emailDisp = trim(s.seller.correo);
  const waDisp = trim(s.seller.whatsapp);

  return {
    categoria: cat,
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle: trim(s.titulo),
    addressLine,
    priceDisplay: formatUsdWhole(s.precio),
    listingStatusLabel: ESTADO_LABEL[s.estadoAnuncio],
    operationSummary: operationSummaryFor(cat),
    quickFacts,
    seller: {
      photoUrl: sellerPhoto || null,
      hasPhoto: Boolean(sellerPhoto),
      name: sellerName,
      byOwnerLabel: trim(s.seller.etiquetaRol),
      phoneDisplay: phoneDisp,
      emailDisplay: emailDisp,
      whatsappDisplay: waDisp,
      noteLine: trim(s.seller.notaContacto),
    },
    media: buildMediaVm(s),
    propertyDetailsRows,
    highlightsRows,
    hasHighlights: highlightsRows.length > 0,
    description: desc,
    hasDescription: Boolean(desc),
    contactRailTitle: "Contactar al vendedor",
    contact: {
      showSolicitarInfo: Boolean(mailto),
      showLlamar: Boolean(telHref),
      showWhatsapp: Boolean(waHref),
      solicitarInfoHref: mailto,
      llamarHref: telHref,
      whatsappHref: waHref,
      instructionsLine: trim(s.seller.notaContacto),
    },
    location: {
      mapsUrl,
      line1: line,
      cityStateZip: city,
      hasMeaningfulAddress: Boolean(line || city || mapsUrl),
    },
    footerNote: "",
  };
}
