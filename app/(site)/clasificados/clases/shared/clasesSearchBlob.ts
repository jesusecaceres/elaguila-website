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
  const typeLine = quick
    ? resolveClasesCategoryPublicLabel(pairs["Leonix:classCategory"] ?? "", pairs["Leonix:classCategoryCustom"] ?? "", lang)
    : "";
  const lvl = pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  return { typeLine, lvl };
}
