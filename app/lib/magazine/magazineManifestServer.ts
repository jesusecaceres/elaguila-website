import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { getAdminSupabase } from "@/app/lib/supabase/server";
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

async function loadManifestFromEditionsJsonFile(): Promise<PublicMagazineManifest> {
  const fp = path.join(process.cwd(), "public", "magazine", "editions.json");
  const raw = await readFile(fp, "utf-8");
  const j = JSON.parse(raw) as {
    featured?: {
      year?: string;
      month?: string;
      title?: { es?: string; en?: string };
      updated?: string;
    };
    years?: Record<string, { months?: Array<{ month?: string; title?: { es?: string; en?: string }; updated?: string }> }>;
  };

  const years: PublicMagazineManifest["years"] = {};
  for (const [year, block] of Object.entries(j.years ?? {})) {
    years[year] = {
      months: (block.months ?? []).map((m) => ({
        month: m.month ?? "",
        title: {
          es: m.title?.es ?? m.month ?? "",
          en: m.title?.en ?? m.month ?? "",
        },
        updated: m.updated,
        coverUrl: null,
        pdfUrl: null,
        flipbookUrl: null,
      })),
    };
  }

  const f = j.featured;
  return {
    source: "file",
    featured: {
      year: f?.year ?? "2026",
      month: f?.month ?? "february",
      title: {
        es: f?.title?.es ?? "Leonix",
        en: f?.title?.en ?? "Leonix",
      },
      updated: f?.updated,
      coverUrl: null,
      pdfUrl: null,
      flipbookUrl: null,
    },
    years,
  };
}

export async function fetchAllMagazineIssuesForAdmin(): Promise<{ rows: MagazineIssueRow[]; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("magazine_issues")
      .select(
        "id,year,month_slug,title_es,title_en,status,is_featured,cover_url,pdf_url,flipbook_url,published_at,display_order,internal_notes,created_at,updated_at"
      )
      .order("year", { ascending: false })
      .order("display_order", { ascending: false })
      .order("month_slug", { ascending: true });

    if (error) return { rows: [], error: error.message };
    return { rows: (data as MagazineIssueRow[]) ?? [], error: null };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "magazine_issues unavailable" };
  }
}

/** Public manifest: DB when any published/archived row exists; else editions.json on disk. */
export async function resolvePublicMagazineManifest(): Promise<PublicMagazineManifest> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("magazine_issues")
      .select(
        "id,year,month_slug,title_es,title_en,status,is_featured,cover_url,pdf_url,flipbook_url,published_at,display_order,internal_notes,created_at,updated_at"
      );

    if (!error && data?.length) {
      const rows = data as MagazineIssueRow[];
      const built = buildManifestFromIssueRows(rows);
      if (built) return built;
    }
  } catch {
    /* fall through */
  }

  return loadManifestFromEditionsJsonFile();
}
