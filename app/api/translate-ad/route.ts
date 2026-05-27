import { NextRequest, NextResponse } from "next/server";

import type {
  AdTranslationResult,
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";

const ALLOWED_FIELD_KEYS: ReadonlySet<TranslatableAdFieldKey> = new Set([
  "title",
  "description",
  "serviceLabel",
  "customServiceText",
  "details",
  "highlights",
  "body",
  "shareText",
]);

const VALID_TARGET_LOCALES: ReadonlySet<string> = new Set(["es", "en"]);
const VALID_SOURCE_LOCALES: ReadonlySet<string> = new Set(["es", "en", "unknown"]);

const MAX_TOTAL_CHARS = 12_000;
const MAX_FIELD_CHARS = 5_000;

function mapLocaleToDeepL(locale: Locale): string {
  return locale === "en" ? "EN-US" : "ES";
}

function sanitizeFieldsPayload(raw: unknown): TranslatableAdFields | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const src = raw as Record<string, unknown>;
  const out: TranslatableAdFields = {};
  let totalChars = 0;

  for (const key of Object.keys(src)) {
    if (!ALLOWED_FIELD_KEYS.has(key as TranslatableAdFieldKey)) continue;
    const v = src[key];
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_FIELD_CHARS) return null;
    totalChars += trimmed.length;
    if (totalChars > MAX_TOTAL_CHARS) return null;
    out[key as TranslatableAdFieldKey] = trimmed;
  }

  return Object.keys(out).length > 0 ? out : null;
}

type DeepLTranslation = { text: string };
type DeepLResponse = { translations: DeepLTranslation[] };

async function translateWithDeepL(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: ContentLocale,
  apiKey: string,
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

  const endpoint = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const status = res.status;
    throw new Error(`DeepL API returned ${status}`);
  }

  const json = (await res.json()) as DeepLResponse;
  return json.translations.map((t) => t.text);
}

function wrapMaskPlaceholders(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, (m) => `<x>${m}</x>`);
}

function unwrapMaskPlaceholders(text: string): string {
  return text.replace(/<x>(__LEONIX_MASK_\d+__)<\/x>/g, (_, m) => m);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  const targetLocale = payload.targetLocale;
  if (typeof targetLocale !== "string" || !VALID_TARGET_LOCALES.has(targetLocale)) {
    return NextResponse.json({ error: "Invalid targetLocale. Must be 'es' or 'en'." }, { status: 400 });
  }

  const sourceLocale = payload.sourceLocale;
  if (typeof sourceLocale !== "string" || !VALID_SOURCE_LOCALES.has(sourceLocale)) {
    return NextResponse.json({ error: "Invalid sourceLocale. Must be 'es', 'en', or 'unknown'." }, { status: 400 });
  }

  const category = payload.category;
  if (typeof category !== "string" || !category.trim()) {
    return NextResponse.json({ error: "category is required." }, { status: 400 });
  }

  const listingKey = payload.listingKey;
  if (typeof listingKey !== "string" || !listingKey.trim()) {
    return NextResponse.json({ error: "listingKey is required." }, { status: 400 });
  }

  const maskedFields = sanitizeFieldsPayload(payload.maskedFields);
  if (!maskedFields) {
    return NextResponse.json(
      { error: "maskedFields must contain at least one valid translatable field (max 5000 chars/field, 12000 total)." },
      { status: 400 },
    );
  }

  const provider = process.env.TRANSLATION_PROVIDER;
  const deeplKey = process.env.DEEPL_API_KEY;

  if (!provider || !deeplKey) {
    return NextResponse.json(
      { error: "Translation provider is not configured." },
      { status: 503 },
    );
  }

  if (provider !== "deepl") {
    return NextResponse.json(
      { error: "Translation provider is not configured." },
      { status: 503 },
    );
  }

  // TODO: Add per-user rate limiting / auth checks in a future gate.

  const fieldKeys = Object.keys(maskedFields) as TranslatableAdFieldKey[];
  const textsToTranslate = fieldKeys.map((k) => wrapMaskPlaceholders(maskedFields[k]!));

  let translatedTexts: string[];
  try {
    translatedTexts = await translateWithDeepL(
      textsToTranslate,
      targetLocale as Locale,
      sourceLocale as ContentLocale,
      deeplKey,
    );
  } catch {
    return NextResponse.json(
      { error: "Translation service temporarily unavailable." },
      { status: 502 },
    );
  }

  const translated: TranslatableAdFields = {};
  for (let i = 0; i < fieldKeys.length; i++) {
    translated[fieldKeys[i]] = unwrapMaskPlaceholders(translatedTexts[i]);
  }

  const result: AdTranslationResult = {
    translated,
    sourceLocale: sourceLocale as ContentLocale,
    targetLocale: targetLocale as Locale,
    provider: "deepl",
    translatedAt: new Date().toISOString(),
    fromCache: false,
  };

  return NextResponse.json(result);
}
