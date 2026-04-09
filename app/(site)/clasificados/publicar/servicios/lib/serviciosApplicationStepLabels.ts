import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

const ES = [
  "Tipo de negocio",
  "Datos básicos y contacto",
  "Imágenes y videos",
  "Sobre el negocio",
  "Servicios y datos rápidos",
  "Acciones visibles",
  "Horarios",
  "Promoción (opcional)",
  "Revisión y confirmación",
] as const;

const EN = [
  "Business type",
  "Basics & contact",
  "Images & video",
  "About the business",
  "Services & quick facts",
  "Visible actions",
  "Hours",
  "Promotion (optional)",
  "Review & confirmation",
] as const;

export const SERVICIOS_APPLICATION_STEP_COUNT = 9;

export function getServiciosApplicationStepLabels(lang: ServiciosLang): readonly string[] {
  return lang === "en" ? EN : ES;
}

export function getServiciosApplicationStepShortLabels(lang: ServiciosLang): readonly string[] {
  if (lang === "en") {
    return ["Type", "Basics", "Media", "About", "Services", "Actions", "Hours", "Promo", "Review"];
  }
  return ["Tipo", "Básico", "Media", "Sobre", "Servicios", "Acciones", "Horario", "Promo", "Revisión"];
}
