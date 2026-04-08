import { brCanonicalNorCalCity } from "@/app/clasificados/bienes-raices/shared/brNorCalCity";
import { digitsOnly } from "../application/utils/phoneMask";
import type {
  BrNegocioCategoriaPropiedad,
  BrNegocioSellerTipo,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_NEGOCIO_DEFAULT_CATEGORIA,
  BR_NEGOCIO_DEFAULT_SELLER,
  coerceBrNegocioCategoriaPropiedad,
  coerceBrNegocioSellerTipo,
  parseBrNegocioPropiedadParam,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  normalizeResidencialTipoPropiedadCodigo,
  type TipoPropiedadCodigo,
} from "./agenteResidencialTipoMeta";
import type { ComercialDestacadoId, TerrenoDestacadoId } from "./agenteComercialTerrenoMeta";
import {
  COMERCIAL_DESTACADOS_DEFS,
  normalizeComercialTipoCodigo,
  normalizeTerrenoTipoCodigo,
  TERRENO_DESTACADOS_DEFS,
  type ComercialTipoCodigo,
  type TerrenoTipoCodigo,
} from "./agenteComercialTerrenoMeta";

export type { TipoPropiedadCodigo };

export type AgenteResidencialEstadoAnuncio = "disponible" | "pendiente" | "bajo_contrato" | "vendido";

export type AgenteResidencialCondicionPropiedad = "excelente" | "buena" | "regular" | "necesita_reparacion";

/** Hasta 4 fechas de open house en «Más información». */
export type AgenteResOpenHouseSlot = {
  fecha: string;
  inicio: string;
  fin: string;
  notas: string;
};

/** Qué número usa el CTA «Llamar» cuando hay personal y oficina. */
export type AgentePrincipalLlamadas = "personal" | "oficina";

export const AGENTE_RES_MAX_OPEN_HOUSE_SLOTS = 4;

export type AgenteResidencialDestacadoId =
  | "piscina"
  | "patio"
  | "terraza"
  | "balcon"
  | "chimenea"
  | "oficina"
  | "sotano"
  | "garaje"
  | "porton_electrico"
  | "adu"
  | "remodelada"
  | "nueva_construccion"
  | "vista"
  | "comunidad_cerrada"
  | "paneles_solares";

export const AGENTE_RES_DESTACADOS_DEFS: ReadonlyArray<{
  id: AgenteResidencialDestacadoId;
  label: string;
}> = [
  { id: "piscina", label: "Piscina" },
  { id: "patio", label: "Patio" },
  { id: "terraza", label: "Terraza" },
  { id: "balcon", label: "Balcón" },
  { id: "chimenea", label: "Chimenea" },
  { id: "oficina", label: "Oficina" },
  { id: "sotano", label: "Sótano" },
  { id: "garaje", label: "Garaje" },
  { id: "porton_electrico", label: "Portón eléctrico" },
  { id: "adu", label: "ADU" },
  { id: "remodelada", label: "Remodelada" },
  { id: "nueva_construccion", label: "Nueva construcción" },
  { id: "vista", label: "Vista" },
  { id: "comunidad_cerrada", label: "Comunidad cerrada" },
  { id: "paneles_solares", label: "Paneles solares" },
];

/**
 * Estado plano del formulario / borrador — misma forma que consume la vista previa (patrón Autos).
 */
