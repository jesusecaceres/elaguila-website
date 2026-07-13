import type { SupportedLang } from "@/app/lib/language";
import { launchUiCopyLang } from "@/app/lib/language";

export const CLASIFICADOS_LANDING_LAUNCH_SOURCE = "clasificados_landing_launch_25";

export function buildClasificadosLandingNewsletterHref(lang: SupportedLang): string {
  const params = new URLSearchParams({
    lang,
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
  eyebrow: string;
};

const FEATURED_OFERTAS_COPY = {
  es: {
    eyebrow: "Destacado",
    title: "Ofertas Locales de la Semana",
    body: "Encuentra cupones, descuentos y promociones de negocios cerca de ti.",
    supportLine:
      "Un lugar para descubrir ofertas, apoyar negocios locales y volver a revisar cada semana.",
    chips: ["Cupones", "Promos", "Descuentos", "Negocios locales"],
    browseCta: "Ver ofertas",
    publishCta: "Publica tus ofertas locales",
  },
  en: {
    eyebrow: "Featured",
    title: "Local Deals of the Week",
    body: "Find coupons, discounts, and promotions from businesses near you.",
    supportLine:
      "A place to discover deals, support local businesses, and check back every week.",
    chips: ["Coupons", "Promos", "Discounts", "Local businesses"],
    browseCta: "View deals",
    publishCta: "Publish your local deals",
  },
  pt: {
    eyebrow: "Destaque",
    title: "Ofertas locais da semana",
    body: "Encontre cupons, descontos e promoções de negócios perto de você.",
    supportLine:
      "Um lugar para descobrir ofertas, apoiar negócios locais e voltar a conferir toda semana.",
    chips: ["Cupons", "Promos", "Descontos", "Negócios locais"],
    browseCta: "Ver ofertas",
    publishCta: "Publique suas ofertas locais",
  },
  tl: {
    eyebrow: "Destacado",
    title: "Mga lokal na alok ngayong linggo",
    body: "Maghanap ng mga coupon, diskwento, at promosyon mula sa mga negosyo malapit sa iyo.",
    supportLine:
      "Isang lugar para tumuklas ng mga alok, suportahan ang lokal na negosyo, at bumalik bawat linggo.",
    chips: ["Coupons", "Promos", "Discounts", "Lokal na negosyo"],
    browseCta: "Tingnan ang mga alok",
    publishCta: "Mag-post ng iyong lokal na alok",
  },
} as const;

export function getClasificadosFeaturedOfertasCopy(lang: SupportedLang): ClasificadosFeaturedOfertasCopy {
  return FEATURED_OFERTAS_COPY[launchUiCopyLang(lang)];
}

/** Directory hub explore CTA — sentence case for card buttons. */
export function getClasificadosHubExploreCtaLabel(lang: SupportedLang): string {
  const uiLang = launchUiCopyLang(lang);
  if (uiLang === "en") return "Explore";
  if (uiLang === "tl") return "Tuklasin";
  return "Explorar";
}
