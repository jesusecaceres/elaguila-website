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
import type { LeonixContactChannelsFormSlice } from "@/app/clasificados/lib/leonixContactChannelsV1";
import {
  createEmptyLeonixContactChannelsFormSlice,
  mergePartialLeonixContactChannelsFormSlice,
} from "@/app/clasificados/lib/leonixContactChannelsV1";

export const BR_PRIVADO_FORM_VERSION = 3 as const;

/** Gate 12D — HOA fee cadence (persisted inside `Leonix:br_gate12d_v1`). */
export type BrPrivadoHoaFrequency = "" | "monthly" | "quarterly" | "yearly" | "unknown";
export type BrPrivadoTriBool = "" | "yes" | "no" | "unknown";

export type BrPrivadoGate12dSlice = {
  calleNumero: string;
  unidad: string;
  estado: string;
  codigoPostal: string;
  colonia: string;
  hasHoa: BrPrivadoTriBool;
  hoaFee: string;
  hoaFrequency: BrPrivadoHoaFrequency;
  hoaIncludes: string;
  communityRules: string;
  petRules: string;
  rentalRestrictions: string;
  shortTermRentalAllowed: BrPrivadoTriBool;
  parkingRules: string;
  openHouseEnabled: boolean;
  openHouseDate: string;
  openHouseStartTime: string;
  openHouseEndTime: string;
  showingByAppointment: boolean;
  showingInstructions: string;
  virtualTourUrl: string;
};

function createEmptyBrPrivadoGate12dSlice(): BrPrivadoGate12dSlice {
  return {
    calleNumero: "",
    unidad: "",
    estado: "",
    codigoPostal: "",
    colonia: "",
    hasHoa: "",
    hoaFee: "",
    hoaFrequency: "",
    hoaIncludes: "",
    communityRules: "",
    petRules: "",
    rentalRestrictions: "",
    shortTermRentalAllowed: "",
    parkingRules: "",
    openHouseEnabled: false,
    openHouseDate: "",
    openHouseStartTime: "",
    openHouseEndTime: "",
    showingByAppointment: false,
    showingInstructions: "",
    virtualTourUrl: "",
  };
}

function coerceBrPrivadoTriBool(raw: unknown): BrPrivadoTriBool {
  if (raw === "yes" || raw === "no" || raw === "unknown") return raw;
  return "";
}

function coerceBrPrivadoHoaFrequency(raw: unknown): BrPrivadoHoaFrequency {
  if (raw === "monthly" || raw === "quarterly" || raw === "yearly" || raw === "unknown") return raw;
  return "";
}

function mergeBrPrivadoGate12dSlice(partial: unknown): BrPrivadoGate12dSlice {
  const base = createEmptyBrPrivadoGate12dSlice();
  if (!partial || typeof partial !== "object") return base;
  const g = partial as Record<string, unknown>;
  return {
    ...base,
    calleNumero: typeof g.calleNumero === "string" ? g.calleNumero : base.calleNumero,
    unidad: typeof g.unidad === "string" ? g.unidad : base.unidad,
    estado: typeof g.estado === "string" ? g.estado : base.estado,
    codigoPostal: typeof g.codigoPostal === "string" ? g.codigoPostal : base.codigoPostal,
    colonia: typeof g.colonia === "string" ? g.colonia : base.colonia,
    hasHoa: coerceBrPrivadoTriBool(g.hasHoa),
    hoaFee: typeof g.hoaFee === "string" ? g.hoaFee : base.hoaFee,
    hoaFrequency: coerceBrPrivadoHoaFrequency(g.hoaFrequency),
    hoaIncludes: typeof g.hoaIncludes === "string" ? g.hoaIncludes : base.hoaIncludes,
    communityRules: typeof g.communityRules === "string" ? g.communityRules : base.communityRules,
    petRules: typeof g.petRules === "string" ? g.petRules : base.petRules,
    rentalRestrictions: typeof g.rentalRestrictions === "string" ? g.rentalRestrictions : base.rentalRestrictions,
    shortTermRentalAllowed: coerceBrPrivadoTriBool(g.shortTermRentalAllowed),
    parkingRules: typeof g.parkingRules === "string" ? g.parkingRules : base.parkingRules,
    openHouseEnabled: typeof g.openHouseEnabled === "boolean" ? g.openHouseEnabled : base.openHouseEnabled,
    openHouseDate: typeof g.openHouseDate === "string" ? g.openHouseDate : base.openHouseDate,
    openHouseStartTime: typeof g.openHouseStartTime === "string" ? g.openHouseStartTime : base.openHouseStartTime,
    openHouseEndTime: typeof g.openHouseEndTime === "string" ? g.openHouseEndTime : base.openHouseEndTime,
    showingByAppointment: typeof g.showingByAppointment === "boolean" ? g.showingByAppointment : base.showingByAppointment,
    showingInstructions: typeof g.showingInstructions === "string" ? g.showingInstructions : base.showingInstructions,
    virtualTourUrl: typeof g.virtualTourUrl === "string" ? g.virtualTourUrl : base.virtualTourUrl,
  };
}