export type AgenteIndividualResidencialFormState = {
  tipoPublicacionFijo: "venta_residencial";

  /** Negocio lane: quién publica (selector + URL `seller`). */
  sellerTipo: BrNegocioSellerTipo;
  /** Negocio lane: categoría de propiedad (selector + URL `propiedad`). */
  categoriaPropiedad: BrNegocioCategoriaPropiedad;

  titulo: string;
  precio: string;
  ciudad: string;
  areaCiudad: string;
  direccion: string;
  estadoAnuncio: AgenteResidencialEstadoAnuncio;

  tipoPropiedadCodigo: TipoPropiedadCodigo;
  subtipoPropiedad: string;

  comercialTipoCodigo: ComercialTipoCodigo;
  comercialSubtipoPropiedad: string;
  comercialUso: string;
  comercialOficinas: string;
  comercialNiveles: string;
  comercialZonificacion: string;
  comercialAccesoCarga: boolean;

  terrenoTipoCodigo: TerrenoTipoCodigo;
  terrenoSubtipoPropiedad: string;
  terrenoUsoZonificacion: string;
  terrenoAcceso: string;
  terrenoServicios: string;
  terrenoTopografia: string;
  terrenoListoConstruir: boolean;
  terrenoCercado: boolean;

  listadoUrl: string;
  listadoArchivoDataUrl: string;
  listadoArchivoNombre: string;

  fotosDataUrls: string[];
  fotoPortadaIndex: number;

  videoUrl: string;
  videoDataUrl: string;
  /** Original filename when `videoDataUrl` is a local upload (preview UX only). */
  videoArchivoNombre: string;

  tourUrl: string;
  tourDataUrl: string;
  tourArchivoNombre: string;

  brochureUrl: string;
  brochureDataUrl: string;
  brochureArchivoNombre: string;

  recamaras: string;
  banos: string;
  mediosBanos: string;
  tamanoInteriorSqft: string;
  tamanoLoteSqft: string;
  estacionamientos: string;
  anoConstruccion: string;
  condicionPropiedad: AgenteResidencialCondicionPropiedad;

  destacados: Record<AgenteResidencialDestacadoId, boolean>;
  destacadosComercial: Record<ComercialDestacadoId, boolean>;
  destacadosTerreno: Record<TerrenoDestacadoId, boolean>;

  descripcionPrincipal: string;
  notasAdicionales: string;

  /** professionalCard.agentPhoto */
  agenteFotoDataUrl: string;
  /** professionalCard.agentName */
  agenteNombre: string;
  /** professionalCard.agentTitle */
  agenteTitulo: string;
  /** professionalCard.agentLicense */
  agenteLicencia: string;
  /**
   * @deprecated Migración de borradores; hidratar a `agenteTelefonoPersonal` al fusionar.
   * No editar en el formulario nuevo (paso 7 usa teléfonos estructurados).
   */
  telefonoPrincipal: string;
  /** Teléfono personal del agente principal (tarjeta / respaldo CTAs). */
  agenteTelefonoPersonal: string;
  /** Teléfono de oficina del agente principal. */
  agenteTelefonoOficina: string;
  /** WhatsApp del agente principal (solo este número para el CTA WA si no hay override en paso 8). */
  agenteWhatsapp: string;
  /** Sitio web del agente (CTA «Ver sitio web» tras override del paso 8). */
  agenteSitioWeb: string;
  /** Número que alimenta «Llamar» cuando hay personal y oficina con dígitos válidos. */
  agentePrincipalLlamadas: AgentePrincipalLlamadas;
  /** Tarjeta: correo mostrado; respaldo para «Solicitar información». */
  correoPrincipal: string;

  /** professionalCard.brandName */
  marcaNombre: string;
  /** professionalCard.brandLogo */
  marcaLogoDataUrl: string;
  /** professionalCard.brandLicense */
  marcaLicencia: string;
  /** professionalCard.brandWebsite (opcional) */
  marcaSitioWeb: string;
  /** Si es false, no se muestra el bloque oficina/marca en vista previa aunque haya datos. */
  mostrarMarcaEnTarjeta: boolean;

  /** Un campo por icono; sin inferencia de plataforma. */
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
  socialTiktok: string;
  socialX: string;
  socialOtro: string;

  agenteAreaServicio: string;
  agenteIdiomas: string;

  /** Si el usuario activó el bloque «segundo agente» en publicar. */
  mostrarSegundoAgente: boolean;
  /** Segundo agente (rail inferior a la tarjeta principal en vista previa). */
  agente2FotoDataUrl: string;
  agente2Nombre: string;
  agente2Titulo: string;
  agente2Licencia: string;
  /** @deprecated Migración; usar `agente2TelefonoPersonal`. */
  agente2Telefono: string;
  agente2TelefonoPersonal: string;
  agente2TelefonoOficina: string;
  agente2Whatsapp: string;
  agente2SitioWeb: string;
  agente2PrincipalLlamadas: AgentePrincipalLlamadas;
  agente2Correo: string;
  /** Redes del segundo agente (vista previa: iconos en la tarjeta secundaria). */
  agente2SocialInstagram: string;
  agente2SocialFacebook: string;
  agente2SocialYoutube: string;
  agente2SocialTiktok: string;
  agente2SocialX: string;
  agente2SocialOtro: string;

  /** Broker o asesor de apoyo — sección inferior en vista previa, no rail. */
  mostrarBrokerAsesor: boolean;
  brokerFotoDataUrl: string;
  brokerNombre: string;
  brokerTitulo: string;
  brokerLicencia: string;
  /** @deprecated Migración; usar `brokerTelefonoPersonal`. */
  brokerTelefono: string;
  brokerTelefonoPersonal: string;
  brokerTelefonoOficina: string;
  brokerWhatsapp: string;
  brokerPrincipalLlamadas: AgentePrincipalLlamadas;
  brokerEmail: string;
  brokerSitioWeb: string;
  brokerInstagram: string;
  brokerFacebook: string;
  brokerYoutube: string;
  brokerTiktok: string;
  brokerX: string;
  brokerOtro: string;

  permitirSolicitarInformacion: boolean;
  permitirProgramarVisita: boolean;
  permitirLlamar: boolean;
  permitirWhatsApp: boolean;
  permitirVerSitioWeb: boolean;
  permitirVerRedes: boolean;
  permitirVerListadoCompleto: boolean;
  permitirVerMls: boolean;
  permitirVerTour: boolean;
  permitirVerFolleto: boolean;

  /** contactRail.call — si vacío, ver mapa (fallback documentado). */
  ctaNumeroLlamadas: string;
  /** contactRail.whatsapp */
  ctaNumeroWhatsapp: string;
  /** contactRail.info (correo dedicado) */
  ctaCorreoSolicitarInfo: string;
  /** contactRail.schedule (enlace externo) */
  ctaEnlaceProgramarVisita: string;
  /** contactRail.website */
  ctaEnlaceSitioWeb: string;
  /** contactRail.listing */
  ctaUrlListadoCompleto: string;
  /** contactRail.mls */
  ctaUrlMls: string;
  /** contactRail.tour */
  ctaUrlTour: string;
  /** contactRail.brochure */
  ctaUrlFolleto: string;

  /** @deprecated Prefer `openHouseSlots`; conservado para borradores antiguos. */
  extraOpenHouse: boolean;
  openHouseFecha: string;
  openHouseInicio: string;
  openHouseFin: string;
  openHouseNotas: string;
  /** Open house repetible (máx. `AGENTE_RES_MAX_OPEN_HOUSE_SLOTS`). */
  openHouseSlots: AgenteResOpenHouseSlot[];

  /**
   * @deprecated Extras «Asesor financiero» eliminados del formulario; conservado para borradores.
   * `mergePartialAgenteIndividualResidencial` reenvía datos al bloque broker/asesor si aplica.
   */
  extraAsesorFinanciero: boolean;
  asesorNombre: string;
  asesorTelefono: string;
  asesorEmail: string;

  confirmListingAccurate: boolean;
  confirmPhotosRepresentItem: boolean;
  confirmCommunityRules: boolean;
};

