/** Paid publish entry checkpoint — cautious Launch 25 / coupon copy (display only). */

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
    ? "Puedes usar tu código Launch 25 si este producto web es elegible. El descuento se valida en checkout."
    : "You can use your Launch 25 code if this website product is eligible. The discount is validated at checkout.";
}

/** Short per-card line when top Launch 25 banner is shown on the page. */
export function publishCheckpointCouponLineShort(lang: PublishCheckpointLang, eligible: boolean): string | null {
  if (!eligible) return null;
  return lang === "es"
    ? "Código Launch 25 elegible en checkout."
    : "Launch 25 code eligible at checkout.";
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
