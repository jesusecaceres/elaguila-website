import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import type { AutosDealerInventoryCount } from "./autosDealerInventoryPolicy";
import {
  BASE_AUTOS_NEGOCIO_MONTHLY_USD,
  INVENTORY_BOOST_ADDITIONAL_VEHICLES,
  INVENTORY_BOOST_MONTHLY_USD,
  autosDealerInventoryBasePackageLine,
  autosDealerInventoryLimitMessage,
  autosDealerInventoryTotalWithBoostLine,
} from "./autosDealerInventoryCopy";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

export function autosDealerInventoryDrawerTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Inventario del dealer" : "Dealer inventory";
}

export function autosDealerInventoryDrawerClose(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Cerrar" : "Close";
}

export function autosDealerInventoryActiveCountLine(
  lang: AutosClassifiedsLang,
  counts: AutosDealerInventoryCount,
): string {
  return lang === "es"
    ? `${counts.activeCount} / ${counts.limit} vehículos activos`
    : `${counts.activeCount} / ${counts.limit} active vehicles`;
}

export function autosDealerInventoryRemainingSlotsLine(
  lang: AutosClassifiedsLang,
  counts: AutosDealerInventoryCount,
): string {
  return lang === "es"
    ? `Te quedan ${counts.remainingSlots} espacios disponibles`
    : `You have ${counts.remainingSlots} slots remaining`;
}

export function autosDealerInventoryDrawerValueBullets(lang: AutosClassifiedsLang): string[] {
  return lang === "es"
    ? [
        "Cada vehículo tiene su propia ficha",
        "Cada vehículo recibe su propio Leonix Ad ID",
        "Aparece en búsqueda y resultados",
        "Se puede editar o desactivar individualmente",
        "Se agrupa bajo el inventario del dealer",
      ]
    : [
        "Each vehicle has its own listing page",
        "Each vehicle gets its own Leonix Ad ID",
        "Shows in search and results",
        "Can be edited or deactivated individually",
        "Grouped under your dealer inventory",
      ];
}

export function autosDealerInventoryDrawerBasePackageLine(lang: AutosClassifiedsLang): string {
  return autosDealerInventoryBasePackageLine(lang);
}

export function autosDealerInventoryDrawerUpgradeLine(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `¿Necesitas más espacio? Agrega ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} vehículos adicionales por $${INVENTORY_BOOST_MONTHLY_USD} al mes.`
    : `Need more space? Add ${INVENTORY_BOOST_ADDITIONAL_VEHICLES} additional vehicles for $${INVENTORY_BOOST_MONTHLY_USD}/month.`;
}

export function autosDealerInventoryDrawerAtLimitTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Límite de inventario alcanzado" : "Inventory limit reached";
}

export function autosDealerInventoryDrawerAtLimitBody(lang: AutosClassifiedsLang): string {
  return autosDealerInventoryLimitMessage(lang);
}

export function autosDealerInventoryDrawerPlanFootnote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Plan base $${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/mes · hasta ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} activos. ${autosDealerInventoryTotalWithBoostLine("es")}`
    : `Base plan $${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/mo · up to ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} active. ${autosDealerInventoryTotalWithBoostLine("en")}`;
}
