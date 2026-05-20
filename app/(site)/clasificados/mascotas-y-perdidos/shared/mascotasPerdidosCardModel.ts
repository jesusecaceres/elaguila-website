import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { pickListingCardImageUrl } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { resolveMascotasPerdidosNoticeLabel } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

import { detailPairsToMap } from "./mascotasPerdidosListingDetailPairs";
import type { MascotasPerdidosListingBrowseRow } from "./loadMascotasPerdidosListings";

export type MascotasPerdidosNoticeCardModel = {
  id: string;
  title: string;
  typeBadge: string;
  city: string | null;
  lastSeenLocation: string | null;
  imageUrl: string | null;
  excerpt: string | null;
  leonixAdId: string | null;
  detailHref: string;
};

function excerptFromDescription(raw: string | null | undefined, max = 120): string | null {
  const t = stripLeonixPublishedDescriptionBody(String(raw ?? "")) || String(raw ?? "").trim();
  if (!t) return null;
  const plain = t
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

export function buildMascotasPerdidosNoticeCardModel(
  row: MascotasPerdidosListingBrowseRow,
  lang: Lang,
  detailHref: string,
): MascotasPerdidosNoticeCardModel {
  const pairs = detailPairsToMap(row.detail_pairs);
  const title = String(row.title ?? "").trim() || "—";
  const typeSlug = (pairs["Leonix:noticeType"] ?? "").trim();
  const typeBadge = typeSlug
    ? resolveMascotasPerdidosNoticeLabel(typeSlug, lang)
    : lang === "es"
      ? "Aviso"
      : "Notice";
  const city = String(row.city ?? "").trim() || null;
  const lastSeenLocation = (pairs["Leonix:lastSeenLocation"] ?? "").trim() || null;
  const leonixRaw = String(row.leonix_ad_id ?? "").trim();

  return {
    id: row.id,
    title,
    typeBadge,
    city,
    lastSeenLocation,
    imageUrl: pickListingCardImageUrl(row.images),
    excerpt: excerptFromDescription(row.description),
    leonixAdId: leonixRaw || null,
    detailHref,
  };
}
