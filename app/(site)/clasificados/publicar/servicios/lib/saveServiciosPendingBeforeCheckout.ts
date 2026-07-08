"use client";

/**
 * Save Servicios listing as hidden `pending_payment` before Revenue OS checkout.
 * Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01
 *
 * Mirrors the Restaurante pending-publish-before-Stripe pattern. The listing is
 * persisted but stays non-public until the Stripe webhook activates it on paid truth.
 */

import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { postServiciosPublishApi } from "./serviciosPublishClient";

export type ServiciosPendingPublishResult =
  | { ok: true; listingId: string; leonixAdId: string | null; slug: string | null }
  | { ok: false; userMessage: string };

export async function saveServiciosPendingBeforeCheckout(args: {
  state: ClasificadosServiciosApplicationState;
  lang: ServiciosLang;
  accessToken?: string | null;
}): Promise<ServiciosPendingPublishResult> {
  const lang = args.lang === "en" ? "en" : "es";
  try {
    const { res, data } = await postServiciosPublishApi({
      state: args.state,
      lang: args.lang,
      accessToken: args.accessToken,
      activationMode: "pending_payment",
    });

    if (res.status === 401) {
      return {
        ok: false,
        userMessage:
          lang === "es"
            ? "Inicia sesión para continuar al pago seguro de tu anuncio de Servicios."
            : "Sign in to continue to secure payment for your Servicios listing.",
      };
    }

    if (res.ok && data.ok && data.pendingPayment && typeof data.listingId === "string" && data.listingId.trim()) {
      return {
        ok: true,
        listingId: data.listingId.trim(),
        leonixAdId: data.leonixAdId?.trim() || null,
        slug: data.slug?.trim() || null,
      };
    }

    return {
      ok: false,
      userMessage:
        (data.message as string | undefined)?.trim() ||
        (lang === "es"
          ? "No pudimos guardar tu anuncio antes del pago. Intenta de nuevo o contacta a Leonix."
          : "We could not save your listing before checkout. Please try again or contact Leonix."),
    };
  } catch {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "No pudimos guardar tu anuncio antes del pago. Intenta de nuevo o contacta a Leonix."
          : "We could not save your listing before checkout. Please try again or contact Leonix.",
    };
  }
}
