import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

const COPY = {
  es: {
    pageTitle: "Ofertas Locales",
    pageSubtitle: "Encuentra volantes, cupones y especiales de negocios locales.",
    heroEyebrow: "LEONIX CLASIFICADOS · OFERTAS LOCALES",
    heroTitle: "Ofertas Locales",
    heroTagline: "Ahorra cerca de tu comunidad.",
    heroIntro: "Encuentra volantes, cupones, especiales y productos de negocios locales en un solo lugar.",
    heroHelper: "Busca por producto, ciudad o código postal; guarda ofertas y visita negocios cerca de ti.",
    sponsorEyebrow: "PRINT · DIGITAL · OFERTAS",
    sponsorTitle: "Destacados en Leonix",
    sponsorBody: "Volantes, cupones y especiales de negocios locales con presencia destacada en Leonix.",
    sponsorSupport: "Ideal para tiendas, restaurantes, mercados, servicios y marcas que quieren más visibilidad local.",
    sponsorPrimaryCta: "Quiero anunciar mis ofertas",
    sponsorSecondaryCta: "Ver ofertas",
    sponsorChips: [
      "Volantes",
      "Cupones",
      "Especiales semanales",
      "Productos destacados",
      "Lista de compras",
      "Visibilidad local",
    ],
    discoveryTitle: "Explorar ofertas por necesidad",
    discoverySubtitle: "Encuentra ofertas reales cerca de ti.",
    searchPlaceholderCompact: "Buscar oferta, cupón, producto o negocio…",
    mobileSearchLabel: "Buscar ofertas",
    filtersButton: "Filtros",
    filtersToggleShow: "Mostrar filtros",
    filtersToggleHide: "Ocultar filtros",
    offersSectionTitle: "Ofertas de negocios",
    itemsSectionTitle: "Buscar por producto",
    searchPlaceholder: "Ej. carne asada, tomates, tortillas, cambio de aceite",
    cityLabel: "Ciudad",
    cityPlaceholder: "Ciudad",
    stateLabel: "Estado / Provincia / Región",
    statePlaceholder: "Estado / provincia / región",
    zipLabel: "ZIP / Código postal",
    zipPlaceholder: "12345, K1A 0B1, 44100",
    countryLabel: "País",
    countryPlaceholder: "Estados Unidos",
    locationGroup: "Ubicación",
    categoryLabel: "Categoría",
    categoryPlaceholder: "Todas",
    marketTypeLabel: "Tipo de mercado",
    marketTypePlaceholder: "Todos",
    offerTypeLabel: "Tipo de oferta",
    offerTypePlaceholder: "Todas",
    sortLabel: "Ordenar",
    sortNewest: "Más recientes",
    sortPriceLow: "Precio más bajo",
    sortExpiringSoon: "Por vencer",
    searchButton: "Buscar",
    searching: "Buscando…",
    resultsCount: (n: number) => (n === 1 ? "1 oferta encontrada" : `${n} ofertas encontradas`),
    emptyTitle: "No encontramos ofertas con esos filtros.",
    emptyHint: "Intenta buscar otro producto o ciudad.",
    pipelineEmptyTitle: "Aún no hay ofertas aprobadas publicadas",
    pipelineEmptyBody: "Cuando los negocios publiquen y Leonix apruebe sus volantes, aparecerán aquí.",
    pipelineEmptyHint: "Vuelve a revisar más tarde o publica la primera oferta.",
    approvedEmptyTitle: "Aún no hay ofertas aprobadas para estos filtros.",
    approvedEmptyBody: "Cuando los negocios publiquen y Leonix apruebe sus volantes, aparecerán aquí.",
    approvedEmptyHint: "Prueba limpiar filtros o vuelve a revisar más tarde.",
    flyerUnavailable: "Volante no disponible",
    productImageUnavailable: "Imagen no disponible",
    viewFlyer: "Ver volante",
    viewOffers: "Ver ofertas",
    viewCoupon: "Ver cupón",
    viewPromotion: "Ver promoción",
    viewDetail: "Ver detalle",
    offerTypeWeeklyFlyer: "Volante semanal",
    offerTypeCoupon: "Cupón",
    offerTypePromotion: "Promoción",
    offerTypeSeasonalSpecial: "Especial de temporada",
    offerTypeBundle: "Combo",
    offerTypeFeaturedDeal: "Oferta destacada",
    loadFailed: "No se pudieron cargar las ofertas.",
    viewDeal: "Ver oferta",
    sourcePage: "Página",
    validDates: "Vigencia",
    detailTitle: "Detalle de la oferta",
    close: "Cerrar",
    viewSource: "Ver volante o cupón original",
    sourceUnavailable:
      "El volante o cupón original todavía no tiene enlace público disponible.",
    call: "Llamar",
    website: "Sitio web",
    directions: "Cómo llegar",
    activateDigitalCoupons: "Activar cupones digitales",
    signUpBeforeYouGo: "Regístrate antes de ir",
    membershipNote: "Membresía",
    digitalCouponNote: "Cupones digitales",
    publishCta: "Publicar oferta",
    viewAllDeals: "Ver todas las ofertas",
    browseAllDeals: "Ver todas las ofertas",
    clearFiltersLink: "Limpiar filtros",
    publishCtaHint: "¿Tienes un negocio? Publica tus ofertas locales.",
    offerDetailTitle: "Detalle de la oferta",
    couponDetails: "Detalles del cupón",
    shareCoupon: "Compartir cupón",
    closeCoupon: "Cerrar cupón",
    termsDetails: "Términos / detalles",
    availableBusinessInfo: "Información disponible del negocio",
    linkCopied: "Enlace copiado.",
    noExtraDetails: "Este cupón no tiene detalles adicionales todavía.",
    addToList: "Agregar a lista",
    addedToList: "Agregado",
    removeFromList: "Quitar",
    shoppingListTitle: "Lista de compras",
    shoppingListOpen: "Abrir lista",
    shoppingListEmptyHelper: "Agrega productos para planear tu visita.",
    viewList: "Ver lista",
    savedOnDevice: "Guardado en este dispositivo",
    mapHandoffNote: "El mapa abre Google Maps; no es optimización automática.",
    myShoppingList: "Lista de compras",
    listButton: "Lista",
    listEmpty: "Agrega productos para planear tu visita.",
    clearList: "Vaciar lista",
    storesInList: "Tiendas en tu lista",
    openMap: "Abrir mapa",
    openMapNoAddress: "Agrega tiendas con ciudad o dirección para abrir el mapa.",
    openMapEmpty: "Agrega productos a tu lista para abrir el mapa.",
    quantityLabel: "Cant.",
    noteLabel: "Nota",
    notePlaceholder: "Opcional",
    copyList: "Copiar lista",
    copyListSuccess: "Lista copiada al portapapeles.",
    copyListFailed: "No se pudo copiar la lista.",
    listSummary: (stores: number, items: number) =>
      `${stores} tienda${stores === 1 ? "" : "s"} · ${items} producto${items === 1 ? "" : "s"}`,
  },
  en: {
    pageTitle: "Local Deals",
    pageSubtitle: "Find flyers, coupons, and specials from local businesses.",
    heroEyebrow: "LEONIX CLASSIFIEDS · LOCAL DEALS",
    heroTitle: "Local Deals",
    heroTagline: "Save close to your community.",
    heroIntro: "Find flyers, coupons, specials, and products from local businesses in one place.",
    heroHelper: "Search by product, city, or postal code; save deals and visit nearby businesses.",
    sponsorEyebrow: "PRINT · DIGITAL · DEALS",
    sponsorTitle: "Featured on Leonix",
    sponsorBody: "Flyers, coupons, and specials from local businesses with featured visibility on Leonix.",
    sponsorSupport: "Built for shops, restaurants, markets, services, and brands that want stronger local visibility.",
    sponsorPrimaryCta: "Advertise my deals",
    sponsorSecondaryCta: "View deals",
    sponsorChips: [
      "Flyers",
      "Coupons",
      "Weekly specials",
      "Featured products",
      "Shopping list",
      "Local visibility",
    ],
    discoveryTitle: "Explore deals by need",
    discoverySubtitle: "Find real local offers near you.",
    searchPlaceholderCompact: "Search deal, coupon, product, or business...",
    mobileSearchLabel: "Search deals",
    filtersButton: "Filters",
    filtersToggleShow: "Show filters",
    filtersToggleHide: "Hide filters",
    offersSectionTitle: "Business deals",
    itemsSectionTitle: "Search by product",
    searchPlaceholder: "Example: carne asada, tomatoes, tortillas, oil change",
    cityLabel: "City",
    cityPlaceholder: "City",
    stateLabel: "State / Province / Region",
    statePlaceholder: "State / province / region",
    zipLabel: "ZIP / Postal code",
    zipPlaceholder: "12345, K1A 0B1, 44100",
    countryLabel: "Country",
    countryPlaceholder: "United States",
    locationGroup: "Location",
    categoryLabel: "Category",
    categoryPlaceholder: "All",
    marketTypeLabel: "Market type",
    marketTypePlaceholder: "All",
    offerTypeLabel: "Offer type",
    offerTypePlaceholder: "All",
    sortLabel: "Sort",
    sortNewest: "Newest",
    sortPriceLow: "Lowest price",
    sortExpiringSoon: "Expiring soon",
    searchButton: "Search",
    searching: "Searching…",
    resultsCount: (n: number) => (n === 1 ? "1 deal found" : `${n} deals found`),
    emptyTitle: "We didn't find deals with those filters.",
    emptyHint: "Try another product or city.",
    pipelineEmptyTitle: "No approved deals published yet",
    pipelineEmptyBody: "Once businesses publish and Leonix approves their flyers, they will appear here.",
    pipelineEmptyHint: "Check back later or publish the first deal.",
    approvedEmptyTitle: "No approved offers match these filters yet.",
    approvedEmptyBody: "Once businesses publish and Leonix approves their flyers, they will appear here.",
    approvedEmptyHint: "Try clearing filters or check back later.",
    flyerUnavailable: "Flyer unavailable",
    productImageUnavailable: "Image unavailable",
    viewFlyer: "View flyer",
    viewOffers: "View offers",
    viewCoupon: "View coupon",
    viewPromotion: "View promotion",
    viewDetail: "View detail",
    offerTypeWeeklyFlyer: "Weekly flyer",
    offerTypeCoupon: "Coupon",
    offerTypePromotion: "Promotion",
    offerTypeSeasonalSpecial: "Seasonal special",
    offerTypeBundle: "Bundle",
    offerTypeFeaturedDeal: "Featured deal",
    loadFailed: "Could not load deals.",
    viewDeal: "View deal",
    sourcePage: "Page",
    validDates: "Valid dates",
    detailTitle: "Deal detail",
    close: "Close",
    viewSource: "View original flyer or coupon",
    sourceUnavailable:
      "The original flyer or coupon does not have a public link available yet.",
    call: "Call",
    website: "Website",
    directions: "Directions",
    activateDigitalCoupons: "Activate digital coupons",
    signUpBeforeYouGo: "Sign up before you go",
    membershipNote: "Membership",
    digitalCouponNote: "Digital coupons",
    publishCta: "Publish deal",
    viewAllDeals: "View all deals",
    browseAllDeals: "View all offers",
    clearFiltersLink: "Clear filters",
    publishCtaHint: "Have a business? Publish your local deals.",
    offerDetailTitle: "Deal detail",
    couponDetails: "Coupon details",
    shareCoupon: "Share coupon",
    closeCoupon: "Close coupon",
    termsDetails: "Terms / details",
    availableBusinessInfo: "Available business information",
    linkCopied: "Link copied.",
    noExtraDetails: "This coupon does not have extra details yet.",
    addToList: "Add to list",
    addedToList: "Added",
    removeFromList: "Remove",
    shoppingListTitle: "Shopping list",
    shoppingListOpen: "Open list",
    shoppingListEmptyHelper: "Add items to plan your visit.",
    viewList: "View list",
    savedOnDevice: "Saved on this device",
    mapHandoffNote: "Map opens Google Maps; this is not automatic route optimization.",
    myShoppingList: "Shopping list",
    listButton: "List",
    listEmpty: "Add items to plan your visit.",
    clearList: "Clear list",
    storesInList: "Stores in your list",
    openMap: "Open map",
    openMapNoAddress: "Add stores with a city or address to open the map.",
    openMapEmpty: "Add items to your list to open the map.",
    quantityLabel: "Qty",
    noteLabel: "Note",
    notePlaceholder: "Optional",
    copyList: "Copy list",
    copyListSuccess: "List copied to clipboard.",
    copyListFailed: "Could not copy the list.",
    listSummary: (stores: number, items: number) =>
      `${stores} store${stores === 1 ? "" : "s"} · ${items} item${items === 1 ? "" : "s"}`,
  },
} as const;

