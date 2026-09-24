import { getLaunchUiCopy, type LaunchUiDictionary, type SupportedLang } from "@/app/lib/language";

export type PublicFooterCopy = {
  companyTitle: string;
  tagline: string;
  companySummary: string;
  aboutUs: string;
  contactUs: string;
  mediaKit: string;
  advertise: string;
  learn: string;
  explore: string;
  community: string;
  contactColumn: string;
  connectTitle: string;
  legalTrust: string;
  addressLabel: string;
  emailLabel: string;
  phoneLabel: string;
  hoursLabel: string;
  smsLabel: string;
  whatsappLabel: string;
  virtualCallLabel: string;
  bottomSlogan: string;
};

const FOOTER_COPY: LaunchUiDictionary<PublicFooterCopy> = {
  es: {
    companyTitle: "Leonix Media",
    tagline: "Que ruja el león.",
    companySummary:
      "Leonix Media impulsa el crecimiento de negocios locales a través de medios bilingües, clasificados, radio (La Kaliente 1370), productos promocionales y conexión comunitaria en el Área de la Bahía y el norte de California.",
    aboutUs: "Sobre nosotros",
    contactUs: "Contacto",
    mediaKit: "Media Kit",
    advertise: "Anúnciate",
    learn: "Centro de Aprendizaje",
    explore: "Explorar",
    community: "Comunidad",
    contactColumn: "Contacto",
    connectTitle: "Conéctate",
    legalTrust: "Legal y confianza",
    addressLabel: "Oficina",
    emailLabel: "Correo",
    phoneLabel: "Teléfono",
    hoursLabel: "Horario",
    smsLabel: "Enviar SMS",
    whatsappLabel: "WhatsApp",
    virtualCallLabel: "Llamada virtual",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
  en: {
    companyTitle: "Leonix Media",
    tagline: "Let the Lion Roar.",
    companySummary:
      "Leonix Media helps local businesses grow through bilingual media, classifieds, radio (La Kaliente 1370), promotional products, and trusted community connection across the Bay Area and Northern California.",
    aboutUs: "About us",
    contactUs: "Contact us",
    mediaKit: "Media Kit",
    advertise: "Advertise",
    learn: "Learning Center",
    explore: "Explore",
    community: "Community",
    contactColumn: "Contact",
    connectTitle: "Connect",
    legalTrust: "Legal & trust",
    addressLabel: "Office",
    emailLabel: "Email",
    phoneLabel: "Phone",
    hoursLabel: "Hours",
    smsLabel: "Send text",
    whatsappLabel: "WhatsApp",
    virtualCallLabel: "Virtual call",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
  pt: {
    companyTitle: "Leonix Media",
    tagline: "Deixe o leão rugir.",
    companySummary:
      "A Leonix Media ajuda negócios locais a crescer com mídia bilíngue, classificados, rádio (La Kaliente 1370), produtos promocionais e conexão comunitária na Bay Area e norte da Califórnia.",
    aboutUs: "Sobre nós",
    contactUs: "Contato",
    mediaKit: "Media Kit",
    advertise: "Anuncie",
    learn: "Centro de Aprendizado",
    explore: "Explorar",
    community: "Comunidade",
    contactColumn: "Contato",
    connectTitle: "Conecte-se",
    legalTrust: "Legal e confiança",
    addressLabel: "Escritório",
    emailLabel: "E-mail",
    phoneLabel: "Telefone",
    hoursLabel: "Horário",
    smsLabel: "Enviar SMS",
    whatsappLabel: "WhatsApp",
    virtualCallLabel: "Chamada virtual",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
  tl: {
    companyTitle: "Leonix Media",
    tagline: "Hayaing umungal ang leon.",
    companySummary:
      "Tinutulungan ng Leonix Media ang mga lokal na negosyo na lumago sa pamamagitan ng bilingual na media, classifieds, radio (La Kaliente 1370), promotional products, at koneksyon sa komunidad sa Bay Area at Northern California.",
    aboutUs: "Tungkol sa amin",
    contactUs: "Kontak",
    mediaKit: "Media Kit",
    advertise: "Mag-advertise",
    learn: "Learning Center",
    explore: "Tuklasin",
    community: "Komunidad",
    contactColumn: "Kontak",
    connectTitle: "Kumonekta",
    legalTrust: "Legal at tiwala",
    addressLabel: "Opisina",
    emailLabel: "Email",
    phoneLabel: "Telepono",
    hoursLabel: "Oras",
    smsLabel: "Magpadala ng SMS",
    whatsappLabel: "WhatsApp",
    virtualCallLabel: "Virtual na tawag",
    bottomSlogan: "Que ruja el león — Let the Lion Roar",
  },
};

/** @deprecated Import address from `@/app/data/leonixGlobalContact` instead. */
export const FOOTER_DISPLAY_ADDRESS = "871 Coleman Ave, Suite 201, San Jose, CA 95110";

export function getPublicFooterCopy(lang: SupportedLang): PublicFooterCopy {
  return getLaunchUiCopy(lang, FOOTER_COPY);
}
