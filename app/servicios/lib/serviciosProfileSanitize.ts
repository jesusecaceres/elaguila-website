import type {
  ServiciosGalleryImage,
  ServiciosGalleryVideo,
  ServiciosHeroBadge,
  ServiciosHeroBadgeKind,
  ServiciosHoursSummary,
  ServiciosQuickFact,
  ServiciosReview,
  ServiciosServiceArea,
  ServiciosServiceCard,
  ServiciosServiceVisualVariant,
  ServiciosTrustItem,
} from "../types/serviciosBusinessProfile";
import { isAllowedServiciosImageUrl, isAllowedServiciosVideoUrl } from "./serviciosMediaUrl";

const SERVICE_VARIANTS = new Set<ServiciosServiceVisualVariant>([
  "instalacion",
  "mantenimiento",
  "reparacion",
  "consulta",
  "emergencia",
  "default",
]);

const BADGE_KINDS = new Set<ServiciosHeroBadgeKind>([
  "verified",
  "licensed",
  "spanish",
  "insured",
  "background_check",
  "custom",
]);

/** Trim and collapse internal whitespace */
export function trimText(s: string | undefined | null): string {
  return (s ?? "").trim().replace(/\s+/g, " ");
}

/** Allow http(s) URLs only; strip dangerous schemes */
export function safeExternalWebsiteHref(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Relative in-app paths (e.g. /cupones/abc) — safe for Next Link */
export function safePromoHref(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  if (t.startsWith("/") && !t.startsWith("//")) return t;
  return safeExternalWebsiteHref(t);
}

/** Promo attachments: https or local-first data URLs (image / PDF) */
export function safePromoAssetHref(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  if (t.startsWith("data:image/")) return t;
  if (t.startsWith("data:application/pdf")) return t;
  return safeExternalWebsiteHref(t);
}

/** Digits and leading + for tel: — returns null if nothing callable */
export function sanitizeTelHref(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  const digits = t.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.length >= 10) return `tel:${digits}`;
  return `tel:${digits}`;
}

/** Human-friendly phone display (trimmed; preserves common punctuation) */
export function sanitizePhoneDisplay(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  const digits = t.replace(/[^\d+]/g, "");
  if (!digits) return null;
  return t;
}

export function normalizeRating(raw: unknown): number | undefined {
  if (typeof raw !== "number" || Number.isNaN(raw)) return undefined;
  const r = Math.min(5, Math.max(0, raw));
  return Math.round(r * 10) / 10;
}

export function normalizeReviewCount(raw: unknown): number | undefined {
  if (typeof raw !== "number" || Number.isNaN(raw)) return undefined;
  const n = Math.floor(raw);
  if (n < 0) return undefined;
  return n;
}

export function normalizeHours(h: ServiciosHoursSummary | undefined): { openNowLabel: string; todayHoursLine: string } | undefined {
  if (!h) return undefined;
  const openNowLabel = trimText(h.openNowLabel);
  const todayHoursLine = trimText(h.todayHoursLine);
  if (!openNowLabel && !todayHoursLine) return undefined;
  if (!openNowLabel || !todayHoursLine) return undefined;
  return { openNowLabel, todayHoursLine };
}

export function normalizeServiceAreaLabel(raw: string | undefined | null): string | null {
  const t = trimText(raw);
  if (!t) return null;
  return t.slice(0, 200);
}

export function filterQuickFacts(facts: ServiciosQuickFact[] | undefined): ServiciosQuickFact[] {
  if (!Array.isArray(facts)) return [];
  const out: ServiciosQuickFact[] = [];
  for (const f of facts) {
    if (!f || typeof f.kind !== "string") continue;
    const label = trimText(f.label);
    if (!label) continue;
    out.push({ kind: f.kind, label });
  }
  return out;
}

export function filterHeroBadges(badges: ServiciosHeroBadge[] | undefined): ServiciosHeroBadge[] {
  if (!Array.isArray(badges)) return [];
  const out: ServiciosHeroBadge[] = [];
  for (const b of badges) {
    if (!b || typeof b.kind !== "string") continue;
    const label = trimText(b.label);
    if (!label) continue;
    const kind = BADGE_KINDS.has(b.kind as ServiciosHeroBadgeKind) ? (b.kind as ServiciosHeroBadgeKind) : "custom";
    out.push({ kind, label });
  }
  return out;
}

