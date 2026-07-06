import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

const ES = [
  "Tipo de negocio",
  "Datos básicos y contacto",
  "Imágenes y videos",
  "Sobre el negocio",
  "Servicios y datos rápidos",
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
  "Hours",
  "Promotion (optional)",
  "Coupons (optional)",
  "Review & confirmation",
] as const;

export const SERVICIOS_APPLICATION_STEP_COUNT = 9;

/** Legacy 10-step drafts (contact preview step removed in GATE-02). */
export const SERVICIOS_LEGACY_APPLICATION_STEP_COUNT = 10;

/**
 * Map old step indices (with standalone contact preview at index 5) to the 9-step flow.
 * Steps 0–4 unchanged; old 5–9 shift down by one (payments live on step 4 now).
 */
export function migrateServiciosApplicationStepIndex(rawIndex: number): number {
  const n = Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0;
  const max = SERVICIOS_APPLICATION_STEP_COUNT - 1;
  if (n <= 4) return Math.max(0, Math.min(max, n));
  if (n >= SERVICIOS_LEGACY_APPLICATION_STEP_COUNT) return max;
  return Math.max(0, Math.min(max, n - 1));
}

export function getServiciosApplicationStepLabels(lang: ServiciosLang): readonly string[] {
  return lang === "en" ? EN : ES;
}

export function getServiciosApplicationStepShortLabels(lang: ServiciosLang): readonly string[] {
  if (lang === "en") {
    return ["Type", "Basics", "Media", "About", "Services", "Hours", "Promo", "Coupons", "Review"];
  }
  return ["Tipo", "Básico", "Media", "Sobre", "Servicios", "Horario", "Promo", "Cupones", "Revisión"];
}
