import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";

export const VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY = "leonix:viajes:negocios:draft:v1";

export const VIAJES_NEGOCIOS_MAX_INLINE_IMAGE = 200_000;

/** Max gallery images (URLs or small inline data URLs) */
export const VIAJES_NEGOCIOS_GALLERY_MAX = 8;

/** Merge persisted or API payload into a full draft (publish + rehydrate). */
export function mergeViajesNegociosDraftFromPartial(parsed: Partial<ViajesNegociosDraft>): ViajesNegociosDraft {
  const e = emptyViajesNegociosDraft();
  return {
    ...e,
    ...parsed,
    schemaVersion: 1,
    galeriaUrls: Array.isArray(parsed.galeriaUrls)
      ? parsed.galeriaUrls.filter(Boolean).slice(0, VIAJES_NEGOCIOS_GALLERY_MAX)
      : e.galeriaUrls,
    dateMode: parsed.dateMode ?? e.dateMode,
    heroSourceMode: parsed.heroSourceMode ?? e.heroSourceMode,
    logoSourceMode: parsed.logoSourceMode ?? e.logoSourceMode,
  };
}

export function emptyViajesNegociosDraft(): ViajesNegociosDraft {
  return {
    schemaVersion: 1,
    offerType: "",
    titulo: "",
    destino: "",
    ciudadSalida: "",
    precio: "",
    duracion: "",
    fechas: "",
    dateMode: "flexible",
    fechaInicio: "",
    fechaFin: "",
    fechasNota: "",
    descripcion: "",
    incluye: "",
    ctaType: "whatsapp",
    familias: false,
    parejas: false,
    grupos: false,
    presupuestoTag: "",
    incluyeHotel: false,
    incluyeTransporte: false,
    incluyeComida: false,
    guiaEspanol: false,
    idiomaAtencion: "español",
    imagenPrincipal: "",
    localHeroImageId: null,
    localImageDataUrl: null,
    heroSourceMode: "url",
    galeriaUrls: [],
    galeriaNota: "",
    logoSocio: "",
    logoLocalDataUrl: null,
    logoSourceMode: "url",
    videoUrl: "",
    videoLocalLabel: "",
    businessName: "",
    phone: "",
    phoneOffice: "",
    email: "",
    website: "",
    whatsapp: "",
    socials: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTiktok: "",
    socialYoutube: "",
    socialTwitter: "",
    destinationsServed: "",
    languages: "",
  };
}
