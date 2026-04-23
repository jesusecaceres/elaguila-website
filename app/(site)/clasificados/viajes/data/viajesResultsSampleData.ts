/**
 * Sample results for Viajes discovery — replace with API + shared normalizers later.
 * Fields mirror what publish + affiliate feeds should expose for browse (`viajesPublishBrowseFieldMap.ts`).
 */

export type ViajesResultKind = "affiliate" | "business" | "editorial";

export type ViajesDiscoverySignals = {
  /** Scaffold: higher = more “featured” when sort=featured (not paid placement). */
  featuredBase?: number;
  sourceTrust?: number;
  completeness?: number;
};

export interface ViajesAffiliateResult {
  kind: "affiliate";
  id: string;
  imageSrc: string;
  imageAlt: string;
  inventoryLabel: "Socio de viaje" | "Oferta especial" | "Reserva con socio";
  title: string;
  destination: string;
  /** Canonical slug(s) for `dest=` filter */
  destSlugs?: string[];
  priceFrom: string;
  duration: string;
  departureContext: string;
  href: string;
  tripTypeKeys?: string[];
  /** Matches `svcLang` browse facet (`es` | `en` | `bilingual` | `other`). */
  serviceLanguageKeys?: string[];
  affiliateNote?: string;
  publishedAt: string;
  audienceKeys?: string[];
  budgetBand?: "" | "economico" | "moderado" | "premium";
  durationKey?: "" | "short" | "week" | "long";
  seasonKeys?: string[];
  discovery?: ViajesDiscoverySignals;
}

export interface ViajesBusinessResult {
  kind: "business";
  /** Staged publish lane — cards may show “private seller” when `private`. */
  sellerLane?: "business" | "private";
  id: string;
  imageSrc: string;
  imageAlt: string;
  businessName: string;
  offerTitle: string;
  destination: string;
  destSlugs?: string[];
  departureCity: string;
  duration: string;
  price: string;
  includedSummary: string;
  whatsapp?: string;
  href: string;
  tripTypeKeys?: string[];
  ctaHint?: string;
  publishedAt: string;
  audienceKeys?: string[];
  budgetBand?: "" | "economico" | "moderado" | "premium";
  durationKey?: "" | "short" | "week" | "long";
  seasonKeys?: string[];
  /** Matches `svcLang` browse facet (`es` | `en` | `bilingual` | `other`). */
  serviceLanguageKeys?: string[];
  /**
   * Extra plain text folded into the free-text `q` haystack (not separate URL facets).
   * Populated from business draft `destinationsServed` + `languages` so discovery search can match them.
   */
  listingSearchExtras?: string;
  discovery?: ViajesDiscoverySignals;
}

/** Labeled inspiration — not a transactional book-now row. */
export interface ViajesEditorialResult {
  kind: "editorial";
  id: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  dek: string;
  destinationLabel: string;
  destSlugs?: string[];
  href: string;
  tripTypeKeys?: string[];
  audienceKeys?: string[];
  publishedAt: string;
  durationKey?: "" | "short" | "week" | "long";
  seasonKeys?: string[];
  discovery?: ViajesDiscoverySignals;
}

export type ViajesResultRow = ViajesAffiliateResult | ViajesBusinessResult | ViajesEditorialResult;

