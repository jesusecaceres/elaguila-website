/**
 * Sample offer/detail records keyed by slug — swap for CMS or API later.
 */

export type ViajesOfferPartnerBlock = {
  name: string;
  isAffiliate: boolean;
  affiliateDisclosure?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export type ViajesOfferDetailModel = {
  slug: string;
  heroImageSrc: string;
  heroImageAlt: string;
  title: string;
  destination: string;
  priceFrom: string;
  duration: string;
  departureCity: string;
  tags: string[];
  mainCtaLabel: string;
  mainCtaHref: string;
  includes: string[];
  whoItsFor: string[];
  partner: ViajesOfferPartnerBlock;
  dateRange?: string;
  notes?: string;
  description: string;
  trustNote?: string;
};

export const VIAJES_OFFER_DETAILS: Record<string, ViajesOfferDetailModel> = {
  "cancun-resort-mar": {
    slug: "cancun-resort-mar",
    heroImageSrc: "https://images.unsplash.com/photo-1552074284-5e88f742d1f5?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Playa de Cancún",
    title: "Cancún · resort frente al mar",
    destination: "Cancún, Quintana Roo, México",
    priceFrom: "Desde $549 por persona",
    duration: "5 días · 4 noches",
    departureCity: "San Francisco u Oakland (conexión desde SJO disponible)",
    tags: ["Familiar", "Pareja", "Todo incluido"],
    mainCtaLabel: "Reservar con socio",
    mainCtaHref: "https://example.com/partner-booking",
    includes: [
      "Vuelos redondos en clase económica (itinerarios seleccionados)",
      "Traslados aeropuerto–hotel",
      "Habitación frente al mar o vista parcial al mar",
      "Plan todo incluido en restaurantes del resort",
      "Actividades acuáticas no motorizadas",
    ],
    whoItsFor: [
      "Familias que buscan playa tranquila con club de niños cercano.",
      "Parejas que quieren spa, cenas y atardeceres sin complicaciones.",
      "Grupos pequeños que pueden coordinar fechas con flexibilidad de aerolínea.",
    ],
    partner: {
      name: "Red de paquetes Leonix",
      isAffiliate: true,
      affiliateDisclosure:
        "Leonix puede recibir una comisión si completas una reserva con este socio. Los precios y disponibilidad los confirma el proveedor.",
      ctaLabel: "Continuar en sitio del socio",
      ctaHref: "https://example.com/partner-booking",
      secondaryCtaLabel: "Ver más ofertas",
      secondaryCtaHref: "/clasificados/viajes/resultados",
    },
    dateRange: "Salidas seleccionadas: marzo–agosto (sujeto a inventario)",
    notes: "Tarifas sujetas a cambio según temporada y ocupación aérea.",
    description:
      "Paquete curado con enfoque en playa, comodidad y tiempo libre. Ideal para quien quiere llegar y desconectar sin planificar cada comida.",
    trustNote: "Verifica siempre cancelaciones y cargos extras antes de pagar.",
  },
  "roma-venecia-express": {
    slug: "roma-venecia-express",
    heroImageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Canales de Venecia",
    title: "Europa express: Roma + Venecia",
    destination: "Italia (Roma y Venecia)",
    priceFrom: "$2,150 por persona",
    duration: "8 días · 7 noches",
    departureCity: "San Francisco (SFO)",
    tags: ["Pareja", "Cultura", "Grupo"],
    mainCtaLabel: "Contactar agencia",
    mainCtaHref: "https://wa.me/15550102030",
    includes: [
      "Vuelos internacionales con equipaje documentado (política según aerolínea)",
      "Hoteles 4★ en zona céntrica",
      "Desayunos diarios",
      "Traslados aeropuerto–hotel en Roma y Venecia",
      "Tren de alta velocidad Roma–Venecia",
    ],
    whoItsFor: [
      "Parejas en primera visita a Italia con ritmo equilibrado.",
      "Viajeros que prefieren soporte en español para itinerario y documentos.",
    ],
    partner: {
      name: "Viajes Del Valle",
      isAffiliate: false,
      ctaLabel: "WhatsApp a la agencia",
      ctaHref: "https://wa.me/15550102030",
      secondaryCtaLabel: "Ver perfil del negocio",
      secondaryCtaHref: "/clasificados/viajes/negocio/viajes-del-valle",
    },
    description:
      "Itinerario pensado para caminar monumentos icónicos, disfrutar gastronomía local y tener tiempo libre para fotos y compras.",
    trustNote: "Agencia publicada en Leonix Clasificados; valida licencias y referencias antes de transferencias.",
  },
  "maui-boutique": {
    slug: "maui-boutique",
    heroImageSrc: "https://images.unsplash.com/photo-1542259670-48a73e819d9c?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Costa de Maui",
    title: "Maui · boutique junto a la playa",
    destination: "Maui, Hawái",
    priceFrom: "Desde $1,089 por persona",
    duration: "6 días · 5 noches",
    departureCity: "San Francisco (vuelo directo)",
    tags: ["Pareja", "Lujo suave", "Playa"],
    mainCtaLabel: "Ver disponibilidad",
    mainCtaHref: "https://example.com/maui-offer",
    includes: ["Vuelo directo SFO–OGG", "SUV compacto 5 días", "Hotel boutique con desayuno continental"],
    whoItsFor: ["Parejas que buscan playas menos congestionadas y atardeceres icónicos."],
    partner: {
      name: "Socio hotelero Leonix",
      isAffiliate: true,
      affiliateDisclosure: "Oferta de inventario afiliado; precio final en checkout del socio.",
      ctaLabel: "Reservar en socio",
      ctaHref: "https://example.com/maui-offer",
    },
    description: "Combinación de vuelo directo, auto y hotel boutique para explorar la costa sin prisa.",
  },
  "cr-familia-arenal-manuel": {
    slug: "cr-familia-arenal-manuel",
    heroImageSrc: "https://images.unsplash.com/photo-1592405204553-2e719cb02c48?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Naturaleza en Costa Rica",
    title: "Arenal + Manuel Antonio en familia",
    destination: "Costa Rica",
    priceFrom: "Desde $1,420 por persona",
    duration: "7 días · 6 noches",
    departureCity: "San José (SJO)",
    tags: ["Familiar", "Naturaleza", "Aventura suave"],
    mainCtaLabel: "Solicitar itinerario",
    mainCtaHref: "https://wa.me/50688881234",
    includes: [
      "Hoteles seleccionados con desayuno",
      "Transporte privado entre destinos",
      "Entradas parque Arenal y reserva Manuel Antonio (según itinerario)",
      "Coordinación en español",
    ],
    whoItsFor: ["Familias con niños que quieren fauna, piscinas termales y playa en un mismo viaje."],
    partner: {
      name: "Pura Vida Escapes",
      isAffiliate: false,
      ctaLabel: "WhatsApp",
      ctaHref: "https://wa.me/50688881234",
      secondaryCtaLabel: "Perfil del negocio",
      secondaryCtaHref: "/clasificados/viajes/negocio/pura-vida-escapes",
    },
    description: "Ruta clásica Volcán Arenal y Pacífico central con ritmo amable para todas las edades.",
  },
  "riviera-todo-incluido": {
    slug: "riviera-todo-incluido",
    heroImageSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Resort con piscina",
    title: "Riviera Maya · todo incluido 5★",
    destination: "Playa del Carmen, México",
    priceFrom: "Desde $799 por persona",
    duration: "5 días · 4 noches",
    departureCity: "Oakland y conexiones",
    tags: ["Familiar", "Todo incluido", "Playa"],
    mainCtaLabel: "Reservar con socio",
    mainCtaHref: "https://example.com/riviera",
    includes: ["Vuelo", "traslados", "suite garden o partial ocean view", "plan todo incluido premium"],
    whoItsFor: ["Quienes quieren comer y beber sin llevar efectivo constante en el resort."],
    partner: {
      name: "Operador afiliado Leonix",
      isAffiliate: true,
      affiliateDisclosure: "Leonix muestra esta oferta como socio comercial; la reserva la procesa el proveedor.",
      ctaLabel: "Ir al checkout del socio",
      ctaHref: "https://example.com/riviera",
    },
    description: "Propiedad 5★ con múltiples restaurantes, actividades para niños y adultos, y playa privada.",
  },
  "cancun-renta-auto": {
    slug: "cancun-renta-auto",
    heroImageSrc: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Auto en carretera tropical",
    title: "Renta de auto en Cancún (CUN)",
    destination: "Cancún, Quintana Roo, México",
    priceFrom: "Desde $32 / día",
    duration: "Reserva mínima 3 días",
    departureCity: "Recogida CUN · vuelo aparte (SFO / SJC / OAK)",
    tags: ["Renta de autos", "Flexible", "Independiente"],
    mainCtaLabel: "Ver tarifas en socio",
    mainCtaHref: "https://example.com/car-rental-cancun",
    includes: [
      "Categoría compacta o SUV sujeta a disponibilidad",
      "Kilometraje con política del proveedor",
      "Seguro básico incluido (revisa deducibles en el checkout)",
      "Cancelación según términos del arrendador",
    ],
    whoItsFor: [
      "Viajeros que ya tienen vuelo y hotel y solo necesitan movilidad.",
      "Familias que prefieren rutas a cenotes y playas con horario propio.",
    ],
    partner: {
      name: "Socio renta autos Leonix",
      isAffiliate: true,
      affiliateDisclosure:
        "Leonix muestra tarifas de un socio comercial de renta de autos; el contrato final lo emite el proveedor en su sitio.",
      ctaLabel: "Continuar con el proveedor",
      ctaHref: "https://example.com/car-rental-cancun",
      secondaryCtaLabel: "Ver más en resultados",
      secondaryCtaHref: "/clasificados/viajes/resultados?t=renta-autos",
    },
    description:
      "Comparativo de flotas en zona Cancún–Riviera Maya con recogida en CUN. Ideal para combinar con estancia en resort o Airbnb.",
    trustNote: "Revisa cargos por conductor joven, gasolina y regreso en otra ciudad antes de confirmar.",
  },
  "tahoe-fin-semana": {
    slug: "tahoe-fin-semana",
    heroImageSrc: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Lago Tahoe",
    title: "Lago Tahoe · fin de semana",
    destination: "California / Nevada",
    priceFrom: "$389 por persona",
    duration: "3 días · 2 noches",
    departureCity: "Oakland",
    tags: ["Escapada", "Grupo", "Naturaleza"],
    mainCtaLabel: "Contactar Bay Travel",
    mainCtaHref: "mailto:hola@baytravel.example",
    includes: ["Cabaña compartida (ocupación doble)", "Kayak incluido un día", "Guía bilingüe opcional"],
    whoItsFor: ["Grupos de amigos o familias extensas con flexibilidad de horarios."],
    partner: {
      name: "Bay Travel Co.",
      isAffiliate: false,
      ctaLabel: "Enviar correo",
      ctaHref: "mailto:hola@baytravel.example",
      secondaryCtaLabel: "Perfil del negocio",
      secondaryCtaHref: "/clasificados/viajes/negocio/bay-travel-co",
    },
    description: "Escapada corta para desconectar: lago, senderos y fogata bajo las estrellas.",
  },
  "los-cabos-snorkel": {
    slug: "los-cabos-snorkel",
    heroImageSrc: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Arrecife y embarcación en Los Cabos",
    title: "Los Cabos · snorkel y arco en lancha",
    destination: "Cabo San Lucas, Baja California Sur, México",
    priceFrom: "Desde $129 por persona",
    duration: "Medio día (salidas AM y PM)",
    departureCity: "Encuentro en marina (vuelo a SJD aparte · salidas comunes desde SFO/SJC)",
    tags: ["Tour", "Pareja", "Familia"],
    mainCtaLabel: "Reservar actividad con socio",
    mainCtaHref: "https://example.com/cabo-snorkel",
    includes: [
      "Lancha compartida con guía bilingüe",
      "Equipo de snorkel y chaleco",
      "Bebidas sin alcohol a bordo",
      "Parada breve en El Arco (según oleaje)",
    ],
    whoItsFor: [
      "Parejas que quieren una mañana o tarde memorable sin reservar resort entero.",
      "Familias con adolescentes cómodos en el agua.",
    ],
    partner: {
      name: "Socio tours marinos Leonix",
      isAffiliate: true,
      affiliateDisclosure:
        "Actividad mostrada por un socio comercial; la reserva y el pago final los gestiona el proveedor en su sitio.",
      ctaLabel: "Ver horarios en el socio",
      ctaHref: "https://example.com/cabo-snorkel",
    },
    description:
      "Salida corta para ver el arco, fauna marina y un snorkel tranquilo en calas protegidas cuando el clima lo permite.",
    trustNote: "Confirma edad mínima, estado del mar y política de cancelación antes de pagar.",
  },
  "napa-valley-escape": {
    slug: "napa-valley-escape",
    heroImageSrc: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=2000&q=80",
    heroImageAlt: "Viñedos al atardecer en Napa",
    title: "Napa Valley · hotel boutique y viñedos",
    destination: "Napa & Sonoma, California",
    priceFrom: "Desde $489 por persona",
    duration: "3 días · 2 noches",
    departureCity: "San José y San Francisco (por carretera)",
    tags: ["Romántico", "Enoturismo", "Escapada"],
    mainCtaLabel: "Ver paquete en socio",
    mainCtaHref: "https://example.com/napa-boutique",
    includes: [
      "Dos noches en hotel boutique con desayuno",
      "Degustación en viñedo seleccionado (cita previa)",
      "Crédito spa o cena (según temporada)",
    ],
    whoItsFor: [
      "Parejas que buscan calma, buena comida y paisajes de viñedo sin vuelo internacional.",
      "Pequeños grupos que pueden coordinar salida en un solo auto.",
    ],
    partner: {
      name: "Red escapadas Leonix",
      isAffiliate: true,
      affiliateDisclosure:
        "Paquete de socio comercial; Leonix no procesa el cobro final. Precios sujetos a disponibilidad del hotel.",
      ctaLabel: "Continuar al socio",
      ctaHref: "https://example.com/napa-boutique",
    },
    description:
      "Combinación de hospedaje íntimo, cata y tiempo libre para pasear pueblos del valle al ritmo de la mesa californiana.",
    trustNote: "Revisa políticas de edad mínima para consumo de alcohol y conducción designada.",
  },
};

export const VIAJES_OFFER_SLUGS = Object.keys(VIAJES_OFFER_DETAILS);

export function getViajesOfferDetailBySlug(slug: string): ViajesOfferDetailModel | undefined {
  return VIAJES_OFFER_DETAILS[slug];
}
