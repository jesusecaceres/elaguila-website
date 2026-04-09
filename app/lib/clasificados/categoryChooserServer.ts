import "server-only";

import type { CategoryKey } from "@/app/clasificados/config/categoryConfig";
import { getClasificadosCategoryRegistryMerged } from "@/app/lib/clasificados/clasificadosCategoryRegistry";

const DEFAULT_PUBLISH_KEYS: Array<Exclude<CategoryKey, "all">> = [
  "en-venta",
  "rentas",
  "autos",
  "restaurantes",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
];

/**
 * Ordered category keys for `/clasificados/publicar` chooser, merged with `site_category_config`.
 * Hidden categories are omitted. Falls back to code defaults if merge yields none (misconfiguration guard).
 */
export async function getPublishChooserCategoryKeys(): Promise<Array<Exclude<CategoryKey, "all">>> {
  try {
    const merged = await getClasificadosCategoryRegistryMerged();
    const visible = merged
      .filter((e) => e.visibility !== "hidden" && e.operationalStatus !== "hidden")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((e) => e.slug as Exclude<CategoryKey, "all">);
    if (visible.length > 0) return visible;
  } catch {
    /* Supabase or table missing */
  }
  return DEFAULT_PUBLISH_KEYS;
}
