/** Normalize a title segment: trim, collapse spaces, light title-case for words (keeps ALLCAPS acronyms short). */
function normalizeSegment(raw: string | undefined): string | undefined {
  const t = raw?.trim().replace(/\s+/g, " ");
  if (!t) return undefined;
  return t
    .split(/\s+/)
    .map((w) => {
      if (/^\d+(\.\d+)?$/.test(w)) return w;
      if (w.length <= 4 && /^[A-Z0-9]+$/i.test(w) && /[A-Z]/.test(w)) {
        return w.toUpperCase();
      }
      const lower = w.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function buildVehicleTitle(
  year: number | undefined,
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): string {
  const parts: string[] = [];
  if (year !== undefined && Number.isFinite(year)) parts.push(String(year));
  [make, model, trim].forEach((x) => {
    const t = normalizeSegment(x);
    if (t) parts.push(t);
  });
  const deduped: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    const prev = deduped[deduped.length - 1];
    if (prev && prev.toLowerCase() === p.toLowerCase()) continue;
    deduped.push(p);
  }
  return deduped.join(" ");
}
