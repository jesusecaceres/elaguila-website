/**
 * Gate REST-OFFERS1 — Restaurante Premium + Ofertas Locales combo pricing (copy/strategy only).
 * No Stripe/checkout wiring in this gate.
 */

export const RESTAURANTE_PREMIUM_MONTHLY_USD = 399;
export const OFERTAS_LOCALES_STANDALONE_MONTHLY_USD = 199;
export const RESTAURANTE_PREMIUM_OFERTAS_COMBO_MONTHLY_USD = 499;
export const RESTAURANTE_OFERTAS_ADDON_VALUE_MONTHLY_USD = 100;
export const RESTAURANTE_OFERTAS_COMBO_SAVINGS_MONTHLY_USD =
  RESTAURANTE_PREMIUM_MONTHLY_USD + OFERTAS_LOCALES_STANDALONE_MONTHLY_USD - RESTAURANTE_PREMIUM_OFERTAS_COMBO_MONTHLY_USD;

export const RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_ES = "Restaurante Premium + Ofertas";
export const RESTAURANTE_OFERTAS_COMBO_PACKAGE_NAME_EN = "Restaurante Premium + Specials";

export const RESTAURANTE_OFERTAS_INCLUDED_ACTIVE_OFFERS = 4;
export const RESTAURANTE_OFERTAS_EXTRA_PACK_OFFERS = 4;
/** Launch recommendation — defer $99 standard until post-launch. */
export const RESTAURANTE_OFERTAS_EXTRA_PACK_LAUNCH_MONTHLY_USD = 49;
export const RESTAURANTE_OFERTAS_EXTRA_PACK_STANDARD_MONTHLY_USD = 99;

export const RESTAURANTE_OFERTAS_COMBO_POSITIONING = {
  es: "Agrega ofertas y especiales a tu perfil premium para convertir visitas en clientes.",
  en: "Add offers and specials to your premium profile to turn views into customers.",
} as const;
