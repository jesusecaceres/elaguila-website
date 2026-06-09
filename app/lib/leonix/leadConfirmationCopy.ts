import type { InquiryType } from "./inquiryTypes";

export type LeadFormLang = "es" | "en";

const LEAD_SUCCESS: Record<InquiryType, Record<LeadFormLang, string>> = {
  advertising: {
    es: "¡Gracias! Recibimos tu solicitud. El equipo de Leonix revisará tu información y te contactará pronto para ayudarte con el mejor siguiente paso.",
    en: "Thank you! We received your request. The Leonix team will review your information and contact you soon to help with the best next step.",
  },
  launch: {
    es: "¡Gracias! Recibimos tu solicitud. El equipo de Leonix revisará tu información y te contactará pronto para ayudarte con el mejor siguiente paso.",
    en: "Thank you! We received your request. The Leonix team will review your information and contact you soon to help with the best next step.",
  },
  mediaKit: {
    es: "¡Gracias! Recibimos tu interés en el Media Kit. El equipo de Leonix te contactará pronto para ayudarte con opciones de publicidad impresa, digital y presencia local.",
    en: "Thank you! We received your Media Kit interest. The Leonix team will contact you soon to help with print advertising, digital visibility, and local presence options.",
  },
  general: {
    es: "¡Gracias! Recibimos tu solicitud. El equipo de Leonix revisará tu información y te contactará pronto para ayudarte con el mejor siguiente paso.",
    en: "Thank you! We received your request. The Leonix team will review your information and contact you soon to help with the best next step.",
  },
  promotionalProducts: {
    es: "¡Gracias! Recibimos tu solicitud de cotización. El equipo de Leonix revisará los detalles y te contactará pronto para ayudarte con productos promocionales, impresión o materiales para tu negocio.",
    en: "Thank you! We received your quote request. The Leonix team will review the details and contact you soon to help with promotional products, printing, or business materials.",
  },
  businessListing: {
    es: "¡Gracias! Recibimos tu solicitud. El equipo de Leonix revisará tu información y te contactará pronto para ayudarte con el mejor siguiente paso.",
    en: "Thank you! We received your request. The Leonix team will review your information and contact you soon to help with the best next step.",
  },
  partnership: {
    es: "¡Gracias! Recibimos tu solicitud. El equipo de Leonix revisará tu información y te contactará pronto para ayudarte con el mejor siguiente paso.",
    en: "Thank you! We received your request. The Leonix team will review your information and contact you soon to help with the best next step.",
  },
};

const NEWSLETTER_SUCCESS: Record<LeadFormLang, string> = {
  es: "¡Gracias por ser parte de la comunidad Leonix! Te avisaremos cuando lancemos oficialmente y cuando tengamos nuevas actualizaciones para compartir.",
  en: "Thank you for being part of the Leonix community! We'll let you know when we officially launch and when we have new updates to share.",
};

const PUBLIC_ERROR: Record<LeadFormLang, string> = {
  es: "No pudimos enviar tu información en este momento. Intenta de nuevo o escríbenos a info@leonixmedia.com.",
  en: "We could not submit your information right now. Please try again or email us at info@leonixmedia.com.",
};

export function getLeadSuccessMessage(inquiryType: InquiryType, lang: LeadFormLang): string {
  return LEAD_SUCCESS[inquiryType][lang];
}

export function getNewsletterSuccessMessage(lang: LeadFormLang): string {
  return NEWSLETTER_SUCCESS[lang];
}

export function getPublicLeadErrorMessage(lang: LeadFormLang): string {
  return PUBLIC_ERROR[lang];
}

/** Strip internal email/DB warnings from API responses before showing to visitors. */
export function sanitizePublicLeadWarning(warning: string | undefined, saved: boolean): string | undefined {
  if (!warning) return undefined;
  if (saved) return undefined;
  const lower = warning.toLowerCase();
  if (
    lower.includes("resend") ||
    lower.includes("email notification") ||
    lower.includes("notificación por correo") ||
    lower.includes("not configured") ||
    lower.includes("no está configurada")
  ) {
    return undefined;
  }
  return warning;
}
