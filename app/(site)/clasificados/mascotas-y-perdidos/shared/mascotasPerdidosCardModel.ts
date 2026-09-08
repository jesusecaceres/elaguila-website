import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { pickListingCardImageUrl, pickMainDraftImageUrl } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { resolveMascotasPerdidosNoticeLabel } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import type { MascotasPerdidosQuickDraft } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickTypes";

import { detailPairsToMap } from "./mascotasPerdidosListingDetailPairs";
import type { MascotasPerdidosListingBrowseRow } from "./loadMascotasPerdidosListings";

export type MascotasPerdidosNoticeCardModel = {
  id: string;
  noticeType: string;
  title: string;
  typeBadge: string;
  city: string | null;
  lastSeenLocation: string | null;
  dateLabel: string | null;
  reward: string | null;
  keyFact: string | null;
  imageUrl: string | null;
  excerpt: string | null;
  leonixAdId: string | null;
  detailHref: string;
};

function excerptFromDescription(raw: string | null | undefined, max = 120): string | null {
  const t = stripLeonixPublishedDescriptionBody(String(raw ?? "")) || String(raw ?? "").trim();
  if (!t) return null;
  const plain = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return null;
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

function formatShortDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function rewardLine(offersReward: boolean, amount: string, lang: Lang): string | null {
  if (!offersReward || !amount.trim()) return null;
  return `${lang === "es" ? "RECOMPENSA" : "REWARD"} $${amount.trim()}`;
}

/** One important identifying trait — result cards avoid chip soup (Gate 3 Section S). */
function buildKeyFact(input: { species: string; breed: string; ageApprox: string; size: string; objectType: string }, noticeType: string): string | null {
  if (noticeType === "objeto-perdido" || noticeType === "objeto-encontrado") {
    return input.objectType.trim() || null;
  }
  const parts = [input.species.trim(), input.breed.trim()].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  const alt = [input.ageApprox.trim(), input.size.trim()].filter(Boolean);
  return alt.length ? alt.join(" · ") : null;
}

export function buildMascotasPerdidosNoticeCardModel(
  row: MascotasPerdidosListingBrowseRow,
  lang: Lang,
  detailHref: string,
): MascotasPerdidosNoticeCardModel {
  const pairs = detailPairsToMap(row.detail_pairs);
  const title = String(row.title ?? "").trim() || "—";
  const typeSlug = (pairs["Leonix:noticeType"] ?? "").trim();
  const typeBadge = typeSlug ? resolveMascotasPerdidosNoticeLabel(typeSlug, lang) : lang === "es" ? "Aviso" : "Notice";
  const city = String(row.city ?? "").trim() || null;
  const lastSeenLocation = (pairs["Leonix:lastSeenLocation"] ?? "").trim() || null;
  const leonixRaw = String(row.leonix_ad_id ?? "").trim();

  const isFound = typeSlug === "mascota-encontrada" || typeSlug === "objeto-encontrado";
  const dateIso = isFound ? pairs["Leonix:foundDate"] ?? "" : pairs["Leonix:lastSeenDate"] ?? "";
  const dateLabel = formatShortDate(dateIso, lang) || null;

  const reward = rewardLine(pairs["Leonix:offersReward"] === "1", pairs["Leonix:rewardAmount"] ?? "", lang);
  const keyFact = buildKeyFact(
    {
      species: pairs["Leonix:species"] ?? "",
      breed: pairs["Leonix:breed"] ?? "",
      ageApprox: pairs["Leonix:ageApprox"] ?? "",
      size: pairs["Leonix:size"] ?? "",
      objectType: pairs["Leonix:objectType"] ?? "",
    },
    typeSlug,
  );

  return {
    id: row.id,
    noticeType: typeSlug,
    title,
    typeBadge,
    city,
    lastSeenLocation,
    dateLabel,
    reward,
    keyFact,
    imageUrl: pickListingCardImageUrl(row.images),
    excerpt: excerptFromDescription(row.description),
    leonixAdId: leonixRaw || null,
    detailHref,
  };
}

/** Gate 3 Section R — draft-based builder so Preview can render the REAL result-card component. */
export function buildMascotasPerdidosNoticeCardModelFromDraft(
  draft: MascotasPerdidosQuickDraft,
  lang: Lang,
  detailHref: string,
): MascotasPerdidosNoticeCardModel {
  const title = draft.petName.trim() || draft.title.trim() || "—";
  const typeBadge = draft.noticeType ? resolveMascotasPerdidosNoticeLabel(draft.noticeType, lang) : lang === "es" ? "Aviso" : "Notice";
  const isFound = draft.noticeType === "mascota-encontrada" || draft.noticeType === "objeto-encontrado";
  const dateIso = isFound ? draft.foundDate : draft.lastSeenDate;
  const dateLabel = formatShortDate(dateIso, lang) || null;
  const reward = rewardLine(draft.offersReward, draft.rewardAmount, lang);
  const keyFact = buildKeyFact(
    { species: draft.species, breed: draft.breed, ageApprox: draft.ageApprox, size: draft.size, objectType: draft.objectType },
    draft.noticeType,
  );

  return {
    id: draft.previewListingId,
    noticeType: draft.noticeType,
    title,
    typeBadge,
    city: draft.city.trim() || null,
    lastSeenLocation: draft.lastSeenLocation.trim() || null,
    dateLabel,
    reward,
    keyFact,
    imageUrl: pickMainDraftImageUrl(draft.images),
    excerpt: excerptFromDescription(draft.description),
    leonixAdId: null,
    detailHref,
  };
}
