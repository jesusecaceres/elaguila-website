import "server-only";

import { createHash } from "crypto";

import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import type {
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";

/** Bump when masking rules or cache record shape changes. */
export const SERVER_TRANSLATION_CACHE_VERSION = "v1";

/** Future table name — not migrated in G4. */
export const TRANSLATION_RECORDS_TABLE = "translation_records";

export type ServerTranslationCacheKeyParts = {
  category: string;
  listingKey: string;
  fieldKey: TranslatableAdFieldKey;
  sourceLocale: ContentLocale;
  targetLocale: Locale;
  sourceTextHash: string;
  version?: string;
};

export type CachedFieldTranslation = {
  translatedText: string;
  translatedAt: string;
  provider: string;
};

export type ServerCacheLookupResult = {
  translated: TranslatableAdFields;
  misses: TranslatableAdFieldKey[];
  cacheHits: TranslatableAdFieldKey[];
  /** Latest cached timestamp among hits (if any). */
  cachedAt: string | null;
};

/** SHA-256 of masked source prose — never log the input text. */
export function hashMaskedSourceText(maskedText: string): string {
  return createHash("sha256").update(maskedText, "utf8").digest("hex");
}

export function buildServerTranslationCacheKey(parts: ServerTranslationCacheKeyParts): string {
  const version = (parts.version ?? SERVER_TRANSLATION_CACHE_VERSION).trim() || SERVER_TRANSLATION_CACHE_VERSION;
  const category = parts.category.trim();
  const listingKey = parts.listingKey.trim();
  const src =
    parts.sourceLocale === "es" || parts.sourceLocale === "en" ? parts.sourceLocale : "unknown";
  return `${version}:${category}:${listingKey}:${parts.fieldKey}:${src}:${parts.targetLocale}:${parts.sourceTextHash}`;
}

/**
 * True when durable server storage is wired (Supabase `translation_records`).
 * G4: no migration yet — always false until a later gate enables storage.
 */
export function isServerTranslationStorageAvailable(): boolean {
  if (process.env.TRANSLATION_CACHE_STORAGE?.trim().toLowerCase() !== "supabase") {
    return false;
  }
  // TODO(G4 migration): return true after `translation_records` table + service client exist.
  return false;
}

async function readCachedFieldTranslation(
  parts: ServerTranslationCacheKeyParts,
): Promise<CachedFieldTranslation | null> {
  if (!isServerTranslationStorageAvailable()) return null;

  void buildServerTranslationCacheKey(parts);

  // TODO(G4 migration): Supabase service-role read from translation_records by composite key.
  return null;
}

async function writeCachedFieldTranslation(
  parts: ServerTranslationCacheKeyParts,
  entry: CachedFieldTranslation,
): Promise<void> {
  if (!isServerTranslationStorageAvailable()) return;

  void buildServerTranslationCacheKey(parts);
  void entry;

  // TODO(G4 migration): upsert into translation_records (content_type, content_id, field_key, locales, hash, translated_text).
}

/** Read cached field translations before calling Google. */
export async function lookupCachedTranslations(
  req: TranslateAdRequest,
): Promise<ServerCacheLookupResult> {
  const fieldKeys = Object.keys(req.maskedFields) as TranslatableAdFieldKey[];
  const translated: TranslatableAdFields = {};
  const misses: TranslatableAdFieldKey[] = [];
  const cacheHits: TranslatableAdFieldKey[] = [];
  let cachedAt: string | null = null;

  for (const fieldKey of fieldKeys) {
    const sourceText = req.maskedFields[fieldKey];
    if (typeof sourceText !== "string" || !sourceText.trim()) continue;

    const sourceTextHash = hashMaskedSourceText(sourceText);
    const cached = await readCachedFieldTranslation({
      category: req.category,
      listingKey: req.listingKey,
      fieldKey,
      sourceLocale: req.sourceLocale,
      targetLocale: req.targetLocale,
      sourceTextHash,
    });

    if (cached?.translatedText) {
      translated[fieldKey] = cached.translatedText;
      cacheHits.push(fieldKey);
      if (!cachedAt || cached.translatedAt > cachedAt) {
        cachedAt = cached.translatedAt;
      }
    } else {
      misses.push(fieldKey);
    }
  }

  return { translated, misses, cacheHits, cachedAt };
}

/** Persist freshly translated fields when durable storage is available. */
export async function writeCachedTranslations(
  req: TranslateAdRequest,
  newlyTranslated: TranslatableAdFields,
  provider: string,
): Promise<void> {
  if (!isServerTranslationStorageAvailable()) return;

  const translatedAt = new Date().toISOString();

  for (const fieldKey of Object.keys(newlyTranslated) as TranslatableAdFieldKey[]) {
    const translatedText = newlyTranslated[fieldKey];
    const sourceText = req.maskedFields[fieldKey];
    if (typeof translatedText !== "string" || typeof sourceText !== "string") continue;

    await writeCachedFieldTranslation(
      {
        category: req.category,
        listingKey: req.listingKey,
        fieldKey,
        sourceLocale: req.sourceLocale,
        targetLocale: req.targetLocale,
        sourceTextHash: hashMaskedSourceText(sourceText),
      },
      { translatedText, translatedAt, provider },
    );
  }
}
