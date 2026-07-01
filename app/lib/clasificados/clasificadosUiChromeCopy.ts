/**
 * Shared Clasificados UI chrome copy (ES/EN base).
 * Platform labels only — never seller-entered listing content.
 */

export type ClasificadosUiLang = "es" | "en";

/** Viewer-selected UI language from route `?lang=`. */
export type ViewerUiLanguage = ClasificadosUiLang;

/** Original language of seller-entered content — not translated by this module. */
export type SourceContentLanguage = string;

const PREVIEW_PUBLISH = {
  es: {
    next: "Siguiente",
    back: "Atrás",
    preview: "Vista previa",
    backToEdit: "Volver a editar",
    publish: "Publicar",
    publishListing: "Publicar anuncio",
    title: "Título",
    description: "Descripción",
    price: "Precio",
    contact: "Contacto",
    phone: "Teléfono",
    email: "Correo",
    website: "Sitio web",
    save: "Guardar",
    share: "Compartir",
    report: "Reportar",
    viewDetails: "Ver detalles",
    call: "Llamar",
    message: "Mensaje",
    map: "Mapa",
    required: "Requerido",
    optional: "Opcional",
  },
  en: {
    next: "Next",
    back: "Back",
    preview: "Preview",
    backToEdit: "Back to edit",
    publish: "Publish",
    publishListing: "Publish listing",
    title: "Title",
    description: "Description",
    price: "Price",
    contact: "Contact",
    phone: "Phone",
    email: "Email",
    website: "Website",
    save: "Save",
    share: "Share",
    report: "Report",
    viewDetails: "View details",
    call: "Call",
    message: "Message",
    map: "Map",
    required: "Required",
    optional: "Optional",
  },
} as const;

export type ClasificadosPreviewPublishCopy =
  (typeof PREVIEW_PUBLISH)[ClasificadosUiLang];

export function clasificadosPreviewPublishCopy(lang: ClasificadosUiLang): ClasificadosPreviewPublishCopy {
  return PREVIEW_PUBLISH[lang];
}

export function previewBackToEditLabel(lang: ClasificadosUiLang): string {
  return PREVIEW_PUBLISH[lang].backToEdit;
}

export function publicListingActionLabels(lang: ClasificadosUiLang) {
  const c = PREVIEW_PUBLISH[lang];
  return {
    save: c.save,
    share: c.share,
    report: c.report,
    viewDetails: c.viewDetails,
    contact: c.contact,
    call: c.call,
    message: c.message,
    email: c.email,
    website: c.website,
    map: c.map,
  };
}
