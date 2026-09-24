import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { buildManifestFromIssueRows } from "./magazineManifestBuild";
import type { MagazineIssueRow, PublicMagazineManifest } from "./magazineManifestTypes";

/** The pure builder lives in `magazineManifestBuild.ts` (testable without server-only); re-exported for existing callers. */
export { buildManifestFromIssueRows };

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
