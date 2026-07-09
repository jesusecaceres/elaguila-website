import type { SupportedLang } from "@/app/lib/language";

export type BusinessLaneKey =
  | "ofertas-locales"
  | "servicios"
  | "restaurantes"
  | "comida-local"
  | "autos-dealer"
  | "bienes-raices";

/** Sector grid order — Ofertas Locales featured separately above the grid. */
export const NEGOCIOS_SECTOR_GRID_ORDER: readonly BusinessLaneKey[] = [
  "servicios",
  "restaurantes",
  "comida-local",
  "autos-dealer",
  "bienes-raices",
];

const LANE_EXPLORE_PATH: Record<BusinessLaneKey, string> = {
  "ofertas-locales": "/clasificados/ofertas-locales",
  servicios: "/clasificados/servicios",
  restaurantes: "/clasificados/restaurantes",
  "comida-local": "/clasificados/comida-local",
  "autos-dealer": "/clasificados/autos/results",
  "bienes-raices": "/clasificados/bienes-raices",
};

/** Business publish entry paths — front-door wiring only. */
const LANE_ADVERTISE_PATH: Record<BusinessLaneKey, string> = {
  "ofertas-locales": "/publicar/ofertas-locales",
  servicios: "/clasificados/publicar/servicios",
  restaurantes: "/publicar/restaurantes",
  "comida-local": "/publicar/comida-local",
  "autos-dealer": "/publicar/autos/negocios",
  "bienes-raices": "/clasificados/publicar/bienes-raices",
};

type LaneCopy = {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  noteEs?: string;
  noteEn?: string;
  advertiseEs: string;
  advertiseEn: string;
};

export const NEGOCIOS_LANE_COPY: Record<BusinessLaneKey, LaneCopy> = {
  "ofertas-locales": {
    labelEs: "Ofertas Locales",
    labelEn: "Local Deals",
    descEs: "Cupones, descuentos y promociones para atraer clientes locales.",
    descEn: "Coupons, discounts, and promotions to attract local customers.",
    advertiseEs: "Publicar ofertas locales",
    advertiseEn: "Publish local deals",
  },
  servicios: {
    labelEs: "Servicios",
    labelEn: "Services",
    descEs: "Profesionales y servicios confiables para hogares, negocios y proyectos locales.",
    descEn: "Trusted professionals and services for homes, businesses, and local projects.",
    noteEs: "Perfil de negocio y visibilidad local.",
    noteEn: "Business profile and local visibility.",
    advertiseEs: "Anunciar en Servicios",
    advertiseEn: "Advertise in Services",
  },
  restaurantes: {
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
    descEs: "Restaurantes, cafés y negocios de comida con perfil premium en Leonix.",
    descEn: "Restaurants, cafés, and food businesses with premium Leonix presence.",
    noteEs: "Pipeline de negocio — aplicación de restaurante.",
    noteEn: "Business pipeline — restaurant application.",
    advertiseEs: "Anunciar en Restaurantes",
    advertiseEn: "Advertise in Restaurants",
  },
  "comida-local": {
    labelEs: "Comida Local",
    labelEn: "Local Food",
    descEs: "Puestos, pop-ups, comida casera y vendedores móviles para la comunidad.",
    descEn: "Pop-ups, homemade food, mobile vendors, and local food sellers.",
    advertiseEs: "Publicar tu puesto",
    advertiseEn: "Publish your stand",
  },
  "autos-dealer": {
    labelEs: "Dealers de Autos",
    labelEn: "Auto Dealers",
    descEs: "Concesionarios y negocios de autos para conectar compradores con inventario local.",
    descEn: "Dealerships and auto businesses connecting buyers with local inventory.",
    noteEs: "Pipeline de negocio — no vendedor privado.",
    noteEn: "Business pipeline — not private seller.",
    advertiseEs: "Publicar en Dealers de Autos",
    advertiseEn: "Publish as Auto Dealer",
  },
  "bienes-raices": {
    labelEs: "Bienes Raíces",
    labelEn: "Real Estate",
    descEs: "Agentes, propiedades y vitrinas inmobiliarias para la comunidad.",
    descEn: "Agents, properties, and real estate showcases for the community.",
    advertiseEs: "Anunciar en Bienes Raíces",
    advertiseEn: "Advertise in Real Estate",
  },
};

function appendLangToPath(path: string, lang: SupportedLang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

export function buildNegociosExploreHref(lane: BusinessLaneKey, lang: SupportedLang): string {
  if (lane === "autos-dealer") {
    const params = new URLSearchParams({ lang, seller: "dealer" });
    return `${LANE_EXPLORE_PATH[lane]}?${params.toString()}`;
  }
  return appendLangToPath(LANE_EXPLORE_PATH[lane], lang);
}

export function buildNegociosAdvertiseHref(lane: BusinessLaneKey, lang: SupportedLang): string {
  return appendLangToPath(LANE_ADVERTISE_PATH[lane], lang);
}

export function buildBusinessAdvertiseEntryHref(lang: SupportedLang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}
