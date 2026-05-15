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
