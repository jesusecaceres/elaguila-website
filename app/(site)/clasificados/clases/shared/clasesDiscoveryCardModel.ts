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

/** Short readable date, e.g. "1 sep" / "Sep 1" — avoids showing a raw ISO fallback. */
function formatShortClassDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/** Result cards avoid chip soup: show up to 2 types by name, then "+N más" (Gate 2A Section AB). */
const MAX_TYPE_CHIP_LABELS = 2;

function formatClasesTypeChip(labels: string[], lang: Lang): string | null {
  const uniq = Array.from(new Set(labels.filter(Boolean)));
  if (uniq.length === 0) return null;
  if (uniq.length <= MAX_TYPE_CHIP_LABELS) return uniq.join(" + ");
  const shown = uniq.slice(0, MAX_TYPE_CHIP_LABELS);
  const rest = uniq.length - MAX_TYPE_CHIP_LABELS;
  const more = lang === "es" ? `+${rest} más` : `+${rest} more`;
  return `${shown.join(" + ")} ${more}`;
}

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

  const catRaw = (pairs["Leonix:classCategories"] ?? "").trim();
  const catSlugs = catRaw
    ? catRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [pairs["Leonix:classCategory"] ?? ""].filter(Boolean);
  const catCustom = pairs["Leonix:classCategoryCustom"] ?? "";
  const typeChip = quick
    ? formatClasesTypeChip(
        catSlugs.map((slug) => resolveClasesCategoryPublicLabel(slug, catCustom, lang)),
        lang,
      )
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
  const audRaw = (pairs["Leonix:audiences"] ?? "").trim();
  const audSlugs = audRaw
    ? audRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [pairs["Leonix:audience"] ?? ""].filter(Boolean);
  /** Concise subset for the result card — avoid audience chip soup. */
  const aud = audSlugs.slice(0, 2).map((a) => labelCommunityAudience(a, lang)).join(" + ");
  const lvl = pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  const isOneTime = (pairs["Leonix:scheduleMode"] ?? "").trim() === "one_time";
  const dr = isOneTime
    ? formatShortClassDate(String(pairs["Leonix:oneTimeDate"] ?? ""), lang)
    : [pairs["Leonix:classStartDate"], pairs["Leonix:classEndDate"]]
        .filter(Boolean)
        .map((iso) => formatShortClassDate(String(iso), lang))
        .join(" → ");
  const secondary = [modeL, dr, aud, lvl].filter(Boolean).join(" · ") || null;

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

  const draftCatSlugs = draft.categories.length > 0 ? draft.categories : [draft.category].filter(Boolean);
  const typeChip = formatClasesTypeChip(
    draftCatSlugs.map((slug) => resolveClasesCategoryPublicLabel(slug, draft.categoryCustom, lang)),
    lang,
  );
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
  const draftAudSlugs = draft.audiences.length > 0 ? draft.audiences : [draft.audience].filter(Boolean);
  const aud = draftAudSlugs.slice(0, 2).map((a) => labelCommunityAudience(a, lang)).join(" + ");
  const lvl = draft.skillLevel ? labelClasesSkillLevel(draft.skillLevel, lang) : "";
  const dr =
    draft.scheduleMode === "one_time"
      ? formatShortClassDate(draft.oneTimeDate.trim(), lang)
      : [draft.startDate.trim(), draft.endDate.trim()]
          .filter(Boolean)
          .map((iso) => formatShortClassDate(iso, lang))
          .join(" → ");
  const secondary = [modeL, dr, aud, lvl].filter(Boolean).join(" · ") || null;

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
