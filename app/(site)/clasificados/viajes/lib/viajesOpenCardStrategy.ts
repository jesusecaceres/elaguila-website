/**
 * Viajes open-card variant strategy (read before editing ViajesOfferDetailLayout).
 *
 * Surfaces using the shared open-card shell:
 * - Live: /clasificados/viajes/oferta/[slug] (affiliate + business samples in VIAJES_OFFER_DETAILS)
 * - Preview: /clasificados/viajes/preview/negocios (business draft → partner.privateSeller false, isAffiliate false)
 * - Preview: /clasificados/viajes/preview/privado (private draft → privateSeller true)
 *
 * Lane detection (single source of truth in UI):
 * - affiliate: partner.isAffiliate === true → commercial partner, outbound booking, affiliate disclosure
 * - private: partner.privateSeller === true → individual seller, distinct copy, no agency framing
 * - business: neither → agency/operator, contact-oriented CTAs
 *
 * Visual differentiation (same Leonix tokens, different accents):
 * - affiliate: warm amber ribbon / border cues (partner inventory)
 * - business: emerald/natural cues (local operator)
 * - private: slate/neutral cues (peer-to-peer)
 *
 * Preview routes use the same layout as live; sparseSections hides empty blocks. previewTone can soften the draft banner
 * so the page still reads as “real output,” not a separate cheap template.
 *
 * Non-goals: checkout, payments, MoR — copy and CTAs stay referral/discovery.
 */

export type ViajesOpenCardLane = "affiliate" | "business" | "private";

export function getViajesOpenCardLane(offer: { partner: { isAffiliate: boolean; privateSeller?: boolean } }): ViajesOpenCardLane {
  if (offer.partner.isAffiliate) return "affiliate";
  if (offer.partner.privateSeller) return "private";
  return "business";
}
