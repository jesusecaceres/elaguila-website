/**
 * Leonix `public.listings.description` publish contract:
 * user-authored prose only — no gallery markers, blob/data URLs, or internal API/debug text.
 *
 * Gallery URLs belong in `listings.images`; video in `mux_*`; facts in `detail_pairs`.
 */

import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";

/** Default cap stays under common `description_len_check` limits (often 8000) without changing DB. */
export const LEONIX_LISTINGS_PUBLISH_DESCRIPTION_DEFAULT_MAX = 7800;

function listingDescriptionMaxChars(): number {
  const raw = String(process.env.NEXT_PUBLIC_LEONIX_LISTING_DESCRIPTION_MAX_CHARS ?? "").trim();
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1000 && n <= 500_000) return Math.floor(n);
  return LEONIX_LISTINGS_PUBLISH_DESCRIPTION_DEFAULT_MAX;
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
  const max = listingDescriptionMaxChars();
  if (sanitized.length > max) {
    return {
      ok: false,
      error:
        lang === "es"
          ? "La descripción es demasiado larga. Acórtala antes de publicar."
          : "Your description is too long. Shorten it before publishing.",
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
      : "Your description is too long. Shorten it before publishing.";
  }
  return null;
}
