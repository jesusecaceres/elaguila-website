import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** All user-facing Viajes UI strings (Spanish-first; category name stays “Viajes” in EN). */
export type ViajesUi = {
  lang: Lang;
  breadcrumbClassifieds: string;
  categoryViajes: string;
  postListing: string;
  exploreByTripType: string;
  /** Landing-only: trip-type chips are search shortcuts, not a second search UI */
  searchShortcutsLabel: string;
  /** Above-the-fold cue: search is step one */
  heroPrimaryCue: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Tier labels for landing visual hierarchy (desktop-first; mobile-safe) */
  landing: {
    tier1Eyebrow: string;
    tier2Eyebrow: string;
    tier3Eyebrow: string;
    /** Separator before trust + publish (distinct from editorial tier label) */
    trustTransitionBreak: string;
    browseAllTrips: string;
    /** One line under agency/partner section header — why paid presence matters */
    advertiserPresenceLine: string;
  };
  search: {
    whereTo: string;
    departureFrom: string;
    anyOrigin: string;
    tripType: string;
    budget: string;
    budgetFlexible: string;
    budgetEconomy: string;
    budgetModerate: string;
    budgetPremium: string;
    exploreCta: string;
    useMyLocation: string;
    locationRequesting: string;
    departureAria: string;
    geoReady: (originLabel: string, airportLine: string) => string;
    geoDenied: string;
    geoUnavailable: string;
    /** Browser took too long to return a fix — user can pick departure manually */
    geoTimeout: string;
    destPlaceholder: string;
    /** One line under the module — clarifies that submit opens results with current filters */
    moduleHint: string;
    /** Short heading inside the search module (primary action) */
    moduleTitle: string;
    /** Honest one-liner: geolocation is one-shot, used only to pick nearest departure bucket */
    geoExplainer: string;
    /** Launch scope under hero search — no postal/ZIP/radius as live filters yet */
    searchScopeNote: string;
  };
  carousel: { prev: string; next: string };
  topOffers: { title: string; subtitle: string; emptyTitle: string; emptyBody: string };
  localDepartures: { title: string; subtitle: string; cta: string; byId: Record<string, { title: string; description: string }> };
  destinations: { title: string; subtitle: string; cta: string; byId: Record<string, { supportingLine: string }> };
  audience: { title: string; subtitle: string; byId: Record<string, { label: string; subline: string }> };
  lower: {
    partnersTitle: string;
    partnersSubtitle: string;
    businessPublished: string;
    verified: string;
    viewProfile: string;
    editorialTitle: string;
    editorialSubtitle: string;
    editorialPill: string;
    readTime: (n: string) => string;
    seasonalTitle: string;
    seasonalSubtitle: string;
    sourcePartner: string;
    sourceBusiness: string;
  };
  tripTypes: {
    all: string;
    weekend: string;
    day: string;
    resorts: string;
    hotels: string;
    tours: string;
    activities: string;
    cruises: string;
    carRental: string;
    transport: string;
    lastMinute: string;
    budgetDeals: string;
    nearYou: string;
  };
  categoryPills: Record<string, string>;
  results: {
    breadcrumbResults: string;
    title: string;
    subtitle: string;
    resultsWord: string;
    post: string;
    viajesHome: string;
    destination: string;
    departureCity: string;
    datesSeason: string;
    tripType: string;
    budget: string;
    audience: string;
    sort: string;
    sortFeatured: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    destPlaceholder: string;
    any: string;
    flexible: string;
    spring: string;
    summer: string;
    fall: string;
    winter: string;
    holidays: string;
    economy: string;
    moderate: string;
    premium: string;
    audienceAll: string;
    audienceFamilies: string;
    audienceCouples: string;
    audienceGroups: string;
    refine: string;
    filters: string;
    close: string;
    filtersDialog: string;
    closeOverlay: string;
    noResults: string;
    /** e.g. “salida SFO” vs “from SFO” in result lines */
    departurePrefix: string;
    /** Line under the H1 describing current query */
    activeSearchLabel: string;
    /** Shown under empty state — link target is clear-all URL */
    emptyRecoveryHint: string;
    discoveryStripTitle: string;
    discoveryStripSubtitle: string;
    /** When user has dest/q — broaden results */
    discoveryClearDestination: string;
    /** Last minute while keeping current departure hub if any */
    discoveryLastMinuteFromCurrent: string;
    discoveryLastMinute: string;
    discoveryFamilies: string;
    discoveryWeekend: string;
    /** Shown when public rows are still demo/sample-backed */
    inventoryDemoBanner: string;
    /** Clarifies departure is hub/region — not postal code search */
    departureFieldNote: string;
  };
  filterRail: {
    destination: string;
    destPlaceholder: string;
    departureCity: string;
    budget: string;
    tripType: string;
    duration: string;
    durationAny: string;
    durationShort: string;
    durationWeek: string;
    durationLong: string;
    audience: string;
    season: string;
    serviceLanguage: string;
    serviceLangAny: string;
    serviceLangEs: string;
    serviceLangEn: string;
    serviceLangBilingual: string;
    serviceLangOther: string;
    reset: string;
  };
  cards: {
    badgeRecommended: string;
    badgeSpecial: string;
    badgePartner: string;
    sourceAffiliate: string;
    sourceBusiness: string;
    sourceIdeas: string;
    partnerInventory: string;
    businessListing: string;
    viewOffer: string;
    explore: string;
    viewOffers: string;
    affiliateCta: string;
    businessViewListing: string;
    businessMoreDetails: string;
    readFree: string;
  };
  offerDetail: {
    previewBanner: string;
    /** Thinner draft preview strip — feels closer to live output */
    previewBannerMinimal: string;
    exploreViajes: string;
    includes: string;
    includesSubline: string;
    whoFor: string;
    whoForSubline: string;
    metaPriceLabel: string;
    metaDurationLabel: string;
    metaDepartureLabel: string;
    metaDatesLabel: string;
    valueFraming: string;
    partnerCommercial: string;
    postedBy: string;
    privatePostedBy: string;
    identityBadgeAffiliate: string;
    identityBadgeBusiness: string;
    identityBadgePrivate: string;
    affiliateFallback: string;
    businessFallback: string;
    privateFallback: string;
    detailsTitle: string;
    calendar: string;
    trustIntegratedTitle: string;
    contactChannelsHeading: string;
    affiliateIdentityKicker: string;
    affiliateReferralHint: string;
    businessIdentityKicker: string;
    businessOperatorHint: string;
    valueAccentResort: string;
    valueAccentCar: string;
    valueAccentItinerary: string;
    valueAccentDefault: string;
    /** When primary CTA has no resolvable target (shown instead of a dead link) */
    mainCtaUnavailableHint: string;
  };
  negocio: {
    back: string;
    verifiedSoon: string;
    languages: string;
    about: string;
    contact: string;
    website: string;
    featuredOffers: string;
    trustTitle: string;
    trustBody: string;
  };
  trustStrip: string;
  /** Short bullets for landing reassurance row (ES/EN). */
  trustLandingPoints: string[];
  /** Short “why this exists” line for reviewers (screenshots / trust). */
  trustWhy: {
    title: string;
    body: string;
  };
  trustFooter: {
    aboutViajes: string;
    aboutBody: string;
    contact: string;
    privacy: string;
    terms: string;
  };
  /** Lower-page band encouraging businesses to publish travel offers */
  publishCtaBand: {
    title: string;
    body: string;
    cta: string;
    /** Subline reinforcing visibility / category presence (no hype) */
    reinforcement: string;
  };
  legal: { privacy: string; terms: string };
  /** Offer detail / return navigation */
  backToResults: string;
  backToViajesHome: string;
  previewBackToApplication: string;
};

