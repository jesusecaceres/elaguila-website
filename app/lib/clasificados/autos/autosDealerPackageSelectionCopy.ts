import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT,
  AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD,
  BASE_AUTOS_NEGOCIO_MONTHLY_USD,
  INVENTORY_BOOST_ADDITIONAL_VEHICLES,
  INVENTORY_BOOST_MONTHLY_USD,
} from "./autosDealerInventoryCopy";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

export function autosDealerPackageBaseTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Paquete Dealer base" : "Base Dealer Package";
}

export function autosDealerPackageBoostTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Paquete de inventario" : "Inventory Boost";
}

export function autosDealerPackageBoostSelectedBadge(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Paquete de inventario seleccionado" : "Inventory Boost selected";
}

export function autosDealerPackageAddBoostCta(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Agregar 10 espacios por $${INVENTORY_BOOST_MONTHLY_USD}/mes`
    : `Add 10 slots for $${INVENTORY_BOOST_MONTHLY_USD}/month`;
}

export function autosDealerPackageRemoveBoostCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Quitar paquete de inventario" : "Remove inventory boost";
}

export function autosDealerPackageTotalMonthlyLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Total mensual" : "Total monthly";
}

export function autosDealerPackageBaseMonthlyPrice(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `$${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/mes`
    : `$${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/month`;
}

export function autosDealerPackageBoostMonthlyPrice(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `+$${INVENTORY_BOOST_MONTHLY_USD}/mes`
    : `+$${INVENTORY_BOOST_MONTHLY_USD}/month`;
}

export function autosDealerPackageTotalMonthlyPrice(boostSelected: boolean, lang: AutosClassifiedsLang): string {
  const total = boostSelected
    ? AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD
    : BASE_AUTOS_NEGOCIO_MONTHLY_USD;
  return lang === "es" ? `$${total}/mes` : `$${total}/month`;
}

export function autosDealerPackageActiveVehicleLimitLine(boostSelected: boolean, lang: AutosClassifiedsLang): string {
  const limit = boostSelected
    ? AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT
    : STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT;
  return lang === "es"
    ? `Incluye hasta ${limit} vehículos activos`
    : `Includes up to ${limit} active vehicles`;
}

export function autosDealerPackageBoostAddsLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Agrega ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} espacios adicionales de vehículos activos`
    : `Adds ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional active vehicle slots`;
}

export function autosDealerPackageSelectionHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Selecciona el paquete de inventario aquí antes del pago. No se cobra hasta después de la vista previa."
    : "Select the inventory pack here before payment. You are not charged until after preview.";
}

export function autosDealerPackageReviewPaymentNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "El pago se completa después de la vista previa. El paquete de inventario solo se incluye si está seleccionado."
    : "Payment is completed after preview. Inventory Boost is included only if selected.";
}

export function autosDealerPackageReviewSectionTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Resumen del paquete" : "Package summary";
}
