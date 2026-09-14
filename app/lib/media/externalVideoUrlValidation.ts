/**
 * Globalization Package B (Gate B3) — shared strict external-video URL validator.
 *
 * Fills the two confirmed validator gaps without inventing per-category provider policy:
 *  - SERVICIOS previously accepted any web URL for its video slots (generic
 *    isProbablyValidWebUrl — no https requirement, no parseability guarantee).
 *  - VIAJES (negocios) has a raw `videoUrl` string with no validation at all; the Viajes
 *    workstream consumes THIS validator through the media boundary contract
 *    (listingMediaConfigs.ts `videoValidator: "shared-https-strict"`) — no Viajes-owned UI is
 *    edited by this program.
 *
 * Semantics deliberately mirror the strictest existing category validator
 * (normalizeAutosExternalVideoUrl, app/lib/clasificados/autos/autosExternalVideoUrlValidation.ts):
 * https-only, URL-parseable, never a local/preview ref (blob:/data:), trimmed. No provider
 * whitelist — same as Autos: any https host is a valid EXTERNAL link; embeddability remains a
 * per-category presentation concern. Local video uploads are never allowed through this path.
 */

import { isPersistableMediaUrl } from "./listingMediaContract";

/** Returns the normalized URL, or null when invalid. */
export function normalizeStrictExternalVideoUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (!isPersistableMediaUrl(value)) return null;
  if (!/^https:\/\//i.test(value)) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isStrictExternalVideoUrl(raw: string | null | undefined): boolean {
  return normalizeStrictExternalVideoUrl(raw) !== null;
}

/* ==============================================================================================
 * Servicios Live Launch Perfection ⚠️4 (2026-09-13) — shared rapid multi-URL entry.
 *
 * Autos owned the only bulk "paste several links" parser (parseBulkAutosExternalVideoUrls). The
 * algorithm is category-agnostic — only the per-URL normaliser and the cap differ — so it lives
 * here now and Autos delegates to it unchanged. Servicios adopts it with its own entry normaliser
 * and SERVICIOS_MAX_VIDEO_URLS. One engine, two consumers; storage shapes are untouched.
 * ============================================================================================ */

export type BulkExternalVideoUrlParseResult = {
  added: string[];
  skippedInvalid: number;
  skippedDuplicate: number;
  skippedLimit: number;
};

export type BulkExternalVideoUrlParseOptions = {
  /** Category entry normaliser — returns the canonical URL or null when the link is rejected. */
  normalize: (raw: string) => string | null;
  /** Category cap on the TOTAL number of external videos (existing + added). */
  max: number;
};

/**
 * Splits pasted text into candidate URLs on newline/comma/whitespace (URLs never contain those
 * characters legitimately, so this separator set is always unambiguous).
 */
export function splitPastedExternalVideoUrls(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Validates each pasted candidate with `normalize`, dedupes (case-insensitively) against
 * `existingUrls` and within the batch itself, and caps the result so existing + added never
 * exceeds `max`. Counters give truthful per-item feedback; nothing is silently dropped.
 */
export function parseBulkExternalVideoUrls(
  raw: string,
  existingUrls: readonly string[],
  { normalize, max }: BulkExternalVideoUrlParseOptions,
): BulkExternalVideoUrlParseResult {
  const existing: string[] = [];
  const seen = new Set<string>();
  for (const rawExisting of existingUrls) {
    const normalized = normalize(rawExisting);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    if (existing.length >= max) break;
    seen.add(key);
    existing.push(normalized);
  }

  const added: string[] = [];
  let skippedInvalid = 0;
  let skippedDuplicate = 0;
  let skippedLimit = 0;
  let remainingCapacity = max - existing.length;

  for (const candidate of splitPastedExternalVideoUrls(raw)) {
    const normalized = normalize(candidate);
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
