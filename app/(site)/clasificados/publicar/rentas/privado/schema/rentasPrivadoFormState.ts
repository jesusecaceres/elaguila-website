import {
  coerceBrNegocioCategoriaPropiedad,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type {
  BienesRaicesPrivadoComercialFields,
  BienesRaicesPrivadoResidencialFields,
  BienesRaicesPrivadoTerrenoFields,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import {
  BR_PRIVADO_FORM_VERSION,
  mergePartialBienesRaicesPrivadoState,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { RentasServicioIncluidoId } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import { emptyRentasShowingSlice } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { coerceRentasPostalDigits5 } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasTipoDeRentaId } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { coerceRentasTipoDeRentaId } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import type { LeonixContactChannelsFormSlice } from "@/app/clasificados/lib/leonixContactChannelsV1";
import {
  createEmptyLeonixContactChannelsFormSlice,
  mergePartialLeonixContactChannelsFormSlice,
} from "@/app/clasificados/lib/leonixContactChannelsV1";

export type { RentasServicioIncluidoId } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";

export const RENTAS_PRIVADO_FORM_VERSION = 4 as const;

export type RentasPlazoContratoCodigo =
  | ""
  | "mes-a-mes"
  | "6-meses"
  | "12-meses"
  | "1-ano"
  | "2-anos"
  | "otro";

export type RentasPrivadoListingStatus = "disponible" | "pendiente" | "bajo_contrato" | "rentado";

export type RentasPrivadoPosterType = "" | "owner_private" | "agent" | "property_manager" | "business";

export type RentasPrivadoFormState = {
  v: typeof RENTAS_PRIVADO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  posterType: RentasPrivadoPosterType;
  titulo: string;
  /** Digits only, USD whole dollars per month */
  rentaMensual: string;
  /** Digits only, USD whole dollars (one-time deposit) */
  deposito: string;
  plazoContrato: RentasPlazoContratoCodigo;
  /** Free text when `plazoContrato === "otro"` */
  plazoContratoOtro: string;
  /** ISO `YYYY-MM-DD` from date input, or legacy free-text availability */
  disponibilidad: string;
  amueblado: "" | "amueblado" | "sin_amueblar";
  mascotas: "" | "permitidas" | "no_permitidas";
  serviciosIncluidosKeys: RentasServicioIncluidoId[];
  serviciosIncluidosOtro: string;
  /** Migrated from v1 `serviciosIncluidos` string when checklist empty */
  serviciosIncluidosLegacy: string;
  requisitos: string;
  /** Inventario específico de renta (más fino que `categoriaPropiedad`). */
  tipoDeRenta: RentasTipoDeRentaId | "";
  /** Texto libre cuando `tipoDeRenta === "otro"`. */
  tipoDeRentaOtro: string;
  /** Condiciones / reglas del espacio (texto libre, neutral). */
  condicionesAlquiler: string;
  /** Espacio tipo cuarto / compartido */
  rentasEspacioTipoBano: "" | "privado" | "compartido" | "no_incluido";
  rentasEspacioTipoCocina: "" | "privada" | "compartida" | "no_incluida";
  rentasEspacioEntradaPrivada: "" | "si" | "no";
  rentasEspacioLavanderia: "" | "si" | "no";
  rentasEspacioMaxOcupantes: string;
  /** Preferencias razonables para convivencia en espacio compartido (opcional). */
  rentasPreferenciasEspacioCompartido: string;
  /** Garaje / bodega / estacionamiento */
  rentasAlmacenTamanoAprox: string;
  rentasAlmacenAcceso24h: "" | "si" | "no";
  rentasAlmacenElectricidad: "" | "si" | "no";
  rentasAlmacenSeguridad: "" | "si" | "no";
  rentasAlmacenUsoPermitido: string;
  rentasAlmacenDimensiones: string;
  /** Oficina / local */
  rentasComercialUsoPermitido: string;
  rentasComercialTamanoFt2: string;
  rentasComercialBanoDisponible: "" | "si" | "no";
  rentasComercialHorarioAcceso: string;
  rentasComercialContratoMinimo: string;
  /** Terreno en renta */
  rentasLoteUsoPermitido: string;
  rentasLoteServiciosDisponibles: string;
  rentasLoteAcceso: string;
  rentasLoteZonificacion: string;
  /** Ciudad (NorCal combobox) — primary city for listing */
  ciudad: string;
  /** Optional neighborhood / zone (not the city field) */
  zonaVecindario: string;
  /** Calle y número (línea única). Los campos número/calle siguen en el tipo por borradores antiguos. */
  direccionLinea1: string;
  /** Dpto / unidad / suite (opcional). */
  direccionLinea2: string;
  /**
   * Calles principales o cruce cercano (opcional).
   * Se usa cuando NO se quiere exponer la dirección exacta públicamente.
   */
  direccionCruceCercano: string;
  /** Cuando es true, la salida pública puede usar la dirección exacta (líneas 1/2). */
  mostrarDireccionExacta: boolean;
  direccionNumero: string;
  direccionCalle: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
  /** Legacy single-line location; used if structured street fields are empty */
  ubicacionLinea: string;
  /** Deprecated: manual map URL removed from UI; kept for draft merge only */
  enlaceMapa: string;
  descripcion: string;
  estadoAnuncio: RentasPrivadoListingStatus;
  media: {
    photoDataUrls: string[];
    primaryImageIndex: number;
    videoUrl: string;
    /** Transient object/data URL used by preview runtime (never persisted as giant JSON). */
    videoLocalDataUrl: string;
    videoLocalDraftId: string;
    videoLocalFileName: string;
    videoLocalMimeType: string;
    videoLocalSizeBytes: number;
    videoLocalUpdatedAt: number;
  };
  seller: {
    fotoDataUrl: string;
    nombre: string;
    telefono: string;
    whatsapp: string;
    mensajesTexto: string;
    correo: string;
    notaContacto: string;
  };
  residencial: BienesRaicesPrivadoResidencialFields;
  comercial: BienesRaicesPrivadoComercialFields;
  terreno: BienesRaicesPrivadoTerrenoFields;

  confirmListingAccurate: boolean;
  confirmPhotosRepresentItem: boolean;
  confirmCommunityRules: boolean;
  /** Gate 12C — optional website, socials, channel toggles, preferred contact (not persisted separately from publish payload). */
  contactChannels: LeonixContactChannelsFormSlice;
  /** Gate 12E — optional showings / virtual tour (machine pairs at publish). */
  showingByAppointment: boolean;
  showingAvailability: string;
  showingInstructions: string;
  virtualTourUrl: string;
};

const MAX_PHOTOS = 8;

function coerceRentasListingStatus(raw: unknown): RentasPrivadoListingStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "vendido") return "rentado";
  if (v === "pendiente" || v === "bajo_contrato" || v === "rentado") return v;
  return "disponible";
}

