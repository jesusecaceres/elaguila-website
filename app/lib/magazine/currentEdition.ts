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

/** Current edition exactly as the Revista hub resolves it. */
export function resolveCurrentMagazineEdition(
  manifest: PublicMagazineManifest | null | undefined,
): MagazineEdition {
  return mergeEditionFromManifest(CURRENT_MAGAZINE_EDITION, manifest ?? null, "featured");
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

/** Full HTML reader for the edition, language preserved. */
export function magazineEditionReaderHref(edition: MagazineEdition, lang: SupportedLang): string {
  return `/magazine/${edition.year}/${edition.monthKey}/read?lang=${lang}`;
}
