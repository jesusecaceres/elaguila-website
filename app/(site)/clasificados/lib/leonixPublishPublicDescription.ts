/**
 * Leonix `public.listings` text columns — aligned with Supabase checks:
 *
 * - `description_len_check`: NULL OR (char_length(description) >= 20 AND char_length(description) <= 4000)
 * - `title_len_check`: NULL OR (char_length(title) >= 5 AND char_length(title) <= 120)
 *
 * Gallery URLs belong in `listings.images`; video in `mux_*`; facts in `detail_pairs`.
 */

import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";

/** Postgres allows up to 4000; stay under for safety margin. */
export const LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS = 20;
export const LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS = 3900;

export const LEONIX_LISTINGS_TITLE_DB_MIN_CHARS = 5;
export const LEONIX_LISTINGS_TITLE_DB_MAX_CHARS = 120;

/** Clip by Unicode scalar (not UTF-16 index) so Postgres `char_length` stays aligned and we never split astral pairs. */
function clipLeonixDescriptionToMaxScalars(s: string, maxScalars: number): string {
  const chars = Array.from(s);
  if (chars.length <= maxScalars) return s;
  return chars.slice(0, maxScalars).join("");
}

/**
 * Removes internal / transport noise that must never be persisted as public listing copy.
 * Runs after `stripLeonixPublishedDescriptionBody` (legacy appendix / marker blocks).
 */
