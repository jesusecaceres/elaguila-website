/**
 * Shared Leonix Publish Checkout Checkpoint copy (ES/EN).
 * Gate PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01 — browser-safe strings only.
 */

import type { PublishCheckpointLanguage } from "./publishCheckoutCheckpoint";

export function publishCheckpointNewsletterLabel(lang: PublishCheckpointLanguage): string {
  return lang === "es"
    ? "Quiero recibir promociones de Leonix, novedades de la revista, oportunidades de publicidad local y noticias del lanzamiento."
    : "Send me Leonix promotions, magazine updates, local advertising opportunities, and launch news.";
}

export function publishCheckpointFinalActionCheckout(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Continuar al pago seguro" : "Continue to Secure Checkout";
}

export function publishCheckpointFinalActionFreePublish(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Publicar anuncio" : "Publish listing";
}

export function publishCheckpointPlanSummaryTitle(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Resumen del plan" : "Plan summary";
}

export function publishCheckpointAddOnsTitle(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Complementos" : "Add-ons";
}

export function publishCheckpointTotalMonthlyLabel(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Total" : "Total";
}

export function publishCheckpointConfirmationsTitle(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Confirmaciones antes de publicar" : "Confirmation before publishing";
}

export function publishCheckpointConfirmationsHelper(lang: PublishCheckpointLanguage, remaining: number): string {
  if (remaining <= 0) return "";
  return lang === "es"
    ? `Marca ${remaining === 1 ? "la casilla restante" : `las ${remaining} casillas restantes`} para continuar.`
    : `Check ${remaining === 1 ? "the remaining box" : `all ${remaining} boxes`} to continue.`;
}

export function publishCheckpointPromoDeferredLabel(lang: PublishCheckpointLanguage): string {
  return lang === "es"
    ? "Los códigos promocionales estarán disponibles pronto en este paso."
    : "Promo codes will be available at this step soon.";
}

export function publishCheckpointLoadingCheckout(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Creando pago seguro…" : "Creating secure checkout…";
}

export function publishCheckpointLoadingPublish(lang: PublishCheckpointLanguage): string {
  return lang === "es" ? "Publicando…" : "Publishing…";
}

export function publishCheckpointGenericError(lang: PublishCheckpointLanguage): string {
  return lang === "es"
    ? "No pudimos completar esta acción. Intenta de nuevo o contacta a Leonix."
    : "We could not complete this action. Please try again or contact Leonix.";
}
