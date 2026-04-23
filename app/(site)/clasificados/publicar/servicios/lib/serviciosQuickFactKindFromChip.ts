import type { ChipDef } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosQuickFactKind } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Map preset quick-fact chips to wire `ServiciosQuickFact.kind` so results filters
 * (`emergency`, `mobile_service`, `bilingual`, etc.) match persisted listings.
 */
export function serviciosQuickFactKindFromPresetChip(chip: ChipDef, lang: "es" | "en"): ServiciosQuickFactKind {
  const text = `${chip.es} ${chip.en}`.toLowerCase();

  if (/\bemergency\b|emergencia|emergencias|urgencias/i.test(text)) {
    return "emergency";
  }
  if (/mobile service|servicio móvil|\bmóvil\b/i.test(text)) {
    return "mobile_service";
  }
  if (/bilingual|bilingüe|español e inglés|spanish and english/i.test(text)) {
    return "bilingual";
  }
  if (/same[- ]day|mismo día|el mismo día|same day/i.test(text)) {
    return "same_day";
  }
  if (/free estimate|estimados gratis|presupuesto gratuito|free quote|cotización gratis/i.test(text)) {
    return "free_estimate";
  }
  if (/licensed|insured|licenciado|asegurado/i.test(text)) {
    return "licensed_insured";
  }
  if (/respond|respuesta|within \d+|en \d+ hora|en minutos|fast response|respuesta rápida/i.test(text)) {
    return "response_time";
  }
  if (/años de experiencia|years of experience|años de/i.test(text)) {
    return "years_experience";
  }

  void lang;
  return "custom";
}