function trim(s: unknown): string {
  if (s == null) return "";
  if (typeof s === "string") return s.trim();
  return String(s).trim();
}

function mapEstadoLegacy(raw: string): AgenteResidencialEstadoAnuncio {
  switch (raw) {
    case "disponible":
    case "pendiente":
    case "bajo_contrato":
    case "vendido":
      return raw;
    case "proximamente":
      return "pendiente";
    case "rentado":
    default:
      return "disponible";
  }
}

function coerceEstado(raw: unknown): AgenteResidencialEstadoAnuncio {
  if (raw === "disponible" || raw === "pendiente" || raw === "bajo_contrato" || raw === "vendido") return raw;
  return mapEstadoLegacy(String(raw ?? ""));
}

function mapCondicionLegacy(raw: string): AgenteResidencialCondicionPropiedad {
  const t = raw.toLowerCase();
  if (t.includes("excelente") || t.includes("impecable")) return "excelente";
  if (t.includes("necesita") || t.includes("repar")) return "necesita_reparacion";
  if (t.includes("regular") || t.includes("actualizar")) return "regular";
  if (t.includes("buena") || t.includes("buen")) return "buena";
  return "buena";
}

function coerceCondicion(raw: unknown): AgenteResidencialCondicionPropiedad {
  if (raw === "excelente" || raw === "buena" || raw === "regular" || raw === "necesita_reparacion") return raw;
  if (typeof raw === "string") return mapCondicionLegacy(raw);
  return "buena";
}

/** Migra borradores con `agenteTelefono` / `agenteEmail` / `agenteSitioWeb` / `agenteRedes`. */
function migrateLegacyFlatFields(legacy: Record<string, unknown>, out: Partial<AgenteIndividualResidencialFormState>): void {
  if (typeof legacy.agenteTelefono === "string" && !trim(String(out.telefonoPrincipal ?? ""))) {
    out.telefonoPrincipal = legacy.agenteTelefono;
  }
  if (typeof legacy.agenteEmail === "string" && !trim(String(out.correoPrincipal ?? ""))) {
    out.correoPrincipal = legacy.agenteEmail;
  }
  if (typeof legacy.agenteSitioWeb === "string" && !trim(String(out.ctaEnlaceSitioWeb ?? ""))) {
    out.ctaEnlaceSitioWeb = legacy.agenteSitioWeb;
  }
  if (typeof legacy.agenteRedes === "string" && trim(legacy.agenteRedes) && !trim(String(out.socialOtro ?? ""))) {
    const first = trim(legacy.agenteRedes).split(/\r?\n/)[0] ?? "";
    if (first) out.socialOtro = first;
  }
}

