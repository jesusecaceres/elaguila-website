import type { SupportedLang } from "@/app/lib/language";
import {
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  primaryMediaKitPdfHref,
} from "@/app/lib/magazine/qrBridge";

export { MAGAZINE_KIT_PDF_EN, MAGAZINE_KIT_PDF_ES, primaryMediaKitPdfHref };

export function mediaKitPageHref(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string },
): string {
  const params = new URLSearchParams({ lang });
  if (opts?.sourcePage) params.set("sourcePage", opts.sourcePage);
  if (opts?.sourceCta) params.set("sourceCta", opts.sourceCta);
  return `/media-kit?${params.toString()}`;
}

/** Media Kit CTA from magazine reader routes. */
export function magazineReadMediaKitHref(lang: SupportedLang): string {
  return mediaKitPageHref(lang, {
    sourcePage: "magazine_read",
    sourceCta: "media_kit",
  });
}

/** Contact CTA from magazine reader routes. */
export function magazineReadContactHref(lang: SupportedLang): string {
  return mediaKitAdvertisingContactHref(lang, {
    sourcePage: "magazine_read",
    sourceCta: "contact_leonix",
  });
}

export function mediaKitAdvertisingContactHref(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string },
): string {
  const params = new URLSearchParams({
    inquiryType: "advertising",
    lang,
    sourcePage: opts?.sourcePage ?? "media-kit",
    sourceCta: opts?.sourceCta ?? "media_kit_ad_info",
  });
  return `/contacto?${params.toString()}`;
}

export function mediaKitInterestContactHref(
  lang: SupportedLang,
  opts?: { sourcePage?: string; sourceCta?: string },
): string {
  const params = new URLSearchParams({
    inquiryType: "mediaKit",
    lang,
    sourcePage: opts?.sourcePage ?? "media-kit",
    sourceCta: opts?.sourceCta ?? "media_kit_interest",
  });
  return `/contacto?${params.toString()}`;
}
