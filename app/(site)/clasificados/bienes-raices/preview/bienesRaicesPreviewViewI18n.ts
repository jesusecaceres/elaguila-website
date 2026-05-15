import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";

export type BrPreviewLangInput = RentasLandingLang | undefined | null;

export function resolveBrPreviewLang(lang?: BrPreviewLangInput): RentasLandingLang {
  return lang === "en" ? "en" : "es";
}

export function privadoGalleryMetaLine(
  lang: RentasLandingLang,
  uniquePhotoCount: number,
  hasVidMeta: boolean,
  metaLineFromVm: string,
): string {
  if (uniquePhotoCount > 0) {
    return lang === "en"
      ? `${uniquePhotoCount} photo${uniquePhotoCount === 1 ? "" : "s"} in gallery`
      : `${uniquePhotoCount} foto${uniquePhotoCount === 1 ? "" : "s"} en la galería`;
  }
  if (hasVidMeta) {
    return lang === "en" ? "Video in listing" : "Video en el anuncio";
  }
  return String(metaLineFromVm ?? "").trim();
}

export function privadoPhotosChipLabel(lang: RentasLandingLang, n: number): string {
  return lang === "en" ? `${n} photo${n === 1 ? "" : "s"}` : `${n} foto${n === 1 ? "" : "s"}`;
}

export function negocioGalleryMetaLine(lang: RentasLandingLang, uniquePhotoCount: number, metaLineFromVm: string): string {
  if (uniquePhotoCount > 0) {
    return lang === "en"
      ? `${uniquePhotoCount} photo${uniquePhotoCount === 1 ? "" : "s"} in gallery`
      : `${uniquePhotoCount} foto${uniquePhotoCount === 1 ? "" : "s"} en la galería`;
  }
  return String(metaLineFromVm ?? "").trim();
}

export function negocioPhotosChipLabel(lang: RentasLandingLang, n: number): string {
  return privadoPhotosChipLabel(lang, n);
}

export type PrivadoPreviewUi = {
  verMasFotos: string;
  galeriaMultimedia: string;
  ariaAbrirFotoGaleria: string;
  ariaAbrirGaleriaFotos: string;
  ariaAbrirGaleriaCompleta: string;
  ariaAbrirVideoGaleria: string;
  galeria: string;
  descripcion: string;
  vistaPreviaSr: string;
  resumenRenta: string;
  requisitos: string;
  condicionesAlquiler: string;
  caracteristicas: string;
  serviciosIncluidos: string;
  destacadosFallback: string;
  escribirCorreo: string;
  llamar: string;
  whatsapp: string;
  mensajesTexto: string;
  enviarTexto: string;
  ubicacion: string;
  verEnMapa: string;
  masInformacion: string;
};

const PRIVADO_UI: Record<RentasLandingLang, PrivadoPreviewUi> = {
  es: {
    verMasFotos: "Ver más fotos",
    galeriaMultimedia: "Galería multimedia",
    ariaAbrirFotoGaleria: "Abrir foto en galería",
    ariaAbrirGaleriaFotos: "Abrir galería de fotos",
    ariaAbrirGaleriaCompleta: "Abrir galería completa",
    ariaAbrirVideoGaleria: "Abrir video en galería",
    galeria: "Galería",
    descripcion: "Descripción",
    vistaPreviaSr: "Vista previa del anuncio",
    resumenRenta: "Resumen de renta",
    requisitos: "Requisitos",
    condicionesAlquiler: "Condiciones importantes del alquiler",
    caracteristicas: "Características",
    serviciosIncluidos: "Servicios incluidos",
    destacadosFallback: "Destacados",
    escribirCorreo: "Escribir correo",
    llamar: "Llamar",
    whatsapp: "WhatsApp",
    mensajesTexto: "Mensajes de texto",
    enviarTexto: "Enviar texto",
    ubicacion: "Ubicación",
    verEnMapa: "Ver en mapa",
    masInformacion: "Sitio web / Más información",
  },
  en: {
    verMasFotos: "View more photos",
    galeriaMultimedia: "Media gallery",
    ariaAbrirFotoGaleria: "Open photo in gallery",
    ariaAbrirGaleriaFotos: "Open photo gallery",
    ariaAbrirGaleriaCompleta: "Open full gallery",
    ariaAbrirVideoGaleria: "Open video in gallery",
    galeria: "Gallery",
    descripcion: "Description",
    vistaPreviaSr: "Listing preview",
    resumenRenta: "Rent summary",
    requisitos: "Requirements",
    condicionesAlquiler: "Important lease conditions",
    caracteristicas: "Features",
    serviciosIncluidos: "Included services",
    destacadosFallback: "Highlights",
    escribirCorreo: "Email seller",
    llamar: "Call",
    whatsapp: "WhatsApp",
    mensajesTexto: "Text messages",
    enviarTexto: "Send text",
    ubicacion: "Location",
    verEnMapa: "View on map",
    masInformacion: "Website / more information",
  },
};

export function privadoPreviewUi(lang: RentasLandingLang): PrivadoPreviewUi {
  return PRIVADO_UI[lang];
}

