/**
 * Canonical Varios `listings.description` — must match preview Descripción (`state.description`).
 * DB: NULL OR char_length 20..4000 (see `leonixPublishPublicDescription.ts`).
 */
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { normalizeEnVentaFreeApplicationState } from "@/app/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState";
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
      /** `null` when empty (valid for INSERT). */
      descriptionForDb: string | null;
    }
  | { ok: false; error: string };

/** Trimmed visible description from form state — preview, validation, and publish share this. */
export function normalizeEnVentaFormDescription(raw: string | null | undefined): string {
  return String(raw ?? "").trim();
}

/** Coerce any post-insert description patch to a DB-valid value or safe fallback. */
export function coerceEnVentaDescriptionColumnForDb(
  raw: string | null | undefined,
  fallback: string | null = null,
): string | null {
  const trimmed = normalizeEnVentaFormDescription(raw);
  if (!trimmed) return fallback;
  const coerced = toLeonixListingsDescriptionForDb(trimmed);
  if (coerced) return coerced;
  if (
    trimmed.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS &&
    trimmed.length <= 4000
  ) {
    return trimmed;
  }
  return fallback;
}

export function prepareEnVentaStateForPublish(
  state: EnVentaFreeApplicationState,
): EnVentaFreeApplicationState {
  return normalizeEnVentaFreeApplicationState(state);
}

/** Raw main description from draft — preview and publish share this field only. */
export function enVentaCanonicalMainDescription(rawState: { description?: string | null }): string {
  return normalizeEnVentaFormDescription(rawState.description);
}

/**
 * Validates and prepares `listings.description` for En Venta publish.
 * Blocks when trimmed visible text is 1..19 chars; empty is allowed (SQL NULL).
 */
export function resolveEnVentaPublishDescriptionForDb(
  rawDescription: string,
  lang: "es" | "en",
): EnVentaPublishDescriptionResolveResult {
  const normalizedDescription = normalizeEnVentaFormDescription(rawDescription);

  if (!normalizedDescription) {
    return { ok: true, previewDescription: "", sanitized: "", descriptionForDb: null };
  }

  if (normalizedDescription.length < LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return {
      ok: false,
      error:
        lang === "es" ? EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES : EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN,
    };
  }

  const prep = prepareLeonixListingDescriptionForPublish(normalizedDescription, lang);
  if (!prep.ok) {
    return { ok: false, error: prep.error };
  }

  const descriptionForDb = coerceEnVentaDescriptionColumnForDb(normalizedDescription);
  if (!descriptionForDb) {
    return {
      ok: false,
      error:
        lang === "es" ? EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES : EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN,
    };
  }

  return {
    ok: true,
    previewDescription: normalizedDescription,
    sanitized: prep.sanitized,
    descriptionForDb,
  };
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
    return coerceEnVentaDescriptionColumnForDb(merged, baseForDb);
  }
  const appendixOnly = appendix.trim();
  const sanitized = sanitizeLeonixListingPublishDescriptionBody(appendixOnly);
  if (sanitized.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS) {
    return coerceEnVentaDescriptionColumnForDb(appendixOnly, null);
  }
  return null;
}
