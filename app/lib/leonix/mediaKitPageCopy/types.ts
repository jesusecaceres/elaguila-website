export type MediaKitOfferItem = {
  title: string;
  body: string;
};

export type MediaKitPageCopy = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    title: string;
    positioning: string;
    requestAdCta: string;
    downloadCta: string;
  };
  whatWeOffer: {
    eyebrow: string;
    headline: string;
    intro: string;
    items: MediaKitOfferItem[];
  };
  whyAdvertise: {
    eyebrow: string;
    headline: string;
    points: MediaKitOfferItem[];
  };
  packages: {
    eyebrow: string;
    headline: string;
    body: string;
    note: string;
  };
  downloads: {
    eyebrow: string;
    headline: string;
    honestyNote: string;
    esPdfLabel: string;
    enPdfLabel: string;
    downloadAction: string;
  };
  contactCta: {
    headline: string;
    body: string;
    primaryCta: string;
    mediaKitInterestCta: string;
  };
  googleTranslate: {
    question: string;
    body: string;
    cta: string;
  };
  backToComingSoon: string;
};
