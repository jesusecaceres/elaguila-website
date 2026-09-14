import {
  parseBulkExternalVideoUrls,
  type BulkExternalVideoUrlParseResult,
} from "@/app/lib/media/externalVideoUrlValidation";

// Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
export const AUTOS_MAX_EXTERNAL_VIDEO_URLS = 8;

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

export type AutosBulkVideoUrlParseResult = BulkExternalVideoUrlParseResult;

/**
 * Splits pasted text into candidate URLs on newline/comma/whitespace (URLs never contain
 * those characters legitimately, so this separator set is always unambiguous), validates
 * each with `normalizeAutosExternalVideoUrl`, dedupes against `existingUrls` and within the
 * batch itself, and caps the result at `AUTOS_MAX_EXTERNAL_VIDEO_URLS` total.
 *
 * Servicios Live Launch Perfection ⚠️4 (2026-09-13): the algorithm itself moved verbatim to the
 * shared `parseBulkExternalVideoUrls` (app/lib/media/externalVideoUrlValidation.ts) so Servicios
 * can reuse it. This wrapper keeps the Autos normaliser and cap — behaviour is unchanged.
 */
export function parseBulkAutosExternalVideoUrls(
  raw: string,
  existingUrls: readonly string[],
): AutosBulkVideoUrlParseResult {
  return parseBulkExternalVideoUrls(raw, existingUrls, {
    normalize: normalizeAutosExternalVideoUrl,
    max: AUTOS_MAX_EXTERNAL_VIDEO_URLS,
  });
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
