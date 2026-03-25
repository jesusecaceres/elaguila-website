/**
 * Magazine manifest reads for admin ops. Source of truth today: `public/magazine/editions.json`.
 *
 * FUTURE: Supabase bucket + DB row for issues; admin uploads update manifest or DB and regenerate static paths.
 */
import { readFile } from "fs/promises";
import path from "path";

export type MagazineFeatured = {
  year: string;
  month: string;
  titleEs: string;
  titleEn: string;
  updated: string;
};

export type MagazineArchiveMonth = {
  year: string;
  month: string;
  titleEs: string;
  titleEn: string;
  updated: string;
};

export type MagazineManifestAdmin = {
  featured: MagazineFeatured | null;
  archive: MagazineArchiveMonth[];
};

export async function getMagazineManifestForAdmin(): Promise<MagazineManifestAdmin> {
  try {
    const fp = path.join(process.cwd(), "public", "magazine", "editions.json");
    const raw = await readFile(fp, "utf-8");
    const j = JSON.parse(raw) as {
      featured?: {
        year?: string;
        month?: string;
        title?: { es?: string; en?: string };
        updated?: string;
      };
      years?: Record<
        string,
        {
          months?: Array<{
            month?: string;
            title?: { es?: string; en?: string };
            updated?: string;
          }>;
        }
      >;
    };

    const featured: MagazineFeatured | null = j.featured?.year && j.featured?.month
      ? {
          year: j.featured.year,
          month: j.featured.month,
          titleEs: j.featured.title?.es ?? j.featured.month,
          titleEn: j.featured.title?.en ?? j.featured.month,
          updated: j.featured.updated ?? "",
        }
      : null;

    const archive: MagazineArchiveMonth[] = [];
    const years = j.years ?? {};
    for (const [year, block] of Object.entries(years)) {
      for (const m of block.months ?? []) {
        if (!m.month) continue;
        archive.push({
          year,
          month: m.month,
          titleEs: m.title?.es ?? m.month,
          titleEn: m.title?.en ?? m.month,
          updated: m.updated ?? "",
        });
      }
    }
    archive.sort((a, b) => {
      if (a.year !== b.year) return b.year.localeCompare(a.year);
      return b.month.localeCompare(a.month);
    });

    return { featured, archive };
  } catch {
    return { featured: null, archive: [] };
  }
}