/** Structured for `Leonix:pets_allowed` + resultados filter (required before publish). */
export type BrPetsAllowedChoice = "" | "yes" | "no";

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

function coerceBrPetsAllowedChoice(raw: unknown, fallback: BrPetsAllowedChoice): BrPetsAllowedChoice {
  if (raw === "yes" || raw === "no" || raw === "") return raw;
  return fallback;
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
  /**
   * When false (default), public listing copy uses ciudad / CP / zona only — not full `ubicacionLinea` in `detail_pairs` or browse.
   * When true, full reference line may appear on cards/detail/map (opt-in).
   */
  mostrarDireccionExacta: boolean;
  enlaceMapa: string;
  descripcion: string;
  estadoAnuncio: BrPrivadoListingStatus;
  /** Required to publish — maps to `Leonix:pets_allowed` (yes/no). */
  petsAllowed: BrPetsAllowedChoice;
  media: {
    photoDataUrls: string[];
    primaryImageIndex: number;
    /** External video URL (YouTube, Vimeo, direct .mp4, etc.). */
    videoUrl: string;
    /**
     * Local draft video as data URL (same-tab session only). Takes precedence over `videoUrl` for preview.
     * Not uploaded to Mux until a future paid publish step.
     */
    videoLocalDataUrl: string;
  };
  /** Particular only: name, phones, email, optional photo — no web/social fields */
  seller: {
    fotoDataUrl: string;
    nombre: string;
    etiquetaRol: string;
    telefono: string;
    whatsapp: string;
    /** Optional SMS contact; same masking as tel/WhatsApp in UI. */
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
  contactChannels: LeonixContactChannelsFormSlice;
  /** Gate 12D — structured address + HOA + open house (serialized to `Leonix:br_gate12d_v1`). */
  gate12d: BrPrivadoGate12dSlice;
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
    mostrarDireccionExacta: false,
    enlaceMapa: "",
    descripcion: "",
    estadoAnuncio: "disponible",
    petsAllowed: "",
    media: {
      photoDataUrls: [],
      primaryImageIndex: 0,
      videoUrl: "",
      videoLocalDataUrl: "",
    },
    seller: {
      fotoDataUrl: "",
      nombre: "",
      etiquetaRol: "",
      telefono: "",
      whatsapp: "",
      mensajesTexto: "",
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
    contactChannels: createEmptyLeonixContactChannelsFormSlice(),
    gate12d: createEmptyBrPrivadoGate12dSlice(),
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
  const gateIn = partial.gate12d;

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
    mostrarDireccionExacta:
      typeof partial.mostrarDireccionExacta === "boolean" ? partial.mostrarDireccionExacta : base.mostrarDireccionExacta,
    enlaceMapa: typeof partial.enlaceMapa === "string" ? partial.enlaceMapa : base.enlaceMapa,
    descripcion: typeof partial.descripcion === "string" ? partial.descripcion : base.descripcion,
    estadoAnuncio: coerceListingStatus(partial.estadoAnuncio),
    petsAllowed: coerceBrPetsAllowedChoice(partial.petsAllowed, base.petsAllowed),
    media: {
      ...base.media,
      photoDataUrls,
      primaryImageIndex,
      videoUrl: typeof mediaIn?.videoUrl === "string" ? mediaIn.videoUrl : base.media.videoUrl,
      videoLocalDataUrl:
        typeof mediaIn?.videoLocalDataUrl === "string" ? mediaIn.videoLocalDataUrl : base.media.videoLocalDataUrl,
    },
    seller: {
      ...base.seller,
      fotoDataUrl: typeof sellerIn?.fotoDataUrl === "string" ? sellerIn.fotoDataUrl : base.seller.fotoDataUrl,
      nombre: typeof sellerIn?.nombre === "string" ? sellerIn.nombre : base.seller.nombre,
      etiquetaRol: typeof sellerIn?.etiquetaRol === "string" ? sellerIn.etiquetaRol : base.seller.etiquetaRol,
      telefono: typeof sellerIn?.telefono === "string" ? sellerIn.telefono : base.seller.telefono,
      whatsapp: typeof sellerIn?.whatsapp === "string" ? sellerIn.whatsapp : base.seller.whatsapp,
      mensajesTexto: typeof sellerIn?.mensajesTexto === "string" ? sellerIn.mensajesTexto : base.seller.mensajesTexto,
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
    contactChannels: mergePartialLeonixContactChannelsFormSlice(
      base.contactChannels,
      partial.contactChannels as Partial<LeonixContactChannelsFormSlice> | undefined,
    ),
    gate12d: mergeBrPrivadoGate12dSlice(gateIn),
  };
}
