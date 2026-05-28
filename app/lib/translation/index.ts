export {
  GOOGLE_CLOUD_TRANSLATION_PROVIDER_ID,
} from "@/app/lib/translation/types";

export type {
  AdTranslationPayload,
  AdTranslationResult,
  ContentLocale,
  Locale,
  MaskToken,
  TranslationProviderId,
  TranslationUiState,
  TranslatableAdFieldKey,
  TranslatableAdFields,
} from "@/app/lib/translation/types";

export type { TranslateAdProviderFn, TranslateAdRequest } from "@/app/lib/translation/provider";

export { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";

export {
  applyAnuncioTranslation,
  buildAnuncioTranslatableContent,
  shouldOfferAnuncioTranslateAd,
  type AnuncioListingTranslatable,
} from "@/app/lib/translation/anuncioTranslateAd";

export { useAnuncioListingTranslation } from "@/app/lib/translation/useAnuncioListingTranslation";

export {
  buildAdTranslationPayloadSlice,
  buildTranslateCacheKey,
  clearCachedAdTranslation,
  getCachedAdTranslation,
  getOppositeLocale,
  maskTranslatableFields,
  normalizeLocale,
  pickTranslatableAdFields,
  setCachedAdTranslation,
  shouldOfferTranslateAd,
  unmaskTranslatableFields,
} from "@/app/lib/translation/helpers";

export type { MaskedTranslatableFields, ShouldOfferTranslateAdInput, TranslateCacheKeyParts } from "@/app/lib/translation/helpers";

export { maskContactSensitiveText, restoreContactSensitiveText } from "@/app/lib/translation/contactMask";
