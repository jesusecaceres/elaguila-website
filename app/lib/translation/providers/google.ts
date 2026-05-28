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
  unwrapMaskPlaceholdersFromGoogleHtml,
  wrapMaskPlaceholdersForGoogleHtml,
} from "@/app/lib/translation/providers/maskPlaceholders";

export const GOOGLE_PROVIDER_ID = "google";

const TRANSLATE_SCOPE = "https://www.googleapis.com/auth/cloud-translation";

/** Active Translate Ad locales (G3). G6 TODO: zh, fil/tl, vi, ko, hi, fa, ar, hy, ru, pt, pa, ja */
const ACTIVE_LOCALE_CODES: ReadonlySet<string> = new Set(["es", "en"]);

type GoogleAuthLike = {
  getClient: () => Promise<{ getAccessToken: () => Promise<{ token?: string | null }> }>;
};

let cachedAuth: GoogleAuthLike | null = null;

function readGoogleProjectId(): string | null {
  const id = process.env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  return id || null;
}

function readGoogleLocation(): string {
  return process.env.GOOGLE_TRANSLATE_LOCATION?.trim() || "global";
}

function hasGoogleCredentialsEnv(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

function parseServiceAccountJson(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapLocaleToGoogle(locale: Locale): string {
  return locale === "en" ? "en" : "es";
}

function assertActiveTargetLocale(locale: Locale): void {
  if (!ACTIVE_LOCALE_CODES.has(locale)) {
    throw new TranslationProviderRequestError();
  }
}

async function getGoogleAccessToken(): Promise<string> {
  if (!readGoogleProjectId() || !hasGoogleCredentialsEnv()) {
    throw new TranslationProviderNotConfiguredError();
  }

  const credentials = parseServiceAccountJson();
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() && !credentials) {
    throw new TranslationProviderNotConfiguredError();
  }

  if (!cachedAuth) {
    const { google } = await import("googleapis");
    cachedAuth = new google.auth.GoogleAuth({
      ...(credentials ? { credentials } : {}),
      scopes: [TRANSLATE_SCOPE],
    }) as GoogleAuthLike;
  }

  const client = await cachedAuth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  if (!token) {
    throw new TranslationProviderNotConfiguredError();
  }
  return token;
}

async function callGoogleTranslateAdvanced(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: ContentLocale,
): Promise<string[]> {
  const projectId = readGoogleProjectId();
  if (!projectId) {
    throw new TranslationProviderNotConfiguredError();
  }

  assertActiveTargetLocale(targetLocale);
  if (sourceLocale !== "unknown") {
    assertActiveTargetLocale(sourceLocale as Locale);
  }

  const location = readGoogleLocation();
  const url = `https://translation.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}:translateText`;

  const requestBody: {
    contents: string[];
    targetLanguageCode: string;
    sourceLanguageCode?: string;
    mimeType: string;
  } = {
    contents: texts,
    targetLanguageCode: mapLocaleToGoogle(targetLocale),
    mimeType: "text/html",
  };

  if (sourceLocale !== "unknown") {
    requestBody.sourceLanguageCode = mapLocaleToGoogle(sourceLocale as Locale);
  }

  const token = await getGoogleAccessToken();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new TranslationProviderRequestError();
  }

  if (!res.ok) {
    throw new TranslationProviderRequestError();
  }

  let json: { translations?: Array<{ translatedText?: string | null }> };
  try {
    json = (await res.json()) as { translations?: Array<{ translatedText?: string | null }> };
  } catch {
    throw new TranslationProviderRequestError();
  }

  const rows = json.translations;
  if (!Array.isArray(rows) || rows.length !== texts.length) {
    throw new TranslationProviderRequestError();
  }

  return rows.map((row) => {
    const text = row?.translatedText;
    if (typeof text !== "string") {
      throw new TranslationProviderRequestError();
    }
    return text;
  });
}

/**
 * Primary provider — Google Cloud Translation API (Advanced, v3 REST).
 *
 * Server-only env:
 * - TRANSLATION_PROVIDER=google
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_TRANSLATE_LOCATION=global (default)
 * - GOOGLE_APPLICATION_CREDENTIALS_JSON (Vercel) or GOOGLE_APPLICATION_CREDENTIALS (local file path)
 *
 * G6 TODO: extend ACTIVE_LOCALE_CODES after dictionary + UX gates.
 * G4 TODO: durable cache / translation_records lookup before provider call.
 * G3+ TODO: glossary / protected terms for business names.
 */
export async function translateAdWithGoogle(req: TranslateAdRequest): Promise<AdTranslationResult> {
  if (!readGoogleProjectId() || !hasGoogleCredentialsEnv()) {
    throw new TranslationProviderNotConfiguredError();
  }

  const maskedFields = req.maskedFields;
  const fieldKeys = Object.keys(maskedFields) as TranslatableAdFieldKey[];
  if (fieldKeys.length === 0) {
    throw new TranslationProviderRequestError("No translatable fields.");
  }

  const textsToTranslate = fieldKeys.map((k) =>
    wrapMaskPlaceholdersForGoogleHtml(maskedFields[k]!),
  );

  let translatedTexts: string[];
  try {
    translatedTexts = await callGoogleTranslateAdvanced(
      textsToTranslate,
      req.targetLocale,
      req.sourceLocale,
    );
  } catch (e) {
    if (e instanceof TranslationProviderNotConfiguredError) throw e;
    if (e instanceof TranslationProviderRequestError) throw e;
    throw new TranslationProviderRequestError();
  }

  const translated: TranslatableAdFields = {};
  for (let i = 0; i < fieldKeys.length; i++) {
    translated[fieldKeys[i]] = unwrapMaskPlaceholdersFromGoogleHtml(translatedTexts[i]);
  }

  return {
    translated,
    sourceLocale: req.sourceLocale,
    targetLocale: req.targetLocale,
    provider: GOOGLE_PROVIDER_ID,
    translatedAt: new Date().toISOString(),
    fromCache: false,
  };
}
