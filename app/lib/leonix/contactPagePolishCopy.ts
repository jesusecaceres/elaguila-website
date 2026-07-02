import type { SupportedLang } from "@/app/lib/language";
import { navCopyLang } from "@/app/lib/language";
import { parseInquiryType, type InquiryType } from "@/app/lib/leonix/inquiryTypes";

export type ContactHeroIntent = "default" | "advertising";

export type ContactHeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryMediaKit: string;
  secondaryPromo: string;
  secondaryClassified: string;
};

export type ContactPolishCopy = {
  hero: ContactHeroCopy;
  contactPanelTitle: string;
  contactPanelTrust: string;
  emailLabel: string;
  phoneLabel: string;
  officeLabel: string;
  inquiryTitle: string;
  inquiryTypes: string[];
  trustTitle: string;
  trustBody: string;
};

const ES_DEFAULT_HERO: ContactHeroCopy = {
  eyebrow: "LEONIX MEDIA",
  title: "Contacto",
  subtitle:
    "Hablemos de publicidad, clasificados, revista, productos promocionales, alianzas o recursos para tu comunidad.",
  primaryCta: "Enviar mensaje",
  secondaryMediaKit: "Ver Media Kit",
  secondaryPromo: "Productos Promocionales",
  secondaryClassified: "Publicar Clasificado",
};

const EN_DEFAULT_HERO: ContactHeroCopy = {
  eyebrow: "LEONIX MEDIA",
  title: "Contact",
  subtitle:
    "Let's talk about advertising, classifieds, magazine placement, promotional products, partnerships, or resources for your community.",
  primaryCta: "Send message",
  secondaryMediaKit: "View Media Kit",
  secondaryPromo: "Promotional Products",
  secondaryClassified: "Post a Classified",
};

const ES_ADVERTISING_HERO: ContactHeroCopy = {
  eyebrow: "ANÚNCIATE CON LEONIX",
  title: "Cuéntanos sobre tu negocio.",
  subtitle:
    "Te ayudamos a elegir la mejor forma de aparecer en revista, digital, clasificados, productos promocionales y herramientas QR para que más clientes te encuentren, entiendan y contacten.",
  primaryCta: "Enviar solicitud",
  secondaryMediaKit: "Ver Media Kit",
  secondaryPromo: "Productos Promocionales",
  secondaryClassified: "Publicar Clasificado",
};

const EN_ADVERTISING_HERO: ContactHeroCopy = {
  eyebrow: "ADVERTISE WITH LEONIX",
  title: "Tell us about your business.",
  subtitle:
    "We'll help you choose the best way to show up through magazine, digital, classifieds, promotional products, and QR-powered tools so more customers can find, understand, and contact you.",
  primaryCta: "Send request",
  secondaryMediaKit: "View Media Kit",
  secondaryPromo: "Promotional Products",
  secondaryClassified: "Post a Classified",
};

const ES_POLISH: Omit<ContactPolishCopy, "hero"> = {
  contactPanelTitle: "Leonix Media",
  contactPanelTrust: "Plataforma local bilingüe · Bay Area y norte de California",
  emailLabel: "Correo",
  phoneLabel: "Teléfono",
  officeLabel: "Oficina",
  inquiryTitle: "¿En qué podemos ayudarte?",
  inquiryTypes: [
    "Quiero anunciar mi negocio",
    "Quiero publicar un clasificado",
    "Quiero productos promocionales",
    "Quiero aparecer en la revista",
    "Quiero hablar de una alianza",
    "Necesito ayuda con mi cuenta/anuncio",
  ],
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media es parte de Leonix Global LLC. Atendemos San José, el Área de la Bahía y el norte de California.",
};

const EN_POLISH: Omit<ContactPolishCopy, "hero"> = {
  contactPanelTitle: "Leonix Media",
  contactPanelTrust: "Bilingual local platform · Bay Area & Northern California",
  emailLabel: "Email",
  phoneLabel: "Phone",
  officeLabel: "Office",
  inquiryTitle: "How can we help?",
  inquiryTypes: [
    "I want to advertise my business",
    "I want to publish a classified",
    "I want promotional products",
    "I want to appear in the magazine",
    "I want to discuss a partnership",
    "I need help with my account/listing",
  ],
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media is part of Leonix Global LLC. We serve San Jose, the Bay Area, and Northern California.",
};

export const CONTACT_DISPLAY_ADDRESS_LINE1 = "871 Coleman Avenue, Suite 201";
export const CONTACT_DISPLAY_ADDRESS_LINE2 = "San Jose, CA 95110";

/** @deprecated use CONTACT_DISPLAY_ADDRESS_LINE1 + LINE2 */
export const CONTACT_DISPLAY_ADDRESS = `${CONTACT_DISPLAY_ADDRESS_LINE1}, ${CONTACT_DISPLAY_ADDRESS_LINE2}`;

export function resolveContactHeroIntent(params: {
  inquiryType?: string;
  interest?: string;
  sourceCta?: string;
}): ContactHeroIntent {
  const raw = String(params.inquiryType ?? params.interest ?? "").trim().toLowerCase();
  const sourceCta = String(params.sourceCta ?? "").trim().toLowerCase();
  const parsed = parseInquiryType(params.inquiryType ?? params.interest, "general");

  if (
    parsed === "advertising" ||
    sourceCta === "advertise" ||
    raw === "advertising" ||
    raw === "advertise"
  ) {
    return "advertising";
  }
  return "default";
}

export function resolveInquiryHighlightIndex(params: {
  inquiryType?: string;
  interest?: string;
  sourceCta?: string;
}): number | null {
  const intent = resolveContactHeroIntent(params);
  if (intent === "advertising") return 0;

  const raw = String(params.inquiryType ?? params.interest ?? "").trim().toLowerCase();
  const parsed: InquiryType = parseInquiryType(params.inquiryType ?? params.interest, "general");

  if (raw === "classifieds" || parsed === "businessListing") return 1;
  if (raw === "promotional-products" || parsed === "promotionalProducts") return 2;
  if (raw === "magazine" || parsed === "mediaKit") return 3;
  if (raw === "partnership" || parsed === "partnership") return 4;
  if (raw === "support") return 5;

  return null;
}

export function getContactPolishCopy(lang: SupportedLang, intent: ContactHeroIntent = "default"): ContactPolishCopy {
  const isEs = navCopyLang(lang) === "es";
  const base = isEs ? ES_POLISH : EN_POLISH;
  const hero =
    intent === "advertising"
      ? isEs
        ? ES_ADVERTISING_HERO
        : EN_ADVERTISING_HERO
      : isEs
        ? ES_DEFAULT_HERO
        : EN_DEFAULT_HERO;

  return { ...base, hero };
}
