import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  INVENTORY_BOOST_ADDITIONAL_VEHICLES,
  INVENTORY_BOOST_MONTHLY_USD,
  autosDealerInventoryBaseMonthlyLine,
  autosDealerInventoryTotalWithBoostLine,
} from "./autosDealerInventoryCopy";
import { autosDealerInventoryDrawerUpgradeLine } from "./autosDealerInventoryDrawerCopy";

export function autosDealerInventoryValueTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Inventario Autos Negocio" : "Autos Business Inventory";
}

export function autosDealerInventoryValueMainVehicleLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Este vehículo será el vehículo principal del dealer."
    : "This vehicle will be the dealer's main vehicle.";
}

export function autosDealerInventoryValueAfterPublishLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Después de publicar el anuncio principal, podrás agregar vehículos adicionales al inventario del dealer."
    : "After publishing the main listing, you can add more vehicles to the dealer inventory.";
}

export function autosDealerInventoryValueLead(lang: AutosClassifiedsLang): string {
  return autosDealerInventoryBaseMonthlyLine(lang);
}

export function autosDealerInventoryValueDetail(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Cada vehículo tiene su propia ficha, fotos, búsqueda, filtros y ID de anuncio Leonix."
    : "Each vehicle gets its own listing page, photos, search/filter visibility, and Leonix ad ID.";
}

export function autosDealerInventoryValueBoost(lang: AutosClassifiedsLang): string {
  return `${autosDealerInventoryDrawerUpgradeLine(lang)} ${autosDealerInventoryTotalWithBoostLine(lang)}`;
}

export function autosDealerInventoryValueBullets(lang: AutosClassifiedsLang): string[] {
  return lang === "es"
    ? [
        "10 vehículos activos incluidos",
        "Página propia por vehículo",
        "leonix_ad_id propio",
        "Visible en búsqueda y resultados",
        "Aparece en panel y admin",
        "Agrupado bajo inventario del dealer",
        `Upgrade: +${INVENTORY_BOOST_ADDITIONAL_VEHICLES} por $${INVENTORY_BOOST_MONTHLY_USD}/mes`,
      ]
    : [
        "10 active vehicles included",
        "Own page per vehicle",
        "Own leonix_ad_id",
        "Shows in search and results",
        "Appears in dashboard and admin",
        "Grouped under dealer inventory",
        `Upgrade: +${INVENTORY_BOOST_ADDITIONAL_VEHICLES} for $${INVENTORY_BOOST_MONTHLY_USD}/month`,
      ];
}

export function autosDealerInventoryAddVehicleCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Agregar vehículo al inventario" : "Add vehicle to inventory";
}

export function autosDealerInventoryAddTenSlotsCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Agregar 10 espacios por $129/mes" : "Add 10 slots for $129/month";
}
