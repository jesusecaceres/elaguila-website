import "server-only";

export type TranslationProviderName = "google" | "deepl" | "disabled";

export type TranslationProviderConfig = {
  /** Resolved provider (disabled when env missing or explicitly disabled). */
  provider: TranslationProviderName;
  /** True when env is sufficient to call the selected provider. */
  isConfigured: boolean;
  /** True when the selected provider has a server implementation in this build. */
  isImplemented: boolean;
  /** Env var names still required (never includes secret values). */
  missingEnv: string[];
  /** Future Google Cloud project id (G3). */
  googleCloudProjectId: string | null;
  /** Future Google Translate location, e.g. global (G3). */
  googleTranslateLocation: string | null;
};

const SUPPORTED_PROVIDERS = new Set<TranslationProviderName>(["google", "deepl", "disabled"]);

function readProviderEnv(): string | null {
  const raw = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();
  return raw || null;
}

function isDeepLConfigured(): boolean {
  return Boolean(process.env.DEEPL_API_KEY?.trim());
}

function hasGoogleCredentialsEnv(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

function googleEnvMissing(): string[] {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID?.trim()) {
    missing.push("GOOGLE_CLOUD_PROJECT_ID");
  }
  if (!hasGoogleCredentialsEnv()) {
    missing.push("GOOGLE_APPLICATION_CREDENTIALS_JSON");
  }
  return missing;
}

/**
 * Reads server env and returns provider readiness (no secret values).
 * Strategic primary provider: Google (G3). DeepL is optional fallback only.
 */
export function getTranslationProviderConfig(): TranslationProviderConfig {
  const raw = readProviderEnv();
  const googleTranslateLocation =
    process.env.GOOGLE_TRANSLATE_LOCATION?.trim() || "global";
  const googleCloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID?.trim() || null;

  if (!raw) {
    return {
      provider: "disabled",
      isConfigured: false,
      isImplemented: false,
      missingEnv: ["TRANSLATION_PROVIDER"],
      googleCloudProjectId,
      googleTranslateLocation,
    };
  }

  if (raw === "disabled") {
    return {
      provider: "disabled",
      isConfigured: false,
      isImplemented: false,
      missingEnv: ["TRANSLATION_PROVIDER"],
      googleCloudProjectId,
      googleTranslateLocation,
    };
  }

  if (!SUPPORTED_PROVIDERS.has(raw as TranslationProviderName)) {
    return {
      provider: "disabled",
      isConfigured: false,
      isImplemented: false,
      missingEnv: ["TRANSLATION_PROVIDER"],
      googleCloudProjectId,
      googleTranslateLocation,
    };
  }

  if (raw === "google") {
    const missing = googleEnvMissing();
    return {
      provider: "google",
      isConfigured: missing.length === 0,
      isImplemented: true,
      missingEnv: missing,
      googleCloudProjectId,
      googleTranslateLocation,
    };
  }

  // deepl — optional / fallback; not the strategic primary provider.
  const deeplKeyMissing = !isDeepLConfigured();
  return {
    provider: "deepl",
    isConfigured: !deeplKeyMissing,
    isImplemented: true,
    missingEnv: deeplKeyMissing ? ["DEEPL_API_KEY"] : [],
    googleCloudProjectId,
    googleTranslateLocation,
  };
}

export function isUnsupportedProviderEnv(): boolean {
  const raw = readProviderEnv();
  if (!raw || raw === "disabled") return false;
  return !SUPPORTED_PROVIDERS.has(raw as TranslationProviderName);
}
