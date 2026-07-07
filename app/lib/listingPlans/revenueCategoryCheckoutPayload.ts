/**
 * Revenue OS category checkout payload constants (browser-safe).
 * Gate STRIPE-REVENUE-OS-CATEGORY-CHECKOUT-WIRING-01
 */

import {
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  type RevenuePackageDefinition,
} from "./revenuePricingMatrix";
import {
  RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
} from "./publishCheckoutCheckpoint";
import { buildDashboardMisAnunciosReturnPath } from "./revenueOsReturnPath";

export const REVENUE_CATEGORY_CHECKOUT_ROUTE = "/api/revenue-os/checkout";

export const RENTAS_CATEGORY_CHECKOUT = {
  category: "rentas",
  packageKey: "rentas_30d",
  returnPath: "/clasificados/rentas",
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

export const EMPLEOS_PAID_JOB_CHECKOUT = {
  category: "empleos",
  packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  returnPath: "/clasificados/empleos",
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

export const AUTOS_PRIVADO_CHECKOUT = {
  category: "autos",
  packageKey: "autos_privado_30d",
  returnPath: "/clasificados/autos",
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

/** Bienes Raíces negocio / agent business — monthly subscription (Revenue OS matrix). */
export const BIENES_RAICES_NEGOCIO_CHECKOUT = {
  category: "bienes-raices",
  packageKey: "br_agent_monthly",
  returnPath: "/clasificados/bienes-raices",
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

/** Restaurantes established restaurant — monthly subscription (Revenue OS matrix). */
export const RESTAURANTES_BASE_CHECKOUT = {
  category: "restaurantes",
  packageKey: "restaurantes_base_monthly",
  returnPath: "/clasificados/restaurantes",
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

/** Dashboard add-on-only — coupon module on an existing published Restaurante listing ($99/mo). */
export const RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT = {
  category: "restaurantes",
  packageKey: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
  returnPath: buildDashboardMisAnunciosReturnPath("es", "restaurantes"),
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

/** Dashboard add-on-only — offers/coupons module on an existing published Servicios listing ($99/mo). */
export const SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT = {
  category: "servicios",
  packageKey: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
  returnPath: buildDashboardMisAnunciosReturnPath("es", "servicios"),
} as const satisfies Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">;

export type RevenueCheckoutAddOnPayload = {
  key: string;
  quantity?: number;
};

export type RevenueCategoryCheckoutPayload = {
  category: string;
  packageKey: string;
  /** Live listing id when row exists (e.g. pending_payment). */
  listingId?: string | null;
  /** Draft id when listing row does not exist yet (e.g. restaurant session draft). */
  listingDraftId?: string | null;
  leonixAdId?: string | null;
  returnPath: string;
  locale?: "es" | "en";
  customerEmail?: string | null;
  promoCode?: string | null;
  /** Server-validated add-on keys only — prices resolved server-side. */
  addOns?: RevenueCheckoutAddOnPayload[];
};

export function buildRevenueCategoryCheckoutBody(
  input: RevenueCategoryCheckoutPayload,
): Record<string, unknown> {
  const listingId = input.listingId?.trim();
  const listingDraftId = input.listingDraftId?.trim();
  return {
    category: input.category,
    packageKey: input.packageKey,
    ...(listingId ? { listingId } : {}),
    ...(listingDraftId ? { listingDraftId } : {}),
    ...(input.leonixAdId?.trim() ? { leonixAdId: input.leonixAdId.trim() } : {}),
    returnPath: input.returnPath,
    locale: input.locale ?? "es",
    ...(input.customerEmail?.trim() ? { customerEmail: input.customerEmail.trim() } : {}),
    ...(input.promoCode?.trim() ? { promoCode: input.promoCode.trim() } : {}),
    ...(input.addOns?.length
      ? {
          addOns: input.addOns.map((a) => ({
            key: String(a.key ?? "").trim().toLowerCase(),
            ...(a.quantity != null ? { quantity: Math.max(1, Math.floor(Number(a.quantity))) } : {}),
          })),
        }
      : {}),
  };
}
