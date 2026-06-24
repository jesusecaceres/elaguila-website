import type { MagazineReaderLangBundle } from "./types";

export const MAGAZINE_READER_EN: MagazineReaderLangBundle = {
  issueMeta: {
    title: "Leonix Media — June 2026 Magazine",
    monthLabel: "June",
  },
  ui: {
    languageEyebrow: "READING LANGUAGE",
    originalMagazineLabel: "Original Spanish magazine",
    languageChooserHint: "Choose a language to read the ads and key information.",
    readerPreviewBadge: "Translated reader preview",
    readerPreviewIntro:
      "This view summarizes ads, classifieds, and contact details in your language. The print and digital visual edition remains in Spanish.",
    futureFlipbookNote:
      "Full visual editions in English or Vietnamese will be separate files when available. Today, the original flipbook and PDF remain in Spanish.",
    originalEditionNote:
      "The original visual edition is in Spanish. This reader helps you understand the key information in your language.",
    originalEditionTitle: "Original visual edition (Spanish)",
    viewFlipbookSpanish: "View Spanish flipbook",
    downloadPdf: "Download original PDF",
    viewMediaKit: "View Media Kit",
    openFullReader: "Open full reader",
    backToMagazine: "Back to magazine",
    backToComingSoon: "Back to Coming Soon",
    readPageTitle: "Reader — June 2026",
    readPageSubtitle:
      "Key information from the June edition in Spanish, English, and Vietnamese. The original visual magazine remains in Spanish.",
    issuePageTitle: "June 2026 Edition",
    issuePageIntro:
      "Leonix Media’s launch edition connects local businesses, community, culture, and opportunities. Choose how to explore it.",
    issuePageReaderCta: "Open translated reader",
    issuePageHubCta: "Go to magazine hub",
    closeFlipbook: "Close",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
    printSourceBadge: "FROM PRINT · QR",
    printSourceTitle: "Welcome from the printed magazine",
    printSourceIntro:
      "You scanned the Leonix QR. This reader is the multilingual bridge: choose your language, read highlights and actions, then open the original visual edition when you want.",
    printSourceStepScan: "Scan the QR code from Leonix print or digital materials.",
    printSourceStepLanguage: "Choose your language on Leonix to read summaries and local business information.",
    printSourceStepHighlights: "Use summaries and CTAs in your language — the website is the multilingual bridge.",
    printSourceStepOriginal:
      "Open the original digital magazine (PDF/flipbook) when you want the Spanish visual edition.",
    printSourceMobileNote:
      "If you are already on your phone, do not scan your own screen. Use the language selector above and this reader.",
    printQrCaption: "Official QR · June 2026 · leonixmedia.com",
    openLanguageReader: "Open reader in your language",
    mediaKitPdfEsLabel: "Media Kit (original Spanish PDF)",
    mediaKitPdfEnLabel: "Media Kit (English PDF)",
  },
  sections: [
    {
      id: "about-leonix",
      title: "About Leonix Media",
      body: "Leonix Media connects local businesses with the Latino and multicultural Bay Area community through Spanish print advertising, bilingual digital presence, and tools that turn attention into calls, visits, and real connections.",
    },
    {
      id: "about-magazine",
      title: "About El Águila & the magazine",
      body: "Leonix Media is the premium magazine within the El Águila ecosystem: community, culture, and business in a digital and print edition. The June 2026 issue brings local stories, business ads, community inspiration, and bridges to the classifieds marketplace.",
      bullets: [
        "Premium print magazine designed for the local Latino community.",
        "Digital edition with flipbook and PDF in Spanish (original visual).",
        "Connection to classifieds, Local Businesses, and QR-driven actions.",
      ],
    },
    {
      id: "featured-ads",
      title: "Featured ads preview",
      body: "This edition includes advertising space for local businesses. Ads show category, main message, and the advertiser’s original contact information — no invented names or pricing in this reader view.",
      bullets: [
        "Restaurants & local food — menu, location, and advertiser contact.",
        "Professional services — plumbing, electrical, cleaning, and repairs.",
        "Health, beauty & wellness — clinics, dentists, and community services.",
        "Culture, sports, recipes, and community inspiration.",
      ],
    },
    {
      id: "classifieds",
      title: "Classifieds preview",
      body: "Leonix is not only advertising. The local marketplace connects the community with real opportunities: rentals, jobs, private autos, items for sale, events, food, pets, and more.",
      bullets: [
        "Rentals and housing in the Bay Area.",
        "Jobs and local employment opportunities.",
        "Private autos, items for sale, and community services.",
        "Wanted posts, pets, and local support.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explore classifieds",
    },
    {
      id: "local-business",
      title: "Local business profile preview",
      body: "Local Businesses organizes phone, address, map, social media, photos, and links in one digital presence. Business and contact data remain in their original form.",
      bullets: [
        "Business phone, address, and social — commercial data is not auto-translated.",
        "Map, calls, and messages from mobile.",
        "Photos, reviews, and important links in one place.",
      ],
    },
    {
      id: "qr-access",
      title: "Digital magazine & QR language access",
      body: "The magazine keeps its Spanish identity to serve our Latino community first. With QR, customers open the digital experience and can use device or browser translation tools when needed.",
      bullets: [
        "Scan from print ads to concrete actions on mobile.",
        "Browser translation, Google Lens, or Apple Translate when applicable.",
        "This structured reader complements — it does not replace — the Spanish visual flipbook.",
      ],
      ctaKey: "comingSoon",
      ctaLabel: "Learn about Leonix Media",
    },
    {
      id: "advertise",
      title: "Want to advertise?",
      body: "Connect your business with local readers through print magazine placement, digital edition visibility, and bilingual presence. Contact us for the Media Kit and launch options — no pricing or guarantees in this view.",
      ctaKey: "advertise",
      ctaLabel: "Advertise with us",
    },
    {
      id: "newsletter",
      title: "Join the newsletter",
      body: "Be among the first to receive new editions, important announcements, local opportunities, and Leonix Media updates.",
      ctaKey: "newsletter",
      ctaLabel: "Subscribe to the newsletter",
    },
    {
      id: "contact",
      title: "Contact / request more information",
      body: "We are ready to help with advertising, Media Kit, and digital presence. Business contact details remain in their original form.",
      bullets: [
        "Questions about print and digital magazine advertising.",
        "Media Kit and launch packages — request details via contact.",
        "Commercial information is not auto-translated in this view.",
      ],
      ctaKey: "contact",
      ctaLabel: "Contact Leonix Media",
    },
  ],
};
