import type { Lang } from "../types/tienda";

function t<T>(es: T, en: T, lang: Lang): T {
  return lang === "en" ? en : es;
}

export function tiendaContactPageTitle(lang: Lang): string {
  return t("Contacto de productos promocionales", "Promotional products contact", lang);
}

export function tiendaContactPageSubtitle(lang: Lang): string {
  return t(
    "Para cotizaciones, productos especiales, artículos promocionales y seguimiento de pedidos de impresión — este es el contacto correcto.",
    "For quotes, specialty items, promotional products, and print order follow-up — this is the right contact channel.",
    lang
  );
}

export function tiendaContactPreferenceIntro(lang: Lang): string {
  return t(
    "Preferimos atenderte en oficina o por teléfono para entender exactamente lo que necesitas. También puedes enviar archivos o detalles por correo.",
    "We prefer office visits or phone calls so we can understand exactly what you need. You can also send files or details by email.",
    lang
  );
}

export function tiendaContactRankOffice(lang: Lang): string {
  return t("1. Visita la oficina (preferido)", "1. Visit the office (preferred)", lang);
}

export function tiendaContactRankPhone(lang: Lang): string {
  return t("2. Llámanos", "2. Call us", lang);
}

export function tiendaContactRankEmail(lang: Lang): string {
  return t(
    "3. Correo — válido para pedidos y seguimiento; respuesta más lenta.",
    "3. Email — valid for orders and follow-up; slower response.",
    lang
  );
}

export function tiendaContactBackToStore(lang: Lang): string {
  return t("← Volver a productos", "← Back to products", lang);
}

export function tiendaContactBackToProducts(lang: Lang): string {
  return t("Volver a productos", "Back to products", lang);
}

export function tiendaContactGoHome(lang: Lang): string {
  return t("Ir al inicio", "Go home", lang);
}

export function tiendaContactGeneralSiteNote(lang: Lang): string {
  return t(
    "¿Consulta general sobre Leonix Media (no productos promocionales)?",
    "General inquiry about Leonix Media (not promotional products)?",
    lang
  );
}

export function tiendaContactGeneralSiteCta(lang: Lang): string {
  return t("Ir a contacto general", "Go to general contact", lang);
}
