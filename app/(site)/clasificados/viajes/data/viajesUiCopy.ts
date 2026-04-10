import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** All user-facing Viajes UI strings (Spanish-first; category name stays “Viajes” in EN). */
export type ViajesUi = {
  lang: Lang;
  breadcrumbClassifieds: string;
  categoryViajes: string;
  postListing: string;
  exploreByTripType: string;
  heroTitle: string;
  heroSubtitle: string;
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
    destPlaceholder: string;
  };
  carousel: { prev: string; next: string };
  topOffers: { title: string; subtitle: string };
  localDepartures: { title: string; cta: string; byId: Record<string, { title: string; description: string }> };
  destinations: { title: string; cta: string; byId: Record<string, { supportingLine: string }> };
  audience: { title: string; byId: Record<string, { label: string; subline: string }> };
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
    heroTitle: "Escapadas, resorts, tours y ofertas para tu próxima aventura",
    heroSubtitle:
      "En Leonix Clasificados, Viajes reúne escapadas visuales y ofertas curadas: inventario de socios comerciales, negocios publicados e ideas editoriales. Leonix no vende el viaje final aquí.",
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
      geoDenied: "No pudimos leer tu ubicación. Elige un origen manualmente.",
      geoUnavailable: "Ubicación no disponible en este dispositivo.",
      destPlaceholder: "Playa, ciudad, país…",
    },
    carousel: { prev: "Ver categorías anteriores", next: "Ver categorías siguientes" },
    topOffers: {
      title: "Top ofertas de la semana",
      subtitle:
        "Cada tarjeta muestra el origen: socio comercial (suele abrir en el sitio del socio), negocio con anuncio en Leonix, o guía editorial.",
    },
    localDepartures: {
      title: "Saliendo desde tu área",
      cta: "Ver ofertas",
      byId: {
        sjo: { title: "Desde San José", description: "Escapadas a México, Caribe y ciudades de conexión desde SJO." },
        sfo: { title: "Desde San Francisco", description: "Vuelos directos y paquetes con salida desde la Bahía." },
        oak: { title: "Desde Oakland", description: "Opciones cercanas al Este de la Bahía con buen valor." },
        near: { title: "Escapadas cerca de ti", description: "Fin de semana, playa, montaña y viñedos sin ir tan lejos." },
      },
    },
    destinations: {
      title: "Explora destinos populares",
      cta: "Ver ofertas",
      byId: {
        "cancun-col": { supportingLine: "Playas, arrecifes y vida nocturna con paquetes curados." },
        cr: { supportingLine: "Bosque nuboso, canopy y playas del Pacífico." },
        sc: { supportingLine: "Costa Norte de California: surf, senderos y gastronomía." },
        yosemite: { supportingLine: "Naturaleza icónica con estancias y tours guiados." },
      },
    },
    audience: {
      title: "Viajes para cada plan",
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
      partnersTitle: "Agencias y socios destacados",
      partnersSubtitle: "Negocios y operadores con perfil en Leonix — contacto directo y especialidades visibles.",
      businessPublished: "Negocio publicado",
      verified: "Verificado",
      viewProfile: "Ver perfil →",
      editorialTitle: "Guías e ideas para tu próximo viaje",
      editorialSubtitle:
        "Contenido editorial Leonix — enlaces de inspiración hasta que existan rutas de lectura dedicadas.",
      editorialPill: "Editorial",
      readTime: (n) => `${n} de lectura`,
      seasonalTitle: "Ofertas de temporada",
      seasonalSubtitle: "Campañas agrupadas — mezcla de inventario de socios y anuncios de negocios locales.",
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
      "Leonix Viajes es una vitrina de descubrimiento dentro de Clasificados: ofertas de socios comerciales, anuncios de agencias/operadores e ideas editoriales. Leonix no es el vendedor final — con socios, la reserva ocurre en su sitio; con negocios locales, el contacto es directo.",
    trustWhy: {
      title: "Por qué Leonix Viajes",
      body: "Unimos inspiración con inventario real: socios comerciales, negocios que publican en Leonix e ideas editoriales. No somos la agencia de reservas — te acercamos a la oferta y al contacto correcto.",
    },
    trustFooter: {
      aboutViajes: "Sobre Viajes",
      aboutBody:
        "Explora escapadas, resorts y tours con salidas desde tu zona. Verás inventario de socios comerciales (enlaces externos), negocios con ficha en Leonix y contenido editorial — siempre con el origen visible.",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
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
    heroTitle: "Getaways, resorts, tours, and deals for your next adventure",
    heroSubtitle:
      "Inside Leonix Classifieds, Viajes is your visual lane for getaways: partner offers, business listings, and editorial picks. Leonix does not sell the final trip here.",
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
      geoDenied: "We couldn’t read your location. Please choose an origin manually.",
      geoUnavailable: "Location isn’t available on this device.",
      destPlaceholder: "Beach, city, country…",
    },
    carousel: { prev: "Show previous categories", next: "Show next categories" },
    topOffers: {
      title: "Top offers this week",
      subtitle:
        "Each card shows the source: commercial partner (often opens on the partner site), a business listing on Leonix, or editorial.",
    },
    localDepartures: {
      title: "Departing near you",
      cta: "View offers",
      byId: {
        sjo: { title: "From San José", description: "Getaways to Mexico, the Caribbean, and connecting hubs from SJO." },
        sfo: { title: "From San Francisco", description: "Direct flights and packages departing the Bay Area." },
        oak: { title: "From Oakland", description: "Great-value options near the East Bay." },
        near: { title: "Weekend trips nearby", description: "Beach, mountains, and wine country without going far." },
      },
    },
    destinations: {
      title: "Explore popular destinations",
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
      partnersTitle: "Featured agencies & partners",
      partnersSubtitle: "Businesses and operators on Leonix — direct contact and clear specialties.",
      businessPublished: "Business listing",
      verified: "Verified",
      viewProfile: "View profile →",
      editorialTitle: "Guides & ideas for your next trip",
      editorialSubtitle: "Leonix editorial content — inspiration links until dedicated reading routes ship.",
      editorialPill: "Editorial",
      readTime: (n) => `${n} read`,
      seasonalTitle: "Seasonal offers",
      seasonalSubtitle: "Grouped campaigns — a mix of partner inventory and local business listings.",
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
      "Leonix Viajes is a discovery showcase inside Classifieds: partner offers, agency/operator listings, and editorial ideas. Leonix is not the final seller — partner bookings happen on partner sites; local businesses are contacted directly.",
    trustWhy: {
      title: "Why Leonix Viajes",
      body: "We blend inspiration with real inventory: commercial partners, businesses that publish on Leonix, and editorial ideas. We’re not the booking agency — we surface the offer and the right next step.",
    },
    trustFooter: {
      aboutViajes: "About Viajes",
      aboutBody:
        "Explore getaways, resorts, and tours near you. You’ll see partner inventory (external links), businesses with a Leonix profile, and editorial content — the source is always labeled.",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
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
