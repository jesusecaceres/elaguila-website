/**
 * Gate 3A / SQL2E: shared types for optional “Translate ad” UX.
 */

import type {
  TranslateAdSourceLocale,
  TranslateAdTargetLocale,
} from "@/app/lib/translation/localeCodes";

export type Locale = TranslateAdTargetLocale;
export type ContentLocale = TranslateAdSourceLocale;

/** Stored bilingual listing fields use es/en keys only (not expanded Translate Ad targets). */
export type BilingualFieldLocale = "es" | "en";

export function toBilingualFieldLocale(locale: Locale): BilingualFieldLocale {
  return locale === "en" ? "en" : "es";
}

export type TranslationUiState = "idle" | "loading" | "translated" | "error" | "original";

/** Fields that may be sent to a translation provider after masking / filtering. */
export type AdTranslationPayload = {
  title?: string;
  description?: string;
  serviceLabel?: string;
  customServiceText?: string;
  /** Freeform detail lines or prose — still scrubbed for contact data */
  details?: string;
  highlights?: string;
  body?: string;
  shareText?: string;
  category?: string;
  listingKey?: string;
  sourceLocale?: ContentLocale;
  targetLocale?: Locale;
};

/** Subset of payload keys that hold user-authored prose we may translate. */
export type TranslatableAdFieldKey = keyof Pick<
  AdTranslationPayload,
  | "title"
  | "description"
  | "serviceLabel"
  | "customServiceText"
  | "details"
  | "highlights"
  | "body"
  | "shareText"
>;

export type TranslatableAdFields = Partial<Record<TranslatableAdFieldKey, string>>;

/** Primary Translate Ad provider id (T3G). */
export const GOOGLE_CLOUD_TRANSLATION_PROVIDER_ID = "google-cloud-translation" as const;

export type TranslationProviderId = typeof GOOGLE_CLOUD_TRANSLATION_PROVIDER_ID | string;

export type AdTranslationResult = {
  translated: TranslatableAdFields;
  sourceLocale: ContentLocale;
  targetLocale: Locale;
  provider: TranslationProviderId;
  translatedAt: string;
  fromCache?: boolean;
};

export type MaskToken = { placeholder: string; value: string };