type WidenCopy<T> =
  T extends (...args: infer Args) => infer Return
    ? (...args: Args) => Return
    : T extends readonly (infer Item)[]
      ? readonly WidenCopy<Item>[]
      : T extends string
        ? string
        : T extends object
          ? { readonly [K in keyof T]: WidenCopy<T[K]> }
        : T;

export type OfertasLocalesPublicSearchCopy = WidenCopy<(typeof COPY)[OfertasLocalesAppLang]> & {
  couponImageUnavailable?: string;
  cuponesResultsIntroTitle?: string;
  cuponesResultsIntroHelper?: string;
};

const CUPONES_COPY = {
  es: {
    ...COPY.es,
    pageTitle: "Cupones locales",
    pageSubtitle: "Promociones, descuentos y especiales cerca de ti.",
    heroEyebrow: "LEONIX · CUPONES LOCALES",
    heroTitle: "Ahorra con cupones de negocios locales",
    heroTagline: "Promociones, descuentos y especiales cerca de ti.",
    heroIntro: "Explora cupones y promociones de restaurantes, servicios, tiendas y negocios locales en Leonix.",
    heroHelper: "Busca por ciudad, código postal, categoría o negocio local.",
    sponsorEyebrow: "CUPONES · PROMOCIONES · ESPECIALES",
    sponsorTitle: "Publica cupones para tu negocio",
    sponsorBody: "Promociona cupones, descuentos, combos y especiales locales en Leonix.",
    sponsorSupport: "Ideal para restaurantes, servicios, tiendas, eventos y negocios locales.",
    sponsorPrimaryCta: "Publicar cupón",
    sponsorSecondaryCta: "Ver todos los cupones",
    sponsorChips: [
      "Cupones",
      "Promociones",
      "Descuentos",
      "Combos",
      "Especiales de temporada",
      "Negocios locales",
    ],
    discoveryTitle: "Explorar cupones",
    discoverySubtitle: "Encuentra promociones y especiales cerca de ti.",
    searchPlaceholderCompact: "Buscar cupón, ciudad, código postal…",
    mobileSearchLabel: "Buscar cupones",
    offersSectionTitle: "Cupones y promociones",
    itemsSectionTitle: "Cupones",
    searchPlaceholder: "Ej. descuento, restaurante, aceite, evento",
    offerTypePlaceholder: "Cupón, promoción, especial...",
    sortPriceLow: "Más recientes",
    searchButton: "Buscar cupones",
    resultsCount: (n: number) => (n === 1 ? "1 cupón encontrado" : `${n} cupones encontrados`),
    emptyTitle: "No encontramos cupones con esos filtros.",
    emptyHint: "Intenta buscar otra ciudad, categoría o promoción.",
    pipelineEmptyTitle: "Aún no hay cupones aprobados publicados",
    pipelineEmptyBody: "Cuando los negocios publiquen y Leonix apruebe sus cupones, aparecerán aquí.",
    pipelineEmptyHint: "¿Tienes un negocio? Publica tu primer cupón.",
    approvedEmptyTitle: "Aún no hay cupones aprobados para estos filtros.",
    approvedEmptyBody: "Cuando los negocios publiquen y Leonix apruebe sus cupones, aparecerán aquí.",
    approvedEmptyHint: "Prueba cambiar o limpiar los filtros.",
    couponImageUnavailable: "Imagen no disponible",
    cuponesResultsIntroTitle: "Cupones y promociones locales",
    cuponesResultsIntroHelper:
      "Explora descuentos y especiales de negocios locales. Abre un cupón para ver detalles, vigencia e información del negocio.",
    loadFailed: "No se pudieron cargar los cupones.",
    viewDeal: "Ver cupón",
    validDates: "Vigencia",
    publishCta: "Publicar cupón",
    viewAllDeals: "Ver todos los cupones",
    browseAllDeals: "Ver todos los cupones",
    publishCtaHint: "¿Tienes un negocio? Publica cupones y promociones.",
    offerDetailTitle: "Detalle del cupón",
    viewSource: "Ver cupón original",
    sourceUnavailable: "Este cupón todavía no tiene un enlace público disponible.",
  },
  en: {
    ...COPY.en,
    pageTitle: "Local coupons",
    pageSubtitle: "Promotions, discounts, and specials near you.",
    heroEyebrow: "LEONIX · LOCAL COUPONS",
    heroTitle: "Save with local business coupons",
    heroTagline: "Promotions, discounts, and specials near you.",
    heroIntro: "Explore coupons and promotions from restaurants, services, shops, and local businesses on Leonix.",
    heroHelper: "Search by city, postal code, category, or local business.",
    sponsorEyebrow: "COUPONS · PROMOTIONS · SPECIALS",
    sponsorTitle: "Publish coupons for your business",
    sponsorBody: "Promote local coupons, discounts, bundles, and specials on Leonix.",
    sponsorSupport: "Built for restaurants, services, shops, events, and local businesses.",
    sponsorPrimaryCta: "Publish coupon",
    sponsorSecondaryCta: "View all coupons",
    sponsorChips: [
      "Coupons",
      "Promotions",
      "Discounts",
      "Bundles",
      "Seasonal specials",
      "Local businesses",
    ],
    discoveryTitle: "Explore coupons",
    discoverySubtitle: "Find promotions and specials near you.",
    searchPlaceholderCompact: "Search coupon, city, postal code...",
    mobileSearchLabel: "Search coupons",
    offersSectionTitle: "Coupons & promotions",
    itemsSectionTitle: "Coupons",
    searchPlaceholder: "Example: discount, restaurant, oil change, event",
    offerTypePlaceholder: "Coupon, promotion, special...",
    sortPriceLow: "Newest",
    searchButton: "Search coupons",
    resultsCount: (n: number) => (n === 1 ? "1 coupon found" : `${n} coupons found`),
    emptyTitle: "We didn't find coupons with those filters.",
    emptyHint: "Try another city, category, or promotion.",
    pipelineEmptyTitle: "No approved coupons published yet",
    pipelineEmptyBody: "Once businesses publish and Leonix approves their coupons, they will appear here.",
    pipelineEmptyHint: "Have a business? Publish your first coupon.",
    approvedEmptyTitle: "No approved coupons match these filters yet.",
    approvedEmptyBody: "Once businesses publish and Leonix approves their coupons, they will appear here.",
    approvedEmptyHint: "Try changing or clearing the filters.",
    couponImageUnavailable: "Image unavailable",
    cuponesResultsIntroTitle: "Local coupons & promotions",
    cuponesResultsIntroHelper:
      "Browse discounts and specials from local businesses. Open a coupon for details, validity, and business info.",
    loadFailed: "Could not load coupons.",
    viewDeal: "View coupon",
    validDates: "Valid dates",
    publishCta: "Publish coupon",
    viewAllDeals: "View all coupons",
    browseAllDeals: "View all coupons",
    publishCtaHint: "Have a business? Publish coupons and promotions.",
    offerDetailTitle: "Coupon detail",
    viewSource: "View original coupon",
    sourceUnavailable: "This coupon does not have a public link available yet.",
  },
} as const satisfies Record<OfertasLocalesAppLang, OfertasLocalesPublicSearchCopy>;

