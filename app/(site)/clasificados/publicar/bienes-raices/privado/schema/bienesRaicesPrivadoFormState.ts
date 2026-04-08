import {
  coerceBrNegocioCategoriaPropiedad,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  COMERCIAL_DESTACADOS_DEFS,
  TERRENO_DESTACADOS_DEFS,
  type ComercialDestacadoId,
  type ComercialTipoCodigo,
  type TerrenoDestacadoId,
  type TerrenoTipoCodigo,
  normalizeComercialTipoCodigo,
  normalizeTerrenoTipoCodigo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import type { TipoPropiedadCodigo } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { normalizeResidencialTipoPropiedadCodigo } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";

export const BR_PRIVADO_FORM_VERSION = 1 as const;

export type BrPrivadoListingStatus = "disponible" | "pendiente" | "bajo_contrato" | "vendido";

export type BrPrivadoCondicion = "" | "excelente" | "buena" | "regular" | "necesita_reparacion";

function coerceListingStatus(raw: unknown): BrPrivadoListingStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v === "pendiente" || v === "bajo_contrato" || v === "vendido") return v;
  return "disponible";
}

function coerceCondicion(raw: unknown): BrPrivadoCondicion {
  const v = typeof raw === "string" ? raw : "";
  if (v === "excelente" || v === "buena" || v === "regular" || v === "necesita_reparacion") return v;
  return "";
}

function coerceStringArray(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => typeof x === "string").slice(0, max);
}

const VALID_COMERCIAL_DEST = new Set(COMERCIAL_DESTACADOS_DEFS.map((d) => d.id));
const VALID_TERRENO_DEST = new Set(TERRENO_DESTACADOS_DEFS.map((d) => d.id));
const VALID_RES_HIGHLIGHT = new Set(BR_HIGHLIGHT_PRESET_DEFS.map((d) => d.key));

function coerceComercialDestacados(raw: unknown): ComercialDestacadoId[] {
  return coerceStringArray(raw, 24).filter((x): x is ComercialDestacadoId => VALID_COMERCIAL_DEST.has(x as ComercialDestacadoId));
}

function coerceTerrenoDestacados(raw: unknown): TerrenoDestacadoId[] {
  return coerceStringArray(raw, 24).filter((x): x is TerrenoDestacadoId => VALID_TERRENO_DEST.has(x as TerrenoDestacadoId));
}

function coerceResidencialHighlights(raw: unknown): string[] {
  return coerceStringArray(raw, 24).filter((k) => VALID_RES_HIGHLIGHT.has(k));
}

export type BienesRaicesPrivadoResidencialFields = {
  tipoCodigo: TipoPropiedadCodigo;
  subtipo: string;
  recamaras: string;
  banos: string;
  mediosBanos: string;
  interiorSqft: string;
  loteSqft: string;
  estacionamiento: string;
  ano: string;
  condicion: BrPrivadoCondicion;
  /** Keys from `BR_HIGHLIGHT_PRESET_DEFS` */
  highlightKeys: string[];
};

export type BienesRaicesPrivadoComercialFields = {
  tipoCodigo: ComercialTipoCodigo;
  subtipo: string;
  uso: string;
  interiorSqft: string;
  oficinas: string;
  banos: string;
  niveles: string;
  estacionamiento: string;
  zonificacion: string;
  condicion: BrPrivadoCondicion;
  accesoCarga: boolean;
  destacadoIds: ComercialDestacadoId[];
};

export type BienesRaicesPrivadoTerrenoFields = {
  tipoCodigo: TerrenoTipoCodigo;
  subtipo: string;
  loteSqft: string;
  usoZonificacion: string;
  acceso: string;
  servicios: string;
  topografia: string;
  listoConstruir: boolean;
  cercado: boolean;
  destacadoIds: TerrenoDestacadoId[];
};

