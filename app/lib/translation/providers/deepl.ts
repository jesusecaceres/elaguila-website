import "server-only";

import type {
  AdTranslationResult,
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import {
  TranslationProviderNotConfiguredError,
  TranslationProviderRequestError,
} from "@/app/lib/translation/errors";
import {
  unwrapMaskPlaceholdersFromXmlTags,
  wrapMaskPlaceholdersForXmlTags,
} from "@/app/lib/translation/providers/maskPlaceholders";

export const DEEPL_PROVIDER_ID = "deepl";

const DEFAULT_DEEPL_API_URL = "https://api.deepl.com/v2/translate";
const DEFAULT_DEEPL_FREE_API_URL = "https://api-free.deepl.com/v2/translate";

function mapLocaleToDeepL(locale: Locale): string {
  return locale === "en" ? "EN-US" : "ES";
}

function resolveDeepLEndpoint(apiKey: string, apiUrlOverride: string | undefined): string {
  const trimmed = apiUrlOverride?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  return apiKey.endsWith(":fx") ? DEFAULT_DEEPL_FREE_API_URL : DEFAULT_DEEPL_API_URL;
}

export function readDeepLApiKey(): string | null {
  const key = process.env.DEEPL_API_KEY?.trim();
  return key || null;
}

async function callDeepLTranslate(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: ContentLocale,
  apiKey: string,
  apiUrl: string | undefined,
): Promise<string[]> {
  const targetLang = mapLocaleToDeepL(targetLocale);
  const sourceLang = sourceLocale !== "unknown" ? mapLocaleToDeepL(sourceLocale as Locale) : undefined;

  const body: Record<string, unknown> = {
    text: texts,
    target_lang: targetLang,
    tag_handling: "xml",
    ignore_tags: "x",
  };
  if (sourceLang) body.source_lang = sourceLang;

  const endpoint = resolveDeepLEndpoint(apiKey, apiUrl);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new TranslationProviderRequestError();
  }

  const json = (await res.json()) as { translations?: Array<{ text?: string }> };
  const rows = json.translations;
  if (!Array.isArray(rows) || rows.length !== texts.length) {
    throw new TranslationProviderRequestError();
  }

  return rows.map((row) => {
    const text = row?.text;
    if (typeof text !== "string") {
      throw new TranslationProviderRequestError();
    }
    return text;
  });
}

/**
 * Optional / fallback provider (DeepL). Not the strategic primary — see G3 Google.
 */
export async function translateAdWithDeepL(req: TranslateAdRequest): Promise<AdTranslationResult> {
  const apiKey = readDeepLApiKey();
  if (!apiKey) {
    throw new TranslationProviderNotConfiguredError();
  }

  const maskedFields = req.maskedFields;
  const fieldKeys = Object.keys(maskedFields) as TranslatableAdFieldKey[];
  if (fieldKeys.length === 0) {
    throw new TranslationProviderRequestError("No translatable fields.");
  }

  const textsToTranslate = fieldKeys.map((k) => wrapMaskPlaceholdersForXmlTags(maskedFields[k]!));

  let translatedTexts: string[];
  try {
    translatedTexts = await callDeepLTranslate(
      textsToTranslate,
      req.targetLocale,
      req.sourceLocale,
      apiKey,
      process.env.DEEPL_API_URL,
    );
  } catch (e) {
    if (e instanceof TranslationProviderNotConfiguredError) throw e;
    if (e instanceof TranslationProviderRequestError) throw e;
    throw new TranslationProviderRequestError();
  }

  const translated: TranslatableAdFields = {};
  for (let i = 0; i < fieldKeys.length; i++) {
    translated[fieldKeys[i]] = unwrapMaskPlaceholdersFromXmlTags(translatedTexts[i]);
  }

  return {
    translated,
    sourceLocale: req.sourceLocale,
    targetLocale: req.targetLocale,
    provider: DEEPL_PROVIDER_ID,
    translatedAt: new Date().toISOString(),
    fromCache: false,
  };
}
