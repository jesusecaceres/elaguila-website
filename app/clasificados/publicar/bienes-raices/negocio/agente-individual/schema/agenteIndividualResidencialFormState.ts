import type { TipoPropiedadCodigo } from "./agenteResidencialTipoMeta";

export type { TipoPropiedadCodigo };

export type AgenteResidencialEstadoAnuncio = "disponible" | "pendiente" | "bajo_contrato" | "vendido";

export type AgenteResidencialCondicionPropiedad = "excelente" | "buena" | "regular" | "necesita_reparacion";

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

  titulo: string;
  precio: string;
  ciudad: string;
  areaCiudad: string;
  direccion: string;
  estadoAnuncio: AgenteResidencialEstadoAnuncio;

  tipoPropiedadCodigo: TipoPropiedadCodigo;
  tipoPropiedadOtro: string;
  subtipoPropiedad: string;

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
  /** Tarjeta: teléfono mostrado; respaldo para CTAs si el destino dedicado va vacío. */
  telefonoPrincipal: string;
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

  extraOpenHouse: boolean;
  openHouseFecha: string;
  openHouseInicio: string;
  openHouseFin: string;
  openHouseNotas: string;

  extraAsesorFinanciero: boolean;
  asesorNombre: string;
  asesorTelefono: string;
  asesorEmail: string;
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

  if (typeof p.titulo === "string") out.titulo = p.titulo;
  if (typeof p.precio === "string") out.precio = p.precio;
  if (typeof p.ciudad === "string") out.ciudad = p.ciudad;
  if (typeof p.areaCiudad === "string") out.areaCiudad = p.areaCiudad;
  if (typeof p.direccion === "string") out.direccion = p.direccion;
  if (typeof p.estadoAnuncio === "string") out.estadoAnuncio = mapEstadoLegacy(p.estadoAnuncio);

  if (typeof p.tipoPropiedadCodigo === "string") out.tipoPropiedadCodigo = p.tipoPropiedadCodigo as TipoPropiedadCodigo;
  if (typeof p.tipoPropiedadOtro === "string") out.tipoPropiedadOtro = p.tipoPropiedadOtro;
  if (typeof p.subtipoPropiedad === "string") out.subtipoPropiedad = p.subtipoPropiedad;

  if (typeof p.tipoPropiedad === "string" && trim(p.tipoPropiedad) && !out.tipoPropiedadCodigo) {
    out.tipoPropiedadCodigo = "otro";
    out.tipoPropiedadOtro = trim(p.tipoPropiedad);
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

  return out;
}

export function createEmptyAgenteIndividualResidencialFormState(): AgenteIndividualResidencialFormState {
  const destacados = {} as Record<AgenteResidencialDestacadoId, boolean>;
  for (const d of AGENTE_RES_DESTACADOS_DEFS) destacados[d.id] = false;

  return {
    tipoPublicacionFijo: "venta_residencial",

    titulo: "",
    precio: "",
    ciudad: "",
    areaCiudad: "",
    direccion: "",
    estadoAnuncio: "disponible",

    tipoPropiedadCodigo: "casa",
    tipoPropiedadOtro: "",
    subtipoPropiedad: "",

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

    descripcionPrincipal: "",
    notasAdicionales: "",

    agenteFotoDataUrl: "",
    agenteNombre: "",
    agenteTitulo: "",
    agenteLicencia: "",
    telefonoPrincipal: "",
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

    extraAsesorFinanciero: false,
    asesorNombre: "",
    asesorTelefono: "",
    asesorEmail: "",
  };
}

export const createEmptyAgenteIndividualResidencialState = createEmptyAgenteIndividualResidencialFormState;

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

  const tipoPropiedadCodigo =
    flat.tipoPropiedadCodigo ??
    nested.tipoPropiedadCodigo ??
    (typeof legacy.tipoPropiedad === "string" && trim(legacy.tipoPropiedad)
      ? ("otro" as TipoPropiedadCodigo)
      : base.tipoPropiedadCodigo);

  const tipoPropiedadOtro =
    typeof flat.tipoPropiedadOtro === "string"
      ? flat.tipoPropiedadOtro
      : nested.tipoPropiedadOtro ??
        (typeof legacy.tipoPropiedad === "string" && trim(legacy.tipoPropiedad) ? trim(legacy.tipoPropiedad) : base.tipoPropiedadOtro);

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

  return {
    ...base,
    ...nested,
    ...flat,
    tipoPublicacionFijo: "venta_residencial",
    mostrarMarcaEnTarjeta,
    estadoAnuncio: coerceEstado(flat.estadoAnuncio ?? nested.estadoAnuncio ?? base.estadoAnuncio),
    condicionPropiedad: coerceCondicion(flat.condicionPropiedad ?? nested.condicionPropiedad ?? base.condicionPropiedad),
    listadoUrl,
    listadoArchivoDataUrl,
    listadoArchivoNombre,
    permitirSolicitarInformacion,
    tipoPropiedadCodigo,
    tipoPropiedadOtro,
    telefonoPrincipal,
    correoPrincipal,
    fotosDataUrls,
    fotoPortadaIndex,
    destacados: {
      ...base.destacados,
      ...(nested.destacados ?? {}),
      ...(flat.destacados ?? {}),
    },
  };
}
