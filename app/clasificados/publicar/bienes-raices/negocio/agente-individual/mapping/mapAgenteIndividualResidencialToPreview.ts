/**
 * Único mapper: formulario → VM (plantilla primero).
 *
 * Respaldos intencionales (solo si el campo dedicado va vacío):
 * - Llamar: ctaNumeroLlamadas → telefonoPrincipal
 * - WhatsApp: ctaNumeroWhatsapp → telefonoPrincipal
 * - Solicitar información (mailto): ctaCorreoSolicitarInfo → correoPrincipal
 * - Ver sitio web: ctaEnlaceSitioWeb → marcaSitioWeb
 * - Ver listado completo: ctaUrlListadoCompleto → listado de información básica (URL o data)
 * - Ver MLS: ctaUrlMls → ctaUrlListadoCompleto → listado básico
 * - Ver tour: ctaUrlTour → tour de galería (paso medios)
 * - Ver folleto: ctaUrlFolleto → folleto de galería
 * Programar visita: solo ctaEnlaceProgramarVisita (sin mailto automático).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "../schema/agenteResidencialTipoMeta";
import type {
  AgenteIndividualResidencialPreviewVm,
  AgenteResQuickFactSemanticKey,
  AgenteResQuickFactVm,
} from "./agenteIndividualResidencialPreviewVm";
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

/** URL o archivo del bloque «información básica» (listado de la propiedad). */
function listadoBloqueHref(s: AgenteIndividualResidencialFormState): string | null {
  const url = hrefFromUserInput(s.listadoUrl);
  if (url) return url;
  const f = trim(s.listadoArchivoDataUrl);
  if (f.startsWith("data:")) return f;
  return null;
}

function resolveAnyHref(raw: string): string | null {
  const t = trim(raw);
  if (!t) return null;
  if (t.startsWith("data:")) return t;
  if (t.startsWith("mailto:")) return t;
  return hrefFromUserInput(t);
}

function formatPrice(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
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

function normalizeStatus(s: AgenteIndividualResidencialFormState): string {
  const st = s.estadoAnuncio;
  return STATUS_LABEL[st] ?? STATUS_LABEL.disponible;
}

function videoPlayableUrl(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.videoUrl) || trim(state.videoDataUrl);
  return u || null;
}

/** Galería: tour desde medios del paso «Fotos y medios». */
function tourMediaHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.tourUrl) || trim(state.tourDataUrl);
  if (!u) return null;
  return resolveAnyHref(u);
}

function brochureMediaHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.brochureUrl) || trim(state.brochureDataUrl);
  if (!u) return null;
  return resolveAnyHref(u);
}

function formatTipoPropiedadDisplay(s: AgenteIndividualResidencialFormState): string {
  const opt = TIPO_PROPIEDAD_OPCIONES.find((x) => x.value === s.tipoPropiedadCodigo);
  const base = s.tipoPropiedadCodigo === "otro" ? trim(s.tipoPropiedadOtro) : opt?.label ?? "";
  let sub = "";
  if (s.tipoPropiedadCodigo === "otro") {
    sub = trim(s.subtipoPropiedad);
  } else {
    sub = labelForSubtipo(s.tipoPropiedadCodigo, s.subtipoPropiedad);
  }
  return [base, sub].filter(Boolean).join(" · ") || "—";
}

/** Teléfono dedicado a CTA «Llamar»; si vacío → teléfono principal de tarjeta. */
function numeroParaLlamar(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaNumeroLlamadas) || trim(s.telefonoPrincipal);
}

/** WhatsApp dedicado; si vacío → teléfono principal. */
function numeroParaWhatsapp(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaNumeroWhatsapp) || trim(s.telefonoPrincipal);
}

/** Correo dedicado a «Solicitar información»; si vacío → correo principal. */
function correoSolicitarInfo(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaCorreoSolicitarInfo) || trim(s.correoPrincipal);
}

/**
 * Listado completo (CTA): campo dedicado; si vacío → mismo destino que el bloque de listado de la propiedad.
 * (Evita obligar a duplicar URL si ya está en «Información básica».)
 */
function hrefListadoCompleto(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlListadoCompleto);
  if (direct) return direct;
  return listadoBloqueHref(s);
}

/**
 * MLS (CTA): campo dedicado; si vacío → listado completo (CTA ya resuelto); si aún vacío → bloque listado.
 */
function hrefMls(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlMls);
  if (direct) return direct;
  const listadoCta = resolveAnyHref(s.ctaUrlListadoCompleto);
  if (listadoCta) return listadoCta;
  return listadoBloqueHref(s);
}

