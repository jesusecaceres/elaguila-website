/**
 * @deprecated Import from `@/app/lib/translation/providers` or keep this facade for API routes.
 * G2: provider-specific logic lives under `app/lib/translation/providers/`.
 */
export {
  getTranslationProviderConfig,
  isTranslationProviderConfigured,
  isUnsupportedProviderEnv,
  translateAdWithConfiguredProvider,
  translateMaskedAdFields,
  TranslationProviderNotConfiguredError,
  TranslationProviderNotImplementedError,
  TranslationProviderUnsupportedError,
  TranslationProviderRequestError,
} from "@/app/lib/translation/providers";

export type { TranslationProviderConfig, TranslationProviderName } from "@/app/lib/translation/config";

export {
  isServerTranslationStorageAvailable,
  SERVER_TRANSLATION_CACHE_VERSION,
} from "@/app/lib/translation/serverCache";

/** @deprecated Use provider id from translation result (`deepl` | `google`). */
export const TRANSLATION_PROVIDER_ID = "deepl";
