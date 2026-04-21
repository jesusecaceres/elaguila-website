function slugifyBase(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function buildEmpleosStagedSlug(title: string, shortId: string): string {
  const base = slugifyBase(title) || "empleo";
  return `staged-${shortId}-${base}`.replace(/-+/g, "-").slice(0, 120);
}
