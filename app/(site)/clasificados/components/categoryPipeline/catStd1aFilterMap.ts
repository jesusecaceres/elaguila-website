/**
 * CAT-STD-1A — Read-only filter / field wiring map for rollout gates.
 * Documentation in code only; not imported by runtime browse clients.
 */

export type CatStd1aFilterWiring =
  | "REAL_AND_WIRED"
  | "REAL_FIELD_NOT_WIRED"
  | "VISUAL_ONLY"
  | "BROKEN_OR_404"
  | "UNKNOWN"
  | "SHOULD_REMOVE_OR_HIDE"
  | "SAFE_TO_KEEP";

export type CatStd1aVisibleControl = {
  id: string;
  surface: "landing" | "results" | "both";
  uiLabel: string;
  queryParam: string | null;
  wiring: CatStd1aFilterWiring;
  notes: string;
};

export type CatStd1aFieldRow = {
  field: string;
  sourceFiles: string[];
  queryParam: string | null;
  uiControl: string;
  worksLanding: boolean;
  worksResults: boolean;
  preservesOnSortPage: boolean;
  primaryFilter: boolean;
  advancedFilter: boolean;
  wiring: CatStd1aFilterWiring;
  notes: string;
};

/** En Venta — model category for CAT-STD filter standard (Gate 0 + 1A audit). */
export const EN_VENTA_VISIBLE_CONTROLS: readonly CatStd1aVisibleControl[] = [
  { id: "search-q", surface: "both", uiLabel: "Search input", queryParam: "q", wiring: "REAL_AND_WIRED", notes: "Landing form GET; results form + client filter" },
  { id: "city", surface: "both", uiLabel: "City", queryParam: "city", wiring: "REAL_AND_WIRED", notes: "Landing preset select; results text input" },
  { id: "zip", surface: "results", uiLabel: "ZIP", queryParam: "zip", wiring: "REAL_AND_WIRED", notes: "Results only — landing gap" },
  { id: "evDept", surface: "both", uiLabel: "Department", queryParam: "evDept", wiring: "REAL_AND_WIRED", notes: "Landing dept grid; results select" },
  { id: "evSub", surface: "results", uiLabel: "Subcategory", queryParam: "evSub", wiring: "REAL_AND_WIRED", notes: "Results select" },
  { id: "cond", surface: "results", uiLabel: "Condition", queryParam: "cond", wiring: "REAL_AND_WIRED", notes: "Matches publish condition keys" },
  { id: "priceMinMax", surface: "results", uiLabel: "Price min/max", queryParam: "priceMin,priceMax", wiring: "REAL_AND_WIRED", notes: "Numeric client filter" },
  { id: "pickup", surface: "both", uiLabel: "Pickup", queryParam: "pickup", wiring: "REAL_AND_WIRED", notes: "Landing browse chip + results checkbox" },
  { id: "ship", surface: "both", uiLabel: "Shipping", queryParam: "ship", wiring: "REAL_AND_WIRED", notes: "Landing browse chip + results checkbox" },
  { id: "delivery", surface: "results", uiLabel: "Local delivery", queryParam: "delivery", wiring: "REAL_AND_WIRED", notes: "Results checkbox" },
  { id: "free", surface: "results", uiLabel: "Free only", queryParam: "free", wiring: "REAL_AND_WIRED", notes: "is_free row filter" },
  { id: "nego", surface: "results", uiLabel: "Negotiable", queryParam: "nego", wiring: "REAL_AND_WIRED", notes: "Leonix:negotiable / DTO" },
  { id: "meetup", surface: "results", uiLabel: "Meetup", queryParam: "meetup", wiring: "REAL_AND_WIRED", notes: "Form name meetupFilter maps on submit" },
  { id: "seller", surface: "both", uiLabel: "Seller type", queryParam: "seller", wiring: "REAL_AND_WIRED", notes: "individual | business" },
  { id: "sort", surface: "both", uiLabel: "Sort", queryParam: "sort", wiring: "REAL_AND_WIRED", notes: "newest | price-asc | price-desc" },
  { id: "view", surface: "results", uiLabel: "Grid/list", queryParam: "view", wiring: "REAL_AND_WIRED", notes: "Layout only; preserved in URL" },
  { id: "page", surface: "results", uiLabel: "Pagination", queryParam: "page", wiring: "REAL_AND_WIRED", notes: "Client slice; default PAGE_SIZE 24" },
  { id: "perPage", surface: "results", uiLabel: "Results per page", queryParam: null, wiring: "REAL_FIELD_NOT_WIRED", notes: "Not implemented; 12/24/48 feasible client-side" },
  { id: "featured", surface: "both", uiLabel: "Recently refreshed / featured", queryParam: "featured", wiring: "SAFE_TO_KEEP", notes: "Wired to admin_promoted + Leonix:promoted; copy implies republish window — mislabeled" },
  { id: "mapRadius", surface: "results", uiLabel: "Map / radius details", queryParam: null, wiring: "SHOULD_REMOVE_OR_HIDE", notes: "Explicitly non-filtering informational panel" },
  { id: "useLocation", surface: "results", uiLabel: "Use my location", queryParam: null, wiring: "REAL_AND_WIRED", notes: "Sets city via geolocation guess then pushParams" },
  { id: "quickChips", surface: "landing", uiLabel: "CategoryStandardQuickFilterChips", queryParam: "q", wiring: "REAL_FIELD_NOT_WIRED", notes: "Passed as searchChips but not rendered when searchSlot set; would use q=label not facets" },
  { id: "clearFilters", surface: "results", uiLabel: "Clear all", queryParam: null, wiring: "REAL_AND_WIRED", notes: "resetFilters → buildEnVentaResultsUrl(lang)" },
  { id: "mobileFilters", surface: "results", uiLabel: "Más filtros drawer", queryParam: null, wiring: "REAL_AND_WIRED", notes: "Bottom sheet; submits same form" },
] as const;

