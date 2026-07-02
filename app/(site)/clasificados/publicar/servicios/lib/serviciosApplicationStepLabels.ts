import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

const ES = [
  "Tipo de negocio",
  "Datos básicos y contacto",
  "Imágenes y videos",
  "Sobre el negocio",
  "Servicios y datos rápidos",
  "Vista de contacto y opciones",
  "Horarios",
  "Promoción (opcional)",
  "Cupones (opcional)",
  "Revisión y confirmación",
] as const;

const EN = [
  "Business type",
  "Basics & contact",
  "Images & video",
  "About the business",
  "Services & quick facts",
  "Contact preview & options",
  "Hours",
  "Promotion (optional)",
  "Coupons (optional)",
  "Review & confirmation",
] as const;

export const SERVICIOS_APPLICATION_STEP_COUNT = 10;

export function getServiciosApplicationStepLabels(lang: ServiciosLang): readonly string[] {
  return lang === "en" ? EN : ES;
}

export function getServiciosApplicationStepShortLabels(lang: ServiciosLang): readonly string[] {
  if (lang === "en") {
    return ["Type", "Basics", "Media", "About", "Services", "Contact", "Hours", "Promo", "Coupons", "Review"];
  }
  return ["Tipo", "Básico", "Media", "Sobre", "Servicios", "Contacto", "Horario", "Promo", "Cupones", "Revisión"];
}
