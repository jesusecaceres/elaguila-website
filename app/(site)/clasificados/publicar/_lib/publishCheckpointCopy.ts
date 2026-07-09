/** Paid publish entry checkpoint — cautious Launch 25 / coupon copy (display only). */

export type PublishCheckpointLang = "es" | "en";

export function publishCheckpointCouponLine(lang: PublishCheckpointLang, eligible: boolean): string | null {
  if (!eligible) return null;
  return lang === "es"
    ? "Puedes usar tu código Launch 25 si este producto web es elegible. El descuento se valida en checkout."
    : "You can use your Launch 25 code if this website product is eligible. The discount is validated at checkout.";
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
