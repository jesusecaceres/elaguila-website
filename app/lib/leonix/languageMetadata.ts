/**
 * Leonix canonical language metadata for selectors, translation routing, and future engine work.
 * Single source of truth for Google target codes and active/held/future status.
 *
 * Add future languages here (and SupportedLang in language.ts) — do not scatter flags in UI components.
 */

import {
  HIDDEN_FUTURE_LANGUAGE_CODES,
  HELD_RTL_LANGUAGE_CODES,
  LANGUAGE_LABELS,
  LANGUAGE_REGISTRY,
  OFFICIAL_LAUNCH_LANGUAGES,
  PROVIDER_LANGUAGE_CODES,
  type HeldRtlLang,
  type HiddenFutureLang,
  type LanguageCode,
  type OfficialLaunchLang,
  type SupportedLang,
  getProviderLanguageCode,
} from "@/app/lib/language";

export type LeonixLanguageStatus = "production" | "held" | "future";

export type LanguageMeta = {
  /** Route / URL code (Leonix UI). */
  code: LanguageCode;
  /** Display label (often bilingual for community langs). */
  label: string;
  /** Native/endonym label for selectors. */
  nativeLabel: string;
  /** Google Cloud Translation + Website Mode target code. */
  googleTargetCode: string;
  /** Public selector + routable ?lang= */
  isActive: boolean;
  isRtl: boolean;
  /** Human-reviewed native copy registries exist for marketing/gateway surfaces. */
  isOfficialNativeCopyReady: boolean;
  /** Allowed for Cloud Translation / dynamic cache (not held RTL). */
  canUseMachineTranslation: boolean;
  sortOrder: number;
  status: LeonixLanguageStatus;
};

/**
 * Human-reviewed native copy on root, coming soon, header/footer, QR, translate helper, Media Kit shell.
 * Dynamic classifieds / applications still use machine cache even when true.
 */
const OFFICIAL_NATIVE_COPY_READY: Record<OfficialLaunchLang, boolean> = {
  es: true,
  en: true,
  pt: true,
  tl: true,
};

function productionMeta(code: OfficialLaunchLang, sortOrder: number): LanguageMeta {
  const def = LANGUAGE_REGISTRY[code];
  return {
    code,
    label: def.label,
    nativeLabel: def.nativeLabel,
    googleTargetCode: PROVIDER_LANGUAGE_CODES[code],
    isActive: true,
    isRtl: false,
    isOfficialNativeCopyReady: OFFICIAL_NATIVE_COPY_READY[code],
    canUseMachineTranslation: true,
    sortOrder,
    status: "production",
  };
}

function futureMeta(code: HiddenFutureLang, sortOrder: number): LanguageMeta {
  const def = LANGUAGE_REGISTRY[code];
  return {
    code,
    label: def.label,
    nativeLabel: def.nativeLabel,
    googleTargetCode: PROVIDER_LANGUAGE_CODES[code],
    isActive: false,
    isRtl: false,
    isOfficialNativeCopyReady: false,
    canUseMachineTranslation: true,
    sortOrder,
    status: "future",
  };
}

function heldRtlMeta(code: HeldRtlLang, sortOrder: number): LanguageMeta {
  const def = LANGUAGE_REGISTRY[code];
  return {
    code,
    label: def.label,
    nativeLabel: def.nativeLabel,
    googleTargetCode: def.providerCode ?? code,
    isActive: false,
    isRtl: true,
    isOfficialNativeCopyReady: false,
    canUseMachineTranslation: false,
    sortOrder,
    status: "held",
  };
}

const PRODUCTION_METADATA: Record<OfficialLaunchLang, LanguageMeta> = Object.fromEntries(
  OFFICIAL_LAUNCH_LANGUAGES.map((code, index) => [code, productionMeta(code, index + 1)]),
) as Record<OfficialLaunchLang, LanguageMeta>;

const FUTURE_METADATA: Record<HiddenFutureLang, LanguageMeta> = Object.fromEntries(
  HIDDEN_FUTURE_LANGUAGE_CODES.map((code, index) => [code, futureMeta(code, index + 20)]),
) as Record<HiddenFutureLang, LanguageMeta>;

const HELD_METADATA: Record<HeldRtlLang, LanguageMeta> = {
  ar: heldRtlMeta("ar", 100),
  fa: heldRtlMeta("fa", 101),
};

/** All known Leonix language metadata (production + future + held). */
export const LEONIX_LANGUAGE_METADATA: Readonly<Record<LanguageCode, LanguageMeta>> = {
  ...PRODUCTION_METADATA,
  ...FUTURE_METADATA,
  ...HELD_METADATA,
};

