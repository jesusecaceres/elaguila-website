import type { SupportedLang } from "@/app/lib/language";
import { navCopyLang } from "@/app/lib/language";

export type PublicFooterCopy = {
  companyTitle: string;
  tagline: string;
  companySummary: string;
  aboutUs: string;
  contactUs: string;
  mediaKit: string;
  advertise: string;
  explore: string;
  contactColumn: string;
  legalTrust: string;
  addressLabel: string;
  emailLabel: string;
  phoneLabel: string;
  bottomSlogan: string;
};

const ES: PublicFooterCopy = {
  companyTitle: "Leonix Media",
  tagline: "Que ruja el león.",
  companySummary:
    "Leonix Media conecta negocios, clasificados, revista digital, productos promocionales y comunidad en un solo ecosistema bilingüe para el Área de la Bahía y el norte de California.",
  aboutUs: "Sobre nosotros",
  contactUs: "Contacto",
  mediaKit: "Media Kit",
  advertise: "Anúnciate",
  explore: "Explorar",
  contactColumn: "Contacto",
  legalTrust: "Legal y confianza",
  addressLabel: "Oficina",
  emailLabel: "Correo",
  phoneLabel: "Teléfono",
  bottomSlogan: "Que ruja el león — Let the Lion Roar",
};

const EN: PublicFooterCopy = {
  companyTitle: "Leonix Media",
  tagline: "Let the Lion Roar.",
  companySummary:
    "Leonix Media connects businesses, classifieds, digital magazine, promotional products, and community in one bilingual ecosystem for the Bay Area and Northern California.",
  aboutUs: "About us",
  contactUs: "Contact us",
  mediaKit: "Media Kit",
  advertise: "Advertise",
  explore: "Explore",
  contactColumn: "Contact",
  legalTrust: "Legal & trust",
  addressLabel: "Office",
  emailLabel: "Email",
  phoneLabel: "Phone",
  bottomSlogan: "Que ruja el león — Let the Lion Roar",
};

export const FOOTER_DISPLAY_ADDRESS = "871 Coleman Avenue, Suite 201, San Jose, CA 95110";

export function getPublicFooterCopy(lang: SupportedLang): PublicFooterCopy {
  const base = navCopyLang(lang) === "es" ? ES : EN;
  return base;
}