function migrateFromNestedLegacy(p: Record<string, unknown>): Partial<AgenteIndividualResidencialFormState> {
  const out: Partial<AgenteIndividualResidencialFormState> = {};
  migrateLegacyFlatFields(p, out);

  if (typeof p.categoriaPropiedad === "string") {
    out.categoriaPropiedad = coerceBrNegocioCategoriaPropiedad(p.categoriaPropiedad);
  } else if (typeof p.propiedad === "string") {
    const pr = parseBrNegocioPropiedadParam(p.propiedad);
    if (pr) out.categoriaPropiedad = pr;
  }

  if (typeof p.titulo === "string") out.titulo = p.titulo;
  if (typeof p.precio === "string") out.precio = p.precio;
  if (typeof p.ciudad === "string") out.ciudad = p.ciudad;
  if (typeof p.areaCiudad === "string") out.areaCiudad = p.areaCiudad;
  if (typeof p.direccion === "string") out.direccion = p.direccion;
  if (typeof p.estadoAnuncio === "string") out.estadoAnuncio = mapEstadoLegacy(p.estadoAnuncio);

  if (typeof p.tipoPropiedadCodigo === "string") {
    out.tipoPropiedadCodigo = normalizeResidencialTipoPropiedadCodigo(p.tipoPropiedadCodigo);
  }
  if (typeof p.subtipoPropiedad === "string") out.subtipoPropiedad = p.subtipoPropiedad;

  if (typeof p.tipoPropiedad === "string" && trim(p.tipoPropiedad) && !out.tipoPropiedadCodigo) {
    out.tipoPropiedadCodigo = "casa";
    if (!trim(String(out.subtipoPropiedad ?? ""))) {
      out.subtipoPropiedad = trim(p.tipoPropiedad);
    }
  }

  if (typeof p.enlaceListado === "string") out.listadoUrl = p.enlaceListado;
  if (typeof p.listadoUrl === "string") out.listadoUrl = p.listadoUrl;
  if (typeof p.listadoArchivoDataUrl === "string") out.listadoArchivoDataUrl = p.listadoArchivoDataUrl;
  if (typeof p.listadoArchivoNombre === "string") out.listadoArchivoNombre = p.listadoArchivoNombre;

  const media = p.media as Record<string, unknown> | undefined;
  if (media && typeof media === "object") {
    if (Array.isArray(media.photoUrls)) out.fotosDataUrls = media.photoUrls.filter((x) => typeof x === "string") as string[];
    if (typeof media.primaryImageIndex === "number") out.fotoPortadaIndex = media.primaryImageIndex;
    if (typeof media.videoUrl === "string") out.videoUrl = media.videoUrl;
    if (typeof media.videoDataUrl === "string") out.videoDataUrl = media.videoDataUrl;
    if (typeof media.tourUrl === "string") out.tourUrl = media.tourUrl;
    if (typeof media.tourDataUrl === "string") out.tourDataUrl = media.tourDataUrl;
    if (typeof media.brochureUrl === "string") out.brochureUrl = media.brochureUrl;
    if (typeof media.brochureDataUrl === "string") out.brochureDataUrl = media.brochureDataUrl;
  }

  const det = p.detalles as Record<string, unknown> | undefined;
  if (det && typeof det === "object") {
    if (typeof det.recamaras === "string") out.recamaras = det.recamaras;
    if (typeof det.banos === "string") out.banos = det.banos;
    if (typeof det.mediosBanos === "string") out.mediosBanos = det.mediosBanos;
    if (typeof det.tamanoInterior === "string") out.tamanoInteriorSqft = det.tamanoInterior;
    if (typeof det.tamanoLote === "string") out.tamanoLoteSqft = det.tamanoLote;
    if (typeof det.estacionamientos === "string") out.estacionamientos = det.estacionamientos;
    if (typeof det.anioConstruccion === "string") out.anoConstruccion = det.anioConstruccion;
    if (typeof det.condicion === "string") out.condicionPropiedad = mapCondicionLegacy(det.condicion);
  }

  const ag = p.agente as Record<string, unknown> | undefined;
  if (ag && typeof ag === "object") {
    if (typeof ag.nombre === "string") out.agenteNombre = ag.nombre;
    if (typeof ag.titulo === "string") out.agenteTitulo = ag.titulo;
    if (typeof ag.telefono === "string") out.telefonoPrincipal = ag.telefono;
    if (typeof ag.email === "string") out.correoPrincipal = ag.email;
    if (typeof ag.fotoUrl === "string") out.agenteFotoDataUrl = ag.fotoUrl;
    if (typeof ag.licencia === "string") out.agenteLicencia = ag.licencia;
    if (typeof ag.sitioWeb === "string") out.ctaEnlaceSitioWeb = ag.sitioWeb;
    if (Array.isArray(ag.redes)) {
      const line = (ag.redes as string[]).find(Boolean);
      if (line) out.socialOtro = line;
    }
    if (typeof ag.areaServicio === "string") out.agenteAreaServicio = ag.areaServicio;
    if (typeof ag.idiomas === "string") out.agenteIdiomas = ag.idiomas;
  }

  const cta = p.cta as Record<string, unknown> | undefined;
  if (cta && typeof cta === "object") {
    if (typeof cta.permitirEnviarMensaje === "boolean") out.permitirSolicitarInformacion = cta.permitirEnviarMensaje;
    if (typeof cta.permitirProgramarVisita === "boolean") out.permitirProgramarVisita = cta.permitirProgramarVisita;
    if (typeof cta.permitirLlamar === "boolean") out.permitirLlamar = cta.permitirLlamar;
    if (typeof cta.permitirWhatsapp === "boolean") out.permitirWhatsApp = cta.permitirWhatsapp;
    if (typeof cta.mostrarVerSitioWeb === "boolean") out.permitirVerSitioWeb = cta.mostrarVerSitioWeb;
    if (typeof cta.mostrarVerRedes === "boolean") out.permitirVerRedes = cta.mostrarVerRedes;
    if (typeof cta.mostrarVerListadoCompleto === "boolean") out.permitirVerListadoCompleto = cta.mostrarVerListadoCompleto;
    if (typeof cta.mostrarVerTour === "boolean") out.permitirVerTour = cta.mostrarVerTour;
    if (typeof cta.mostrarVerFolleto === "boolean") out.permitirVerFolleto = cta.mostrarVerFolleto;
  }

  const extras = p.extras as Record<string, unknown> | undefined;
  if (extras && typeof extras === "object") {
    if (typeof extras.openHouseActivo === "boolean") out.extraOpenHouse = extras.openHouseActivo;
    if (typeof extras.openHouseFecha === "string") out.openHouseFecha = extras.openHouseFecha;
    if (typeof extras.openHouseInicio === "string") out.openHouseInicio = extras.openHouseInicio;
    if (typeof extras.openHouseFin === "string") out.openHouseFin = extras.openHouseFin;
    if (typeof extras.openHouseNotas === "string") out.openHouseNotas = extras.openHouseNotas;
    if (typeof extras.asesorFinancieroActivo === "boolean") out.extraAsesorFinanciero = extras.asesorFinancieroActivo;
    if (typeof extras.asesorNombre === "string") out.asesorNombre = extras.asesorNombre;
    if (typeof extras.asesorTelefono === "string") out.asesorTelefono = extras.asesorTelefono;
    if (typeof extras.asesorEmail === "string") out.asesorEmail = extras.asesorEmail;
  }

  const dest = p.destacados as Record<string, boolean> | undefined;
  if (dest && typeof dest === "object") {
    const next: Partial<Record<AgenteResidencialDestacadoId, boolean>> = {};
    for (const d of AGENTE_RES_DESTACADOS_DEFS) {
      const legacyKey = d.id as string;
      if (typeof dest[legacyKey] === "boolean") next[d.id] = dest[legacyKey];
    }
    out.destacados = { ...out.destacados, ...next } as Record<AgenteResidencialDestacadoId, boolean>;
  }

  const destCom = p.destacadosComercial as Record<string, boolean> | undefined;
  if (destCom && typeof destCom === "object") {
    const next: Partial<Record<ComercialDestacadoId, boolean>> = {};
    for (const d of COMERCIAL_DESTACADOS_DEFS) {
      if (typeof destCom[d.id] === "boolean") next[d.id] = destCom[d.id];
    }
    out.destacadosComercial = { ...out.destacadosComercial, ...next } as Record<ComercialDestacadoId, boolean>;
  }

  const destTer = p.destacadosTerreno as Record<string, boolean> | undefined;
  if (destTer && typeof destTer === "object") {
    const next: Partial<Record<TerrenoDestacadoId, boolean>> = {};
    for (const d of TERRENO_DESTACADOS_DEFS) {
      if (typeof destTer[d.id] === "boolean") next[d.id] = destTer[d.id];
    }
    out.destacadosTerreno = { ...out.destacadosTerreno, ...next } as Record<TerrenoDestacadoId, boolean>;
  }

  return out;
}

