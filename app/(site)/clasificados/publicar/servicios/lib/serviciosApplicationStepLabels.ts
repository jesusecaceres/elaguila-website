import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

const ES = [
  "Tipo de negocio",
  "Datos básicos",
  "Imágenes y videos",
  "Sobre el negocio",
  "Servicios y datos rápidos",
  "Contacto y acciones",
  "Redes y horarios",
  "Promoción (opcional)",
  "Revisión y confirmación",
] as const;

const EN = [
  "Business type",
  "Basic details",
  "Images & video",
  "About the business",
  "Services & quick facts",
  "Contact & CTAs",
  "Social & hours",
  "Promotion (optional)",
  "Review & confirmation",
] as const;

export const SERVICIOS_APPLICATION_STEP_COUNT = 9;

export function getServiciosApplicationStepLabels(lang: ServiciosLang): readonly string[] {
  return lang === "en" ? EN : ES;
}

export function getServiciosApplicationStepShortLabels(lang: ServiciosLang): readonly string[] {
  if (lang === "en") {
    return ["Type", "Basics", "Media", "About", "Services", "Contact", "Social", "Promo", "Review"];
  }
  return ["Tipo", "Básico", "Media", "Sobre", "Servicios", "Contacto", "Redes", "Promo", "Revisión"];
}
