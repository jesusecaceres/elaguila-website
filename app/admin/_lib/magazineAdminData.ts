/**
 * Magazine manifest for admin preview — same effective output as public `/api/magazine/manifest`.
 */
import { resolvePublicMagazineManifest } from "@/app/lib/magazine/magazineManifestServer";

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
  /** Whether the public hub resolves from Supabase or falls back to editions.json */
  publicSource: "database" | "file";
};

export async function getMagazineManifestForAdmin(): Promise<MagazineManifestAdmin> {
  try {
    const m = await resolvePublicMagazineManifest();
    const featured: MagazineFeatured | null =
      m.featured?.year && m.featured?.month
        ? {
            year: m.featured.year,
            month: m.featured.month,
            titleEs: m.featured.title.es,
            titleEn: m.featured.title.en,
            updated: m.featured.updated ?? "",
          }
        : null;

    const archive: MagazineArchiveMonth[] = [];
    for (const [year, block] of Object.entries(m.years ?? {})) {
      for (const mo of block.months ?? []) {
        if (!mo.month) continue;
        archive.push({
          year,
          month: mo.month,
          titleEs: mo.title.es,
          titleEn: mo.title.en,
          updated: mo.updated ?? "",
        });
      }
    }
    archive.sort((a, b) => {
      if (a.year !== b.year) return b.year.localeCompare(a.year);
      return b.month.localeCompare(a.month);
    });

    return { featured, archive, publicSource: m.source };
  } catch {
    return { featured: null, archive: [], publicSource: "file" };
  }
}
