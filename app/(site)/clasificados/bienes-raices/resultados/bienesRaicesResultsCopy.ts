import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type BrResultsCopy = {
  breadcrumbCategory: string;
  breadcrumbResults: string;
  breadcrumbBadge: string;
  createAccount: string;
  radiusHint: string;
  heroTitle: string;
  heroSubtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  zipLabel: string;
  zipPlaceholder: string;
  operationLabel: string;
  operationAny: string;
  operationSale: string;
  operationRent: string;
  typeLabel: string;
  typeAny: string;
  typeHouse: string;
  typeApt: string;
  typeLand: string;
  typeCommercial: string;
  priceMinLabel: string;
  priceMaxLabel: string;
  priceMinPlaceholder: string;
  priceMaxPlaceholder: string;
  bedsLabel: string;
  bedsAny: string;
  bathsLabel: string;
  bathsAny: string;
  sellerLabel: string;
  sellerAny: string;
  sellerPrivate: string;
  sellerBusiness: string;
  togglePets: string;
  toggleFurnished: string;
  togglePool: string;
  searchButton: string;
  categoryHeading: string;
  categoryAll: string;
  categoryResidential: string;
  categoryCommercial: string;
  categoryLand: string;
  filterMore: string;
  filterDrawerTitle: string;
  filterDrawerApply: string;
  filterDrawerClose: string;
  filterOpenMobile: string;
  primaryChips: Record<
    "casas" | "departamentos" | "venta" | "renta" | "comerciales" | "terrenos",
    string
  >;
  secondaryChips: Record<
    | "piscina"
    | "mascotas"
    | "nuevo_desarrollo"
    | "open_house"
    | "reducida"
    | "tour_virtual"
    | "planos"
    | "financiamiento"
    | "segundo_agente",
    string
  >;
  resultsCountLine: string;
  resultsCountOf: string;
  /** Plural noun after the total count (e.g. "resultados" / "results"). */
  resultsWord: string;
  sortLabel: string;
  sortRecent: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  viewGridAria: string;
  viewListAria: string;
  mapToggle: string;
  activeFiltersLabel: string;
  clearAllFilters: string;
  removeFilter: string;
  filterLabels: {
    q: string;
    city: string;
    operationType: string;
    propertyType: string;
    sellerType: string;
    priceMin: string;
    priceMax: string;
    beds: string;
    baths: string;
    pets: string;
    furnished: string;
    pool: string;
    primary: string;
    secondary: string;
    propiedad: string;
    precio: string;
    zip: string;
  };
  spotlightTitle: string;
  spotlightSubtitle: string;
  spotlightBadge: string;
  mapAsideTitle: string;
  mapAsideBody: string;
  moreResultsTitle: string;
  emptyState: string;
  emptyCta: string;
  paginationPrev: string;
  paginationNext: string;
  pageIndicator: string;
  footerLine: string;
  footerPublish: string;
  sellerKindLabels: { privado: string; negocio: string };
};

