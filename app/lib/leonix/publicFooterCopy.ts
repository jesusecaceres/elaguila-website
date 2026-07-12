import { getLaunchUiCopy, type LaunchUiDictionary, type SupportedLang } from "@/app/lib/language";

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

const FOOTER_COPY: LaunchUiDictionary<PublicFooterCopy> = {
  es: {
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
  },
  en: {
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
  },
  pt: {
    companyTitle: "Leonix Media",
    tagline: "Deixe o leão rugir.",
    companySummary:
      "A Leonix Media conecta negócios, classificados, revista digital, produtos promocionais e comunidade em um ecossistema bilíngue para a Bay Area e o norte da Califórnia.",
    aboutUs: "Sobre nós",
    contactUs: "Contato",
    mediaKit: "Media Kit",
    advertise: "Anuncie",
    explore: "Explorar",
    contactColumn: "Contato",
    legalTrust: "Legal e confiança",
    addressLabel: "Escritório",
    emailLabel: "E-mail",
    phoneLabel: "Telefone",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
  tl: {
    companyTitle: "Leonix Media",
    tagline: "Hayaing umungal ang leon.",
    companySummary:
      "Ikinokonekta ng Leonix Media ang negosyo, classifieds, digital magazine, promotional product, at komunidad sa isang bilingual ecosystem para sa Bay Area at Northern California.",
    aboutUs: "Tungkol sa amin",
    contactUs: "Kontak",
    mediaKit: "Media Kit",
    advertise: "Mag-advertise",
    explore: "Tuklasin",
    contactColumn: "Kontak",
    legalTrust: "Legal at tiwala",
    addressLabel: "Opisina",
    emailLabel: "Email",
    phoneLabel: "Telepono",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
};

export const FOOTER_DISPLAY_ADDRESS = "871 Coleman Avenue, Suite 201, San Jose, CA 95110";

export function getPublicFooterCopy(lang: SupportedLang): PublicFooterCopy {
  return getLaunchUiCopy(lang, FOOTER_COPY);
}
