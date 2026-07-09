import type { SupportedLang } from "@/app/lib/language";

export const CLASIFICADOS_LANDING_LAUNCH_SOURCE = "clasificados_landing_launch_25";

export function buildClasificadosLandingNewsletterHref(lang: SupportedLang): string {
  const params = new URLSearchParams({
    lang: lang === "en" ? "en" : "es",
    source: CLASIFICADOS_LANDING_LAUNCH_SOURCE,
    return: "clasificados",
  });
  return `/newsletter?${params.toString()}`;
}

export type ClasificadosFeaturedOfertasCopy = {
  title: string;
  body: string;
  supportLine: string;
  chips: readonly string[];
  browseCta: string;
  publishCta: string;
};

export function getClasificadosFeaturedOfertasCopy(lang: SupportedLang): ClasificadosFeaturedOfertasCopy {
  if (lang === "en") {
    return {
      title: "Local Deals of the Week",
      body: "Find coupons, discounts, and promotions from businesses near you.",
      supportLine:
        "A place to discover deals, support local businesses, and check back every week.",
      chips: ["Coupons", "Promos", "Discounts", "Local businesses"],
      browseCta: "View deals",
      publishCta: "Publish your local deals",
    };
  }
  return {
    title: "Ofertas Locales de la Semana",
    body: "Encuentra cupones, descuentos y promociones de negocios cerca de ti.",
    supportLine:
      "Un lugar para descubrir ofertas, apoyar negocios locales y volver a revisar cada semana.",
    chips: ["Cupones", "Promos", "Descuentos", "Negocios locales"],
    browseCta: "Ver ofertas",
    publishCta: "Publica tus ofertas locales",
  };
}

/** Directory hub explore CTA — sentence case for card buttons. */
export function getClasificadosHubExploreCtaLabel(lang: SupportedLang): string {
  return lang === "en" ? "Explore" : "Explorar";
}
