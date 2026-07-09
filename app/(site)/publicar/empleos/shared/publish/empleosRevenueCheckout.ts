/**
 * Empleos paid job post → save draft then Revenue OS Checkout (not job fair).
 */

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { EmpleosPublishEnvelope } from "./empleosPublishSnapshots";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { EMPLEOS_PAID_JOB_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";

export async function saveEmpleosDraftAndStartPaidJobCheckout(input: {
  envelope: EmpleosPublishEnvelope;
  accessToken: string;
  lang: Lang;
  leonixAdId?: string | null;
  promoCode?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const lang = input.lang === "en" ? "en" : "es";
  const res = await fetch("/api/clasificados/empleos/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ envelope: input.envelope, mode: "draft" }),
  });
  const json = (await res.json()) as { ok?: boolean; error?: string; id?: string };
  if (!res.ok || !json.ok || !json.id) {
    return {
      ok: false,
      message:
        json.error ??
        (lang === "es" ? "No pudimos guardar el anuncio antes del pago." : "We could not save the listing before payment."),
    };
  }

  const checkout = await startRevenueCategoryCheckout({
    ...EMPLEOS_PAID_JOB_CHECKOUT,
    listingId: json.id,
    leonixAdId: input.leonixAdId,
    locale: lang,
    promoCode: input.promoCode ?? null,
  });
  if (!checkout.ok) {
    return { ok: false, message: checkout.userMessage };
  }

  redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
  return { ok: true };
}
