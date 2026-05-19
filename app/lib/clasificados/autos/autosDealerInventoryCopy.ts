import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";

/** Inventory Boost: +10 active vehicles for $129/month (copy only — no payment in A4.1). */
export const INVENTORY_BOOST_ADDITIONAL_VEHICLES = 10;
export const INVENTORY_BOOST_MONTHLY_USD = 129;

export function autosDealerInventoryUpgradePitch(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Tu paquete Autos Negocio incluye hasta 10 vehículos activos. ¿Necesitas más espacio? Agrega 10 vehículos adicionales por $${INVENTORY_BOOST_MONTHLY_USD} al mes.`
    : `Your Autos Negocio package includes up to 10 active vehicles. Need more space? Add ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional vehicles for $${INVENTORY_BOOST_MONTHLY_USD}/month.`;
}

export function autosDealerInventoryLimitMessage(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Has llegado al límite de 10 vehículos activos. Desactiva un vehículo actual o solicita agregar 10 espacios adicionales por $${INVENTORY_BOOST_MONTHLY_USD} al mes.`
    : `You have reached the 10 active vehicle limit. Deactivate a current vehicle or request ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional slots for $${INVENTORY_BOOST_MONTHLY_USD}/month.`;
}

/** Safe placeholder CTA — no Stripe in this gate. */
export function autosDealerInventoryUpgradeCtaLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Solicitar más espacio" : "Request more slots";
}

export function autosDealerInventoryUpgradeContactHref(lang: AutosClassifiedsLang): string {
  const subject = encodeURIComponent(lang === "es" ? "Autos Negocio — más inventario" : "Autos Negocio — more inventory");
  const body = encodeURIComponent(autosDealerInventoryUpgradePitch(lang));
  return `mailto:soporte@elaguila.com?subject=${subject}&body=${body}`;
}
