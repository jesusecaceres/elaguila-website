/**
 * Dashboard Restaurante coupon add-on checkout — add-on-only ($99/mo), no base plan.
 * Gate REVENUE-OS-GLOBAL-RETURN-SAFETY-PLUS-RESTAURANTES-ADDON-ONLY-01
 */

import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";

export type RestauranteDashboardCouponAddonCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export function restauranteCouponAddonUpgradeLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Activar módulo de cupones ($99/mes)" : "Enable coupon module ($99/mo)";
}

export function restauranteCouponAddonUpgradeBusyLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export async function startRestauranteDashboardCouponAddonCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: "es" | "en";
  customerEmail?: string | null;
}): Promise<RestauranteDashboardCouponAddonCheckoutResult> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Se requiere un anuncio publicado para activar el módulo de cupones."
          : "A published listing is required to enable the coupon module.",
    };
  }

  const returnPath = buildDashboardMisAnunciosReturnPath(input.lang, "restaurantes");
  const checkout = await startRevenueCategoryCheckout({
    category: RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT.category,
    packageKey: RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT.packageKey,
    listingId,
    leonixAdId: input.leonixAdId?.trim() || null,
    returnPath,
    locale: input.lang,
    customerEmail: input.customerEmail,
  });

  if (!checkout.ok || !checkout.checkoutUrl?.trim()) {
    return {
      ok: false,
      userMessage: checkout.ok ? revenueCategoryCheckoutErrorMessage(input.lang) : checkout.userMessage,
    };
  }

  return { ok: true, checkoutUrl: checkout.checkoutUrl.trim() };
}

export async function redirectRestauranteDashboardCouponAddonCheckout(
  input: Parameters<typeof startRestauranteDashboardCouponAddonCheckout>[0],
): Promise<RestauranteDashboardCouponAddonCheckoutResult> {
  const result = await startRestauranteDashboardCouponAddonCheckout(input);
  if (result.ok) {
    redirectToRevenueCategoryCheckout(result.checkoutUrl);
  }
  return result;
}

export function restaurantListingJsonCouponEnabled(listingJson: unknown): boolean {
  if (!listingJson || typeof listingJson !== "object") return false;
  return (listingJson as Record<string, unknown>).couponUpgradeEnabled === true;
}

export function restaurantCouponAddonUpgradeEligible(input: {
  status: string;
  listingJson?: unknown;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;
  return !restaurantListingJsonCouponEnabled(input.listingJson);
}
