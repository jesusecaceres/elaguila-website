/**
 * Formato y resolución de enlaces para la vista previa — lee solo `AgenteIndividualResidencialFormState`.
 * Sin capa VM intermedia (patrón Autos: datos de aplicación = fuente de verdad).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import {
  AGENTE_RES_DESTACADOS_DEFS,
  AGENTE_RES_MAX_OPEN_HOUSE_SLOTS,
  type AgenteResOpenHouseSlot,
  type AgenteResidencialDestacadoId,
} from "../schema/agenteIndividualResidencialFormState";
import {
  labelForSubtipo,
  labelForSubtipoEn,
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
} from "../schema/agenteResidencialTipoMeta";
import {
  COMERCIAL_DESTACADO_EN,
  COMERCIAL_DESTACADOS_DEFS,
  COMERCIAL_TIPO_LABEL_EN,
  COMERCIAL_TIPO_OPCIONES,
  labelComercialSubtipo,
  labelComercialSubtipoEn,
  TERRENO_DESTACADO_EN,
  TERRENO_DESTACADOS_DEFS,
  TERRENO_TIPO_LABEL_EN,
  TERRENO_TIPO_OPCIONES,
  labelTerrenoSubtipo,
  labelTerrenoSubtipoEn,
  type ComercialDestacadoId,
  type TerrenoDestacadoId,
} from "../schema/agenteComercialTerrenoMeta";
import { digitsOnly, formatUsPhoneDisplay } from "../application/utils/phoneMask";

export function trim(s: unknown): string {
  if (s == null) return "";
  if (typeof s === "string") return s.trim();
  return String(s).trim();
}

/** Preview rail display only — keeps `tel:` / WhatsApp hrefs on raw digits elsewhere. */
export function formatPreviewPhoneDisplay(raw: string): string {
  const s = trim(raw);
  if (!s) return "";
  const d = digitsOnly(s);
  if (d.length === 10) return formatUsPhoneDisplay(d);
  return s;
}

