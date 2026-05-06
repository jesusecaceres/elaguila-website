import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export type ServiciosAmenityGroupId =
  | "service"
  | "availability"
  | "customers_served"
  | "accessibility_languages"
  | "discounts_benefits"
  | "other";

export type ServiciosAmenityOptionId =
  | "service_at_home"
  | "service_remote_virtual"
  | "service_online_appointments"
  | "service_walkins_welcome"
  | "service_emergency"
  | "service_same_day"
  | "service_free_estimates"
  | "service_free_initial_consultation"
  | "availability_weekends"
  | "availability_after_hours"
  | "availability_flexible"
  | "availability_24_7"
  | "availability_fast_response"
  | "availability_advance_appointments"
  | "customers_residential"
  | "customers_commercial"
  | "customers_small_businesses"
  | "customers_families"
  | "customers_students"
  | "customers_seniors"
  | "access_spanish_spoken"
  | "access_bilingual_service"
  | "access_wheelchair_accessible"
  | "access_text_support"
  | "access_whatsapp_support"
  | "discount_military"
  | "discount_students"
  | "discount_seniors"
  | "discount_seasonal_promotions"
  | "discount_first_visit"
  | "discount_packages_available";

export const MAX_SERVICIOS_AMENITY_OPTIONS_SELECTED = 80;
export const MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS = 24;
export const CUSTOM_SERVICIOS_AMENITY_LABEL_MAX = 56;

export type ServiciosAmenityOptionDef = {
  id: ServiciosAmenityOptionId;
  groupId: Exclude<ServiciosAmenityGroupId, "other">;
  emoji: string;
  label: Record<ServiciosLang, string>;
};

export const SERVICIOS_AMENITY_GROUPS: Array<{ id: ServiciosAmenityGroupId; label: Record<ServiciosLang, string> }> = [
  { id: "service", label: { es: "Servicio", en: "Service" } },
  { id: "availability", label: { es: "Disponibilidad", en: "Availability" } },
  { id: "customers_served", label: { es: "Clientes que atiende", en: "Customers served" } },
  { id: "accessibility_languages", label: { es: "Accesibilidad e idiomas", en: "Accessibility & languages" } },
  { id: "discounts_benefits", label: { es: "Descuentos y beneficios", en: "Discounts & benefits" } },
  { id: "other", label: { es: "Otras opciones", en: "Other options" } },
];

