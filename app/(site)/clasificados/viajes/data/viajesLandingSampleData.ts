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
  src: "/child-categories/viajes/hero.jpg",
  alt: "Resort tropical al atardecer con bungalows sobre el agua",
};

/** Soft scenic wash for mid/lower page — keeps hero as the primary focal image. */
export const VIAJES_PAGE_AMBIENCE = {
  midScenicSrc: "/child-categories/viajes/mid-scenic.jpg",
  lowerWashSrc: "/child-categories/viajes/lower-wash.jpg",
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
    imageSrc: "/child-categories/viajes/cancun.jpg",
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
    imageSrc: "/child-categories/viajes/riviera.jpg",
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
    imageSrc: "/child-categories/viajes/maui.jpg",
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
    imageSrc: "/child-categories/viajes/puerto-vallarta.jpg",
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
    imageSrc: "/child-categories/viajes/editorial-pack-light.jpg",
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
    imageSrc: "/child-categories/viajes/sjo.jpg",
    imageAlt: "Avión despegando al atardecer",
    title: "Desde San José",
    description: "Escapadas a México, Caribe y ciudades de conexión desde SJO.",
    browse: { from: "san-jose" },
  },
  {
    id: "sfo",
    imageSrc: "/child-categories/viajes/sfo.jpg",
    imageAlt: "Horizonte de San Francisco",
    title: "Desde San Francisco",
    description: "Vuelos directos y paquetes con salida desde la Bahía.",
    browse: { from: "san-francisco" },
  },
  {
    id: "oak",
    imageSrc: "/child-categories/viajes/oak.jpg",
    imageAlt: "Bahía al atardecer",
    title: "Desde Oakland",
    description: "Opciones cercanas al Este de la Bahía con buen valor.",
    browse: { from: "oakland" },
  },
  {
    id: "near",
    imageSrc: "/child-categories/viajes/near.jpg",
    imageAlt: "Carretera costera escénica",
    title: "Escapadas cerca de ti",
    description: "Fin de semana, playa, montaña y viñedos sin ir tan lejos.",
    browse: { t: "cerca" },
  },
];

export const VIAJES_DESTINATION_COLLECTIONS: ViajesDestinationCollection[] = [
  {
    id: "cancun-col",
    imageSrc: "/child-categories/viajes/cancun-col.jpg",
    imageAlt: "Cancún vista aérea",
    name: "Cancún",
    supportingLine: "Playas, arrecifes y vida nocturna con paquetes curados.",
    browse: { dest: "cancun" },
  },
  {
    id: "cr",
    imageSrc: "/child-categories/viajes/cr.jpg",
    imageAlt: "Volcán y naturaleza en Costa Rica",
    name: "Costa Rica Adventure",
    supportingLine: "Bosque nuboso, canopy y playas del Pacífico.",
    browse: { dest: "costa-rica" },
  },
  {
    id: "sc",
    imageSrc: "/child-categories/viajes/sc.jpg",
    imageAlt: "Playa de Santa Cruz",
    name: "Santa Cruz",
    supportingLine: "Costa Norte de California: surf, senderos y gastronomía.",
    browse: { dest: "santa-cruz" },
  },
  {
    id: "yosemite",
    imageSrc: "/child-categories/viajes/yosemite.jpg",
    imageAlt: "Yosemite al amanecer",
    name: "Yosemite",
    supportingLine: "Naturaleza icónica con estancias y tours guiados.",
    browse: { dest: "yosemite" },
  },
];

export const VIAJES_AUDIENCE_BUCKETS: ViajesAudienceCard[] = [
  {
    id: "families",
    imageSrc: "/child-categories/viajes/families.jpg",
    imageAlt: "Familia en la playa",
    label: "Para familias",
    subline: "Hoteles con actividades, traslados sencillos y ritmo relajado.",
    browse: { audience: "familias" },
  },
  {
    id: "couples",
    imageSrc: "/child-categories/viajes/couples.jpg",
    imageAlt: "Pareja en la playa al atardecer",
    label: "Para parejas",
    subline: "Boutique, cenas y experiencias íntimas frente al mar.",
    browse: { audience: "parejas" },
  },
  {
    id: "groups",
    imageSrc: "/child-categories/viajes/groups.jpg",
    imageAlt: "Grupo de amigos celebrando",
    label: "Para grupos",
    subline: "Villas, cruceros y paquetes con tarifas por habitación múltiple.",
    browse: { audience: "grupos" },
  },
  {
    id: "romantic",
    imageSrc: "/child-categories/viajes/romantic.jpg",
    imageAlt: "Cena romántica al aire libre",
    label: "Escapadas románticas",
    subline: "Spa, vistas y detalles para una escapada inolvidable.",
    browse: { audience: "romanticos" },
  },
];
