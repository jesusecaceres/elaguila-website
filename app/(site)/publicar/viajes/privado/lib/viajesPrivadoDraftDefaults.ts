import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";

export const VIAJES_PRIVADO_DRAFT_STORAGE_KEY = "leonix:viajes:privado:draft:v1";

/** Max serialized size for embedded image (bytes, approximate) — avoids blowing localStorage. */
export const VIAJES_PRIVADO_MAX_IMAGE_STORAGE = 480_000;

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
    displayName: "",
    ctaType: "whatsapp",
    phone: "",
    whatsapp: "",
    email: "",
  };
}
