import type {
  AdTranslationPayload,
  AdTranslationResult,
  ContentLocale,
  Locale,
  MaskToken,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";
import { maskContactSensitiveText, restoreContactSensitiveText } from "@/app/lib/translation/contactMask";

const TRANSLATABLE_KEYS = new Set<TranslatableAdFieldKey>([
  "title",
  "description",
  "serviceLabel",
  "customServiceText",
  "details",
  "highlights",
  "body",
  "shareText",
]);

const STORAGE_NS = "leonix:adTranslate";

export function normalizeLocale(input: string | undefined | null): Locale | null {
  if (input == null) return null;
  const v = String(input).trim().toLowerCase();
  if (v === "es" || v === "en") return v;
  return null;
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es";
}

export type ShouldOfferTranslateAdInput = {
  siteLocale: Locale;
  originalLocale: ContentLocale;
  detectedLocale?: Locale | null;
};

/**
 * Offer “Translate ad” only when we believe the listing prose is in a different locale than the UI.
 */
export function shouldOfferTranslateAd({
  siteLocale,
  originalLocale,
  detectedLocale,
}: ShouldOfferTranslateAdInput): boolean {
  const fromOriginal: Locale | null =
    originalLocale === "es" || originalLocale === "en" ? originalLocale : null;
  const fromDetect = detectedLocale ?? null;

  const contentLocale: Locale | null = fromOriginal ?? fromDetect;
  if (!contentLocale) return false;
  return contentLocale !== siteLocale;
}

export type TranslateCacheKeyParts = {
  category: string;
  listingKey: string;
  sourceLocale: ContentLocale;
  targetLocale: Locale;
  /** Bump when masking rules or payload shape changes */
  version?: string;
};

export function buildTranslateCacheKey(parts: TranslateCacheKeyParts): string {
  const version = (parts.version ?? "v1").trim() || "v1";
  const cat = encodeURIComponent(parts.category.trim());
  const key = encodeURIComponent(parts.listingKey.trim());
  const src =
    parts.sourceLocale === "es" || parts.sourceLocale === "en"
      ? parts.sourceLocale
      : "unknown";
  const tgt = parts.targetLocale;
  return `${STORAGE_NS}:${version}:${cat}:${key}:${src}->${tgt}`;
}

function getSessionStorageSafe(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getCachedAdTranslation(key: string): AdTranslationResult | null {
  const storage = getSessionStorageSafe();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as AdTranslationResult;
  } catch {
    return null;
  }
}

export function setCachedAdTranslation(
  key: string,
  result: AdTranslationResult,
): void {
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(result));
  } catch {
    /* quota / private mode */
  }
}

export function clearCachedAdTranslation(key: string): void {
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Strip non-plain entries and known metadata; returns plain strings only for translatable keys. */
export function pickTranslatableAdFields(input: unknown): TranslatableAdFields {
  if (!input || typeof input !== "object") return {};
  const src = input as Record<string, unknown>;
  const out: TranslatableAdFields = {};

  for (const key of TRANSLATABLE_KEYS) {
    const v = src[key];
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    out[key] = trimmed;
  }
  return out;
}

export type MaskedTranslatableFields = {
  fields: TranslatableAdFields;
  /** Per-field mask maps — restore after translation using {@link unmaskTranslatableFields}. */
  fieldMaps: Partial<Record<TranslatableAdFieldKey, { map: MaskToken[] }>>;
};

/** Apply {@link maskContactSensitiveText} to each translatable string field. */
export function maskTranslatableFields(fields: TranslatableAdFields): MaskedTranslatableFields {
  const masked: TranslatableAdFields = {};
  const fieldMaps: MaskedTranslatableFields["fieldMaps"] = {};

  for (const key of Object.keys(fields) as TranslatableAdFieldKey[]) {
    const raw = fields[key];
    if (typeof raw !== "string") continue;
    const { masked: m, map } = maskContactSensitiveText(raw);
    masked[key] = m;
    if (map.length) fieldMaps[key] = { map };
  }

  return { fields: masked, fieldMaps };
}

export function unmaskTranslatableFields(
  fields: TranslatableAdFields,
  fieldMaps: MaskedTranslatableFields["fieldMaps"],
): TranslatableAdFields {
  const out: TranslatableAdFields = { ...fields };
  for (const key of Object.keys(out) as TranslatableAdFieldKey[]) {
    const fm = fieldMaps[key]?.map;
    if (!fm?.length) continue;
    const raw = out[key];
    if (typeof raw === "string") {
      out[key] = restoreContactSensitiveText(raw, fm);
    }
  }
  return out;
}

/** Merge typed listing metadata into a payload without pulling contact columns. */
export function buildAdTranslationPayloadSlice(input: {
  fields: TranslatableAdFields;
  category?: string;
  listingKey?: string;
  sourceLocale?: ContentLocale;
  targetLocale?: Locale;
}): Pick<
  AdTranslationPayload,
  TranslatableAdFieldKey | "category" | "listingKey" | "sourceLocale" | "targetLocale"
> {
  return {
    ...input.fields,
    ...(input.category != null ? { category: input.category } : {}),
    ...(input.listingKey != null ? { listingKey: input.listingKey } : {}),
    ...(input.sourceLocale != null ? { sourceLocale: input.sourceLocale } : {}),
    ...(input.targetLocale != null ? { targetLocale: input.targetLocale } : {}),
  };
}
