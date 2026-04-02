/**
 * Formato y resolución de enlaces para la vista previa — lee solo `AgenteIndividualResidencialFormState`.
 * Sin capa VM intermedia (patrón Autos: datos de aplicación = fuente de verdad).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "../schema/agenteResidencialTipoMeta";
import { digitsOnly } from "../application/utils/phoneMask";

export function trim(s: unknown): string {
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

export function formatEstadoAnuncioLabel(s: AgenteIndividualResidencialFormState): string {
  return STATUS_LABEL[s.estadoAnuncio] ?? STATUS_LABEL.disponible;
}

/** Fixed lane line under title; matches `tipoPublicacionFijo` for this Negocio agente-individual residencial flow. */
export function formatTipoPublicacionFijoLine(s: AgenteIndividualResidencialFormState): string {
  if (s.tipoPublicacionFijo === "venta_residencial") return "Venta residencial";
  return "Venta residencial";
}

export function formatPrecioUsd(raw: string): string {
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

export function hrefFromUserInput(t: string): string | null {
  const s = trim(t);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return null;
}

export function resolveAnyHref(raw: string): string | null {
  const t = trim(raw);
  if (!t) return null;
  if (t.startsWith("data:")) return t;
  if (t.startsWith("mailto:")) return t;
  return hrefFromUserInput(t);
}

export function listadoBloqueHref(s: AgenteIndividualResidencialFormState): string | null {
  const url = hrefFromUserInput(s.listadoUrl);
  if (url) return url;
  const f = trim(s.listadoArchivoDataUrl);
  if (f.startsWith("data:")) return f;
  return null;
}

export function formatTipoPropiedadLine(s: AgenteIndividualResidencialFormState): string {
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

export function buildLocationLine(s: AgenteIndividualResidencialFormState): string {
  const cityLine = [trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(" · ");
  return [cityLine, trim(s.direccion)].filter(Boolean).join(" · ");
}

export function buildMapQuery(s: AgenteIndividualResidencialFormState): string {
  return [trim(s.direccion), trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(", ");
}

export type PropertyDetailRow = { label: string; value: string };

export function buildPropertyDetailRows(s: AgenteIndividualResidencialFormState): PropertyDetailRow[] {
  const all: PropertyDetailRow[] = [
    { label: "Tipo de propiedad", value: formatTipoPropiedadLine(s) },
    { label: "Recámaras", value: trim(s.recamaras) || "—" },
    { label: "Baños", value: trim(s.banos) || "—" },
    { label: "Medios baños", value: trim(s.mediosBanos) || "—" },
    { label: "Tamaño interior", value: trim(s.tamanoInteriorSqft) || "—" },
    { label: "Tamaño del lote", value: trim(s.tamanoLoteSqft) || "—" },
    { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
    { label: "Año de construcción", value: trim(s.anoConstruccion) || "—" },
    { label: "Condición", value: COND_LABEL[s.condicionPropiedad] ?? "—" },
  ];
  return all.filter((r) => trim(r.value) !== "" && r.value !== "—");
}

export function buildDestacadosLabels(s: AgenteIndividualResidencialFormState): string[] {
  const out: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (s.destacados?.[def.id]) out.push(def.label);
  }
  return out;
}

export function videoPlayableUrl(s: AgenteIndividualResidencialFormState): string | null {
  const u = trim(s.videoUrl) || trim(s.videoDataUrl);
  return u || null;
}

export function tourMediaHref(s: AgenteIndividualResidencialFormState): string | null {
  const u = trim(s.tourUrl) || trim(s.tourDataUrl);
  if (!u) return null;
  return resolveAnyHref(u);
}

export function brochureMediaHref(s: AgenteIndividualResidencialFormState): string | null {
  const u = trim(s.brochureUrl) || trim(s.brochureDataUrl);
  if (!u) return null;
  return resolveAnyHref(u);
}

export type AgenteResGalleryModel = {
  mainUrl: string | null;
  secondary1: string | null;
  secondary2: string | null;
  videoDataUrl: string | null;
  videoExternalHref: string | null;
  tourOrPlan: { href: string | null; variant: "tour" | "brochure" | "none" };
  totalPhotos: number;
  showAllPhotosPill: boolean;
};

export function buildGalleryModel(s: AgenteIndividualResidencialFormState): AgenteResGalleryModel {
  const photos = (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, Number(s.fotoPortadaIndex) || 0), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;
  const restPhotos = photos.filter((_, i) => i !== cover);
  const secondary1 = restPhotos[0] ?? null;
  const secondary2 = restPhotos[1] ?? null;

  const videoPlayable = videoPlayableUrl(s);
  const videoDataUrl = videoPlayable?.startsWith("data:") ? videoPlayable : null;
  const videoExternalHref = videoPlayable && !videoPlayable.startsWith("data:") ? videoPlayable : null;

  const tourMedia = tourMediaHref(s);
  const brochMedia = brochureMediaHref(s);
  const tourOrPlan =
    tourMedia != null
      ? { href: tourMedia, variant: "tour" as const }
      : brochMedia != null
        ? { href: brochMedia, variant: "brochure" as const }
        : { href: null, variant: "none" as const };

  return {
    mainUrl: heroUrl,
    secondary1,
    secondary2,
    videoDataUrl,
    videoExternalHref,
    tourOrPlan,
    totalPhotos: photos.length,
    showAllPhotosPill: photos.length > 3,
  };
}

export type QuickFactKey =
  | "recamaras"
  | "banos"
  | "tamano_interior"
  | "estacionamientos"
  | "ano_construccion"
  | "tamano_lote";

export type QuickFactItem = { key: QuickFactKey; label: string; value: string };

export function buildQuickFacts(s: AgenteIndividualResidencialFormState): QuickFactItem[] {
  const rows: Array<[QuickFactKey, string, string]> = [
    ["recamaras", "Recámaras", s.recamaras],
    ["banos", "Baños", s.banos],
    ["tamano_interior", "Interior (ft²)", s.tamanoInteriorSqft],
    ["estacionamientos", "Estacionamientos", s.estacionamientos],
    ["ano_construccion", "Año", s.anoConstruccion],
    ["tamano_lote", "Lote (ft²)", s.tamanoLoteSqft],
  ];
  const out: QuickFactItem[] = [];
  for (const [key, label, raw] of rows) {
    const v = trim(raw);
    if (v) out.push({ key, label, value: v });
  }
  return out;
}

function numeroParaLlamar(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaNumeroLlamadas) || trim(s.telefonoPrincipal);
}

function numeroParaWhatsapp(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaNumeroWhatsapp) || trim(s.telefonoPrincipal);
}

function correoSolicitarInfo(s: AgenteIndividualResidencialFormState): string {
  return trim(s.ctaCorreoSolicitarInfo) || trim(s.correoPrincipal);
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

function hrefListadoCompleto(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlListadoCompleto);
  if (direct) return direct;
  return listadoBloqueHref(s);
}

function hrefMls(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlMls);
  if (direct) return direct;
  const listadoCta = resolveAnyHref(s.ctaUrlListadoCompleto);
  if (listadoCta) return listadoCta;
  return listadoBloqueHref(s);
}

function hrefTourCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlTour);
  if (direct) return direct;
  return tourMediaHref(s);
}

function hrefFolletoCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = resolveAnyHref(s.ctaUrlFolleto);
  if (direct) return direct;
  return brochureMediaHref(s);
}

function hrefSitioWebCta(s: AgenteIndividualResidencialFormState): string | null {
  const direct = hrefFromUserInput(s.ctaEnlaceSitioWeb);
  if (direct) return direct;
  /** Fallback `marcaSitioWeb` for CTA only; visibility of the marca block is separate (`mostrarMarcaEnTarjeta`). */
  return hrefFromUserInput(s.marcaSitioWeb);
}

export function listadoDownloadName(s: AgenteIndividualResidencialFormState): string | null {
  const h = hrefListadoCompleto(s);
  if (!h?.startsWith("data:")) return null;
  return trim(s.listadoArchivoNombre) || null;
}

export function hasBrandBlockVisible(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(
    s.mostrarMarcaEnTarjeta &&
      (trim(s.marcaNombre) || trim(s.marcaLogoDataUrl) || hrefFromUserInput(s.marcaSitioWeb)),
  );
}

export type AgenteResContactModel = {
  llamarHref: string | null;
  whatsappHref: string | null;
  solicitarInfoHref: string | null;
  programarVisitaHref: string | null;
  verSitioWebHref: string | null;
  verListadoHref: string | null;
  listadoDownloadName: string | null;
  verMlsHref: string | null;
  verTourHref: string | null;
  verFolletoHref: string | null;
  showLlamar: boolean;
  showWhatsapp: boolean;
  showSolicitarInformacion: boolean;
  showProgramarVisita: boolean;
  showVerSitioWeb: boolean;
  showVerListado: boolean;
  showVerMls: boolean;
  showVerTour: boolean;
  showVerFolleto: boolean;
  showSocialIcons: boolean;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
  socialX: string | null;
  socialOtro: string | null;
};

