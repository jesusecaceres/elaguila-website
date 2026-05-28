import type { AdTranslationResult, ContentLocale, Locale, TranslatableAdFieldKey, TranslatableAdFields } from "@/app/lib/translation/types";
import { GOOGLE_CLOUD_TRANSLATION_PROVIDER_ID } from "@/app/lib/translation/types";
import {
  TranslationProviderNotConfiguredError,
  TranslationProviderRequestError,
  TranslationProviderUnsupportedError,
} from "@/app/lib/translation/errors";
import {
  unwrapMaskPlaceholdersFromGoogleHtml,
  wrapMaskPlaceholdersForGoogleHtml,
} from "@/app/lib/translation/providers/maskPlaceholders";

/**
 * Typed hook for a future server-backed translator (Gate 3B+).
 * No default implementation — callers supply optional `requestTranslation` on the client control.
 */
export type TranslateAdRequest = {
  /** Already masked via {@link maskTranslatableFields}; do not send raw contact fields. */
  maskedFields: TranslatableAdFields;
  category: string;
  listingKey: string;
  sourceLocale: ContentLocale;
  targetLocale: Locale;
};

export type TranslateAdProviderFn = (req: TranslateAdRequest) => Promise<AdTranslationResult>;

export {
  TranslationProviderNotConfiguredError,
  TranslationProviderNotImplementedError,
  TranslationProviderRequestError,
  TranslationProviderUnsupportedError,
} from "@/app/lib/translation/errors";

/**
 * Server-side Translate Ad provider (T3G).
 * Import server functions only from `app/api/translate-ad/route.ts` — never from client code.
 */

const TRANSLATE_SCOPE = "https://www.googleapis.com/auth/cloud-translation";

/** Active locales (T3G). G6 TODO: zh, fil/tl, vi, ko, hi, fa, ar, hy, ru, pt, pa, ja */
const ACTIVE_LOCALE_CODES: ReadonlySet<string> = new Set(["es", "en"]);

type GoogleAuthLike = {
  getClient: () => Promise<{ getAccessToken: () => Promise<{ token?: string | null }> }>;
};

let cachedAuth: GoogleAuthLike | null = null;

function readProviderEnv(): string | null {
  const raw = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  return raw || null;
}

function readGoogleProjectId(): string | null {
  const id = process.env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  return id || null;
}

function readGoogleLocation(): string {
  return process.env.GOOGLE_TRANSLATE_LOCATION?.trim() || "global";
}

function readGoogleGlossaryId(): string | null {
  const id = process.env.GOOGLE_TRANSLATE_GLOSSARY_ID?.trim();
  return id || null;
}

function hasGoogleCredentialsEnv(): boolean {
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  return Boolean(creds || credsJson);
}

function parseServiceAccountCredentials(): Record<string, unknown> | null {
  const inlineJson =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
    (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()?.startsWith("{")
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS.trim()
      : null);

  if (!inlineJson) return null;

  try {
    const parsed = JSON.parse(inlineJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapLocaleToGoogle(locale: Locale): string {
  return locale === "en" ? "en" : "es";
}

function assertActiveLocale(locale: Locale): void {
  if (!ACTIVE_LOCALE_CODES.has(locale)) {
    throw new TranslationProviderRequestError();
  }
}

/** DeepL is disabled by default in T3G — only Google is the active provider. */
export function isUnsupportedProviderEnv(): boolean {
  const raw = readProviderEnv();
  if (!raw) return false;
  if (raw === "google") return false;
  return true;
}

export function isTranslationProviderConfigured(): boolean {
  if (isUnsupportedProviderEnv()) return false;
  if (readProviderEnv() !== "google") return false;
  if (!readGoogleProjectId()) return false;
  if (!hasGoogleCredentialsEnv()) return false;

  const inlineCreds = parseServiceAccountCredentials();
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (filePath?.startsWith("{") && !inlineCreds) return false;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() && !inlineCreds) return false;

  return true;
}

async function getGoogleAccessToken(): Promise<string> {
  if (!isTranslationProviderConfigured()) {
    throw new TranslationProviderNotConfiguredError();
  }

  const credentials = parseServiceAccountCredentials();
  const credFile = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const usesInlineJson =
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()) ||
    Boolean(credFile?.startsWith("{"));

  if (usesInlineJson && !credentials) {
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

async function callGoogleCloudTranslationAdvanced(
  texts: string[],
  targetLocale: Locale,
  sourceLocale: ContentLocale,
): Promise<string[]> {
  const projectId = readGoogleProjectId();
  if (!projectId) {
    throw new TranslationProviderNotConfiguredError();
  }

  assertActiveLocale(targetLocale);
  if (sourceLocale !== "unknown") {
    assertActiveLocale(sourceLocale as Locale);
  }

  const location = readGoogleLocation();
  const url = `https://translation.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}:translateText`;

  const requestBody: {
    contents: string[];
    targetLanguageCode: string;
    sourceLanguageCode?: string;
    mimeType: string;
    glossaryConfig?: { glossary: string };
  } = {
    contents: texts,
    targetLanguageCode: mapLocaleToGoogle(targetLocale),
    mimeType: "text/html",
  };

  if (sourceLocale !== "unknown") {
    requestBody.sourceLanguageCode = mapLocaleToGoogle(sourceLocale as Locale);
  }

  const glossaryId = readGoogleGlossaryId();
  if (glossaryId) {
    requestBody.glossaryConfig = {
      glossary: `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
    };
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

/** Primary server entry — Google Cloud Translation Advanced (T3G). */
export async function translateAdWithConfiguredProvider(
  req: TranslateAdRequest,
): Promise<AdTranslationResult> {
  if (isUnsupportedProviderEnv()) {
    throw new TranslationProviderUnsupportedError();
  }

  if (!isTranslationProviderConfigured()) {
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
    translatedTexts = await callGoogleCloudTranslationAdvanced(
      textsToTranslate,
      req.targetLocale,
      req.sourceLocale,
    );
  } catch (e) {
    if (e instanceof TranslationProviderNotConfiguredError) throw e;
    if (e instanceof TranslationProviderUnsupportedError) throw e;
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
    provider: GOOGLE_CLOUD_TRANSLATION_PROVIDER_ID,
    translatedAt: new Date().toISOString(),
    fromCache: false,
  };
}

/** @deprecated Prefer {@link translateAdWithConfiguredProvider}. */
export const translateMaskedAdFields = translateAdWithConfiguredProvider;
