/**
 * Revenue OS category checkout payload constants (browser-safe).
 * Gate STRIPE-REVENUE-OS-CATEGORY-CHECKOUT-WIRING-01
 */

import {
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  type RevenuePackageDefinition,
} from "./revenuePricingMatrix";

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
  };
}
