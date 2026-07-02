import type { SupportedLang } from "@/app/lib/language";
import { navCopyLang } from "@/app/lib/language";

export type ContactPolishCopy = {
  heroTitle: string;
  heroSubtitle: string;
  contactCardsTitle: string;
  inquiryTitle: string;
  inquiryTypes: string[];
  quickActionsTitle: string;
  quickAdvertise: string;
  quickMediaKit: string;
  quickPromo: string;
  quickClassifieds: string;
  trustTitle: string;
  trustBody: string;
};

const ES: ContactPolishCopy = {
  heroTitle: "Contacto",
  heroSubtitle:
    "Hablemos de publicidad, clasificados, revista, productos promocionales, alianzas o recursos para tu comunidad.",
  contactCardsTitle: "Datos de contacto",
  inquiryTitle: "¿En qué podemos ayudarte?",
  inquiryTypes: [
    "Quiero anunciar mi negocio",
    "Quiero publicar un clasificado",
    "Quiero productos promocionales",
    "Quiero aparecer en la revista",
    "Quiero hablar de una alianza",
    "Necesito ayuda con mi cuenta/anuncio",
  ],
  quickActionsTitle: "Acciones rápidas",
  quickAdvertise: "Anúnciate",
  quickMediaKit: "Ver Media Kit",
  quickPromo: "Productos Promocionales",
  quickClassifieds: "Clasificados",
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media es parte de Leonix Global LLC. Atendemos San José, el Área de la Bahía y el norte de California.",
};

const EN: ContactPolishCopy = {
  heroTitle: "Contact",
  heroSubtitle:
    "Let's talk about advertising, classifieds, magazine placement, promotional products, partnerships, or resources for your community.",
  contactCardsTitle: "Contact information",
  inquiryTitle: "How can we help?",
  inquiryTypes: [
    "I want to advertise my business",
    "I want to publish a classified",
    "I want promotional products",
    "I want to appear in the magazine",
    "I want to discuss a partnership",
    "I need help with my account/listing",
  ],
  quickActionsTitle: "Quick actions",
  quickAdvertise: "Advertise",
  quickMediaKit: "View Media Kit",
  quickPromo: "Promotional Products",
  quickClassifieds: "Classifieds",
  trustTitle: "Leonix Media",
  trustBody:
    "Leonix Media is part of Leonix Global LLC. We serve San Jose, the Bay Area, and Northern California.",
};

export function getContactPolishCopy(lang: SupportedLang): ContactPolishCopy {
  return navCopyLang(lang) === "es" ? ES : EN;
}

export const CONTACT_DISPLAY_ADDRESS = "871 Coleman Avenue, Suite 201, San Jose, CA 95110";