export function createEmptyAgenteIndividualResidencialFormState(): AgenteIndividualResidencialFormState {
  const destacados = {} as Record<AgenteResidencialDestacadoId, boolean>;
  for (const d of AGENTE_RES_DESTACADOS_DEFS) destacados[d.id] = false;
  const destacadosComercial = {} as Record<ComercialDestacadoId, boolean>;
  for (const d of COMERCIAL_DESTACADOS_DEFS) destacadosComercial[d.id] = false;
  const destacadosTerreno = {} as Record<TerrenoDestacadoId, boolean>;
  for (const d of TERRENO_DESTACADOS_DEFS) destacadosTerreno[d.id] = false;

  return {
    tipoPublicacionFijo: "venta_residencial",

    sellerTipo: BR_NEGOCIO_DEFAULT_SELLER,
    categoriaPropiedad: BR_NEGOCIO_DEFAULT_CATEGORIA,

    titulo: "",
    precio: "",
    ciudad: "",
    areaCiudad: "",
    direccion: "",
    estadoAnuncio: "disponible",

    tipoPropiedadCodigo: "casa",
    subtipoPropiedad: "",

    comercialTipoCodigo: "oficina",
    comercialSubtipoPropiedad: "",
    comercialUso: "",
    comercialOficinas: "",
    comercialNiveles: "",
    comercialZonificacion: "",
    comercialAccesoCarga: false,

    terrenoTipoCodigo: "lote_residencial",
    terrenoSubtipoPropiedad: "",
    terrenoUsoZonificacion: "",
    terrenoAcceso: "",
    terrenoServicios: "",
    terrenoTopografia: "",
    terrenoListoConstruir: false,
    terrenoCercado: false,

    listadoUrl: "",
    listadoArchivoDataUrl: "",
    listadoArchivoNombre: "",

    fotosDataUrls: [],
    fotoPortadaIndex: 0,

    videoUrl: "",
    videoDataUrl: "",
    videoArchivoNombre: "",

    tourUrl: "",
    tourDataUrl: "",
    tourArchivoNombre: "",

    brochureUrl: "",
    brochureDataUrl: "",
    brochureArchivoNombre: "",

    recamaras: "",
    banos: "",
    mediosBanos: "",
    tamanoInteriorSqft: "",
    tamanoLoteSqft: "",
    estacionamientos: "",
    anoConstruccion: "",
    condicionPropiedad: "buena",

    destacados,
    destacadosComercial,
    destacadosTerreno,

    descripcionPrincipal: "",
    notasAdicionales: "",

    agenteFotoDataUrl: "",
    agenteNombre: "",
    agenteTitulo: "",
    agenteLicencia: "",
    telefonoPrincipal: "",
    agenteTelefonoPersonal: "",
    agenteTelefonoOficina: "",
    agenteWhatsapp: "",
    agenteSitioWeb: "",
    agentePrincipalLlamadas: "personal",
    correoPrincipal: "",

    marcaNombre: "",
    marcaLogoDataUrl: "",
    marcaLicencia: "",
    marcaSitioWeb: "",
    mostrarMarcaEnTarjeta: true,

    socialInstagram: "",
    socialFacebook: "",
    socialYoutube: "",
    socialTiktok: "",
    socialX: "",
    socialOtro: "",

    agenteAreaServicio: "",
    agenteIdiomas: "",

    mostrarSegundoAgente: false,
    agente2FotoDataUrl: "",
    agente2Nombre: "",
    agente2Titulo: "",
    agente2Licencia: "",
    agente2Telefono: "",
    agente2TelefonoPersonal: "",
    agente2TelefonoOficina: "",
    agente2Whatsapp: "",
    agente2SitioWeb: "",
    agente2PrincipalLlamadas: "personal",
    agente2Correo: "",
    agente2SocialInstagram: "",
    agente2SocialFacebook: "",
    agente2SocialYoutube: "",
    agente2SocialTiktok: "",
    agente2SocialX: "",
    agente2SocialOtro: "",

    mostrarBrokerAsesor: false,
    brokerFotoDataUrl: "",
    brokerNombre: "",
    brokerTitulo: "",
    brokerLicencia: "",
    brokerTelefono: "",
    brokerTelefonoPersonal: "",
    brokerTelefonoOficina: "",
    brokerWhatsapp: "",
    brokerPrincipalLlamadas: "personal",
    brokerEmail: "",
    brokerSitioWeb: "",
    brokerInstagram: "",
    brokerFacebook: "",
    brokerYoutube: "",
    brokerTiktok: "",
    brokerX: "",
    brokerOtro: "",

    permitirSolicitarInformacion: true,
    permitirProgramarVisita: true,
    permitirLlamar: true,
    permitirWhatsApp: true,
    permitirVerSitioWeb: true,
    permitirVerRedes: true,
    permitirVerListadoCompleto: true,
    permitirVerMls: false,
    permitirVerTour: false,
    permitirVerFolleto: false,

    ctaNumeroLlamadas: "",
    ctaNumeroWhatsapp: "",
    ctaCorreoSolicitarInfo: "",
    ctaEnlaceProgramarVisita: "",
    ctaEnlaceSitioWeb: "",
    ctaUrlListadoCompleto: "",
    ctaUrlMls: "",
    ctaUrlTour: "",
    ctaUrlFolleto: "",

    extraOpenHouse: false,
    openHouseFecha: "",
    openHouseInicio: "",
    openHouseFin: "",
    openHouseNotas: "",
    openHouseSlots: [],

    extraAsesorFinanciero: false,
    asesorNombre: "",
    asesorTelefono: "",
    asesorEmail: "",

    confirmListingAccurate: false,
    confirmPhotosRepresentItem: false,
    confirmCommunityRules: false,
  };
}

