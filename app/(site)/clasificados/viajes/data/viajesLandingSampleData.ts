/**
 * Structured mock data for the Viajes landing shell.
 * Replace with API-mapped data when wiring is added.
 * Results-bound links use `browse` patches — URLs are built at render via `viajesResultsBrowseUrl` (single contract).
 */

import type { ViajesResultsLinkPatch } from "../lib/viajesBrowseContract";

export type ViajesOfferBadge = "Recomendado" | "Oferta especial" | "Socio de viaje";

export type ViajesTopOfferListingKind = "affiliate" | "business" | "editorial";

export interface ViajesTopOffer {
  id: string;
  imageSrc: string;
  imageAlt: string;
  badge: ViajesOfferBadge;
  title: string;
  supportingLine: string;
  stars: number;
  locationLine: string;
  priceFrom: string;
  duration: string;
  departureContext: string;
  partnerLabel?: string;
  /** Offer detail / profile URL — omit when `resultsBrowse` is the primary CTA */
  href?: string;
  /** Feed / card routing */
  listingKind: ViajesTopOfferListingKind;
  /** Lower = more prominent in curated feed */
  featuredRank?: number;
  /** Short affiliate disclosure for cards */
  affiliateDisclosureShort?: string;
  /** EN variant for `?lang=en` screenshots */
  affiliateDisclosureShortEn?: string;
  /** When listingKind is business */
  businessName?: string;
  /** When set, primary CTA targets `/resultados` with this contract state (canonical handoff). */
  resultsBrowse?: ViajesResultsLinkPatch;
}

export interface ViajesLocalDepartureCard {
  id: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  browse: ViajesResultsLinkPatch;
}

export interface ViajesDestinationCollection {
  id: string;
  imageSrc: string;
  imageAlt: string;
  name: string;
  supportingLine: string;
  browse: ViajesResultsLinkPatch;
}

export interface ViajesAudienceCard {
  id: string;
  imageSrc: string;
  imageAlt: string;
  label: string;
  subline: string;
  browse: ViajesResultsLinkPatch;
}

export interface ViajesCategoryPill {
  id: string;
  label: string;
  icon: string;
  browse: ViajesResultsLinkPatch;
}

export const VIAJES_HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2400&q=80",
  alt: "Resort tropical al atardecer con bungalows sobre el agua",
};

/** Soft scenic wash for mid/lower page — keeps hero as the primary focal image. */
export const VIAJES_PAGE_AMBIENCE = {
  midScenicSrc:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2200&q=75",
  lowerWashSrc:
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2000&q=75",
} as const;

export const VIAJES_CATEGORY_PILLS: ViajesCategoryPill[] = [
  { id: "weekend", label: "Escapadas de fin de semana", icon: "🌴", browse: { t: "fin-de-semana" } },
  { id: "day", label: "Viajes de un día", icon: "☀️", browse: { t: "dia" } },
  { id: "resorts", label: "Resorts todo incluido", icon: "🏝️", browse: { t: "resorts" } },
  { id: "hoteles", label: "Hoteles / estadías", icon: "🏨", browse: { t: "hoteles" } },
  { id: "tours", label: "Tours y excursiones", icon: "🧭", browse: { t: "tours" } },
  { id: "actividades", label: "Actividades en destino", icon: "🎯", browse: { t: "actividades" } },
  { id: "cruises", label: "Cruceros", icon: "🚢", browse: { t: "cruceros" } },
  { id: "renta-autos", label: "Renta de autos", icon: "🚗", browse: { t: "renta-autos" } },
  { id: "transporte", label: "Transporte / traslados", icon: "🚌", browse: { t: "transporte" } },
  { id: "ultimo-minuto", label: "Último minuto", icon: "⚡", browse: { t: "ultimo-minuto" } },
  { id: "family", label: "Viajes familiares", icon: "👨‍👩‍👧", browse: { audience: "familias" } },
  { id: "romantic", label: "Viajes románticos", icon: "💛", browse: { audience: "parejas" } },
  { id: "sjo", label: "Salidas desde San José (SJC)", icon: "✈️", browse: { from: "san-jose" } },
  { id: "budget", label: "Ofertas por presupuesto", icon: "💰", browse: { t: "presupuesto" } },
];

