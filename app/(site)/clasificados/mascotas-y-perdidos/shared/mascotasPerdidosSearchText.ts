import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { resolveMascotasPerdidosNoticeLabel } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

import type { MascotasPerdidosListingBrowseRow } from "./loadMascotasPerdidosListings";
import { detailPairsToMap, type MascotasPerdidosListingPairMap } from "./mascotasPerdidosListingDetailPairs";

export function buildMascotasPerdidosSearchBlob(
  row: MascotasPerdidosListingBrowseRow,
  pairs: MascotasPerdidosListingPairMap,
  lang: Lang,
): string {
  const title = String(row.title ?? "");
  const desc = stripLeonixPublishedDescriptionBody(String(row.description ?? "")) || String(row.description ?? "");
  const typeSlug = pairs["Leonix:noticeType"] ?? "";
  const typeLabel = resolveMascotasPerdidosNoticeLabel(typeSlug, lang);
  const city = String(row.city ?? "");
  const lastSeen = pairs["Leonix:lastSeenLocation"] ?? "";
  const landmark = pairs["Leonix:landmark"] ?? "";
  const leonix = String(row.leonix_ad_id ?? "");
  /** Gate 3 — pet/object fields folded into the search blob so species/breed/color/name are findable. */
  const petFields = [
    pairs["Leonix:petName"],
    pairs["Leonix:species"],
    pairs["Leonix:breed"],
    pairs["Leonix:color"],
    pairs["Leonix:objectType"],
  ]
    .filter(Boolean)
    .join(" ");
  return `${title} ${desc} ${typeLabel} ${typeSlug} ${city} ${lastSeen} ${landmark} ${petFields} ${leonix}`.toLowerCase();
}
