import "server-only";

import { createHash } from "crypto";

import { isSupabaseAdminConfigured, getAdminSupabase } from "@/app/lib/supabase/server";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import type {
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";

/** Bump when masking rules or cache record shape changes. */
export const SERVER_TRANSLATION_CACHE_VERSION = "v1";

export const TRANSLATION_RECORDS_TABLE = "translation_records";

const CACHE_UPSERT_CONFLICT_COLUMNS =
  "category,listing_key,field_key,source_locale,target_locale,source_text_hash,source_text_version";

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

type TranslationRecordRow = {
  translated_text: string;
  provider: string;
  updated_at: string;
  stale_at: string | null;
};

/** SHA-256 of masked source prose — never log the input text. */
export function hashMaskedSourceText(maskedText: string): string {
  return createHash("sha256").update(maskedText, "utf8").digest("hex");
}

function normalizeSourceLocale(sourceLocale: ContentLocale): ContentLocale {
  return sourceLocale === "es" || sourceLocale === "en" ? sourceLocale : "unknown";
}

function resolveSourceTextVersion(version?: string): string {
  const resolved = (version ?? SERVER_TRANSLATION_CACHE_VERSION).trim();
  return resolved || SERVER_TRANSLATION_CACHE_VERSION;
}

export function buildServerTranslationCacheKey(parts: ServerTranslationCacheKeyParts): string {
  const version = resolveSourceTextVersion(parts.version);
  const category = parts.category.trim();
  const listingKey = parts.listingKey.trim();
  const src = normalizeSourceLocale(parts.sourceLocale);
  return `${version}:${category}:${listingKey}:${parts.fieldKey}:${src}:${parts.targetLocale}:${parts.sourceTextHash}`;
}

/**
 * True when durable server storage is wired (Supabase `translation_records`).
 * Requires `TRANSLATION_CACHE_STORAGE=supabase` and service-role Supabase credentials.
 */
export function isServerTranslationStorageAvailable(): boolean {
  if (process.env.TRANSLATION_CACHE_STORAGE?.trim().toLowerCase() !== "supabase") {
    return false;
  }
  return isSupabaseAdminConfigured();
}

function logCacheError(
  operation: "read" | "write",
  parts: ServerTranslationCacheKeyParts,
  code?: string,
): void {
  console.error("[translation-cache]", {
    operation,
    category: parts.category.trim(),
    listingKey: parts.listingKey.trim(),
    fieldKey: parts.fieldKey,
    targetLocale: parts.targetLocale,
    sourceTextVersion: resolveSourceTextVersion(parts.version),
    code: code ?? "unknown",
  });
}

async function readCachedFieldTranslation(
  parts: ServerTranslationCacheKeyParts,
): Promise<CachedFieldTranslation | null> {
  if (!isServerTranslationStorageAvailable()) return null;

  void buildServerTranslationCacheKey(parts);

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TRANSLATION_RECORDS_TABLE)
      .select("translated_text, provider, updated_at, stale_at")
      .eq("category", parts.category.trim())
      .eq("listing_key", parts.listingKey.trim())
      .eq("field_key", parts.fieldKey)
      .eq("source_locale", normalizeSourceLocale(parts.sourceLocale))
      .eq("target_locale", parts.targetLocale)
      .eq("source_text_hash", parts.sourceTextHash)
      .eq("source_text_version", resolveSourceTextVersion(parts.version))
      .maybeSingle<TranslationRecordRow>();

    if (error) {
      logCacheError("read", parts, error.code);
      return null;
    }

    if (!data || data.stale_at !== null) {
      return null;
    }

    if (typeof data.translated_text !== "string" || !data.translated_text.trim()) {
      return null;
    }

    return {
      translatedText: data.translated_text,
      translatedAt: data.updated_at,
      provider: data.provider,
    };
  } catch {
    logCacheError("read", parts);
    return null;
  }
}

async function writeCachedFieldTranslation(
  parts: ServerTranslationCacheKeyParts,
  entry: CachedFieldTranslation,
): Promise<void> {
  if (!isServerTranslationStorageAvailable()) return;

  void buildServerTranslationCacheKey(parts);

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from(TRANSLATION_RECORDS_TABLE).upsert(
      {
        category: parts.category.trim(),
        listing_key: parts.listingKey.trim(),
        field_key: parts.fieldKey,
        source_locale: normalizeSourceLocale(parts.sourceLocale),
        target_locale: parts.targetLocale,
        source_text_hash: parts.sourceTextHash,
        source_text_version: resolveSourceTextVersion(parts.version),
        translated_text: entry.translatedText,
        provider: entry.provider,
        updated_at: entry.translatedAt,
        stale_at: null,
      },
      { onConflict: CACHE_UPSERT_CONFLICT_COLUMNS },
    );

    if (error) {
      logCacheError("write", parts, error.code);
    }
  } catch {
    logCacheError("write", parts);
  }
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
