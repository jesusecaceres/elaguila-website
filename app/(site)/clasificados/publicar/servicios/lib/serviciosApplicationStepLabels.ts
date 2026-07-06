import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

const ES = [
  "Tipo de negocio",
  "Datos básicos y contacto",
  "Imágenes y videos",
  "Sobre el negocio",
  "Servicios y datos rápidos",
  "Horarios",
  "Cupones y ofertas destacadas",
  "Revisión y confirmación",
] as const;

const EN = [
  "Business type",
  "Basics & contact",
  "Images & video",
  "About the business",
  "Services & quick facts",
  "Hours",
  "Featured coupons & offers",
  "Review & confirmation",
] as const;

export const SERVICIOS_APPLICATION_STEP_COUNT = 8;

/** Legacy 9-step flow (free promo step removed in GATE-03). */
export const SERVICIOS_LEGACY_STEP_COUNT_GATE02 = 9;

/** Legacy 10-step flow (contact preview removed in GATE-02). */
export const SERVICIOS_LEGACY_STEP_COUNT_GATE01 = 10;

/**
 * Map legacy saved step indices to the current 8-step flow.
 * Current indices 0–7 pass through unchanged (sidebar / direct navigation).
 */
export function migrateServiciosApplicationStepIndex(rawIndex: number): number {
  const n = Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0;
  const max = SERVICIOS_APPLICATION_STEP_COUNT - 1;

  if (n >= 0 && n <= max) return n;

  if (n >= SERVICIOS_LEGACY_STEP_COUNT_GATE01) return max;

  if (n >= SERVICIOS_LEGACY_STEP_COUNT_GATE02) {
    if (n === 8) return max;
    if (n === 7 || n === 6) return 6;
    return max;
  }

  if (n > 4 && n < SERVICIOS_LEGACY_STEP_COUNT_GATE01) {
    const shifted = n - 1;
    if (shifted <= 5) return shifted;
    if (shifted === 6 || shifted === 7) return 6;
    return max;
  }

  return max;
}

export function getServiciosApplicationStepLabels(lang: ServiciosLang): readonly string[] {
  return lang === "en" ? EN : ES;
}

export function getServiciosApplicationStepShortLabels(lang: ServiciosLang): readonly string[] {
  if (lang === "en") {
    return ["Type", "Basics", "Media", "About", "Services", "Hours", "Coupons", "Review"];
  }
  return ["Tipo", "Básico", "Media", "Sobre", "Servicios", "Horario", "Cupones", "Revisión"];
}