export function filterServices(services: ServiciosServiceCard[] | undefined): ServiciosServiceCard[] {
  if (!Array.isArray(services)) return [];
  const out: ServiciosServiceCard[] = [];
  for (const s of services) {
    if (!s || typeof s.id !== "string") continue;
    const title = trimText(s.title);
    if (!title) continue;
    const secondaryLine = trimText(s.secondaryLine);
    const imageUrl = trimText(s.imageUrl);
    const imageAlt = trimText(s.imageAlt) || title;
    const vvRaw = trimText(s.visualVariant as string);
    const visualVariant =
      vvRaw && SERVICE_VARIANTS.has(vvRaw as ServiciosServiceVisualVariant)
        ? (vvRaw as ServiciosServiceVisualVariant)
        : undefined;
    const hasImage = Boolean(imageUrl && isAllowedServiciosImageUrl(imageUrl));
    if (hasImage) {
      const row: ServiciosServiceCard = {
        id: s.id,
        title,
        secondaryLine: secondaryLine || "—",
        imageUrl,
        imageAlt,
      };
      if (visualVariant) row.visualVariant = visualVariant;
      out.push(row);
      continue;
    }
    if (visualVariant) {
      out.push({
        id: s.id,
        title,
        secondaryLine: secondaryLine || "—",
        imageAlt,
        visualVariant,
      });
    }
  }
  return out;
}

export function filterGalleryVideos(videos: ServiciosGalleryVideo[] | undefined): ServiciosGalleryVideo[] {
  if (!Array.isArray(videos)) return [];
  const tmp: ServiciosGalleryVideo[] = [];
  for (const v of videos) {
    if (!v || typeof v.id !== "string") continue;
    const url = trimText(v.url);
    if (!url || !isAllowedServiciosVideoUrl(url)) continue;
    tmp.push({
      id: trimText(v.id) || v.id,
      url,
      isPrimary: v.isPrimary === true,
    });
    if (tmp.length >= 2) break;
  }
  const primary = tmp.filter((x) => x.isPrimary);
  const rest = tmp.filter((x) => !x.isPrimary);
  return [...primary, ...rest].slice(0, 2);
}

export function filterGallery(items: ServiciosGalleryImage[] | undefined): ServiciosGalleryImage[] {
  if (!Array.isArray(items)) return [];
  const out: ServiciosGalleryImage[] = [];
  for (const g of items) {
    if (!g || typeof g.id !== "string") continue;
    const url = trimText(g.url);
    const alt = trimText(g.alt) || "Gallery image";
    if (!url) continue;
    if (!isAllowedServiciosImageUrl(url)) continue;
    out.push({ id: g.id, url, alt });
  }
  return out;
}

const TRUST_ICONS = new Set<ServiciosTrustItem["icon"]>([
  "shield",
  "shieldCheck",
  "star",
  "clock",
  "heart",
  "check",
]);

export function filterTrustItems(items: ServiciosTrustItem[] | undefined): ServiciosTrustItem[] {
  if (!Array.isArray(items)) return [];
  const out: ServiciosTrustItem[] = [];
  for (const t of items) {
    if (!t || typeof t.id !== "string") continue;
    const label = trimText(t.label);
    if (!label) continue;
    const icon = TRUST_ICONS.has(t.icon) ? t.icon : "shield";
    out.push({ id: t.id, label, icon });
  }
  return out;
}

export function filterServiceAreas(items: ServiciosServiceArea[] | undefined): ServiciosServiceArea[] {
  if (!Array.isArray(items)) return [];
  const out: ServiciosServiceArea[] = [];
  for (const a of items) {
    if (!a || typeof a.id !== "string") continue;
    const label = normalizeServiceAreaLabel(a.label);
    if (!label) continue;
    out.push({ id: a.id, label, kind: a.kind });
  }
  return out;
}

export function meaningfulReviews(reviews: ServiciosReview[] | undefined): ServiciosReview[] {
  if (!Array.isArray(reviews)) return [];
  return reviews.filter((r) => {
    if (!r || typeof r.id !== "string") return false;
    const quote = trimText(r.quote);
    const authorName = trimText(r.authorName);
    return Boolean(quote && authorName);
  });
}

export function normalizeMapImageUrl(raw: string | undefined | null): string | undefined {
  const t = trimText(raw);
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function humanizeSlug(slug: string): string {
  return trimText(slug.replace(/[-_]+/g, " "))
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
