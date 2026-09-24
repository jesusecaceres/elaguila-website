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
  /** Hero CTA row: primary explores results, secondary opens the publisher */
  heroCtaExplore: string;
  heroCtaPublish: string;
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
  nearbyEscapes: {
    title: string;
    subtitle: string;
    cta: string;
    byId: Record<string, { title: string; subline: string }>;
  };
  staySection: {
    title: string;
    subtitle: string;
    cta: string;
    hotels: { title: string; subline: string };
    rentals: { title: string; subline: string };
  };
  mobilitySection: {
    title: string;
    subtitle: string;
    cta: string;
    byId: Record<string, { title: string; subline: string }>;
  };
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
    /** Discovery trio (exact, results footer) */
    discoveryNearYou: string;
    discoveryFamilyTrips: string;
    discoveryGuidesInspiration: string;
    /** Shown when public rows are still demo/sample-backed */
    inventoryDemoBanner: string;
    /** Clarifies departure is hub/region — not postal code search */
    departureFieldNote: string;
    /** Compact results header (Prompt 2) */
    compactTitle: string;
    compactSubtitle: string;
    sortLabel: (value: string) => string;
    viewGrid: string;
    viewList: string;
    loadMore: string;
    activeFiltersTitle: string;
    clearFilters: string;
    providerRailTitle: string;
    providerRailCta: string;
    breadcrumbViajes: string;
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
    /** Leonix-tracked inquiry on published staged listings (business/private). */
    inquiry: {
      title: string;
      subline: string;
      nameLabel: string;
      emailLabel: string;
      messageLabel: string;
      submit: string;
      sending: string;
      success: string;
      errGeneric: string;
      errMissingIdentity: string;
      signedInHint: string;
    };
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
    heroTitle: "Tu próxima escapada comienza aquí",
    heroSubtitle: "Descubre viajes, experiencias y negocios que te ayudan a planear algo inolvidable.",
    heroCtaExplore: "Explorar viajes",
    heroCtaPublish: "Publicar un viaje",
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
      exploreCta: "Buscar",
      useMyLocation: "Usar mi ubicación",
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
      title: "Destacados esta semana",
      subtitle: "Ofertas destacadas con salida desde tu zona — negocio local o socio, siempre etiquetado.",
      emptyTitle: "Aún no hay ofertas destacadas",
      emptyBody: "Publica tu viaje; cuando sea aprobado aparecerá aquí y en resultados. Los visitantes siguen pudiendo explorar con el buscador y los atajos de destino.",
    },
    localDepartures: {
      title: "Saliendo desde tu área",
      subtitle: "Atajos por aeropuerto o escapadas regionales — mismos filtros que arriba, ya aplicados.",
      cta: "Ver opciones",
      byId: {
        sjc: { title: "Desde San José, CA", description: "Salidas desde el Valle de Silicio (SJC) hacia la costa, Sierra y el resto de California." },
        sfo: { title: "Desde San Francisco", description: "Vuelos directos y paquetes con salida desde la Bahía." },
        oak: { title: "Desde Oakland", description: "Opciones cercanas al Este de la Bahía con buen valor." },
        near: { title: "Cerca de ti", description: "Fin de semana, playa, montaña y viñedos sin ir tan lejos." },
      },
    },
    nearbyEscapes: {
      title: "Escapadas y experiencias cerca de ti",
      subtitle: "Ideas a poca distancia de la Bahía — un clic y sigues en resultados.",
      cta: "Explorar",
      byId: {
        napa: { title: "Valle de Napa", subline: "Viñedos, spas y estadías boutique a menos de dos horas." },
        "santa-cruz": { title: "Santa Cruz", subline: "Playa, malecón y surf en la Costa Norte de California." },
        "salidas-de-un-dia": { title: "Salidas de un día", subline: "Ida y vuelta el mismo día — sin pernoctar." },
        "diversion-en-familia": { title: "Diversión en familia", subline: "Planes con ritmo relajado para todas las edades." },
        "descubre-mas": { title: "Descubre más", subline: "Ver el catálogo completo de escapadas regionales." },
      },
    },
    staySection: {
      title: "Dónde hospedarte",
      subtitle: "Dos formas de hospedarte: hotel con servicios o espacio propio para el grupo.",
      cta: "Ver opciones",
      hotels: { title: "Hoteles y resorts", subline: "Todo incluido, boutique y cadenas — con servicio en sitio." },
      rentals: { title: "Rentas vacacionales", subline: "Casas y condos con cocina y espacio para grupos o familias." },
    },
    mobilitySection: {
      title: "Muévete durante tu viaje",
      subtitle: "De la llegada al hospedaje y de ahí a donde quieras — opciones de movilidad.",
      cta: "Ver opciones",
      byId: {
        "autos-de-renta": { title: "Autos de renta", subline: "Recogida en aeropuerto o ciudad; compara categorías de vehículo." },
        "traslados-al-aeropuerto": { title: "Traslados al aeropuerto", subline: "Vehículo privado o compartido hacia tu hospedaje." },
        "vans-para-grupos": { title: "Vans para grupos", subline: "Transporte para grupos grandes o familias numerosas." },
        "conductores-privados": { title: "Conductores privados", subline: "Servicio con chofer para el día o el itinerario completo." },
      },
    },
    destinations: {
      title: "Explora destinos",
      subtitle: "Colecciones temáticas: un clic y sigues en resultados con ese destino.",
      cta: "Ver ofertas",
      byId: {
        napa: { supportingLine: "Viñedos y spas a poca distancia de la Bahía." },
        monterey: { supportingLine: "Acuario, costa y sabor del Pacífico." },
        "big-sur": { supportingLine: "Acantilados y carretera escénica." },
        tahoe: { supportingLine: "Lago, montaña y escapadas de temporada." },
        yosemite: { supportingLine: "Naturaleza icónica con estancias y tours guiados." },
        "santa-cruz": { supportingLine: "Playa, malecón y surf en la Costa Norte." },
      },
    },
    audience: {
      title: "Viajes para cada plan",
      subtitle: "Familia, pareja, grupo o aventura — resultados alineados a tu intención.",
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
        adventure: {
          label: "Aventura",
          subline: "Naturaleza, actividades al aire libre y ritmo activo.",
        },
      },
    },
    lower: {
      partnersTitle: "Conoce negocios de viajes",
      partnersSubtitle: "Fichas de negocio: especialidad y contacto visibles. La reserva no pasa por Leonix.",
      businessPublished: "Negocio publicado",
      verified: "Verificado",
      viewProfile: "Ver perfil y ofertas",
      editorialTitle: "Guías e inspiración",
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
      day: "Viaje de un día",
      weekend: "Escapadas",
      resorts: "Hoteles y resorts",
      hoteles: "Rentas vacacionales",
      cruises: "Cruceros",
      transporte: "Autos y traslados",
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
      sortFeatured: "Relevancia",
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
      discoveryNearYou: "Escapadas cerca de ti",
      discoveryFamilyTrips: "Viajes para familias",
      discoveryGuidesInspiration: "Guías e inspiración",
      inventoryDemoBanner:
        "Vista de demostración: se muestran ejemplos curados junto a anuncios aprobados para que puedas explorar el diseño completo.",
      departureFieldNote: "Salida por hub regional (Bahía / SJC), no por código postal.",
      compactTitle: "Encuentra tu próxima escapada",
      compactSubtitle: "Ofertas de negocios y particulares aprobados en Leonix — el origen siempre visible.",
      sortLabel: (value) => `Ordenar: ${value}`,
      viewGrid: "Cuadrícula",
      viewList: "Lista",
      loadMore: "Ver más viajes",
      activeFiltersTitle: "Filtros activos",
      clearFilters: "Limpiar filtros",
      providerRailTitle: "Negocios que pueden ayudarte a planear",
      providerRailCta: "Ver todos los negocios",
      breadcrumbViajes: "Viajes",
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
      inquiry: {
        title: "Consulta por este anuncio (Leonix)",
        subline:
          "Tu mensaje queda registrado en Leonix para que el anunciante lo vea con contexto del listado. No sustituye acuerdos de pago ni reserva fuera de la plataforma.",
        nameLabel: "Nombre",
        emailLabel: "Correo",
        messageLabel: "Mensaje",
        submit: "Enviar consulta",
        sending: "Enviando…",
        success: "Consulta enviada. El anunciante podrá verla desde su cuenta Leonix.",
        errGeneric: "No se pudo enviar la consulta. Intenta de nuevo.",
        errMissingIdentity: "Indica nombre y un correo válido (o inicia sesión).",
        signedInHint: "Si iniciaste sesión, podemos completar tu nombre y correo desde tu perfil cuando falten.",
      },
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
    heroTitle: "Your next getaway starts here",
    heroSubtitle:
      "Discover trips, experiences, and businesses that help you plan something unforgettable.",
    heroCtaExplore: "Explore trips",
    heroCtaPublish: "Post a trip",
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
      exploreCta: "Search",
      useMyLocation: "Use my location",
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
      title: "Featured this week",
      subtitle: "Highlighted offers departing from your area — local business or partner, always labeled.",
      emptyTitle: "No featured offers yet",
      emptyBody: "Publish your trip; once approved it appears here and in results. Visitors can still search and use destination shortcuts.",
    },
    localDepartures: {
      title: "Departures near you",
      subtitle: "Airport and regional shortcuts — same filters as above, pre-applied.",
      cta: "View offers",
      byId: {
        sjc: { title: "From San José, CA", description: "Departures from Silicon Valley (SJC) to the coast, the Sierra, and the rest of California." },
        sfo: { title: "From San Francisco", description: "Direct flights and packages departing the Bay Area." },
        oak: { title: "From Oakland", description: "Great-value options near the East Bay." },
        near: { title: "Near you", description: "Beach, mountains, and wine country without going far." },
      },
    },
    nearbyEscapes: {
      title: "Escapes near you",
      subtitle: "Ideas a short drive from the Bay Area — one tap and you’re in filtered results.",
      cta: "Explore",
      byId: {
        napa: { title: "Napa Valley", subline: "Wineries, spas, and boutique stays under two hours away." },
        "santa-cruz": { title: "Santa Cruz", subline: "Beach, boardwalk, and surf on the Northern California coast." },
        "salidas-de-un-dia": { title: "Day trips", subline: "There and back in a day — no overnight needed." },
        "diversion-en-familia": { title: "Family fun", subline: "Relaxed-pace plans for every age." },
        "descubre-mas": { title: "Discover more", subline: "See the full catalog of regional getaways." },
      },
    },
    staySection: {
      title: "Where to stay",
      subtitle: "Two ways to stay: full-service hotel or your own space for the group.",
      cta: "View options",
      hotels: { title: "Hotels & resorts", subline: "All-inclusive, boutique, and chain stays with on-site service." },
      rentals: { title: "Vacation rentals", subline: "Homes and condos with a kitchen and room for groups or families." },
    },
    mobilitySection: {
      title: "Getting around",
      subtitle: "From arrival to your stay and beyond — mobility options.",
      cta: "View options",
      byId: {
        "autos-de-renta": { title: "Car rental", subline: "Airport or city pickup; compare vehicle classes." },
        "traslados-al-aeropuerto": { title: "Airport transfers", subline: "Private or shared ride to your stay." },
        "vans-para-grupos": { title: "Group vans", subline: "Transport for large groups or bigger families." },
        "conductores-privados": { title: "Private drivers", subline: "Chauffeured service for the day or full itinerary." },
      },
    },
    destinations: {
      title: "Destinations to explore",
      subtitle: "Themed collections — one tap and you’re in filtered results for that place.",
      cta: "View offers",
      byId: {
        napa: { supportingLine: "Vineyards and spas close to the Bay Area." },
        monterey: { supportingLine: "Aquarium, coastline, and Pacific flavor." },
        "big-sur": { supportingLine: "Cliffs and scenic highway drives." },
        tahoe: { supportingLine: "Lake, mountain, and seasonal getaways." },
        yosemite: { supportingLine: "Iconic nature with stays and guided tours." },
        "santa-cruz": { supportingLine: "Beach, boardwalk, and Northern California surf." },
      },
    },
    audience: {
      title: "Trips for every plan",
      subtitle: "Filter by intent — family, couple, group, or adventure.",
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
        adventure: {
          label: "Adventure",
          subline: "Outdoors, active plans, and nature-forward days.",
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
      day: "Day trip",
      weekend: "Getaways",
      resorts: "Hotels & resorts",
      hoteles: "Vacation rentals",
      cruises: "Cruises",
      transporte: "Cars & transfers",
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
      sortFeatured: "Relevance",
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
      discoveryNearYou: "Getaways near you",
      discoveryFamilyTrips: "Family trips",
      discoveryGuidesInspiration: "Guides & inspiration",
      inventoryDemoBanner:
        "Demo view: curated examples appear alongside approved listings so you can explore the full layout.",
      departureFieldNote: "Departure is a regional hub (Bay Area / SJC), not postal-code search.",
      compactTitle: "Find your next getaway",
      compactSubtitle: "Approved business and private offers on Leonix — source always visible.",
      sortLabel: (value) => `Sort: ${value}`,
      viewGrid: "Grid",
      viewList: "List",
      loadMore: "See more trips",
      activeFiltersTitle: "Active filters",
      clearFilters: "Clear filters",
      providerRailTitle: "Businesses that can help you plan",
      providerRailCta: "See all businesses",
      breadcrumbViajes: "Viajes",
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
      inquiry: {
        title: "Inquire about this listing (Leonix)",
        subline:
          "Your message is stored in Leonix so the publisher can see it with listing context. It does not replace booking or payment agreements outside the platform.",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Message",
        submit: "Send inquiry",
        sending: "Sending…",
        success: "Inquiry sent. The publisher can read it from their Leonix account.",
        errGeneric: "Could not send the inquiry. Please try again.",
        errMissingIdentity: "Add your name and a valid email (or sign in).",
        signedInHint: "If you are signed in, we can fill your name and email from your profile when they are empty.",
      },
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
