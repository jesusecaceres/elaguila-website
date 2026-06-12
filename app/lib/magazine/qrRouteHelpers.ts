import type { SupportedLang } from "@/app/lib/language";
import { replaceLangInHref } from "@/app/lib/language";
import { buildGoogleTranslateWebsitesModeUrl } from "@/app/lib/googleTranslateWebsite";

/** Build magazine print QR guide href with lang + optional tracking params. */
export function magazinePrintGuideHref(
  lang: SupportedLang,
  opts?: {
    hash?: string;
    sourcePage?: string;
    sourceCta?: string;
  },
): string {
  const params = new URLSearchParams({ lang, source: "print" });
  if (opts?.sourcePage) params.set("sourcePage", opts.sourcePage);
  if (opts?.sourceCta) params.set("sourceCta", opts.sourceCta);
  const base = `/magazine/2026/june/read?${params.toString()}`;
  return opts?.hash ? `${base}#${opts.hash}` : base;
}

/** Translator options gateway with lang preserved. */
export function translatorGatewayHref(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string },
): string {
  const params = new URLSearchParams({ lang });
  if (opts?.sourcePage) params.set("sourcePage", opts.sourcePage);
  if (opts?.sourceCta) params.set("sourceCta", opts.sourceCta);
  return `/qr/translator?${params.toString()}`;
}

/** Google Translate Websites mode URL for visible CTAs. */
export function leonixGoogleTranslateWebsiteUrl(
  lang: SupportedLang,
  _opts?: { sourcePage?: string; sourceCta?: string; returnTo?: string },
): string {
  return buildGoogleTranslateWebsitesModeUrl(lang);
}

export function leonixGoogleTranslateWebsiteUrlFromPath(
  lang: SupportedLang,
  _pathname: string,
  _sourceCta: string,
): string {
  return buildGoogleTranslateWebsitesModeUrl(lang);
}

/** Preserve lang on internal Leonix hrefs. */
export function withRouteLang(href: string, lang: SupportedLang): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return replaceLangInHref(href, lang);
}

export function deviceStepsHash(platform: "iphone" | "android"): string {
  return platform === "iphone" ? "iphone-translation-steps" : "android-translation-steps";
}
