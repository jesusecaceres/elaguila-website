/**
 * Paid publish entry checkpoint — cautious generic promo-code copy (display only).
 * The Launch 25 (25% off) campaign has been retired; this file now only describes
 * whether a package can accept a generic, admin-issued promo code at checkout.
 */

export type PublishCheckpointLang = "es" | "en";

export const PAID_CHECKPOINT_LAUNCH_SOURCE = "paid_checkpoint_launch_25";

export function buildPaidCheckpointNewsletterHref(
  lang: PublishCheckpointLang,
  category: string,
): string {
  const params = new URLSearchParams({
    lang,
    source: PAID_CHECKPOINT_LAUNCH_SOURCE,
    return: "checkpoint",
    category,
  });
  return `/newsletter?${params.toString()}`;
}

export function publishCheckpointCouponLine(lang: PublishCheckpointLang, eligible: boolean): string | null {
  if (!eligible) return null;
  return lang === "es"
    ? "Puedes usar un código promocional si este producto web es elegible. El descuento se valida en checkout."
    : "You can use a promo code if this website product is eligible. The discount is validated at checkout.";
}

/** Short per-card line for packages that can accept a generic promo code at checkout. */
export function publishCheckpointCouponLineShort(lang: PublishCheckpointLang, eligible: boolean): string | null {
  if (!eligible) return null;
  return lang === "es"
    ? "Código promocional elegible en checkout."
    : "Promo code eligible at checkout.";
}

export function publishCheckpointCouponExclusions(lang: PublishCheckpointLang): string {
  return lang === "es"
    ? "No aplica a publicaciones gratis, paquetes impresos, combos de revista, contratos manuales, dealer si no está habilitado, ni beneficios de ubicación garantizada."
    : "Does not apply to free posts, print packages, magazine combos, manual contracts, dealer unless enabled, or guaranteed placement benefits.";
}

export function publishCheckpointPaymentNote(lang: PublishCheckpointLang): string {
  return lang === "es"
    ? "El pago y la validación del código ocurren en checkout — no en esta pantalla."
    : "Payment and code validation happen at checkout — not on this screen.";
}
