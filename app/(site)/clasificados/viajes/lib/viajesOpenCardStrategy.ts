/**
 * Viajes open-card variant strategy (read before editing ViajesOfferDetailLayout).
 *
 * Surfaces using the shared open-card shell:
 * - Live: /clasificados/viajes/oferta/[slug]
 * - Preview: /clasificados/viajes/preview/negocios
 * - Preview: /clasificados/viajes/preview/privado
 *
 * Lane detection (single source of truth in UI):
 * - affiliate: partner.isAffiliate === true
 * - private: partner.privateSeller === true
 * - editorial: partner.editorial === true (Guía Leonix / inspiration)
 * - business: default operator/agency
 */

export type ViajesOpenCardLane = "affiliate" | "business" | "private" | "editorial";

export function getViajesOpenCardLane(offer: {
  partner: { isAffiliate: boolean; privateSeller?: boolean; editorial?: boolean };
}): ViajesOpenCardLane {
  if (offer.partner.isAffiliate) return "affiliate";
  if (offer.partner.privateSeller) return "private";
  if (offer.partner.editorial) return "editorial";
  return "business";
}