export type OfertasLocalesResultMode =
  | "all"
  | "flyers"
  | "coupons"
  | "promos"
  | "stores"
  | "services"
  | "food"
  | "products";

const OFERTAS_LOCALES_RESULT_MODE_SET = new Set<string>([
  "all",
  "flyers",
  "coupons",
  "promos",
  "stores",
  "services",
  "food",
  "products",
]);

export function parseOfertasLocalesResultMode(raw: string | null | undefined): OfertasLocalesResultMode {
  const normalized = raw?.trim().toLowerCase() ?? "";
  return OFERTAS_LOCALES_RESULT_MODE_SET.has(normalized)
    ? (normalized as OfertasLocalesResultMode)
    : "all";
}

export type OfertasLocalesResultModeCopy = {
  title: string;
  helper: string;
  pill: string;
  emptyTitle: string;
  emptyHint: string;
  listNote?: string;
};

const RESULT_MODE_COPY: Record<OfertasLocalesAppLang, Record<OfertasLocalesResultMode, OfertasLocalesResultModeCopy>> = {
  es: {
    all: {
      title: "Todas las ofertas",
      helper: "Explora volantes, promociones, cupones, productos y negocios locales aprobados por Leonix.",
      pill: "Todas",
      emptyTitle: "Aún no hay ofertas aprobadas publicadas.",
      emptyHint: "Cuando los negocios publiquen y Leonix apruebe sus ofertas, aparecerán aquí.",
    },
    flyers: {
      title: "Volantes semanales",
      helper: "Explora volantes completos, especiales vigentes y ofertas de negocios locales.",
      pill: "Volantes",
      emptyTitle: "Aún no hay volantes semanales aprobados.",
      emptyHint: "Cuando los negocios publiquen y Leonix apruebe sus volantes, aparecerán aquí.",
    },
    coupons: {
      title: "Cupones",
      helper: "Encuentra descuentos y cupones aprobados de negocios locales.",
      pill: "Cupones",
      emptyTitle: "Aún no hay cupones aprobados para estos filtros.",
      emptyHint: "Cuando los negocios publiquen y Leonix apruebe sus cupones, aparecerán aquí.",
    },
    promos: {
      title: "Promociones",
      helper: "Descubre promociones vigentes y ofertas especiales de negocios locales.",
      pill: "Promociones",
      emptyTitle: "Aún no hay promociones aprobadas para estos filtros.",
      emptyHint: "Prueba cambiar o limpiar los filtros.",
    },
    stores: {
      title: "Tiendas locales",
      helper: "Explora negocios y mercados con volantes y ofertas activas en Leonix.",
      pill: "Tiendas",
      emptyTitle: "Aún no hay tiendas aprobadas para estos filtros.",
      emptyHint: "Prueba cambiar o limpiar los filtros.",
    },
    services: {
      title: "Servicios locales",
      helper: "Promociones y especiales de negocios de servicios.",
      pill: "Servicios",
      emptyTitle: "Aún no hay ofertas de servicios aprobadas para estos filtros.",
      emptyHint: "Prueba cambiar o limpiar los filtros.",
    },
    food: {
      title: "Comida y mercados",
      helper: "Encuentra restaurantes, mercados y ofertas de comida cerca de ti.",
      pill: "Comida",
      emptyTitle: "Aún no hay ofertas de comida aprobadas para estos filtros.",
      emptyHint: "Prueba cambiar o limpiar los filtros.",
    },
    products: {
      title: "Productos encontrados",
      helper: "Compara productos aprobados de distintos negocios y agrégalos a tu Lista de compras.",
      pill: "Productos",
      emptyTitle: "Aún no hay productos aprobados para esta búsqueda.",
      emptyHint: "Prueba otra palabra o revisa nuevamente cuando los negocios publiquen nuevos productos.",
      listNote: "Agrega productos a tu lista de compras mientras exploras.",
    },
  },
  en: {
    all: {
      title: "All offers",
      helper: "Browse approved flyers, promotions, coupons, products, and local businesses.",
      pill: "All",
      emptyTitle: "No approved offers published yet.",
      emptyHint: "Once businesses publish and Leonix approves their offers, they will appear here.",
    },
    flyers: {
      title: "Weekly flyers",
      helper: "Browse complete flyers, current specials, and offers from local businesses.",
      pill: "Flyers",
      emptyTitle: "No approved weekly flyers yet.",
      emptyHint: "Once businesses publish and Leonix approves their flyers, they will appear here.",
    },
    coupons: {
      title: "Coupons",
      helper: "Find approved discounts and coupons from local businesses.",
      pill: "Coupons",
      emptyTitle: "No approved coupons match these filters yet.",
      emptyHint: "Once businesses publish and Leonix approves their coupons, they will appear here.",
    },
    promos: {
      title: "Promotions",
      helper: "Discover current promotions and special offers from local businesses.",
      pill: "Promotions",
      emptyTitle: "No approved promotions match these filters yet.",
      emptyHint: "Try changing or clearing the filters.",
    },
    stores: {
      title: "Local stores",
      helper: "Browse businesses and markets with active flyers and offers on Leonix.",
      pill: "Stores",
      emptyTitle: "No approved stores match these filters yet.",
      emptyHint: "Try changing or clearing the filters.",
    },
    services: {
      title: "Local services",
      helper: "Promotions and specials from service businesses.",
      pill: "Services",
      emptyTitle: "No approved service offers match these filters yet.",
      emptyHint: "Try changing or clearing the filters.",
    },
    food: {
      title: "Food & markets",
      helper: "Find restaurants, markets, and food offers near you.",
      pill: "Food",
      emptyTitle: "No approved food offers match these filters yet.",
      emptyHint: "Try changing or clearing the filters.",
    },
    products: {
      title: "Products found",
      helper: "Compare approved products from local businesses and add them to your shopping list.",
      pill: "Products",
      emptyTitle: "No approved products match this search yet.",
      emptyHint: "Try another keyword or check back when businesses publish new products.",
      listNote: "Add products to your shopping list as you browse.",
    },
  },
};

