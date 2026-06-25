/** Dashboard product readiness — hide nav/cards/CTAs until features are truth-tested. */

export const DASHBOARD_INTERNAL_INBOX_READY = false;
export const DASHBOARD_SAVED_LISTINGS_READY = false;

export function dashboardInboxComingSoonCopy(lang: "es" | "en"): string {
  return lang === "es"
    ? "Mensajes internos aún no están disponibles. Por ahora, los compradores pueden contactarte usando las opciones visibles en cada anuncio."
    : "Internal messages are not available yet. For now, buyers can reach you through the contact options shown on each listing.";
}

export function dashboardSavedComingSoonCopy(lang: "es" | "en"): string {
  return lang === "es"
    ? "Guardados estará disponible cuando la función esté lista para usarse en todos los anuncios."
    : "Saved listings will be available once the feature is ready across all listing types.";
}

export function dashboardInboxNextActionCopy(lang: "es" | "en"): string {
  return lang === "es"
    ? "Ve a Mis anuncios para revisar tus opciones de contacto en cada publicación."
    : "Go to My listings to review contact options on each published ad.";
}

export function dashboardSavedNextActionCopy(lang: "es" | "en"): string {
  return lang === "es"
    ? "Explora anuncios públicos cuando esta función esté disponible."
    : "Browse public listings when this feature becomes available.";
}
