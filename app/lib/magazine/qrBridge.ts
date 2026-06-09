import type { SupportedLang } from "@/app/lib/language";

/** Official Leonix logo — transparent PNG. */
export const LEONIX_LOGO_CLEAN_PATH = "/logo-clean.png";

/** Public QR scan target for June 2026 print materials. */
export const MAGAZINE_JUNE_2026_QR_TARGET_URL =
  "https://leonixmedia.com/magazine/2026/june/read?source=print";

export const MAGAZINE_JUNE_2026_QR_IMAGE_PATH = "/qr/leonix-june-2026-magazine-qr.png";

export const MAGAZINE_KIT_PDF_ES = "/media-kit/leonix-media-kit-es.pdf";
export const MAGAZINE_KIT_PDF_EN = "/media-kit/leonix-media-kit-en.pdf";

export function isMagazinePrintSource(source: string | null | undefined): boolean {
  return source === "print";
}

/** Reader bridge route; preserves lang and optional print source. */
export function magazineJune2026ReaderHref(
  lang: SupportedLang,
  opts?: { source?: "print"; hash?: string },
): string {
  const params = new URLSearchParams({ lang });
  if (opts?.source === "print") params.set("source", "print");
  const base = `/magazine/2026/june/read?${params.toString()}`;
  return opts?.hash ? `${base}#${opts.hash}` : base;
}

export function magazineHubHref(lang: SupportedLang): string {
  return `/magazine?lang=${lang}`;
}

/** Primary media kit PDF for lang; community langs default to Spanish original. */
export function primaryMediaKitPdfHref(lang: SupportedLang): string {
  if (lang === "en") return MAGAZINE_KIT_PDF_EN;
  return MAGAZINE_KIT_PDF_ES;
}

export function showDualMediaKitPdfButtons(lang: SupportedLang): boolean {
  return lang !== "es" && lang !== "en";
}
