/**
 * Revista hub model — pure, client-safe (no I/O). Everything the compact /magazine hub shows is derived
 * here from ONE source: the public manifest (`resolvePublicMagazineManifest` / `/api/magazine/manifest`).
 *
 *   current edition  = whatever the manifest features (shared with Home via `currentEdition.ts`)
 *   previous editions = the manifest's ARCHIVED issues, minus the current one, newest first
 *
 * There is no second archive registry and no hand-maintained list: when an admin sets a new issue current,
 * the existing action archives the previous one, the manifest reports it `archived`, and it appears here.
 */
import {
  editionFromManifestEntry,
  magazineEditionHasDedicatedReader,
  type MagazineEdition,
} from "./currentEdition";
import type { PublicMagazineManifest } from "./magazineManifestTypes";

const MONTH_ORDER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const monthOrd = (m: string): number => MONTH_ORDER[m] ?? 0;

export function magazineEditionKey(e: Pick<MagazineEdition, "year" | "monthKey">): string {
  return `${e.year}/${e.monthKey}`;
}

/** What a reader can open for an edition. */
export type MagazineEditionOpenTargets = {
  /** Dedicated HTML reader route (only editions that really have one). */
  readerHref: string | null;
  flipbookUrl: string | null;
  pdfUrl: string | null;
};

export function resolveEditionOpenTargets(edition: MagazineEdition, lang: string): MagazineEditionOpenTargets {
  return {
    readerHref: magazineEditionHasDedicatedReader(edition) ? `/magazine/${edition.year}/${edition.monthKey}/read?lang=${lang}` : null,
    flipbookUrl: edition.flipbookUrl && edition.flipbookUrl.trim() ? edition.flipbookUrl.trim() : null,
    pdfUrl: edition.pdfUrl && edition.pdfUrl.trim() ? edition.pdfUrl.trim() : null,
  };
}

/** An issue with nothing to open is not offered as a previous edition (no dead cards, no broken buttons). */
export function isOpenableEdition(edition: MagazineEdition): boolean {
  const t = resolveEditionOpenTargets(edition, "es");
  return Boolean(t.readerHref || t.flipbookUrl || t.pdfUrl);
}

export type MagazineEditionActions = {
  /** The main button. Reader when the edition has one; otherwise the flipbook; otherwise the PDF. */
  primary: { kind: "reader"; href: string } | { kind: "flipbook"; url: string } | { kind: "pdf"; href: string } | null;
  /** Flipbook as a second button — only when the primary is the reader. */
  flipbookUrl: string | null;
  /** Download link — never repeats a PDF that is already the primary button. */
  pdfUrl: string | null;
};

/** Which buttons an edition gets. Missing assets hide their button; nothing is ever linked that does not exist. */
export function resolveEditionActions(edition: MagazineEdition, lang: string): MagazineEditionActions {
  const t = resolveEditionOpenTargets(edition, lang);
  if (t.readerHref) return { primary: { kind: "reader", href: t.readerHref }, flipbookUrl: t.flipbookUrl, pdfUrl: t.pdfUrl };
  if (t.flipbookUrl) return { primary: { kind: "flipbook", url: t.flipbookUrl }, flipbookUrl: null, pdfUrl: t.pdfUrl };
  if (t.pdfUrl) return { primary: { kind: "pdf", href: t.pdfUrl }, flipbookUrl: null, pdfUrl: null };
  return { primary: null, flipbookUrl: null, pdfUrl: null };
}

/**
 * Previous editions, derived from the manifest.
 *
 *  - the current (featured) issue is never included;
 *  - database manifests: only issues the lifecycle marked `archived` — a published-but-not-current issue
 *    is upcoming, not previous;
 *  - editions.json fallback (no lifecycle status): every non-current entry;
 *  - issues with nothing to open are skipped;
 *  - newest first: year ↓, editorial `display_order` ↓, month ↓, slug — deterministic.
 */
export function resolveMagazineArchive(
  manifest: PublicMagazineManifest | null | undefined,
  current: Pick<MagazineEdition, "year" | "monthKey">,
): MagazineEdition[] {
  if (!manifest) return [];
  const seen = new Set<string>([magazineEditionKey(current)]);
  const rows: { edition: MagazineEdition; order: number }[] = [];
  for (const [year, block] of Object.entries(manifest.years ?? {})) {
    for (const m of block?.months ?? []) {
      if (!m?.month) continue;
      const slug = m.month.trim().toLowerCase();
      const key = `${year}/${slug}`;
      if (seen.has(key)) continue;
      const isPrevious = manifest.source === "file" ? true : m.status === "archived";
      if (!isPrevious) continue;
      const edition = editionFromManifestEntry(year, slug, m);
      if (!isOpenableEdition(edition)) continue;
      seen.add(key);
      rows.push({ edition, order: typeof m.displayOrder === "number" ? m.displayOrder : 0 });
    }
  }
  rows.sort((a, b) => {
    const ya = Number(a.edition.year) || 0;
    const yb = Number(b.edition.year) || 0;
    if (ya !== yb) return yb - ya;
    if (a.order !== b.order) return b.order - a.order;
    const ma = monthOrd(a.edition.monthKey);
    const mb = monthOrd(b.edition.monthKey);
    if (ma !== mb) return mb - ma;
    return a.edition.monthKey.localeCompare(b.edition.monthKey);
  });
  return rows.map((r) => r.edition);
}
