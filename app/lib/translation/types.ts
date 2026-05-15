/**
 * Gate 3A: shared types for optional “Translate ad” UX (no DB, no production provider yet).
 */

export type Locale = "es" | "en";

/** Language of the listing body when known; otherwise pilot/heuristic may supply `unknown`. */
export type ContentLocale = Locale | "unknown";

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

export type TranslationProviderId = string;

export type AdTranslationResult = {
  translated: TranslatableAdFields;
  sourceLocale: ContentLocale;
  targetLocale: Locale;
  provider: TranslationProviderId;
  translatedAt: string;
  fromCache?: boolean;
};

export type MaskToken = { placeholder: string; value: string };
