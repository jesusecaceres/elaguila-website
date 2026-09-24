/**
 * Pure builder for the public magazine manifest (no I/O, no `server-only`): database rows in,
 * manifest out. Split out of `magazineManifestServer.ts` so the issue lifecycle
 * (draft → published → current → archived) can be verified directly. Behaviour is unchanged
 * except that each month now also carries its lifecycle `status` and `displayOrder`, which the
 * Revista hub uses to derive "Previous editions" from the very same manifest.
 */
import type { MagazineIssueRow, PublicMagazineManifest } from "./magazineManifestTypes";

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

function monthOrd(m: string): number {
  return MONTH_ORDER[m.toLowerCase()] ?? 99;
}

function rowToMonth(r: MagazineIssueRow): PublicMagazineManifest["years"][string]["months"][number] {
  const updated = r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10).replace(/-/g, "") + "-db" : undefined;
  return {
    month: r.month_slug,
    title: { es: r.title_es || r.title_en, en: r.title_en || r.title_es },
    updated,
    coverUrl: r.cover_url,
    pdfUrl: r.pdf_url,
    flipbookUrl: r.flipbook_url,
    status: r.status === "archived" ? "archived" : "published",
    displayOrder: r.display_order,
  };
}

/** Build manifest from DB rows (published + archived only). */
export function buildManifestFromIssueRows(rows: MagazineIssueRow[]): PublicMagazineManifest | null {
  const visible = rows.filter((r) => r.status === "published" || r.status === "archived");
  if (!visible.length) return null;

  const published = visible.filter((r) => r.status === "published");
  const featuredRow =
    published.find((r) => r.is_featured) ||
    [...published].sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : 0;
      const tb = b.published_at ? Date.parse(b.published_at) : 0;
      if (tb !== ta) return tb - ta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0];

  if (!featuredRow) return null;

  const years: PublicMagazineManifest["years"] = {};
  for (const r of visible) {
    if (!years[r.year]) years[r.year] = { months: [] };
    years[r.year].months.push(rowToMonth(r));
  }
  for (const y of Object.keys(years)) {
    const list = years[y].months;
    const orderMap = new Map<string, number>();
    for (const r of visible.filter((x) => x.year === y)) {
      orderMap.set(r.month_slug, r.display_order);
    }
    list.sort((a, b) => {
      const oa = orderMap.get(a.month) ?? 0;
      const ob = orderMap.get(b.month) ?? 0;
      if (oa !== ob) return ob - oa;
      return monthOrd(a.month) - monthOrd(b.month);
    });
  }

  const fUpdated = featuredRow.updated_at
    ? new Date(featuredRow.updated_at).toISOString().slice(0, 10).replace(/-/g, "") + "-db"
    : undefined;

  return {
    source: "database",
    featured: {
      year: featuredRow.year,
      month: featuredRow.month_slug,
      title: {
        es: featuredRow.title_es || featuredRow.title_en,
        en: featuredRow.title_en || featuredRow.title_es,
      },
      updated: fUpdated,
      coverUrl: featuredRow.cover_url,
      pdfUrl: featuredRow.pdf_url,
      flipbookUrl: featuredRow.flipbook_url,
    },
    years,
  };
}
