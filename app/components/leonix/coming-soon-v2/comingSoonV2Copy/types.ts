import type { SupportedLang } from "@/app/lib/language";

export type NavItem = { label: string; href: string; active?: boolean };

export type HeroAccent = "burgundy" | "gold";

export type HeroLinePart = { text: string; accent?: HeroAccent };

export type HeroLine = { parts: HeroLinePart[] };

export type HeroCta = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "green";
  external?: boolean;
};

export type WhatYouGetCardAccent = "burgundy" | "gold" | "green" | "qr" | "founder";

export type WhatYouGetCard = {
  title: string;
  body: string;
  detail: string;
  accent: WhatYouGetCardAccent;
};

export type ProcessStep = { title: string; body: string };

export type QrBenefitCard = { title: string; body: string };

export type MediaKitPreviewCard = { title: string; body: string };

export type MarketplaceCategoryCard = { title: string; body: string };

export type ComingSoonV2Copy = {
  nav: NavItem[];
  launchCta: string;
  brandName: string;
  langToggle: { es: string; en: string };
  mainAria: string;
  navAria: string;
  langAria: string;
  hero: {
    badge: string;
    title: string;
    valueLines: [HeroLine, HeroLine, HeroLine];
    paragraph: string;
    ctas: [HeroCta, HeroCta, HeroCta];
    trustChips: [string, string, string];
    valueAria: string;
    trustAria: string;
    mediaVisual: {
      label: string;
      qrOverlay: string;
      magazineAlt: string;
    };
    magazineCta: string;
  };
  marketplace: {
    eyebrow: string;
    headline: string;
    intro: string;
    bridge: string;
    cards: [
      MarketplaceCategoryCard,
      MarketplaceCategoryCard,
      MarketplaceCategoryCard,
      MarketplaceCategoryCard,
      MarketplaceCategoryCard,
      MarketplaceCategoryCard,
    ];
    cardsAria: string;
    closing: string;
    exploreCta: { label: string; href: string };
  };
  whatYouGet: {
    eyebrow: string;
    headline: string;
    intro: string;
    expandMore: string;
    expandLess: string;
    cards: [
      WhatYouGetCard,
      WhatYouGetCard,
      WhatYouGetCard,
      WhatYouGetCard,
      WhatYouGetCard,
    ];
  };
  howItWorks: {
    eyebrow: string;
    headline: string;
    intro: string;
    steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep];
    stepsAria: string;
  };
  qrAccess: {
    eyebrow: string;
    headline: string;
    intro: string;
    callout: string;
    explanation: string;
    mobileNote: string;
    openReaderLabel: string;
    benefits: [QrBenefitCard, QrBenefitCard, QrBenefitCard];
    benefitsAria: string;
  };
  mediaKitPreview: {
    eyebrow: string;
    headline: string;
    intro: string;
    pdfHonestyLine: string;
    cards: [
      MediaKitPreviewCard,
      MediaKitPreviewCard,
      MediaKitPreviewCard,
      MediaKitPreviewCard,
    ];
    cardsAria: string;
    ctaHeading: string;
    viewCta: { label: string; href: string };
    downloadCta: { label: string; href: string };
    requestInfoCta: { label: string; href: string };
    supportingLine: string;
  };
  digitalMagazine: {
    eyebrow: string;
    headline: string;
    intro: string;
    visualNote: string;
    highlightsNote: string;
    mobileNote: string;
    readHighlightsCta: { label: string; href: string };
    openOriginalCta: { label: string; href: string };
    learnQrCta: { label: string; href: string };
  };
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    ctas: [HeroCta, HeroCta, HeroCta];
    mediaKitDownload: { label: string; href: string };
  };
  contact: {
    title: string;
    body: string;
    emailLabel: string;
    email: string;
    phoneLabel: string;
    phone: string;
    phoneHref: string;
    addressLabel: string;
    address: string;
    areaLabel: string;
    area: string;
  };
  newsletter: {
    title: string;
    body: string;
    placeholder: string;
    button: string;
    formAria: string;
    emailLabel: string;
  };
  footer: string;
};

export type ComingSoonV2CopyLang = SupportedLang;