function coercePosterType(raw: unknown): RentasPrivadoPosterType {
  const v = typeof raw === "string" ? raw : "";
  if (v === "owner_private" || v === "agent" || v === "property_manager" || v === "business") return v;
  return "";
}

function coercePlazo(raw: unknown): RentasPlazoContratoCodigo {
  const v = typeof raw === "string" ? raw : "";
  if (v === "mes-a-mes" || v === "6-meses" || v === "12-meses" || v === "1-ano" || v === "2-anos" || v === "otro") return v;
  return "";
}

const SERVICIO_IDS = new Set<RentasServicioIncluidoId>([
  "agua",
  "luz",
  "gas",
  "internet",
  "mantenimiento",
  "basura",
  "estacionamiento",
  "lavanderia",
  "aire_acondicionado",
  "seguridad",
  "piscina",
  "otro",
]);

function coerceServiciosKeys(raw: unknown): RentasServicioIncluidoId[] {
  if (!Array.isArray(raw)) return [];
  const out: RentasServicioIncluidoId[] = [];
  for (const x of raw) {
    if (typeof x === "string" && SERVICIO_IDS.has(x as RentasServicioIncluidoId)) {
      out.push(x as RentasServicioIncluidoId);
    }
  }
  return [...new Set(out)];
}

function coerceAmueblado(raw: unknown): RentasPrivadoFormState["amueblado"] {
  const v = typeof raw === "string" ? raw : "";
  if (v === "amueblado" || v === "sin_amueblar") return v;
  return "";
}

function coerceMascotas(raw: unknown): RentasPrivadoFormState["mascotas"] {
  const v = typeof raw === "string" ? raw : "";
  if (v === "permitidas" || v === "no_permitidas") return v;
  return "";
}

function coerceRentasSiNo(raw: unknown): "" | "si" | "no" {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "si" || v === "sí" || v === "yes") return "si";
  if (v === "no") return "no";
  return "";
}

