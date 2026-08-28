import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesModeLabel,
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
  summarizeWeeklySchedule,
  type CommunityListingPairMap,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import type { CommunityListingBrowseRow } from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import { labelCommunityAudience } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { comunidadSearchTypeLine } from "@/app/(site)/clasificados/comunidad/shared/comunidadSearchBlob";
import { clasesSearchTypeAndLevel } from "@/app/(site)/clasificados/clases/shared/clasesSearchBlob";

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

export function excerptFromDescription(raw: string | null | undefined, max = 140): string | null {
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

export function formatLocationLine(city: string | null, pairs: CommunityListingPairMap): string {
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

/** Short readable date, e.g. "1 sep" / "Sep 1" — avoids showing a raw ISO "2026-09-01" fallback. */
function formatShortEventDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function comunidadScheduleHint(pairs: CommunityListingPairMap, lang: Lang): string | null {
  const rows = parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]);
  const weekly = summarizeWeeklySchedule(rows, lang);
  if (weekly) return weekly;
  const d = (pairs["Leonix:eventDate"] ?? "").trim();
  const s = (pairs["Leonix:eventSessionStart"] ?? "").trim();
  const e = (pairs["Leonix:eventSessionEnd"] ?? "").trim();
  const dLabel = formatShortEventDate(d, lang);
  if (d && s && e) return `${dLabel} · ${s}–${e}`;
  if (d) return dLabel;
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
  let lvl = "";
  if (category === "clases") {
    const r = clasesSearchTypeAndLevel(pairs, quick, lang);
    typeLine = r.typeLine;
    lvl = r.lvl;
  } else {
    typeLine = comunidadSearchTypeLine(pairs, quick, lang);
  }
  const venue = pairs["Leonix:venue"] ?? "";
  const addr = pairs["Leonix:addressLine1"] ?? "";
  const addr2 = pairs["Leonix:addressLine2"] ?? "";
  const city = String(row.city ?? "");
  const zip = pairs["Leonix:zip"] ?? "";
  const state = pairs["Leonix:state"] ?? "";
  const country = pairs["Leonix:country"] ?? "";
  const modeRaw = (pairs["Leonix:mode"] ?? "").trim();
  const mode = modeRaw ? clasesModeLabel(modeRaw, lang) : "";
  const aud = pairs["Leonix:audience"] ? labelCommunityAudience(pairs["Leonix:audience"], lang) : "";
  const sched = summarizeWeeklySchedule(parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"]), lang);
  const dateBits = [pairs["Leonix:eventDate"], pairs["Leonix:eventEndDate"], pairs["Leonix:eventSessionStart"], pairs["Leonix:eventSessionEnd"]]
    .filter(Boolean)
    .join(" ");
  return `${title} ${desc} ${pairs["Leonix:organizer"] ?? ""} ${pairs["Leonix:bringNote"] ?? ""} ${typeLine} ${venue} ${addr} ${addr2} ${city} ${zip} ${state} ${country} ${mode} ${aud} ${lvl} ${sched} ${dateBits}`.toLowerCase();
}

export function formatLocationLineFromDraft(draft: ClasesQuickDraft | ComunidadQuickDraft, city: string): string {
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

export function pickMainDraftImageUrl(images: unknown): string | null {
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
