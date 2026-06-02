import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import {
  AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT,
  AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD,
  BASE_AUTOS_NEGOCIO_MONTHLY_USD,
  INVENTORY_BOOST_ADDITIONAL_VEHICLES,
  INVENTORY_BOOST_MONTHLY_USD,
} from "./autosDealerInventoryCopy";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "./autosDealerInventoryPolicy";

export const AUTOS_INVENTORY_BOOST_RETURN_SESSION_KEY = "lx-autos-inventory-boost-return" as const;

export type AutosInventoryBoostReturnContext = {
  savedAt: string;
  editorPath: string;
  editorSearch: string;
  activeStep?: number;
  parentListingId?: string | null;
  dealerInventoryGroupId?: string | null;
  returnToListingId?: string | null;
  /** Prepared only — no payment or slot unlock in this gate. */
  status: "prepared";
};

export function autosInventoryBoostPanelTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Inventory Boost" : "Inventory Boost";
}

export function autosInventoryBoostPanelIntro(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? `Amplía tu inventario activo más allá de los ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} vehículos incluidos en tu plan Autos Negocio.`
    : `Expand your active inventory beyond the ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} vehicles included in your Autos Negocio plan.`;
}

export function autosInventoryBoostPricingBullets(lang: AutosClassifiedsLang): string[] {
  return lang === "es"
    ? [
        `Plan base: $${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/mes · hasta ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} vehículos activos incluidos`,
        `Inventory Boost: +${INVENTORY_BOOST_ADDITIONAL_VEHICLES} vehículos activos por $${INVENTORY_BOOST_MONTHLY_USD}/mes adicionales`,
        `Total con boost: $${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD}/mes · hasta ${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT} vehículos activos`,
        "Cada vehículo conserva su propia ficha y Leonix Ad ID",
      ]
    : [
        `Base plan: $${BASE_AUTOS_NEGOCIO_MONTHLY_USD}/month · up to ${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} active vehicles included`,
        `Inventory Boost: +${INVENTORY_BOOST_ADDITIONAL_VEHICLES} more active vehicles for an additional $${INVENTORY_BOOST_MONTHLY_USD}/month`,
        `With boost: $${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD}/month · up to ${AUTOS_NEGOCIO_TOTAL_WITH_BOOST_ACTIVE_LIMIT} active vehicles`,
        "Each vehicle keeps its own listing and Leonix Ad ID",
      ];
}

export function autosInventoryBoostPrepareCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Preparar Inventory Boost" : "Prepare Inventory Boost";
}

export function autosInventoryBoostCheckoutSoonMessage(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "El checkout de Inventory Boost estará disponible pronto. Tu solicitud y borrador se mantienen guardados."
    : "Inventory Boost checkout will be available soon. Your request and draft remain saved.";
}

export function autosInventoryBoostNoPaymentNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "No se procesa pago ni se desbloquean espacios adicionales en esta pantalla."
    : "No payment is processed and no extra slots are unlocked on this screen.";
}

export function writeAutosInventoryBoostReturnContext(ctx: AutosInventoryBoostReturnContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTOS_INVENTORY_BOOST_RETURN_SESSION_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

export function readAutosInventoryBoostReturnContext(): AutosInventoryBoostReturnContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTOS_INVENTORY_BOOST_RETURN_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as AutosInventoryBoostReturnContext;
    if (!j?.editorPath || j.status !== "prepared") return null;
    return j;
  } catch {
    return null;
  }
}
