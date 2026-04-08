/**
 * Sample results for Viajes discovery shell — replace with API data later.
 */

export type ViajesResultKind = "affiliate" | "business";

export interface ViajesAffiliateResult {
  kind: "affiliate";
  id: string;
  imageSrc: string;
  imageAlt: string;
  inventoryLabel: "Socio de viaje" | "Oferta especial" | "Reserva con socio";
  title: string;
  destination: string;
  priceFrom: string;
  duration: string;
  departureContext: string;
  href: string;
  /** Canonical trip-type keys for `t` filter (see viajesTripTypes). */
  tripTypeKeys?: string[];
  /** Short line for affiliate disclosure on cards */
  affiliateNote?: string;
}

export interface ViajesBusinessResult {
  kind: "business";
  id: string;
  imageSrc: string;
  imageAlt: string;
  businessName: string;
  offerTitle: string;
  destination: string;
  departureCity: string;
  duration: string;
  price: string;
  includedSummary: string;
  whatsapp?: string;
  href: string;
  tripTypeKeys?: string[];
  ctaHint?: string;
}

export type ViajesResultRow = ViajesAffiliateResult | ViajesBusinessResult;

export const VIAJES_RESULTS_SAMPLE: ViajesResultRow[] = [
  {
    kind: "affiliate",
    id: "aff-1",
    imageSrc: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Playa tropical",
    inventoryLabel: "Socio de viaje",
    title: "Cancún · resort frente al mar",
    destination: "Cancún, México",
    priceFrom: "Desde $549 / persona",
    duration: "5 días · 4 noches",
    departureContext: "Salidas desde SFO y SJO",
    href: "/clasificados/viajes/oferta/cancun-resort-mar",
    tripTypeKeys: ["resorts", "hoteles"],
    affiliateNote: "Precio orientativo vía socio Leonix",
  },
  {
    kind: "business",
    id: "biz-1",
    imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Venecia canales",
    businessName: "Viajes Del Valle",
    offerTitle: "Europa express: Roma + Venecia",
    destination: "Italia",
    departureCity: "San Francisco",
    duration: "8 días · 7 noches",
    price: "$2,150 / persona",
    includedSummary: "Vuelos, hotel 4★, desayunos, traslados aeropuerto.",
    whatsapp: "+1 555 010 2030",
    href: "/clasificados/viajes/oferta/roma-venecia-express",
    tripTypeKeys: ["tours", "hoteles", "transporte"],
    ctaHint: "Contacto directo con la agencia",
  },
  {
    kind: "affiliate",
    id: "aff-2",
    imageSrc: "https://images.unsplash.com/photo-1542259670-48a73e819d9c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Costa hawaiana",
    inventoryLabel: "Oferta especial",
    title: "Maui · boutique junto a la playa",
    destination: "Maui, Hawái",
    priceFrom: "Desde $1,089 / persona",
    duration: "6 días · 5 noches",
    departureContext: "Directo desde SFO",
    href: "/clasificados/viajes/oferta/maui-boutique",
    tripTypeKeys: ["resorts", "hoteles", "renta-autos"],
    affiliateNote: "Vuelo + auto + hotel vía socio",
  },
  {
    kind: "business",
    id: "biz-2",
    imageSrc: "https://images.unsplash.com/photo-1592405204553-2e719cb02c48?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Selva tropical",
    businessName: "Pura Vida Escapes",
    offerTitle: "Arenal + Manuel Antonio en familia",
    destination: "Costa Rica",
    departureCity: "San José (SJO)",
    duration: "7 días · 6 noches",
    price: "Desde $1,420 / persona",
    includedSummary: "Hoteles, desayuno, transporte privado, entradas parque.",
    whatsapp: "+506 8888 1234",
    href: "/clasificados/viajes/oferta/cr-familia-arenal-manuel",
    tripTypeKeys: ["tours", "actividades", "transporte"],
    ctaHint: "WhatsApp al operador local",
  },
  {
    kind: "affiliate",
    id: "aff-3",
    imageSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Piscina infinita resort",
    inventoryLabel: "Reserva con socio",
    title: "Riviera Maya · todo incluido 5★",
    destination: "Playa del Carmen",
    priceFrom: "Desde $799 / persona",
    duration: "5 días · 4 noches",
    departureContext: "Vuelo desde Oakland",
    href: "/clasificados/viajes/oferta/riviera-todo-incluido",
    tripTypeKeys: ["resorts", "ultimo-minuto"],
    affiliateNote: "Checkout en sitio del socio",
  },
  {
    kind: "business",
    id: "biz-3",
    imageSrc: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Lago y montañas",
    businessName: "Bay Travel Co.",
    offerTitle: "Lago Tahoe · fin de semana",
    destination: "California / Nevada",
    departureCity: "Oakland",
    duration: "3 días · 2 noches",
    price: "$389 / persona",
    includedSummary: "Cabaña, kayak incluido, guía bilingüe opcional.",
    href: "/clasificados/viajes/oferta/tahoe-fin-semana",
    tripTypeKeys: ["fin-de-semana", "escapada", "actividades"],
    ctaHint: "Correo al anunciante",
  },
  {
    kind: "affiliate",
    id: "aff-car-1",
    imageSrc: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Auto en carretera costera",
    inventoryLabel: "Socio de viaje",
    title: "Renta de auto · Cancún aeropuerto (CUN)",
    destination: "Cancún, México",
    priceFrom: "Desde $32 / día",
    duration: "Mínimo 3 días",
    departureContext: "Recogida en CUN · salidas desde SFO/SJC con vuelo aparte",
    href: "/clasificados/viajes/oferta/cancun-renta-auto",
    tripTypeKeys: ["renta-autos", "transporte"],
    affiliateNote: "Tarifas del proveedor de renta; Leonix no cobra la reserva aquí",
  },
];