function es(): Omit<ViajesUi, "lang"> {
  return {
    breadcrumbClassifieds: "Clasificados",
    categoryViajes: "Viajes",
    postListing: "Publicar",
    exploreByTripType: "Explora por tipo de viaje",
    searchShortcutsLabel: "O elige un atajo de categoría (mismos filtros)",
    heroPrimaryCue: "Empieza aquí",
    landing: {
      tier1Eyebrow: "Descubrir ahora",
      tier2Eyebrow: "Explorar más",
      tier3Eyebrow: "Ideas, temporada y confianza",
      trustTransitionBreak: "Transparencia y publicación",
      browseAllTrips: "Ver todos los viajes en resultados →",
      advertiserPresenceLine: "Perfiles con ficha en Leonix: visibilidad frente a quien ya busca viajar, con origen del listado siempre visible.",
    },
    heroTitle: "Tu próximo viaje empieza con una búsqueda",
    heroSubtitle:
      "Ofertas de socios, paquetes de agencias e ideas editoriales — todo etiquetado. Usa el buscador y luego explora; el desplazamiento es opcional.",
    search: {
      whereTo: "¿A dónde quieres ir?",
      departureFrom: "Salida desde",
      anyOrigin: "Cualquier origen",
      tripType: "Tipo de viaje",
      budget: "Presupuesto",
      budgetFlexible: "Flexible",
      budgetEconomy: "Económico",
      budgetModerate: "Moderado",
      budgetPremium: "Premium",
      exploreCta: "Explorar viajes",
      useMyLocation: "📍 Usar mi ubicación",
      locationRequesting: "…",
      departureAria: "Ciudad o aeropuerto de salida",
      geoReady: (originLabel, airportLine) => `Origen por ubicación: ${originLabel} (${airportLine})`,
      geoDenied: "Permiso denegado: no leemos tu ubicación. Elige un origen manualmente.",
      geoUnavailable: "No se pudo obtener la ubicación en este momento (señal no disponible). Elige un origen manualmente.",
      geoTimeout: "Tiempo agotado al pedir ubicación. Elige un origen manualmente o vuelve a intentar.",
      destPlaceholder: "Playa, ciudad, país…",
      moduleTitle: "Buscar viajes",
      moduleHint: "Ajusta destino, salida, tipo y presupuesto; el botón naranja abre resultados al instante.",
      geoExplainer:
        "“Usar mi ubicación” pide permiso al navegador una sola vez para sugerir la salida (SFO / SJC / OAK) más cercana. No guardamos tu ruta ni te rastreamos; si niegas el permiso, puedes elegir la salida manualmente.",
      searchScopeNote:
        "Búsqueda por destino en texto y salida por región/aeropuerto (SFO, SJC, OAK). Código postal, radio en millas y “cerca” como filtro geográfico fino no están en esta versión.",
    },
    carousel: { prev: "Ver categorías anteriores", next: "Ver categorías siguientes" },
    topOffers: {
      title: "Ofertas destacadas ahora",
      subtitle:
        "Listados de viajes aprobados en Leonix (negocio o particular). En producción no se mezclan anuncios de demostración salvo que actives NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1 en el despliegue.",
      emptyTitle: "Aún no hay ofertas destacadas",
      emptyBody: "Publica tu viaje; cuando sea aprobado aparecerá aquí y en resultados. Los visitantes siguen pudiendo explorar con el buscador y los atajos de destino.",
    },
    localDepartures: {
      title: "Salidas cerca de ti",
      subtitle: "Atajos por aeropuerto o escapadas regionales — mismos filtros que arriba, ya aplicados.",
      cta: "Ver ofertas",
      byId: {
        sjo: { title: "Desde San José", description: "Escapadas a México, Caribe y ciudades de conexión desde SJO." },
        sfo: { title: "Desde San Francisco", description: "Vuelos directos y paquetes con salida desde la Bahía." },
        oak: { title: "Desde Oakland", description: "Opciones cercanas al Este de la Bahía con buen valor." },
        near: { title: "Escapadas cerca de ti", description: "Fin de semana, playa, montaña y viñedos sin ir tan lejos." },
      },
    },
    destinations: {
      title: "Destinos para explorar",
      subtitle: "Colecciones temáticas: un clic y sigues en resultados con ese destino.",
      cta: "Ver ofertas",
      byId: {
        "cancun-col": { supportingLine: "Playas, arrecifes y vida nocturna con paquetes curados." },
        cr: { supportingLine: "Bosque nuboso, canopy y playas del Pacífico." },
        sc: { supportingLine: "Costa Norte de California: surf, senderos y gastronomía." },
        yosemite: { supportingLine: "Naturaleza icónica con estancias y tours guiados." },
      },
    },
    audience: {
      title: "Elige por tipo de viaje",
      subtitle: "Familia, pareja, grupo o romance — resultados alineados a tu intención.",
      byId: {
        families: {
          label: "Para familias",
          subline: "Hoteles con actividades, traslados sencillos y ritmo relajado.",
        },
        couples: {
          label: "Para parejas",
          subline: "Boutique, cenas y experiencias íntimas frente al mar.",
        },
        groups: {
          label: "Para grupos",
          subline: "Villas, cruceros y paquetes con tarifas por habitación múltiple.",
        },
        romantic: {
          label: "Escapadas románticas",
          subline: "Spa, vistas y detalles para una escapada inolvidable.",
        },
      },
    },
    lower: {
      partnersTitle: "Operadores y agencias en Leonix",
      partnersSubtitle: "Fichas de negocio: especialidad y contacto visibles. La reserva no pasa por Leonix.",
      businessPublished: "Negocio publicado",
      verified: "Verificado",
      viewProfile: "Ver perfil →",
      editorialTitle: "Guías e inspiración de viaje",
      editorialSubtitle: "Lectura e ideas — no es un listado transaccional; sirve para afinar tu búsqueda.",
      editorialPill: "Editorial",
      readTime: (n) => `${n} de lectura`,
      seasonalTitle: "Campañas y promos de temporada",
      seasonalSubtitle: "Listados agrupados por campaña: socios (sigue al socio) o negocio (contacto directo).",
      sourcePartner: "Socio comercial",
      sourceBusiness: "Negocio",
    },
    tripTypes: {
      all: "Todos",
      weekend: "Escapadas de fin de semana",
      day: "Viajes de un día",
      resorts: "Resorts / todo incluido",
      hotels: "Hoteles / estadías",
      tours: "Tours y excursiones",
      activities: "Actividades en destino",
      cruises: "Cruceros",
      carRental: "Renta de autos",
      transport: "Transporte / traslados",
      lastMinute: "Último minuto",
      budgetDeals: "Ofertas por presupuesto",
      nearYou: "Cerca de ti",
    },
    categoryPills: {
      weekend: "Escapadas de fin de semana",
      day: "Viajes de un día",
      resorts: "Resorts todo incluido",
      hoteles: "Hoteles / estadías",
      tours: "Tours y excursiones",
      actividades: "Actividades en destino",
      cruises: "Cruceros",
      "renta-autos": "Renta de autos",
      transporte: "Transporte / traslados",
      "ultimo-minuto": "Último minuto",
      family: "Viajes familiares",
      romantic: "Viajes románticos",
      sjo: "Salidas desde San José (SJC)",
      budget: "Ofertas por presupuesto",
    },
    results: {
      breadcrumbResults: "Resultados",
      title: "Descubre viajes",
      subtitle: "Mezcla de ofertas de socios y agencias locales — las etiquetas indican el origen.",
      resultsWord: "resultados",
      post: "Publicar",
      viajesHome: "Inicio Viajes",
      destination: "Destino",
      departureCity: "Ciudad de salida",
      datesSeason: "Fechas / temporada",
      tripType: "Tipo de viaje",
      budget: "Presupuesto",
      audience: "Público",
      sort: "Orden",
      sortFeatured: "Destacado",
      sortNewest: "Más recientes",
      sortPriceAsc: "Precio ↑",
      sortPriceDesc: "Precio ↓",
      destPlaceholder: "Ciudad, país…",
      any: "Cualquiera",
      flexible: "Flexible",
      spring: "Primavera",
      summer: "Verano",
      fall: "Otoño",
      winter: "Invierno",
      holidays: "Festividades",
      economy: "Económico",
      moderate: "Moderado",
      premium: "Premium",
      audienceAll: "Todos",
      audienceFamilies: "Familias",
      audienceCouples: "Parejas",
      audienceGroups: "Grupos",
      refine: "Refinar",
      filters: "Filtros",
      close: "Cerrar",
      filtersDialog: "Filtros",
      closeOverlay: "Cerrar",
      noResults: "Sin resultados con estos filtros.",
      departurePrefix: "salida",
      activeSearchLabel: "Criterios activos",
      emptyRecoveryHint: "Prueba quitar un filtro o explora las sugerencias abajo.",
      discoveryStripTitle: "Sigue explorando",
      discoveryStripSubtitle: "Atajos relacionados con tu búsqueda — mismos parámetros que el buscador.",
      discoveryClearDestination: "Ampliar: quitar destino",
      discoveryLastMinuteFromCurrent: "Último minuto (misma salida)",
      discoveryLastMinute: "Último minuto",
      discoveryFamilies: "Tours en familia",
      discoveryWeekend: "Fin de semana · salida SFO",
      inventoryDemoBanner:
        "Modo demostración: se están mezclando filas de ejemplo con las aprobadas. En producción, sin NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1, solo ves anuncios reales aprobados. Ocultar por completo: NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED=1.",
      departureFieldNote: "Salida por hub regional (Bahía / SJC), no por código postal.",
    },
    filterRail: {
      destination: "Destino",
      destPlaceholder: "Ciudad o país",
      departureCity: "Ciudad de salida",
      budget: "Presupuesto",
      tripType: "Tipo de viaje",
      duration: "Duración",
      durationAny: "Cualquiera",
      durationShort: "1–4 noches",
      durationWeek: "5–7 noches",
      durationLong: "8+ noches",
      audience: "Público",
      season: "Fechas / temporada",
      serviceLanguage: "Idioma del servicio / guía",
      serviceLangAny: "Cualquiera",
      serviceLangEs: "Español",
      serviceLangEn: "Inglés",
      serviceLangBilingual: "Bilingüe",
      serviceLangOther: "Otro / no indicado",
      reset: "Limpiar filtros",
    },
    cards: {
      badgeRecommended: "Recomendado",
      badgeSpecial: "Oferta especial",
      badgePartner: "Socio de viaje",
      sourceAffiliate: "Socio comercial",
      sourceBusiness: "Negocio",
      sourceIdeas: "Ideas",
      partnerInventory: "Inventario de socio",
      businessListing: "Anuncio de negocio",
      viewOffer: "Ver oferta",
      explore: "Explorar",
      viewOffers: "Ver ofertas",
      affiliateCta: "Ver oferta con socio",
      businessViewListing: "Ver ficha publicada",
      businessMoreDetails: "Más detalles",
      readFree: "Lectura gratuita",
    },
    offerDetail: {
      previewBanner: "Vista previa — así verán tu oferta en Clasificados (datos de borrador / ejemplo).",
      previewBannerMinimal: "Vista previa · borrador local — misma ficha que verás al publicar.",
      exploreViajes: "Explorar Viajes",
      includes: "Qué incluye",
      includesSubline: "Valor real: lo que suele venir en esta oferta. Confirma siempre con el socio o el negocio.",
      whoFor: "¿Para quién es?",
      whoForSubline: "Señales de viaje para acertar con tu grupo.",
      metaPriceLabel: "Precio",
      metaDurationLabel: "Duración",
      metaDepartureLabel: "Salida",
      metaDatesLabel: "Fechas",
      valueFraming: "Desde",
      partnerCommercial: "Socio comercial",
      postedBy: "Publicado por",
      privatePostedBy: "Particular",
      identityBadgeAffiliate: "Inventario de socio",
      identityBadgeBusiness: "Negocio en Leonix",
      identityBadgePrivate: "Particular",
      affiliateFallback:
        "Oferta de un socio comercial: al continuar sueles salir de Leonix para completar la reserva o el pago. Leonix no actúa como vendedor final.",
      businessFallback:
        "Anuncio de negocio o agencia en Leonix Clasificados — contacto directo; Leonix no procesa la reserva por ti.",
      privateFallback:
        "Anuncio particular en Leonix Clasificados — Leonix no verifica identidad ni cobra por ti. Confirma disponibilidad y condiciones directamente con el anunciante.",
      detailsTitle: "Detalles del viaje",
      calendar: "Calendario:",
      trustIntegratedTitle: "Confianza y detalles",
      contactChannelsHeading: "Canales de contacto",
      affiliateIdentityKicker: "Socio comercial",
      affiliateReferralHint:
        "Leonix te acerca a esta oferta; la reserva o el pago suelen completarse en el sitio del socio.",
      businessIdentityKicker: "Operador o agencia",
      businessOperatorHint: "Contacto directo con el negocio — Leonix no procesa cobros ni reservas aquí.",
      valueAccentResort: "Enfoque en estadía e inclusiones — confirma impuestos y políticas con quien publica.",
      valueAccentCar: "Movilidad y tarifas — verifica kilometraje, seguros y depósitos antes de reservar.",
      valueAccentItinerary: "Itinerario y soporte del operador — ajusta fechas y logística según disponibilidad.",
      valueAccentDefault: "Revisa condiciones, fechas límite y métodos de pago directamente con quien publica.",
      mainCtaUnavailableHint:
        "Sin enlace de contacto válido aún — revisa WhatsApp, teléfono, correo o sitio web en tu solicitud (o usa los canales secundarios abajo si los añadiste).",
    },
    negocio: {
      back: "Volver a Viajes",
      verifiedSoon: "Verificado (próximamente)",
      languages: "Idiomas:",
      about: "Sobre el negocio",
      contact: "Contacto",
      website: "Sitio web",
      featuredOffers: "Ofertas destacadas",
      trustTitle: "Confianza",
      trustBody:
        "Pronto: reseñas verificadas, años en operación y documentos de registro. Mientras tanto, confirma identidad del negocio antes de pagar adelantos.",
    },
    trustStrip:
      "Leonix Viajes reúne inventario de socios, anuncios de agencias/operadores y contenido editorial. No somos el vendedor final: con socios sueles salir a su web; con negocios, hablas con ellos.",
    trustLandingPoints: [
      "Origen visible en cada listado",
      "Socios: reserva suele completarse fuera de Leonix",
      "Negocios: contacto directo; Leonix no cobra la reserva aquí",
    ],
    trustWhy: {
      title: "Por qué Leonix Viajes",
      body: "Vitrina con etiquetas de origen: socios (sigue al sitio del socio), negocios (contacto en Leonix), editorial (inspiración). Leonix no es la agencia de reservas.",
    },
    trustFooter: {
      aboutViajes: "Sobre Viajes",
      aboutBody:
        "Explora escapadas, resorts y tours con salidas desde tu zona. Verás inventario de socios comerciales (enlaces externos), negocios con ficha en Leonix y contenido editorial — siempre con el origen visible.",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
    },
    publishCtaBand: {
      title: "¿Ofreces paquetes o viajes organizados?",
      body: "Publica en Viajes: lectores que ya exploran salidas y destinos. Tú defines contacto y condiciones en tu anuncio o ficha.",
      cta: "Publicar en Viajes",
      reinforcement: "Presencia en la vertical de viajes dentro de Clasificados, con etiquetado claro y descubrimiento directo.",
    },
    legal: {
      privacy: "Política de privacidad",
      terms: "Términos de uso",
    },
    backToResults: "Volver a resultados",
    backToViajesHome: "Volver a Viajes",
    previewBackToApplication: "Volver a la solicitud",
  };
}

