/**
 * Lane-specific Stripe Price IDs for Autos classifieds checkout.
 * Set in Vercel env: STRIPE_PRICE_AUTOS_NEGOCIOS, STRIPE_PRICE_AUTOS_PRIVADO
 *
 * Internal QA without Stripe (never production): set `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1`
 * (see `autosInternalPublishConfig.ts` and `AUTOS_PUBLISH_LIFECYCLE.md`).
 */
import type { AutosClassifiedsLane } from "./autosClassifiedsTypes";

export function getStripePriceIdForAutosLane(lane: AutosClassifiedsLane): string | null {
  if (lane === "negocios") {
    return process.env.STRIPE_PRICE_AUTOS_NEGOCIOS?.trim() || null;
  }
  return process.env.STRIPE_PRICE_AUTOS_PRIVADO?.trim() || null;
}

export function isStripeAutosConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

export function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}
