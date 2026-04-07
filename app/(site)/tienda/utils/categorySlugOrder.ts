/**
 * Reorder a fixed list of category slugs for the storefront grid (admin-controlled).
 * Unknown slugs are ignored; missing slugs are appended in original order.
 */
export function applyCategorySlugOrder<T extends string>(base: readonly T[], order?: string[] | null): T[] {
  if (!order?.length) return [...base];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const s of order) {
    const t = s.trim() as T;
    if (base.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  for (const s of base) {
    if (!seen.has(s)) out.push(s);
  }
  return out;
}
