/**
 * Canonical Varios `listings.description` — must match preview Descripción (`state.description`).
 * DB: NULL OR char_length 20..4000 (see `leonixPublishPublicDescription.ts`).
 *
 * Used by Pro + Free, fresh + resume — single path via `publishEnVentaFromDraft`.
 */
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { normalizeEnVentaFreeApplicationState } from "@/app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState";
import {
  LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS,
  prepareLeonixListingDescriptionForPublish,
  sanitizeLeonixListingPublishDescriptionBody,
  toLeonixListingsDescriptionForDb,
} from "@/app/clasificados/lib/leonixPublishPublicDescription";

export const EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES =
  "Agrega una descripción más completa antes de publicar.";
export const EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN =
  "Add a more complete description before publishing.";

export type EnVentaPublishDescriptionResolveResult =
  | {
      ok: true;
      /** Same source as preview `EnVentaDetailContentStack` Descripción section. */
      previewDescription: string;
      sanitized: string;
      /** `null` when empty or below DB minimum after sanitize (valid for INSERT). */
      descriptionForDb: string | null;
    }
  | { ok: false; error: string };

/** Raw main description from draft — preview and publish share this field only. */
export function enVentaCanonicalMainDescription(rawState: { description?: string | null }): string {
  return String(rawState.description ?? "").trim();
}

function descriptionTooShortUserMessage(lang: "es" | "en"): string {
  return lang === "es" ? EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES : EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN;
}

/**
 * Normalize draft before any Varios publish handoff (Pro/Free, fresh/resume).
 * Keeps `description` and media fields stable after IDB/session hydration.
 */
export function prepareEnVentaStateForPublish(state: EnVentaFreeApplicationState): EnVentaFreeApplicationState {
  return normalizeEnVentaFreeApplicationState(state);
}

/**
 * Validates and prepares `listings.description` for En Venta publish.
 * Blocks when the seller entered text that sanitizes to 1..19 chars (DB rejects non-NULL < 20).
 */
export function resolveEnVentaPublishDescriptionForDb(
  rawDescription: string,
  lang: "es" | "en",
): EnVentaPublishDescriptionResolveResult {
  const previewDescription = rawDescription.trim();
  const prep = prepareLeonixListingDescriptionForPublish(previewDescription, lang);
  if (!prep.ok) {
    return { ok: false, error: prep.error };
  }
  const sanitized = prep.sanitized;

  if (previewDescription.length > 0 && sanitized.length === 0) {
    return { ok: false, error: descriptionTooShortUserMessage(lang) };
  }

  if (sanitized.length > 0 && sanitized.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return { ok: false, error: descriptionTooShortUserMessage(lang) };
  }

  if (
    previewDescription.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS &&
    sanitized.length > 0 &&
    sanitized.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS
  ) {
    return { ok: false, error: descriptionTooShortUserMessage(lang) };
  }

  const descriptionForDb = toLeonixListingsDescriptionForDb(previewDescription);
  return { ok: true, previewDescription, sanitized, descriptionForDb };
}

/**
 * Coerce any post-upload description merge to a valid `listings.description` column value or NULL.
 * Never returns a 1..19 char string (would trigger `description_len_check`).
 */
export function coerceEnVentaDescriptionColumnForDb(raw: string | null | undefined): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  return toLeonixListingsDescriptionForDb(trimmed);
}

export type EnVentaDescriptionColumnGuardResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/** Guard gallery/video description updates before Supabase write. */
export function guardEnVentaDescriptionColumnForDb(
  raw: string | null | undefined,
  lang: "es" | "en",
): EnVentaDescriptionColumnGuardResult {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  const value = coerceEnVentaDescriptionColumnForDb(trimmed);
  if (value != null) return { ok: true, value };
  const sanitized = sanitizeLeonixListingPublishDescriptionBody(trimmed);
  if (sanitized.length > 0 && sanitized.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return { ok: false, error: descriptionTooShortUserMessage(lang) };
  }
  return { ok: true, value: null };
}

/** Photo appendix appended after upload (legacy marker); not shown in preview Descripción. */
export function appendEnVentaPhotoDescriptionAppendix(
  baseForDb: string | null,
  photoUrls: string[],
  lang: "es" | "en",
): string | null {
  if (!photoUrls.length) return baseForDb;
  const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
  const appendix =
    lang === "es"
      ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
      : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
  if (baseForDb) {
    const merged = `${baseForDb}${appendix}`.trim();
    return coerceEnVentaDescriptionColumnForDb(merged) ?? baseForDb;
  }
  return coerceEnVentaDescriptionColumnForDb(appendix.trim());
}
