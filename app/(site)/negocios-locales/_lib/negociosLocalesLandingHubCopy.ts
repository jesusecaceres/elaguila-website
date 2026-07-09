import type { SupportedLang } from "@/app/lib/language";

export const NEGOCIOS_LOCALES_LAUNCH_SOURCE = "negocios_locales_launch_25";

export function buildNegociosLocalesNewsletterHref(lang: SupportedLang): string {
  const params = new URLSearchParams({
    lang: lang === "en" ? "en" : "es",
    source: NEGOCIOS_LOCALES_LAUNCH_SOURCE,
    return: "negocios-locales",
  });
  return `/newsletter?${params.toString()}`;
}

export type NegociosFeaturedOfertasCopy = {
  title: string;
  body: string;
  supportLine: string;
  chips: readonly string[];
  browseCta: string;
  publishCta: string;
};

export function getNegociosFeaturedOfertasCopy(lang: SupportedLang): NegociosFeaturedOfertasCopy {
  if (lang === "en") {
    return {
      title: "Promote Your Local Deals",
      body: "Publish coupons, discounts, and promotions to attract customers in your community.",
      supportLine: "A bridge between local businesses and people looking for deals nearby.",
      chips: ["Coupons", "Promos", "Discounts", "Local customers"],
      browseCta: "View deals",
      publishCta: "Publish local deals",
    };
  }
  return {
    title: "Promociona tus Ofertas Locales",
    body: "Publica cupones, descuentos y promociones para atraer clientes de tu comunidad.",
    supportLine: "Un puente entre negocios locales y personas buscando ofertas cerca de ellos.",
    chips: ["Cupones", "Promos", "Descuentos", "Clientes locales"],
    browseCta: "Ver ofertas",
    publishCta: "Publicar ofertas locales",
  };
}

/** Business hub explore CTA — sentence case for card buttons. */
export function getNegociosHubExploreCtaLabel(lang: SupportedLang): string {
  return lang === "en" ? "Explore" : "Explorar";
}
