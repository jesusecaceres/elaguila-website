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

/**
 * D10 (2026-09 final paid/free circuit audit): user-facing copy for the SERVER refusal codes of
 * `POST /api/revenue-os/checkout`. A refusal is never the generic "could not start secure payment" when the server
 * gave a precise reason, and NO copy claims "your changes are saved" - this client cannot know whether anything was
 * saved (a payment-in-progress or already-published refusal saves nothing), so it states only what the server proved:
 * what happened to the payment (no new charge was started, or the earlier one is still being confirmed).
 * Returns null for an unknown / transient code (the caller falls back to the generic message).
 */
export function revenueCheckoutRefusalMessage(code: string | null | undefined, lang: "es" | "en"): string | null {
  const es = lang === "es";
  switch (String(code ?? "")) {
    case "auth_required":
      return es ? "Inicia sesión para continuar al pago." : "Sign in to continue to payment.";
    // Already live / already entitled: no second base charge, no new payment was started.
    case "active_entitlement_no_recharge":
    case "already_published_no_recharge":
    case "entitlement_already_active":
      return es
        ? "Este anuncio ya está publicado o tiene un paquete activo, así que no se requiere otro pago. No se inició ningún cobro."
        : "This listing is already published or has an active package, so no additional payment is needed. No charge was started.";
    // The earlier checkout was paid and the webhook has not landed yet, or a checkout is being prepared right now.
    case "payment_in_progress":
      return es
        ? "Tu pago se está confirmando. Tu anuncio se activará automáticamente en unos momentos; no pagues de nuevo."
        : "Your payment is being confirmed. Your listing will activate automatically in a moment; do not pay again.";
    case "checkout_attempt_in_progress":
      return es
        ? "Ya estamos preparando el pago de esta compra. Espera un momento e intenta de nuevo."
        : "A checkout for this purchase is already being prepared. Wait a moment and try again.";
    case "checkout_state_unverifiable":
      return es
        ? "No pudimos verificar tu intento de pago anterior. Espera un momento e intenta de nuevo; no se inició ningún cobro nuevo."
        : "We could not verify your previous checkout attempt. Wait a moment and try again; no new charge was started.";
    // The listing is not in a status that can start a base payment (published, in review, paused, removed, ...).
    case "autos_listing_not_payable":
    case "listing_not_checkout_eligible":
    case "child_listing_not_eligible":
    case "listing_not_eligible":
      return es
        ? "Este anuncio no está en un estado que permita iniciar un pago (por ejemplo, ya está publicado, en revisión o pausado). No se inició ningún cobro."
        : "This listing is not in a state that can start a payment (for example, it is already published, in review or paused). No charge was started.";
    // The package does not belong to this listing's lane / vehicle type.
    case "autos_listing_package_mismatch":
    case "listing_package_mismatch":
    case "package_listing_mismatch":
      return es
        ? "Este paquete no corresponde a este tipo de anuncio. No se inició ningún cobro. Si crees que es un error, contacta a Leonix."
        : "This package does not apply to this type of listing. No charge was started. If you think this is a mistake, contact Leonix.";
    case "autos_listing_owner_mismatch":
    case "empleos_listing_owner_mismatch":
    case "listing_owner_mismatch":
      return es
        ? "Este anuncio pertenece a otra cuenta. Inicia sesión con la cuenta correcta. No se inició ningún cobro."
        : "This listing belongs to a different account. Sign in with the correct account. No charge was started.";
    case "autos_listing_not_found":
    case "empleos_listing_not_found":
    case "listing_not_found":
      return es
        ? "No encontramos este anuncio. Guárdalo de nuevo e intenta otra vez. No se inició ningún cobro."
        : "We could not find this listing. Save it again and try once more. No charge was started.";
    default:
      return null;
  }
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
      code?: string;
    };

    if (res.ok && j.ok && typeof j.checkoutUrl === "string" && j.checkoutUrl.trim()) {
      return {
        ok: true,
        checkoutUrl: j.checkoutUrl.trim(),
        paymentRecordId: j.paymentRecordId,
      };
    }

    // A precise server refusal (no second base charge for a live / entitled listing, payment already in progress,
    // status / lane / owner mismatch, ...) gets its own accurate copy instead of the generic "could not start payment".
    // None of it claims that changes were saved (D10) - see `revenueCheckoutRefusalMessage`.
    if (!res.ok) {
      const refusal = revenueCheckoutRefusalMessage(j.code, lang);
      if (refusal) return { ok: false, userMessage: refusal };
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
      /** ⚠️35 — server-derived; display only (checkout re-derives everything from the promo row). */
      percentOff?: number | null;
      termMonths?: number | null;
      billingMechanism?: "unit_amount_reduction" | "stripe_repeating_coupon";
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
