import type { Lang } from "../types/tienda";

export const leoAssistCopy = {
  pageTitle: { es: "LEO — preparación para tu tarjeta", en: "LEO — prep for your card" },
  pageSubtitle: {
    es: "Recopilamos lo necesario y generamos un borrador con plantilla Leonix. El diseño fino lo haces tú en Studio—no sustituimos a un diseñador.",
    en: "We collect what we need and generate a Leonix‑templated draft. You finish the design in Studio—this does not replace a designer.",
  },
  backLink: { es: "Volver al producto", en: "Back to product" },
  progress: { es: "Paso", en: "Step" },
  of: { es: "de", en: "of" },
  whyTitle: { es: "¿Por qué LEO?", en: "Why LEO?" },
  whyBody: {
    es: "Usamos plantillas Leonix y tus datos para un primer borrador. Los colores y el detalle final los controlas en Studio.",
    en: "We use Leonix templates and your details for a first draft. You control colors and fine detail in Studio.",
  },
  next: { es: "Siguiente", en: "Next" },
  back: { es: "Atrás", en: "Back" },
  finish: { es: "Abrir borrador en Studio", en: "Open draft in Studio" },
  step1Title: { es: "Tu negocio", en: "Your business" },
  step2Title: { es: "Contacto", en: "Contact" },
  step3Title: { es: "Estilo de plantilla", en: "Template style" },
  step4Title: { es: "Logo y envío", en: "Logo & finish" },
  businessName: { es: "Nombre del negocio", en: "Business name" },
  personName: { es: "Tu nombre", en: "Your name" },
  title: { es: "Puesto o título", en: "Title" },
  phone: { es: "Teléfono", en: "Phone" },
  email: { es: "Correo", en: "Email" },
  website: { es: "Sitio web", en: "Website" },
  address: { es: "Dirección", en: "Address" },
  slogan: { es: "Eslogan o descripción breve", en: "Slogan or short description" },
  preferredStyle: { es: "Estilo de plantilla", en: "Template style" },
  emphasis: { es: "Qué destacar al frente", en: "What to emphasize on the front" },
  backStyle: { es: "Estilo del reverso", en: "Back side style" },
  logo: { es: "Logo (opcional)", en: "Logo (optional)" },
  styleLuxury: { es: "Lujo", en: "Luxury" },
  styleModern: { es: "Moderno", en: "Modern" },
  styleBold: { es: "Audaz", en: "Bold" },
  styleMinimal: { es: "Minimal", en: "Minimal" },
  styleElegant: { es: "Elegante", en: "Elegant" },
  emphLogo: { es: "Logo", en: "Logo" },
  emphCompany: { es: "Nombre del negocio", en: "Business name" },
  emphContact: { es: "Datos de contacto", en: "Contact details" },
  backClean: { es: "Limpio", en: "Clean" },
  backServices: { es: "Servicios / mensaje", en: "Services / message" },
  backAddress: { es: "Dirección", en: "Address" },
  backMap: { es: "Estilo mapa / ubicación", en: "Map-style / location" },
  errRequired: { es: "Indica al menos el negocio y tu nombre.", en: "Enter at least your business and your name." },
  errContact: { es: "Añade al menos teléfono o correo.", en: "Add at least a phone number or email." },
} as const;

export function leoPick<T extends Record<"es" | "en", string>>(v: T, lang: Lang): string {
  return lang === "en" ? v.en : v.es;
}
