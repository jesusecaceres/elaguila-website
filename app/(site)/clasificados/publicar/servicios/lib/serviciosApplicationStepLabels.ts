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
 * Map legacy step indices to the current 8-step flow.
 * Steps 0–5 unchanged across GATE-02/03; promo step (old 6) removed; coupons/review shift down.
 */
export function migrateServiciosApplicationStepIndex(rawIndex: number): number {
  const n = Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0;
  const max = SERVICIOS_APPLICATION_STEP_COUNT - 1;

  let idx = n;

  // GATE-02: 10-step → 9-step (contact preview at index 5)
  if (idx >= SERVICIOS_LEGACY_STEP_COUNT_GATE01) {
    idx = SERVICIOS_LEGACY_STEP_COUNT_GATE02 - 1;
  } else if (idx > 4 && idx < SERVICIOS_LEGACY_STEP_COUNT_GATE01) {
    idx -= 1;
  }

  // GATE-03: 9-step → 8-step (free promo at index 6 removed; coupons stay at 6, review at 7)
  if (idx <= 5) return Math.max(0, Math.min(max, idx));
  if (idx === 6) return 6;
  if (idx >= 8) return 7;
  return Math.max(0, Math.min(max, idx));
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