export const createEmptyAgenteIndividualResidencialState = createEmptyAgenteIndividualResidencialFormState;

function coerceOpenHouseSlot(o: unknown): AgenteResOpenHouseSlot {
  const r = o as Record<string, unknown>;
  return {
    fecha: typeof r?.fecha === "string" ? r.fecha : "",
    inicio: typeof r?.inicio === "string" ? r.inicio : "",
    fin: typeof r?.fin === "string" ? r.fin : "",
    notas: typeof r?.notas === "string" ? r.notas : "",
  };
}

function mergeOpenHouseSlots(
  flat: Partial<AgenteIndividualResidencialFormState>,
  nested: Partial<AgenteIndividualResidencialFormState>,
  legacy: Record<string, unknown>,
  base: AgenteIndividualResidencialFormState,
): AgenteResOpenHouseSlot[] {
  if (Array.isArray(flat.openHouseSlots) && flat.openHouseSlots.length > 0) {
    return flat.openHouseSlots.slice(0, AGENTE_RES_MAX_OPEN_HOUSE_SLOTS).map((x) => coerceOpenHouseSlot(x));
  }
  if (Array.isArray(nested.openHouseSlots) && nested.openHouseSlots.length > 0) {
    return nested.openHouseSlots.slice(0, AGENTE_RES_MAX_OPEN_HOUSE_SLOTS).map((x) => coerceOpenHouseSlot(x));
  }
  const ex =
    typeof flat.extraOpenHouse === "boolean"
      ? flat.extraOpenHouse
      : typeof nested.extraOpenHouse === "boolean"
        ? nested.extraOpenHouse
        : typeof legacy.extraOpenHouse === "boolean"
          ? legacy.extraOpenHouse
          : base.extraOpenHouse;
  const fecha = typeof flat.openHouseFecha === "string" ? flat.openHouseFecha : base.openHouseFecha;
  const ini = typeof flat.openHouseInicio === "string" ? flat.openHouseInicio : base.openHouseInicio;
  const fin = typeof flat.openHouseFin === "string" ? flat.openHouseFin : base.openHouseFin;
  const notas = typeof flat.openHouseNotas === "string" ? flat.openHouseNotas : base.openHouseNotas;
  if (ex && (trim(fecha) || trim(ini) || trim(fin) || trim(notas))) {
    return [{ fecha, inicio: ini, fin, notas }];
  }
  return [];
}

function inferMostrarSegundoAgente(
  flat: Partial<AgenteIndividualResidencialFormState>,
  nested: Partial<AgenteIndividualResidencialFormState>,
  peek: Partial<AgenteIndividualResidencialFormState>,
): boolean {
  if (typeof flat.mostrarSegundoAgente === "boolean") return flat.mostrarSegundoAgente;
  if (typeof nested.mostrarSegundoAgente === "boolean") return nested.mostrarSegundoAgente;
  return Boolean(
    trim(peek.agente2Nombre) ||
      trim(peek.agente2FotoDataUrl) ||
      trim(peek.agente2Titulo) ||
      trim(peek.agente2Licencia) ||
      trim(peek.agente2Telefono) ||
      trim(peek.agente2TelefonoPersonal) ||
      trim(peek.agente2TelefonoOficina) ||
      trim(peek.agente2Whatsapp) ||
      trim(peek.agente2SitioWeb) ||
      trim(peek.agente2Correo) ||
      trim(peek.agente2SocialInstagram) ||
      trim(peek.agente2SocialFacebook) ||
      trim(peek.agente2SocialYoutube) ||
      trim(peek.agente2SocialTiktok) ||
      trim(peek.agente2SocialX) ||
      trim(peek.agente2SocialOtro),
  );
}

function inferMostrarBrokerAsesor(
  flat: Partial<AgenteIndividualResidencialFormState>,
  nested: Partial<AgenteIndividualResidencialFormState>,
  peek: Partial<AgenteIndividualResidencialFormState>,
): boolean {
  if (typeof flat.mostrarBrokerAsesor === "boolean") return flat.mostrarBrokerAsesor;
  if (typeof nested.mostrarBrokerAsesor === "boolean") return nested.mostrarBrokerAsesor;
  return Boolean(
    trim(peek.brokerNombre) ||
      trim(peek.brokerTitulo) ||
      trim(peek.brokerLicencia) ||
      trim(peek.brokerFotoDataUrl) ||
      trim(peek.brokerTelefono) ||
      trim(peek.brokerTelefonoPersonal) ||
      trim(peek.brokerTelefonoOficina) ||
      trim(peek.brokerWhatsapp) ||
      trim(peek.brokerEmail) ||
      trim(peek.brokerSitioWeb) ||
      trim(peek.brokerInstagram) ||
      trim(peek.brokerFacebook) ||
      trim(peek.brokerYoutube) ||
      trim(peek.brokerTiktok) ||
      trim(peek.brokerX) ||
      trim(peek.brokerOtro),
  );
}

