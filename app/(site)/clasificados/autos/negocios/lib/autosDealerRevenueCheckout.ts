import {
  AUTOS_DEALER_CHECKPOINT_CONFIRMATIONS,
  AUTOS_DEALER_BASE_INCLUDED_VEHICLES,
  AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES,
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_MONTHLY_PACKAGE_KEY,
  AUTOS_DEALER_QUICK_INCLUDED_VEHICLES,
  AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT,
  type PublishCheckpointAddOn,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  AUTOS_DEALER_CHECKOUT,
  AUTOS_DEALER_QUICK_CHECKOUT,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { validateRevenuePromoForCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";

/**
 * BASE (Quick / SIMPLE) is the smaller dealer product: up to five active vehicles and NO inventory pack. Every
 * helper below takes the plan so the add-on can never be attached to a Quick checkout — that is
 * the one path by which a $99 dealer could otherwise reach the Full ten-vehicle allowance.
 */
export function autosDealerInventoryAddOnSelected(totalVehicleCount: number, quickPlan = false): boolean {
  return !quickPlan && totalVehicleCount > AUTOS_DEALER_BASE_INCLUDED_VEHICLES;
}

export function autosDealerSelectedAddOns(
  totalVehicleCount: number,
  quickPlan = false,
): Array<{ key: string; quantity: 1 }> {
  return autosDealerInventoryAddOnSelected(totalVehicleCount, quickPlan)
    ? [{ key: AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }]
    : [];
}

export function autosDealerCheckoutSubtotalCents(totalVehicleCount: number, quickPlan = false): number {
  const base = getRevenuePackageDefinition(autosDealerPackageKeyForPlan(quickPlan))?.priceCents ?? 0;
  const addOn = getRevenuePackageDefinition(AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY)?.priceCents ?? 0;
  return base + (autosDealerInventoryAddOnSelected(totalVehicleCount, quickPlan) ? addOn : 0);
}

function autosDealerPackageKeyForPlan(quickPlan: boolean): string {
  return quickPlan ? AUTOS_DEALER_QUICK_CHECKOUT.packageKey : AUTOS_DEALER_MONTHLY_PACKAGE_KEY;
}

export function autosDealerPreviewCheckpointConfig(input: {
  lang: "es" | "en";
  totalVehicleCount: number;
  quickPlan?: boolean;
}): PublishCheckpointConfig {
  const quickPlan = Boolean(input.quickPlan);
  const baseDef = getRevenuePackageDefinition(autosDealerPackageKeyForPlan(quickPlan));
  const addOnDef = getRevenuePackageDefinition(AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
  const selected = autosDealerInventoryAddOnSelected(input.totalVehicleCount, quickPlan);
  // Quick is never offered the pack at all, so the row is absent rather than present-and-unchecked.
  const addOns: PublishCheckpointAddOn[] = quickPlan
    ? []
    : [
        {
          id: "autos_dealer_inventory_pack",
          labelEn: "Dealer inventory pack",
          labelEs: "Paquete de inventario dealer",
          priceCents: addOnDef?.priceCents ?? 0,
          selected,
          detailEn: `Adds ${AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES} active vehicle slots (${AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT} total).`,
          detailEs: `Agrega ${AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES} espacios de vehiculos activos (${AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT} total).`,
        },
      ];

  const includedVehicles: number = quickPlan ? AUTOS_DEALER_QUICK_INCLUDED_VEHICLES : AUTOS_DEALER_BASE_INCLUDED_VEHICLES;

  return {
    category: AUTOS_DEALER_CHECKOUT.category,
    packageKey: autosDealerPackageKeyForPlan(quickPlan),
    lang: input.lang,
    mode: "checkout",
    pipeline: "negocios",
    baseLineItem: {
      labelEn: quickPlan ? "Autos dealer Quick monthly" : "Autos dealer monthly",
      labelEs: quickPlan ? "Dealer de autos Quick mensual" : "Dealer de autos mensual",
      priceCents: baseDef?.priceCents ?? 0,
      detailEn: `Includes ${includedVehicles} active vehicle${includedVehicles === 1 ? "" : "s"}.`,
      detailEs: `Incluye ${includedVehicles} vehiculo${includedVehicles === 1 ? "" : "s"} activo${includedVehicles === 1 ? "" : "s"}.`,
    },
    addOns,
    childInventoryCount: Math.max(0, input.totalVehicleCount - 1),
    confirmations: AUTOS_DEALER_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: baseDef?.promoEligible ?? true,
    returnPath: AUTOS_DEALER_CHECKOUT.returnPath,
  };
}

export async function applyAutosDealerPreviewPromoCode(input: {
  code: string;
  lang: "es" | "en";
  totalVehicleCount: number;
  quickPlan?: boolean;
}): Promise<{ ok: true; discountCents: number; message: string } | { ok: false; message: string }> {
  const quickPlan = Boolean(input.quickPlan);
  const addOns = autosDealerSelectedAddOns(input.totalVehicleCount, quickPlan);
  const subtotalCents = autosDealerCheckoutSubtotalCents(input.totalVehicleCount, quickPlan);
  const result = await validateRevenuePromoForCheckout({
    code: input.code,
    category: AUTOS_DEALER_CHECKOUT.category,
    packageKey: autosDealerPackageKeyForPlan(quickPlan),
    subtotalCents,
    addOns,
    locale: input.lang,
  });
  if (!result.ok) return { ok: false, message: result.userMessage };
  return {
    ok: true,
    discountCents: result.discountCents,
    message:
      input.lang === "es"
        ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}/mes`
        : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}/mo`,
  };
}

export const AUTOS_DEALER_PREVIEW_RULES_MODAL = {
  titleEn: "Leonix autos dealer rules",
  titleEs: "Reglas de dealer de autos en Leonix",
  bulletsEn: [
    "One base dealer package covers one dealer/business parent listing.",
    "The base package includes 10 active vehicles.",
    "The inventory pack adds 10 additional active vehicle slots only after payment.",
    "Inventory access is activated by verified payment, not by browser state.",
    "Vehicle details, photos, VIN, mileage, prices, and contact information must be accurate.",
  ],
  bulletsEs: [
    "Un paquete base cubre un dealer/negocio principal.",
    "El paquete base incluye 10 vehiculos activos.",
    "El paquete de inventario agrega 10 espacios activos adicionales solo despues del pago.",
    "El acceso a inventario se activa con pago verificado, no con estado del navegador.",
    "Detalles, fotos, VIN, millaje, precios y contacto de vehiculos deben ser correctos.",
  ],
};

export const AUTOS_DEALER_NEWSLETTER_INTERESTS = [
  "package:autos_dealer_monthly",
  "package:autos_dealer_inventory_pack_monthly",
  "category:autos",
  "seller:dealer",
];
