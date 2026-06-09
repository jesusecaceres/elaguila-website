import type { SupportedLang } from "@/app/lib/language";
import {
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  primaryMediaKitPdfHref,
} from "@/app/lib/magazine/qrBridge";

export { MAGAZINE_KIT_PDF_EN, MAGAZINE_KIT_PDF_ES, primaryMediaKitPdfHref };

export function mediaKitPageHref(lang: SupportedLang): string {
  return `/media-kit?lang=${lang}`;
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
