import "server-only";

import type {
  AdTranslationResult,
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";

export const TRANSLATION_PROVIDER_ID = "deepl";

const DEFAULT_DEEPL_API_URL = "https://api.deepl.com/v2/translate";
const DEFAULT_DEEPL_FREE_API_URL = "https://api-free.deepl.com/v2/translate";

export class TranslationProviderNotConfiguredError extends Error {
  constructor() {
    super("Translation provider is not configured.");
    this.name = "TranslationProviderNotConfiguredError";
  }
}

export class TranslationProviderRequestError extends Error {
  constructor(message = "Translation service temporarily unavailable.") {
    super(message);
    this.name = "TranslationProviderRequestError";
  }
}

function mapLocaleToDeepL(locale: Locale): string {
  return locale === "en" ? "EN-US" : "ES";
}

function resolveDeepLEndpoint(apiKey: string, apiUrlOverride: string | undefined): string {
  const trimmed = apiUrlOverride?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  return apiKey.endsWith(":fx") ? DEFAULT_DEEPL_FREE_API_URL : DEFAULT_DEEPL_API_URL;
}

function wrapMaskPlaceholders(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, (m) => `<x>${m}</x>`);
}

function unwrapMaskPlaceholders(text: string): string {
  return text.replace(/<x>(__LEONIX_MASK_\d+__)<\/x>/g, (_, m) => m);
}

function isDeepLProviderSelected(): boolean {
  const provider = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  if (!provider) return true;
  return provider === "deepl";
}

function readDeepLApiKey(): string | null {
  if (!isDeepLProviderSelected()) return null;
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
 * Server-only translator for already-masked ad fields. Never log full text or API keys.
 * Use from API routes only (`import "server-only"` on this module).
 */
export async function translateAdWithConfiguredProvider(
  req: TranslateAdRequest,
): Promise<AdTranslationResult> {
  const apiKey = readDeepLApiKey();
  if (!apiKey) {
    throw new TranslationProviderNotConfiguredError();
  }

  const maskedFields = req.maskedFields;
  const fieldKeys = Object.keys(maskedFields) as TranslatableAdFieldKey[];
  if (fieldKeys.length === 0) {
    throw new TranslationProviderRequestError("No translatable fields.");
  }

  const textsToTranslate = fieldKeys.map((k) => wrapMaskPlaceholders(maskedFields[k]!));

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
    translated[fieldKeys[i]] = unwrapMaskPlaceholders(translatedTexts[i]);
  }

  return {
    translated,
    sourceLocale: req.sourceLocale,
    targetLocale: req.targetLocale,
    provider: TRANSLATION_PROVIDER_ID,
    translatedAt: new Date().toISOString(),
    fromCache: false,
  };
}

export function isTranslationProviderConfigured(): boolean {
  return Boolean(readDeepLApiKey());
}

/** @deprecated Prefer {@link translateAdWithConfiguredProvider}. */
export const translateMaskedAdFields = translateAdWithConfiguredProvider;
