/**
 * Gate RESTAURANTES-PENDING-PUBLISH-AND-COUPON-OFFERS-TRUTH-01
 * Launch-safe Ofertas Locales secondary upsell — separate from today's checkout total.
 */
import {
  restauranteOfertasLocalesPublishHref,
  type RestauranteOfertasUpsellLang,
} from "./restaurantesOffersUpsellCopy";

export type { RestauranteOfertasUpsellLang };
export { restauranteOfertasLocalesPublishHref };

export function getRestauranteOfertasLocalesCheckoutSecondaryCopy(lang: RestauranteOfertasUpsellLang) {
  const isEs = lang === "es";
  return {
    optionalLabel: isEs ? "Módulo separado" : "Separate module",
    heading: isEs
      ? "Agrega Ofertas Locales después de publicar tu restaurante"
      : "Add Local Offers after publishing your restaurant",
    body: isEs
      ? "Crea cupones, especiales y promociones para tus clientes desde Ofertas Locales. Este módulo se maneja por separado y no cambia el pago de hoy."
      : "Create coupons, specials, and customer promotions from Local Offers. This module is managed separately and does not change today's checkout.",
    cta: isEs ? "Ver Ofertas Locales" : "View Local Offers",
    helper: isEs
      ? "No cambia el total de pago de hoy ($399/mes del plan Restaurante)."
      : "Does not change today's checkout total ($399/mo restaurant plan).",
    bullets: isEs
      ? [
          "Especiales de lunch y combos",
          "Happy hour y promociones",
          "Descuentos de catering",
          "Cupones por tiempo limitado",
        ]
      : [
          "Lunch specials and combos",
          "Happy hour promotions",
          "Catering discounts",
          "Limited-time coupons",
        ],
  };
}
