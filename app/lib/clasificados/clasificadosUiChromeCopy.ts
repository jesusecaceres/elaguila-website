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

const CATEGORY_CHROME = {
  es: {
    search: "Buscar",
    filters: "Filtros",
    category: "Categoría",
    city: "Ciudad",
    state: "Estado",
    zipCode: "Código postal",
    noResults: "No hay resultados",
    noMatchesYet: "Aún no hay coincidencias",
    backToHome: "Volver al inicio",
    viewDetails: "Ver detalles",
    call: "Llamar",
    message: "Mensaje",
    email: "Correo",
    website: "Sitio web",
    map: "Mapa",
    needAnotherLanguage: "¿Necesitas otro idioma?",
    useBrowserTranslation: "Usa la traducción del navegador",
    googleLensPrintedHelp: "Google Lens puede ayudar con páginas impresas",
  },
  en: {
    search: "Search",
    filters: "Filters",
    category: "Category",
    city: "City",
    state: "State",
    zipCode: "ZIP code",
    noResults: "No results",
    noMatchesYet: "No matches yet",
    backToHome: "Back to home",
    viewDetails: "View details",
    call: "Call",
    message: "Message",
    email: "Email",
    website: "Website",
    map: "Map",
    needAnotherLanguage: "Need another language?",
    useBrowserTranslation: "Use your browser translation",
    googleLensPrintedHelp: "Google Lens can help with printed pages",
  },
} as const;

export type ClasificadosCategoryChromeCopy = (typeof CATEGORY_CHROME)[ClasificadosUiLang];

export function clasificadosCategoryChromeCopy(lang: ClasificadosUiLang): ClasificadosCategoryChromeCopy {
  return CATEGORY_CHROME[lang];
}

/** Bilingual UI chrome string — use for inline labels not yet in a dictionary. */
export function clasificadosTr(lang: ClasificadosUiLang, es: string, en: string): string {
  return lang === "en" ? en : es;
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