/** Antiguo «Asesor financiero» (extras) → bloque broker/asesor inferior si no hay broker nuevo. */
function migrateLegacyAsesorFinancieroToBroker(s: AgenteIndividualResidencialFormState): AgenteIndividualResidencialFormState {
  if (trim(s.brokerNombre)) return s;
  const n = trim(s.asesorNombre);
  if (!n) return s;
  return {
    ...s,
    brokerNombre: n,
    brokerTelefonoPersonal: trim(s.brokerTelefonoPersonal) || trim(s.brokerTelefono) || trim(s.asesorTelefono),
    brokerEmail: trim(s.brokerEmail) || trim(s.asesorEmail),
    mostrarBrokerAsesor: true,
  };
}

function hasTenDigits(raw: string): boolean {
  return digitsOnly(trim(raw)).length >= 10;
}

function normalizePrincipalLlamadas(
  choice: unknown,
  personalOk: boolean,
  officeOk: boolean,
): AgentePrincipalLlamadas {
  if (personalOk && officeOk) {
    return choice === "oficina" ? "oficina" : "personal";
  }
  return "personal";
}

/** Hidrata campos nuevos desde campos legacy tras fusionar borrador. */
export function hydrateContactFieldsFromLegacy(s: AgenteIndividualResidencialFormState): AgenteIndividualResidencialFormState {
  let out = { ...s };

  if (!trim(out.agenteTelefonoPersonal) && trim(out.telefonoPrincipal)) {
    out = { ...out, agenteTelefonoPersonal: out.telefonoPrincipal };
  }
  if (!trim(out.agente2TelefonoPersonal) && trim(out.agente2Telefono)) {
    out = { ...out, agente2TelefonoPersonal: out.agente2Telefono };
  }
  if (!trim(out.brokerTelefonoPersonal) && trim(out.brokerTelefono)) {
    out = { ...out, brokerTelefonoPersonal: out.brokerTelefono };
  }

  const agP = trim(out.agenteTelefonoPersonal) || trim(out.telefonoPrincipal);
  const agO = trim(out.agenteTelefonoOficina);
  out = {
    ...out,
    agentePrincipalLlamadas: normalizePrincipalLlamadas(out.agentePrincipalLlamadas, hasTenDigits(agP), hasTenDigits(agO)),
  };

  const a2p = trim(out.agente2TelefonoPersonal) || trim(out.agente2Telefono);
  const a2o = trim(out.agente2TelefonoOficina);
  out = {
    ...out,
    agente2PrincipalLlamadas: normalizePrincipalLlamadas(out.agente2PrincipalLlamadas, hasTenDigits(a2p), hasTenDigits(a2o)),
  };

  const brP = trim(out.brokerTelefonoPersonal) || trim(out.brokerTelefono);
  const brO = trim(out.brokerTelefonoOficina);
  out = {
    ...out,
    brokerPrincipalLlamadas: normalizePrincipalLlamadas(out.brokerPrincipalLlamadas, hasTenDigits(brP), hasTenDigits(brO)),
  };

  return out;
}

