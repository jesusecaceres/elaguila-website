import type { ServiciosInternalGroup } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

const MAP: Record<ServiciosInternalGroup, { es: string; en: string }> = {
  home_trade: { es: "Hogar y oficios", en: "Home & trades" },
  legal: { es: "Legal", en: "Legal" },
  health: { es: "Salud", en: "Health" },
  beauty: { es: "Belleza", en: "Beauty" },
  automotive: { es: "Automotriz", en: "Automotive" },
  education: { es: "Educación", en: "Education" },
  pets: { es: "Mascotas", en: "Pets" },
  moving: { es: "Mudanzas y logística", en: "Moving & logistics" },
  cleaning: { es: "Limpieza", en: "Cleaning" },
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
