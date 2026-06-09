export type QrGuideDeviceExpand = {
  title: string;
  steps: readonly string[];
};

export type QrGuideCopy = {
  eyebrow: string;
  backToMagazine: string;
  heroTitle: string;
  truthLine: string;
  trustNote: string;
  decisionPrompt: string;
  translationOptionsCta: string;
  cards: {
    printed: {
      title: string;
      steps: readonly string[];
      announcement: string;
    };
    desktop: {
      title: string;
      steps: readonly string[];
      captureNote: string;
      qrLabel: string;
      qrNote: string;
    };
    onPhone: {
      title: string;
      intro: string;
      steps: readonly string[];
      screenshotPlaceholder: string;
      htmlCompanionComing: string;
      openTextVersionLabel: string;
    };
    website: {
      title: string;
      intro: string;
      note: string;
      ctaLabel: string;
    };
  };
  deviceExpand: {
    apple: QrGuideDeviceExpand;
    android: QrGuideDeviceExpand;
  };
  websiteLangNote: string;
  summaryTitle: string;
  summaryNote: string;
  actionsEyebrow: string;
  actions: {
    openDigital: string;
    downloadPdf: string;
    mediaKit: string;
    contact: string;
  };
};

export type TranslatorPageCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  honestNote: string;
  desktopMessage: string;
  tryGoogleLens: string;
  tryGoogleTranslate: string;
  translateWebsite: string;
  websiteTranslateTitle: string;
  websiteTranslateBody: string;
  backToGuide: string;
  mobileScreenshotHint: string;
};
