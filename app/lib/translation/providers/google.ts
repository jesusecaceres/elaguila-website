import "server-only";

import type { AdTranslationResult } from "@/app/lib/translation/types";
import type { TranslateAdRequest } from "@/app/lib/translation/provider";
import { TranslationProviderNotImplementedError } from "@/app/lib/translation/errors";

export const GOOGLE_PROVIDER_ID = "google";

/**
 * Future primary provider — Google Cloud Translation API (Advanced).
 *
 * Expected env (server-only, G3):
 * - TRANSLATION_PROVIDER=google
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_TRANSLATE_LOCATION=global (default)
 * - GOOGLE_APPLICATION_CREDENTIALS (local) or Vercel GCP integration / workload identity
 *
 * G3 TODO:
 * - Call Cloud Translation Advanced (v3) translateText
 * - Verify BCP-47 / supported language codes per locale
 * - Glossary / protected terms for business names and mask placeholders
 * - Document translation path (magazine PDF) — separate async gate
 * - Cost guards and batching
 */

export async function translateAdWithGoogle(_req: TranslateAdRequest): Promise<AdTranslationResult> {
  void _req;
  throw new TranslationProviderNotImplementedError(
    "Google Cloud Translation provider is not implemented yet.",
  );
}