export const VIAJES_TOP_OFFERS: ViajesTopOffer[] = [
  {
    id: "cancun",
    imageSrc: "https://images.unsplash.com/photo-1552074284-5e88f742d1f5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Playa de Cancún con agua turquesa",
    badge: "Recomendado",
    title: "Cancún",
    supportingLine: "Resort frente al mar · zona hotelera",
    stars: 5,
    locationLine: "Quintana Roo, México",
    priceFrom: "Desde $589 por persona",
    duration: "5 días / 4 noches",
    departureContext: "Salidas desde SFO y SJO (con escala)",
    partnerLabel: "Socio: paquete resort",
    href: "/clasificados/viajes/oferta/cancun-resort-mar",
    listingKind: "affiliate",
    featuredRank: 1,
    affiliateDisclosureShort: "Reserva en sitio del socio · Leonix puede recibir comisión",
    affiliateDisclosureShortEn: "Book on the partner site · Leonix may earn a commission",
  },
  {
    id: "riviera",
    imageSrc: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Costa tropical con palmeras",
    badge: "Oferta especial",
    title: "Riviera Maya",
    supportingLine: "Todo incluido · spa y snorkel",
    stars: 5,
    locationLine: "Playa del Carmen",
    priceFrom: "Desde $729 por persona",
    duration: "6 días / 5 noches",
    departureContext: "Vuelo desde San Francisco",
    partnerLabel: "Oferta de temporada",
    href: "/clasificados/viajes/oferta/riviera-todo-incluido",
    listingKind: "affiliate",
    featuredRank: 2,
    affiliateDisclosureShort: "Inventario de socio comercial",
    affiliateDisclosureShortEn: "Commercial partner inventory",
  },
  {
    id: "maui",
    imageSrc: "https://images.unsplash.com/photo-1542259670-48a73e819d9c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Costa de Maui al atardecer",
    badge: "Socio de viaje",
    title: "Maui, Hawái",
    supportingLine: "Boutique resort · playas tranquilas",
    stars: 5,
    locationLine: "Isla de Maui",
    priceFrom: "Desde $1,120 por persona",
    duration: "7 días / 6 noches",
    departureContext: "Salida desde SFO",
    partnerLabel: "Agencia aliada Leonix",
    href: "/clasificados/viajes/oferta/maui-boutique",
    listingKind: "affiliate",
    featuredRank: 3,
    affiliateDisclosureShort: "Vuelo + hotel vía proveedor afiliado",
    affiliateDisclosureShortEn: "Flight + hotel via affiliate provider",
  },
  {
    id: "puerto-vallarta",
    imageSrc: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Bahía de Puerto Vallarta",
    badge: "Recomendado",
    title: "Puerto Vallarta",
    supportingLine: "Familias · paseos en bahía",
    stars: 4,
    locationLine: "Jalisco, México",
    priceFrom: "Desde $449 por persona",
    duration: "4 días / 3 noches",
    departureContext: "Salidas desde Oakland y SJO",
    partnerLabel: "Tour operador verificado",
    resultsBrowse: { dest: "puerto-vallarta" },
    listingKind: "business",
    featuredRank: 4,
    businessName: "Operadores locales Jalisco",
  },
  {
    id: "editorial-pack-light",
    imageSrc: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Mochila y mapa",
    badge: "Recomendado",
    title: "Guía: cómo empacar para 5 días en carry-on",
    supportingLine: "Ideas editoriales · menos equipaje, más calma en el aeropuerto",
    stars: 0,
    locationLine: "Leonix Ideas",
    priceFrom: "Lectura gratuita",
    duration: "8 min",
    departureContext: "Editorial",
    resultsBrowse: { t: "ultimo-minuto" },
    listingKind: "editorial",
    featuredRank: 5,
  },
];

export const VIAJES_LOCAL_DEPARTURES: ViajesLocalDepartureCard[] = [
  {
    id: "sjo",
    imageSrc: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Avión despegando al atardecer",
    title: "Desde San José",
    description: "Escapadas a México, Caribe y ciudades de conexión desde SJO.",
    browse: { from: "san-jose" },
  },
  {
    id: "sfo",
    imageSrc: "https://images.unsplash.com/photo-1526481280695-3c469172d1b8?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Horizonte de San Francisco",
    title: "Desde San Francisco",
    description: "Vuelos directos y paquetes con salida desde la Bahía.",
    browse: { from: "san-francisco" },
  },
  {
    id: "oak",
    imageSrc: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Bahía al atardecer",
    title: "Desde Oakland",
    description: "Opciones cercanas al Este de la Bahía con buen valor.",
    browse: { from: "oakland" },
  },
  {
    id: "near",
    imageSrc: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Carretera costera escénica",
    title: "Escapadas cerca de ti",
    description: "Fin de semana, playa, montaña y viñedos sin ir tan lejos.",
    browse: { t: "cerca" },
  },
];

export const VIAJES_DESTINATION_COLLECTIONS: ViajesDestinationCollection[] = [
  {
    id: "cancun-col",
    imageSrc: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cancún vista aérea",
    name: "Cancún",
    supportingLine: "Playas, arrecifes y vida nocturna con paquetes curados.",
    browse: { dest: "cancun" },
  },
  {
    id: "cr",
    imageSrc: "https://images.unsplash.com/photo-1592405204553-2e719cb02c48?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Volcán y naturaleza en Costa Rica",
    name: "Costa Rica Adventure",
    supportingLine: "Bosque nuboso, canopy y playas del Pacífico.",
    browse: { dest: "costa-rica" },
  },
  {
    id: "sc",
    imageSrc: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Playa de Santa Cruz",
    name: "Santa Cruz",
    supportingLine: "Costa Norte de California: surf, senderos y gastronomía.",
    browse: { dest: "santa-cruz" },
  },
  {
    id: "yosemite",
    imageSrc: "https://images.unsplash.com/photo-1562310503-efb2d7a6c5a3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Yosemite al amanecer",
    name: "Yosemite",
    supportingLine: "Naturaleza icónica con estancias y tours guiados.",
    browse: { dest: "yosemite" },
  },
];

export const VIAJES_AUDIENCE_BUCKETS: ViajesAudienceCard[] = [
  {
    id: "families",
    imageSrc: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Familia en la playa",
    label: "Para familias",
    subline: "Hoteles con actividades, traslados sencillos y ritmo relajado.",
    browse: { audience: "familias" },
  },
  {
    id: "couples",
    imageSrc: "https://images.unsplash.com/photo-1522673607200-1645061cd190?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Pareja en la playa al atardecer",
    label: "Para parejas",
    subline: "Boutique, cenas y experiencias íntimas frente al mar.",
    browse: { audience: "parejas" },
  },
  {
    id: "groups",
    imageSrc: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Grupo de amigos celebrando",
    label: "Para grupos",
    subline: "Villas, cruceros y paquetes con tarifas por habitación múltiple.",
    browse: { audience: "grupos" },
  },
  {
    id: "romantic",
    imageSrc: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Cena romántica al aire libre",
    label: "Escapadas románticas",
    subline: "Spa, vistas y detalles para una escapada inolvidable.",
    browse: { audience: "romanticos" },
  },
];
