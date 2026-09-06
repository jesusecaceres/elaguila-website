import type { ViajesEditorialCardModel } from "./viajesHomeFeedTypes";

export const VIAJES_EDITORIAL_CARDS: ViajesEditorialCardModel[] = [
  {
    id: "ed-1",
    title: "Primer viaje a Europa con niños",
    dek: "Ciudades caminables, tramos cortos en tren y hoteles con espacio para maletas.",
    readTime: "6 min",
    imageSrc: "/child-categories/viajes/editorial-canals.jpg",
    imageAlt: "Canales europeos",
    href: "/clasificados/viajes/resultados?t=tours&audience=familias",
  },
  {
    id: "ed-2",
    title: "Cómo leer una oferta “todo incluido”",
    dek: "Propinas, deportes motorizados y cenas especiales: qué suele quedar fuera.",
    readTime: "5 min",
    imageSrc: "/child-categories/viajes/editorial-resort-pool.jpg",
    imageAlt: "Resort con piscina",
    href: "/clasificados/viajes/resultados?t=resorts",
  },
  {
    id: "ed-3",
    title: "Escapada de 48 h sin rentar auto",
    dek: "Ideas desde la Bahía: playa, viñedos o ciudad con BART, ferry o shuttle.",
    readTime: "4 min",
    imageSrc: "/child-categories/viajes/near.jpg",
    imageAlt: "Carretera costera",
    href: "/clasificados/viajes/resultados?t=cerca",
  },
];
