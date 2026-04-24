import type { ServiciosInternalGroup } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

export const SERVICIOS_INTERNAL_GROUP_IDS: ServiciosInternalGroup[] = [
  "home_trade",
  "automotive",
  "health_beauty",
  "legal_professional",
  "education_tutoring",
  "events_entertainment",
  "technology_support",
  "miscellaneous",
  "other",
];

const MAP: Record<ServiciosInternalGroup, { es: string; en: string }> = {
  home_trade: { es: "Hogar y oficios", en: "Home & trades" },
  automotive: { es: "Automotriz", en: "Automotive" },
  health_beauty: { es: "Salud y belleza", en: "Health & beauty" },
  legal_professional: { es: "Legal y profesional", en: "Legal & professional" },
  education_tutoring: { es: "Educación y tutoría", en: "Education & tutoring" },
  events_entertainment: { es: "Eventos y entretenimiento", en: "Events & entertainment" },
  technology_support: { es: "Tecnología y soporte", en: "Technology & support" },
  miscellaneous: { es: "Servicios generales", en: "General services" },
  other: { es: "Otros", en: "Other" },
};

/** Display-only labels for discovery cards — internal codes stay stable for future filters. */
export function formatServiciosInternalGroupForDiscovery(
  group: string | null | undefined,
  lang: "es" | "en",
): string | null {
  if (!group || !(group in MAP)) return null;
  return MAP[group as ServiciosInternalGroup][lang];
}
