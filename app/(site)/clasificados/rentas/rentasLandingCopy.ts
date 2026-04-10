import type { RentasLandingLang } from "./rentasLandingLang";

export type RentasLandingCopy = {
  breadcrumbClasificados: string;
  breadcrumbRentas: string;
  title: string;
  intro: string;
  publishPrivado: string;
  publishNegocio: string;
  langEs: string;
  langEn: string;
  search: {
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
    "Encuentra rentas residenciales, comerciales y terrenos. Explora con claridad; publica como particular o negocio cuando quieras listar.",
  publishPrivado: "Publicar — Privado",
  publishNegocio: "Publicar — Negocio",
  langEs: "ES",
  langEn: "EN",
  search: {
    labelSearch: "Búsqueda",
    placeholder: "Buscar en Bienes Raíces…",
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
    subtitle: "Atajos a la cuadrícula de resultados con filtros ya aplicados en la URL.",
    chipResidencial: "Residencial",
    chipComercial: "Comercial",
    chipTerreno: "Terreno / lote",
    chipPrivado: "Privado",
    chipNegocio: "Negocio",
    chipAmueblado: "Amueblado",
    chipMascotas: "Mascotas",
    chipRecs2: "2+ recámaras",
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
    line: "Comunidad Leonix · Anuncios moderados ·",
    contact: "Contacto directo",
    ctaResults: "Ver resultados",
    backClasificados: "Volver a Clasificados",
  },
  results: {
    introPart1: "Resultados de renta (demo). ",
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
    "Find residential, commercial, and land rentals. Browse with clarity; publish as an individual or business when you are ready to list.",
  publishPrivado: "List — Private",
  publishNegocio: "List — Business",
  langEs: "ES",
  langEn: "EN",
  search: {
    labelSearch: "Search",
    placeholder: "Search real estate…",
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
    subtitle: "Shortcuts to the results grid with filters preset in the URL.",
    chipResidencial: "Residential",
    chipComercial: "Commercial",
    chipTerreno: "Land / lot",
    chipPrivado: "Private",
    chipNegocio: "Business",
    chipAmueblado: "Furnished",
    chipMascotas: "Pets",
    chipRecs2: "2+ bedrooms",
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
    line: "Leonix community · Moderated listings ·",
    contact: "Direct contact",
    ctaResults: "View results",
    backClasificados: "Back to Classifieds",
  },
  results: {
    introPart1: "Rental results (demo). ",
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
    clearFiltersDemo: "Clear filters (demo)",
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
