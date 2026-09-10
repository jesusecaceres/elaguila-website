import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  comunidadEventCategoryCustom,
  comunidadEventCategorySlug,
} from "@/app/(site)/clasificados/comunidad/shared/comunidadEventCategoryFields";
import { resolveComunidadEventTypePublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

/**
 * Comunidad-owned search-index term(s) for buildCommunityDiscoverySearchBlob().
 * Only the event-type label is category-specific here; every other field in
 * the blob (venue/address/city/mode/audience/schedule/dates) is genuinely
 * shared and stays in the shared search-blob builder.
 */
export function comunidadSearchTypeLine(pairs: CommunityListingPairMap, quick: boolean, lang: Lang): string {
  if (!quick) return "";
  return resolveComunidadEventTypePublicLabel(comunidadEventCategorySlug(pairs), comunidadEventCategoryCustom(pairs), lang);
}
