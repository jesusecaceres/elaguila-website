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
  secondaryBusiness: string;
};

export type InquiryTile = {
  label: string;
} & (
  | { kind: "form"; inquiryKey: string }
  | { kind: "nav"; path: string }
);

export type ContactPolishCopy = {
  hero: ContactHeroCopy;
  contactPanelTitle: string;
  contactPanelTrust: string;
  emailLabel: string;
  phoneLabel: string;
  smsLabel: string;
  officeLabel: string;
  inquiryTitle: string;
  inquiryTypes: InquiryTile[];
  trustTitle: string;
  trustBody: string;
};

const ES_DEFAULT_HERO: ContactHeroCopy = {
  eyebrow: "LEONIX MEDIA",
  title: "Cuéntanos sobre tu negocio.",
  subtitle:
    "Conecta tu negocio con la comunidad a través de Leonix. Podemos ayudarte con presencia para negocios locales, publicidad impresa y digital, clasificados, radio, productos promocionales y otras formas de conectar con clientes. Cuéntanos qué necesitas y te dirigiremos al mejor camino.",
  primaryCta: "Enviar solicitud",
  secondaryMediaKit: "Ver Media Kit",
  secondaryPromo: "Productos Promocionales",
  secondaryClassified: "Publicar Clasificado",
  secondaryBusiness: "Publicar Negocio",
};

const EN_DEFAULT_HERO: ContactHeroCopy = {
  eyebrow: "LEONIX MEDIA",
  title: "Tell us about your business.",
  subtitle:
    "Connect your business with the community through Leonix. We can help with local business presence, print and digital advertising, classifieds, radio, promotional products, and other ways to connect with customers. Tell us what you need and we'll guide you to the right path.",
  primaryCta: "Send Request",
  secondaryMediaKit: "View Media Kit",
  secondaryPromo: "Promotional Products",
  secondaryClassified: "Post a Classified",
  secondaryBusiness: "List Your Business",
};

const ES_ADVERTISING_HERO: ContactHeroCopy = {
  eyebrow: "ANÚNCIATE CON LEONIX",
  title: "Cuéntanos sobre tu negocio.",
  subtitle:
    "Te ayudamos a elegir la mejor forma de aparecer en revista, digital, clasificados, radio, productos promocionales y herramientas QR para que más clientes te encuentren, entiendan y contacten.",
  primaryCta: "Enviar solicitud",
  secondaryMediaKit: "Ver Media Kit",
  secondaryPromo: "Productos Promocionales",
  secondaryClassified: "Publicar Clasificado",
  secondaryBusiness: "Publicar Negocio",
};

const EN_ADVERTISING_HERO: ContactHeroCopy = {
  eyebrow: "ADVERTISE WITH LEONIX",
  title: "Tell us about your business.",
  subtitle:
    "We'll help you choose the best way to show up through magazine, digital, classifieds, radio, promotional products, and QR-powered tools so more customers can find, understand, and contact you.",
  primaryCta: "Send Request",
  secondaryMediaKit: "View Media Kit",
  secondaryPromo: "Promotional Products",
  secondaryClassified: "Post a Classified",
  secondaryBusiness: "List Your Business",
};

const ES_INQUIRY_TILES: InquiryTile[] = [
  { kind: "form", inquiryKey: "advertising", label: "Quiero anunciar mi negocio" },
  { kind: "nav",  path: "/clasificados",    label: "Quiero publicar un clasificado" },
  { kind: "nav",  path: "/negocios-locales", label: "Quiero publicar mi negocio" },
  { kind: "nav",  path: "/productos-promocion", label: "Quiero productos promocionales" },
  { kind: "form", inquiryKey: "radio",       label: "Quiero anunciarme en radio · La Kaliente 1370" },
  { kind: "form", inquiryKey: "partnership", label: "Quiero hablar de una alianza" },
  { kind: "form", inquiryKey: "accountSupport", label: "Necesito ayuda con mi cuenta o anuncio" },
];

const EN_INQUIRY_TILES: InquiryTile[] = [
  { kind: "form", inquiryKey: "advertising", label: "I want to advertise my business" },
  { kind: "nav",  path: "/clasificados",    label: "I want to post a classified" },
  { kind: "nav",  path: "/negocios-locales", label: "I want to list my business" },
  { kind: "nav",  path: "/productos-promocion", label: "I want promotional products" },
  { kind: "form", inquiryKey: "radio",       label: "I want to advertise on radio · La Kaliente 1370" },
  { kind: "form", inquiryKey: "partnership", label: "I want to discuss a partnership" },
  { kind: "form", inquiryKey: "accountSupport", label: "I need help with my account or ad" },
];

const ES_POLISH: Omit<ContactPolishCopy, "hero"> = {
  contactPanelTitle: "Leonix Media",
  contactPanelTrust: "Plataforma local bilingüe · Bay Area y norte de California",
  emailLabel: "Correo",
  phoneLabel: "Teléfono",
  smsLabel: "SMS",
  officeLabel: "Oficina",
  inquiryTitle: "¿En qué podemos ayudarte?",
  inquiryTypes: ES_INQUIRY_TILES,
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media es parte de Leonix Global LLC. Atendemos San José, el Área de la Bahía y el norte de California con presencia para negocios, publicidad impresa y digital, clasificados, radio, productos promocionales y conexión comunitaria.",
};

const EN_POLISH: Omit<ContactPolishCopy, "hero"> = {
  contactPanelTitle: "Leonix Media",
  contactPanelTrust: "Bilingual local platform · Bay Area & Northern California",
  emailLabel: "Email",
  phoneLabel: "Phone",
  smsLabel: "Text / SMS",
  officeLabel: "Office",
  inquiryTitle: "How can we help?",
  inquiryTypes: EN_INQUIRY_TILES,
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media is part of Leonix Global LLC. We serve San Jose, the Bay Area, and Northern California with business presence, print and digital advertising, classifieds, radio, promotional products, and community connection.",
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

  if (raw === "classifieds" || parsed === "classifieds") return 1;
  if (raw === "business" || parsed === "businessListing") return 2;
  if (raw === "promotional-products" || parsed === "promotionalProducts") return 3;
  if (raw === "radio" || parsed === "radio") return 4;
  if (raw === "partnership" || parsed === "partnership") return 5;
  if (raw === "support" || raw === "account" || parsed === "accountSupport") return 6;

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
