import { NextRequest, NextResponse } from "next/server";

import type {
  ContentLocale,
  Locale,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import {
  getTranslationProviderConfig,
  isTranslationProviderConfigured,
  isUnsupportedProviderEnv,
  translateAdWithConfiguredProvider,
  TranslationProviderNotConfiguredError,
  TranslationProviderNotImplementedError,
  TranslationProviderRequestError,
  TranslationProviderUnsupportedError,
} from "@/app/lib/translation/serverProvider";

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
const MAX_META_CHARS = 128;
const SAFE_META_RE = /^[a-zA-Z0-9._:/-]+$/;

/** Reject payloads that still contain contact data outside mask placeholders. */
const UNMASKED_EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const UNMASKED_URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|(?:wa\.me|api\.whatsapp\.com|maps\.google\.com|goo\.gl\/maps)[^\s]*/i;
const UNMASKED_PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b|\+\d{8,15}\b/;

function textWithoutMaskPlaceholders(text: string): string {
  return text.replace(/__LEONIX_MASK_\d+__/g, " ");
}

function containsUnmaskedSensitiveContent(text: string): boolean {
  const probe = textWithoutMaskPlaceholders(text);
  if (UNMASKED_EMAIL_RE.test(probe)) return true;
  if (UNMASKED_URL_RE.test(probe)) return true;
  const phoneMatch = probe.match(UNMASKED_PHONE_RE);
  if (phoneMatch?.some((m) => m.replace(/\D/g, "").length >= 7)) return true;
  return false;
}

function sanitizeMetaString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_META_CHARS) return null;
  if (!SAFE_META_RE.test(trimmed)) return null;
  return trimmed;
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

function parseTranslateAdRequest(body: unknown): TranslateAdRequest | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const payload = body as Record<string, unknown>;

  const targetLocale = payload.targetLocale;
  if (typeof targetLocale !== "string" || !VALID_TARGET_LOCALES.has(targetLocale)) return null;

  const sourceLocale = payload.sourceLocale;
  if (typeof sourceLocale !== "string" || !VALID_SOURCE_LOCALES.has(sourceLocale)) return null;

  const category = sanitizeMetaString(payload.category);
  if (!category) return null;

  const listingKey = sanitizeMetaString(payload.listingKey);
  if (!listingKey) return null;

  const maskedFields = sanitizeFieldsPayload(payload.maskedFields);
  if (!maskedFields) return null;

  return {
    maskedFields,
    category,
    listingKey,
    sourceLocale: sourceLocale as ContentLocale,
    targetLocale: targetLocale as Locale,
  };
}

function providerGateResponse(): NextResponse | null {
  if (isUnsupportedProviderEnv()) {
    return NextResponse.json({ error: "Translation provider is not supported." }, { status: 503 });
  }

  const config = getTranslationProviderConfig();

  if (config.provider === "disabled") {
    return NextResponse.json({ error: "Translation provider is not configured." }, { status: 503 });
  }

  if (config.provider === "google") {
    return NextResponse.json(
      { error: "Google Cloud Translation provider is not implemented yet." },
      { status: 501 },
    );
  }

  if (!isTranslationProviderConfigured()) {
    return NextResponse.json({ error: "Translation provider is not configured." }, { status: 503 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseTranslateAdRequest(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Invalid request. Required: maskedFields (non-empty), category, listingKey, sourceLocale (es|en|unknown), targetLocale (es|en).",
      },
      { status: 400 },
    );
  }

  for (const value of Object.values(parsed.maskedFields)) {
    if (typeof value === "string" && containsUnmaskedSensitiveContent(value)) {
      return NextResponse.json(
        { error: "maskedFields contain unmasked contact or URL data. Mask before translating." },
        { status: 400 },
      );
    }
  }

  const gate = providerGateResponse();
  if (gate) return gate;

  // TODO(T4+): per-user rate limiting and optional auth before calling external provider.
  // TODO(later): durable translation cache / translation_records table — no DB writes in G3.

  try {
    const result = await translateAdWithConfiguredProvider(parsed);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof TranslationProviderNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    if (e instanceof TranslationProviderNotImplementedError) {
      return NextResponse.json({ error: e.message }, { status: 501 });
    }
    if (e instanceof TranslationProviderUnsupportedError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    if (e instanceof TranslationProviderRequestError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Translation service temporarily unavailable." },
      { status: 502 },
    );
  }
}
