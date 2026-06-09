import type { QrGuideCopy } from "./types";

export const QR_GUIDE_EN: QrGuideCopy = {
  eyebrow: "QR guide · Translation",
  backToMagazine: "Back to magazine",
  heroTitle: "Translate the magazine",
  truthLine:
    "The visual magazine is in Spanish. Use your phone’s translation tools to read it in your language.",
  trustNote:
    "Leonix does not automatically translate the PDF or flipbook. Leonix gives you the guide, links, Media Kit, and contact actions.",
  decisionPrompt: "How are you reading the magazine?",
  translationOptionsCta: "View translation options",
  cards: {
    printed: {
      title: "Printed magazine",
      steps: [
        "Open your phone camera, Google Lens, Google Translate camera, or Apple Live Text.",
        "Point at the printed page.",
        "Tap Translate / choose your language.",
        "Return to Leonix for links, contact, Media Kit, and actions.",
      ],
      announcement:
        "When you pick up the printed magazine, you will be able to scan the QR code and use the same process described here.",
    },
    desktop: {
      title: "Digital magazine on desktop, tablet, or another screen",
      steps: [
        "Open Google Lens, Google Translate camera, or Apple Camera/Live Text on your phone.",
        "Point your phone at the magazine on this screen.",
        "Tap Translate and choose your language.",
        "Return to Leonix for links and actions.",
      ],
      captureNote:
        "On many phones, you can capture the translated text so you do not have to keep pointing your phone at the screen.",
      qrLabel: "Scan to reopen this guide",
      qrNote:
        "This QR reopens the Leonix guide on your phone — it does not automatically open a translation app.",
    },
    onPhone: {
      title: "Already on this phone",
      intro: "You cannot scan your own phone screen with the same phone.",
      steps: [
        "Take a screenshot of the magazine page.",
        "Open the screenshot in Google Photos, Google Lens, the Google app, or your phone’s image tools.",
        "Tap the Lens / Translate icon.",
        "Select or highlight the text with your finger if needed.",
        "Choose your language and read the translation.",
      ],
      screenshotPlaceholder:
        "Coming soon: example image of the Lens screenshot selection flow.",
      htmlCompanionComing:
        "Coming next: open a text version for an easier mobile reading path.",
      openTextVersionLabel: "Open text version (coming soon)",
    },
    website: {
      title: "Translate the Leonix website",
      intro: "Want to browse Leonix in another language?",
      note: "Use Google Translate website mode to explore Leonix. This helps browse the site — it does not guarantee translating PDF/flipbook images. Forms and CTAs should use native Leonix pages in your language.",
      ctaLabel: "Translate Leonix site (Google)",
    },
  },
  deviceExpand: {
    apple: {
      title: "iPhone / Apple",
      steps: [
        "Open Camera and point at the magazine text.",
        "Tap the Live Text icon when it appears, then Translate.",
        "Or open Photos → select a screenshot → tap Translate.",
        "The interface may vary by iOS version.",
      ],
    },
    android: {
      title: "Android / Google",
      steps: [
        "Open Google Lens, the Google app, or Google Translate camera.",
        "Tap the Lens icon in search, camera, or gallery.",
        "Point at the page or open a screenshot.",
        "Highlight text with your finger if needed and choose your language.",
      ],
    },
  },
  websiteLangNote:
    "The 🌐 Languages selector helps the Leonix website — it does not translate the visual magazine.",
  summaryTitle: "Leonix quick summary",
  summaryNote:
    "This summary helps, but the original visual magazine remains in Spanish.",
  actionsEyebrow: "Leonix actions",
  actions: {
    openDigital: "Open original digital magazine",
    downloadPdf: "Download original PDF",
    mediaKit: "View Media Kit",
    contact: "Contact Leonix",
  },
};
