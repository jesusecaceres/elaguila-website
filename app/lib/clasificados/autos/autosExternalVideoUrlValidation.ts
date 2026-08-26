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

export type AutosBulkVideoUrlParseResult = {
  added: string[];
  skippedInvalid: number;
  skippedDuplicate: number;
  skippedLimit: number;
};

/**
 * Splits pasted text into candidate URLs on newline/comma/whitespace (URLs never contain
 * those characters legitimately, so this separator set is always unambiguous), validates
 * each with `normalizeAutosExternalVideoUrl`, dedupes against `existingUrls` and within the
 * batch itself, and caps the result at `AUTOS_MAX_EXTERNAL_VIDEO_URLS` total.
 */
export function parseBulkAutosExternalVideoUrls(
  raw: string,
  existingUrls: readonly string[],
): AutosBulkVideoUrlParseResult {
  const existing = dedupeAutosVideoUrls(existingUrls);
  const seen = new Set(existing.map((u) => u.toLowerCase()));
  const candidates = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const added: string[] = [];
  let skippedInvalid = 0;
  let skippedDuplicate = 0;
  let skippedLimit = 0;
  let remainingCapacity = AUTOS_MAX_EXTERNAL_VIDEO_URLS - existing.length;

  for (const candidate of candidates) {
    const normalized = normalizeAutosExternalVideoUrl(candidate);
    if (!normalized) {
      skippedInvalid += 1;
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      skippedDuplicate += 1;
      continue;
    }
    if (remainingCapacity <= 0) {
      skippedLimit += 1;
      continue;
    }
    seen.add(key);
    added.push(normalized);
    remainingCapacity -= 1;
  }

  return { added, skippedInvalid, skippedDuplicate, skippedLimit };
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
