import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
} from "./autosDealerInventoryPolicy";

export function autosNegociosInventoryBoostRequiredMessage(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Tienes más de 10 vehículos en esta solicitud. Activa Inventory Boost para publicar hasta 20 vehículos."
    : "You have more than 10 vehicles in this application. Activate Inventory Boost to publish up to 20 vehicles.";
}

export function autosNegociosInventoryOverMaxMessage(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Esta solicitud supera el máximo de ${BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT} vehículos activos. Quita vehículos adicionales para continuar.`
    : `This application exceeds the maximum of ${BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT} active vehicles. Remove additional vehicles to continue.`;
}

export function validateNegociosApplicationPublishInventory(input: {
  totalVehicles: number;
  boostActive: boolean;
  lang: AutosClassifiedsLang;
}): { ok: true } | { ok: false; error: string; message: string } {
  const total = Math.max(0, Math.floor(input.totalVehicles));
  if (total > BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT) {
    return {
      ok: false,
      error: "dealer_application_inventory_over_max",
      message: autosNegociosInventoryOverMaxMessage(input.lang),
    };
  }
  if (total > STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT && !input.boostActive) {
    return {
      ok: false,
      error: "dealer_inventory_boost_required",
      message: autosNegociosInventoryBoostRequiredMessage(input.lang),
    };
  }
  return { ok: true };
}
