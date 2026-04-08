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

export const RENTAS_PRIVADO_FORM_VERSION = 1 as const;

export type RentasPlazoContratoCodigo =
  | ""
  | "mes-a-mes"
  | "6-meses"
  | "12-meses"
  | "1-ano"
  | "2-anos";

export type RentasPrivadoListingStatus = "disponible" | "pendiente" | "bajo_contrato" | "rentado";

export type RentasPrivadoFormState = {
  v: typeof RENTAS_PRIVADO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  titulo: string;
  /** Digits only, USD whole dollars per month */
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
    /** Kept aligned with BR Privado draft shape; Rentas UI may omit local video for now. */
    videoLocalDataUrl: string;
  };
  seller: {
    fotoDataUrl: string;
    nombre: string;
    telefono: string;
    whatsapp: string;
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
  if (v === "mes-a-mes" || v === "6-meses" || v === "12-meses" || v === "1-ano" || v === "2-anos") return v;
  return "";
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
    media: { ...br.media },
    seller: {
      fotoDataUrl: br.seller.fotoDataUrl,
      nombre: br.seller.nombre,
      telefono: br.seller.telefono,
      whatsapp: br.seller.whatsapp,
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
          correo: partial.seller.correo,
          notaContacto: partial.seller.notaContacto,
        }
      : undefined,
    residencial: partial.residencial,
    comercial: partial.comercial,
    terreno: partial.terreno,
  };

  const br = mergePartialBienesRaicesPrivadoState({
    ...brPartial,
    v: BR_PRIVADO_FORM_VERSION,
  });

  return {
    v: RENTAS_PRIVADO_FORM_VERSION,
    categoriaPropiedad: coerceBrNegocioCategoriaPropiedad(partial.categoriaPropiedad ?? br.categoriaPropiedad),
    titulo: typeof partial.titulo === "string" ? partial.titulo : br.titulo,
    rentaMensual:
      typeof partial.rentaMensual === "string"
        ? String(partial.rentaMensual).replace(/\D/g, "")
        : String(br.precio ?? "").replace(/\D/g, ""),
    deposito: typeof partial.deposito === "string" ? partial.deposito : base.deposito,
    plazoContrato: coercePlazo(partial.plazoContrato),
    disponibilidad: typeof partial.disponibilidad === "string" ? partial.disponibilidad : base.disponibilidad,
    amueblado: coerceAmueblado(partial.amueblado),
    mascotas: coerceMascotas(partial.mascotas),
    serviciosIncluidos: typeof partial.serviciosIncluidos === "string" ? partial.serviciosIncluidos : base.serviciosIncluidos,
    requisitos: typeof partial.requisitos === "string" ? partial.requisitos : base.requisitos,
    ciudad: br.ciudad,
    ubicacionLinea: br.ubicacionLinea,
    enlaceMapa: br.enlaceMapa,
    descripcion: br.descripcion,
    estadoAnuncio: coerceRentasListingStatus(partial.estadoAnuncio ?? br.estadoAnuncio),
    media: { ...br.media },
    seller: {
      fotoDataUrl: br.seller.fotoDataUrl,
      nombre: br.seller.nombre,
      telefono: br.seller.telefono,
      whatsapp: br.seller.whatsapp,
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
