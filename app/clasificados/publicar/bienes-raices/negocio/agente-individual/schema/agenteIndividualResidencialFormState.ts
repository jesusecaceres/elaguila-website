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

export type AgenteIndividualResidencialFormState = {
  /** Solo venta residencial en esta variante (fijo en UI). */
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

  tourUrl: string;
  tourDataUrl: string;

  brochureUrl: string;
  brochureDataUrl: string;

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

  agenteNombre: string;
  agenteTitulo: string;
  agenteTelefono: string;
  agenteEmail: string;
  agenteFotoDataUrl: string;
  agenteLicencia: string;
  agenteSitioWeb: string;
  /** Un enlace por línea (hasta 5 en salida). */
  agenteRedes: string;
  agenteBioCorta: string;
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

  extraOpenHouse: boolean;
  openHouseFecha: string;
  openHouseInicio: string;
  openHouseFin: string;
  openHouseNotas: string;

  extraAsesorFinanciero: boolean;
  asesorNombre: string;
  asesorTelefono: string;
  asesorEmail: string;

  puntosCercanos: string;
  transporte: string;
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

function migrateFromNestedLegacy(p: Record<string, unknown>): Partial<AgenteIndividualResidencialFormState> {
  const out: Partial<AgenteIndividualResidencialFormState> = {};

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
    if (typeof ag.telefono === "string") out.agenteTelefono = ag.telefono;
    if (typeof ag.email === "string") out.agenteEmail = ag.email;
    if (typeof ag.fotoUrl === "string") out.agenteFotoDataUrl = ag.fotoUrl;
    if (typeof ag.licencia === "string") out.agenteLicencia = ag.licencia;
    if (typeof ag.sitioWeb === "string") out.agenteSitioWeb = ag.sitioWeb;
    if (Array.isArray(ag.redes)) {
      out.agenteRedes = (ag.redes as string[]).filter(Boolean).join("\n");
    }
    if (typeof ag.bio === "string") out.agenteBioCorta = ag.bio;
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
    if (typeof extras.puntosCercanos === "string") out.puntosCercanos = extras.puntosCercanos;
    if (typeof extras.transporte === "string") out.transporte = extras.transporte;
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

    tourUrl: "",
    tourDataUrl: "",

    brochureUrl: "",
    brochureDataUrl: "",

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

    agenteNombre: "",
    agenteTitulo: "",
    agenteTelefono: "",
    agenteEmail: "",
    agenteFotoDataUrl: "",
    agenteLicencia: "",
    agenteSitioWeb: "",
    agenteRedes: "",
    agenteBioCorta: "",
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

    extraOpenHouse: false,
    openHouseFecha: "",
    openHouseInicio: "",
    openHouseFin: "",
    openHouseNotas: "",

    extraAsesorFinanciero: false,
    asesorNombre: "",
    asesorTelefono: "",
    asesorEmail: "",

    puntosCercanos: "",
    transporte: "",
  };
}

/** Alias usado en la aplicación y borradores. */
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
  const flat = raw as Partial<AgenteIndividualResidencialFormState>;

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

  return {
    ...base,
    ...nested,
    ...flat,
    tipoPublicacionFijo: "venta_residencial",
    estadoAnuncio: coerceEstado(flat.estadoAnuncio ?? nested.estadoAnuncio ?? base.estadoAnuncio),
    condicionPropiedad: coerceCondicion(flat.condicionPropiedad ?? nested.condicionPropiedad ?? base.condicionPropiedad),
    listadoUrl,
    listadoArchivoDataUrl,
    listadoArchivoNombre,
    permitirSolicitarInformacion,
    tipoPropiedadCodigo,
    tipoPropiedadOtro,
    fotosDataUrls,
    fotoPortadaIndex,
    destacados: {
      ...base.destacados,
      ...(nested.destacados ?? {}),
      ...(flat.destacados ?? {}),
    },
  };
}
