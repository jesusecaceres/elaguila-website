import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";

import type { CommunityDiscoveryCardModel } from "./communityDiscoveryListingCardModel";
import type { CommunityListingBrowseRow } from "./communityListingsBrowseClient";
import {
  buildClasesDiscoveryCardModel,
  buildClasesDiscoveryCardModelFromDraft,
} from "@/app/(site)/clasificados/clases/shared/clasesDiscoveryCardModel";
import {
  buildComunidadDiscoveryCardModel,
  buildComunidadDiscoveryCardModelFromDraft,
} from "@/app/(site)/clasificados/comunidad/shared/comunidadDiscoveryCardModel";

/**
 * Gate 0 (community category isolation) — narrow routing boundary only. The
 * actual per-category result-card model-building logic (cost badge, type
 * chip, secondary chip composition) lives in each category's own builder —
 * app/(site)/clasificados/clases/shared/clasesDiscoveryCardModel.ts and
 * app/(site)/clasificados/comunidad/shared/comunidadDiscoveryCardModel.ts.
 * This file exists only because a few call sites (the shared community
 * results list and the shared preview shell) render either category off one
 * component and only know which builder to call via a `category` string at
 * runtime — kept in its own module (not inside communityDiscoveryListingCardModel.ts)
 * to avoid a circular import between that shared-helpers file and the two
 * category-owned builder files.
 */
export function buildCommunityDiscoveryCardModel(
  row: CommunityListingBrowseRow,
  category: "clases" | "comunidad",
  lang: Lang,
  detailHref: string,
): CommunityDiscoveryCardModel {
  return category === "clases"
    ? buildClasesDiscoveryCardModel(row, lang, detailHref)
    : buildComunidadDiscoveryCardModel(row, lang, detailHref);
}

/** Build card model from draft data for preview purposes. */
export function buildCommunityDiscoveryCardModelFromDraft(
  draft: ClasesQuickDraft | ComunidadQuickDraft,
  category: "clases" | "comunidad",
  lang: Lang,
  detailHref: string,
): CommunityDiscoveryCardModel {
  return category === "clases"
    ? buildClasesDiscoveryCardModelFromDraft(draft as ClasesQuickDraft, lang, detailHref)
    : buildComunidadDiscoveryCardModelFromDraft(draft as ComunidadQuickDraft, lang, detailHref);
}
