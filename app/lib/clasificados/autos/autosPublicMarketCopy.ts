import type { AutosPublicLang } from "@/app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy";
import type { AutosPublicMarket } from "./autosPublicMarket";

export type AutosPublicMarketCopy = {
  title: string;
  tagline: string;
  heroHeading: string;
  heroSubhead: string;
  browseAll: string;
  postAd: string;
  peerCrossLinkTitle: string;
  peerCrossLinkBody: string;
  peerCrossLinkCta: string;
  resultsTitle: string;
  resultsSubtitle: string;
};

const COPY: Record<AutosPublicMarket, Record<AutosPublicLang, AutosPublicMarketCopy>> = {
  private: {
    es: {
      title: "Autos",
      tagline: "Autos de vendedores privados y oportunidades locales en NorCal.",
      heroHeading: "Encuentra tu próximo auto de vendedor privado",
      heroSubhead:
        "Explora autos publicados por personas locales con precio, millaje y ubicación visibles.",
      browseAll: "Ver autos de particulares",
      postAd: "Publicar mi auto",
      peerCrossLinkTitle: "¿Buscas inventario de agencia?",
      peerCrossLinkBody: "Explora Dealers de Autos con inventario de negocios y concesionarios.",
      peerCrossLinkCta: "Ir a Dealers de Autos",
      resultsTitle: "Autos de vendedores privados",
      resultsSubtitle: "Inventario publicado por particulares en Leonix Autos.",
    },
    en: {
      title: "Autos",
      tagline: "Private seller vehicles and local buying opportunities in NorCal.",
      heroHeading: "Find your next private seller vehicle",
      heroSubhead: "Browse cars posted by local private sellers with price, mileage, and location visible.",
      browseAll: "Browse private seller vehicles",
      postAd: "Post my vehicle",
      peerCrossLinkTitle: "Looking for dealership inventory?",
      peerCrossLinkBody: "Browse Dealers de Autos for business and dealership listings.",
      peerCrossLinkCta: "Go to Dealers de Autos",
      resultsTitle: "Private seller vehicles",
      resultsSubtitle: "Inventory posted by private sellers on Leonix Autos.",
    },
  },
  dealer: {
    es: {
      title: "Dealers de Autos",
      tagline: "Inventario de agencias y negocios de autos en NorCal.",
      heroHeading: "Inventario de dealers y negocios de autos",
      heroSubhead:
        "Explora vehículos de concesionarios y negocios con precio, millaje y ubicación visibles.",
      browseAll: "Ver inventario de dealers",
      postAd: "Publicar como dealer",
      peerCrossLinkTitle: "¿Buscas autos de particulares?",
      peerCrossLinkBody: "Explora Autos para vendedores privados y oportunidades locales.",
      peerCrossLinkCta: "Ver Autos privados",
      resultsTitle: "Dealers de Autos",
      resultsSubtitle: "Inventario de agencias y negocios en Leonix Autos.",
    },
    en: {
      title: "Dealers de Autos",
      tagline: "Dealership and auto business inventory in NorCal.",
      heroHeading: "Dealer and auto business inventory",
      heroSubhead: "Browse dealership and business vehicles with price, mileage, and location visible.",
      browseAll: "Browse dealer inventory",
      postAd: "Post as dealer",
      peerCrossLinkTitle: "Looking for private seller vehicles?",
      peerCrossLinkBody: "Browse Autos for private sellers and local opportunities.",
      peerCrossLinkCta: "View private Autos",
      resultsTitle: "Dealers de Autos",
      resultsSubtitle: "Dealership and business inventory on Leonix Autos.",
    },
  },
};

export function getAutosPublicMarketCopy(market: AutosPublicMarket, lang: AutosPublicLang): AutosPublicMarketCopy {
  return COPY[market][lang];
}
