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

  const customByGroup = profile.customAmenityOptionsByGroup ?? {};
  const looseCustom: string[] = [];
  for (const g of SERVICIOS_AMENITY_GROUPS.filter((row) => row.id !== "other")) {
    const custom = (customByGroup[g.id] ?? []).filter((x) => typeof x === "string" && x.trim().length > 0);
    const cur = byGroup.get(g.id) ?? [];
    const items = [...cur, ...custom.map((x) => x.trim())];
    if (items.length === 0) continue;
    groups.push({
      id: g.id,
      title: g.label[lang],
      icon: groupIcon(g.id),
      items,
    });
  }

  // Legacy flat custom amenities not attributable to a specific group (older stored profiles).
  const knownGroupIds = new Set(SERVICIOS_AMENITY_GROUPS.filter((row) => row.id !== "other").map((r) => r.id));
  const groupedCustomKeys = new Set<string>();
  for (const gid of knownGroupIds) {
    for (const label of customByGroup[gid] ?? []) groupedCustomKeys.add(label.trim().toLowerCase());
  }
  for (const label of profile.customAmenityOptions ?? []) {
    if (typeof label !== "string" || !label.trim()) continue;
    if (groupedCustomKeys.has(label.trim().toLowerCase())) continue;
    looseCustom.push(label.trim());
  }
  if (looseCustom.length > 0) {
    groups.push({
      id: "other",
      title: lang === "en" ? "Other options" : "Otras opciones",
      icon: groupIcon("other"),
      items: looseCustom,
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
