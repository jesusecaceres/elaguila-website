import {
  coerceBrNegocioCategoriaPropiedad,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type {
  BienesRaicesPrivadoComercialFields,
  BienesRaicesPrivadoResidencialFields,
  BienesRaicesPrivadoTerrenoFields,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { mergePartialBienesRaicesPrivadoState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { RentasPlazoContratoCodigo, RentasPrivadoListingStatus } from "../../privado/schema/rentasPrivadoFormState";
import type { RentasServicioIncluidoId } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
  RENTAS_PRIVADO_FORM_VERSION,
} from "../../privado/schema/rentasPrivadoFormState";

export const RENTAS_NEGOCIO_FORM_VERSION = 3 as const;

function coerceRentasListingStatus(raw: unknown): RentasPrivadoListingStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "vendido") return "rentado";
  if (v === "pendiente" || v === "bajo_contrato" || v === "rentado") return v;
  return "disponible";
}

export type RentasNegocioFormState = {
  v: typeof RENTAS_NEGOCIO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  titulo: string;
  rentaMensual: string;
  deposito: string;
  plazoContrato: RentasPlazoContratoCodigo;
  plazoContratoOtro: string;
  disponibilidad: string;
  amueblado: "" | "amueblado" | "sin_amueblar";
  mascotas: "" | "permitidas" | "no_permitidas";
  serviciosIncluidosKeys: RentasServicioIncluidoId[];
  serviciosIncluidosOtro: string;
  serviciosIncluidosLegacy: string;
  requisitos: string;
  ciudad: string;
  zonaVecindario: string;
  direccionLinea1: string;
  direccionLinea2: string;
  direccionCruceCercano: string;
  mostrarDireccionExacta: boolean;
  direccionNumero: string;
  direccionCalle: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
  ubicacionLinea: string;
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
  negocioNombre: string;
  negocioMarca: string;
  negocioLogoDataUrl: string;
  negocioLicencia: string;
  negocioTelDirecto: string;
  negocioTelOficina: string;
  negocioEmail: string;
  negocioWhatsapp: string;
  /** Número opcional solo para SMS (distinto de WhatsApp). */
  negocioMensajesTexto: string;
  negocioSitioWeb: string;
  negocioRedes: string;
  negocioBio: string;
  residencial: BienesRaicesPrivadoResidencialFields;
  comercial: BienesRaicesPrivadoComercialFields;
  terreno: BienesRaicesPrivadoTerrenoFields;

  confirmListingAccurate: boolean;
  confirmPhotosRepresentItem: boolean;
  confirmCommunityRules: boolean;
};

export function createEmptyRentasNegocioFormState(): RentasNegocioFormState {
  const p = createEmptyRentasPrivadoFormState();
  return {
    v: RENTAS_NEGOCIO_FORM_VERSION,
    categoriaPropiedad: p.categoriaPropiedad,
    titulo: "",
    rentaMensual: "",
    deposito: "",
    plazoContrato: "",
    plazoContratoOtro: "",
    disponibilidad: "",
    amueblado: "",
    mascotas: "",
    serviciosIncluidosKeys: [...p.serviciosIncluidosKeys],
    serviciosIncluidosOtro: "",
    serviciosIncluidosLegacy: "",
    requisitos: "",
    ciudad: "",
    zonaVecindario: "",
    direccionLinea1: p.direccionLinea1,
    direccionLinea2: p.direccionLinea2,
    direccionCruceCercano: p.direccionCruceCercano,
    mostrarDireccionExacta: p.mostrarDireccionExacta,
    direccionNumero: "",
    direccionCalle: "",
    direccionEstado: p.direccionEstado,
    direccionCodigoPostal: "",
    ubicacionLinea: "",
    enlaceMapa: "",
    descripcion: "",
    estadoAnuncio: "disponible",
    media: { ...p.media },
    negocioNombre: "",
    negocioMarca: "",
    negocioLogoDataUrl: "",
    negocioLicencia: "",
    negocioTelDirecto: "",
    negocioTelOficina: "",
    negocioEmail: "",
    negocioWhatsapp: "",
    negocioMensajesTexto: "",
    negocioSitioWeb: "",
    negocioRedes: "",
    negocioBio: "",
    residencial: { ...p.residencial },
    comercial: { ...p.comercial },
    terreno: { ...p.terreno },
    confirmListingAccurate: p.confirmListingAccurate,
    confirmPhotosRepresentItem: p.confirmPhotosRepresentItem,
    confirmCommunityRules: p.confirmCommunityRules,
  };
}