export function stripLeonixListingPublishDescriptionNoise(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      kept.push("");
      continue;
    }
    if (/^blob:/i.test(t)) continue;
    if (/^data:(image|video|application)\//i.test(t)) continue;
    if (t.length > 4000 && /;base64,/i.test(t)) continue;
    if (/\[LEONIX_IMAGES\]|\[\/LEONIX_IMAGES\]/i.test(t)) continue;
    if (/\/api\/clasificados\/rentas\/draft-media-upload/i.test(t)) continue;
    if (/\/api\/mux\/(direct-upload|upload-status)/i.test(t) || /upload-status\?/i.test(t)) continue;
    if (/^\s*url=https?:\/\//i.test(t)) continue;
    if (/^\s*https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?$/i.test(t)) {
      if (/listing-images|public\.blob\.vercel-storage|supabase\.co\/storage/i.test(t)) continue;
    }
    if (/stream\.mux\.com|image\.mux\.com/i.test(t) && /^https?:\/\/[^\s]+$/i.test(t)) continue;
    kept.push(line);
  }
  const joined = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return joined
    .replace(/\bblob:[^\s'"]+/gi, "")
    .replace(/data:(?:image|video|application)\/[^\s'"]+/gi, "")
    .trim();
}

export function sanitizeLeonixListingPublishDescriptionBody(raw: string): string {
  const strippedLegacy = stripLeonixPublishedDescriptionBody(raw);
  return stripLeonixListingPublishDescriptionNoise(strippedLegacy);
}

/** Preview / UI: same cleaning; optional soft cap for display ellipsis. */
export function sanitizeLeonixListingPreviewDescriptionBody(raw: string, maxChars?: number): string {
  const s = sanitizeLeonixListingPublishDescriptionBody(raw);
  const cap =
    typeof maxChars === "number" && maxChars > 0
      ? Math.min(maxChars, LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS)
      : s.length;
  return s.length > cap ? `${s.slice(0, cap).trimEnd()}…` : s;
}

/**
 * Value for `public.listings.description` only.
 * - NULL when empty, whitespace-only, or sanitized length 1..19 (invalid per DB check).
 * - Clipped to DB max when longer (defense; publish path should block earlier).
 */
export function toLeonixListingsDescriptionForDb(raw: string): string | null {
  const s = sanitizeLeonixListingPublishDescriptionBody(String(raw ?? ""));
  if (s.length === 0) return null;
  if (s.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) return null;
  let out: string;
  if (s.length > LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS) {
    out = clipLeonixDescriptionToMaxScalars(s, LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS).trimEnd();
  } else {
    out = s;
  }
  if (out.length === 0 || out.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) return null;
  if (out.length > LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS) {
    out = clipLeonixDescriptionToMaxScalars(out, LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS).trimEnd();
    if (out.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) return null;
  }
  return out;
}

/** @deprecated Use `toLeonixListingsDescriptionForDb` (returns string | null). */
export function clipLeonixListingDescriptionForSql(raw: string): string | null {
  return toLeonixListingsDescriptionForDb(raw);
}

export type LeonixListingDescriptionPrepareResult =
  | { ok: true; sanitized: string }
  | { ok: false; error: string };

/**
 * Blocks publish when sanitized body exceeds DB max (before any insert).
 * Short / empty descriptions are allowed here; `toLeonixListingsDescriptionForDb` turns them into NULL for SQL.
 */
export function prepareLeonixListingDescriptionForPublish(
  raw: string,
  lang: "es" | "en",
): LeonixListingDescriptionPrepareResult {
  const sanitized = sanitizeLeonixListingPublishDescriptionBody(raw);
  if (sanitized.length > LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS) {
    return {
      ok: false,
      error:
        lang === "es"
          ? "La descripción es demasiado larga. Acórtala antes de publicar."
          : "The description is too long. Shorten it before publishing.",
    };
  }
  return { ok: true, sanitized };
}

export function toLeonixListingsTitleForDb(raw: string): string {
  let t = String(raw ?? "").trim();
  if (t.length > LEONIX_LISTINGS_TITLE_DB_MAX_CHARS) {
    t = t.slice(0, LEONIX_LISTINGS_TITLE_DB_MAX_CHARS).trimEnd();
  }
  return t;
}

export type LeonixListingTitlePrepareResult = { ok: true; titleForDb: string } | { ok: false; error: string };

export function prepareLeonixListingTitleForPublish(raw: string, lang: "es" | "en"): LeonixListingTitlePrepareResult {
  const titleForDb = toLeonixListingsTitleForDb(raw);
  if (titleForDb.length < LEONIX_LISTINGS_TITLE_DB_MIN_CHARS) {
    return {
      ok: false,
      error:
        lang === "es"
          ? "El título debe tener al menos 5 caracteres."
          : "The title must be at least 5 characters.",
    };
  }
  return { ok: true, titleForDb };
}

export function mapLeonixListingsDescriptionConstraintToUserMessage(
  err: { message?: string; code?: string } | null | undefined,
  lang: "es" | "en",
): string | null {
  const msg = String(err?.message ?? "");
  const code = String(err?.code ?? "");
  if (code === "23514" && /description_len_check/i.test(msg)) {
    return lang === "es"
      ? "La descripción no es válida: debe tener entre 20 y 4000 caracteres, o puedes publicar sin descripción."
      : "Description must be between 20 and 4000 characters, or you can publish without one.";
  }
  if (code === "23514" && /title_len_check/i.test(msg)) {
    return lang === "es"
      ? "El título no cumple la longitud permitida (5–120 caracteres). Ajústalo antes de publicar."
      : "The title must be between 5 and 120 characters. Adjust it before publishing.";
  }
  return null;
}

/** Dev-only: diagnostics for publish pipeline (never show to end users). */
export function leonixPublishDescriptionDevDiagnostics(
  sanitized: string,
  descriptionForDb: string | null,
): {
  sanitizedLen: number;
  dbDescriptionLen: number | null;
  dbDescriptionIsNull: boolean;
  typeofDescription: string;
  head300: string;
  tail300: string;
  flags: Record<string, boolean>;
} {
  const d = sanitized;
  const db = descriptionForDb;
  return {
    sanitizedLen: d.length,
    dbDescriptionLen: db == null ? null : db.length,
    dbDescriptionIsNull: db == null,
    typeofDescription: db == null ? "null" : typeof db,
    head300: d.slice(0, 300),
    tail300: d.length > 300 ? d.slice(-300) : d,
    flags: {
      http: /https?:\/\//i.test(d),
      blob: /blob:/i.test(d),
      dataUrl: /\bdata:(?:image|video|application)\//i.test(d),
      base64Heavy: /;base64,/i.test(d) && d.length > 2000,
      leonixImages: /\[LEONIX_IMAGES\]/i.test(d),
      draftMediaUpload: /draft-media-upload/i.test(d),
      uploadStatus: /upload-status/i.test(d),
      mux: /\bmux[_./]/i.test(d) || /stream\.mux\.com/i.test(d),
      supabase: /supabase\.co/i.test(d),
      migration: /\bmigration\b/i.test(d),
    },
  };
}