function coerceRentasEspacioBano(raw: unknown): RentasPrivadoFormState["rentasEspacioTipoBano"] {
  const v = typeof raw === "string" ? raw : "";
  if (v === "privado" || v === "compartido" || v === "no_incluido") return v;
  return "";
}

function coerceRentasEspacioCocina(raw: unknown): RentasPrivadoFormState["rentasEspacioTipoCocina"] {
  const v = typeof raw === "string" ? raw : "";
  if (v === "privada" || v === "compartida" || v === "no_incluida") return v;
  return "";
}

function coerceNumber(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function createEmptyRentasPrivadoFormState(): RentasPrivadoFormState {
  const br = mergePartialBienesRaicesPrivadoState({});
  return {
    v: RENTAS_PRIVADO_FORM_VERSION,
    categoriaPropiedad: br.categoriaPropiedad,
    posterType: "",
    titulo: "",
    rentaMensual: "",
    deposito: "",
    plazoContrato: "",
    plazoContratoOtro: "",
    disponibilidad: "",
    amueblado: "",
    mascotas: "",
    serviciosIncluidosKeys: [],
    serviciosIncluidosOtro: "",
    serviciosIncluidosLegacy: "",
    requisitos: "",
    tipoDeRenta: "",
    tipoDeRentaOtro: "",
    condicionesAlquiler: "",
    rentasEspacioTipoBano: "",
    rentasEspacioTipoCocina: "",
    rentasEspacioEntradaPrivada: "",
    rentasEspacioLavanderia: "",
    rentasEspacioMaxOcupantes: "",
    rentasPreferenciasEspacioCompartido: "",
    rentasAlmacenTamanoAprox: "",
    rentasAlmacenAcceso24h: "",
    rentasAlmacenElectricidad: "",
    rentasAlmacenSeguridad: "",
    rentasAlmacenUsoPermitido: "",
    rentasAlmacenDimensiones: "",
    rentasComercialUsoPermitido: "",
    rentasComercialTamanoFt2: "",
    rentasComercialBanoDisponible: "",
    rentasComercialHorarioAcceso: "",
    rentasComercialContratoMinimo: "",
    rentasLoteUsoPermitido: "",
    rentasLoteServiciosDisponibles: "",
    rentasLoteAcceso: "",
    rentasLoteZonificacion: "",
    ciudad: "",
    zonaVecindario: "",
    direccionLinea1: "",
    direccionLinea2: "",
    direccionCruceCercano: "",
    mostrarDireccionExacta: false,
    direccionNumero: "",
    direccionCalle: "",
    direccionEstado: "CA",
    direccionCodigoPostal: "",
    ubicacionLinea: "",
    enlaceMapa: "",
    descripcion: "",
    estadoAnuncio: "disponible",
    media: {
      ...br.media,
      videoLocalDraftId: "",
      videoLocalFileName: "",
      videoLocalMimeType: "",
      videoLocalSizeBytes: 0,
      videoLocalUpdatedAt: 0,
    },
    seller: {
      fotoDataUrl: br.seller.fotoDataUrl,
      nombre: br.seller.nombre,
      telefono: br.seller.telefono,
      whatsapp: br.seller.whatsapp,
      mensajesTexto: br.seller.mensajesTexto,
      correo: br.seller.correo,
      notaContacto: br.seller.notaContacto,
    },
    residencial: { ...br.residencial },
    comercial: { ...br.comercial },
    terreno: { ...br.terreno },
    confirmListingAccurate: br.confirmListingAccurate,
    confirmPhotosRepresentItem: br.confirmPhotosRepresentItem,
    confirmCommunityRules: br.confirmCommunityRules,
    contactChannels: createEmptyLeonixContactChannelsFormSlice(),
    ...emptyRentasShowingSlice(),
  };
}

/** Merge partial JSON (localStorage) into a full Rentas Privado state. */
export function mergePartialRentasPrivadoState(partial: Partial<RentasPrivadoFormState> | null | undefined): RentasPrivadoFormState {
  const base = createEmptyRentasPrivadoFormState();
  if (!partial || typeof partial !== "object") return base;

  const brPartial: Parameters<typeof mergePartialBienesRaicesPrivadoState>[0] = {
    categoriaPropiedad: partial.categoriaPropiedad,
    titulo: partial.titulo,
    precio:
      typeof partial.rentaMensual === "string"
        ? partial.rentaMensual
        : typeof (partial as { precio?: string }).precio === "string"
          ? (partial as { precio: string }).precio
          : undefined,
    ciudad: partial.ciudad,
    ubicacionLinea: partial.ubicacionLinea,
    enlaceMapa: partial.enlaceMapa,
    descripcion: partial.descripcion,
    estadoAnuncio:
      partial.estadoAnuncio === "rentado"
        ? "vendido"
        : partial.estadoAnuncio === "disponible" ||
            partial.estadoAnuncio === "pendiente" ||
            partial.estadoAnuncio === "bajo_contrato"
          ? partial.estadoAnuncio
          : undefined,
    media: partial.media,
    seller: partial.seller
      ? {
          fotoDataUrl: partial.seller.fotoDataUrl,
          nombre: partial.seller.nombre,
          etiquetaRol: "",
          telefono: partial.seller.telefono,
          whatsapp: partial.seller.whatsapp,
          mensajesTexto: partial.seller.mensajesTexto,
          correo: partial.seller.correo,
          notaContacto: partial.seller.notaContacto,
        }
      : undefined,
    residencial: partial.residencial,
    comercial: partial.comercial,
    terreno: partial.terreno,
    petsAllowed:
      partial.mascotas === "permitidas" ? "yes" : partial.mascotas === "no_permitidas" ? "no" : undefined,
  };

  const br = mergePartialBienesRaicesPrivadoState({
    ...brPartial,
    v: BR_PRIVADO_FORM_VERSION,
  });

  const mergedNum = typeof partial.direccionNumero === "string" ? partial.direccionNumero : base.direccionNumero;
  const mergedCalle = typeof partial.direccionCalle === "string" ? partial.direccionCalle : base.direccionCalle;
  const mergedUbicRaw = typeof partial.ubicacionLinea === "string" ? partial.ubicacionLinea : br.ubicacionLinea;
  const fromParts = [mergedNum.trim(), mergedCalle.trim()].filter(Boolean).join(" ").trim();
  const partialLine1 = typeof partial.direccionLinea1 === "string" ? partial.direccionLinea1.trim() : "";
  const direccionLinea1 =
    partialLine1 || fromParts || mergedUbicRaw.trim() || base.direccionLinea1;
  const direccionLinea2 = typeof partial.direccionLinea2 === "string" ? partial.direccionLinea2 : base.direccionLinea2;
  const direccionCruceCercano =
    typeof (partial as { direccionCruceCercano?: unknown }).direccionCruceCercano === "string"
      ? String((partial as { direccionCruceCercano: string }).direccionCruceCercano)
      : base.direccionCruceCercano;
  const mostrarDireccionExacta =
    typeof (partial as { mostrarDireccionExacta?: unknown }).mostrarDireccionExacta === "boolean"
      ? Boolean((partial as { mostrarDireccionExacta: boolean }).mostrarDireccionExacta)
      : base.mostrarDireccionExacta;

  return {
    v: RENTAS_PRIVADO_FORM_VERSION,
    categoriaPropiedad: coerceBrNegocioCategoriaPropiedad(partial.categoriaPropiedad ?? br.categoriaPropiedad),
    posterType: coercePosterType(partial.posterType),
    titulo: typeof partial.titulo === "string" ? partial.titulo : br.titulo,
    rentaMensual:
      typeof partial.rentaMensual === "string"
        ? String(partial.rentaMensual).replace(/\D/g, "")
        : String(br.precio ?? "").replace(/\D/g, ""),
    deposito:
      typeof partial.deposito === "string"
        ? String(partial.deposito).replace(/\D/g, "")
        : String(base.deposito).replace(/\D/g, ""),
    plazoContrato: coercePlazo(partial.plazoContrato),
    plazoContratoOtro: typeof partial.plazoContratoOtro === "string" ? partial.plazoContratoOtro : base.plazoContratoOtro,
    disponibilidad: typeof partial.disponibilidad === "string" ? partial.disponibilidad : base.disponibilidad,
    amueblado: coerceAmueblado(partial.amueblado),
    mascotas: coerceMascotas(partial.mascotas),
    serviciosIncluidosKeys: coerceServiciosKeys(partial.serviciosIncluidosKeys),
    serviciosIncluidosOtro: typeof partial.serviciosIncluidosOtro === "string" ? partial.serviciosIncluidosOtro : base.serviciosIncluidosOtro,
    serviciosIncluidosLegacy: (() => {
      const keys = coerceServiciosKeys(partial.serviciosIncluidosKeys);
      const otroT =
        typeof partial.serviciosIncluidosOtro === "string" ? partial.serviciosIncluidosOtro.trim() : "";
      const explicit =
        typeof partial.serviciosIncluidosLegacy === "string" ? partial.serviciosIncluidosLegacy.trim() : "";
      const oldV1 =
        typeof (partial as { serviciosIncluidos?: unknown }).serviciosIncluidos === "string"
          ? String((partial as { serviciosIncluidos: string }).serviciosIncluidos).trim()
          : "";
      if (keys.length || otroT) return explicit;
      return explicit || oldV1 || "";
    })(),
    requisitos: typeof partial.requisitos === "string" ? partial.requisitos : base.requisitos,
    tipoDeRenta: coerceRentasTipoDeRentaId(partial.tipoDeRenta),
    tipoDeRentaOtro: typeof partial.tipoDeRentaOtro === "string" ? partial.tipoDeRentaOtro : base.tipoDeRentaOtro,
    condicionesAlquiler: typeof partial.condicionesAlquiler === "string" ? partial.condicionesAlquiler : base.condicionesAlquiler,
    rentasEspacioTipoBano: coerceRentasEspacioBano(partial.rentasEspacioTipoBano),
    rentasEspacioTipoCocina: coerceRentasEspacioCocina(partial.rentasEspacioTipoCocina),
    rentasEspacioEntradaPrivada: coerceRentasSiNo(partial.rentasEspacioEntradaPrivada),
    rentasEspacioLavanderia: coerceRentasSiNo(partial.rentasEspacioLavanderia),
    rentasEspacioMaxOcupantes:
      typeof partial.rentasEspacioMaxOcupantes === "string"
        ? String(partial.rentasEspacioMaxOcupantes).replace(/\D/g, "")
        : base.rentasEspacioMaxOcupantes,
    rentasPreferenciasEspacioCompartido:
      typeof partial.rentasPreferenciasEspacioCompartido === "string"
        ? partial.rentasPreferenciasEspacioCompartido
        : base.rentasPreferenciasEspacioCompartido,
    rentasAlmacenTamanoAprox: typeof partial.rentasAlmacenTamanoAprox === "string" ? partial.rentasAlmacenTamanoAprox : base.rentasAlmacenTamanoAprox,
    rentasAlmacenAcceso24h: coerceRentasSiNo(partial.rentasAlmacenAcceso24h),
    rentasAlmacenElectricidad: coerceRentasSiNo(partial.rentasAlmacenElectricidad),
    rentasAlmacenSeguridad: coerceRentasSiNo(partial.rentasAlmacenSeguridad),
    rentasAlmacenUsoPermitido:
      typeof partial.rentasAlmacenUsoPermitido === "string" ? partial.rentasAlmacenUsoPermitido : base.rentasAlmacenUsoPermitido,
    rentasAlmacenDimensiones:
      typeof partial.rentasAlmacenDimensiones === "string" ? partial.rentasAlmacenDimensiones : base.rentasAlmacenDimensiones,
    rentasComercialUsoPermitido:
      typeof partial.rentasComercialUsoPermitido === "string" ? partial.rentasComercialUsoPermitido : base.rentasComercialUsoPermitido,
    rentasComercialTamanoFt2:
      typeof partial.rentasComercialTamanoFt2 === "string"
        ? String(partial.rentasComercialTamanoFt2).replace(/\D/g, "")
        : base.rentasComercialTamanoFt2,
    rentasComercialBanoDisponible: coerceRentasSiNo(partial.rentasComercialBanoDisponible),
    rentasComercialHorarioAcceso:
      typeof partial.rentasComercialHorarioAcceso === "string" ? partial.rentasComercialHorarioAcceso : base.rentasComercialHorarioAcceso,
    rentasComercialContratoMinimo:
      typeof partial.rentasComercialContratoMinimo === "string" ? partial.rentasComercialContratoMinimo : base.rentasComercialContratoMinimo,
    rentasLoteUsoPermitido: typeof partial.rentasLoteUsoPermitido === "string" ? partial.rentasLoteUsoPermitido : base.rentasLoteUsoPermitido,
    rentasLoteServiciosDisponibles:
      typeof partial.rentasLoteServiciosDisponibles === "string" ? partial.rentasLoteServiciosDisponibles : base.rentasLoteServiciosDisponibles,
    rentasLoteAcceso: typeof partial.rentasLoteAcceso === "string" ? partial.rentasLoteAcceso : base.rentasLoteAcceso,
    rentasLoteZonificacion: typeof partial.rentasLoteZonificacion === "string" ? partial.rentasLoteZonificacion : base.rentasLoteZonificacion,
    ciudad: br.ciudad,
    zonaVecindario: typeof partial.zonaVecindario === "string" ? partial.zonaVecindario : base.zonaVecindario,
    direccionLinea1,
    direccionLinea2,
    direccionCruceCercano,
    mostrarDireccionExacta,
    direccionNumero: mergedNum,
    direccionCalle: mergedCalle,
    direccionEstado:
      typeof partial.direccionEstado === "string" && partial.direccionEstado.trim()
        ? partial.direccionEstado.trim()
        : base.direccionEstado,
    direccionCodigoPostal: coerceRentasPostalDigits5(
      typeof partial.direccionCodigoPostal === "string" ? partial.direccionCodigoPostal : base.direccionCodigoPostal,
    ),
    ubicacionLinea: br.ubicacionLinea,
    enlaceMapa: typeof partial.enlaceMapa === "string" ? partial.enlaceMapa : br.enlaceMapa,
    descripcion: br.descripcion,
    estadoAnuncio: coerceRentasListingStatus(partial.estadoAnuncio ?? br.estadoAnuncio),
    media: {
      ...br.media,
      videoLocalDraftId:
        typeof (partial.media as { videoLocalDraftId?: unknown } | undefined)?.videoLocalDraftId === "string"
          ? String((partial.media as { videoLocalDraftId: string }).videoLocalDraftId)
          : "",
      videoLocalFileName:
        typeof (partial.media as { videoLocalFileName?: unknown } | undefined)?.videoLocalFileName === "string"
          ? String((partial.media as { videoLocalFileName: string }).videoLocalFileName)
          : "",
      videoLocalMimeType:
        typeof (partial.media as { videoLocalMimeType?: unknown } | undefined)?.videoLocalMimeType === "string"
          ? String((partial.media as { videoLocalMimeType: string }).videoLocalMimeType)
          : "",
      videoLocalSizeBytes: coerceNumber((partial.media as { videoLocalSizeBytes?: unknown } | undefined)?.videoLocalSizeBytes),
      videoLocalUpdatedAt: coerceNumber((partial.media as { videoLocalUpdatedAt?: unknown } | undefined)?.videoLocalUpdatedAt),
    },
    seller: {
      fotoDataUrl: br.seller.fotoDataUrl,
      nombre: br.seller.nombre,
      telefono: br.seller.telefono,
      whatsapp: br.seller.whatsapp,
      mensajesTexto: br.seller.mensajesTexto,
      correo: br.seller.correo,
      notaContacto: br.seller.notaContacto,
    },
    residencial: br.residencial,
    comercial: br.comercial,
    terreno: br.terreno,
    confirmListingAccurate:
      typeof partial.confirmListingAccurate === "boolean" ? partial.confirmListingAccurate : br.confirmListingAccurate,
    confirmPhotosRepresentItem:
      typeof partial.confirmPhotosRepresentItem === "boolean"
        ? partial.confirmPhotosRepresentItem
        : br.confirmPhotosRepresentItem,
    confirmCommunityRules:
      typeof partial.confirmCommunityRules === "boolean" ? partial.confirmCommunityRules : br.confirmCommunityRules,
    contactChannels: mergePartialLeonixContactChannelsFormSlice(
      createEmptyRentasPrivadoFormState().contactChannels,
      partial.contactChannels as Partial<LeonixContactChannelsFormSlice> | undefined,
    ),
    showingByAppointment:
      typeof partial.showingByAppointment === "boolean" ? partial.showingByAppointment : base.showingByAppointment,
    showingAvailability:
      typeof partial.showingAvailability === "string" ? partial.showingAvailability : base.showingAvailability,
    showingInstructions:
      typeof partial.showingInstructions === "string" ? partial.showingInstructions : base.showingInstructions,
    virtualTourUrl: typeof partial.virtualTourUrl === "string" ? partial.virtualTourUrl : base.virtualTourUrl,
  };
}

export { MAX_PHOTOS };
