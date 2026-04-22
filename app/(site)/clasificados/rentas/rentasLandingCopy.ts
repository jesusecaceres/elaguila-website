import type { RentasLandingLang } from "./rentasLandingLang";

export type RentasLandingCopy = {
  breadcrumbClasificados: string;
  breadcrumbRentas: string;
  title: string;
  intro: string;
  /** Short line above publish CTAs (landlords / inventory). */
  publishEyebrow: string;
  publishHint: string;
  publishPrivado: string;
  publishNegocio: string;
  langEs: string;
  langEn: string;
  search: {
    /** Visible heading above the search module (hierarchy + affordance). */
    moduleHeadline: string;
    /** Optional city / CP line (handoff → `city` or `zip` query). */
    locationLabel: string;
    locationPlaceholder: string;
    labelSearch: string;
    placeholder: string;
    tipo: string;
    tipoPlaceholder: string;
    optCasa: string;
    optDepto: string;
    optTerreno: string;
    optComercial: string;
    precio: string;
    recs: string;
    recsAny: string;
    buscar: string;
    /** Clarifies that city vs ZIP is resolved on the results URL. */
    locationHint: string;
  };
  priceOptions: { value: string; label: string }[];
  quickExplore: {
    title: string;
    subtitle: string;
    chipResidencial: string;
    chipComercial: string;
    chipTerreno: string;
    chipPrivado: string;
    chipNegocio: string;
    chipAmueblado: string;
    chipMascotas: string;
    chipRecs2: string;
    groupProperty: string;
    groupSeller: string;
    groupDetails: string;
  };
  featured: {
    title: string;
    subtitle: string;
    badgeFeatured: string;
    beds: string;
    baths: string;
    sqft: string;
    ctaDetails: string;
    ctaSimilar: string;
    supportingEyebrow: string;
    ctaSupporting: string;
    viewAllResults: string;
    bedsShort: string;
    bathsShort: string;
  };
  sections: {
    destacadas: { title: string; description: string; action: string };
    recientes: { title: string; description: string; action: string };
    negocios: { title: string; description: string; action: string };
    privado: { title: string; description: string; action: string };
  };
  card: {
    verResultados: string;
    destacada: string;
    sellerPrivado: string;
    sellerNegocio: string;
  };
  searchHelperLink: string;
  trust: {
    line: string;
    contact: string;
    ctaResults: string;
    backClasificados: string;
  };
  /** Demo results chrome (`/clasificados/rentas/results`) — keeps parity with landing `lang`. */
  results: {
    introPart1: string;
    introPart2: string;
    topBarResults: string;
    createAccount: string;
    branchLabel: string;
    branchAll: string;
    branchPrivado: string;
    branchNegocio: string;
    featuredHeadingDemo: string;
    noFeatured: string;
    moreRentals: string;
    noMatches: string;
    clearFiltersDemo: string;
    backToHub: string;
    /** Toolbar / listing chrome */
    categoryLabel: string;
    categoryAll: string;
    countShowing: string;
    countOf: string;
    countResults: string;
    sortLabel: string;
    sortRecent: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    viewGridAria: string;
    viewListAria: string;
    filterRefine: string;
    applyFilters: string;
    cityLabel: string;
    zipLabel: string;
    bathsMinLabel: string;
    halfBathsMinLabel: string;
    bathsAny: string;
    geoSearchDisabledTitle: string;
    geoSearchDisabledBody: string;
    poolToggle: string;
    highlightsHelp: string;
    highlightsChipLabel: string;
    subtypeLabel: string;
    kindLabel: string;
    kindAny: string;
    /** Full filter zone title (results). */
    filterZoneTitle: string;
    /** Shown when `RENTAS_PUBLIC_DATA_SOURCE === "demo"` — does not claim live inventory. */
    dataSourceNote: string;
    paginationPrev: string;
    paginationNext: string;
    /** Placeholders `{current}` and `{total}` for page indicator. */
    paginationPageOf: string;
    rentMinLabel: string;
    rentMaxLabel: string;
    depositMinLabel: string;
    depositMaxLabel: string;
    leaseLabel: string;
    leaseAny: string;
    parkingMinLabel: string;
    sqftMinLabel: string;
    sqftMaxLabel: string;
    filterAmenities: string;
    furnishedToggle: string;
    petsToggle: string;
    activeFiltersLabel: string;
  };
  /** Public listing detail shell */
  detail: {
    metaTitleSuffix: string;
    backToResults: string;
    rentLabel: string;
    specsTitle: string;
    descriptionTitle: string;
    sellerTitle: string;
    furnished: string;
    pets: string;
    yes: string;
    no: string;
    unknown: string;
    sectionFees: string;
    sectionLease: string;
    sectionExtras: string;
    mapLink: string;
    videoLink: string;
    halfBaths: string;
    listingStatusHeading: string;
    businessMarca: string;
    businessAgent: string;
    socialHeading: string;
    postedOn: string;
    ctaLeonixInquiry: string;
    publishedLiveTitle: string;
    publishedLiveBody: string;
    ctaContact: string;
    ctaPublish: string;
    trustNote: string;
    relatedTitle: string;
    relatedBody: string;
  };
};

