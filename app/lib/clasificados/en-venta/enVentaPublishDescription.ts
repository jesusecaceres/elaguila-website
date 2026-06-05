/**
 * Canonical Varios `listings.description` — must match preview Descripción (`state.description`).
 * DB: NULL OR char_length 20..4000 (see `leonixPublishPublicDescription.ts`).
 */
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

  if (previewDescription.length > 0 && sanitized.length > 0 && sanitized.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return {
      ok: false,
      error: lang === "es" ? EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES : EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN,
    };
  }

  const descriptionForDb = toLeonixListingsDescriptionForDb(previewDescription);
  return { ok: true, previewDescription, sanitized, descriptionForDb };
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
    return `${baseForDb}${appendix}`.trim();
  }
  const appendixOnly = appendix.trim();
  const sanitized = sanitizeLeonixListingPublishDescriptionBody(appendixOnly);
  if (sanitized.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return toLeonixListingsDescriptionForDb(appendixOnly) ?? appendixOnly;
  }
  return null;
}
