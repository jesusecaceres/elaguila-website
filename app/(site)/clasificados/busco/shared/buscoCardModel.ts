import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { pickListingCardImageUrl } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { resolveBuscoTypePublicLabel } from "@/app/(site)/clasificados/busco/shared/buscoPublicLabel";
import { resolveBuscoBudgetDisplay } from "@/app/publicar/busco/shared/buscoBudgetDisplay";
import type { BuscoQuickDraft, BuscoUrgency } from "@/app/publicar/busco/shared/buscoQuickTypes";

import { detailPairsToMap, type BuscoListingPairMap } from "./buscoListingDetailPairs";
import type { BuscoListingBrowseRow } from "./loadBuscoListings";

export type BuscoRequestCardModel = {
  id: string;
  title: string;
  typeBadge: string;
  locationLine: string;
  imageUrl: string | null;
  excerpt: string | null;
  budget: string | null;
  urgency: BuscoUrgency | "";
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

function coerceUrgency(raw: string): BuscoUrgency | "" {
  const s = raw.trim();
  if (s === "pronto") return "esta_semana";
  if (s === "urgente") return "urgente_hoy";
  if (s === "esta_semana" || s === "lo_antes_posible" || s === "urgente_hoy") return s;
  return "";
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
  const budget = resolveBuscoBudgetDisplay(
    {
      budgetMode: pairs["Leonix:buscoBudgetMode"] ?? "",
      budgetAmount: pairs["Leonix:buscoBudgetAmount"] ?? "",
      legacyBudgetText: pairs["Leonix:buscoBudget"] ?? "",
    },
    lang,
  );
  return {
    id: row.id,
    title,
    typeBadge,
    locationLine: formatLocationLine(row.city, pairs),
    imageUrl: pickListingCardImageUrl(row.images),
    excerpt: excerptFromDescription(row.description),
    budget,
    urgency: coerceUrgency(pairs["Leonix:buscoUrgency"] ?? ""),
    leonixAdId: opts?.showLeonixAdId ? formatLeonixAdId(row.id) : null,
    detailHref,
  };
}

/** Section T — Preview's real "Vista previa en resultados" section builds this straight from the
 *  in-progress draft, reusing the exact same resolution logic as the published-row builder above. */
export function buildBuscoRequestCardModelFromDraft(
  draft: BuscoQuickDraft,
  lang: Lang,
  detailHref: string,
): BuscoRequestCardModel {
  const title = draft.title.trim() || "—";
  const typeBadge = resolveBuscoTypePublicLabel(draft.buscoType, draft.buscoTypeCustom, lang);
  const budget = resolveBuscoBudgetDisplay({ budgetMode: draft.budgetMode, budgetAmount: draft.budgetAmount }, lang);
  const place = [
    draft.city.trim(),
    draft.state.trim() && draft.zip.trim() ? `${draft.state.trim()} ${draft.zip.trim()}` : draft.state.trim() || draft.zip.trim(),
    draft.country.trim(),
  ]
    .filter(Boolean)
    .join(", ");
  const locationLine = place && draft.zone.trim() ? `${place} · ${draft.zone.trim()}` : place || draft.zone.trim();

  return {
    id: draft.previewListingId,
    title,
    typeBadge,
    locationLine,
    imageUrl: draft.imageDataUrl.trim() || null,
    excerpt: excerptFromDescription(draft.description),
    budget,
    urgency: draft.urgency !== "normal" ? draft.urgency : "",
    leonixAdId: null,
    detailHref,
  };
}
