/**
 * Browser client — start Leonix Revenue OS Checkout for category publish flows.
 * Calls POST /api/revenue-os/checkout only; no Stripe secrets, no entitlement mutation.
 * Gate STRIPE-REVENUE-OS-CATEGORY-CHECKOUT-WIRING-01
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  REVENUE_CATEGORY_CHECKOUT_ROUTE,
  buildRevenueCategoryCheckoutBody,
  type RevenueCategoryCheckoutPayload,
} from "./revenueCategoryCheckoutPayload";

export type RevenueCategoryCheckoutStartResult =
  | { ok: true; checkoutUrl: string; paymentRecordId?: string }
  | { ok: false; userMessage: string };

export function revenueCategoryCheckoutErrorMessage(lang: "es" | "en"): string {
  return lang === "es"
    ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
    : "We could not start secure payment. Please try again or contact Leonix.";
}

export function revenueCategoryCheckoutLoadingMessage(lang: "es" | "en"): string {
  return lang === "es" ? "Creando pago seguro…" : "Creating secure checkout…";
}

export async function startRevenueCategoryCheckout(
  input: RevenueCategoryCheckoutPayload,
): Promise<RevenueCategoryCheckoutStartResult> {
  const lang = input.locale === "en" ? "en" : "es";
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return {
      ok: false,
      userMessage: lang === "es" ? "Inicia sesión para continuar al pago." : "Sign in to continue to payment.",
    };
  }

  try {
    const res = await fetch(REVENUE_CATEGORY_CHECKOUT_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildRevenueCategoryCheckoutBody(input)),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      checkoutUrl?: string;
      paymentRecordId?: string;
      message?: string;
    };

    if (res.ok && j.ok && typeof j.checkoutUrl === "string" && j.checkoutUrl.trim()) {
      return {
        ok: true,
        checkoutUrl: j.checkoutUrl.trim(),
        paymentRecordId: j.paymentRecordId,
      };
    }

    return { ok: false, userMessage: revenueCategoryCheckoutErrorMessage(lang) };
  } catch {
    return { ok: false, userMessage: revenueCategoryCheckoutErrorMessage(lang) };
  }
}

export function redirectToRevenueCategoryCheckout(checkoutUrl: string): void {
  window.location.href = checkoutUrl;
}

export const REVENUE_PROMO_VALIDATE_ROUTE = "/api/revenue-os/promo/validate";

export type ValidateRevenuePromoResult =
  | {
      ok: true;
      code: string;
      promoCodeId: string;
      discountType: string;
      discountLabel: string;
      discountCents: number;
      subtotalCents: number;
      totalCents: number;
      redemptionPolicy: string;
    }
  | { ok: false; userMessage: string };

export async function validateRevenuePromoForCheckout(input: {
  code: string;
  category: string;
  packageKey: string;
  subtotalCents: number;
  addOns?: Array<{ key: string; quantity?: number }>;
  listingId?: string | null;
  customerEmail?: string | null;
  locale?: "es" | "en";
}): Promise<ValidateRevenuePromoResult> {
  const lang = input.locale === "en" ? "en" : "es";
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  try {
    const res = await fetch(REVENUE_PROMO_VALIDATE_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...input,
        ...(input.addOns?.length ? { addOns: input.addOns } : {}),
      }),
    });
    const j = (await res.json().catch(() => ({}))) as ValidateRevenuePromoResult & { message?: string };
    if (j.ok) return j;
    return {
      ok: false,
      userMessage:
        j.userMessage ??
        (lang === "es"
          ? "Este código promocional no es válido para este pago."
          : "This promo code is not valid for this checkout."),
    };
  } catch {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "Este código promocional no es válido para este pago."
          : "This promo code is not valid for this checkout.",
    };
  }
}
