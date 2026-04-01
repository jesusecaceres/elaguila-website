/**
 * Único mapper: formulario → VM de vista previa (estructura fija por slots).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "../schema/agenteResidencialTipoMeta";
import type { AgenteIndividualResidencialPreviewVm } from "./agenteIndividualResidencialPreviewVm";
import { digitsOnly } from "../application/utils/phoneMask";

function trim(s: unknown): string {
  if (s == null) return "";
  if (typeof s === "string") return s.trim();
  return String(s).trim();
}

const STATUS_LABEL: Record<AgenteIndividualResidencialFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  pendiente: "Pendiente",
  bajo_contrato: "Bajo contrato",
  vendido: "Vendido",
};

const COND_LABEL: Record<AgenteIndividualResidencialFormState["condicionPropiedad"], string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  necesita_reparacion: "Necesita reparación",
};

function hrefFromUserInput(t: string): string | null {
  const s = trim(t);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return null;
}

/** URL o data URL de listado (enlace o archivo subido). */
function listadoDestinoHref(s: AgenteIndividualResidencialFormState): string | null {
  const url = hrefFromUserInput(s.listadoUrl);
  if (url) return url;
  const f = trim(s.listadoArchivoDataUrl);
  if (f.startsWith("data:")) return f;
  return null;
}

function formatPrice(raw: string): string {
  const t = trim(raw);
  if (!t) return "—";
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) {
    try {
      return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    } catch {
      return t.startsWith("$") ? t : `$${t}`;
    }
  }
  return t.startsWith("$") ? t : `$${t}`;
}

function buildMailto(to: string, subject: string, body: string): string | null {
  const e = trim(to);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildTelHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function buildWhatsappHref(phoneDigits: string, msg: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  const text = trim(msg) || "Hola, vi su anuncio en Leonix y quiero más información.";
  return `https://wa.me/1${d}?text=${encodeURIComponent(text)}`;
}

function socialChipLabel(raw: string): string {
  const s = trim(raw);
  if (!s) return "";
  const asUrl = hrefFromUserInput(s);
  if (asUrl) {
    try {
      const host = new URL(asUrl).hostname.replace(/^www\./, "");
      const base = host.split(".")[0] ?? host;
      return base.slice(0, 3).toUpperCase();
    } catch {
      return s.slice(0, 8);
    }
  }
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

function buildSocialLinksFromText(block: string): Array<{ label: string; href: string }> {
  const lines = block.split(/\r?\n/).map(trim).filter(Boolean);
  const out: Array<{ label: string; href: string }> = [];
  for (const raw of lines) {
    const href = hrefFromUserInput(raw);
    if (!href) continue;
    const label = socialChipLabel(raw);
    if (label) out.push({ label, href });
  }
  return out.slice(0, 5);
}

function normalizeStatus(s: AgenteIndividualResidencialFormState): string {
  const st = s.estadoAnuncio;
  return STATUS_LABEL[st] ?? STATUS_LABEL.disponible;
}

function videoPlayableUrl(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.videoUrl) || trim(state.videoDataUrl);
  return u || null;
}

function tourHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.tourUrl) || trim(state.tourDataUrl);
  if (!u) return null;
  return hrefFromUserInput(u) ?? (u.startsWith("data:") ? u : null);
}

function brochureHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.brochureUrl) || trim(state.brochureDataUrl);
  if (!u) return null;
  return hrefFromUserInput(u) ?? (u.startsWith("data:") ? u : null);
}

function formatTipoPropiedadDisplay(s: AgenteIndividualResidencialFormState): string {
  const opt = TIPO_PROPIEDAD_OPCIONES.find((x) => x.value === s.tipoPropiedadCodigo);
  const base = s.tipoPropiedadCodigo === "otro" ? trim(s.tipoPropiedadOtro) : opt?.label ?? "";
  let sub = "";
  if (s.tipoPropiedadCodigo === "otro") {
    sub = trim(s.subtipoPropiedad);
  } else {
    const lab = labelForSubtipo(s.tipoPropiedadCodigo, s.subtipoPropiedad);
    sub = lab;
  }
  return [base, sub].filter(Boolean).join(" · ") || "—";
}