export type BienesRaicesPrivadoFormState = {
  v: typeof BR_PRIVADO_FORM_VERSION;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  titulo: string;
  /** Digits only, USD whole dollars */
  precio: string;
  ciudad: string;
  ubicacionLinea: string;
  enlaceMapa: string;
  descripcion: string;
  estadoAnuncio: BrPrivadoListingStatus;
  media: {
    photoDataUrls: string[];
    primaryImageIndex: number;
    videoUrl: string;
  };
  /** Particular only: name, phones, email, optional photo — no web/social fields */
  seller: {
    fotoDataUrl: string;
    nombre: string;
    etiquetaRol: string;
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

export function createEmptyBienesRaicesPrivadoFormState(): BienesRaicesPrivadoFormState {
  return {
    v: BR_PRIVADO_FORM_VERSION,
    categoriaPropiedad: "residencial",
    titulo: "",
    precio: "",
    ciudad: "",
    ubicacionLinea: "",
    enlaceMapa: "",
    descripcion: "",
    estadoAnuncio: "disponible",
    media: {
      photoDataUrls: [],
      primaryImageIndex: 0,
      videoUrl: "",
    },
    seller: {
      fotoDataUrl: "",
      nombre: "",
      etiquetaRol: "",
      telefono: "",
      whatsapp: "",
      correo: "",
      notaContacto: "",
    },
    residencial: {
      tipoCodigo: "casa",
      subtipo: "",
      recamaras: "",
      banos: "",
      mediosBanos: "",
      interiorSqft: "",
      loteSqft: "",
      estacionamiento: "",
      ano: "",
      condicion: "",
      highlightKeys: [],
    },
    comercial: {
      tipoCodigo: "oficina",
      subtipo: "",
      uso: "",
      interiorSqft: "",
      oficinas: "",
      banos: "",
      niveles: "",
      estacionamiento: "",
      zonificacion: "",
      condicion: "",
      accesoCarga: false,
      destacadoIds: [],
    },
    terreno: {
      tipoCodigo: "lote_residencial",
      subtipo: "",
      loteSqft: "",
      usoZonificacion: "",
      acceso: "",
      servicios: "",
      topografia: "",
      listoConstruir: false,
      cercado: false,
      destacadoIds: [],
    },
    confirmListingAccurate: false,
    confirmPhotosRepresentItem: false,
    confirmCommunityRules: false,
  };
}

export function mergePartialBienesRaicesPrivadoState(
  partial: Partial<BienesRaicesPrivadoFormState> | null | undefined,
): BienesRaicesPrivadoFormState {
  const base = createEmptyBienesRaicesPrivadoFormState();
  if (!partial || typeof partial !== "object") return base;

  const mediaIn = partial.media;
  const sellerIn = partial.seller;
  const resIn = partial.residencial;
  const comIn = partial.comercial;
  const terIn = partial.terreno;

  const photoDataUrls = coerceStringArray(mediaIn?.photoDataUrls, MAX_PHOTOS);
  let primaryImageIndex = typeof mediaIn?.primaryImageIndex === "number" ? mediaIn!.primaryImageIndex! : 0;
  if (photoDataUrls.length === 0) primaryImageIndex = 0;
  else primaryImageIndex = Math.min(Math.max(0, primaryImageIndex), photoDataUrls.length - 1);

  return {
    ...base,
    ...partial,
    v: BR_PRIVADO_FORM_VERSION,
    categoriaPropiedad: coerceBrNegocioCategoriaPropiedad(partial.categoriaPropiedad ?? base.categoriaPropiedad),
    titulo: typeof partial.titulo === "string" ? partial.titulo : base.titulo,
    precio: typeof partial.precio === "string" ? String(partial.precio).replace(/\D/g, "") : base.precio,
    ciudad: typeof partial.ciudad === "string" ? partial.ciudad : base.ciudad,
    ubicacionLinea: typeof partial.ubicacionLinea === "string" ? partial.ubicacionLinea : base.ubicacionLinea,
    enlaceMapa: typeof partial.enlaceMapa === "string" ? partial.enlaceMapa : base.enlaceMapa,
    descripcion: typeof partial.descripcion === "string" ? partial.descripcion : base.descripcion,
    estadoAnuncio: coerceListingStatus(partial.estadoAnuncio),
    media: {
      ...base.media,
      photoDataUrls,
      primaryImageIndex,
      videoUrl: typeof mediaIn?.videoUrl === "string" ? mediaIn.videoUrl : base.media.videoUrl,
    },
    seller: {
      ...base.seller,
      fotoDataUrl: typeof sellerIn?.fotoDataUrl === "string" ? sellerIn.fotoDataUrl : base.seller.fotoDataUrl,
      nombre: typeof sellerIn?.nombre === "string" ? sellerIn.nombre : base.seller.nombre,
      etiquetaRol: typeof sellerIn?.etiquetaRol === "string" ? sellerIn.etiquetaRol : base.seller.etiquetaRol,
      telefono: typeof sellerIn?.telefono === "string" ? sellerIn.telefono : base.seller.telefono,
      whatsapp: typeof sellerIn?.whatsapp === "string" ? sellerIn.whatsapp : base.seller.whatsapp,
      correo: typeof sellerIn?.correo === "string" ? sellerIn.correo : base.seller.correo,
      notaContacto: typeof sellerIn?.notaContacto === "string" ? sellerIn.notaContacto : base.seller.notaContacto,
    },
    residencial: {
      ...base.residencial,
      ...resIn,
      tipoCodigo: normalizeResidencialTipoPropiedadCodigo(resIn?.tipoCodigo ?? base.residencial.tipoCodigo),
      subtipo: typeof resIn?.subtipo === "string" ? resIn.subtipo : base.residencial.subtipo,
      condicion: coerceCondicion(resIn?.condicion),
      highlightKeys: coerceResidencialHighlights(resIn?.highlightKeys),
    },
    comercial: {
      ...base.comercial,
      ...comIn,
      tipoCodigo: normalizeComercialTipoCodigo(comIn?.tipoCodigo ?? base.comercial.tipoCodigo),
      subtipo: typeof comIn?.subtipo === "string" ? comIn.subtipo : base.comercial.subtipo,
      condicion: coerceCondicion(comIn?.condicion),
      accesoCarga: Boolean(comIn?.accesoCarga),
      destacadoIds: coerceComercialDestacados(comIn?.destacadoIds),
    },
    terreno: {
      ...base.terreno,
      ...terIn,
      tipoCodigo: normalizeTerrenoTipoCodigo(terIn?.tipoCodigo ?? base.terreno.tipoCodigo),
      subtipo: typeof terIn?.subtipo === "string" ? terIn.subtipo : base.terreno.subtipo,
      listoConstruir: Boolean(terIn?.listoConstruir),
      cercado: Boolean(terIn?.cercado),
      destacadoIds: coerceTerrenoDestacados(terIn?.destacadoIds),
    },
    confirmListingAccurate:
      typeof partial.confirmListingAccurate === "boolean" ? partial.confirmListingAccurate : base.confirmListingAccurate,
    confirmPhotosRepresentItem:
      typeof partial.confirmPhotosRepresentItem === "boolean"
        ? partial.confirmPhotosRepresentItem
        : base.confirmPhotosRepresentItem,
    confirmCommunityRules:
      typeof partial.confirmCommunityRules === "boolean" ? partial.confirmCommunityRules : base.confirmCommunityRules,
  };
}
