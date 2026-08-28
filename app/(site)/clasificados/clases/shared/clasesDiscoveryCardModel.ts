import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesCostTypeLabel,
  clasesModeLabel,
  clasesPriceFrequencyLabel,
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
  summarizeWeeklySchedule,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import type { CommunityListingBrowseRow } from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  excerptFromDescription,
  formatLocationLine,
  formatLocationLineFromDraft,
  pickListingCardImageUrl,
  pickMainDraftImageUrl,
  type CommunityDiscoveryCardModel,
} from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import {
  labelClasesSkillLevel,
  labelCommunityAudience,
  resolveClasesCategoryPublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { ClasesQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { normalizeWeeklyScheduleArray } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";

/** Clases-owned result-card model builder (published-listing rows). */
export function buildClasesDiscoveryCardModel(
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
  const scheduleLine = summarizeWeeklySchedule(parseWeeklyScheduleJson(schedJson), lang);

  const typeChip = quick
    ? resolveClasesCategoryPublicLabel(pairs["Leonix:classCategory"] ?? "", pairs["Leonix:classCategoryCustom"] ?? "", lang)
    : null;
  const ct = (pairs["Leonix:classCostType"] ?? "").trim();
  let costBadge: string | null = null;
  if (ct === "pagada") {
    const amt = (pairs["Leonix:priceAmount"] ?? "").trim();
    const fq = (pairs["Leonix:priceFrequency"] ?? "").trim();
    const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
    const costBase = clasesCostTypeLabel(ct, lang);
    costBadge = amt ? `${amt} ${fqL}`.trim() : costBase;
  } else if (ct === "gratis") {
    costBadge = clasesCostTypeLabel(ct, lang);
  } else if (row.is_free) {
    costBadge = lang === "es" ? "Gratis" : "Free";
  } else if (ct) {
    costBadge = clasesCostTypeLabel(ct, lang);
  }
  const modeRaw = (pairs["Leonix:mode"] ?? "").trim();
  const modeL = quick && modeRaw ? clasesModeLabel(modeRaw, lang) : "";
  const aud = pairs["Leonix:audience"] ? labelCommunityAudience(pairs["Leonix:audience"], lang) : "";
  const lvl = pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  const secondary = [modeL, aud, lvl].filter(Boolean).join(" · ") || null;

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

/** Clases-owned result-card model builder (editor draft, for preview). */
export function buildClasesDiscoveryCardModelFromDraft(
  draft: ClasesQuickDraft,
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
    summarizeWeeklySchedule(normalizeWeeklyScheduleArray(draft.weeklySchedule), lang);

  const typeChip = resolveClasesCategoryPublicLabel(draft.category, draft.categoryCustom, lang);
  const ct = draft.classCostType.trim();
  let costBadge: string | null = null;
  if (ct === "pagada") {
    const amt = draft.priceAmount.trim();
    const fq = draft.priceFrequency.trim();
    const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
    const costBase = clasesCostTypeLabel(ct, lang);
    costBadge = amt ? `${amt} ${fqL}`.trim() : costBase;
  } else if (ct === "gratis") {
    costBadge = clasesCostTypeLabel(ct, lang);
  } else if (ct) {
    costBadge = clasesCostTypeLabel(ct, lang);
  }
  const modeRaw = draft.mode.trim();
  const modeL = modeRaw ? clasesModeLabel(modeRaw, lang) : "";
  const aud = draft.audience ? labelCommunityAudience(draft.audience, lang) : "";
  const lvl = draft.skillLevel ? labelClasesSkillLevel(draft.skillLevel, lang) : "";
  const secondary = [modeL, aud, lvl].filter(Boolean).join(" · ") || null;

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