export function mapAgenteIndividualResidencialToPreview(s: AgenteIndividualResidencialFormState): AgenteIndividualResidencialPreviewVm {
  const photos = (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, Number(s.fotoPortadaIndex) || 0), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;
  const secondary = photos.filter((_, i) => i !== cover).slice(0, 3);

  const pubLabel = "Venta residencial";
  const cityLine = [trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(" · ") || "—";
  const locationLine = [cityLine, trim(s.direccion)].filter(Boolean).join(" · ");

  const quickFacts: Array<{ label: string; value: string }> = [
    { label: "Recámaras", value: trim(s.recamaras) || "—" },
    { label: "Baños", value: trim(s.banos) || "—" },
    { label: "Interior", value: trim(s.tamanoInteriorSqft) || "—" },
  ];

  const propertyRows: AgenteIndividualResidencialPreviewVm["propertyRows"] = [
    { label: "Tipo de propiedad", value: formatTipoPropiedadDisplay(s) },
    { label: "Recámaras", value: trim(s.recamaras) || "—" },
    { label: "Baños", value: trim(s.banos) || "—" },
    { label: "Medios baños", value: trim(s.mediosBanos) || "—" },
    { label: "Tamaño interior", value: trim(s.tamanoInteriorSqft) || "—" },
    { label: "Tamaño del lote", value: trim(s.tamanoLoteSqft) || "—" },
    { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
    { label: "Año de construcción", value: trim(s.anoConstruccion) || "—" },
    { label: "Condición", value: COND_LABEL[s.condicionPropiedad] ?? "—" },
  ];

  const destacadosLabels: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (s.destacados?.[def.id]) destacadosLabels.push(def.label);
  }

  const site = hrefFromUserInput(s.agenteSitioWeb);
  const redesParsed = buildSocialLinksFromText(s.agenteRedes);
  const title = trim(s.titulo) || "Título del anuncio";
  const email = trim(s.agenteEmail);
  const phone = trim(s.agenteTelefono);
  const phoneDigits = digitsOnly(phone);

  const listadoHref = listadoDestinoHref(s);
  const listadoDownloadName = trim(s.listadoArchivoNombre) || null;
  const videoUrl = videoPlayableUrl(s);
  const tourH = tourHref(s);
  const brochH = brochureHref(s);

  const solicitarInfoHref = buildMailto(email, `Consulta — ${title}`, `Hola,\n\nMe interesa: ${title}`);
  const visitaHref = buildMailto(email, `Visita — ${title}`, `Hola,\n\nMe interesa ${title} y quiero programar una visita.`);
  const llamarHref = s.permitirLlamar ? buildTelHref(phoneDigits) : null;
  const waHref = s.permitirWhatsApp ? buildWhatsappHref(phoneDigits, "") : null;

  const showVerListado = Boolean(s.permitirVerListadoCompleto && listadoHref);
  const showVerMls = Boolean(s.permitirVerMls && listadoHref);
  const showVerTour = Boolean(s.permitirVerTour && tourH);
  const showVerFolleto = Boolean(s.permitirVerFolleto && brochH);
  const showSitio = Boolean(s.permitirVerSitioWeb && site);
  const showRedes = Boolean(s.permitirVerRedes && redesParsed.length > 0);

  const openParts: string[] = [];
  if (s.extraOpenHouse) {
    if (trim(s.openHouseFecha)) openParts.push(`Fecha: ${trim(s.openHouseFecha)}`);
    const r = [trim(s.openHouseInicio), trim(s.openHouseFin)].filter(Boolean);
    if (r.length) openParts.push(`Horario: ${r.join(" – ")}`);
    if (trim(s.openHouseNotas)) openParts.push(trim(s.openHouseNotas));
  }
  const openHouseSummary = s.extraOpenHouse && openParts.length ? openParts.join("\n") : null;

  const asesorBlock =
    s.extraAsesorFinanciero && trim(s.asesorNombre)
      ? {
          name: trim(s.asesorNombre),
          phone: trim(s.asesorTelefono),
          email: trim(s.asesorEmail),
        }
      : null;

  const mapQuery = [trim(s.direccion), trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(", ");

  return {
    hero: {
      title,
      operationLine: pubLabel,
      locationLine,
      priceDisplay: formatPrice(s.precio),
      statusPill: normalizeStatus(s),
      quickFacts,
    },
    sidebar: {
      photoUrl: trim(s.agenteFotoDataUrl) || null,
      name: trim(s.agenteNombre) || "Nombre del agente",
      title: trim(s.agenteTitulo) || "Agente",
      bioLine: trim(s.agenteBioCorta),
      phoneDisplay: phone || "—",
      email: email || "—",
      websiteHref: site,
      websiteLabel: "Sitio web",
      socialLinks: redesParsed,
      licenciaLine: trim(s.agenteLicencia) ? `Licencia: ${trim(s.agenteLicencia)}` : "",
      areaServicioLine: trim(s.agenteAreaServicio),
      idiomasLine: trim(s.agenteIdiomas),
    },
    media: {
      heroUrl,
      secondaryUrls: secondary,
      coverIndex: cover,
      videoEmbedUrl: videoUrl && (videoUrl.startsWith("http") || videoUrl.startsWith("data:")) ? videoUrl : null,
      tourHref: tourH,
      brochureHref: brochH,
      photoCount: photos.length,
    },
    propertyRows,
    destacadosLabels,
    descripcionPrincipal: trim(s.descripcionPrincipal),
    notasAdicionales: trim(s.notasAdicionales),
    hasDescription: Boolean(trim(s.descripcionPrincipal)),
    hasNotas: Boolean(trim(s.notasAdicionales)),
    cta: {
      showLlamar: Boolean(s.permitirLlamar && llamarHref),
      llamarHref,
      showWhatsapp: Boolean(s.permitirWhatsApp && waHref),
      whatsappHref: waHref,
      showSolicitarInformacion: Boolean(s.permitirSolicitarInformacion && solicitarInfoHref),
      solicitarInformacionHref: solicitarInfoHref,
      showProgramarVisita: Boolean(s.permitirProgramarVisita && visitaHref),
      visitaHref,
      showVerSitioWeb: showSitio,
      verSitioHref: site,
      showVerRedes: showRedes,
      primeraRedHref: redesParsed[0]?.href ?? null,
      showVerListado,
      verListadoHref: listadoHref,
      listadoDownloadName,
      showVerMls,
      verMlsHref: listadoHref,
      showVerTour,
      verTourHref: tourH,
      showVerFolleto,
      verFolletoHref: brochH,
    },
    extras: {
      openHouseSummary,
      asesorBlock,
      puntosCercanos: trim(s.puntosCercanos),
      transporte: trim(s.transporte),
      mapQuery,
    },
  };
}
