import type { AdTranslationResult, ContentLocale, Locale, TranslatableAdFields } from "@/app/lib/translation/types";

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

/**
 * Server-side implementation: `translateAdWithConfiguredProvider` in
 * `app/lib/translation/serverProvider.ts` (`import "server-only"`).
 * API route: `POST /api/translate-ad`. Do not import serverProvider from client code.
 */
