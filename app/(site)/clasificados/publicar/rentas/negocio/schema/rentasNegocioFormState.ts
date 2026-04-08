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
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
} from "../../privado/schema/rentasPrivadoFormState";

export const RENTAS_NEGOCIO_FORM_VERSION = 2 as const;

function coerceRentasListingStatus(raw: unknown): RentasPrivadoListingStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "vendido") return "rentado";
  if (v === "pendiente" || v === "bajo_contrato" || v === "rentado") return v;
  return "disponible";
}

function coercePlazo(raw: unknown): RentasPlazoContratoCodigo {
  const v = typeof raw === "string" ? raw : "";
  if (v === "mes-a-mes" || v === "6-meses" || v === "12-meses" || v === "1-ano" || v === "2-anos") return v;
  return "";
}

function coerceAmueblado(raw: unknown): "" | "amueblado" | "sin_amueblar" {
  const v = typeof raw === "string" ? raw : "";
  if (v === "amueblado" || v === "sin_amueblar") return v;
  return "";
}

function coerceMascotas(raw: unknown): "" | "permitidas" | "no_permitidas" {
  const v = typeof raw === "string" ? raw : "";
  if (v === "permitidas" || v === "no_permitidas") return v;
  return "";
}

export type RentasNegocioFormState = {
  v: typeof RENTAS_NEGOCIO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  titulo: string;
  rentaMensual: string;
  deposito: string;
  plazoContrato: RentasPlazoContratoCodigo;
  disponibilidad: string;
  amueblado: "" | "amueblado" | "sin_amueblar";
  mascotas: "" | "permitidas" | "no_permitidas";
  serviciosIncluidos: string;
  requisitos: string;
  ciudad: string;
  ubicacionLinea: string;
  enlaceMapa: string;
  descripcion: string;
  estadoAnuncio: RentasPrivadoListingStatus;
  media: {
    photoDataUrls: string[];
    primaryImageIndex: number;
    videoUrl: string;
  };
  negocioNombre: string;
  negocioMarca: string;
  negocioLogoDataUrl: string;
  negocioLicencia: string;
  negocioTelDirecto: string;
  negocioTelOficina: string;
  negocioEmail: string;
  negocioWhatsapp: string;
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
    disponibilidad: "",
    amueblado: "",
    mascotas: "",
    serviciosIncluidos: "",
    requisitos: "",
    ciudad: "",
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
    negocioSitioWeb: ns,
    negocioRedes: nr,
    negocioBio: nb,
    ...propLike
  } = partial;

  const asPrivado = mergePartialRentasPrivadoState({
    ...(propLike as Partial<import("../../privado/schema/rentasPrivadoFormState").RentasPrivadoFormState>),
    v: 1,
    seller: {
      fotoDataUrl: "",
      nombre: typeof nn === "string" ? nn : "",
      telefono: typeof ntd === "string" ? ntd : "",
      whatsapp: typeof nw === "string" ? nw : "",
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
    titulo: typeof partial.titulo === "string" ? partial.titulo : asPrivado.titulo,
    rentaMensual:
      typeof partial.rentaMensual === "string"
        ? String(partial.rentaMensual).replace(/\D/g, "")
        : asPrivado.rentaMensual,
    deposito: typeof partial.deposito === "string" ? partial.deposito : asPrivado.deposito,
    plazoContrato: coercePlazo(partial.plazoContrato ?? asPrivado.plazoContrato),
    disponibilidad: typeof partial.disponibilidad === "string" ? partial.disponibilidad : asPrivado.disponibilidad,
    amueblado: coerceAmueblado(partial.amueblado ?? asPrivado.amueblado),
    mascotas: coerceMascotas(partial.mascotas ?? asPrivado.mascotas),
    serviciosIncluidos:
      typeof partial.serviciosIncluidos === "string" ? partial.serviciosIncluidos : asPrivado.serviciosIncluidos,
    requisitos: typeof partial.requisitos === "string" ? partial.requisitos : asPrivado.requisitos,
    ciudad: asPrivado.ciudad,
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