export const EN_VENTA_FIELD_TO_FILTER_MAP: readonly CatStd1aFieldRow[] = [
  { field: "title, description, brand, model, quantity", sourceFiles: ["enVentaFreeFormState.ts", "enVentaPublishContract.ts", "buildEnVentaSearchText.ts"], queryParam: "q", uiControl: "Search input", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: true, advancedFilter: false, wiring: "REAL_AND_WIRED", notes: "Synonym expansion in search blob" },
  { field: "city", sourceFiles: ["enVentaFreeFormState.ts", "enVentaLocationMatch.ts"], queryParam: "city", uiControl: "City select/input", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: true, advancedFilter: false, wiring: "REAL_AND_WIRED", notes: "Canonical NorCal matching" },
  { field: "zip", sourceFiles: ["enVentaFreeFormState.ts", "enVentaLocationMatch.ts"], queryParam: "zip", uiControl: "ZIP input", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "5-digit filter when listing has zip" },
  { field: "rama / department", sourceFiles: ["enVentaTaxonomy.ts", "categories.ts"], queryParam: "evDept", uiControl: "Dept grid + select", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: true, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "Not category param" },
  { field: "evSub / itemType", sourceFiles: ["enVentaTaxonomy.ts", "subcategories.ts"], queryParam: "evSub", uiControl: "Subcategory select", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "condition", sourceFiles: ["enVentaTaxonomy.ts"], queryParam: "cond", uiControl: "Condition select", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "new | like-new | good | fair" },
  { field: "price", sourceFiles: ["BasicInfoSection.tsx", "listings.price"], queryParam: "priceMin,priceMax", uiControl: "Price inputs", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "is_free", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: "free", uiControl: "Free checkbox", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "negotiable", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: "nego", uiControl: "Negotiable checkbox", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "pickup, shipping, localDelivery", sourceFiles: ["enVentaFreeFormState.ts", "EnVentaAnuncioDTO.fulfillment"], queryParam: "pickup,ship,delivery", uiControl: "Fulfillment checkboxes", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: true, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "Pickup/ship chips on landing" },
  { field: "meetup", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: "meetup", uiControl: "Meetup checkbox", worksLanding: false, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "seller_kind", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: "seller", uiControl: "Seller select + landing links", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: true, advancedFilter: true, wiring: "REAL_AND_WIRED", notes: "" },
  { field: "admin_promoted, Leonix:promoted", sourceFiles: ["EnVentaResultsClient.tsx"], queryParam: "featured", uiControl: "Featured checkbox + chip", worksLanding: true, worksResults: true, preservesOnSortPage: true, primaryFilter: false, advancedFilter: true, wiring: "SAFE_TO_KEEP", notes: "Mislabeled vs republish window in enVentaVisibilityRenewal.ts" },
  { field: "contact_phone, contact_email", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: null, uiControl: "(none)", worksLanding: false, worksResults: false, preservesOnSortPage: false, primaryFilter: false, advancedFilter: false, wiring: "UNKNOWN", notes: "Not publicly filterable by design" },
  { field: "images, video", sourceFiles: ["enVentaFreeFormState.ts"], queryParam: null, uiControl: "(none)", worksLanding: false, worksResults: false, preservesOnSortPage: false, primaryFilter: false, advancedFilter: false, wiring: "UNKNOWN", notes: "No hasPhotos filter on en-venta browse" },
] as const;

