import type { ViajesSeasonalCampaignModel } from "./viajesHomeFeedTypes";

export const VIAJES_SEASONAL_CAMPAIGNS: ViajesSeasonalCampaignModel[] = [
  {
    id: "camp-verano",
    headline: "Verano en la playa",
    subline: "Paquetes y resort con salida desde SFO / OAK / SJC",
    theme: "verano",
    offers: [
      {
        id: "s1",
        title: "Cancún · resort frente al mar",
        href: "/clasificados/viajes/oferta/cancun-resort-mar",
        source: "affiliate",
        tag: "Socio",
      },
      {
        id: "s2",
        title: "Riviera Maya 5★ todo incluido",
        href: "/clasificados/viajes/oferta/riviera-todo-incluido",
        source: "affiliate",
        tag: "Oferta",
      },
      {
        id: "s3",
        title: "Puerto Vallarta en familia",
        href: "/clasificados/viajes/resultados?dest=puerto-vallarta&audience=familias",
        source: "business",
        tag: "Comunidad",
      },
    ],
  },
  {
    id: "camp-ultimo",
    headline: "Último minuto",
    subline: "Cupos que rotan rápido — confirma siempre fechas con el anunciante",
    theme: "ultimo-minuto",
    offers: [
      {
        id: "u1",
        title: "Maui boutique · cupo limitado",
        href: "/clasificados/viajes/oferta/maui-boutique",
        source: "affiliate",
        tag: "Socio",
      },
      {
        id: "u2",
        title: "Renta de auto Cancún (CUN)",
        href: "/clasificados/viajes/oferta/cancun-renta-auto",
        source: "affiliate",
        tag: "Renta autos",
      },
    ],
  },
  {
    id: "camp-cruceros",
    headline: "Cruceros del mes",
    subline: "Inspiración para salidas grupales o en pareja",
    theme: "cruceros",
    offers: [
      {
        id: "c1",
        title: "Ver cruceros y tours marítimos",
        href: "/clasificados/viajes/resultados?t=cruceros",
        source: "business",
        tag: "Descubrir",
      },
    ],
  },
];