const ES: BrResultsCopy = {
  breadcrumbCategory: "Bienes raíces",
  breadcrumbResults: "Resultados",
  breadcrumbBadge: "Negocio",
  createAccount: "Crear cuenta",
  radiusHint: "Radio 25 km",
  heroTitle: "Bienes Raíces",
  heroSubtitle:
    "Refina con precisión, explora con calma. Inventario demo con filtros reales y URL compartible.",
  searchLabel: "Búsqueda",
  searchPlaceholder: "Palabras clave en título o dirección…",
  cityLabel: "Ciudad o zona",
  cityPlaceholder: "Ej. Monterrey, Polanco…",
  zipLabel: "Código postal (US)",
  zipPlaceholder: "Ej. 91101",
  operationLabel: "Operación",
  operationAny: "Todas",
  operationSale: "Venta",
  operationRent: "Renta",
  typeLabel: "Tipo",
  typeAny: "Cualquiera",
  typeHouse: "Casa",
  typeApt: "Departamento",
  typeLand: "Terreno",
  typeCommercial: "Comercial",
  priceMinLabel: "Precio mín.",
  priceMaxLabel: "Precio máx.",
  priceMinPlaceholder: "USD",
  priceMaxPlaceholder: "USD",
  bedsLabel: "Recámaras",
  bedsAny: "Cualquiera",
  bathsLabel: "Baños",
  bathsAny: "Cualquiera",
  sellerLabel: "Vendedor",
  sellerAny: "Todos",
  sellerPrivate: "Privado",
  sellerBusiness: "Negocios",
  togglePets: "Mascotas",
  toggleFurnished: "Amueblado",
  togglePool: "Alberca / piscina",
  searchButton: "Aplicar",
  categoryHeading: "Categoría",
  categoryAll: "Todas",
  categoryResidential: "Residencial",
  categoryCommercial: "Comercial",
  categoryLand: "Terreno / lote",
  filterMore: "Más filtros",
  filterDrawerTitle: "Filtros",
  filterDrawerApply: "Ver resultados",
  filterDrawerClose: "Cerrar",
  filterOpenMobile: "Filtros",
  primaryChips: {
    casas: "Casas",
    departamentos: "Departamentos",
    venta: "Venta",
    renta: "Renta",
    comerciales: "Comerciales",
    terrenos: "Terrenos",
  },
  secondaryChips: {
    piscina: "Con piscina",
    mascotas: "Aceptan mascotas",
    nuevo_desarrollo: "Nuevo desarrollo",
    open_house: "Open House",
    reducida: "Reducida",
    tour_virtual: "Tour virtual",
    planos: "Planos disponibles",
    financiamiento: "Financiamiento",
    segundo_agente: "Segundo agente",
  },
  resultsCountLine: "Mostrando",
  resultsCountOf: "de",
  resultsWord: "resultados",
  sortLabel: "Orden",
  sortRecent: "Más reciente",
  sortPriceAsc: "Precio: menor a mayor",
  sortPriceDesc: "Precio: mayor a menor",
  viewGridAria: "Vista cuadrícula",
  viewListAria: "Vista lista",
  mapToggle: "Mapa",
  activeFiltersLabel: "Filtros activos",
  clearAllFilters: "Limpiar todo",
  removeFilter: "Quitar",
  filterLabels: {
    q: "Búsqueda",
    city: "Ciudad",
    operationType: "Operación",
    propertyType: "Tipo",
    sellerType: "Vendedor",
    priceMin: "Precio mín.",
    priceMax: "Precio máx.",
    beds: "Recámaras",
    baths: "Baños",
    pets: "Mascotas",
    furnished: "Amueblado",
    pool: "Piscina",
    primary: "Etiquetas",
    secondary: "Detalles",
    propiedad: "Categoría",
    precio: "Rango precio",
    zip: "CP",
  },
  spotlightTitle: "Negocios en primer plano",
  spotlightSubtitle:
    "Carril limitado para inmobiliarias: orden editorial / confianza / novedad — no es solo quien más paga.",
  spotlightBadge: "Negocios",
  mapAsideTitle: "Mapa",
  mapAsideBody:
    "Explora la zona sin perder el listado. Activa el mapa para situar cada propiedad con contexto.",
  moreResultsTitle: "Listados en tu búsqueda",
  emptyState: "Sin coincidencias con estos filtros.",
  emptyCta: "Ver todo el demo",
  paginationPrev: "Anterior",
  paginationNext: "Siguiente",
  pageIndicator: "Página",
  footerLine: "Comunidad Leonix · Anuncios moderados · Demo de categoría",
  footerPublish: "Publicar anuncio",
  sellerKindLabels: { privado: "Privado", negocio: "Negocio" },
};

