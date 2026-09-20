import type { ViajesEditorialCardModel } from "./viajesHomeFeedTypes";

export const VIAJES_EDITORIAL_CARDS: ViajesEditorialCardModel[] = [
  {
    id: "ed-1",
    title: "Primer viaje a Europa con niños",
    dek: "Ciudades caminables, tramos cortos en tren y hoteles con espacio para maletas.",
    readTime: "6 min",
    imageSrc: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Canales europeos",
    href: "/clasificados/viajes/resultados?t=tours&audience=familias",
  },
  {
    id: "ed-2",
    title: "Cómo leer una oferta “todo incluido”",
    dek: "Propinas, deportes motorizados y cenas especiales: qué suele quedar fuera.",
    readTime: "5 min",
    imageSrc: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Resort con piscina",
    href: "/clasificados/viajes/resultados?t=resorts",
  },
  {
    id: "ed-3",
    title: "Escapada de 48 h sin rentar auto",
    dek: "Ideas desde la Bahía: playa, viñedos o ciudad con BART, ferry o shuttle.",
    readTime: "4 min",
    imageSrc: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Carretera costera",
    href: "/clasificados/viajes/resultados?t=cerca",
  },
];
