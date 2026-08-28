import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesModeLabel,
  comunidadEventCostLabel,
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
  summarizeWeeklySchedule,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import type { CommunityListingBrowseRow } from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  comunidadScheduleHint,
  excerptFromDescription,
  formatLocationLine,
  formatLocationLineFromDraft,
  pickListingCardImageUrl,
  pickMainDraftImageUrl,
  type CommunityDiscoveryCardModel,
} from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import {
  comunidadEventCategoryCustom,
  comunidadEventCategorySlug,
} from "@/app/(site)/clasificados/comunidad/shared/comunidadEventCategoryFields";
import { labelCommunityAudience, resolveComunidadEventTypePublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { normalizeWeeklyScheduleArray } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";

/** Comunidad-owned result-card model builder (published-listing rows). */
export function buildComunidadDiscoveryCardModel(
  row: CommunityListingBrowseRow,
  lang: Lang,
  detailHref: string,
): CommunityDiscoveryCardModel {
  const pairs = detailPairsToMap(row.detail_pairs);
  const quick = isCommunityQuickListing(pairs);
  const title = String(row.title ?? "").trim() || "—";
  const organizer = (pairs["Leonix:organizer"] ?? "").trim() || null;
  const locationLine = formatLocationLine(row.city, pairs);
  const imageUrl = pickListingCardImageUrl(row.images);
  const excerpt = excerptFromDescription(row.description);

  const schedJson = pairs["Leonix:weeklyScheduleJson"] ?? "";
  const scheduleLine = summarizeWeeklySchedule(parseWeeklyScheduleJson(schedJson), lang) || comunidadScheduleHint(pairs, lang);

  const typeChip = quick
    ? resolveComunidadEventTypePublicLabel(comunidadEventCategorySlug(pairs), comunidadEventCategoryCustom(pairs), lang)
    : null;
  const ecRaw = (pairs["Leonix:eventCost"] ?? "").trim();
  const costBadge = ecRaw
    ? comunidadEventCostLabel(ecRaw, lang)
    : row.is_free
      ? lang === "es"
        ? "Gratis"
        : "Free"
      : null;
  const dr = [pairs["Leonix:eventDate"], pairs["Leonix:eventEndDate"]].filter(Boolean).join(" → ");
  const aud = pairs["Leonix:audience"] ? labelCommunityAudience(pairs["Leonix:audience"], lang) : "";
  const modeRaw = (pairs["Leonix:mode"] ?? "").trim();
  const modeL = quick && modeRaw ? clasesModeLabel(modeRaw, lang) : "";
  const secondaryParts = [modeL, dr, aud].filter(Boolean);
  const secondary = secondaryParts.length ? secondaryParts.join(" · ") : null;

  return {
    id: row.id,
    title,
    organizer,
    locationLine,
    imageUrl,
    costBadge: costBadge || null,
    typeChip: typeChip || null,
    secondaryChip: secondary,
    scheduleLine: scheduleLine || null,
    excerpt,
    detailHref,
  };
}

/** Comunidad-owned result-card model builder (editor draft, for preview). */
export function buildComunidadDiscoveryCardModelFromDraft(
  draft: ComunidadQuickDraft,
  lang: Lang,
  detailHref: string,
): CommunityDiscoveryCardModel {
  const title = draft.title.trim() || "—";
  const organizer = draft.organizer.trim() || null;
  const city = getCanonicalCityName(draft.publicCity.trim()) || draft.publicCity.trim();
  const locationLine = formatLocationLineFromDraft(draft, city);
  const imageUrl = pickMainDraftImageUrl(draft.images);
  const excerpt = excerptFromDescription(draft.description);

  const scheduleLine =
    summarizeWeeklySchedule(draft.weeklySchedule, lang) ||
    summarizeWeeklySchedule(normalizeWeeklyScheduleArray(draft.weeklySchedule), lang) ||
    comunidadDraftDateHint(draft, lang);

  const typeChip = resolveComunidadEventTypePublicLabel(draft.category, draft.categoryCustom, lang);
  const ecRaw = draft.eventCost.trim();
  const costBadge = ecRaw ? comunidadEventCostLabel(ecRaw, lang) : null;
  const dr = [draft.date.trim(), draft.eventEndDate.trim()].filter(Boolean).join(" → ");
  const aud = draft.audience ? labelCommunityAudience(draft.audience, lang) : "";
  const secondaryParts = [dr, aud].filter(Boolean);
  const secondary = secondaryParts.length ? secondaryParts.join(" · ") : null;

  return {
    id: draft.previewListingId,
    title,
    organizer,
    locationLine,
    imageUrl,
    costBadge: costBadge || null,
    typeChip: typeChip || null,
    secondaryChip: secondary,
    scheduleLine: scheduleLine || null,
    excerpt,
    detailHref,
  };
}

function comunidadDraftDateHint(draft: ComunidadQuickDraft, lang: Lang): string | null {
  const d = draft.date.trim();
  const s = draft.eventSessionStart.trim();
  const e = draft.eventSessionEnd.trim();
  if (d && s && e) return lang === "es" ? `${d} · ${s}–${e}` : `${d} · ${s}–${e}`;
  if (d) return d;
  return null;
}
