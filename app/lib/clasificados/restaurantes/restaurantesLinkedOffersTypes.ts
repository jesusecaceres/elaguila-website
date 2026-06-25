/**
 * Gate REST-OFFERS1 — Restaurante ↔ Ofertas Locales link contract (no fake offers).
 */

/** Draft snapshot / publish metadata key — written by Ofertas publish in a future gate. */
export const RESTAURANTE_OFFER_LINK_DRAFT_KEY = "linkedRestaurantePublicListingId" as const;

export type RestauranteLinkedOfferPreview = {
  id: string;
  title: string;
  description?: string;
  expiresAt?: string | null;
  href: string;
};
