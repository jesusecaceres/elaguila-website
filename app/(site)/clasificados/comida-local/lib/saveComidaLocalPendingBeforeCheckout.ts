/**
 * Gate D19 — save Comida Local listing as pending_payment before Revenue OS checkout.
 * Mirrors saveRestaurantePendingBeforeCheckout.ts / saveServiciosPendingBeforeCheckout.ts.
 */

import type { ComidaLocalDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { postComidaLocalPublishApi } from "@/app/lib/clasificados/comida-local/comidaLocalPublishClient";

export type ComidaLocalPendingPublishResult =
  | { ok: true; listingId: string; leonixAdId: string | null; draftListingId: string }
  | { ok: false; userMessage: string };

export async function saveComidaLocalPendingBeforeCheckout(input: {
  draft: ComidaLocalDraft;
  lang: "es" | "en";
  accessToken: string | null;
}): Promise<ComidaLocalPendingPublishResult> {
  const lang = input.lang === "en" ? "en" : "es";
  const genericError =
    lang === "es"
      ? "No pudimos guardar tu ficha antes del pago. Intenta de nuevo o contacta a Leonix."
      : "We could not save your listing before checkout. Please try again or contact Leonix.";

  try {
    const draftListingId = input.draft.draftListingId.trim();
    const { res, data } = await postComidaLocalPublishApi({
      draft: input.draft,
      draftListingId,
      packageTier: "basic",
      lang,
      accessToken: input.accessToken,
      activationMode: "pending_payment",
    });

    if (res.ok && data.ok && data.pendingPayment && typeof data.id === "string" && data.id.trim()) {
      return {
        ok: true,
        listingId: data.id.trim(),
        leonixAdId: typeof data.leonix_ad_id === "string" && data.leonix_ad_id.trim() ? data.leonix_ad_id.trim() : null,
        draftListingId: data.draft_listing_id?.trim() || draftListingId,
      };
    }

    return { ok: false, userMessage: genericError };
  } catch {
    return { ok: false, userMessage: genericError };
  }
}
