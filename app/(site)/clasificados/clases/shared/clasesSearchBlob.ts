import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { labelClasesSkillLevel, resolveClasesCategoryPublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

/**
 * Clases-owned search-index terms for buildCommunityDiscoverySearchBlob().
 * Only the class-type label and skill level are category-specific here;
 * every other field in the blob (venue/address/city/mode/audience/schedule)
 * is genuinely shared and stays in the shared search-blob builder.
 */
export function clasesSearchTypeAndLevel(
  pairs: CommunityListingPairMap,
  quick: boolean,
  lang: Lang,
): { typeLine: string; lvl: string } {
  const typeLine = quick ? clasesSearchAllCategoryLabels(pairs, lang) : "";
  const lvl = pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  return { typeLine, lvl };
}

/**
 * All selected class types joined for search indexing (Gate 2A) — every type
 * must be findable even though the result card only shows a capped display.
 * Falls back to the single primary category for legacy listings that never
 * had `Leonix:classCategories`.
 */
function clasesSearchAllCategoryLabels(pairs: CommunityListingPairMap, lang: Lang): string {
  const raw = (pairs["Leonix:classCategories"] ?? "").trim();
  const slugs = raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : [pairs["Leonix:classCategory"] ?? ""].filter(Boolean);
  const custom = pairs["Leonix:classCategoryCustom"] ?? "";
  const labels = slugs.map((slug) => resolveClasesCategoryPublicLabel(slug, custom, lang));
  return Array.from(new Set(labels.filter(Boolean))).join(" ");
}