export type OfertasLocalesShopperModePresentation = {
  mode: OfertasLocalesResultMode;
  showOffers: boolean;
  showItems: boolean;
  offersFirst: boolean;
  offersSectionTitle: string;
  itemsSectionTitle: string;
};

export function resolveOfertasLocalesShopperMode(input: {
  modeParam: string | null | undefined;
  offerTypeParam: string;
  marketTypeParam: string;
  categoryParam: string;
  query: string;
}): OfertasLocalesResultMode {
  const parsed = parseOfertasLocalesResultMode(input.modeParam);
  const offerType = input.offerTypeParam.trim();
  const marketType = input.marketTypeParam.trim();
  const category = input.categoryParam.trim();
  if (offerType === "weekly_flyer") return "flyers";
  if (offerType === "coupon") return "coupons";
  if (offerType === "promotion") return "promos";
  if (parsed === "all" && marketType === "retail") return "stores";
  if (parsed === "all" && marketType === "service") return "services";
  if (parsed === "all" && category === "food") return "food";
  if (input.query.trim() && parsed === "all") return "products";
  return parsed;
}

export function ofertasLocalesShopperModePresentation(
  lang: OfertasLocalesAppLang,
  mode: OfertasLocalesResultMode,
  baseCopy: OfertasLocalesPublicSearchCopy
): OfertasLocalesShopperModePresentation {
  const modeCopy = ofertasLocalesResultModeCopy(lang, mode);
  switch (mode) {
    case "flyers":
      return {
        mode,
        showOffers: true,
        showItems: false,
        offersFirst: true,
        offersSectionTitle: modeCopy.title,
        itemsSectionTitle: baseCopy.itemsSectionTitle,
      };
    case "products":
      return {
        mode,
        showOffers: false,
        showItems: true,
        offersFirst: false,
        offersSectionTitle: baseCopy.offersSectionTitle,
        itemsSectionTitle: modeCopy.title,
      };
    case "coupons":
    case "promos":
    case "stores":
    case "services":
    case "food":
      return {
        mode,
        showOffers: true,
        showItems: false,
        offersFirst: true,
        offersSectionTitle: modeCopy.title,
        itemsSectionTitle: baseCopy.itemsSectionTitle,
      };
    case "all":
    default:
      return {
        mode: "all",
        showOffers: true,
        showItems: true,
        offersFirst: true,
        offersSectionTitle: baseCopy.offersSectionTitle,
        itemsSectionTitle: baseCopy.itemsSectionTitle,
      };
  }
}

