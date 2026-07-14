import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesCostTypeLabel,
  clasesModeLabel,
  clasesPriceFrequencyLabel,
  comunidadEventCostLabel,
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
  summarizeWeeklySchedule,
  type CommunityListingPairMap,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import type { CommunityListingBrowseRow } from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  labelClasesSkillLevel,
  labelCommunityAudience,
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { normalizeWeeklyScheduleArray } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";

export type CommunityDiscoveryCardModel = {
  id: string;
  title: string;
  organizer: string | null;
  locationLine: string;
  imageUrl: string | null;
  costBadge: string | null;
  typeChip: string | null;
  secondaryChip: string | null;
  scheduleLine: string | null;
  excerpt: string | null;
  detailHref: string;
};

/** Public discovery cards must not use session/blob URLs (they break after refresh / in prod). */
export function isPublicPersistedListingImageUrl(url: string): boolean {
  const u = String(url ?? "").trim();
  if (!u) return false;
  const low = u.toLowerCase();
  if (low.startsWith("blob:") || low.startsWith("javascript:")) return false;
  return true;
}

/** Prefer main image, then first usable URL (string or { url }). Skips blob/session URLs. */
export function pickListingCardImageUrl(images: unknown): string | null {
  if (images == null) return null;
  if (!Array.isArray(images) || images.length === 0) return null;
  const items = images as unknown[];
  const urls: string[] = [];
  let mainUrl: string | null = null;
  for (const x of items) {
    if (typeof x === "string" && x.trim()) {
      const u = x.trim();
      if (!isPublicPersistedListingImageUrl(u)) continue;
      urls.push(u);
      continue;
    }
    if (x && typeof x === "object") {
      const o = x as { url?: unknown; isMain?: unknown };
      const u = typeof o.url === "string" ? o.url.trim() : "";
      if (!u || !isPublicPersistedListingImageUrl(u)) continue;
      if (o.isMain === true) mainUrl = u;
      urls.push(u);
    }
  }
  if (mainUrl) return mainUrl;
  return urls[0] ?? null;
}

function excerptFromDescription(raw: string | null | undefined, max = 140): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  const plain = t
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

function comunidadEventCategorySlug(pairs: CommunityListingPairMap): string {
  return (pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "").trim();
}

function comunidadEventCategoryCustom(pairs: CommunityListingPairMap): string {
  return (pairs["Leonix:eventCategoryCustom"] ?? "").trim();
}

function formatLocationLine(city: string | null, pairs: CommunityListingPairMap): string {
  const c = String(city ?? "").trim();
  const st = (pairs["Leonix:state"] ?? "").trim();
  const zip = (pairs["Leonix:zip"] ?? "").trim();
  const country = (pairs["Leonix:country"] ?? "").trim();
  const venue = (pairs["Leonix:venue"] ?? "").trim();
  const parts: string[] = [];
  if (c) parts.push(c);
  if (st && zip) parts.push(`${st} ${zip}`);
  else if (st) parts.push(st);
  else if (zip) parts.push(zip);
  if (country) parts.push(country);
  const line = parts.join(", ");
  if (venue && line) return `${venue} · ${line}`;
  if (venue) return venue;
  return line || (c || "");
}

function comunidadScheduleHint(pairs: CommunityListingPairMap, lang: Lang): string | null {
  const rows = parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]);
  const weekly = summarizeWeeklySchedule(rows, lang);
  if (weekly) return weekly;
  const d = (pairs["Leonix:eventDate"] ?? "").trim();
  const s = (pairs["Leonix:eventSessionStart"] ?? "").trim();
  const e = (pairs["Leonix:eventSessionEnd"] ?? "").trim();
  if (d && s && e) return lang === "es" ? `${d} · ${s}–${e}` : `${d} · ${s}–${e}`;
  if (d) return d;
  return null;
}

export function buildCommunityDiscoverySearchBlob(
  row: CommunityListingBrowseRow,
  category: "clases" | "comunidad",
  pairs: CommunityListingPairMap,
  lang: Lang,
): string {
  const title = String(row.title ?? "");
  const desc = String(row.description ?? "");
  const quick = isCommunityQuickListing(pairs);
  let typeLine = "";
  if (category === "clases" && quick) {
    typeLine = resolveClasesCategoryPublicLabel(
      pairs["Leonix:classCategory"] ?? "",
      pairs["Leonix:classCategoryCustom"] ?? "",
      lang,
    );
  } else if (category === "comunidad" && quick) {
    typeLine = resolveComunidadEventTypePublicLabel(comunidadEventCategorySlug(pairs), comunidadEventCategoryCustom(pairs), lang);
  }
  const venue = pairs["Leonix:venue"] ?? "";
  const addr = pairs["Leonix:addressLine1"] ?? "";
  const addr2 = pairs["Leonix:addressLine2"] ?? "";
  const city = String(row.city ?? "");
  const zip = pairs["Leonix:zip"] ?? "";
  const state = pairs["Leonix:state"] ?? "";
  const country = pairs["Leonix:country"] ?? "";
  const modeRaw = (pairs["Leonix:mode"] ?? "").trim();
  const mode =
    category === "clases" && modeRaw ? clasesModeLabel(modeRaw, lang) : category === "comunidad" && modeRaw ? clasesModeLabel(modeRaw, lang) : "";
  const aud = pairs["Leonix:audience"] ? labelCommunityAudience(pairs["Leonix:audience"], lang) : "";
  const lvl =
    category === "clases" && pairs["Leonix:skillLevel"] ? labelClasesSkillLevel(pairs["Leonix:skillLevel"], lang) : "";
  const sched = summarizeWeeklySchedule(parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]), lang);
  const dateBits = [pairs["Leonix:eventDate"], pairs["Leonix:eventEndDate"], pairs["Leonix:eventSessionStart"], pairs["Leonix:eventSessionEnd"]]
    .filter(Boolean)
    .join(" ");
  return `${title} ${desc} ${pairs["Leonix:organizer"] ?? ""} ${pairs["Leonix:bringNote"] ?? ""} ${typeLine} ${venue} ${addr} ${addr2} ${city} ${zip} ${state} ${country} ${mode} ${aud} ${lvl} ${sched} ${dateBits}`.toLowerCase();
}

