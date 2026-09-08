import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { labelClasesSkillLevel, labelCommunityAudience, resolveClasesCategoryPublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

/**
 * Clases-owned search-index terms for buildCommunityDiscoverySearchBlob().
 * The class-type labels, skill level, and (Gate 2D) full multi-audience list are
 * category-specific here; every other field in the blob (venue/address/city/mode/schedule, and the
 * single primary `Leonix:audience`) is genuinely shared and stays in the shared search-blob
 * builder — `typeLine` also folds in every NON-primary selected audience (the primary one is
 * already indexed there) so a search for "Adultos mayores" still finds a class whose primary
 * audience is "Jóvenes".
 */
export function clasesSearchTypeAndLevel(
  pairs: CommunityListingPairMap,
  quick: boolean,
  lang: Lang,
): { typeLine: string; lvl: string } {
  const typeLine = quick
    ? [clasesSearchAllCategoryLabels(pairs, lang), clasesSearchExtraAudienceLabels(pairs, lang)]
        .filter(Boolean)
        .join(" ")
    : "";
  const lvl = pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  return { typeLine, lvl };
}

/**
 * All audience labels beyond the primary one (already indexed by the shared blob builder via
 * `Leonix:audience`), so every selected audience remains searchable. Legacy listings have no
 * `Leonix:audiences` key at all — this returns "" for them, same as before Gate 2D.
 */
function clasesSearchExtraAudienceLabels(pairs: CommunityListingPairMap, lang: Lang): string {
  const raw = (pairs["Leonix:audiences"] ?? "").trim();
  if (!raw) return "";
  const slugs = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(1);
  const labels = slugs.map((slug) => labelCommunityAudience(slug, lang));
  return Array.from(new Set(labels.filter(Boolean))).join(" ");
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
