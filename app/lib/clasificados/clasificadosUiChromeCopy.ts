/**
 * Shared Clasificados UI chrome copy (ES/EN/PT/TL).
 * Platform labels only — never seller-entered listing content.
 */

import {
  getLaunchUiCopy,
  launchUiCopyLang,
  type LaunchUiDictionary,
  type OfficialLaunchLang,
  type SupportedLang,
} from "@/app/lib/language";

export type ClasificadosUiLang = "es" | "en";

/** Full launch UI lang for 4-language chrome dictionaries in this module. */
export type LaunchClasificadosUiLang = OfficialLaunchLang;

/** Viewer-selected UI language from route `?lang=`. */
export type ViewerUiLanguage = ClasificadosUiLang;

/** Original language of seller-entered content — not translated by this module. */
export type SourceContentLanguage = string;

const PREVIEW_PUBLISH: LaunchUiDictionary<{
  next: string;
  back: string;
  preview: string;
  backToEdit: string;
  publish: string;
  publishListing: string;
  title: string;
  description: string;
  price: string;
  contact: string;
  phone: string;
  email: string;
  website: string;
  save: string;
  share: string;
  report: string;
  viewDetails: string;
  call: string;
  message: string;
  map: string;
  required: string;
  optional: string;
}> = {
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
  pt: {
    next: "Próximo",
    back: "Voltar",
    preview: "Pré-visualização",
    backToEdit: "Voltar para editar",
    publish: "Publicar",
    publishListing: "Publicar anúncio",
    title: "Título",
    description: "Descrição",
    price: "Preço",
    contact: "Contato",
    phone: "Telefone",
    email: "E-mail",
    website: "Site",
    save: "Salvar",
    share: "Compartilhar",
    report: "Denunciar",
    viewDetails: "Ver detalhes",
    call: "Ligar",
    message: "Mensagem",
    map: "Mapa",
    required: "Obrigatório",
    optional: "Opcional",
  },
  tl: {
    next: "Susunod",
    back: "Bumalik",
    preview: "Preview",
    backToEdit: "Bumalik sa pag-edit",
    publish: "I-publish",
    publishListing: "I-publish ang listing",
    title: "Pamagat",
    description: "Deskripsyon",
    price: "Presyo",
    contact: "Kontak",
    phone: "Telepono",
    email: "Email",
    website: "Website",
    save: "I-save",
    share: "Ibahagi",
    report: "I-report",
    viewDetails: "Tingnan ang detalye",
    call: "Tumawag",
    message: "Mensahe",
    map: "Mapa",
    required: "Kinakailangan",
    optional: "Opsiyonal",
  },
};

export type ClasificadosPreviewPublishCopy =
  (typeof PREVIEW_PUBLISH)[LaunchClasificadosUiLang];

export function clasificadosPreviewPublishCopy(
  lang: LaunchClasificadosUiLang | SupportedLang,
): ClasificadosPreviewPublishCopy {
  const key =
    lang === "es" || lang === "en" || lang === "pt" || lang === "tl"
      ? lang
      : launchUiCopyLang(lang as SupportedLang);
  return PREVIEW_PUBLISH[key];
}

export function previewBackToEditLabel(lang: LaunchClasificadosUiLang | SupportedLang): string {
  return clasificadosPreviewPublishCopy(lang).backToEdit;
}

const CATEGORY_CHROME: LaunchUiDictionary<{
  search: string;
  filters: string;
  category: string;
  city: string;
  state: string;
  zipCode: string;
  noResults: string;
  noMatchesYet: string;
  backToHome: string;
  viewDetails: string;
  call: string;
  message: string;
  email: string;
  website: string;
  map: string;
  needAnotherLanguage: string;
  useBrowserTranslation: string;
  googleLensPrintedHelp: string;
}> = {
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
  pt: {
    search: "Buscar",
    filters: "Filtros",
    category: "Categoria",
    city: "Cidade",
    state: "Estado",
    zipCode: "CEP",
    noResults: "Nenhum resultado",
    noMatchesYet: "Ainda não há correspondências",
    backToHome: "Voltar ao início",
    viewDetails: "Ver detalhes",
    call: "Ligar",
    message: "Mensagem",
    email: "E-mail",
    website: "Site",
    map: "Mapa",
    needAnotherLanguage: "Precisa de outro idioma?",
    useBrowserTranslation: "Use a tradução do navegador",
    googleLensPrintedHelp: "O Google Lens pode ajudar com páginas impressas",
  },
  tl: {
    search: "Maghanap",
    filters: "Mga filter",
    category: "Kategorya",
    city: "Lungsod",
    state: "Estado",
    zipCode: "ZIP code",
    noResults: "Walang resulta",
    noMatchesYet: "Wala pang tugma",
    backToHome: "Bumalik sa home",
    viewDetails: "Tingnan ang detalye",
    call: "Tumawag",
    message: "Mensahe",
    email: "Email",
    website: "Website",
    map: "Mapa",
    needAnotherLanguage: "Kailangan ng ibang wika?",
    useBrowserTranslation: "Gamitin ang translation ng browser",
    googleLensPrintedHelp: "Makakatulong ang Google Lens sa naka-print na pahina",
  },
};

export type ClasificadosCategoryChromeCopy = (typeof CATEGORY_CHROME)[LaunchClasificadosUiLang];

export function clasificadosCategoryChromeCopy(
  lang: LaunchClasificadosUiLang | SupportedLang,
): ClasificadosCategoryChromeCopy {
  if (lang === "es" || lang === "en" || lang === "pt" || lang === "tl") {
    return CATEGORY_CHROME[lang];
  }
  return getLaunchUiCopy(lang, CATEGORY_CHROME);
}

/** Launch UI string from a four-language dictionary. */
export function launchUiTr(lang: LaunchClasificadosUiLang | SupportedLang, strings: LaunchUiDictionary<string>): string {
  if (lang === "es" || lang === "en" || lang === "pt" || lang === "tl") {
    return strings[lang];
  }
  return getLaunchUiCopy(lang, strings);
}

/** @deprecated Prefer launchUiTr for PT/TL surfaces. Binary ES/EN only — PT falls back to ES. */
export function clasificadosTr(lang: ClasificadosUiLang, es: string, en: string): string {
  if (lang === "en") return en;
  return es;
}

export function publicListingActionLabels(lang: LaunchClasificadosUiLang | SupportedLang) {
  const c = clasificadosPreviewPublishCopy(lang);
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