export function buildContactModel(s: AgenteIndividualResidencialFormState): AgenteResContactModel {
  const title = trim(s.titulo);
  const mailSubject = title || "Consulta";
  const mailBodyIntro = title ? `Me interesa: ${title}` : "Me interesa su anuncio.";

  const llamarHref = s.permitirLlamar ? buildTelHref(digitsOnly(numeroParaLlamar(s))) : null;
  const waHref = s.permitirWhatsApp ? buildWhatsappHref(digitsOnly(numeroParaWhatsapp(s)), "") : null;
  const solicitarEmail = correoSolicitarInfo(s);
  const solicitarInfoHref = s.permitirSolicitarInformacion
    ? buildMailto(solicitarEmail, `Consulta — ${mailSubject}`, `Hola,\n\n${mailBodyIntro}`)
    : null;

  const programarRaw = trim(s.ctaEnlaceProgramarVisita);
  const programarVisitaHref = s.permitirProgramarVisita ? resolveAnyHref(programarRaw) : null;

  const verSitioHref = s.permitirVerSitioWeb ? hrefSitioWebCta(s) : null;
  const listadoH = hrefListadoCompleto(s);
  const mlsH = hrefMls(s);
  const tourH = hrefTourCta(s);
  const folletoH = hrefFolletoCta(s);

  const socialInstagram = resolveAnyHref(s.socialInstagram);
  const socialFacebook = resolveAnyHref(s.socialFacebook);
  const socialYoutube = resolveAnyHref(s.socialYoutube);
  const socialTiktok = resolveAnyHref(s.socialTiktok);
  const socialX = resolveAnyHref(s.socialX);
  const socialOtro = resolveAnyHref(s.socialOtro);
  const hasAnySocial = Boolean(
    socialInstagram || socialFacebook || socialYoutube || socialTiktok || socialX || socialOtro,
  );

  return {
    llamarHref,
    whatsappHref: waHref,
    solicitarInfoHref,
    programarVisitaHref,
    verSitioWebHref: verSitioHref,
    verListadoHref: listadoH,
    listadoDownloadName: listadoDownloadName(s),
    verMlsHref: mlsH,
    verTourHref: tourH,
    verFolletoHref: folletoH,
    showLlamar: Boolean(s.permitirLlamar && llamarHref),
    showWhatsapp: Boolean(s.permitirWhatsApp && waHref),
    showSolicitarInformacion: Boolean(s.permitirSolicitarInformacion && solicitarInfoHref),
    showProgramarVisita: Boolean(s.permitirProgramarVisita && programarVisitaHref),
    showVerSitioWeb: Boolean(s.permitirVerSitioWeb && verSitioHref),
    showVerListado: Boolean(s.permitirVerListadoCompleto && listadoH),
    showVerMls: Boolean(s.permitirVerMls && mlsH),
    showVerTour: Boolean(s.permitirVerTour && tourH),
    showVerFolleto: Boolean(s.permitirVerFolleto && folletoH),
    showSocialIcons: Boolean(s.permitirVerRedes && hasAnySocial),
    socialInstagram,
    socialFacebook,
    socialYoutube,
    socialTiktok,
    socialX,
    socialOtro,
  };
}

export function buildOpenHouseSummary(s: AgenteIndividualResidencialFormState): string | null {
  const openParts: string[] = [];
  if (s.extraOpenHouse) {
    if (trim(s.openHouseFecha)) openParts.push(`Fecha: ${trim(s.openHouseFecha)}`);
    const r = [trim(s.openHouseInicio), trim(s.openHouseFin)].filter(Boolean);
    if (r.length) openParts.push(`Horario: ${r.join(" – ")}`);
    if (trim(s.openHouseNotas)) openParts.push(trim(s.openHouseNotas));
  }
  return s.extraOpenHouse && openParts.length ? openParts.join("\n") : null;
}

export type AsesorBlock = { name: string; phone: string; email: string };

export function buildAsesorBlock(s: AgenteIndividualResidencialFormState): AsesorBlock | null {
  if (!s.extraAsesorFinanciero || !trim(s.asesorNombre)) return null;
  return {
    name: trim(s.asesorNombre),
    phone: trim(s.asesorTelefono),
    email: trim(s.asesorEmail),
  };
}
