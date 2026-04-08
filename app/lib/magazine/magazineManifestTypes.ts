/** Shared shape for `/api/magazine/manifest` and the magazine hub client. */

export type PublicMagazineManifestMonth = {
  month: string;
  title: { es: string; en: string };
  updated?: string;
  coverUrl?: string | null;
  pdfUrl?: string | null;
  flipbookUrl?: string | null;
};

export type PublicMagazineManifest = {
  source: "database" | "file";
  featured: {
    year: string;
    month: string;
    title: { es: string; en: string };
    updated?: string;
    coverUrl?: string | null;
    pdfUrl?: string | null;
    flipbookUrl?: string | null;
  };
  years: Record<string, { months: PublicMagazineManifestMonth[] }>;
};

export type MagazineIssueRow = {
  id: string;
  year: string;
  month_slug: string;
  title_es: string;
  title_en: string;
  status: string;
  is_featured: boolean;
  cover_url: string | null;
  pdf_url: string | null;
  flipbook_url: string | null;
  published_at: string | null;
  display_order: number;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};
