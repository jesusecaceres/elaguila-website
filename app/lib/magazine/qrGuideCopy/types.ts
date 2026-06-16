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

export type DevicePathSectionCopy = {
  title: string;
  bestFor: string;
  steps: readonly string[];
  openLensCta: string;
  translateCta: string;
};

export type WebPathSectionCopy = {
  title: string;
  bestFor: string;
  steps: readonly string[];
  translateCta: string;
};

export type TranslatorPageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  honestNote: string;
  nativeFormsNote: string;
  deviceChoiceAndroid: string;
  deviceChoiceIphone: string;
  deviceChoiceWeb: string;
  lensWebFallback: string;
  appleTranslateFallback: string;
  android: DevicePathSectionCopy;
  iphone: DevicePathSectionCopy;
  web: WebPathSectionCopy;
  fullQrGuideCta: string;
};
