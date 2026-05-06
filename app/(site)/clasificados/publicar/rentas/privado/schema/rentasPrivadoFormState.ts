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
import { coerceRentasPostalDigits5 } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";

export type { RentasServicioIncluidoId } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";

export const RENTAS_PRIVADO_FORM_VERSION = 2 as const;

export type RentasPlazoContratoCodigo =
  | ""
  | "mes-a-mes"
  | "6-meses"
  | "12-meses"
  | "1-ano"
  | "2-anos"
  | "otro";

export type RentasPrivadoListingStatus = "disponible" | "pendiente" | "bajo_contrato" | "rentado";

export type RentasPrivadoFormState = {
  v: typeof RENTAS_PRIVADO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
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
  /** Ciudad (NorCal combobox) — primary city for listing */
  ciudad: string;
  /** Optional neighborhood / zone (not the city field) */
  zonaVecindario: string;
  /** Calle y número (línea única). Los campos número/calle siguen en el tipo por borradores antiguos. */
  direccionLinea1: string;
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
    /** Kept aligned with BR Privado draft shape; Rentas UI may omit local video for now. */
    videoLocalDataUrl: string;
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
};

const MAX_PHOTOS = 8;

function coerceRentasListingStatus(raw: unknown): RentasPrivadoListingStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "vendido") return "rentado";
  if (v === "pendiente" || v === "bajo_contrato" || v === "rentado") return v;
  return "disponible";
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

export function createEmptyRentasPrivadoFormState(): RentasPrivadoFormState {
  const br = mergePartialBienesRaicesPrivadoState({});
  return {
    v: RENTAS_PRIVADO_FORM_VERSION,
    categoriaPropiedad: br.categoriaPropiedad,
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
    ciudad: "",
    zonaVecindario: "",
    direccionLinea1: "",
    direccionNumero: "",
    direccionCalle: "",
    direccionEstado: "CA",
    direccionCodigoPostal: "",
    ubicacionLinea: "",
    enlaceMapa: "",
    descripcion: "",
    estadoAnuncio: "disponible",
    media: { ...br.media },
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

  return {
    v: RENTAS_PRIVADO_FORM_VERSION,
    categoriaPropiedad: coerceBrNegocioCategoriaPropiedad(partial.categoriaPropiedad ?? br.categoriaPropiedad),
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
    ciudad: br.ciudad,
    zonaVecindario: typeof partial.zonaVecindario === "string" ? partial.zonaVecindario : base.zonaVecindario,
    direccionLinea1,
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
    media: { ...br.media },
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
  };
}

export { MAX_PHOTOS };