export function mergePartialRentasNegocioState(partial: Partial<RentasNegocioFormState> | null | undefined): RentasNegocioFormState {
  const base = createEmptyRentasNegocioFormState();
  if (!partial || typeof partial !== "object") return base;

  const {
    v: _dropV,
    negocioNombre: nn,
    negocioMarca: nm,
    negocioLogoDataUrl: nl,
    negocioLicencia: nlic,
    negocioTelDirecto: ntd,
    negocioTelOficina: nto,
    negocioEmail: ne,
    negocioWhatsapp: nw,
    negocioMensajesTexto: nSms,
    negocioSitioWeb: ns,
    negocioRedes: nr,
    negocioBio: nb,
    ...propLike
  } = partial;

  const asPrivado = mergePartialRentasPrivadoState({
    ...(propLike as Partial<import("../../privado/schema/rentasPrivadoFormState").RentasPrivadoFormState>),
    v: RENTAS_PRIVADO_FORM_VERSION,
    seller: {
      fotoDataUrl: "",
      nombre: typeof nn === "string" ? nn : "",
      telefono: typeof ntd === "string" ? ntd : "",
      whatsapp: typeof nw === "string" ? nw : "",
      mensajesTexto: typeof nSms === "string" ? nSms : "",
      correo: typeof ne === "string" ? ne : "",
      notaContacto: "",
    },
  });

  const br = mergePartialBienesRaicesPrivadoState({
    residencial: partial.residencial,
    comercial: partial.comercial,
    terreno: partial.terreno,
  });

  return {
    v: RENTAS_NEGOCIO_FORM_VERSION,
    categoriaPropiedad: coerceBrNegocioCategoriaPropiedad(partial.categoriaPropiedad ?? asPrivado.categoriaPropiedad),
    titulo: asPrivado.titulo,
    rentaMensual: asPrivado.rentaMensual,
    deposito: asPrivado.deposito,
    plazoContrato: asPrivado.plazoContrato,
    plazoContratoOtro: asPrivado.plazoContratoOtro,
    disponibilidad: asPrivado.disponibilidad,
    amueblado: asPrivado.amueblado,
    mascotas: asPrivado.mascotas,
    serviciosIncluidosKeys: asPrivado.serviciosIncluidosKeys,
    serviciosIncluidosOtro: asPrivado.serviciosIncluidosOtro,
    serviciosIncluidosLegacy: asPrivado.serviciosIncluidosLegacy,
    requisitos: asPrivado.requisitos,
    ciudad: asPrivado.ciudad,
    zonaVecindario: asPrivado.zonaVecindario,
    direccionLinea1: asPrivado.direccionLinea1,
    direccionLinea2: asPrivado.direccionLinea2,
    direccionCruceCercano: asPrivado.direccionCruceCercano,
    mostrarDireccionExacta: asPrivado.mostrarDireccionExacta,
    direccionNumero: asPrivado.direccionNumero,
    direccionCalle: asPrivado.direccionCalle,
    direccionEstado: asPrivado.direccionEstado,
    direccionCodigoPostal: asPrivado.direccionCodigoPostal,
    ubicacionLinea: asPrivado.ubicacionLinea,
    enlaceMapa: asPrivado.enlaceMapa,
    descripcion: asPrivado.descripcion,
    estadoAnuncio: coerceRentasListingStatus(partial.estadoAnuncio ?? asPrivado.estadoAnuncio),
    media: { ...asPrivado.media },
    negocioNombre: typeof nn === "string" ? nn : base.negocioNombre,
    negocioMarca: typeof nm === "string" ? nm : base.negocioMarca,
    negocioLogoDataUrl: typeof nl === "string" ? nl : base.negocioLogoDataUrl,
    negocioLicencia: typeof nlic === "string" ? nlic : base.negocioLicencia,
    negocioTelDirecto: typeof ntd === "string" ? ntd : base.negocioTelDirecto,
    negocioTelOficina: typeof nto === "string" ? nto : base.negocioTelOficina,
    negocioEmail: typeof ne === "string" ? ne : base.negocioEmail,
    negocioWhatsapp: typeof nw === "string" ? nw : base.negocioWhatsapp,
    negocioMensajesTexto: typeof nSms === "string" ? nSms : base.negocioMensajesTexto,
    negocioSitioWeb: typeof ns === "string" ? ns : base.negocioSitioWeb,
    negocioRedes: typeof nr === "string" ? nr : base.negocioRedes,
    negocioBio: typeof nb === "string" ? nb : base.negocioBio,
    residencial: br.residencial,
    comercial: br.comercial,
    terreno: br.terreno,
    confirmListingAccurate:
      typeof partial.confirmListingAccurate === "boolean" ? partial.confirmListingAccurate : asPrivado.confirmListingAccurate,
    confirmPhotosRepresentItem:
      typeof partial.confirmPhotosRepresentItem === "boolean"
        ? partial.confirmPhotosRepresentItem
        : asPrivado.confirmPhotosRepresentItem,
    confirmCommunityRules:
      typeof partial.confirmCommunityRules === "boolean" ? partial.confirmCommunityRules : asPrivado.confirmCommunityRules,
  };
}
