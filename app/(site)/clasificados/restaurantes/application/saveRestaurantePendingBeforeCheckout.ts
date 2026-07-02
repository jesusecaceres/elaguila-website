/**
 * Save Restaurante listing as pending (archived/hidden) before Revenue OS checkout.
 * Gate RESTAURANTES-PENDING-PUBLISH-AND-COUPON-OFFERS-TRUTH-01
 */

import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { buildRestaurantePublishPayload } from "./buildRestaurantePublishPayload";

export type RestaurantePendingPublishResult =
  | {
      ok: true;
      listingId: string;
      leonixAdId: string | null;
      draftListingId: string;
    }
  | { ok: false; userMessage: string };

export async function saveRestaurantePendingBeforeCheckout(
  draft: RestauranteListingDraft,
  opts: { ownerUserId?: string | null; lang: "es" | "en" },
): Promise<RestaurantePendingPublishResult> {
  const lang = opts.lang === "en" ? "en" : "es";
  const payload = buildRestaurantePublishPayload(draft, opts.ownerUserId ?? undefined, undefined, lang, {
    activationMode: "pending_payment",
  });

  try {
    const res = await fetch("/api/clasificados/restaurantes/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      pendingPayment?: boolean;
      listingId?: string;
      leonixAdId?: string | null;
      draftListingId?: string;
    };

    if (res.ok && j.ok && j.pendingPayment && typeof j.listingId === "string" && j.listingId.trim()) {
      return {
        ok: true,
        listingId: j.listingId.trim(),
        leonixAdId: j.leonixAdId?.trim() || null,
        draftListingId: j.draftListingId?.trim() || draft.draftListingId,
      };
    }

    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "No pudimos guardar tu restaurante antes del pago. Intenta de nuevo o contacta a Leonix."
          : "We could not save your restaurant before checkout. Please try again or contact Leonix.",
    };
  } catch {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "No pudimos guardar tu restaurante antes del pago. Intenta de nuevo o contacta a Leonix."
          : "We could not save your restaurant before checkout. Please try again or contact Leonix.",
    };
  }
}
