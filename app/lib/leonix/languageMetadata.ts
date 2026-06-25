/**
 * Leonix canonical language metadata for selectors, translation routing, and future engine work.
 * Single source of truth for Google target codes and active/held/future status.
 *
 * Add future languages here (and SupportedLang in language.ts) — do not scatter flags in UI components.
 */

import {
  ACTIVE_PUBLIC_LANGS,
  HELD_RTL_LANGUAGE_CODES,
  LANGUAGE_LABELS,
  LANGUAGE_REGISTRY,
  PROVIDER_LANGUAGE_CODES,
  type HeldRtlLang,
  type LanguageCode,
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
const OFFICIAL_NATIVE_COPY_READY: Record<SupportedLang, boolean> = {
  es: true,
  en: true,
  vi: true,
  pt: true,
  tl: true,
  km: true,
  zh: true,
  ja: true,
  ko: true,
  hi: true,
  hy: true,
  ru: true,
  pa: true,
};

function productionMeta(code: SupportedLang, sortOrder: number): LanguageMeta {
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

const PRODUCTION_METADATA: Record<SupportedLang, LanguageMeta> = Object.fromEntries(
  ACTIVE_PUBLIC_LANGS.map((code, index) => [code, productionMeta(code, index + 1)]),
) as Record<SupportedLang, LanguageMeta>;

const HELD_METADATA: Record<HeldRtlLang, LanguageMeta> = {
  ar: heldRtlMeta("ar", 100),
  fa: heldRtlMeta("fa", 101),
};

/** All known Leonix language metadata (production + held). Future langs add with status "future". */
export const LEONIX_LANGUAGE_METADATA: Readonly<Record<LanguageCode, LanguageMeta>> = {
  ...PRODUCTION_METADATA,
  ...HELD_METADATA,
};

/** Alias for LEONIX_LANGUAGE_METADATA (architecture / audit searches). */
export { LEONIX_LANGUAGE_METADATA as LEONIX_LANGUAGES };

/** Active production languages for public selectors (excludes ar/fa). */
export const LEONIX_ACTIVE_LANGUAGE_METADATA: readonly LanguageMeta[] = ACTIVE_PUBLIC_LANGS.map(
  (code) => PRODUCTION_METADATA[code],
);

/** Held RTL languages — never expose in public selectors until RTL gate. */
export const LEONIX_HELD_LANGUAGE_METADATA: readonly LanguageMeta[] = HELD_RTL_LANGUAGE_CODES.map(
  (code) => HELD_METADATA[code],
);

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return LEONIX_LANGUAGE_METADATA[code];
}

export function getActiveLanguageMeta(code: SupportedLang): LanguageMeta {
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
  for (const code of ACTIVE_PUBLIC_LANGS) {
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
  if (mapRouteLangToGoogleTarget("zh") !== "zh-CN") {
    throw new Error("Chinese route zh must map to Google target zh-CN");
  }

  for (const code of HELD_RTL_LANGUAGE_CODES) {
    const meta = HELD_METADATA[code];
    if (meta.isActive || meta.canUseMachineTranslation || meta.status !== "held") {
      throw new Error(`Held RTL language ${code} must remain inactive`);
    }
  }

  const activeCodes = new Set(ACTIVE_PUBLIC_LANGS);
  if (activeCodes.size !== 13) {
    throw new Error(`Expected 13 active public languages, found ${activeCodes.size}`);
  }

  for (const code of ["ar", "fa"] as const) {
    if (activeCodes.has(code as SupportedLang)) {
      throw new Error(`${code} must not be in ACTIVE_PUBLIC_LANGS`);
    }
  }
}

assertLeonixLanguageMetadataInvariants();
