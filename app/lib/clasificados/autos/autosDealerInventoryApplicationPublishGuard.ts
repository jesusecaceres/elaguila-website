import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  QUICK_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
} from "./autosDealerInventoryPolicy";

export function autosNegociosQuickInventoryLimitMessage(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Tu plan BASE incluye hasta ${QUICK_DEALER_ACTIVE_VEHICLE_LIMIT} vehículos activos. Mejora a PRO para publicar hasta ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT}.`
    : `Your BASE plan includes up to ${QUICK_DEALER_ACTIVE_VEHICLE_LIMIT} active vehicles. Upgrade to PRO to publish up to ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT}.`;
}

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
  /** PROVEN BASE (Quick) dealer only: capped at the BASE allowance; the pack never lifts it. */
  quick?: boolean;
}): { ok: true } | { ok: false; error: string; message: string } {
  const total = Math.max(0, Math.floor(input.totalVehicles));
  if (input.quick === true) {
    if (total > QUICK_DEALER_ACTIVE_VEHICLE_LIMIT) {
      return {
        ok: false,
        error: "dealer_quick_inventory_limit",
        message: autosNegociosQuickInventoryLimitMessage(input.lang),
      };
    }
    return { ok: true };
  }
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
