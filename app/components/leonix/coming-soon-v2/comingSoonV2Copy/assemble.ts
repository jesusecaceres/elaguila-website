import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "./types";
import {
  magazineJune2026ReaderHref,
  primaryMediaKitPdfHref,
} from "@/app/lib/magazine/qrBridge";

type HeroCtaVariant = "primary" | "secondary" | "green";

function contactPath(lang: SupportedLang): "/contacto" | "/contact" {
  return lang === "en" ? "/contact" : "/contacto";
}

function buildContactHref(
  lang: SupportedLang,
  params: { inquiryType: string; sourceCta: string; sourcePage?: string },
): string {
  const search = new URLSearchParams({
    inquiryType: params.inquiryType,
    sourceCta: params.sourceCta,
    sourcePage: params.sourcePage ?? "coming-soon-v2",
    lang,
  });
  return `${contactPath(lang)}?${search.toString()}`;
}

function buildNewsletterHref(lang: SupportedLang): string {
  const search = new URLSearchParams({
    source: "coming-soon-v2",
    inquiryType: "launch",
    sourceCta: "join_launch",
    lang,
  });
  return `/newsletter?${search.toString()}`;
}

/** Wire internal hrefs to the active route language. */
export function localizeComingSoonV2Copy(
  lang: SupportedLang,
  copy: Omit<
    ComingSoonV2Copy,
    "hero" | "marketplace" | "mediaKitPreview" | "digitalMagazine" | "finalCta"
  > & {
    hero: Omit<ComingSoonV2Copy["hero"], "ctas"> & {
      ctas: [
        { label: string; variant: HeroCtaVariant },
        { label: string; variant: HeroCtaVariant },
        { label: string; variant: HeroCtaVariant },
      ];
    };
    marketplace: Omit<ComingSoonV2Copy["marketplace"], "exploreCta"> & {
      exploreCta: { label: string };
    };
    mediaKitPreview: Omit<
      ComingSoonV2Copy["mediaKitPreview"],
      "viewCta" | "downloadCta" | "requestInfoCta"
    > & {
      viewCta: { label: string };
      downloadCta: { label: string };
      requestInfoCta: { label: string };
    };
    digitalMagazine: Omit<
      ComingSoonV2Copy["digitalMagazine"],
      "readHighlightsCta" | "openOriginalCta" | "learnQrCta"
    > & {
      readHighlightsCta: { label: string };
      openOriginalCta: { label: string };
      learnQrCta: { label: string };
    };
    finalCta: Omit<ComingSoonV2Copy["finalCta"], "ctas" | "mediaKitDownload"> & {
      ctas: [
        { label: string; variant: HeroCtaVariant },
        { label: string; variant: HeroCtaVariant; external?: boolean },
        { label: string; variant: HeroCtaVariant },
      ];
      mediaKitDownload: { label: string };
    };
  },
): ComingSoonV2Copy {
  const pdf = primaryMediaKitPdfHref(lang);
  const advertiseHref = buildContactHref(lang, {
    inquiryType: "advertising",
    sourceCta: "advertise",
  });
  const mediaKitInterestHref = buildContactHref(lang, {
    inquiryType: "mediaKit",
    sourceCta: "media_kit_interest",
  });
  const newsletterHref = buildNewsletterHref(lang);
  const magazineReader = magazineJune2026ReaderHref(lang);
  const magazineOriginal = magazineJune2026ReaderHref(lang, { hash: "original-edition" });

  return {
    ...copy,
    hero: {
      ...copy.hero,
      ctas: [
        { label: copy.hero.ctas[0].label, href: advertiseHref, variant: copy.hero.ctas[0].variant },
        { label: copy.hero.ctas[1].label, href: pdf, variant: copy.hero.ctas[1].variant, external: true },
        { label: copy.hero.ctas[2].label, href: newsletterHref, variant: copy.hero.ctas[2].variant },
      ],
    },
    marketplace: {
      ...copy.marketplace,
      exploreCta: {
        label: copy.marketplace.exploreCta.label,
        href: `/clasificados?lang=${lang}`,
      },
    },
    mediaKitPreview: {
      ...copy.mediaKitPreview,
      viewCta: { label: copy.mediaKitPreview.viewCta.label, href: pdf },
      downloadCta: { label: copy.mediaKitPreview.downloadCta.label, href: pdf },
      requestInfoCta: {
        label: copy.mediaKitPreview.requestInfoCta.label,
        href: mediaKitInterestHref,
      },
    },
    digitalMagazine: {
      ...copy.digitalMagazine,
      readHighlightsCta: {
        label: copy.digitalMagazine.readHighlightsCta.label,
        href: magazineReader,
      },
      openOriginalCta: {
        label: copy.digitalMagazine.openOriginalCta.label,
        href: magazineOriginal,
      },
      learnQrCta: {
        label: copy.digitalMagazine.learnQrCta.label,
        href: "#qr",
      },
    },
    finalCta: {
      ...copy.finalCta,
      ctas: [
        { label: copy.finalCta.ctas[0].label, href: advertiseHref, variant: copy.finalCta.ctas[0].variant },
        {
          label: copy.finalCta.ctas[1].label,
          href: pdf,
          variant: copy.finalCta.ctas[1].variant,
          external: true,
        },
        { label: copy.finalCta.ctas[2].label, href: newsletterHref, variant: copy.finalCta.ctas[2].variant },
      ],
      mediaKitDownload: { label: copy.finalCta.mediaKitDownload.label, href: pdf },
    },
  };
}