export function filterOfertasLocalesOffersForShopperMode(
  offers: readonly { offerType: string; marketType: string; businessCategory: string }[],
  mode: OfertasLocalesResultMode
) {
  switch (mode) {
    case "flyers":
      return offers.filter((offer) => offer.offerType.trim() === "weekly_flyer");
    case "coupons":
      return offers.filter((offer) => offer.offerType.trim() === "coupon");
    case "promos":
      return offers.filter((offer) => offer.offerType.trim() === "promotion");
    case "stores":
      return offers.filter(
        (offer) =>
          offer.marketType.trim() === "retail" ||
          offer.offerType.trim() === "weekly_flyer"
      );
    case "services":
      return offers.filter((offer) => offer.marketType.trim() === "service");
    case "food":
      return offers.filter((offer) => {
        const category = offer.businessCategory.trim().toLowerCase();
        return category.includes("food") || category.includes("restaurant") || category.includes("mercado");
      });
    case "products":
      return [];
    case "all":
    default:
      return offers;
  }
}

export function filterOfertasLocalesItemsForShopperMode<T>(
  items: readonly T[],
  mode: OfertasLocalesResultMode
): T[] {
  if (mode === "products" || mode === "all") return [...items];
  return [];
}

export function ofertasLocalesResultModeCopy(
  lang: OfertasLocalesAppLang,
  mode: OfertasLocalesResultMode
): OfertasLocalesResultModeCopy {
  return RESULT_MODE_COPY[lang][mode];
}

