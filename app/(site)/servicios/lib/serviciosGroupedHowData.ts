import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  SERVICIOS_AMENITY_GROUPS,
  SERVICIOS_AMENITY_OPTIONS,
  isServiciosAmenityOptionId,
  type ServiciosAmenityGroupId,
} from "./serviciosAmenitiesCatalog";
import { collectServiciosLanguageLabelsFromProfile } from "./serviciosLanguageChips";
import { hasAmenityOptionsResolved, hasMainColumnServiceAreasResolved } from "./serviciosProfilePresence";

export type ServiciosHowGroup = {
  id: string;
  title: string;
  icon: string;
  items: string[];
};

function groupIcon(id: string): string {
  switch (id) {
    case "service":
      return "🔧";
    case "availability":
      return "🕐";
    case "customers_served":
      return "👥";
    case "accessibility_languages":
      return "🗣️";
    case "discounts_benefits":
      return "💰";
    case "other":
      return "✨";
    case "languages":
      return "🗣️";
    case "service_areas":
      return "📍";
    default:
      return "📍";
  }
}

export function buildServiciosHowGroups(profile: ServiciosProfileResolved, lang: ServiciosLang): ServiciosHowGroup[] {
  const groups: ServiciosHowGroup[] = [];
  const byGroup = new Map<ServiciosAmenityGroupId, string[]>();

  for (const id of profile.amenityOptionIds) {
    if (!isServiciosAmenityOptionId(id)) continue;
    const def = SERVICIOS_AMENITY_OPTIONS.find((o) => o.id === id);
    const gid = def?.groupId ?? "service";
    const cur = byGroup.get(gid) ?? [];
    cur.push(def?.label[lang] ?? id);
    byGroup.set(gid, cur);
  }

  // Owner-QA (section-specific "Otro") — custom entries fold into their OWN subgroup's items,
  // not a separate shared "Otras opciones" bucket.
  for (const entry of profile.customAmenityOptions) {
    const label = entry.label.trim();
    if (!label) continue;
    const cur = byGroup.get(entry.groupId) ?? [];
    cur.push(label);
    byGroup.set(entry.groupId, cur);
  }

  for (const g of SERVICIOS_AMENITY_GROUPS.filter((row) => row.id !== "other")) {
    const items = byGroup.get(g.id) ?? [];
    if (items.length === 0) continue;
    groups.push({
      id: g.id,
      title: g.label[lang],
      icon: groupIcon(g.id),
      items,
    });
  }

  const langs = collectServiciosLanguageLabelsFromProfile(profile.hero);
  if (langs.length > 0) {
    const acc = groups.find((g) => g.id === "accessibility_languages");
    if (acc) {
      acc.items = [...acc.items, ...langs.filter((l) => !acc.items.includes(l))];
    } else {
      groups.push({
        id: "languages",
        title: lang === "en" ? "Languages" : "Idiomas",
        icon: groupIcon("languages"),
        items: langs,
      });
    }
  }

  if (hasMainColumnServiceAreasResolved(profile)) {
    const areas = profile.serviceAreas.items.map((a) => a.label.trim()).filter(Boolean);
    if (areas.length > 0) {
      groups.push({
        id: "service_areas",
        title: lang === "en" ? "Service areas" : "Áreas de servicio",
        icon: groupIcon("service_areas"),
        items: areas,
      });
    }
  }

  return groups;
}

export function hasServiciosGroupedHowSection(profile: ServiciosProfileResolved): boolean {
  return (
    hasAmenityOptionsResolved(profile) ||
    hasMainColumnServiceAreasResolved(profile) ||
    collectServiciosLanguageLabelsFromProfile(profile.hero).length > 0
  );
}
