/**
 * Gate HOME-LAUNCH-3 — ONE canonical "current edition" shared by Home and the Revista hub.
 *
 * `MagazineHubClient` and `/home` both resolve the current edition through this module
 * (base issue + public manifest merge), so the two surfaces can never disagree about which
 * edition, cover, or title is current. Client-safe: no server-only imports. The manifest itself
 * is fetched server-side (`resolvePublicMagazineManifest`) or via `/api/magazine/manifest`.
 */

import type { SupportedLang } from "@/app/lib/language";
import type { PublicMagazineManifest } from "./magazineManifestTypes";
import { getMagazineReaderCopy } from "./magazineReaderCopy";

export type MagazineEdition = {
  titleEs: string;
  titleEn: string;
  monthEs: string;
  monthEn: string;
  year: string;
  monthKey: string;
  coverImage: string;
  pdfUrl: string;
  flipbookUrl: string | null;
};

export const DEFAULT_MAGAZINE_FLIPBOOK = "https://flip.leonixmedia.com/books/qnda/";

/** Base issue record; the public manifest (DB or editions.json) overlays title/cover/pdf/flipbook. */
export const CURRENT_MAGAZINE_EDITION: MagazineEdition = {
  titleEs: "Leonix Media — Revista Junio 2026",
  titleEn: "Leonix Media — June 2026 Magazine",
  monthEs: "Junio",
  monthEn: "June",
  year: "2026",
  monthKey: "june",
  coverImage: "/magazine/2026/june/cover.png",
  pdfUrl: "/magazine/2026/june/leonix_media_june.pdf",
  flipbookUrl: DEFAULT_MAGAZINE_FLIPBOOK,
};

export function mergeEditionFromManifest(
  base: MagazineEdition,
  manifest: PublicMagazineManifest | null,
  role: "featured" | { year: string; month: string },
): MagazineEdition {
  if (!manifest) return base;
  if (role === "featured") {
    const f = manifest.featured;
    if (f.year !== base.year || f.month !== base.monthKey) return base;
    return {
      ...base,
      titleEs: f.title?.es?.trim() || base.titleEs,
      titleEn: f.title?.en?.trim() || base.titleEn,
      coverImage: (f.coverUrl && f.coverUrl.trim()) || base.coverImage,
      pdfUrl: (f.pdfUrl && f.pdfUrl.trim()) || base.pdfUrl,
      flipbookUrl: (f.flipbookUrl && f.flipbookUrl.trim()) || base.flipbookUrl,
    };
  }
  const months = manifest.years?.[role.year]?.months ?? [];
  const m = months.find((x) => x.month === role.month);
  if (!m) return base;
  return {
    ...base,
    titleEs: m.title?.es?.trim() || base.titleEs,
    titleEn: m.title?.en?.trim() || base.titleEn,
    coverImage: (m.coverUrl && m.coverUrl.trim()) || base.coverImage,
    pdfUrl: (m.pdfUrl && m.pdfUrl.trim()) || base.pdfUrl,
    flipbookUrl: (m.flipbookUrl && m.flipbookUrl.trim()) || base.flipbookUrl,
  };
}

/** ES/EN month names for any issue slug (the manifest only carries the slug). */
export const MAGAZINE_MONTH_LABELS: Record<string, { es: string; en: string }> = {
  january: { es: "Enero", en: "January" },
  february: { es: "Febrero", en: "February" },
  march: { es: "Marzo", en: "March" },
  april: { es: "Abril", en: "April" },
  may: { es: "Mayo", en: "May" },
  june: { es: "Junio", en: "June" },
  july: { es: "Julio", en: "July" },
  august: { es: "Agosto", en: "August" },
  september: { es: "Septiembre", en: "September" },
  october: { es: "Octubre", en: "October" },
  november: { es: "Noviembre", en: "November" },
  december: { es: "Diciembre", en: "December" },
};

function monthLabelsFor(slug: string): { es: string; en: string } {
  const known = MAGAZINE_MONTH_LABELS[slug];
  if (known) return known;
  const cap = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : slug;
  return { es: cap, en: cap };
}

/** The slice of a manifest month / featured record an edition is built from. */
export type MagazineManifestEntry = {
  title?: { es?: string; en?: string } | null;
  coverUrl?: string | null;
  pdfUrl?: string | null;
  flipbookUrl?: string | null;
};

