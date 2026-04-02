/**
 * Inventario campo formulario → ruta VM → región en `AgenteIndividualResidencialPreviewView`.
 * Fuente de verdad: `AgenteIndividualResidencialFormState` + `mapAgenteIndividualResidencialToPreview`.
 *
 * Desarrollo: plantilla llena de ejemplo en `sampleAgenteIndividualResidencialPreviewVm.ts`
 * (solo `?template=sample` en dev). Producción: solo datos reales mapeados.
 */

export type SlotBucket =
  | "hero"
  | "quickFacts"
  | "gallery"
  | "propertyDetails"
  | "features"
  | "description"
  | "professionalCard"
  | "social"
  | "ctaRail"
  | "extras";

/** Una fila por campo de aplicación con destino explícito en preview. */
export type AgenteResSlotRow = {
  formField: string;
  vmPath: string;
  previewRegion: string;
  bucket: SlotBucket;
};

/**
 * Inventario exhaustivo (sin campos legacy eliminados).
 * listadoUrl / listadoArchivo* → CTA «Ver listado» y respaldos MLS/listado (mapper), no bloque hero.
 */
export const AGENTE_RES_SLOT_INVENTORY: readonly AgenteResSlotRow[] = [
  // A — Hero / resumen superior
  { formField: "titulo", vmPath: "hero.title", previewRegion: "Título (columna izquierda, bajo galería)", bucket: "hero" },
  { formField: "tipoPublicacionFijo", vmPath: "hero.operationLine", previewRegion: "Línea «Venta residencial» (fijo)", bucket: "hero" },
  { formField: "ciudad + areaCiudad + direccion", vmPath: "hero.locationLine", previewRegion: "Ubicación + enlace mapa si hay query", bucket: "hero" },
  { formField: "precio", vmPath: "hero.priceDisplay", previewRegion: "Precio", bucket: "hero" },
  { formField: "estadoAnuncio", vmPath: "hero.statusPill", previewRegion: "Estado del anuncio", bucket: "hero" },

  // B — Quick facts (mismo orden que mapper)
  { formField: "recamaras", vmPath: "hero.quickFacts[recamaras]", previewRegion: "Hechos rápidos — recámaras", bucket: "quickFacts" },
  { formField: "banos", vmPath: "hero.quickFacts[banos]", previewRegion: "Hechos rápidos — baños", bucket: "quickFacts" },
  { formField: "tamanoInteriorSqft", vmPath: "hero.quickFacts[tamano_interior]", previewRegion: "Hechos rápidos — interior ft²", bucket: "quickFacts" },
  { formField: "estacionamientos", vmPath: "hero.quickFacts[estacionamientos]", previewRegion: "Hechos rápidos — estacionamientos", bucket: "quickFacts" },
  { formField: "anoConstruccion", vmPath: "hero.quickFacts[ano_construccion]", previewRegion: "Hechos rápidos — año", bucket: "quickFacts" },
  { formField: "tamanoLoteSqft", vmPath: "hero.quickFacts[tamano_lote]", previewRegion: "Hechos rápidos — lote ft²", bucket: "quickFacts" },

  // C — Galería
  { formField: "fotosDataUrls + fotoPortadaIndex", vmPath: "gallery.mainPhoto", previewRegion: "Foto principal", bucket: "gallery" },
  { formField: "fotosDataUrls (no portada)", vmPath: "gallery.secondaryPhoto1/2", previewRegion: "Fotos 2 y 3", bucket: "gallery" },
  { formField: "videoUrl / videoDataUrl", vmPath: "gallery.video", previewRegion: "Video", bucket: "gallery" },
  { formField: "tourUrl/tourDataUrl o brochure*", vmPath: "gallery.tourOrPlan", previewRegion: "Tour o plano/folleto (un slot)", bucket: "gallery" },
  { formField: "fotosDataUrls.length", vmPath: "gallery.showAllPhotosCta", previewRegion: "Pill «Ver todas las fotos»", bucket: "gallery" },

  // D — Detalle propiedad (tabla)
  { formField: "tipoPropiedad* + subtipo", vmPath: "propertyRows[Tipo de propiedad]", previewRegion: "Tarjeta detalles", bucket: "propertyDetails" },
  { formField: "recamaras…condicionPropiedad", vmPath: "propertyRows[]", previewRegion: "Resto filas detalle (ver mapper)", bucket: "propertyDetails" },

  // E — Destacados
  { formField: "destacados[id]", vmPath: "destacadosLabels[]", previewRegion: "Características destacadas", bucket: "features" },

  // F — Descripción
  { formField: "descripcionPrincipal", vmPath: "descripcionPrincipal + hasDescription", previewRegion: "Descripción", bucket: "description" },
  { formField: "notasAdicionales", vmPath: "notasAdicionales + hasNotas", previewRegion: "Notas adicionales", bucket: "description" },

  // G — Agente / marca
  { formField: "agenteFotoDataUrl", vmPath: "professionalCard.agentPhotoUrl", previewRegion: "Carril — foto", bucket: "professionalCard" },
  { formField: "agenteNombre", vmPath: "professionalCard.agentName", previewRegion: "Carril — nombre", bucket: "professionalCard" },
  { formField: "agenteTitulo", vmPath: "professionalCard.agentTitle", previewRegion: "Carril — título", bucket: "professionalCard" },
  { formField: "agenteLicencia", vmPath: "professionalCard.agentLicenseLine", previewRegion: "Carril — licencia agente", bucket: "professionalCard" },
  { formField: "telefonoPrincipal", vmPath: "professionalCard.phoneDisplay", previewRegion: "Carril — teléfono", bucket: "professionalCard" },
  { formField: "correoPrincipal", vmPath: "professionalCard.emailDisplay", previewRegion: "Carril — correo", bucket: "professionalCard" },
  { formField: "agenteAreaServicio", vmPath: "professionalCard.areaServicioLine", previewRegion: "Carril — área servicio", bucket: "professionalCard" },
  { formField: "agenteIdiomas", vmPath: "professionalCard.idiomasLine", previewRegion: "Carril — idiomas", bucket: "professionalCard" },
  { formField: "mostrarMarcaEnTarjeta + marca*", vmPath: "professionalCard.hasBrandBlock + brand*", previewRegion: "Bloque oficina/marca (solo si toggle + datos)", bucket: "professionalCard" },

  // H — Social
  { formField: "socialInstagram … socialOtro", vmPath: "social.*", previewRegion: "Iconos (si permitirVerRedes)", bucket: "social" },

  // I — CTA
  { formField: "permitir* + cta*", vmPath: "contactRail.*", previewRegion: "Pila CTA carril", bucket: "ctaRail" },

  // J — Extras
  { formField: "extraOpenHouse + openHouse*", vmPath: "extras.openHouseSummary", previewRegion: "Más información — open house", bucket: "extras" },
  { formField: "extraAsesorFinanciero + asesor*", vmPath: "extras.asesorBlock", previewRegion: "Más información — asesor", bucket: "extras" },
  { formField: "direccion + ciudad + areaCiudad", vmPath: "extras.mapQuery", previewRegion: "Mapa / «Ubicación aproximada»", bucket: "extras" },
];
