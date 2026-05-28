import "server-only";

import type { AdTranslationResult } from "@/app/lib/translation/types";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import {
  getTranslationProviderConfig,
  isUnsupportedProviderEnv,
} from "@/app/lib/translation/config";
import {
  TranslationProviderNotConfiguredError,
  TranslationProviderUnsupportedError,
} from "@/app/lib/translation/errors";
import { translateAdWithDeepL } from "@/app/lib/translation/providers/deepl";
import { translateAdWithGoogle } from "@/app/lib/translation/providers/google";

export {
  TranslationProviderNotConfiguredError,
  TranslationProviderNotImplementedError,
  TranslationProviderUnsupportedError,
  TranslationProviderRequestError,
} from "@/app/lib/translation/errors";

export {
  getTranslationProviderConfig,
  isUnsupportedProviderEnv,
} from "@/app/lib/translation/config";
export type { TranslationProviderConfig, TranslationProviderName } from "@/app/lib/translation/config";

/**
 * Server-only entry: resolves configured provider and delegates translation.
 * API route should validate payloads before calling this function.
 */
export async function translateAdWithConfiguredProvider(
  req: TranslateAdRequest,
): Promise<AdTranslationResult> {
  if (isUnsupportedProviderEnv()) {
    throw new TranslationProviderUnsupportedError();
  }

  const config = getTranslationProviderConfig();

  if (config.provider === "disabled") {
    throw new TranslationProviderNotConfiguredError();
  }

  if (config.provider === "google") {
    if (!config.isConfigured || !config.isImplemented) {
      throw new TranslationProviderNotConfiguredError();
    }
    return translateAdWithGoogle(req);
  }

  if (config.provider === "deepl") {
    if (!config.isConfigured) {
      throw new TranslationProviderNotConfiguredError();
    }
    return translateAdWithDeepL(req);
  }

  throw new TranslationProviderUnsupportedError();
}

/** True when the active provider can perform a translation in this build. */
export function isTranslationProviderConfigured(): boolean {
  if (isUnsupportedProviderEnv()) return false;

  const config = getTranslationProviderConfig();
  if (config.provider === "disabled") return false;
  if (config.provider === "google") return config.isConfigured && config.isImplemented;
  if (config.provider === "deepl") return config.isConfigured && config.isImplemented;
  return false;
}

/** @deprecated Prefer {@link translateAdWithConfiguredProvider}. */
export const translateMaskedAdFields = translateAdWithConfiguredProvider;