const clean = (v: string | null | undefined): string => (v ?? "").trim();

/**
 * Build an edition for ANY issue in the manifest. The known base issue keeps its base fallbacks; every
 * other issue uses only what the manifest says, plus the repo's cover convention
 * (`/magazine/<year>/<month>/cover.png`) — never another issue's cover, so a label can never be paired
 * with the wrong artwork by a fallback.
 */
export function editionFromManifestEntry(year: string, month: string, entry?: MagazineManifestEntry | null): MagazineEdition {
  const key = month.trim().toLowerCase();
  const base = year === CURRENT_MAGAZINE_EDITION.year && key === CURRENT_MAGAZINE_EDITION.monthKey ? CURRENT_MAGAZINE_EDITION : null;
  const labels = monthLabelsFor(key);
  return {
    titleEs: clean(entry?.title?.es) || base?.titleEs || `Leonix Media — Revista ${labels.es} ${year}`,
    titleEn: clean(entry?.title?.en) || base?.titleEn || `Leonix Media — ${labels.en} ${year} Magazine`,
    monthEs: base?.monthEs ?? labels.es,
    monthEn: base?.monthEn ?? labels.en,
    year,
    monthKey: key,
    coverImage: clean(entry?.coverUrl) || base?.coverImage || `/magazine/${year}/${key}/cover.png`,
    pdfUrl: clean(entry?.pdfUrl) || base?.pdfUrl || "",
    flipbookUrl: clean(entry?.flipbookUrl) || base?.flipbookUrl || null,
  };
}

/**
 * Current edition exactly as the Revista hub AND Home resolve it: whatever the manifest features. The
 * base issue keeps its base fallbacks; when an admin sets another issue current, both surfaces follow.
 */
export function resolveCurrentMagazineEdition(
  manifest: PublicMagazineManifest | null | undefined,
): MagazineEdition {
  const base = CURRENT_MAGAZINE_EDITION;
  const f = manifest?.featured;
  if (!manifest || !f?.year || !f?.month) return base;
  if (f.year === base.year && f.month.trim().toLowerCase() === base.monthKey) {
    return mergeEditionFromManifest(base, manifest, "featured");
  }
  return editionFromManifestEntry(f.year, f.month, f);
}

function isJune2026(edition: MagazineEdition): boolean {
  return edition.monthKey === "june" && edition.year === "2026";
}

/** Localized edition title (reader copy owns the June 2026 title in every UI language). */
export function magazineEditionTitle(edition: MagazineEdition, lang: SupportedLang): string {
  if (isJune2026(edition)) return getMagazineReaderCopy(lang).issueMeta.title;
  return lang === "en" ? edition.titleEn : edition.titleEs;
}

/** Localized month label, e.g. "Junio" / "June". */
export function magazineEditionMonthLabel(edition: MagazineEdition, lang: SupportedLang): string {
  if (isJune2026(edition)) return getMagazineReaderCopy(lang).issueMeta.monthLabel;
  return lang === "en" ? edition.monthEn : edition.monthEs;
}

/** "Junio 2026" / "June 2026" */
export function magazineEditionMonthYear(edition: MagazineEdition, lang: SupportedLang): string {
  return `${magazineEditionMonthLabel(edition, lang)} ${edition.year}`;
}

/**
 * Issues that have a real dedicated HTML reader route. Every other month folder under
 * `app/(site)/magazine/<year>/` is a placeholder page, so those issues are opened through their flipbook
 * or PDF instead — never through a route that does not really exist.
 */
const EDITIONS_WITH_DEDICATED_READER: ReadonlySet<string> = new Set(["2026/june"]);

export function magazineEditionHasDedicatedReader(edition: Pick<MagazineEdition, "year" | "monthKey">): boolean {
  return EDITIONS_WITH_DEDICATED_READER.has(`${edition.year}/${edition.monthKey}`);
}

/** Full HTML reader for the edition, language preserved; the Revista hub when the edition has no dedicated reader. */
export function magazineEditionReaderHref(edition: MagazineEdition, lang: SupportedLang): string {
  if (!magazineEditionHasDedicatedReader(edition)) return `/magazine?lang=${lang}`;
  return `/magazine/${edition.year}/${edition.monthKey}/read?lang=${lang}`;
}