/** Tour (CTA): campo dedicado; si vacío → tour de la galería (medios). */
function hrefTourCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlTour);
  if (direct) return direct;
  return tourMediaHref(s);
}

/** Folleto (CTA): campo dedicado; si vacío → folleto de la galería. */
function hrefFolletoCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlFolleto);
  if (direct) return direct;
  return brochureMediaHref(s);
}

/**
 * Sitio web (CTA): enlace dedicado; si vacío → sitio de marca solo si el bloque marca está activo en formulario.
 */
function hrefSitioWebCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = hrefFromUserInput(s.ctaEnlaceSitioWeb);
  if (direct) return direct;
  if (!s.mostrarMarcaEnTarjeta) return null;
  return hrefFromUserInput(s.marcaSitioWeb);
}

function listadoDownloadName(s: AgenteIndividualResidencialFormState): string | null {
  const h = hrefListadoCompleto(s);
  if (!h?.startsWith("data:")) return null;
  return trim(s.listadoArchivoNombre) || null;
}

function quickFactOrNull(
  key: AgenteResQuickFactSemanticKey,
  label: string,
  raw: string,
): AgenteResQuickFactVm | null {
  const v = trim(raw);
  if (!v) return null;
  return { key, label, value: v };
}

export function mapAgenteIndividualResidencialToPreview(s: AgenteIndividualResidencialFormState): AgenteIndividualResidencialPreviewVm {
  const photos = (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, Number(s.fotoPortadaIndex) || 0), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;
  const restPhotos = photos.filter((_, i) => i !== cover);
  const secondaryPhoto1Url = restPhotos[0] ?? null;
  const secondaryPhoto2Url = restPhotos[1] ?? null;

  const pubLabel = "Venta residencial";
  const cityLine = [trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(" · ");
  const locationLine = [cityLine, trim(s.direccion)].filter(Boolean).join(" · ");

  /** Orden fijo de plantilla — solo entradas con valor en formulario. */
  const quickFacts: AgenteResQuickFactVm[] = [
    quickFactOrNull("recamaras", "Recámaras", s.recamaras),
    quickFactOrNull("banos", "Baños", s.banos),
    quickFactOrNull("tamano_interior", "Interior (ft²)", s.tamanoInteriorSqft),
    quickFactOrNull("estacionamientos", "Estacionamientos", s.estacionamientos),
    quickFactOrNull("ano_construccion", "Año", s.anoConstruccion),
    quickFactOrNull("tamano_lote", "Lote (ft²)", s.tamanoLoteSqft),
  ].filter((x): x is AgenteResQuickFactVm => x != null);

  const videoPlayable = videoPlayableUrl(s);
  const videoDataUrl = videoPlayable?.startsWith("data:") ? videoPlayable : null;
  const videoExternalHref =
    videoPlayable && !videoPlayable.startsWith("data:") ? videoPlayable : null;

  const tourMedia = tourMediaHref(s);
  const brochMedia = brochureMediaHref(s);
  const tourOrPlanVm =
    tourMedia != null
      ? { role: "tour_or_plan" as const, href: tourMedia, variant: "tour" as const }
      : brochMedia != null
        ? { role: "tour_or_plan" as const, href: brochMedia, variant: "brochure" as const }
        : { role: "tour_or_plan" as const, href: null, variant: "none" as const };

  const hasBrandBlock = Boolean(
    s.mostrarMarcaEnTarjeta &&
      (trim(s.marcaNombre) || trim(s.marcaLogoDataUrl) || hrefFromUserInput(s.marcaSitioWeb)),
  );

  const propertyRowsAll: AgenteIndividualResidencialPreviewVm["propertyRows"] = [
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
  const propertyRows = propertyRowsAll.filter((r) => trim(r.value) !== "" && r.value !== "—");

  const destacadosLabels: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (s.destacados?.[def.id]) destacadosLabels.push(def.label);
  }

  const title = trim(s.titulo);

  const llamarHref = s.permitirLlamar ? buildTelHref(digitsOnly(numeroParaLlamar(s))) : null;
  const waHref = s.permitirWhatsApp ? buildWhatsappHref(digitsOnly(numeroParaWhatsapp(s)), "") : null;
  const solicitarEmail = correoSolicitarInfo(s);
  const mailSubject = title || "Consulta";
  const mailBodyIntro = title ? `Me interesa: ${title}` : "Me interesa su anuncio.";
  const solicitarInfoHref = s.permitirSolicitarInformacion ? buildMailto(solicitarEmail, `Consulta — ${mailSubject}`, `Hola,\n\n${mailBodyIntro}`) : null;

  const programarRaw = trim(s.ctaEnlaceProgramarVisita);
  const programarVisitaHref = s.permitirProgramarVisita ? resolveAnyHref(programarRaw) : null;

  const verSitioHref = s.permitirVerSitioWeb ? hrefSitioWebCta(s) : null;

  const listadoH = hrefListadoCompleto(s);
  const mlsH = hrefMls(s);
  const tourH = hrefTourCta(s);
  const folletoH = hrefFolletoCta(s);

  const showVerListado = Boolean(s.permitirVerListadoCompleto && listadoH);
  const showVerMls = Boolean(s.permitirVerMls && mlsH);
  const showVerTour = Boolean(s.permitirVerTour && tourH);
  const showVerFolleto = Boolean(s.permitirVerFolleto && folletoH);

  const social: AgenteIndividualResidencialPreviewVm["social"] = {
    instagram: resolveAnyHref(s.socialInstagram),
    facebook: resolveAnyHref(s.socialFacebook),
    youtube: resolveAnyHref(s.socialYoutube),
    tiktok: resolveAnyHref(s.socialTiktok),
    x: resolveAnyHref(s.socialX),
    otro: resolveAnyHref(s.socialOtro),
  };

  const hasAnySocial = Boolean(
    social.instagram || social.facebook || social.youtube || social.tiktok || social.x || social.otro,
  );
  const showSocialIcons = Boolean(s.permitirVerRedes && hasAnySocial);

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
    professionalCard: {
      hasBrandBlock,
      brandName: trim(s.marcaNombre),
      brandLogoUrl: trim(s.marcaLogoDataUrl) || null,
      brandLicenseLine: trim(s.marcaLicencia) ? `Licencia de oficina: ${trim(s.marcaLicencia)}` : "",
      brandWebsiteHref: hrefFromUserInput(s.marcaSitioWeb),
      agentPhotoUrl: trim(s.agenteFotoDataUrl) || null,
      agentName: trim(s.agenteNombre),
      agentTitle: trim(s.agenteTitulo),
      agentLicenseLine: trim(s.agenteLicencia) ? `Licencia o número profesional: ${trim(s.agenteLicencia)}` : "",
      phoneDisplay: trim(s.telefonoPrincipal),
      emailDisplay: trim(s.correoPrincipal),
      areaServicioLine: trim(s.agenteAreaServicio),
      idiomasLine: trim(s.agenteIdiomas),
    },
    social,
    gallery: {
      mainPhoto: { role: "main_photo", url: heroUrl },
      secondaryPhoto1: { role: "secondary_photo_1", url: secondaryPhoto1Url },
      secondaryPhoto2: { role: "secondary_photo_2", url: secondaryPhoto2Url },
      video: {
        role: "video",
        dataUrl: videoDataUrl,
        externalHref: videoExternalHref,
      },
      tourOrPlan: tourOrPlanVm,
      showAllPhotosCta: {
        visible: photos.length > 3,
        totalPhotoCount: photos.length,
      },
    },
    propertyRows,
    destacadosLabels,
    descripcionPrincipal: trim(s.descripcionPrincipal),
    notasAdicionales: trim(s.notasAdicionales),
    hasDescription: Boolean(trim(s.descripcionPrincipal)),
    hasNotas: Boolean(trim(s.notasAdicionales)),
    contactRail: {
      showLlamar: Boolean(s.permitirLlamar && llamarHref),
      llamarHref,
      showWhatsapp: Boolean(s.permitirWhatsApp && waHref),
      whatsappHref: waHref,
      showSolicitarInformacion: Boolean(s.permitirSolicitarInformacion && solicitarInfoHref),
      solicitarInformacionHref: solicitarInfoHref,
      showProgramarVisita: Boolean(s.permitirProgramarVisita && programarVisitaHref),
      programarVisitaHref,
      showVerSitioWeb: Boolean(s.permitirVerSitioWeb && verSitioHref),
      verSitioWebHref: verSitioHref,
      showVerListado,
      verListadoHref: listadoH,
      listadoDownloadName: listadoDownloadName(s),
      showVerMls,
      verMlsHref: mlsH,
      showVerTour,
      verTourHref: tourH,
      showVerFolleto,
      verFolletoHref: folletoH,
      showSocialIcons,
    },
    extras: {
      openHouseSummary,
      asesorBlock,
      mapQuery,
    },
  };
}
