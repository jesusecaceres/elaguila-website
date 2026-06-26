/**
 * Gate REST-OFFERS-UPSELL1 — Final review Ofertas Locales combo upsell copy.
 */
import {
  OFERTAS_LOCALES_STANDALONE_MONTHLY_USD,
  RESTAURANTE_OFERTAS_ADDON_VALUE_MONTHLY_USD,
  RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_EN,
  RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_ES,
  RESTAURANTE_OFERTAS_COMBO_SAVINGS_MONTHLY_USD,
  RESTAURANTE_PREMIUM_MONTHLY_USD,
  RESTAURANTE_PREMIUM_OFERTAS_COMBO_MONTHLY_USD,
} from "./restaurantesOffersComboPricing";

export type RestauranteOfertasUpsellLang = "es" | "en";

export function restauranteOfertasLocalesPublishHref(lang: RestauranteOfertasUpsellLang): string {
  return `/publicar/ofertas-locales?lang=${lang}`;
}

export function getRestauranteOfertasLocalesUpsellCopy(lang: RestauranteOfertasUpsellLang) {
  const isEs = lang === "es";
  return {
    heading: isEs ? "Agrega Ofertas Locales a tu Restaurante" : "Add Local Deals to your Restaurant",
    packageName: isEs ? RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_ES : RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_EN,
    optionalLabel: isEs ? "Agrega ofertas y especiales" : "Add offers and specials",
    baseLine: isEs
      ? `Plan Restaurante: $${RESTAURANTE_PREMIUM_MONTHLY_USD}/mes`
      : `Restaurant plan: $${RESTAURANTE_PREMIUM_MONTHLY_USD}/mo`,
    addonLine: isEs
      ? `Agrega Ofertas Locales por +$${RESTAURANTE_OFERTAS_ADDON_VALUE_MONTHLY_USD}/mes`
      : `Add Local Deals for +$${RESTAURANTE_OFERTAS_ADDON_VALUE_MONTHLY_USD}/mo`,
    comboLine: isEs
      ? `Combo recomendado: $${RESTAURANTE_PREMIUM_OFERTAS_COMBO_MONTHLY_USD}/mes`
      : `Recommended bundle: $${RESTAURANTE_PREMIUM_OFERTAS_COMBO_MONTHLY_USD}/mo`,
    savingsLine: isEs
      ? `Ahorras $${RESTAURANTE_OFERTAS_COMBO_SAVINGS_MONTHLY_USD}/mes comparado con comprar Ofertas Locales por separado ($${RESTAURANTE_PREMIUM_MONTHLY_USD} + $${OFERTAS_LOCALES_STANDALONE_MONTHLY_USD}).`
      : `Save $${RESTAURANTE_OFERTAS_COMBO_SAVINGS_MONTHLY_USD}/mo vs buying Local Deals separately ($${RESTAURANTE_PREMIUM_MONTHLY_USD} + $${OFERTAS_LOCALES_STANDALONE_MONTHLY_USD}).`,
    valueLine: isEs
      ? "Publica especiales, cupones y promociones como lunch specials, combos, happy hour, catering discounts o descuentos por tiempo limitado."
      : "Publish specials, coupons, and promos like lunch deals, combos, happy hour, catering discounts, or limited-time offers.",
    cta: isEs ? "Crear oferta local" : "Create local deal",
    helper: isEs
      ? "Puedes crear la oferta después de publicar tu restaurante."
      : "You can create the deal after publishing your restaurant.",
    bullets: isEs
      ? [
          "Especiales de lunch y combos",
          "Happy hour y bebida gratis",
          "Descuentos de catering",
          "Cupones por tiempo limitado",
        ]
      : [
          "Lunch specials and combos",
          "Happy hour and free-drink promos",
          "Catering discounts",
          "Limited-time coupons",
        ],
  };
}
