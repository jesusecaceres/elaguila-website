/**
 * Leonix `public.listings.description` publish contract:
 * user-authored prose only — no gallery markers, blob/data URLs, or internal API/debug text.
 *
 * Gallery URLs belong in `listings.images`; video in `mux_*`; facts in `detail_pairs`.
 *
 * Max length: production DB uses `description_len_check` (not defined in this repo). A typical
 * cap is **char_length(description) <= 2000**. We enforce **1900** characters (JS string length)
 * so inserts succeed without migrations. After you run `scripts/sql/inspect-listings-description-constraints.sql`,
 * lower this constant if your constraint is tighter (e.g. 1000 → use 950).
 */

import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";

/** Hard cap for `listings.description` on Leonix publish (stay below DB `description_len_check`). */
export const LEONIX_LISTINGS_PUBLISH_DESCRIPTION_MAX_CHARS = 1900;

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

/** Same cleaning as publish; optional clip for display-only surfaces. */
export function sanitizeLeonixListingPreviewDescriptionBody(raw: string, maxChars?: number): string {
  const s = sanitizeLeonixListingPublishDescriptionBody(raw);
  const cap = typeof maxChars === "number" && maxChars > 0 ? Math.min(maxChars, LEONIX_LISTINGS_PUBLISH_DESCRIPTION_MAX_CHARS) : s.length;
  return s.length > cap ? `${s.slice(0, cap).trimEnd()}…` : s;
}

/** Last-line defense before PostgREST: sanitize + hard clip (never rely on callers alone). */
export function clipLeonixListingDescriptionForSql(raw: string): string {
  const s = sanitizeLeonixListingPublishDescriptionBody(String(raw ?? ""));
  return s.slice(0, LEONIX_LISTINGS_PUBLISH_DESCRIPTION_MAX_CHARS).trimEnd();
}

export type LeonixListingDescriptionPrepareResult =
  | { ok: true; sanitized: string }
  | { ok: false; error: string };

/**
 * Validates length after sanitation so pasted transport URLs / legacy appendix cannot bypass the cap.
 */
export function prepareLeonixListingDescriptionForPublish(
  raw: string,
  lang: "es" | "en",
): LeonixListingDescriptionPrepareResult {
  const sanitized = sanitizeLeonixListingPublishDescriptionBody(raw);
  const max = LEONIX_LISTINGS_PUBLISH_DESCRIPTION_MAX_CHARS;
  if (sanitized.length > max) {
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

export function mapLeonixListingsDescriptionConstraintToUserMessage(
  err: { message?: string; code?: string } | null | undefined,
  lang: "es" | "en",
): string | null {
  const msg = String(err?.message ?? "");
  const code = String(err?.code ?? "");
  if (code === "23514" || /description_len_check/i.test(msg)) {
    return lang === "es"
      ? "La descripción es demasiado larga. Acórtala antes de publicar."
      : "The description is too long. Shorten it before publishing.";
  }
  return null;
}

/** Dev-only: diagnostics for publish pipeline (never show to end users). */
export function leonixPublishDescriptionDevDiagnostics(description: string): {
  length: number;
  head300: string;
  flags: Record<string, boolean>;
} {
  const d = description;
  return {
    length: d.length,
    head300: d.slice(0, 300),
    flags: {
      http: /https?:\/\//i.test(d),
      blob: /blob:/i.test(d),
      dataUrl: /\bdata:(?:image|video|application)\//i.test(d),
      leonixImages: /\[LEONIX_IMAGES\]/i.test(d),
      draftMediaUpload: /draft-media-upload/i.test(d),
      uploadStatus: /upload-status/i.test(d),
      mux: /\bmux[_./]/i.test(d) || /stream\.mux\.com/i.test(d),
      supabase: /supabase\.co/i.test(d),
      migration: /\bmigration\b/i.test(d),
    },
  };
}
