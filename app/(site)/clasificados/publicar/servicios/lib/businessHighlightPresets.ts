import type { ChipDef } from "./clasificadosServiciosApplicationTypes";

/** Fixed preset “business highlights” chips (Clasificados Servicios publish). */
export const BUSINESS_HIGHLIGHT_PRESET_CHIPS: ChipDef[] = [
  { id: "bh_free_quote", es: "Cotización gratis", en: "Free quote" },
  { id: "bh_free_consult", es: "Consulta inicial gratis", en: "Free initial consultation" },
  { id: "bh_same_day", es: "Servicio el mismo día", en: "Same-day service" },
  { id: "bh_emergency", es: "Servicio de emergencia", en: "Emergency service" },
  { id: "bh_at_home", es: "Servicio a domicilio", en: "At-home service" },
  { id: "bh_appointment", es: "Atención con cita", en: "Appointment-based" },
  { id: "bh_weekend", es: "Disponible fines de semana", en: "Weekend availability" },
  { id: "bh_exp_5y", es: "Más de 5 años de experiencia", en: "5+ years of experience" },
  { id: "bh_family", es: "Negocio familiar", en: "Family-owned" },
  { id: "bh_guarantee", es: "Garantía de servicio", en: "Service guarantee" },
  { id: "bh_license", es: "Licencia disponible", en: "License available" },
  { id: "bh_insured", es: "Asegurado", en: "Insured" },
  { id: "bh_spanish", es: "Se habla español", en: "Spanish spoken" },
  { id: "bh_fast_response", es: "Respuesta rápida", en: "Fast response" },
];

const HIGHLIGHT_ID_SET = new Set(BUSINESS_HIGHLIGHT_PRESET_CHIPS.map((c) => c.id));

export function isBusinessHighlightPresetId(id: string): boolean {
  return HIGHLIGHT_ID_SET.has(id);
}

export function getBusinessHighlightPreset(id: string): ChipDef | undefined {
  return BUSINESS_HIGHLIGHT_PRESET_CHIPS.find((c) => c.id === id);
}
