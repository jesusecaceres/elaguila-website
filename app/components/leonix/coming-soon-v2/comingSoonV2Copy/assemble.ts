import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "./types";

type HeroCtaVariant = "primary" | "secondary" | "green";

const MEDIA_KIT_PDF_ES = "/media-kit/leonix-media-kit-es.pdf";
const MEDIA_KIT_PDF_EN = "/media-kit/leonix-media-kit-en.pdf";

function mediaKitPdfForLang(lang: SupportedLang): string {
  if (lang === "es") return MEDIA_KIT_PDF_ES;
  if (lang === "en") return MEDIA_KIT_PDF_EN;
  return MEDIA_KIT_PDF_ES;
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
  const pdf = mediaKitPdfForLang(lang);
  const contactHref = `/contacto?inquiryType=advertising&sourceCta=advertise&lang=${lang}`;
  const newsletterHref = `/newsletter?source=coming-soon-v2&inquiryType=launch&lang=${lang}`;
  const magazineLanding = `/magazine?lang=${lang}`;
  const magazineRead = `/magazine/2026/june/read?lang=${lang}`;

  return {
    ...copy,
    hero: {
      ...copy.hero,
      ctas: [
        { label: copy.hero.ctas[0].label, href: contactHref, variant: copy.hero.ctas[0].variant },
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
        href: `/contacto?inquiryType=advertising&sourceCta=media-kit-request&lang=${lang}`,
      },
    },
    digitalMagazine: {
      ...copy.digitalMagazine,
      readHighlightsCta: {
        label: copy.digitalMagazine.readHighlightsCta.label,
        href: magazineLanding,
      },
      openOriginalCta: {
        label: copy.digitalMagazine.openOriginalCta.label,
        href: magazineRead,
      },
      learnQrCta: {
        label: copy.digitalMagazine.learnQrCta.label,
        href: "#qr",
      },
    },
    finalCta: {
      ...copy.finalCta,
      ctas: [
        { label: copy.finalCta.ctas[0].label, href: contactHref, variant: copy.finalCta.ctas[0].variant },
        {
          label: copy.finalCta.ctas[1].label,
          href: pdf,
          variant: copy.finalCta.ctas[1].variant,
          external: copy.finalCta.ctas[1].external,
        },
        { label: copy.finalCta.ctas[2].label, href: newsletterHref, variant: copy.finalCta.ctas[2].variant },
      ],
      mediaKitDownload: { label: copy.finalCta.mediaKitDownload.label, href: pdf },
    },
  };
}
