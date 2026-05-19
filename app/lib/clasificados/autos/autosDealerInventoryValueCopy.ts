import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  INVENTORY_BOOST_ADDITIONAL_VEHICLES,
  INVENTORY_BOOST_MONTHLY_USD,
} from "./autosDealerInventoryCopy";

export function autosDealerInventoryValueTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Inventario Autos Negocio" : "Autos Negocio inventory";
}

export function autosDealerInventoryValueLead(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Tu paquete Autos Negocio incluye hasta 10 vehículos activos."
    : "Your Autos Negocio package includes up to 10 active vehicles.";
}

export function autosDealerInventoryValueDetail(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Cada vehículo tiene su propia ficha, fotos, búsqueda, filtros y ID de anuncio Leonix."
    : "Each vehicle gets its own listing page, photos, search/filter visibility, and Leonix ad ID.";
}

export function autosDealerInventoryValueBoost(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `¿Necesitas más espacio? Agrega ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} vehículos adicionales por $${INVENTORY_BOOST_MONTHLY_USD} al mes.`
    : `Need more space? Add ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional vehicles for $${INVENTORY_BOOST_MONTHLY_USD}/month.`;
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
  return lang === "es" ? "Agregar 10 espacios" : "Add 10 slots";
}
