import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { resolveClasesCategoryPublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

export type ClasesResultsFilterParams = {
  cost: string;
  mode: string;
  classType: string;
  audienceF: string;
  levelF: string;
  registrationF: string;
};

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

/**
 * Clases-owned results filter predicate — extracted verbatim from the
 * `category === "clases"` branch that used to live inline in
 * CommunityListingsResultsClient.tsx. Only decides clases-specific facet
 * matches (cost/mode/classType/level); the shared results client still owns
 * generic filters (text/location/audience/registration) itself.
 */
export function clasesMatchesResultsFilters(
  pairs: CommunityListingPairMap,
  quick: boolean,
  lang: Lang,
  params: ClasesResultsFilterParams,
): boolean {
  const { cost, mode, classType, audienceF, levelF, registrationF } = params;

  if (cost !== "all") {
    const ct = (pairs["Leonix:classCostType"] ?? "").trim();
    if (cost === "gratis" && ct !== "gratis") return false;
    if (cost === "pagada" && ct !== "pagada") return false;
  }
  if (mode !== "all") {
    const m = (pairs["Leonix:mode"] ?? "").trim().toLowerCase();
    if (m !== mode.toLowerCase()) return false;
  }
  if (classType.trim()) {
    const slug = (pairs["Leonix:classCategory"] ?? "").trim().toLowerCase();
    const needle = classType.trim().toLowerCase();
    if (slug && slug === needle) {
      /* exact taxonomy slug match */
    } else {
      const catRaw =
        pairs["Leonix:classCategory"] === "otro"
          ? pairs["Leonix:classCategoryCustom"] || pairs["Leonix:classCategory"]
          : pairs["Leonix:classCategory"];
      const classTypeLine = quick
        ? resolveClasesCategoryPublicLabel(
            pairs["Leonix:classCategory"] ?? "",
            pairs["Leonix:classCategoryCustom"] ?? "",
            lang,
          )
        : "";
      const hay = `${String(catRaw ?? "")} ${classTypeLine}`.toLowerCase();
      if (!textMatch(hay, classType)) return false;
    }
  }
  if (audienceF !== "all") {
    const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
    if (a !== audienceF) return false;
  }
  if (levelF !== "all") {
    const lv = (pairs["Leonix:skillLevel"] ?? "").trim().toLowerCase();
    if (lv !== levelF) return false;
  }
  if (registrationF !== "all") {
    const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
    if (r !== registrationF) return false;
  }
  return true;
}
