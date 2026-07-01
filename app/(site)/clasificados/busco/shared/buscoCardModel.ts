import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { pickListingCardImageUrl } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/clasificados/busco/shared/buscoPublicLabel";

import { detailPairsToMap, type BuscoListingPairMap } from "./buscoListingDetailPairs";
import type { BuscoListingBrowseRow } from "./loadBuscoListings";
import { buscoRowHasEmail, buscoRowHasPhone } from "./buscoSearchText";
import { formatBuscoBudget } from "@/app/publicar/busco/shared/buscoFormatBudget";

export type BuscoRequestCardModel = {
  id: string;
  title: string;
  typeBadge: string;
  locationLine: string;
  imageUrl: string | null;
  excerpt: string | null;
  budget: string | null;
  urgency: string | null;
  contactChip: string | null;
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

function formatLocationLine(city: string | null, pairs: BuscoListingPairMap): string {
  const c = String(city ?? "").trim();
  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const st = (pairs["Leonix:state"] ?? "").trim();
  const zip = (pairs["Leonix:zip"] ?? "").trim();
  const country = (pairs["Leonix:buscoCountry"] ?? "").trim();
  const place = [c, st && zip ? `${st} ${zip}` : st || zip, country].filter(Boolean).join(", ");
  if (place && zone) return `${place} · ${zone}`;
  return place || zone || "";
}

function contactChipLabel(row: BuscoListingBrowseRow, pairs: BuscoListingPairMap, lang: Lang): string | null {
  const hasPhone = buscoRowHasPhone(row, pairs);
  const hasEmail = buscoRowHasEmail(row, pairs);
  if (hasPhone && hasEmail) return lang === "es" ? "Teléfono y correo" : "Phone and email";
  if (hasPhone) return lang === "es" ? "Con teléfono / WhatsApp" : "Phone / WhatsApp";
  if (hasEmail) return lang === "es" ? "Con correo" : "Email";
  return null;
}

export function buildBuscoRequestCardModel(
  row: BuscoListingBrowseRow,
  lang: Lang,
  detailHref: string,
  opts?: { showLeonixAdId?: boolean },
): BuscoRequestCardModel {
  const pairs = detailPairsToMap(row.detail_pairs);
  const title = String(row.title ?? "").trim() || "—";
  const typeBadge = resolveBuscoTypePublicLabel(
    pairs["Leonix:buscoType"] ?? "",
    pairs["Leonix:buscoTypeCustom"] ?? "",
    lang,
  );
  const budgetRaw = (pairs["Leonix:buscoBudget"] ?? "").trim();
  const budget = budgetRaw ? formatBuscoBudget(budgetRaw) : null;
  const urgencyRaw = (pairs["Leonix:buscoUrgency"] ?? "").trim();
  const urgency = urgencyRaw || null;
  return {
    id: row.id,
    title,
    typeBadge,
    locationLine: formatLocationLine(row.city, pairs),
    imageUrl: pickListingCardImageUrl(row.images),
    excerpt: excerptFromDescription(row.description),
    budget,
    urgency,
    contactChip: contactChipLabel(row, pairs, lang),
    leonixAdId: opts?.showLeonixAdId ? formatLeonixAdId(row.id) : null,
    detailHref,
  };
}