/** Alias for LEONIX_LANGUAGE_METADATA (architecture / audit searches). */
export { LEONIX_LANGUAGE_METADATA as LEONIX_LANGUAGES };

/** Active production languages for public selectors (official launch scope). */
export const LEONIX_ACTIVE_LANGUAGE_METADATA: readonly LanguageMeta[] = OFFICIAL_LAUNCH_LANGUAGES.map(
  (code) => PRODUCTION_METADATA[code],
);

/** Hidden future languages — preserved, not public until reviewer activation. */
export const LEONIX_FUTURE_LANGUAGE_METADATA: readonly LanguageMeta[] = HIDDEN_FUTURE_LANGUAGE_CODES.map(
  (code) => FUTURE_METADATA[code],
);

/** Held RTL languages — never expose in public selectors until RTL gate. */
export const LEONIX_HELD_LANGUAGE_METADATA: readonly LanguageMeta[] = HELD_RTL_LANGUAGE_CODES.map(
  (code) => HELD_METADATA[code],
);

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return LEONIX_LANGUAGE_METADATA[code];
}

export function getActiveLanguageMeta(code: OfficialLaunchLang): LanguageMeta {
  return PRODUCTION_METADATA[code];
}

/** Map Leonix route code to Google Cloud Translation / Website Mode target. */
export function mapRouteLangToGoogleTarget(code: SupportedLang | string): string {
  if (code in PROVIDER_LANGUAGE_CODES) {
    return getProviderLanguageCode(code as SupportedLang);
  }
  const normalized = code.trim().toLowerCase();
  if (normalized === "fil") return "fil";
  if (normalized === "zh-cn" || normalized === "zh-hans") return "zh-CN";
  if (normalized === "tl") return "fil";
  if (normalized === "zh") return "zh-CN";
  return "en";
}

/** Alias aligned with translate-ad localeCodes naming. */
export const mapLangToGoogleTranslateTarget = mapRouteLangToGoogleTarget;

export function isLanguageMetaActive(code: string): boolean {
  const meta = LEONIX_LANGUAGE_METADATA[code as LanguageCode];
  return meta?.isActive === true && meta.status === "production";
}

export function assertLeonixLanguageMetadataInvariants(): void {
  for (const code of OFFICIAL_LAUNCH_LANGUAGES) {
    const meta = PRODUCTION_METADATA[code];
    if (!meta.googleTargetCode) {
      throw new Error(`Missing googleTargetCode for active language ${code}`);
    }
    if (!meta.isActive || meta.status !== "production") {
      throw new Error(`Active language ${code} must be production + isActive`);
    }
    if (meta.isRtl || !meta.canUseMachineTranslation) {
      throw new Error(`Active language ${code} must be LTR + machine-translatable`);
    }
  }

  if (mapRouteLangToGoogleTarget("tl") !== "fil") {
    throw new Error("Tagalog route tl must map to Google target fil");
  }
  if (mapRouteLangToGoogleTarget("fil") !== "fil") {
    throw new Error("Filipino alias fil must map to Google target fil");
  }
  if (mapRouteLangToGoogleTarget("zh") !== "zh-CN") {
    throw new Error("Chinese route zh must map to Google target zh-CN");
  }
  if (mapRouteLangToGoogleTarget("zh-CN") !== "zh-CN") {
    throw new Error("Chinese alias zh-CN must map to Google target zh-CN");
  }

  for (const code of HIDDEN_FUTURE_LANGUAGE_CODES) {
    const meta = FUTURE_METADATA[code];
    if (meta.isActive || meta.status !== "future") {
      throw new Error(`Hidden future language ${code} must remain inactive`);
    }
  }

  for (const code of HELD_RTL_LANGUAGE_CODES) {
    const meta = HELD_METADATA[code];
    if (meta.isActive || meta.canUseMachineTranslation || meta.status !== "held") {
      throw new Error(`Held RTL language ${code} must remain inactive`);
    }
  }

  const activeCodes = new Set(OFFICIAL_LAUNCH_LANGUAGES);
  if (activeCodes.size !== 4) {
    throw new Error(`Expected 4 official launch languages, found ${activeCodes.size}`);
  }

  for (const code of ["ar", "fa"] as const) {
    if (activeCodes.has(code as OfficialLaunchLang)) {
      throw new Error(`${code} must not be in OFFICIAL_LAUNCH_LANGUAGES`);
    }
  }
}

assertLeonixLanguageMetadataInvariants();
