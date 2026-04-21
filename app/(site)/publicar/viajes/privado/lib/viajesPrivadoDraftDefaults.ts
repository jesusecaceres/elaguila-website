import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";

export const VIAJES_PRIVADO_DRAFT_STORAGE_KEY = "leonix:viajes:privado:draft:v1";

/** Max serialized size for embedded image (bytes, approximate) — avoids blowing localStorage. */
export const VIAJES_PRIVADO_MAX_IMAGE_STORAGE = 480_000;

export const VIAJES_PRIVADO_GALLERY_MAX = 8;

export function mergeViajesPrivadoDraftFromPartial(parsed: Partial<ViajesPrivadoDraft>): ViajesPrivadoDraft {
  const e = emptyViajesPrivadoDraft();
  return {
    ...e,
    ...parsed,
    schemaVersion: 1,
    galeriaUrls: Array.isArray(parsed.galeriaUrls)
      ? parsed.galeriaUrls.filter(Boolean).slice(0, VIAJES_PRIVADO_GALLERY_MAX)
      : e.galeriaUrls,
    dateMode: parsed.dateMode ?? e.dateMode,
    heroSourceMode: parsed.heroSourceMode ?? e.heroSourceMode,
  };
}

export function emptyViajesPrivadoDraft(): ViajesPrivadoDraft {
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
    familias: false,
    parejas: false,
    grupos: false,
    numeroPersonas: "",
    incluyeHotel: false,
    incluyeTransporte: false,
    incluyeComida: false,
    guiaEspanol: false,
    politicaReserva: "",
    idiomaAtencion: "español",
    presupuestoTag: "",
    imagenUrl: "",
    localImageDataUrl: null,
    localHeroBlobId: null,
    heroSourceMode: "url",
    galeriaUrls: [],
    displayName: "",
    ctaType: "whatsapp",
    phone: "",
    phoneOffice: "",
    whatsapp: "",
    email: "",
    website: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTiktok: "",
    socialYoutube: "",
    socialTwitter: "",
  };
}
