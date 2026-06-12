export const AUTOS_MAX_EXTERNAL_VIDEO_URLS = 4;

export function normalizeAutosExternalVideoUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^https:\/\/.+/i.test(t)) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function dedupeAutosVideoUrls(urls: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    const n = normalizeAutosExternalVideoUrl(raw);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out.slice(0, AUTOS_MAX_EXTERNAL_VIDEO_URLS);
}

export function migrateLegacyAutosVideoUrl(
  videoUrls: string[] | undefined,
  videoUrl: string | null | undefined,
): string[] {
  const base = dedupeAutosVideoUrls(videoUrls ?? []);
  if (base.length) return base;
  const legacy = normalizeAutosExternalVideoUrl(videoUrl ?? "");
  return legacy ? [legacy] : [];
}