export function mergePartialAgenteIndividualResidencial(
  partial: Partial<AgenteIndividualResidencialFormState> & Record<string, unknown>,
): AgenteIndividualResidencialFormState {
  const base = createEmptyAgenteIndividualResidencialFormState();
  if (!partial || typeof partial !== "object") return base;

  const legacy = partial as Record<string, unknown>;
  const nested = migrateFromNestedLegacy(legacy);

  const raw = { ...legacy };
  for (const k of ["media", "detalles", "agente", "cta", "extras", "enlaceListado", "tipoPublicacion"]) {
    delete raw[k];
  }
  delete (raw as Record<string, unknown>).agenteBioCorta;
  const flat = raw as Partial<AgenteIndividualResidencialFormState>;

  migrateLegacyFlatFields(legacy, flat);

  const listadoUrl =
    typeof flat.listadoUrl === "string"
      ? flat.listadoUrl
      : typeof legacy.enlaceListado === "string"
        ? legacy.enlaceListado
        : nested.listadoUrl ?? base.listadoUrl;

  const listadoArchivoDataUrl =
    typeof flat.listadoArchivoDataUrl === "string"
      ? flat.listadoArchivoDataUrl
      : nested.listadoArchivoDataUrl ?? base.listadoArchivoDataUrl;

  const listadoArchivoNombre =
    typeof flat.listadoArchivoNombre === "string"
      ? flat.listadoArchivoNombre
      : nested.listadoArchivoNombre ?? base.listadoArchivoNombre;

  const permitirSolicitarInformacion =
    typeof flat.permitirSolicitarInformacion === "boolean"
      ? flat.permitirSolicitarInformacion
      : typeof legacy.permitirEnviarMensaje === "boolean"
        ? legacy.permitirEnviarMensaje
        : nested.permitirSolicitarInformacion ?? base.permitirSolicitarInformacion;

  const rawResidencialTipo =
    (flat.tipoPropiedadCodigo as string | undefined) ??
    (nested.tipoPropiedadCodigo as string | undefined) ??
    base.tipoPropiedadCodigo;
  const legacyTipoEraOtro = String(rawResidencialTipo).toLowerCase() === "otro";
  const tipoPropiedadCodigo = normalizeResidencialTipoPropiedadCodigo(rawResidencialTipo);

  let subtipoPropiedad =
    typeof flat.subtipoPropiedad === "string"
      ? flat.subtipoPropiedad
      : nested.subtipoPropiedad ?? base.subtipoPropiedad;
  const freeTipoLegacy =
    trim(String((legacy as Record<string, unknown>).tipoPropiedadOtro ?? "")) ||
    trim(String((flat as Record<string, unknown>).tipoPropiedadOtro ?? "")) ||
    trim(String((nested as Record<string, unknown>).tipoPropiedadOtro ?? "")) ||
    (typeof legacy.tipoPropiedad === "string" ? trim(legacy.tipoPropiedad) : "");
  if (legacyTipoEraOtro && freeTipoLegacy && !trim(subtipoPropiedad)) {
    subtipoPropiedad = freeTipoLegacy;
  }

  const comercialTipoCodigo = normalizeComercialTipoCodigo(
    flat.comercialTipoCodigo ?? nested.comercialTipoCodigo ?? base.comercialTipoCodigo,
  );
  const terrenoTipoCodigo = normalizeTerrenoTipoCodigo(
    flat.terrenoTipoCodigo ?? nested.terrenoTipoCodigo ?? base.terrenoTipoCodigo,
  );

  const fotosDataUrls = Array.isArray(flat.fotosDataUrls)
    ? flat.fotosDataUrls
    : nested.fotosDataUrls ?? base.fotosDataUrls;

  const fotoPortadaIndexRaw =
    typeof flat.fotoPortadaIndex === "number" ? flat.fotoPortadaIndex : nested.fotoPortadaIndex ?? base.fotoPortadaIndex;
  const maxIdx = Math.max(0, fotosDataUrls.length - 1);
  const fotoPortadaIndex = Math.min(Math.max(0, fotoPortadaIndexRaw), maxIdx);

  const telefonoPrincipal = trim(flat.telefonoPrincipal) || trim(nested.telefonoPrincipal) || base.telefonoPrincipal;

  const correoPrincipal = trim(flat.correoPrincipal) || trim(nested.correoPrincipal) || base.correoPrincipal;

  const mostrarMarcaEnTarjeta =
    typeof flat.mostrarMarcaEnTarjeta === "boolean"
      ? flat.mostrarMarcaEnTarjeta
      : typeof nested.mostrarMarcaEnTarjeta === "boolean"
        ? nested.mostrarMarcaEnTarjeta
        : base.mostrarMarcaEnTarjeta;

  const ciudadRaw = trim(
    String(
      typeof flat.ciudad === "string"
        ? flat.ciudad
        : typeof nested.ciudad === "string"
          ? nested.ciudad
          : base.ciudad,
    ),
  );
  const ciudad = brCanonicalNorCalCity(ciudadRaw);

  const sellerTipo = coerceBrNegocioSellerTipo(flat.sellerTipo ?? nested.sellerTipo ?? legacy.sellerTipo);
  const categoriaPropiedad = coerceBrNegocioCategoriaPropiedad(
    flat.categoriaPropiedad ?? nested.categoriaPropiedad ?? legacy.categoriaPropiedad,
  );

  const openHouseSlotsMerged = mergeOpenHouseSlots(flat, nested, legacy, base);

  const merged: AgenteIndividualResidencialFormState = {
    ...base,
    ...nested,
    ...flat,
    confirmListingAccurate:
      typeof flat.confirmListingAccurate === "boolean"
        ? flat.confirmListingAccurate
        : typeof nested.confirmListingAccurate === "boolean"
          ? nested.confirmListingAccurate
          : base.confirmListingAccurate,
    confirmPhotosRepresentItem:
      typeof flat.confirmPhotosRepresentItem === "boolean"
        ? flat.confirmPhotosRepresentItem
        : typeof nested.confirmPhotosRepresentItem === "boolean"
          ? nested.confirmPhotosRepresentItem
          : base.confirmPhotosRepresentItem,
    confirmCommunityRules:
      typeof flat.confirmCommunityRules === "boolean"
        ? flat.confirmCommunityRules
        : typeof nested.confirmCommunityRules === "boolean"
          ? nested.confirmCommunityRules
          : base.confirmCommunityRules,
    tipoPublicacionFijo: "venta_residencial",
    sellerTipo,
    categoriaPropiedad,
    openHouseSlots: openHouseSlotsMerged,
    ciudad,
    mostrarMarcaEnTarjeta,
    estadoAnuncio: coerceEstado(flat.estadoAnuncio ?? nested.estadoAnuncio ?? base.estadoAnuncio),
    condicionPropiedad: coerceCondicion(flat.condicionPropiedad ?? nested.condicionPropiedad ?? base.condicionPropiedad),
    listadoUrl,
    listadoArchivoDataUrl,
    listadoArchivoNombre,
    permitirSolicitarInformacion,
    tipoPropiedadCodigo,
    subtipoPropiedad,
    comercialTipoCodigo,
    terrenoTipoCodigo,
    telefonoPrincipal,
    correoPrincipal,
    fotosDataUrls,
    fotoPortadaIndex,
    destacados: {
      ...base.destacados,
      ...(nested.destacados ?? {}),
      ...(flat.destacados ?? {}),
    },
    destacadosComercial: {
      ...base.destacadosComercial,
      ...(nested.destacadosComercial ?? {}),
      ...(flat.destacadosComercial ?? {}),
    },
    destacadosTerreno: {
      ...base.destacadosTerreno,
      ...(nested.destacadosTerreno ?? {}),
      ...(flat.destacadosTerreno ?? {}),
    },
  };

  const withLegacyBroker = migrateLegacyAsesorFinancieroToBroker(merged);
  const inferred = {
    ...withLegacyBroker,
    mostrarSegundoAgente: inferMostrarSegundoAgente(flat, nested, withLegacyBroker),
    mostrarBrokerAsesor: inferMostrarBrokerAsesor(flat, nested, withLegacyBroker),
  };

  const hydrated = hydrateContactFieldsFromLegacy(inferred);
  delete (hydrated as Record<string, unknown>).tipoPropiedadOtro;
  return hydrated;
}
