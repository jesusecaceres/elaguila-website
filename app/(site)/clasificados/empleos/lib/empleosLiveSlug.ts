function slugifyBase(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

/** URL-safe slug segment for live listings (no demo prefix). */
export function buildEmpleosLiveSlugBase(title: string): string {
  return slugifyBase(title) || "empleo";
}