export function ofertasLocalesPublicSearchCopy(
  lang: OfertasLocalesAppLang,
  surface: "ofertas" | "cupones" = "ofertas"
): OfertasLocalesPublicSearchCopy {
  return surface === "cupones" ? CUPONES_COPY[lang] : COPY[lang];
}

export function ofertasLocalesCuponesResultsIntroCopy(lang: OfertasLocalesAppLang): {
  title: string;
  helper: string;
} {
  return {
    title: CUPONES_COPY[lang].cuponesResultsIntroTitle,
    helper: CUPONES_COPY[lang].cuponesResultsIntroHelper,
  };
}

const CUPON_OFFER_TYPE_SET = new Set<string>([
  "coupon",
  "promotion",
  "seasonal_special",
  "bundle",
  "featured_deal",
]);

export function isOfertaLocalCouponOfferType(offerType: string): boolean {
  return CUPON_OFFER_TYPE_SET.has(offerType.trim());
}

export function ofertaLocalPublicOfferTypeLabel(lang: OfertasLocalesAppLang, offerType: string): string {
  const c = COPY[lang];
  switch (offerType.trim()) {
    case "weekly_flyer":
      return c.offerTypeWeeklyFlyer;
    case "coupon":
      return c.offerTypeCoupon;
    case "promotion":
      return c.offerTypePromotion;
    case "seasonal_special":
      return c.offerTypeSeasonalSpecial;
    case "bundle":
      return c.offerTypeBundle;
    case "featured_deal":
      return c.offerTypeFeaturedDeal;
    default:
      return offerType.replace(/_/g, " ");
  }
}

export function ofertaLocalPublicOfferCardCta(
  lang: OfertasLocalesAppLang,
  surface: "ofertas" | "cupones",
  offerType: string
): string {
  const c = ofertasLocalesPublicSearchCopy(lang, surface);
  if (surface === "cupones") return c.viewDeal;
  if (offerType === "weekly_flyer") return c.viewFlyer;
  if (isOfertaLocalCouponOfferType(offerType)) {
    return offerType === "promotion" || offerType === "seasonal_special" || offerType === "bundle"
      ? c.viewPromotion
      : c.viewCoupon;
  }
  return c.viewOffers;
}
