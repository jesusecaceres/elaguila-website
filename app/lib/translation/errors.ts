/** Typed errors for server-side translation providers (no raw upstream details). */

export class TranslationProviderNotConfiguredError extends Error {
  constructor(message = "Translation provider is not configured.") {
    super(message);
    this.name = "TranslationProviderNotConfiguredError";
  }
}

/** Selected provider exists but is not available in this release (e.g. Google in G2). */
export class TranslationProviderNotImplementedError extends Error {
  constructor(message = "Translation provider is not implemented yet.") {
    super(message);
    this.name = "TranslationProviderNotImplementedError";
  }
}

export class TranslationProviderUnsupportedError extends Error {
  constructor(message = "Translation provider is not supported.") {
    super(message);
    this.name = "TranslationProviderUnsupportedError";
  }
}

export class TranslationProviderRequestError extends Error {
  constructor(message = "Translation service temporarily unavailable.") {
    super(message);
    this.name = "TranslationProviderRequestError";
  }
}