/** All gallery photo URLs in form order (user ordering). */
export function galleryPhotoUrlsOrdered(s: AgenteIndividualResidencialFormState): string[] {
  return (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map((u) => trim(String(u))).filter(Boolean);
}

/** Indices in `fotosDataUrls` for thumbnails after the cover (same logic as `buildGalleryModel` rest). */
export function restPhotoIndicesAfterCover(s: AgenteIndividualResidencialFormState): number[] {
  const photos = galleryPhotoUrlsOrdered(s);
  if (!photos.length) return [];
  const cover = Math.min(Math.max(0, Number(s.fotoPortadaIndex) || 0), photos.length - 1);
  return photos.map((_, i) => i).filter((i) => i !== cover);
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

export type AgenteResPreviewLocale = "es" | "en";

export function formatEstadoAnuncioLabel(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): string {
  if (locale === "en") {
    const EN: Record<AgenteIndividualResidencialFormState["estadoAnuncio"], string> = {
      disponible: "Available",
      pendiente: "Pending",
      bajo_contrato: "Under contract",
      vendido: "Sold",
    };
    return EN[s.estadoAnuncio] ?? EN.disponible;
  }
  return STATUS_LABEL[s.estadoAnuncio] ?? STATUS_LABEL.disponible;
}

/** Línea fija bajo el título según categoría BR (mismo slot de UI). */
export function formatTipoPublicacionFijoLine(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): string {
  if (s.categoriaPropiedad === "comercial") {
    return locale === "en" ? "Commercial sale" : "Venta comercial";
  }
  if (s.categoriaPropiedad === "terreno_lote") {
    return locale === "en" ? "Land / lot sale" : "Venta terreno / lote";
  }
  return locale === "en" ? "Residential sale" : "Venta residencial";
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

function formatResidencialTipoPropiedadLine(s: AgenteIndividualResidencialFormState, locale: AgenteResPreviewLocale): string {
  const opt = TIPO_PROPIEDAD_OPCIONES.find((x) => x.value === s.tipoPropiedadCodigo);
  const base = locale === "en" ? TIPO_PROPIEDAD_LABEL_EN[s.tipoPropiedadCodigo] ?? opt?.label ?? "" : opt?.label ?? "";
  let sub =
    locale === "en"
      ? labelForSubtipoEn(s.tipoPropiedadCodigo, s.subtipoPropiedad)
      : labelForSubtipo(s.tipoPropiedadCodigo, s.subtipoPropiedad);
  if (!sub && trim(s.subtipoPropiedad)) {
    sub = trim(s.subtipoPropiedad);
  }
  return [base, sub].filter(Boolean).join(" · ") || "—";
}

export function formatComercialTipoLine(s: AgenteIndividualResidencialFormState, locale: AgenteResPreviewLocale): string {
  const opt = COMERCIAL_TIPO_OPCIONES.find((x) => x.value === s.comercialTipoCodigo);
  const base =
    locale === "en" ? COMERCIAL_TIPO_LABEL_EN[s.comercialTipoCodigo] ?? opt?.label ?? "" : opt?.label ?? "";
  const sub =
    locale === "en"
      ? labelComercialSubtipoEn(s.comercialTipoCodigo, s.comercialSubtipoPropiedad)
      : labelComercialSubtipo(s.comercialTipoCodigo, s.comercialSubtipoPropiedad);
  return [base, sub].filter(Boolean).join(" · ") || "—";
}

export function formatTerrenoTipoLine(s: AgenteIndividualResidencialFormState, locale: AgenteResPreviewLocale): string {
  const opt = TERRENO_TIPO_OPCIONES.find((x) => x.value === s.terrenoTipoCodigo);
  const base = locale === "en" ? TERRENO_TIPO_LABEL_EN[s.terrenoTipoCodigo] ?? opt?.label ?? "" : opt?.label ?? "";
  const sub =
    locale === "en"
      ? labelTerrenoSubtipoEn(s.terrenoTipoCodigo, s.terrenoSubtipoPropiedad)
      : labelTerrenoSubtipo(s.terrenoTipoCodigo, s.terrenoSubtipoPropiedad);
  return [base, sub].filter(Boolean).join(" · ") || "—";
}

export function formatTipoPropiedadLine(s: AgenteIndividualResidencialFormState, locale: AgenteResPreviewLocale = "es"): string {
  if (s.categoriaPropiedad === "comercial") return formatComercialTipoLine(s, locale);
  if (s.categoriaPropiedad === "terreno_lote") return formatTerrenoTipoLine(s, locale);
  return formatResidencialTipoPropiedadLine(s, locale);
}

export function buildLocationLine(s: AgenteIndividualResidencialFormState): string {
  const cityLine = [trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(" · ");
  return [cityLine, trim(s.direccion)].filter(Boolean).join(" · ");
}

export function buildMapQuery(s: AgenteIndividualResidencialFormState): string {
  return [trim(s.direccion), trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(", ");
}

export type PropertyDetailRow = { label: string; value: string };

const COND_LABEL_EN: Record<AgenteIndividualResidencialFormState["condicionPropiedad"], string> = {
  excelente: "Excellent",
  buena: "Good",
  regular: "Fair",
  necesita_reparacion: "Needs work",
};

const DESTACADO_EN: Record<(typeof AGENTE_RES_DESTACADOS_DEFS)[number]["id"], string> = {
  piscina: "Pool",
  patio: "Patio",
  terraza: "Terrace",
  balcon: "Balcony",
  chimenea: "Fireplace",
  oficina: "Office",
  sotano: "Basement",
  garaje: "Garage",
  porton_electrico: "Electric gate",
  adu: "ADU",
  remodelada: "Remodeled",
  nueva_construccion: "New construction",
  vista: "View",
  comunidad_cerrada: "Gated community",
  paneles_solares: "Solar panels",
};

/** Checkbox label in the publish form (same EN strings as preview `DESTACADO_EN`). */
export function labelDestacadoForPublishStep(
  id: AgenteResidencialDestacadoId,
  locale: AgenteResPreviewLocale,
): string {
  const def = AGENTE_RES_DESTACADOS_DEFS.find((d) => d.id === id);
  if (!def) return "";
  return locale === "en" ? DESTACADO_EN[id] : def.label;
}

export function labelDestacadoComercialForPublishStep(
  id: ComercialDestacadoId,
  locale: AgenteResPreviewLocale,
): string {
  const def = COMERCIAL_DESTACADOS_DEFS.find((d) => d.id === id);
  if (!def) return "";
  return locale === "en" ? COMERCIAL_DESTACADO_EN[id] : def.label;
}

export function labelDestacadoTerrenoForPublishStep(
  id: TerrenoDestacadoId,
  locale: AgenteResPreviewLocale,
): string {
  const def = TERRENO_DESTACADOS_DEFS.find((d) => d.id === id);
  if (!def) return "";
  return locale === "en" ? TERRENO_DESTACADO_EN[id] : def.label;
}

function buildResidencialPropertyDetailRows(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale,
): PropertyDetailRow[] {
  const condLab = locale === "en" ? COND_LABEL_EN[s.condicionPropiedad] : COND_LABEL[s.condicionPropiedad];
  const L =
    locale === "en"
      ? {
          tipo: "Property type",
          rec: "Bedrooms",
          ban: "Baths",
          med: "Half baths",
          interior: "Interior size",
          lote: "Lot size",
          est: "Parking",
          ano: "Year built",
          cond: "Condition",
        }
      : {
          tipo: "Tipo de propiedad",
          rec: "Recámaras",
          ban: "Baños",
          med: "Medios baños",
          interior: "Tamaño interior",
          lote: "Tamaño del lote",
          est: "Estacionamientos",
          ano: "Año de construcción",
          cond: "Condición",
        };
  const all: PropertyDetailRow[] = [
    { label: L.tipo, value: formatTipoPropiedadLine(s, locale) },
    { label: L.rec, value: trim(s.recamaras) || "—" },
    { label: L.ban, value: trim(s.banos) || "—" },
    { label: L.med, value: trim(s.mediosBanos) || "—" },
    { label: L.interior, value: trim(s.tamanoInteriorSqft) || "—" },
    { label: L.lote, value: trim(s.tamanoLoteSqft) || "—" },
    { label: L.est, value: trim(s.estacionamientos) || "—" },
    { label: L.ano, value: trim(s.anoConstruccion) || "—" },
    { label: L.cond, value: condLab ?? "—" },
  ];
  return all.filter((r) => trim(r.value) !== "" && r.value !== "—");
}

function buildCommercialPropertyDetailRows(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale,
): PropertyDetailRow[] {
  const condLab = locale === "en" ? COND_LABEL_EN[s.condicionPropiedad] : COND_LABEL[s.condicionPropiedad];
  const si = locale === "en" ? "Yes" : "Sí";
  const L =
    locale === "en"
      ? {
          tipo: "Property type",
          uso: "Commercial use",
          interior: "Interior size",
          lote: "Lot size",
          oficinas: "Offices",
          ban: "Baths",
          niveles: "Levels",
          est: "Parking",
          zona: "Zoning",
          cond: "Condition",
          carga: "Loading access",
        }
      : {
          tipo: "Tipo de propiedad",
          uso: "Uso comercial",
          interior: "Tamaño interior",
          lote: "Tamaño del lote",
          oficinas: "Oficinas",
          ban: "Baños",
          niveles: "Niveles",
          est: "Estacionamientos",
          zona: "Zonificación",
          cond: "Condición",
          carga: "Acceso de carga",
        };
  const rows: PropertyDetailRow[] = [
    { label: L.tipo, value: formatComercialTipoLine(s, locale) },
  ];
  if (trim(s.comercialUso)) rows.push({ label: L.uso, value: trim(s.comercialUso) });
  if (trim(s.tamanoInteriorSqft)) rows.push({ label: L.interior, value: trim(s.tamanoInteriorSqft) });
  if (trim(s.tamanoLoteSqft)) rows.push({ label: L.lote, value: trim(s.tamanoLoteSqft) });
  if (trim(s.comercialOficinas)) rows.push({ label: L.oficinas, value: trim(s.comercialOficinas) });
  if (trim(s.banos)) rows.push({ label: L.ban, value: trim(s.banos) });
  if (trim(s.comercialNiveles)) rows.push({ label: L.niveles, value: trim(s.comercialNiveles) });
  if (trim(s.estacionamientos)) rows.push({ label: L.est, value: trim(s.estacionamientos) });
  if (trim(s.comercialZonificacion)) rows.push({ label: L.zona, value: trim(s.comercialZonificacion) });
  rows.push({ label: L.cond, value: condLab ?? "—" });
  if (s.comercialAccesoCarga) rows.push({ label: L.carga, value: si });
  return rows.filter((r) => trim(r.value) !== "" && r.value !== "—");
}

function buildTerrenoPropertyDetailRows(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale,
): PropertyDetailRow[] {
  const si = locale === "en" ? "Yes" : "Sí";
  const L =
    locale === "en"
      ? {
          tipo: "Property type",
          lote: "Lot size",
          uso: "Use / zoning",
          acceso: "Access",
          servicios: "Utilities / services",
          topo: "Topography",
          listo: "Ready to build",
          cercado: "Fenced",
        }
      : {
          tipo: "Tipo de propiedad",
          lote: "Tamaño del lote",
          uso: "Uso / zonificación",
          acceso: "Acceso",
          servicios: "Servicios disponibles",
          topo: "Topografía",
          listo: "Listo para construir",
          cercado: "Cercado",
        };
  const rows: PropertyDetailRow[] = [{ label: L.tipo, value: formatTerrenoTipoLine(s, locale) }];
  if (trim(s.tamanoLoteSqft)) rows.push({ label: L.lote, value: trim(s.tamanoLoteSqft) });
  if (trim(s.terrenoUsoZonificacion)) rows.push({ label: L.uso, value: trim(s.terrenoUsoZonificacion) });
  if (trim(s.terrenoAcceso)) rows.push({ label: L.acceso, value: trim(s.terrenoAcceso) });
  if (trim(s.terrenoServicios)) rows.push({ label: L.servicios, value: trim(s.terrenoServicios) });
  if (trim(s.terrenoTopografia)) rows.push({ label: L.topo, value: trim(s.terrenoTopografia) });
  if (s.terrenoListoConstruir) rows.push({ label: L.listo, value: si });
  if (s.terrenoCercado) rows.push({ label: L.cercado, value: si });
  return rows.filter((r) => trim(r.value) !== "" && r.value !== "—");
}

export function buildPropertyDetailRows(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): PropertyDetailRow[] {
  if (s.categoriaPropiedad === "comercial") return buildCommercialPropertyDetailRows(s, locale);
  if (s.categoriaPropiedad === "terreno_lote") return buildTerrenoPropertyDetailRows(s, locale);
  return buildResidencialPropertyDetailRows(s, locale);
}

export function buildDestacadosLabels(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): string[] {
  if (s.categoriaPropiedad === "comercial") {
    const out: string[] = [];
    for (const def of COMERCIAL_DESTACADOS_DEFS) {
      if (s.destacadosComercial?.[def.id]) {
        out.push(locale === "en" ? COMERCIAL_DESTACADO_EN[def.id] : def.label);
      }
    }
    return out;
  }
  if (s.categoriaPropiedad === "terreno_lote") {
    const out: string[] = [];
    for (const def of TERRENO_DESTACADOS_DEFS) {
      if (s.destacadosTerreno?.[def.id]) {
        out.push(locale === "en" ? TERRENO_DESTACADO_EN[def.id] : def.label);
      }
    }
    return out;
  }
  const out: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (s.destacados?.[def.id]) {
      out.push(locale === "en" ? DESTACADO_EN[def.id] : def.label);
    }
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
  | "tamano_lote"
  | "oficinas"
  | "niveles";

export type QuickFactItem = { key: QuickFactKey; label: string; value: string };

export function buildQuickFacts(s: AgenteIndividualResidencialFormState, locale: AgenteResPreviewLocale = "es"): QuickFactItem[] {
  const out: QuickFactItem[] = [];
  const pushRows = (rows: Array<[QuickFactKey, string, string]>) => {
    for (const [key, label, raw] of rows) {
      const v = trim(raw);
      if (v) out.push({ key, label, value: v });
    }
  };

  if (s.categoriaPropiedad === "comercial") {
    pushRows(
      locale === "en"
        ? [
            ["tamano_interior", "Interior (sq ft)", s.tamanoInteriorSqft],
            ["tamano_lote", "Lot (sq ft)", s.tamanoLoteSqft],
            ["oficinas", "Offices", s.comercialOficinas],
            ["banos", "Baths", s.banos],
            ["niveles", "Levels", s.comercialNiveles],
            ["estacionamientos", "Parking", s.estacionamientos],
          ]
        : [
            ["tamano_interior", "Interior (ft²)", s.tamanoInteriorSqft],
            ["tamano_lote", "Lote (ft²)", s.tamanoLoteSqft],
            ["oficinas", "Oficinas", s.comercialOficinas],
            ["banos", "Baños", s.banos],
            ["niveles", "Niveles", s.comercialNiveles],
            ["estacionamientos", "Estacionamientos", s.estacionamientos],
          ],
    );
    return out;
  }

  if (s.categoriaPropiedad === "terreno_lote") {
    pushRows(
      locale === "en"
        ? [["tamano_lote", "Lot (sq ft)", s.tamanoLoteSqft]]
        : [["tamano_lote", "Lote (ft²)", s.tamanoLoteSqft]],
    );
    return out;
  }

  pushRows(
    locale === "en"
      ? [
          ["recamaras", "Beds", s.recamaras],
          ["banos", "Baths", s.banos],
          ["tamano_interior", "Interior (sq ft)", s.tamanoInteriorSqft],
          ["estacionamientos", "Parking", s.estacionamientos],
          ["ano_construccion", "Year", s.anoConstruccion],
          ["tamano_lote", "Lot (sq ft)", s.tamanoLoteSqft],
        ]
      : [
          ["recamaras", "Recámaras", s.recamaras],
          ["banos", "Baños", s.banos],
          ["tamano_interior", "Interior (ft²)", s.tamanoInteriorSqft],
          ["estacionamientos", "Estacionamientos", s.estacionamientos],
          ["ano_construccion", "Año", s.anoConstruccion],
          ["tamano_lote", "Lote (ft²)", s.tamanoLoteSqft],
        ],
  );
  return out;
}

export function effectiveAgenteTelefonoPersonal(s: AgenteIndividualResidencialFormState): string {
  return trim(s.agenteTelefonoPersonal) || trim(s.telefonoPrincipal);
}

export function effectiveAgenteTelefonoOficina(s: AgenteIndividualResidencialFormState): string {
  return trim(s.agenteTelefonoOficina);
}

export function effectiveAgente2TelefonoPersonal(s: AgenteIndividualResidencialFormState): string {
  return trim(s.agente2TelefonoPersonal) || trim(s.agente2Telefono);
}

function primaryCallDigitsFromFields(
  personalRaw: string,
  officeRaw: string,
  choice: AgenteIndividualResidencialFormState["agentePrincipalLlamadas"],
): string {
  const p = digitsOnly(personalRaw);
  const o = digitsOnly(officeRaw);
  const pOk = p.length >= 10;
  const oOk = o.length >= 10;
  if (pOk && oOk) return choice === "oficina" ? o : p;
  if (pOk) return p;
  if (oOk) return o;
  return "";
}

/** Dígitos para el CTA «Llamar» del rail (tras override `ctaNumeroLlamadas`). */
export function primaryAgentCallDigits(s: AgenteIndividualResidencialFormState): string {
  return primaryCallDigitsFromFields(
    effectiveAgenteTelefonoPersonal(s),
    effectiveAgenteTelefonoOficina(s),
    s.agentePrincipalLlamadas,
  );
}

function numeroParaLlamar(s: AgenteIndividualResidencialFormState): string {
  const cta = trim(s.ctaNumeroLlamadas);
  if (digitsOnly(cta).length >= 10) return cta;
  const resolved = primaryAgentCallDigits(s);
  return resolved ? resolved : "";
}

/** WhatsApp del rail: solo override CTA o campo WhatsApp del agente (sin fallback a más números). */
function numeroParaWhatsapp(s: AgenteIndividualResidencialFormState): string {
  const cta = trim(s.ctaNumeroWhatsapp);
  if (digitsOnly(cta).length >= 10) return cta;
  const wa = trim(s.agenteWhatsapp);
  return digitsOnly(wa).length >= 10 ? wa : "";
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
  const agente = hrefFromUserInput(s.agenteSitioWeb);
  if (agente) return agente;
  /** Fallback `marcaSitioWeb` for CTA only; visibility of the marca block is separate (`mostrarMarcaEnTarjeta`). */
  return hrefFromUserInput(s.marcaSitioWeb);
}

/** Enlace wa.me para vista previa (mismo criterio de dígitos que el rail). */
export function previewWhatsappClickHref(raw: string): string | null {
  return buildWhatsappHref(digitsOnly(trim(raw)), "");
}

export function listadoDownloadName(s: AgenteIndividualResidencialFormState): string | null {
  const h = hrefListadoCompleto(s);
  if (!h?.startsWith("data:")) return null;
  return trim(s.listadoArchivoNombre) || null;
}

export function hasBrandBlockVisible(s: AgenteIndividualResidencialFormState): boolean {
  return Boolean(
    s.mostrarMarcaEnTarjeta &&
      (trim(s.marcaNombre) ||
        trim(s.marcaLogoDataUrl) ||
        trim(s.marcaLicencia) ||
        hrefFromUserInput(s.marcaSitioWeb)),
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

export function normalizeOpenHouseSlots(s: AgenteIndividualResidencialFormState): AgenteResOpenHouseSlot[] {
  if (Array.isArray(s.openHouseSlots) && s.openHouseSlots.length > 0) {
    return s.openHouseSlots.slice(0, AGENTE_RES_MAX_OPEN_HOUSE_SLOTS);
  }
  if (s.extraOpenHouse && (trim(s.openHouseFecha) || trim(s.openHouseInicio) || trim(s.openHouseFin) || trim(s.openHouseNotas))) {
    return [
      {
        fecha: s.openHouseFecha,
        inicio: s.openHouseInicio,
        fin: s.openHouseFin,
        notas: s.openHouseNotas,
      },
    ];
  }
  return [];
}

function formatOpenHouseDateForPreview(raw: string, locale: AgenteResPreviewLocale): string {
  const t = trim(raw);
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-US", { dateStyle: "medium" }).format(d);
      } catch {
        return t;
      }
    }
  }
  return t;
}

/** Un resumen por fecha (texto para mini tarjeta). */
export function buildOpenHouseSlotSummaries(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): string[] {
  const slots = normalizeOpenHouseSlots(s);
  const labDate = locale === "en" ? "Date:" : "Fecha:";
  const labHours = locale === "en" ? "Hours:" : "Horario:";
  const out: string[] = [];
  for (const slot of slots) {
    const parts: string[] = [];
    const fechaDisp = formatOpenHouseDateForPreview(slot.fecha, locale);
    if (fechaDisp) parts.push(`${labDate} ${fechaDisp}`);
    const r = [trim(slot.inicio), trim(slot.fin)].filter(Boolean);
    if (r.length) parts.push(`${labHours} ${r.join(" – ")}`);
    if (trim(slot.notas)) parts.push(trim(slot.notas));
    if (parts.length) out.push(parts.join("\n"));
  }
  return out;
}

/** Compat: primer bloque o varios unidos (p. ej. metadatos). */
export function buildOpenHouseSummary(
  s: AgenteIndividualResidencialFormState,
  locale: AgenteResPreviewLocale = "es",
): string | null {
  const summaries = buildOpenHouseSlotSummaries(s, locale);
  if (!summaries.length) return null;
  return summaries.join("\n\n—\n\n");
}

export function hasSecondAgentRailContent(s: AgenteIndividualResidencialFormState): boolean {
  if (!s.mostrarSegundoAgente) return false;
  return Boolean(
    trim(s.agente2Nombre) ||
      trim(s.agente2FotoDataUrl) ||
      trim(s.agente2Titulo) ||
      trim(s.agente2Licencia) ||
      trim(s.agente2Telefono) ||
      trim(s.agente2TelefonoPersonal) ||
      trim(s.agente2TelefonoOficina) ||
      trim(s.agente2Whatsapp) ||
      trim(s.agente2SitioWeb) ||
      trim(s.agente2Correo) ||
      trim(s.agente2SocialInstagram) ||
      trim(s.agente2SocialFacebook) ||
      trim(s.agente2SocialYoutube) ||
      trim(s.agente2SocialTiktok) ||
      trim(s.agente2SocialX) ||
      trim(s.agente2SocialOtro),
  );
}

export type BrokerSupportBlock = {
  name: string;
  title: string;
  license: string;
  fotoDataUrl: string | null;
  personalPhone: string;
  officePhone: string;
  whatsappHref: string | null;
  email: string;
  website: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
  socialX: string | null;
  socialOtro: string | null;
};

export function buildBrokerSupportBlock(s: AgenteIndividualResidencialFormState): BrokerSupportBlock | null {
  if (!s.mostrarBrokerAsesor) return null;
  if (!trim(s.brokerNombre)) return null;
  const personalPhone = trim(s.brokerTelefonoPersonal) || trim(s.brokerTelefono);
  const officePhone = trim(s.brokerTelefonoOficina);
  const waHref = previewWhatsappClickHref(s.brokerWhatsapp);
  return {
    name: trim(s.brokerNombre),
    title: trim(s.brokerTitulo),
    license: trim(s.brokerLicencia),
    fotoDataUrl: trim(s.brokerFotoDataUrl) || null,
    personalPhone,
    officePhone,
    whatsappHref: waHref,
    email: trim(s.brokerEmail),
    website: hrefFromUserInput(s.brokerSitioWeb),
    socialInstagram: resolveAnyHref(s.brokerInstagram),
    socialFacebook: resolveAnyHref(s.brokerFacebook),
    socialYoutube: resolveAnyHref(s.brokerYoutube),
    socialTiktok: resolveAnyHref(s.brokerTiktok),
    socialX: resolveAnyHref(s.brokerX),
    socialOtro: resolveAnyHref(s.brokerOtro),
  };
}

/** Iconos de redes para la tarjeta secundaria del segundo agente (independiente del interruptor principal). */
export function buildSecondAgentSocialHrefs(s: AgenteIndividualResidencialFormState): {
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
  socialX: string | null;
  socialOtro: string | null;
  showRow: boolean;
} {
  const socialInstagram = resolveAnyHref(s.agente2SocialInstagram);
  const socialFacebook = resolveAnyHref(s.agente2SocialFacebook);
  const socialYoutube = resolveAnyHref(s.agente2SocialYoutube);
  const socialTiktok = resolveAnyHref(s.agente2SocialTiktok);
  const socialX = resolveAnyHref(s.agente2SocialX);
  const socialOtro = resolveAnyHref(s.agente2SocialOtro);
  const showRow = Boolean(
    socialInstagram || socialFacebook || socialYoutube || socialTiktok || socialX || socialOtro,
  );
  return { socialInstagram, socialFacebook, socialYoutube, socialTiktok, socialX, socialOtro, showRow };
}