/** Per-category query param keys (summary — see contract files for full semantics). */
export const CAT_STD_1A_CATEGORY_QUERY_PARAMS: Readonly<
  Record<string, { search: string[]; filter: string[]; sortView: string[]; pagination: string[]; perPage: string | null; defaultPageSize: number | null }>
> = {
  "en-venta": {
    search: ["q"],
    filter: ["city", "zip", "evDept", "evSub", "cond", "priceMin", "priceMax", "pickup", "ship", "delivery", "seller", "free", "nego", "meetup", "featured"],
    sortView: ["sort", "view"],
    pagination: ["page"],
    perPage: null,
    defaultPageSize: 24,
  },
  rentas: {
    search: ["q"],
    filter: ["city", "zip", "state", "tipo", "kind", "propiedad", "subtype", "rentMin", "rentMax", "beds", "baths", "mascotas", "pool", "lat", "lng", "radiusKm", "…"],
    sortView: ["sort"],
    pagination: ["page"],
    perPage: null,
    defaultPageSize: 6,
  },
  empleos: {
    search: ["q"],
    filter: ["city", "state", "zip", "category", "jobType", "modality", "salaryMin", "salaryMax", "experience", "featured", "recent", "quickApply", "lane", "…"],
    sortView: ["sort"],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  autos: {
    search: ["q"],
    filter: ["city", "zip", "priceMin", "priceMax", "make", "model", "yearMin", "yearMax", "condition", "seller", "bodyStyle", "transmission", "mileageMin", "mileageMax", "…"],
    sortView: ["sort"],
    pagination: ["page"],
    perPage: null,
    defaultPageSize: 12,
  },
  "bienes-raices": {
    search: ["q"],
    filter: ["city", "zip", "operationType", "propiedad", "priceMin", "priceMax", "beds", "baths", "…"],
    sortView: ["sort", "view"],
    pagination: ["page"],
    perPage: null,
    defaultPageSize: 9,
  },
  servicios: {
    search: ["q"],
    filter: ["city", "group", "seller", "verified", "whatsapp", "promo", "call", "web", "bilingual", "…"],
    sortView: ["sort"],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  restaurantes: {
    search: ["q"],
    filter: ["city", "zip", "cuisine", "service", "…"],
    sortView: ["sort"],
    pagination: [],
    perPage: null,
    defaultPageSize: 9,
  },
  comunidad: {
    search: ["q"],
    filter: ["city", "eventType", "eventCost", "dateFrom", "dateTo", "audience", "registration", "accessibility", "cost", "mode"],
    sortView: [],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  clases: {
    search: ["q"],
    filter: ["city", "classType", "level", "cost", "mode", "audience", "registration", "accessibility"],
    sortView: [],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  busco: {
    search: ["q"],
    filter: ["tipo", "city", "zone", "budget", "contact"],
    sortView: [],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  "mascotas-y-perdidos": {
    search: ["q"],
    filter: ["tipo", "city"],
    sortView: [],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
  viajes: {
    search: ["q", "dest"],
    filter: ["from", "t", "budget", "audience", "…"],
    sortView: ["sort"],
    pagination: [],
    perPage: null,
    defaultPageSize: null,
  },
};

/** En Venta 12/24/48 feasibility (Gate 0 + 1A). */
export const EN_VENTA_PER_PAGE_FEASIBILITY = {
  currentDefault: 24,
  hasLimitParam: false,
  browseFetchCap: 800,
  supports12_24_48WithoutSchema: true,
  requires: ["Add limit/perPage to EV_RESULTS_PARAM", "Use param in slice math", "UI select + pushParams merge"],
} as const;