const ES: RentasLandingCopy = {
  breadcrumbClasificados: "Clasificados",
  breadcrumbRentas: "Rentas",
  title: "Rentas",
  intro:
    "Rentas residenciales, comerciales y terrenos en un solo lugar. Navega con claridad y publica como particular o negocio cuando quieras listar.",
  publishEyebrow: "Publicar",
  publishHint: "Listado claro para particulares y cuentas comerciales.",
  publishPrivado: "Publicar — Privado",
  publishNegocio: "Publicar — Negocio",
  langEs: "ES",
  langEn: "EN",
  search: {
    moduleHeadline: "Buscar rentas",
    locationHint: "En resultados se guarda como ciudad o código postal.",
    locationLabel: "Ciudad o código postal",
    locationPlaceholder: "Ej. Monterrey o 64000",
    labelSearch: "Búsqueda",
    placeholder: "Palabras clave, colonia, ciudad…",
    tipo: "Tipo",
    tipoPlaceholder: "Tipo de propiedad",
    optCasa: "Casa",
    optDepto: "Departamento",
    optTerreno: "Terreno",
    optComercial: "Comercial",
    precio: "Precio",
    recs: "Recámaras",
    recsAny: "Cualquier número",
    buscar: "Buscar",
  },
  priceOptions: [
    { value: "", label: "Cualquiera" },
    { value: "r0-15k", label: "Hasta $15,000 / mes" },
    { value: "r15-25k", label: "$15,000 – $25,000 / mes" },
    { value: "r25-40k", label: "$25,000 – $40,000 / mes" },
    { value: "r40-60k", label: "$40,000 – $60,000 / mes" },
    { value: "r60k+", label: "Más de $60,000 / mes" },
  ],
  quickExplore: {
    title: "Explorar rápido",
    subtitle: "Abre la cuadrícula de resultados con filtros listos: tipo de propiedad, particular o negocio, y comodidades.",
    chipResidencial: "Residencial",
    chipComercial: "Comercial",
    chipTerreno: "Terreno / lote",
    chipPrivado: "Privado",
    chipNegocio: "Negocio",
    chipAmueblado: "Amueblado",
    chipMascotas: "Mascotas",
    chipRecs2: "2+ recámaras",
    groupProperty: "Tipo de propiedad",
    groupSeller: "Particular o negocio",
    groupDetails: "Comodidades y tamaño",
  },
  featured: {
    title: "Destacado",
    subtitle: "Inventario de ejemplo — las promociones reales llegarán con datos publicados.",
    badgeFeatured: "Destacada",
    beds: "Recámaras",
    baths: "Baños",
    sqft: "Superficie",
    ctaDetails: "Ver detalles en resultados",
    ctaSimilar: "Ver similares",
    supportingEyebrow: "También en Rentas",
    ctaSupporting: "Ver en resultados",
    viewAllResults: "Ver todos los resultados",
    bedsShort: "recámaras",
    bathsShort: "baños",
  },
  sections: {
    destacadas: {
      title: "Destacadas",
      description: "Anuncios con mayor visibilidad en esta demo.",
      action: "Ver resultados",
    },
    recientes: {
      title: "Recientes",
      description: "Orden demo por referencia reciente.",
      action: "Ver todo",
    },
    negocios: {
      title: "Negocios",
      description: "Inventario de cuentas comerciales — visibilidad fuerte sin ocultar particulares.",
      action: "Solo negocio",
    },
    privado: {
      title: "Desde particulares",
      description: "Rentas publicadas por personas en el mismo ecosistema.",
      action: "Solo privado",
    },
  },
  card: {
    verResultados: "Ver en resultados",
    destacada: "Destacada",
    sellerPrivado: "Privado",
    sellerNegocio: "Negocio",
  },
  searchHelperLink: "Ver resultados sin filtros",
  trust: {
    line: "Leonix Clasificados · Listados moderados ·",
    contact: "Contacto directo",
    ctaResults: "Ver resultados",
    backClasificados: "Volver a Clasificados",
  },
  results: {
    introPart1: "Resultados de renta en catálogo publicado. ",
    introPart2: "No es vista previa de publicación: ",
    topBarResults: "Resultados",
    createAccount: "Crear cuenta",
    branchLabel: "Rama",
    branchAll: "Todas",
    branchPrivado: "Privado",
    branchNegocio: "Negocio",
    featuredHeadingDemo: "Destacado (demo)",
    noFeatured: "Sin destacado en esta vista.",
    moreRentals: "Más rentas",
    noMatches: "Sin coincidencias.",
    clearFiltersDemo: "Limpiar filtros (demo)",
    backToHub: "Volver al hub Rentas",
    categoryLabel: "Categoría",
    categoryAll: "Todas",
    countShowing: "Mostrando",
    countOf: "de",
    countResults: "resultados",
    sortLabel: "Orden",
    sortRecent: "Más reciente",
    sortPriceAsc: "Renta: menor a mayor",
    sortPriceDesc: "Renta: mayor a menor",
    viewGridAria: "Vista cuadrícula",
    viewListAria: "Vista lista",
    filterRefine: "Ubicación y baños",
    applyFilters: "Aplicar filtros",
    cityLabel: "Ciudad",
    zipLabel: "CP",
    bathsMinLabel: "Baños mín.",
    halfBathsMinLabel: "Medios baños mín.",
    bathsAny: "Cualquiera",
    geoSearchDisabledTitle: "Búsqueda por mapa / radio",
    geoSearchDisabledBody:
      "El catálogo aún no expone coordenadas por anuncio para filtrar por distancia. Usa ciudad o código postal arriba; los parámetros `lat`/`lng`/`radius_km` ya no se escriben en la URL.",
    poolToggle: "Solo con alberca / piscina",
    highlightsHelp: "Destacados (URL: highlights=slug1,slug2)",
    highlightsChipLabel: "Destacados",
    subtypeLabel: "Subtipo (código exacto)",
    kindLabel: "Tipo resultado",
    kindAny: "Cualquiera",
    filterZoneTitle: "Ubicación y filtros",
    dataSourceNote:
      "Vista con datos de demostración: cuando el inventario publicado esté conectado, verás anuncios reales aquí.",
    paginationPrev: "Anterior",
    paginationNext: "Siguiente",
    paginationPageOf: "Página {current} de {total}",
    rentMinLabel: "Renta mín. / mes",
    rentMaxLabel: "Renta máx. / mes",
    depositMinLabel: "Depósito mín. (USD)",
    depositMaxLabel: "Depósito máx. (USD)",
    leaseLabel: "Plazo de contrato",
    leaseAny: "Cualquiera",
    parkingMinLabel: "Estacionamientos mín.",
    sqftMinLabel: "Superficie mín. (aprox.)",
    sqftMaxLabel: "Superficie máx. (aprox.)",
    filterAmenities: "Comodidades",
    furnishedToggle: "Solo amueblado",
    petsToggle: "Mascotas permitidas",
    activeFiltersLabel: "Filtros activos",
  },
  detail: {
    metaTitleSuffix: "Rentas | Leonix",
    backToResults: "Volver a resultados",
    rentLabel: "Renta mensual",
    specsTitle: "Características",
    descriptionTitle: "Descripción",
    sellerTitle: "Anunciante",
    furnished: "Amueblado",
    pets: "Mascotas",
    yes: "Sí",
    no: "No",
    unknown: "Sin especificar",
    sectionFees: "Depósito y condiciones",
    sectionLease: "Plazo y disponibilidad",
    sectionExtras: "Servicios y requisitos",
    mapLink: "Ver en mapa",
    videoLink: "Video",
    halfBaths: "Medios baños",
    listingStatusHeading: "Estado del anuncio (disponibilidad)",
    businessMarca: "Marca / correduría",
    businessAgent: "Contacto comercial",
    socialHeading: "Redes y enlaces",
    postedOn: "Publicado",
    ctaLeonixInquiry: "Consulta por Leonix (cuenta requerida)",
    publishedLiveTitle: "Tu anuncio está publicado",
    publishedLiveBody:
      "Aparece en resultados y en Mis anuncios cuando el estado sea activo y público. Los visitantes ven esta página según las reglas de visibilidad del catálogo.",
    ctaContact: "Enviar mensaje",
    ctaPublish: "Publicar una renta",
    trustNote: "Leonix Clasificados · Anuncios revisados · Contacto directo entre partes",
    relatedTitle: "Más en Rentas",
    relatedBody: "Próximamente: recomendaciones basadas en tu búsqueda.",
  },
};

