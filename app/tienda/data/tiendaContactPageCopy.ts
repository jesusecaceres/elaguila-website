import type { Lang } from "../types/tienda";

function t<T>(es: T, en: T, lang: Lang): T {
  return lang === "en" ? en : es;
}

export function tiendaContactPageTitle(lang: Lang): string {
  return t("Ayuda y pedidos · Tienda Leonix", "Help & orders · Leonix Tienda", lang);
}

export function tiendaContactPageSubtitle(lang: Lang): string {
  return t(
    "Para cotizaciones, productos especiales, merch promo y seguimiento de pedidos de impresión — este es el contacto correcto.",
    "For quotes, specialty items, promo merch, and print order follow-up — this is the right contact channel.",
    lang
  );
}

export function tiendaContactPreferenceIntro(lang: Lang): string {
  return t(
    "Te atendemos mejor en persona o por teléfono. El correo es útil para enviar archivos o dejar constancia, pero puede tardar más.",
    "We serve you best in person or on the phone. Email is fine for files and paper trails, but replies may take longer.",
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
    "3. Correo (tienda@leonixmedia.com) — válido para pedidos y seguimiento; respuesta más lenta.",
    "3. Email (tienda@leonixmedia.com) — valid for orders and follow-up; slower response.",
    lang
  );
}

export function tiendaContactBackToStore(lang: Lang): string {
  return t("← Volver a la Tienda", "← Back to Tienda store", lang);
}

export function tiendaContactGeneralSiteNote(lang: Lang): string {
  return t(
    "¿Consulta general sobre Leonix Media (no pedido de Tienda)?",
    "General inquiry about Leonix Media (not a Tienda order)?",
    lang
  );
}

export function tiendaContactGeneralSiteCta(lang: Lang): string {
  return t("Ir a contacto general", "Go to general contact", lang);
}