export const VIAJES_RESULTS_SAMPLE: ViajesResultRow[] = [
  {
    kind: "affiliate",
    id: "aff-1",
    imageSrc: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Playa tropical",
    inventoryLabel: "Socio de viaje",
    title: "Cancún · resort frente al mar",
    destination: "Cancún, México",
    destSlugs: ["cancun"],
    priceFrom: "Desde $549 / persona",
    duration: "5 días · 4 noches",
    durationKey: "week",
    departureContext: "Salidas desde SFO y SJO",
    href: "/clasificados/viajes/oferta/cancun-resort-mar",
    tripTypeKeys: ["resorts", "hoteles"],
    affiliateNote: "Precio orientativo vía socio Leonix",
    publishedAt: "2025-11-02T12:00:00.000Z",
    audienceKeys: ["familias", "parejas"],
    budgetBand: "moderado",
    seasonKeys: ["winter", "spring"],
    serviceLanguageKeys: ["es", "en"],
    discovery: { featuredBase: 58, sourceTrust: 1, completeness: 0.82 },
  },
  {
    kind: "business",
    id: "biz-1",
    imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Venecia canales",
    businessName: "Viajes Del Valle",
    offerTitle: "Europa express: Roma + Venecia",
    destination: "Italia",
    destSlugs: ["italia", "roma"],
    departureCity: "San Francisco",
    duration: "8 días · 7 noches",
    durationKey: "long",
    price: "$2,150 / persona",
    includedSummary: "Vuelos, hotel 4★, desayunos, traslados aeropuerto.",
    whatsapp: "+1 555 010 2030",
    href: "/clasificados/viajes/oferta/roma-venecia-express",
    tripTypeKeys: ["tours", "hoteles", "transporte"],
    ctaHint: "Contacto directo con la agencia",
    publishedAt: "2025-10-18T09:30:00.000Z",
    audienceKeys: ["parejas", "grupos"],
    budgetBand: "premium",
    seasonKeys: ["spring", "summer"],
    serviceLanguageKeys: ["es", "en"],
    discovery: { featuredBase: 52, sourceTrust: 1.05, completeness: 0.88 },
  },
  {
    kind: "affiliate",
    id: "aff-2",
    imageSrc: "https://images.unsplash.com/photo-1542259670-48a73e819d9c?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Costa hawaiana",
    inventoryLabel: "Oferta especial",
    title: "Maui · boutique junto a la playa",
    destination: "Maui, Hawái",
    destSlugs: ["maui"],
    priceFrom: "Desde $1,089 / persona",
    duration: "6 días · 5 noches",
    durationKey: "week",
    departureContext: "Directo desde SFO",
    href: "/clasificados/viajes/oferta/maui-boutique",
    tripTypeKeys: ["resorts", "hoteles", "renta-autos"],
    affiliateNote: "Vuelo + auto + hotel vía socio",
    publishedAt: "2025-12-01T15:00:00.000Z",
    audienceKeys: ["parejas"],
    budgetBand: "premium",
    seasonKeys: ["summer", "winter"],
    serviceLanguageKeys: ["es"],
    discovery: { featuredBase: 54, sourceTrust: 1, completeness: 0.79 },
  },
  {
    kind: "business",
    id: "biz-2",
    imageSrc: "https://images.unsplash.com/photo-1592405204553-2e719cb02c48?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Selva tropical",
    businessName: "Pura Vida Escapes",
    offerTitle: "Arenal + Manuel Antonio en familia",
    destination: "Costa Rica",
    destSlugs: ["costa-rica"],
    departureCity: "San José (SJO)",
    duration: "7 días · 6 noches",
    durationKey: "week",
    price: "Desde $1,420 / persona",
    includedSummary: "Hoteles, desayuno, transporte privado, entradas parque.",
    whatsapp: "+506 8888 1234",
    href: "/clasificados/viajes/oferta/cr-familia-arenal-manuel",
    tripTypeKeys: ["tours", "actividades", "transporte"],
    ctaHint: "WhatsApp al operador local",
    publishedAt: "2025-11-20T11:00:00.000Z",
    audienceKeys: ["familias"],
    budgetBand: "moderado",
    seasonKeys: ["spring", "summer", "fall"],
    serviceLanguageKeys: ["es", "bilingual"],
    discovery: { featuredBase: 56, sourceTrust: 1.08, completeness: 0.9 },
  },
  {
    kind: "affiliate",
    id: "aff-3",
    imageSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Piscina infinita resort",
    inventoryLabel: "Reserva con socio",
    title: "Riviera Maya · todo incluido 5★",
    destination: "Playa del Carmen",
    destSlugs: ["playa-del-carmen", "riviera-maya"],
    priceFrom: "Desde $799 / persona",
    duration: "5 días · 4 noches",
    durationKey: "week",
    departureContext: "Vuelo desde Oakland",
    href: "/clasificados/viajes/oferta/riviera-todo-incluido",
    tripTypeKeys: ["resorts", "ultimo-minuto"],
    affiliateNote: "Checkout en sitio del socio",
    publishedAt: "2025-11-28T08:00:00.000Z",
    audienceKeys: ["familias", "parejas"],
    budgetBand: "moderado",
    seasonKeys: ["winter"],
    serviceLanguageKeys: ["es", "en"],
    discovery: { featuredBase: 57, sourceTrust: 1, completeness: 0.8 },
  },
  {
    kind: "business",
    id: "biz-3",
    imageSrc: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Lago y montañas",
    businessName: "Bay Travel Co.",
    offerTitle: "Lago Tahoe · fin de semana",
    destination: "California / Nevada",
    destSlugs: ["tahoe", "yosemite"],
    departureCity: "Oakland",
    duration: "3 días · 2 noches",
    durationKey: "short",
    price: "$389 / persona",
    includedSummary: "Cabaña, kayak incluido, guía bilingüe opcional.",
    href: "/clasificados/viajes/oferta/tahoe-fin-semana",
    tripTypeKeys: ["fin-de-semana", "escapada", "actividades"],
    ctaHint: "Correo al anunciante",
    publishedAt: "2025-12-05T14:20:00.000Z",
    audienceKeys: ["parejas", "grupos"],
    budgetBand: "economico",
    seasonKeys: ["winter", "spring"],
    serviceLanguageKeys: ["bilingual"],
    discovery: { featuredBase: 49, sourceTrust: 1, completeness: 0.75 },
  },
  {
    kind: "affiliate",
    id: "aff-car-1",
    imageSrc: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Auto en carretera costera",
    inventoryLabel: "Socio de viaje",
    title: "Renta de auto · Cancún aeropuerto (CUN)",
    destination: "Cancún, México",
    destSlugs: ["cancun"],
    priceFrom: "Desde $32 / día",
    duration: "Mínimo 3 días",
    durationKey: "short",
    departureContext: "Recogida en CUN · salidas desde SFO/SJC con vuelo aparte",
    href: "/clasificados/viajes/oferta/cancun-renta-auto",
    tripTypeKeys: ["renta-autos", "transporte"],
    affiliateNote: "Tarifas del proveedor de renta; Leonix no cobra la reserva aquí",
    publishedAt: "2025-10-10T10:00:00.000Z",
    budgetBand: "economico",
    seasonKeys: ["spring", "summer"],
    discovery: { featuredBase: 45, sourceTrust: 1, completeness: 0.7 },
  },
  {
    kind: "affiliate",
    id: "aff-4",
    imageSrc: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Mar en Los Cabos",
    inventoryLabel: "Socio de viaje",
    title: "Los Cabos · snorkel y El Arco",
    destination: "Baja California Sur, México",
    destSlugs: ["los-cabos", "cabo"],
    priceFrom: "Desde $129 / persona",
    duration: "Medio día",
    durationKey: "short",
    departureContext: "Marina Cabo · vuelos a SJD",
    href: "/clasificados/viajes/oferta/los-cabos-snorkel",
    tripTypeKeys: ["tours", "actividades", "dia"],
    affiliateNote: "Reserva en sitio del socio · Leonix puede recibir comisión",
    publishedAt: "2025-11-15T16:00:00.000Z",
    audienceKeys: ["familias", "parejas"],
    budgetBand: "economico",
    seasonKeys: ["summer"],
    discovery: { featuredBase: 50, sourceTrust: 1, completeness: 0.72 },
  },
  {
    kind: "affiliate",
    id: "aff-5",
    imageSrc: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Viñedos Napa",
    inventoryLabel: "Oferta especial",
    title: "Napa Valley · boutique y viñedos",
    destination: "Napa & Sonoma, CA",
    destSlugs: ["napa", "sonoma", "santa-cruz"],
    priceFrom: "Desde $489 / persona",
    duration: "3 días · 2 noches",
    durationKey: "short",
    departureContext: "Por carretera desde Bahía",
    href: "/clasificados/viajes/oferta/napa-valley-escape",
    tripTypeKeys: ["fin-de-semana", "hoteles", "tours"],
    affiliateNote: "Paquete vía socio · no es reserva directa en Leonix",
    publishedAt: "2025-09-22T12:00:00.000Z",
    audienceKeys: ["parejas", "grupos"],
    budgetBand: "moderado",
    seasonKeys: ["fall", "summer"],
    discovery: { featuredBase: 51, sourceTrust: 1, completeness: 0.77 },
  },
  {
    kind: "editorial",
    id: "edi-1",
    imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Canales europeos",
    title: "Primer viaje a Europa con niños",
    dek: "Ciudades caminables, tramos cortos en tren y hoteles con espacio para maletas.",
    destinationLabel: "Europa · inspiración",
    destSlugs: ["europa"],
    href: "/clasificados/viajes/resultados?t=tours&audience=familias",
    tripTypeKeys: ["tours"],
    audienceKeys: ["familias"],
    publishedAt: "2025-08-01T08:00:00.000Z",
    durationKey: "week",
    seasonKeys: ["spring", "summer"],
    discovery: { featuredBase: 22, sourceTrust: 1, completeness: 0.95 },
  },
];