const EN: BrResultsCopy = {
  breadcrumbCategory: "Real estate",
  breadcrumbResults: "Results",
  breadcrumbBadge: "Business",
  createAccount: "Create account",
  radiusHint: "25 km radius",
  heroTitle: "Real estate",
  heroSubtitle:
    "Refine with precision, browse with calm. Demo inventory with real filters and a shareable URL.",
  searchLabel: "Search",
  searchPlaceholder: "Keywords in title or address…",
  cityLabel: "City or area",
  cityPlaceholder: "e.g. Monterrey, Polanco…",
  zipLabel: "ZIP code (US)",
  zipPlaceholder: "e.g. 91101",
  operationLabel: "Transaction",
  operationAny: "All",
  operationSale: "Sale",
  operationRent: "Rent",
  typeLabel: "Type",
  typeAny: "Any",
  typeHouse: "House",
  typeApt: "Apartment",
  typeLand: "Land",
  typeCommercial: "Commercial",
  priceMinLabel: "Min price",
  priceMaxLabel: "Max price",
  priceMinPlaceholder: "USD",
  priceMaxPlaceholder: "USD",
  bedsLabel: "Beds",
  bedsAny: "Any",
  bathsLabel: "Baths",
  bathsAny: "Any",
  sellerLabel: "Seller",
  sellerAny: "All",
  sellerPrivate: "Private",
  sellerBusiness: "Business",
  togglePets: "Pets",
  toggleFurnished: "Furnished",
  togglePool: "Pool",
  searchButton: "Apply",
  categoryHeading: "Category",
  categoryAll: "All",
  categoryResidential: "Residential",
  categoryCommercial: "Commercial",
  categoryLand: "Land / lot",
  filterMore: "More filters",
  filterDrawerTitle: "Filters",
  filterDrawerApply: "Show results",
  filterDrawerClose: "Close",
  filterOpenMobile: "Filters",
  primaryChips: {
    casas: "Houses",
    departamentos: "Apartments",
    venta: "Sale",
    renta: "Rent",
    comerciales: "Commercial",
    terrenos: "Land",
  },
  secondaryChips: {
    piscina: "Pool",
    mascotas: "Pets allowed",
    nuevo_desarrollo: "New development",
    open_house: "Open house",
    reducida: "Price reduced",
    tour_virtual: "Virtual tour",
    planos: "Floor plans",
    financiamiento: "Financing",
    segundo_agente: "Second agent",
  },
  resultsCountLine: "Showing",
  resultsCountOf: "of",
  resultsWord: "results",
  sortLabel: "Sort",
  sortRecent: "Newest",
  sortPriceAsc: "Price: low to high",
  sortPriceDesc: "Price: high to low",
  viewGridAria: "Grid view",
  viewListAria: "List view",
  mapToggle: "Map",
  activeFiltersLabel: "Active filters",
  clearAllFilters: "Clear all",
  removeFilter: "Remove",
  filterLabels: {
    q: "Search",
    city: "City",
    operationType: "Transaction",
    propertyType: "Type",
    sellerType: "Seller",
    priceMin: "Min price",
    priceMax: "Max price",
    beds: "Beds",
    baths: "Baths",
    pets: "Pets",
    furnished: "Furnished",
    pool: "Pool",
    primary: "Tags",
    secondary: "Details",
    propiedad: "Category",
    precio: "Price band",
    zip: "ZIP",
  },
  spotlightTitle: "Business listings first",
  spotlightSubtitle:
    "A capped lane for brokerages: editorial / trust / freshness scoring — not highest bidder only.",
  spotlightBadge: "Business",
  mapAsideTitle: "Map",
  mapAsideBody:
    "Explore the area without losing the list. Turn on the map to place each listing in context.",
  moreResultsTitle: "Listings in your search",
  emptyState: "No matches for these filters.",
  emptyCta: "View full demo",
  paginationPrev: "Previous",
  paginationNext: "Next",
  pageIndicator: "Page",
  footerLine: "Leonix community · Moderated listings · Category demo",
  footerPublish: "Post a listing",
  sellerKindLabels: { privado: "Private", negocio: "Business" },
};

export function getBrResultsCopy(lang: Lang): BrResultsCopy {
  return lang === "en" ? EN : ES;
}
