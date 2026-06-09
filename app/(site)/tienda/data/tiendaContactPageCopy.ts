import type { SupportedLang } from "@/app/lib/language";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";

/** @deprecated Tienda catalog still uses es/en — public contact uses SupportedLang. */
export type Lang = "es" | "en";

function isSupported(lang: SupportedLang | Lang): lang is SupportedLang {
  return lang !== "es" && lang !== "en" ? true : lang === "es" || lang === "en";
}

function resolveLang(lang: SupportedLang | Lang): SupportedLang {
  if (typeof lang === "string" && lang.length === 2 && lang !== "es" && lang !== "en") {
    return lang as SupportedLang;
  }
  return lang === "en" ? "en" : "es";
}

export function tiendaContactPageTitle(lang: SupportedLang | Lang): string {
  const l = isSupported(lang as SupportedLang) ? (lang as SupportedLang) : resolveLang(lang);
  if (l !== "es" && l !== "en") {
    return getPublicLocaleCopy(l).tiendaPage.metaTitle.replace(/ · Leonix$/, "");
  }
  return lang === "en" ? "Promotional products contact" : "Contacto de productos promocionales";
}

export function tiendaContactPageSubtitle(lang: SupportedLang | Lang): string {
  const l = isSupported(lang as SupportedLang) ? (lang as SupportedLang) : resolveLang(lang);
  if (l !== "es" && l !== "en") {
    return getPublicLocaleCopy(l).contactPage.promoHelpBody;
  }
  return lang === "en"
    ? "For quotes, specialty items, promotional products, and print order follow-up — this is the right contact channel."
    : "Para cotizaciones, productos especiales, artículos promocionales y seguimiento de pedidos de impresión — este es el contacto correcto.";
}

export function tiendaContactPreferenceIntro(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") {
    return getPublicLocaleCopy(l).contactPage.intro;
  }
  return lang === "en"
    ? "We prefer office visits or phone calls so we can understand exactly what you need. You can also send files or details by email."
    : "Preferimos atenderte en oficina o por teléfono para entender exactamente lo que necesitas. También puedes enviar archivos o detalles por correo.";
}

export function tiendaContactRankOffice(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.addressLabel;
  return lang === "en" ? "1. Visit the office (preferred)" : "1. Visita la oficina (preferido)";
}

export function tiendaContactRankPhone(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.phoneLabel;
  return lang === "en" ? "2. Call us" : "2. Llámanos";
}

export function tiendaContactRankEmail(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.emailLabel;
  return lang === "en"
    ? "3. Email — valid for orders and follow-up; slower response."
    : "3. Correo — válido para pedidos y seguimiento; respuesta más lenta.";
}

export function tiendaContactBackToProducts(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.promoHelpCta;
  return lang === "en" ? "Back to products" : "Volver a productos";
}

export function tiendaContactGeneralSiteNote(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.intro;
  return lang === "en"
    ? "General inquiry about Leonix Media (not promotional products)?"
    : "¿Consulta general sobre Leonix Media (no productos promocionales)?";
}

export function tiendaContactGeneralSiteCta(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return getPublicLocaleCopy(l).contactPage.h1;
  return lang === "en" ? "Go to general contact" : "Ir a contacto general";
}

export function tiendaContactBackToStore(lang: SupportedLang | Lang): string {
  return tiendaContactBackToProducts(lang);
}

export function tiendaContactGoHome(lang: SupportedLang | Lang): string {
  const l = lang === "en" ? "en" : lang === "es" ? "es" : (lang as SupportedLang);
  if (l !== "es" && l !== "en") return "Leonix Media";
  return lang === "en" ? "Go home" : "Ir al inicio";
}
