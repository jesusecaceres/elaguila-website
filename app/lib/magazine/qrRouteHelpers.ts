import type { SupportedLang } from "@/app/lib/language";
import { replaceLangInHref } from "@/app/lib/language";
import { sourcePageKeyFromPath, translateSiteHref } from "@/app/lib/googleTranslateWebsite";

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
export function translatorGatewayHref(lang: SupportedLang): string {
  return `/qr/translator?lang=${lang}`;
}

/** Controlled gateway to Google Translate Website Mode for Leonix. */
export function leonixGoogleTranslateWebsiteUrl(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string; returnTo?: string },
): string {
  return translateSiteHref({
    lang,
    sourcePage: opts?.sourcePage ?? "magazine_read",
    sourceCta: opts?.sourceCta ?? "qr_google_translate",
    returnTo: opts?.returnTo,
  });
}

export function leonixGoogleTranslateWebsiteUrlFromPath(
  lang: SupportedLang,
  pathname: string,
  sourceCta: string,
): string {
  return translateSiteHref({
    lang,
    sourcePage: sourcePageKeyFromPath(pathname),
    sourceCta,
    returnTo: pathname.startsWith("/") ? pathname : `/${pathname}`,
  });
}

/** Preserve lang on internal Leonix hrefs. */
export function withRouteLang(href: string, lang: SupportedLang): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return replaceLangInHref(href, lang);
}

export function deviceStepsHash(platform: "iphone" | "android"): string {
  return platform === "iphone" ? "iphone-translation-steps" : "android-translation-steps";
}