export type NegocioPreviewUi = {
  galeriaMultimedia: string;
  ariaAbrirGaleriaFotos: string;
  ariaAbrirGaleriaCompleta: string;
  ariaAbrirFotoGaleria: string;
  galeria: string;
  sinFotosEnAnuncio: string;
  planosAdicionales: string;
  planoSitioComunidad: string;
  descripcion: string;
  resumenRenta: string;
  requisitos: string;
  condicionesAlquiler: string;
  caracteristicas: string;
  serviciosIncluidos: string;
  destacadosFallback: string;
  detallesPropiedad: string;
  caracteristicasDestacadas: string;
  sinElementosDestacados: string;
  identidadAnuncio: string;
  sinImagenPrincipal: string;
  inmobiliariaMarca: string;
  profileCtaHint: string;
  detallesCompletosTitulo: string;
  detallesCompletosSub: string;
  sinBloquesDetalle: string;
  deepSectionEmpty: string;
  horarioPreferido: string;
  openHouse: string;
  solicitarInfo: string;
  programarVisita: string;
  llamarAhora: string;
  enviarWhatsapp: string;
  enviarTexto: string;
  ubicacion: string;
  verEnMapa: string;
  masInformacion: string;
};

const NEGOCIO_UI: Record<RentasLandingLang, NegocioPreviewUi> = {
  es: {
    galeriaMultimedia: "Galería multimedia",
    ariaAbrirGaleriaFotos: "Abrir galería de fotos",
    ariaAbrirGaleriaCompleta: "Abrir galería completa",
    ariaAbrirFotoGaleria: "Abrir foto en galería",
    galeria: "Galería",
    sinFotosEnAnuncio: "Sin fotografías en este anuncio.",
    planosAdicionales: "Planos adicionales",
    planoSitioComunidad: "Plano de sitio / comunidad",
    descripcion: "Descripción",
    resumenRenta: "Resumen de renta",
    requisitos: "Requisitos",
    condicionesAlquiler: "Condiciones importantes del alquiler",
    caracteristicas: "Características",
    serviciosIncluidos: "Servicios incluidos",
    destacadosFallback: "Destacados",
    detallesPropiedad: "Detalles de la propiedad",
    caracteristicasDestacadas: "Características destacadas",
    sinElementosDestacados: "Sin elementos destacados en este anuncio.",
    identidadAnuncio: "Identidad del anuncio",
    sinImagenPrincipal: "Sin imagen principal cargada.",
    inmobiliariaMarca: "Inmobiliaria / marca",
    profileCtaHint: "Añade un sitio web o red social en la ficha para activar el enlace público de perfil.",
    detallesCompletosTitulo: "Detalles completos del inmueble",
    detallesCompletosSub: "Ficha técnica por bloques según los datos de este anuncio.",
    sinBloquesDetalle: "Sin bloques de detalle técnico en este anuncio.",
    deepSectionEmpty: "Sin datos en este bloque.",
    horarioPreferido: "Horario preferido",
    openHouse: "Puertas abiertas",
    solicitarInfo: "Solicitar información",
    programarVisita: "Programar visita",
    llamarAhora: "Llamar ahora",
    enviarWhatsapp: "Enviar por WhatsApp",
    enviarTexto: "Enviar texto",
    ubicacion: "Ubicación",
    verEnMapa: "Ver en mapa",
    masInformacion: "Sitio web / Más información",
  },
  en: {
    galeriaMultimedia: "Media gallery",
    ariaAbrirGaleriaFotos: "Open photo gallery",
    ariaAbrirGaleriaCompleta: "Open full gallery",
    ariaAbrirFotoGaleria: "Open photo in gallery",
    galeria: "Gallery",
    sinFotosEnAnuncio: "No photos in this listing yet.",
    planosAdicionales: "Additional floor plans",
    planoSitioComunidad: "Site plan / community",
    descripcion: "Description",
    resumenRenta: "Rent summary",
    requisitos: "Requirements",
    condicionesAlquiler: "Important lease conditions",
    caracteristicas: "Features",
    serviciosIncluidos: "Included services",
    destacadosFallback: "Highlights",
    detallesPropiedad: "Property details",
    caracteristicasDestacadas: "Featured characteristics",
    sinElementosDestacados: "No highlighted items in this listing.",
    identidadAnuncio: "Listing identity",
    sinImagenPrincipal: "No primary image uploaded.",
    inmobiliariaMarca: "Brokerage / brand",
    profileCtaHint: "Add a website or social profile in the form to enable the public profile link.",
    detallesCompletosTitulo: "Full property details",
    detallesCompletosSub: "Technical breakdown by section based on this listing’s data.",
    sinBloquesDetalle: "No technical detail blocks in this listing.",
    deepSectionEmpty: "No data in this section.",
    horarioPreferido: "Preferred hours",
    openHouse: "Open house",
    solicitarInfo: "Request information",
    programarVisita: "Schedule a tour",
    llamarAhora: "Call now",
    enviarWhatsapp: "Message on WhatsApp",
    enviarTexto: "Send text",
    ubicacion: "Location",
    verEnMapa: "View on map",
    masInformacion: "Website / more information",
  },
};

export function negocioPreviewUi(lang: RentasLandingLang): NegocioPreviewUi {
  return NEGOCIO_UI[lang];
}