function en(): Omit<ViajesUi, "lang"> {
  return {
    breadcrumbClassifieds: "Classifieds",
    categoryViajes: "Viajes",
    postListing: "Post a listing",
    exploreByTripType: "Explore by trip type",
    searchShortcutsLabel: "Or jump to a category shortcut (same filters)",
    heroPrimaryCue: "Start here",
    landing: {
      tier1Eyebrow: "Start here",
      tier2Eyebrow: "Keep exploring",
      tier3Eyebrow: "Ideas, seasonality, and trust",
      trustTransitionBreak: "Transparency & publishing",
      browseAllTrips: "Browse all trips in results →",
      advertiserPresenceLine:
        "Leonix profiles put you in front of people already planning trips — with clear source labeling on every listing.",
    },
    heroTitle: "Your next trip starts with a search",
    heroSubtitle:
      "Partner offers, agency packages, and editorial picks — all labeled. Search first; scrolling is optional.",
    search: {
      whereTo: "Where do you want to go?",
      departureFrom: "Departing from",
      anyOrigin: "Any origin",
      tripType: "Trip type",
      budget: "Budget",
      budgetFlexible: "Flexible",
      budgetEconomy: "Economy",
      budgetModerate: "Moderate",
      budgetPremium: "Premium",
      exploreCta: "Explore trips",
      useMyLocation: "📍 Use my location",
      locationRequesting: "…",
      departureAria: "Departure city or airport",
      geoReady: (originLabel, airportLine) => `Location-based origin: ${originLabel} (${airportLine})`,
      geoDenied: "Permission denied — we don’t read your location. Please choose an origin manually.",
      geoUnavailable: "We couldn’t get a location fix right now. Please choose an origin manually.",
      geoTimeout: "Location request timed out. Choose an origin manually or try again.",
      destPlaceholder: "Beach, city, country…",
      moduleTitle: "Search trips",
      moduleHint: "Set destination, departure, trip type, and budget; the orange button opens results instantly.",
      geoExplainer:
        "“Use my location” asks your browser once to suggest the nearest departure hub (SFO / SJC / OAK). We don’t store your path or track you; if you deny permission, pick a departure manually.",
      searchScopeNote:
        "Search uses destination text and hub-based departure (SFO, SJC, OAK). Postal code, mile radius, and fine-grained “near me” filtering are not in this release.",
    },
    carousel: { prev: "Show previous categories", next: "Show next categories" },
    topOffers: {
      title: "Featured offers right now",
      subtitle:
        "Leonix-approved trip listings (business or private). Production does not mix demo/sample rows unless the deployment sets NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1.",
      emptyTitle: "No featured offers yet",
      emptyBody: "Publish your trip; once approved it appears here and in results. Visitors can still search and use destination shortcuts.",
    },
    localDepartures: {
      title: "Departures near you",
      subtitle: "Airport and regional shortcuts — same filters as above, pre-applied.",
      cta: "View offers",
      byId: {
        sjo: { title: "From San José", description: "Getaways to Mexico, the Caribbean, and connecting hubs from SJO." },
        sfo: { title: "From San Francisco", description: "Direct flights and packages departing the Bay Area." },
        oak: { title: "From Oakland", description: "Great-value options near the East Bay." },
        near: { title: "Weekend trips nearby", description: "Beach, mountains, and wine country without going far." },
      },
    },
    destinations: {
      title: "Destinations to explore",
      subtitle: "Themed collections — one tap and you’re in filtered results for that place.",
      cta: "View offers",
      byId: {
        "cancun-col": { supportingLine: "Beaches, reefs, and nightlife with curated packages." },
        cr: { supportingLine: "Cloud forest, canopy, and Pacific beaches." },
        sc: { supportingLine: "Northern California coast: surf, trails, and food." },
        yosemite: { supportingLine: "Iconic nature with stays and guided tours." },
      },
    },
    audience: {
      title: "Trips for every plan",
      subtitle: "Filter by intent — family, couple, group, or romance.",
      byId: {
        families: {
          label: "For families",
          subline: "Kid-friendly hotels, simple transfers, and a relaxed pace.",
        },
        couples: {
          label: "For couples",
          subline: "Boutique stays, dinners, and intimate oceanfront experiences.",
        },
        groups: {
          label: "For groups",
          subline: "Villas, cruises, and multi-room packages.",
        },
        romantic: {
          label: "Romantic escapes",
          subline: "Spa, views, and thoughtful details for a memorable trip.",
        },
      },
    },
    lower: {
      partnersTitle: "Operators & agencies on Leonix",
      partnersSubtitle: "Business profiles: specialties and contact on the record. Booking doesn’t run through Leonix.",
      businessPublished: "Business listing",
      verified: "Verified",
      viewProfile: "View profile →",
      editorialTitle: "Travel guides & inspiration",
      editorialSubtitle: "Editorial reading — not a transactional listing; use it to refine what you search for next.",
      editorialPill: "Editorial",
      readTime: (n) => `${n} read`,
      seasonalTitle: "Seasonal promos & campaigns",
      seasonalSubtitle: "Grouped by campaign: partners (often continue off-site) or businesses (direct contact).",
      sourcePartner: "Commercial partner",
      sourceBusiness: "Business",
    },
    tripTypes: {
      all: "All",
      weekend: "Weekend getaways",
      day: "Day trips",
      resorts: "Resorts / all-inclusive",
      hotels: "Hotels / stays",
      tours: "Tours & excursions",
      activities: "On-destination activities",
      cruises: "Cruises",
      carRental: "Car rental",
      transport: "Transport / transfers",
      lastMinute: "Last minute",
      budgetDeals: "Budget-friendly deals",
      nearYou: "Near you",
    },
    categoryPills: {
      weekend: "Weekend getaways",
      day: "Day trips",
      resorts: "All-inclusive resorts",
      hoteles: "Hotels / stays",
      tours: "Tours & excursions",
      actividades: "On-destination activities",
      cruises: "Cruises",
      "renta-autos": "Car rental",
      transporte: "Transport / transfers",
      "ultimo-minuto": "Last minute",
      family: "Family trips",
      romantic: "Romantic trips",
      sjo: "Departures from San José (SJC)",
      budget: "Budget-friendly deals",
    },
    results: {
      breadcrumbResults: "Results",
      title: "Discover trips",
      subtitle: "A mix of partner offers and local agencies — labels show the source.",
      resultsWord: "results",
      post: "Post",
      viajesHome: "Viajes home",
      destination: "Destination",
      departureCity: "Departure city",
      datesSeason: "Dates / season",
      tripType: "Trip type",
      budget: "Budget",
      audience: "Audience",
      sort: "Sort",
      sortFeatured: "Featured",
      sortNewest: "Newest",
      sortPriceAsc: "Price ↑",
      sortPriceDesc: "Price ↓",
      destPlaceholder: "City, country…",
      any: "Any",
      flexible: "Flexible",
      spring: "Spring",
      summer: "Summer",
      fall: "Fall",
      winter: "Winter",
      holidays: "Holidays",
      economy: "Economy",
      moderate: "Moderate",
      premium: "Premium",
      audienceAll: "All",
      audienceFamilies: "Families",
      audienceCouples: "Couples",
      audienceGroups: "Groups",
      refine: "Refine",
      filters: "Filters",
      close: "Close",
      filtersDialog: "Filters",
      closeOverlay: "Close",
      noResults: "No results for these filters.",
      departurePrefix: "from",
      activeSearchLabel: "Active criteria",
      emptyRecoveryHint: "Try removing a filter or use the suggestions below.",
      discoveryStripTitle: "Keep exploring",
      discoveryStripSubtitle: "Shortcuts related to your search — same parameters as the search bar.",
      discoveryClearDestination: "Broaden: clear destination",
      discoveryLastMinuteFromCurrent: "Last minute (same departure)",
      discoveryLastMinute: "Last minute",
      discoveryFamilies: "Family tours",
      discoveryWeekend: "Weekend · depart SFO",
      inventoryDemoBanner:
        "Demo mode: sample rows are merged with approved listings. In production, without NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1, only real approved ads are shown. To hide all samples: NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED=1.",
      departureFieldNote: "Departure is a regional hub (Bay Area / SJC), not postal-code search.",
    },
    filterRail: {
      destination: "Destination",
      destPlaceholder: "City or country",
      departureCity: "Departure city",
      budget: "Budget",
      tripType: "Trip type",
      duration: "Duration",
      durationAny: "Any",
      durationShort: "1–4 nights",
      durationWeek: "5–7 nights",
      durationLong: "8+ nights",
      audience: "Audience",
      season: "Dates / season",
      serviceLanguage: "Service / guide language",
      serviceLangAny: "Any",
      serviceLangEs: "Spanish",
      serviceLangEn: "English",
      serviceLangBilingual: "Bilingual",
      serviceLangOther: "Other / unspecified",
      reset: "Clear filters",
    },
    cards: {
      badgeRecommended: "Featured",
      badgeSpecial: "Special offer",
      badgePartner: "Travel partner",
      sourceAffiliate: "Commercial partner",
      sourceBusiness: "Business",
      sourceIdeas: "Ideas",
      partnerInventory: "Partner inventory",
      businessListing: "Business listing",
      viewOffer: "View offer",
      explore: "Explore",
      viewOffers: "View offers",
      affiliateCta: "View partner offer",
      businessViewListing: "View listing",
      businessMoreDetails: "More details",
      readFree: "Free to read",
    },
    offerDetail: {
      previewBanner: "Preview — this is how your offer will appear in Classifieds (sample / draft data).",
      previewBannerMinimal: "Preview · local draft — same layout as the live listing.",
      exploreViajes: "Explore Viajes",
      includes: "What’s included",
      includesSubline: "Real value: what this offer typically covers. Always confirm with the partner or business.",
      whoFor: "Who it’s for",
      whoForSubline: "Travel intent signals to match your group.",
      metaPriceLabel: "Price",
      metaDurationLabel: "Duration",
      metaDepartureLabel: "Departure",
      metaDatesLabel: "Dates",
      valueFraming: "From",
      partnerCommercial: "Commercial partner",
      postedBy: "Posted by",
      privatePostedBy: "Private seller",
      identityBadgeAffiliate: "Partner inventory",
      identityBadgeBusiness: "Business on Leonix",
      identityBadgePrivate: "Private seller",
      affiliateFallback:
        "Commercial partner offer: continuing usually takes you off Leonix to complete booking or payment. Leonix is not the final seller.",
      businessFallback:
        "Business or agency listing on Leonix Classifieds — direct contact; Leonix does not process the booking for you.",
      privateFallback:
        "Private individual listing on Leonix Classifieds — Leonix does not verify identity or collect payment for you. Confirm availability and terms directly with the seller.",
      detailsTitle: "Trip details",
      calendar: "Dates:",
      trustIntegratedTitle: "Trust & details",
      contactChannelsHeading: "Contact channels",
      affiliateIdentityKicker: "Commercial partner",
      affiliateReferralHint:
        "Leonix connects you to this offer; booking or payment usually happens on the partner’s site.",
      businessIdentityKicker: "Operator or agency",
      businessOperatorHint: "Direct contact with the business — Leonix does not process payments or bookings here.",
      valueAccentResort: "Stay-focused — confirm taxes, resort fees, and policies with the publisher.",
      valueAccentCar: "Mobility and rates — verify mileage, insurance, and deposits before you book.",
      valueAccentItinerary: "Itinerary and operator support — align dates and logistics with availability.",
      valueAccentDefault: "Review terms, blackout dates, and payment methods directly with whoever published the offer.",
      mainCtaUnavailableHint:
        "No valid contact link yet — check WhatsApp, phone, email, or website in your listing (or use secondary channels below if you added them).",
    },
    negocio: {
      back: "Back to Viajes",
      verifiedSoon: "Verified (coming soon)",
      languages: "Languages:",
      about: "About the business",
      contact: "Contact",
      website: "Website",
      featuredOffers: "Featured offers",
      trustTitle: "Trust",
      trustBody:
        "Coming soon: verified reviews, years in business, and registration documents. Until then, confirm the business identity before paying deposits.",
    },
    trustStrip:
      "Leonix Viajes brings together partner inventory, agency/operator listings, and editorial content. We’re not the final seller: partners usually take you to their site; businesses are contacted directly.",
    trustLandingPoints: [
      "Source is visible on every listing",
      "Partners: booking usually finishes off Leonix",
      "Businesses: direct contact; Leonix doesn’t collect payment here",
    ],
    trustWhy: {
      title: "Why Leonix Viajes",
      body: "A labeled marketplace: partners (continue on the partner site), businesses (contact on Leonix), editorial (inspiration). Leonix isn’t your booking agency.",
    },
    trustFooter: {
      aboutViajes: "About Viajes",
      aboutBody:
        "Explore getaways, resorts, and tours near you. You’ll see partner inventory (external links), businesses with a Leonix profile, and editorial content — the source is always labeled.",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
    },
    publishCtaBand: {
      title: "Do you sell packages or organized trips?",
      body: "Publish in Viajes: readers are already browsing departures and destinations. You set contact paths and terms on your listing or profile.",
      cta: "Publish in Viajes",
      reinforcement: "Category presence inside Classifieds — clear labeling and direct discovery.",
    },
    legal: {
      privacy: "Privacy policy",
      terms: "Terms of use",
    },
    backToResults: "Back to results",
    backToViajesHome: "Back to Viajes",
    previewBackToApplication: "Back to application",
  };
}

export function getViajesUi(lang: Lang): ViajesUi {
  const base = lang === "en" ? en() : es();
  return { lang, ...base };
}

export function viajesBadgeLabel(badge: string, ui: ViajesUi): string {
  if (badge === "Recomendado") return ui.cards.badgeRecommended;
  if (badge === "Oferta especial") return ui.cards.badgeSpecial;
  if (badge === "Socio de viaje") return ui.cards.badgePartner;
  return badge;
}
