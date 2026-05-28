import { LEONIX_GLOBAL_MAILTO } from "@/app/data/leonixGlobalContact";
import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

/** Autos Negocio base plan (copy only — no payment in this gate). */
export const BASE_AUTOS_NEGOCIO_MONTHLY_USD = 399;

/** Inventory Boost: +10 active vehicles for $129.99/month (copy only — no Stripe in this gate). */
export const INVENTORY_BOOST_ADDITIONAL_VEHICLES = 10;
export const INVENTORY_BOOST_MONTHLY_USD = 129.99;

/** Base + Inventory Boost monthly total with up to 20 active vehicles. */
export const AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD =
  BASE_AUTOS_NEGOCIO_MONTHLY_USD + INVENTORY_BOOST_MONTHLY_USD;

export const AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT =
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT + INVENTORY_BOOST_ADDITIONAL_VEHICLES;

export function autosDealerInventoryBasePackageLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Tu paquete Autos Negocio incluye hasta ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} vehículos activos.`
    : `Your Autos Negocio package includes up to ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} active vehicles.`;
}

export function autosDealerInventoryUpgradePitch(lang: AutosClassifiedsLang): string {
  const boost =
    lang === "es"
      ? `¿Necesitas más espacio? Agrega ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} vehículos adicionales por $${INVENTORY_BOOST_MONTHLY_USD} al mes.`
      : `Need more space? Add ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional vehicles for $${INVENTORY_BOOST_MONTHLY_USD}/month.`;
  return `${autosDealerInventoryBasePackageLine(lang)} ${boost}`;
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
  const body = encodeURIComponent(
    `${autosDealerInventoryUpgradePitch(lang)}\n\n${autosDealerInventoryTotalWithBoostLine(lang)}`,
  );
  return `${LEONIX_GLOBAL_MAILTO}?subject=${subject}&body=${body}`;
}

export function autosDealerInventoryTotalWithBoostLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Con Inventory Boost: $${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD}/mes por hasta ${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT} vehículos activos.`
    : `With Inventory Boost: $${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD}/month for up to ${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT} active vehicles.`;
}

export function autosDealerInventoryRequestBoostCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Solicitar Inventory Boost" : "Request Inventory Boost";
}

export function autosDealerInventoryDrawerContinueCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Agregar vehículo" : "Add vehicle";
}

export function autosDealerInventoryDrawerPaymentNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "La activación del inventario y el Inventory Boost se gestionan con Leonix. No se procesa el pago en esta pantalla."
    : "Inventory activation and Inventory Boost are handled with Leonix. Payment is not processed on this screen.";
}