export const SERVICIOS_AMENITY_OPTIONS: readonly ServiciosAmenityOptionDef[] = [
  // Group 1: Servicio
  {
    id: "service_at_home",
    groupId: "service",
    emoji: "🏠",
    label: { es: "Servicio a domicilio", en: "At-home service" },
  },
  {
    id: "service_remote_virtual",
    groupId: "service",
    emoji: "💻",
    label: { es: "Servicio remoto o virtual", en: "Remote or virtual service" },
  },
  {
    id: "service_online_appointments",
    groupId: "service",
    emoji: "📅",
    label: { es: "Citas en línea", en: "Online appointments" },
  },
  {
    id: "service_walkins_welcome",
    groupId: "service",
    emoji: "🚶",
    label: { es: "Atención sin cita", en: "Walk-ins welcome" },
  },
  {
    id: "service_emergency",
    groupId: "service",
    emoji: "🚨",
    label: { es: "Servicio de emergencia", en: "Emergency service" },
  },
  {
    id: "service_same_day",
    groupId: "service",
    emoji: "⚡",
    label: { es: "Servicio el mismo día", en: "Same-day service" },
  },
  {
    id: "service_free_estimates",
    groupId: "service",
    emoji: "💬",
    label: { es: "Estimados gratis", en: "Free estimates" },
  },
  {
    id: "service_free_initial_consultation",
    groupId: "service",
    emoji: "💬",
    label: { es: "Consulta inicial gratis", en: "Free initial consultation" },
  },

  // Group 2: Disponibilidad
  {
    id: "availability_weekends",
    groupId: "availability",
    emoji: "🗓️",
    label: { es: "Disponible fines de semana", en: "Weekend availability" },
  },
  {
    id: "availability_after_hours",
    groupId: "availability",
    emoji: "🌙",
    label: { es: "Disponible fuera de horario", en: "After-hours availability" },
  },
  {
    id: "availability_flexible",
    groupId: "availability",
    emoji: "⏰",
    label: { es: "Horario flexible", en: "Flexible scheduling" },
  },
  {
    id: "availability_24_7",
    groupId: "availability",
    emoji: "🔄",
    label: { es: "Atención 24/7", en: "24/7 availability" },
  },
  {
    id: "availability_fast_response",
    groupId: "availability",
    emoji: "⚡",
    label: { es: "Respuesta rápida", en: "Fast response" },
  },
  {
    id: "availability_advance_appointments",
    groupId: "availability",
    emoji: "📆",
    label: { es: "Citas con anticipación", en: "Advance appointments" },
  },

  // Group 3: Clientes que atiende
  {
    id: "customers_residential",
    groupId: "customers_served",
    emoji: "🏡",
    label: { es: "Residencial", en: "Residential" },
  },
  {
    id: "customers_commercial",
    groupId: "customers_served",
    emoji: "🏢",
    label: { es: "Comercial", en: "Commercial" },
  },
  {
    id: "customers_small_businesses",
    groupId: "customers_served",
    emoji: "💼",
    label: { es: "Pequeñas empresas", en: "Small businesses" },
  },
  {
    id: "customers_families",
    groupId: "customers_served",
    emoji: "👨‍👩‍👧‍👦",
    label: { es: "Familias", en: "Families" },
  },
  {
    id: "customers_students",
    groupId: "customers_served",
    emoji: "🎓",
    label: { es: "Estudiantes", en: "Students" },
  },
  {
    id: "customers_seniors",
    groupId: "customers_served",
    emoji: "🤝",
    label: { es: "Personas mayores", en: "Seniors" },
  },

  // Group 4: Accesibilidad e idiomas
  {
    id: "access_spanish_spoken",
    groupId: "accessibility_languages",
    emoji: "🌎",
    label: { es: "Se habla español", en: "Spanish spoken" },
  },
  {
    id: "access_bilingual_service",
    groupId: "accessibility_languages",
    emoji: "🗣️",
    label: { es: "Atención bilingüe", en: "Bilingual service" },
  },
  {
    id: "access_wheelchair_accessible",
    groupId: "accessibility_languages",
    emoji: "♿",
    label: { es: "Accesible para silla de ruedas", en: "Wheelchair accessible" },
  },
  {
    id: "access_text_support",
    groupId: "accessibility_languages",
    emoji: "💬",
    label: { es: "Atención por texto", en: "Text support" },
  },
  {
    id: "access_whatsapp_support",
    groupId: "accessibility_languages",
    emoji: "🟢",
    label: { es: "Atención por WhatsApp", en: "WhatsApp support" },
  },

  // Group 5: Descuentos y beneficios
  {
    id: "discount_military",
    groupId: "discounts_benefits",
    emoji: "🎖️",
    label: { es: "Descuento militar", en: "Military discount" },
  },
  {
    id: "discount_students",
    groupId: "discounts_benefits",
    emoji: "🎓",
    label: { es: "Descuento para estudiantes", en: "Student discount" },
  },
  {
    id: "discount_seniors",
    groupId: "discounts_benefits",
    emoji: "🤝",
    label: { es: "Descuento para personas mayores", en: "Senior discount" },
  },
  {
    id: "discount_seasonal_promotions",
    groupId: "discounts_benefits",
    emoji: "🏷️",
    label: { es: "Promociones por temporada", en: "Seasonal promotions" },
  },
  {
    id: "discount_first_visit",
    groupId: "discounts_benefits",
    emoji: "✨",
    label: { es: "Primera visita con descuento", en: "First-visit discount" },
  },
  {
    id: "discount_packages_available",
    groupId: "discounts_benefits",
    emoji: "📦",
    label: { es: "Paquetes disponibles", en: "Packages available" },
  },
] as const;

const BY_ID = new Map<ServiciosAmenityOptionId, ServiciosAmenityOptionDef>(SERVICIOS_AMENITY_OPTIONS.map((o) => [o.id, o]));
const ALLOWED = new Set<string>(SERVICIOS_AMENITY_OPTIONS.map((o) => o.id));

export function isServiciosAmenityOptionId(id: string): id is ServiciosAmenityOptionId {
  return ALLOWED.has(id);
}

export function getServiciosAmenityOption(id: ServiciosAmenityOptionId): ServiciosAmenityOptionDef {
  return BY_ID.get(id) ?? {
    id,
    groupId: "service",
    emoji: "✨",
    label: { es: id, en: id },
  };
}

export function sanitizeServiciosAmenityOptionIds(raw: string[] | undefined | null): ServiciosAmenityOptionId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<ServiciosAmenityOptionId>();
  const out: ServiciosAmenityOptionId[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!isServiciosAmenityOptionId(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= MAX_SERVICIOS_AMENITY_OPTIONS_SELECTED) break;
  }
  return out;
}

export function normalizeServiciosAmenityDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function collectStandardAmenityLabelKeys(): Set<string> {
  const keys = new Set<string>();
  for (const opt of SERVICIOS_AMENITY_OPTIONS) {
    keys.add(normalizeServiciosAmenityDedupeKey(opt.label.es));
    keys.add(normalizeServiciosAmenityDedupeKey(opt.label.en));
    keys.add(normalizeServiciosAmenityDedupeKey(opt.id));
    keys.add(normalizeServiciosAmenityDedupeKey(opt.id.replace(/_/g, " ")));
  }
  return keys;
}

export function sanitizeCustomServiciosAmenityLabels(raw: string[] | undefined | null): string[] {
  if (!Array.isArray(raw)) return [];
  const blocked = collectStandardAmenityLabelKeys();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, CUSTOM_SERVICIOS_AMENITY_LABEL_MAX);
    if (!t) continue;
    const k = normalizeServiciosAmenityDedupeKey(t);
    if (!k || blocked.has(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS) break;
  }
  return out;
}