export function buildCommunityDiscoveryCardModel(
  row: CommunityListingBrowseRow,
  category: "clases" | "comunidad",
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

  if (category === "clases") {
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

/** Build card model from draft data for preview purposes. */
export function buildCommunityDiscoveryCardModelFromDraft(
  draft: ClasesQuickDraft | ComunidadQuickDraft,
  category: "clases" | "comunidad",
  lang: Lang,
  detailHref: string,
): CommunityDiscoveryCardModel {
  const title = draft.title.trim() || "—";
  const organizer = draft.organizer.trim() || null;
  const city = getCanonicalCityName(draft.publicCity.trim()) || draft.publicCity.trim();
  const locationLine = formatLocationLineFromDraft(draft, city);
  const imageUrl = pickMainDraftImageUrl(draft.images);
  const excerpt = excerptFromDescription(draft.description);

  const scheduleLine = summarizeWeeklySchedule(draft.weeklySchedule, lang) || draftScheduleHint(draft, category, lang);

  if (category === "clases") {
    const clasesDraft = draft as ClasesQuickDraft;
    const typeChip = resolveClasesCategoryPublicLabel(clasesDraft.category, clasesDraft.categoryCustom, lang);
    const ct = clasesDraft.classCostType.trim();
    let costBadge: string | null = null;
    if (ct === "pagada") {
      const amt = clasesDraft.priceAmount.trim();
      const fq = clasesDraft.priceFrequency.trim();
      const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
      const costBase = clasesCostTypeLabel(ct, lang);
      costBadge = amt ? `${amt} ${fqL}`.trim() : costBase;
    } else if (ct === "gratis") {
      costBadge = clasesCostTypeLabel(ct, lang);
    } else if (ct) {
      costBadge = clasesCostTypeLabel(ct, lang);
    }
    const modeRaw = clasesDraft.mode.trim();
    const modeL = modeRaw ? clasesModeLabel(modeRaw, lang) : "";
    const aud = clasesDraft.audience ? labelCommunityAudience(clasesDraft.audience, lang) : "";
    const lvl = clasesDraft.skillLevel ? labelClasesSkillLevel(clasesDraft.skillLevel, lang) : "";
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

  const comunidadDraft = draft as ComunidadQuickDraft;
  const typeChip = resolveComunidadEventTypePublicLabel(comunidadDraft.category, comunidadDraft.categoryCustom, lang);
  const ecRaw = comunidadDraft.eventCost.trim();
  const costBadge = ecRaw ? comunidadEventCostLabel(ecRaw, lang) : null;
  const dr = [comunidadDraft.date.trim(), comunidadDraft.eventEndDate.trim()].filter(Boolean).join(" → ");
  const aud = comunidadDraft.audience ? labelCommunityAudience(comunidadDraft.audience, lang) : "";
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

function formatLocationLineFromDraft(draft: ClasesQuickDraft | ComunidadQuickDraft, city: string): string {
  const st = draft.state.trim();
  const zip = draft.zip.trim();
  const country = draft.country.trim();
  const venue = draft.venue.trim();
  const parts: string[] = [];
  if (city) parts.push(city);
  if (st && zip) parts.push(`${st} ${zip}`);
  else if (st) parts.push(st);
  else if (zip) parts.push(zip);
  if (country) parts.push(country);
  const line = parts.join(", ");
  if (venue && line) return `${venue} · ${line}`;
  if (venue) return venue;
  return line || city || "";
}

function draftScheduleHint(draft: ClasesQuickDraft | ComunidadQuickDraft, category: "clases" | "comunidad", lang: Lang): string | null {
  const normalized = normalizeWeeklyScheduleArray(draft.weeklySchedule);
  const weekly = summarizeWeeklySchedule(normalized, lang);
  if (weekly) return weekly;
  if (category === "comunidad") {
    const cd = draft as ComunidadQuickDraft;
    const d = cd.date.trim();
    const s = cd.eventSessionStart.trim();
    const e = cd.eventSessionEnd.trim();
    if (d && s && e) return lang === "es" ? `${d} · ${s}–${e}` : `${d} · ${s}–${e}`;
    if (d) return d;
  }
  return null;
}

function pickMainDraftImageUrl(images: unknown): string | null {
  if (images == null) return null;
  if (!Array.isArray(images) || images.length === 0) return null;
  const items = images as unknown[];
  let mainUrl: string | null = null;
  for (const x of items) {
    if (typeof x === "string" && x.trim()) {
      const u = x.trim();
      if (!isPublicPersistedListingImageUrl(u)) continue;
      return u;
    }
    if (x && typeof x === "object") {
      const o = x as { url?: unknown; isMain?: unknown };
      const u = typeof o.url === "string" ? o.url.trim() : "";
      if (!u || !isPublicPersistedListingImageUrl(u)) continue;
      if (o.isMain === true) mainUrl = u;
      return mainUrl || u;
    }
  }
  return mainUrl;
}
