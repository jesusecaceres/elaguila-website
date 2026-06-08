import {
  normalizeLang,
  staticPageCopyLang,
  type SupportedLang,
} from "@/app/lib/language";

import {
  STATIC_COPY,
  STATIC_COPY_NAMESPACE_KEYS,
  type StaticCopyKey,
  type StaticCopyNamespace,
} from "./translationKeys";

/** Content languages with hand-authored static copy today. */
export type SupportedContentLang = SupportedLang;

type CopyLang = "es" | "en" | "vi";

function toCopyLang(lang: SupportedContentLang): CopyLang {
  return staticPageCopyLang(lang);
}

function resolveEntry(key: StaticCopyKey, lang: CopyLang): string | undefined {
  return STATIC_COPY[key]?.[lang];
}

/**
 * Fallback chain: selected lang → en → es.
 * Never throws; returns empty string if all missing (dev warns once).
 */
export function getStaticCopy(key: StaticCopyKey, lang: SupportedContentLang): string {
  const selected = toCopyLang(lang);
  const chain: CopyLang[] =
    selected === "es" ? ["es", "en"] : selected === "vi" ? ["vi", "en", "es"] : ["en", "es"];

  for (const step of chain) {
    const hit = resolveEntry(key, step);
    if (hit) {
      if (process.env.NODE_ENV === "development" && step !== selected) {
        console.warn(
          `[i18n] Static copy fallback for "${key}": requested ${selected}, using ${step}.`,
        );
      }
      return hit;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[i18n] Missing static copy for "${key}" (lang=${selected}).`);
  }
  return "";
}

export function getStaticCopyBundle(
  namespace: StaticCopyNamespace,
  lang: SupportedContentLang,
): Record<string, string> {
  const keys = STATIC_COPY_NAMESPACE_KEYS[namespace] ?? [];
  const out: Record<string, string> = {};
  for (const key of keys) {
    out[key] = getStaticCopy(key, lang);
  }
  return out;
}

export function isStaticCopyComplete(namespace: StaticCopyNamespace, lang: SupportedContentLang): boolean {
  const selected = toCopyLang(lang);
  const keys = STATIC_COPY_NAMESPACE_KEYS[namespace] ?? [];
  return keys.every((key) => Boolean(resolveEntry(key, selected)));
}

/** User-visible notice when showing fallback copy (null when complete). */
export function getFallbackNotice(
  lang: SupportedContentLang,
  namespace: StaticCopyNamespace,
): string | null {
  if (isStaticCopyComplete(namespace, lang)) return null;
  const copyLang = toCopyLang(lang);
  if (copyLang === "es") return null;
  if (copyLang === "en") return null;
  return copyLang === "vi"
    ? "Một số nhãn giao diện vẫn dùng tiếng Anh trong khi nội dung đọc có bản tiếng Việt."
    : "Some UI labels may use English fallback copy.";
}
