import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";

export const VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY = "leonix:viajes:negocios:draft:v1";

export const VIAJES_NEGOCIOS_MAX_INLINE_IMAGE = 200_000;

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
    galeriaNota: "",
    logoSocio: "",
    videoUrl: "",
    businessName: "",
    phone: "",
    website: "",
    whatsapp: "",
    socials: "",
    destinationsServed: "",
    languages: "",
  };
}