const EN: RentasLandingCopy = {
  breadcrumbClasificados: "Classifieds",
  breadcrumbRentas: "Rentals",
  title: "Rentals",
  intro:
    "Residential, commercial, and land rentals in one place. Browse with clarity and publish as an individual or business when you are ready to list.",
  publishEyebrow: "Publish",
  publishHint: "Clear listings for individuals and business accounts.",
  publishPrivado: "List — Private",
  publishNegocio: "List — Business",
  langEs: "ES",
  langEn: "EN",
  search: {
    moduleHeadline: "Find rentals",
    locationHint: "On results, this becomes city or postal code.",
    locationLabel: "City or ZIP",
    locationPlaceholder: "e.g. Monterrey or 64000",
    labelSearch: "Search",
    placeholder: "Keywords, neighborhood, city…",
    tipo: "Type",
    tipoPlaceholder: "Property type",
    optCasa: "House",
    optDepto: "Apartment",
    optTerreno: "Land",
    optComercial: "Commercial",
    precio: "Price",
    recs: "Bedrooms",
    recsAny: "Any count",
    buscar: "Search",
  },
  priceOptions: [
    { value: "", label: "Any" },
    { value: "r0-15k", label: "Up to $15,000 / mo" },
    { value: "r15-25k", label: "$15,000 – $25,000 / mo" },
    { value: "r25-40k", label: "$25,000 – $40,000 / mo" },
    { value: "r40-60k", label: "$40,000 – $60,000 / mo" },
    { value: "r60k+", label: "Over $60,000 / mo" },
  ],
  quickExplore: {
    title: "Quick explore",
    subtitle: "Open the results grid with filters ready: property type, seller branch, and amenities.",
    chipResidencial: "Residential",
    chipComercial: "Commercial",
    chipTerreno: "Land / lot",
    chipPrivado: "Private",
    chipNegocio: "Business",
    chipAmueblado: "Furnished",
    chipMascotas: "Pets",
    chipRecs2: "2+ bedrooms",
    groupProperty: "Property type",
    groupSeller: "Private or business",
    groupDetails: "Amenities & size",
  },
  featured: {
    title: "Featured",
    subtitle: "Sample inventory — live promotions will arrive with published data.",
    badgeFeatured: "Featured",
    beds: "Bedrooms",
    baths: "Baths",
    sqft: "Area",
    ctaDetails: "View details in results",
    ctaSimilar: "View similar",
    supportingEyebrow: "Also in Rentals",
    ctaSupporting: "View in results",
    viewAllResults: "View all results",
    bedsShort: "beds",
    bathsShort: "baths",
  },
  sections: {
    destacadas: {
      title: "Featured picks",
      description: "Listings with stronger visibility in this demo.",
      action: "View results",
    },
    recientes: {
      title: "Recent",
      description: "Demo ordering by recency reference.",
      action: "View all",
    },
    negocios: {
      title: "Businesses",
      description: "Commercial accounts — strong visibility without hiding private listings.",
      action: "Business only",
    },
    privado: {
      title: "From individuals",
      description: "Rentals published by people in the same ecosystem.",
      action: "Private only",
    },
  },
  card: {
    verResultados: "View in results",
    destacada: "Featured",
    sellerPrivado: "Private",
    sellerNegocio: "Business",
  },
  searchHelperLink: "View results without filters",
  trust: {
    line: "Leonix Classifieds · Moderated listings ·",
    contact: "Direct contact",
    ctaResults: "View results",
    backClasificados: "Back to Classifieds",
  },
  results: {
    introPart1: "Rental results from the published catalog. ",
    introPart2: "This is not a publish preview: ",
    topBarResults: "Results",
    createAccount: "Create account",
    branchLabel: "Branch",
    branchAll: "All",
    branchPrivado: "Private",
    branchNegocio: "Business",
    featuredHeadingDemo: "Featured (demo)",
    noFeatured: "No featured listing in this view.",
    moreRentals: "More rentals",
    noMatches: "No matches.",
    clearFiltersDemo: "Clear filters",
    backToHub: "Back to Rentals hub",
    categoryLabel: "Category",
    categoryAll: "All",
    countShowing: "Showing",
    countOf: "of",
    countResults: "results",
    sortLabel: "Sort",
    sortRecent: "Newest",
    sortPriceAsc: "Rent: low to high",
    sortPriceDesc: "Rent: high to low",
    viewGridAria: "Grid view",
    viewListAria: "List view",
    filterRefine: "Location & baths",
    applyFilters: "Apply filters",
    cityLabel: "City",
    zipLabel: "ZIP",
    bathsMinLabel: "Min baths",
    halfBathsMinLabel: "Min half-baths",
    bathsAny: "Any",
    geoSearchDisabledTitle: "Map / radius search",
    geoSearchDisabledBody:
      "Listings do not yet expose per-row coordinates for distance filtering. Use city or postal code above; `lat`/`lng`/`radius_km` are no longer written to the URL.",
    poolToggle: "Pool only",
    highlightsHelp: "Highlights (URL: highlights=slug1,slug2)",
    highlightsChipLabel: "Highlights",
    subtypeLabel: "Subtype (exact code)",
    kindLabel: "Result kind",
    kindAny: "Any",
    filterZoneTitle: "Location & filters",
    dataSourceNote:
      "Demo data view: when live published inventory is connected, you will see real listings here.",
    paginationPrev: "Previous",
    paginationNext: "Next",
    paginationPageOf: "Page {current} of {total}",
    rentMinLabel: "Min rent / mo",
    rentMaxLabel: "Max rent / mo",
    depositMinLabel: "Min deposit (USD)",
    depositMaxLabel: "Max deposit (USD)",
    leaseLabel: "Lease term",
    leaseAny: "Any",
    parkingMinLabel: "Min parking spaces",
    sqftMinLabel: "Min interior sq ft (approx.)",
    sqftMaxLabel: "Max interior sq ft (approx.)",
    filterAmenities: "Amenities",
    furnishedToggle: "Furnished only",
    petsToggle: "Pets allowed",
    activeFiltersLabel: "Active filters",
  },
  detail: {
    metaTitleSuffix: "Rentals | Leonix",
    backToResults: "Back to results",
    rentLabel: "Monthly rent",
    specsTitle: "Highlights",
    descriptionTitle: "Description",
    sellerTitle: "Posted by",
    furnished: "Furnished",
    pets: "Pets",
    yes: "Yes",
    no: "No",
    unknown: "Not specified",
    sectionFees: "Deposit & terms",
    sectionLease: "Lease & availability",
    sectionExtras: "Services & requirements",
    mapLink: "View on map",
    videoLink: "Video",
    halfBaths: "Half baths",
    listingStatusHeading: "Listing availability",
    businessMarca: "Brand / brokerage",
    businessAgent: "Commercial contact",
    socialHeading: "Social & links",
    postedOn: "Posted",
    ctaLeonixInquiry: "Message via Leonix (sign-in required)",
    publishedLiveTitle: "Your listing is live",
    publishedLiveBody:
      "It appears in results and in My Listings when status is active and public. Visitors see this page according to catalog visibility rules.",
    ctaContact: "Send message",
    ctaPublish: "Post a rental",
    trustNote: "Leonix Classifieds · Listings reviewed · Direct contact between parties",
    relatedTitle: "More in Rentals",
    relatedBody: "Coming soon: recommendations based on your search.",
  },
};

export const RENTAS_LANDING_COPY: Record<RentasLandingLang, RentasLandingCopy> = {
  es: ES,
  en: EN,
};
